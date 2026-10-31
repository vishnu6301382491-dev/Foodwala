package com.tap.service;

import java.io.File;
import java.io.FileInputStream;
import java.io.InputStream;
import java.net.URI;
import java.net.URLEncoder;
import java.net.http.HttpClient;
import java.net.http.HttpRequest;
import java.net.http.HttpResponse;
import java.nio.charset.StandardCharsets;
import java.time.Duration;
import java.util.Base64;
import java.util.Properties;
import java.util.regex.Matcher;
import java.util.regex.Pattern;

/**
 * FoodWala SMS Service (Java EE)
 * Modular SMS provider support: Fast2SMS, 2Factor (India), Twilio, MSG91, and Console (Dev Mode).
 * Loads configuration from Environment Variables, System Properties, or sms.properties.
 */
public class SMSService {

    public static class SMSResult {
        public final boolean success;
        public final boolean isDevMode;
        public final String provider;
        public final String messageId;
        public final String errorMessage;
        public final int statusCode;

        private SMSResult(boolean success, boolean isDevMode, String provider, String messageId, String errorMessage, int statusCode) {
            this.success = success;
            this.isDevMode = isDevMode;
            this.provider = provider;
            this.messageId = messageId;
            this.errorMessage = errorMessage;
            this.statusCode = statusCode;
        }

        public static SMSResult success(String provider, String messageId) {
            return new SMSResult(true, false, provider, messageId, null, 200);
        }

        public static SMSResult devSuccess(String provider) {
            return new SMSResult(true, true, provider, "dev_" + System.currentTimeMillis(), null, 200);
        }

        public static SMSResult failure(String provider, String errorMessage, int statusCode) {
            return new SMSResult(false, false, provider, null, errorMessage, statusCode);
        }
    }

    private static final SMSService INSTANCE = new SMSService();
    private final Properties fileConfig = new Properties();

    private SMSService() {
        loadPropertiesFile();
    }

    public static SMSService getInstance() {
        return INSTANCE;
    }

    private void loadPropertiesFile() {
        // 1. Try loading from classpath
        try (InputStream is = getClass().getClassLoader().getResourceAsStream("sms.properties")) {
            if (is != null) {
                fileConfig.clear();
                fileConfig.load(is);
                System.out.println("[FoodWala SMS Service] Loaded configuration from classpath: sms.properties");
                return;
            }
        } catch (Exception e) {}

        // 2. Try loading from common file locations
        String[] potentialPaths = {
            "sms.properties",
            "src/main/resources/sms.properties",
            "WEB-INF/classes/sms.properties",
            "src/main/webapp/WEB-INF/classes/sms.properties",
            "D:/FoodWala_Eclipse_Project/sms.properties",
            "D:/FoodWala_Eclipse_Project/src/main/webapp/WEB-INF/classes/sms.properties"
        };

        for (String p : potentialPaths) {
            File f = new File(p);
            if (f.exists()) {
                try (FileInputStream fis = new FileInputStream(f)) {
                    fileConfig.clear();
                    fileConfig.load(fis);
                    System.out.println("[FoodWala SMS Service] Loaded configuration from file: " + f.getAbsolutePath());
                    return;
                } catch (Exception e) {}
            }
        }
    }

    private static String sanitize(String val) {
        if (val == null) return null;
        val = val.trim();
        if ((val.startsWith("\"") && val.endsWith("\"")) || (val.startsWith("'") && val.endsWith("'"))) {
            val = val.substring(1, val.length() - 1).trim();
        }
        return val.isEmpty() ? null : val;
    }

    public String getConfig(String key) {
        // 1. System property (e.g. -DSMS_PROVIDER=fast2sms)
        String val = System.getProperty(key);
        if (val != null && !val.isBlank()) return sanitize(val);

        // 2. Environment variable
        val = System.getenv(key);
        if (val != null && !val.isBlank()) return sanitize(val);

        // 3. Properties file (Reload to support live updates)
        loadPropertiesFile();
        val = fileConfig.getProperty(key);
        if (val != null && !val.isBlank()) return sanitize(val);

        return null;
    }

    public String getProvider() {
        String p = getConfig("SMS_PROVIDER");
        if (p != null && !p.isBlank()) return p.toLowerCase();
        
        // Auto-detect provider if specific API keys are present
        if (getConfig("FAST2SMS_API_KEY") != null && !getConfig("FAST2SMS_API_KEY").isBlank()) return "fast2sms";
        if (getConfig("TWO_FACTOR_API_KEY") != null && !getConfig("TWO_FACTOR_API_KEY").isBlank()) return "2factor";
        if (getConfig("TWILIO_ACCOUNT_SID") != null && !getConfig("TWILIO_ACCOUNT_SID").isBlank()) return "twilio";
        if (getConfig("MSG91_AUTH_KEY") != null && !getConfig("MSG91_AUTH_KEY").isBlank()) return "msg91";

        return "console";
    }

    public boolean isDevMode() {
        String dev = getConfig("OTP_DEV_MODE");
        if (dev != null) {
            return "true".equalsIgnoreCase(dev);
        }
        // If provider is console or not configured, default to dev mode
        return "console".equalsIgnoreCase(getProvider());
    }

    /**
     * Send OTP to normalized phone number (+91XXXXXXXXXX)
     */
    public SMSResult sendOtp(String phone, String otp) {
        String provider = getProvider();
        boolean devMode = isDevMode();

        System.out.println("--------------------------------------------------");
        System.out.println("[FoodWala OTP] Request received");
        System.out.println("[FoodWala OTP] Mobile validated: " + phone);
        System.out.println("[FoodWala OTP] Active Provider: " + provider);
        System.out.println("[FoodWala OTP] Mode: " + (devMode ? "DEVELOPMENT (Console Mode)" : "PRODUCTION (Live SMS Gateway)"));

        // If in development mode or provider is 'console'
        if (devMode || "console".equals(provider)) {
            System.out.println("==================================================");
            System.out.println("[FoodWala OTP] Development OTP: " + otp);
            System.out.println("[FoodWala OTP] Recipient: " + phone);
            System.out.println("[FoodWala OTP] Expiration: 5 minutes");
            System.out.println("[FoodWala OTP] Notice: Console mode active (No real carrier SMS sent).");
            System.out.println("[FoodWala OTP] To send real SMS to your phone, configure FAST2SMS_API_KEY in sms.properties.");
            System.out.println("==================================================");
            return SMSResult.devSuccess("console");
        }

        // Live Production Delivery via Gateway
        try {
            switch (provider) {
                case "fast2sms":
                    return sendFast2SMS(phone, otp);
                case "2factor":
                    return send2Factor(phone, otp);
                case "twilio":
                    return sendTwilio(phone, otp);
                case "msg91":
                    return sendMsg91(phone, otp);
                default:
                    System.err.println("[FoodWala OTP] Unknown SMS provider: " + provider);
                    return SMSResult.failure(provider, "Unknown SMS provider configured: " + provider, 400);
            }
        } catch (Exception e) {
            System.err.println("[FoodWala OTP] SMS delivery FAILED with exception: " + e.getMessage());
            e.printStackTrace();
            return SMSResult.failure(provider, "SMS gateway error: " + e.getMessage(), 500);
        }
    }

    /**
     * Fast2SMS India OTP Gateway Integration
     * Uses Fast2SMS API with the 'authorization' header for both GET and POST requests.
     * Supports route=otp and route=q (Quick SMS).
     */
    private SMSResult sendFast2SMS(String phone, String otp) throws Exception {
        String apiKey = getConfig("FAST2SMS_API_KEY");
        if (apiKey == null || apiKey.isBlank() || apiKey.contains("YOUR_FAST2SMS_API_KEY_HERE")) {
            String err = "Fast2SMS API Key missing. Please replace 'YOUR_FAST2SMS_API_KEY_HERE' in sms.properties with your real key from https://www.fast2sms.com/dev/api";
            System.err.println("[FoodWala OTP] " + err);
            return SMSResult.failure("fast2sms", err, 401);
        }

        String raw10 = phone.replaceAll("[^0-9]", "");
        if (raw10.length() > 10) raw10 = raw10.substring(raw10.length() - 10);

        System.out.println("[FoodWala OTP] Calling SMS provider: Fast2SMS (To: " + raw10 + ")");

        HttpClient client = HttpClient.newBuilder()
                .connectTimeout(Duration.ofSeconds(12))
                .build();

        String lastError = null;
        String otpRouteError = null;

        // Method 0: If FAST2SMS_OTP_ID is configured, use official Smart OTP API (/dev/otp/send)
        String otpId = getConfig("FAST2SMS_OTP_ID");
        if (otpId != null && !otpId.isBlank()) {
            try {
                System.out.println("[FoodWala OTP] Trying Fast2SMS Smart OTP /dev/otp/send (otp_id: " + otpId + ")...");
                String smartPayload = "{\"mobile\":\"" + raw10 + "\",\"otp_id\":\"" + otpId.trim() + "\",\"otp\":\"" + otp + "\"}";
                HttpRequest smartReq = HttpRequest.newBuilder()
                        .uri(URI.create("https://www.fast2sms.com/dev/otp/send"))
                        .header("authorization", apiKey)
                        .header("Content-Type", "application/json")
                        .header("Accept", "application/json")
                        .header("cache-control", "no-cache")
                        .POST(HttpRequest.BodyPublishers.ofString(smartPayload))
                        .build();

                HttpResponse<String> smartRes = client.send(smartReq, HttpResponse.BodyHandlers.ofString());
                int smartStatus = smartRes.statusCode();
                String smartResBody = smartRes.body();

                System.out.println("[FoodWala OTP] Fast2SMS Smart OTP status: " + smartStatus);
                System.out.println("[FoodWala OTP] Fast2SMS Smart OTP response: " + smartResBody);

                if (smartStatus >= 200 && smartStatus < 300 && smartResBody != null && smartResBody.contains("\"return\":true")) {
                    String reqId = extractJsonValue(smartResBody, "request_id");
                    System.out.println("[FoodWala OTP] Fast2SMS Smart OTP accepted. Request ID: " + reqId);
                    System.out.println("[FoodWala OTP] OTP delivery successful -> Real SMS dispatched to mobile!");
                    return SMSResult.success("fast2sms", reqId != null ? reqId : "fast2sms_smart_" + System.currentTimeMillis());
                } else if (smartResBody != null) {
                    lastError = extractFast2SMSError(smartResBody);
                }
            } catch (Exception e) {
                System.err.println("[FoodWala OTP] Fast2SMS Smart OTP error: " + e.getMessage());
                lastError = e.getMessage();
            }
        }

        // Method 1: POST to /dev/bulkV2 with header 'authorization' (route=otp)
        try {
            String jsonPayload = "{\"route\":\"otp\",\"variables_values\":\"" + otp + "\",\"numbers\":\"" + raw10 + "\"}";
            HttpRequest postOtpReq = HttpRequest.newBuilder()
                    .uri(URI.create("https://www.fast2sms.com/dev/bulkV2"))
                    .header("authorization", apiKey)
                    .header("Content-Type", "application/json")
                    .header("Accept", "application/json")
                    .header("cache-control", "no-cache")
                    .POST(HttpRequest.BodyPublishers.ofString(jsonPayload))
                    .build();

            HttpResponse<String> postRes = client.send(postOtpReq, HttpResponse.BodyHandlers.ofString());
            int status = postRes.statusCode();
            String resBody = postRes.body();

            System.out.println("[FoodWala OTP] Fast2SMS POST route=otp status: " + status);
            System.out.println("[FoodWala OTP] Fast2SMS POST route=otp response: " + resBody);

            if (status >= 200 && status < 300 && resBody != null && resBody.contains("\"return\":true")) {
                String reqId = extractJsonValue(resBody, "request_id");
                System.out.println("[FoodWala OTP] Fast2SMS accepted OTP. Request ID: " + reqId);
                System.out.println("[FoodWala OTP] OTP delivery successful -> Real SMS dispatched to mobile!");
                return SMSResult.success("fast2sms", reqId != null ? reqId : "fast2sms_" + System.currentTimeMillis());
            } else if (resBody != null) {
                otpRouteError = extractFast2SMSError(resBody);
                lastError = otpRouteError;
            }
        } catch (Exception e) {
            System.err.println("[FoodWala OTP] Fast2SMS POST route=otp error: " + e.getMessage());
            lastError = e.getMessage();
        }

        // Method 2: POST to /dev/bulkV2 with header 'authorization' (route=q Quick SMS)
        try {
            System.out.println("[FoodWala OTP] Trying Fast2SMS route=q POST...");
            String msg = "Your FoodWala verification code is " + otp + ". Valid for 5 minutes.";
            String qPayload = "{\"route\":\"q\",\"message\":\"" + msg + "\",\"language\":\"english\",\"flash\":0,\"numbers\":\"" + raw10 + "\"}";

            HttpRequest postQReq = HttpRequest.newBuilder()
                    .uri(URI.create("https://www.fast2sms.com/dev/bulkV2"))
                    .header("authorization", apiKey)
                    .header("Content-Type", "application/json")
                    .header("Accept", "application/json")
                    .header("cache-control", "no-cache")
                    .POST(HttpRequest.BodyPublishers.ofString(qPayload))
                    .build();

            HttpResponse<String> qRes = client.send(postQReq, HttpResponse.BodyHandlers.ofString());
            int qStatus = qRes.statusCode();
            String qResBody = qRes.body();

            System.out.println("[FoodWala OTP] Fast2SMS POST route=q status: " + qStatus);
            System.out.println("[FoodWala OTP] Fast2SMS POST route=q response: " + qResBody);

            if (qStatus >= 200 && qStatus < 300 && qResBody != null && qResBody.contains("\"return\":true")) {
                String reqId = extractJsonValue(qResBody, "request_id");
                System.out.println("[FoodWala OTP] Fast2SMS accepted OTP via route=q. Request ID: " + reqId);
                System.out.println("[FoodWala OTP] OTP delivery successful -> Real SMS dispatched to mobile!");
                return SMSResult.success("fast2sms", reqId != null ? reqId : "fast2sms_" + System.currentTimeMillis());
            } else if (qResBody != null) {
                lastError = extractFast2SMSError(qResBody);
            }
        } catch (Exception e) {
            System.err.println("[FoodWala OTP] Fast2SMS POST route=q error: " + e.getMessage());
            lastError = e.getMessage();
        }

        // Method 3: GET to /dev/bulkV2 with header 'authorization' (as specified in Fast2SMS documentation)
        try {
            System.out.println("[FoodWala OTP] Trying Fast2SMS GET request with authorization header...");
            String encodedMsg = URLEncoder.encode("Your FoodWala verification code is " + otp + ". Valid for 5 minutes.", StandardCharsets.UTF_8);
            String getUrl = "https://www.fast2sms.com/dev/bulkV2?route=q&message=" + encodedMsg + "&numbers=" + raw10;

            HttpRequest getReq = HttpRequest.newBuilder()
                    .uri(URI.create(getUrl))
                    .header("authorization", apiKey)
                    .header("Accept", "application/json")
                    .header("cache-control", "no-cache")
                    .GET()
                    .build();

            HttpResponse<String> getRes = client.send(getReq, HttpResponse.BodyHandlers.ofString());
            int getStatus = getRes.statusCode();
            String getResBody = getRes.body();

            System.out.println("[FoodWala OTP] Fast2SMS GET status: " + getStatus);
            System.out.println("[FoodWala OTP] Fast2SMS GET response: " + getResBody);

            if (getStatus >= 200 && getStatus < 300 && getResBody != null && getResBody.contains("\"return\":true")) {
                String reqId = extractJsonValue(getResBody, "request_id");
                System.out.println("[FoodWala OTP] Fast2SMS accepted OTP via GET. Request ID: " + reqId);
                System.out.println("[FoodWala OTP] OTP delivery successful -> Real SMS dispatched to mobile!");
                return SMSResult.success("fast2sms", reqId != null ? reqId : "fast2sms_" + System.currentTimeMillis());
            } else if (getResBody != null) {
                lastError = extractFast2SMSError(getResBody);
            }
        } catch (Exception e) {
            System.err.println("[FoodWala OTP] Fast2SMS GET error: " + e.getMessage());
            lastError = e.getMessage();
        }

        // Method 4: GET with authorization query parameter fallback
        try {
            System.out.println("[FoodWala OTP] Trying Fast2SMS GET parameter fallback...");
            String encodedMsg = URLEncoder.encode("Your FoodWala verification code is " + otp + ". Valid for 5 minutes.", StandardCharsets.UTF_8);
            String getUrlParam = "https://www.fast2sms.com/dev/bulkV2?authorization=" + URLEncoder.encode(apiKey, StandardCharsets.UTF_8)
                    + "&route=q&message=" + encodedMsg + "&language=english&flash=0&numbers=" + raw10;

            HttpRequest getParamReq = HttpRequest.newBuilder()
                    .uri(URI.create(getUrlParam))
                    .header("Accept", "application/json")
                    .header("cache-control", "no-cache")
                    .GET()
                    .build();

            HttpResponse<String> getParamRes = client.send(getParamReq, HttpResponse.BodyHandlers.ofString());
            int getParamStatus = getParamRes.statusCode();
            String getParamResBody = getParamRes.body();

            System.out.println("[FoodWala OTP] Fast2SMS GET fallback status: " + getParamStatus);
            System.out.println("[FoodWala OTP] Fast2SMS GET fallback response: " + getParamResBody);

            if (getParamStatus >= 200 && getParamStatus < 300 && getParamResBody != null && getParamResBody.contains("\"return\":true")) {
                String reqId = extractJsonValue(getParamResBody, "request_id");
                System.out.println("[FoodWala OTP] Fast2SMS accepted OTP via GET fallback. Request ID: " + reqId);
                System.out.println("[FoodWala OTP] OTP delivery successful -> Real SMS dispatched to mobile!");
                return SMSResult.success("fast2sms", reqId != null ? reqId : "fast2sms_" + System.currentTimeMillis());
            } else if (getParamResBody != null) {
                lastError = extractFast2SMSError(getParamResBody);
            }
        } catch (Exception e) {
            System.err.println("[FoodWala OTP] Fast2SMS GET fallback error: " + e.getMessage());
        }

        String diagnosticAdvice = "";
        if (otpRouteError != null && otpRouteError.contains("website verification")) {
            diagnosticAdvice = " (Fast2SMS Code 996: Complete Website & Aadhaar KYC Verification on fast2sms.com to activate automated OTP API)";
        } else if (lastError != null && lastError.contains("100 INR")) {
            diagnosticAdvice = " (Fast2SMS Code 999: Account requires a minimum 100 INR transaction on fast2sms.com to enable API route)";
        }

        String fullErr = "Fast2SMS Error: " + (lastError != null ? lastError : "Unable to deliver SMS through Fast2SMS") + diagnosticAdvice;
        System.err.println("[FoodWala OTP] SMS delivery FAILED. Error: " + fullErr);
        return SMSResult.failure("fast2sms", fullErr, 400);
    }

    private static String extractFast2SMSError(String json) {
        if (json == null) return "Unknown error";
        // Extract message from array ["..."] or string "..."
        Pattern arrayPat = Pattern.compile("\"message\"\\s*:\\s*\\[?\\s*\"([^\"]+)\"");
        Matcher m = arrayPat.matcher(json);
        if (m.find()) {
            return m.group(1);
        }
        return extractJsonValue(json, "message");
    }

    /**
     * 2Factor India SMS Integration (Specialized transactional OTP API for Indian numbers)
     */
    private SMSResult send2Factor(String phone, String otp) throws Exception {
        String apiKey = getConfig("TWO_FACTOR_API_KEY");
        if (apiKey == null || apiKey.isBlank() || apiKey.contains("YOUR_")) {
            String err = "2Factor API Key missing. Please set TWO_FACTOR_API_KEY in sms.properties.";
            System.err.println("[FoodWala OTP] " + err);
            return SMSResult.failure("2factor", err, 401);
        }

        String cleanPhone = phone.replaceAll("[^0-9]", "");
        if (cleanPhone.length() > 10) cleanPhone = cleanPhone.substring(cleanPhone.length() - 10);

        System.out.println("[FoodWala OTP] Calling SMS provider: 2Factor (To: " + cleanPhone + ")");

        HttpClient client = HttpClient.newBuilder().connectTimeout(Duration.ofSeconds(12)).build();

        // 1. Try 2Factor with custom template name / default route
        String uri = "https://2factor.in/API/V1/" + URLEncoder.encode(apiKey, StandardCharsets.UTF_8)
                + "/SMS/" + URLEncoder.encode(cleanPhone, StandardCharsets.UTF_8)
                + "/" + URLEncoder.encode(otp, StandardCharsets.UTF_8);

        HttpRequest request = HttpRequest.newBuilder()
                .uri(URI.create(uri))
                .header("Accept", "application/json")
                .GET()
                .build();

        HttpResponse<String> response = client.send(request, HttpResponse.BodyHandlers.ofString());
        int status = response.statusCode();
        String responseBody = response.body();

        System.out.println("[FoodWala OTP] 2Factor response status: " + status);
        System.out.println("[FoodWala OTP] 2Factor raw response: " + responseBody);

        if (status == 200 && responseBody != null && responseBody.contains("\"Status\":\"Success\"")) {
            String details = extractJsonValue(responseBody, "Details");
            System.out.println("[FoodWala OTP] SMS provider message: 2Factor Session ID: " + details);
            System.out.println("[FoodWala OTP] OTP delivery successful -> Real SMS dispatched to mobile!");
            return SMSResult.success("2factor", details);
        }

        // 2. Try with OTP1 template if default returned template mismatch
        String uriFallback = "https://2factor.in/API/V1/" + URLEncoder.encode(apiKey, StandardCharsets.UTF_8)
                + "/SMS/" + URLEncoder.encode(cleanPhone, StandardCharsets.UTF_8)
                + "/" + URLEncoder.encode(otp, StandardCharsets.UTF_8) + "/OTP1";

        HttpRequest fbRequest = HttpRequest.newBuilder()
                .uri(URI.create(uriFallback))
                .header("Accept", "application/json")
                .GET()
                .build();

        HttpResponse<String> fbResponse = client.send(fbRequest, HttpResponse.BodyHandlers.ofString());
        int fbStatus = fbResponse.statusCode();
        String fbResponseBody = fbResponse.body();

        System.out.println("[FoodWala OTP] 2Factor fallback response status: " + fbStatus);
        System.out.println("[FoodWala OTP] 2Factor fallback raw response: " + fbResponseBody);

        if (fbStatus == 200 && fbResponseBody != null && fbResponseBody.contains("\"Status\":\"Success\"")) {
            String details = extractJsonValue(fbResponseBody, "Details");
            System.out.println("[FoodWala OTP] SMS provider message: 2Factor Session ID: " + details);
            System.out.println("[FoodWala OTP] OTP delivery successful -> Real SMS dispatched to mobile!");
            return SMSResult.success("2factor", details);
        }

        String details = extractJsonValue(responseBody, "Details");
        if (details == null || details.isBlank()) details = extractJsonValue(fbResponseBody, "Details");
        String fullErr = "2Factor Error: " + (details != null ? details : responseBody);
        System.err.println("[FoodWala OTP] SMS delivery FAILED. Status: " + status + ", Error: " + fullErr);
        return SMSResult.failure("2factor", fullErr, status != 200 ? status : 400);
    }

    /**
     * Twilio SMS Integration
     */
    private SMSResult sendTwilio(String phone, String otp) throws Exception {
        String accountSid = getConfig("TWILIO_ACCOUNT_SID");
        String authToken = getConfig("TWILIO_AUTH_TOKEN");
        String fromPhone = getConfig("TWILIO_PHONE_NUMBER");

        if (accountSid == null || authToken == null || fromPhone == null) {
            String err = "Twilio credentials incomplete. Ensure TWILIO_ACCOUNT_SID, TWILIO_AUTH_TOKEN, and TWILIO_PHONE_NUMBER are configured in sms.properties.";
            System.err.println("[FoodWala OTP] " + err);
            return SMSResult.failure("twilio", err, 401);
        }

        System.out.println("[FoodWala OTP] Calling SMS provider: Twilio (From: " + fromPhone + " -> To: " + phone + ")");

        HttpClient client = HttpClient.newBuilder().connectTimeout(Duration.ofSeconds(12)).build();
        String body = "Your FoodWala verification code is " + otp + ". Valid for 5 minutes. Do not share this code.";
        String formData = "To=" + URLEncoder.encode(phone, StandardCharsets.UTF_8)
                + "&From=" + URLEncoder.encode(fromPhone, StandardCharsets.UTF_8)
                + "&Body=" + URLEncoder.encode(body, StandardCharsets.UTF_8);

        String auth = Base64.getEncoder().encodeToString((accountSid + ":" + authToken).getBytes(StandardCharsets.UTF_8));

        HttpRequest request = HttpRequest.newBuilder()
                .uri(URI.create("https://api.twilio.com/2010-04-01/Accounts/" + accountSid + "/Messages.json"))
                .header("Authorization", "Basic " + auth)
                .header("Content-Type", "application/x-www-form-urlencoded")
                .header("Accept", "application/json")
                .POST(HttpRequest.BodyPublishers.ofString(formData))
                .build();

        HttpResponse<String> response = client.send(request, HttpResponse.BodyHandlers.ofString());
        int status = response.statusCode();
        String responseBody = response.body();

        System.out.println("[FoodWala OTP] Provider response status: " + status);
        System.out.println("[FoodWala OTP] Provider raw response: " + responseBody);

        if (status >= 200 && status < 300) {
            String sid = extractJsonValue(responseBody, "sid");
            System.out.println("[FoodWala OTP] SMS provider message: Message accepted by Twilio. SID: " + sid);
            System.out.println("[FoodWala OTP] OTP delivery successful -> Real SMS dispatched to mobile!");
            return SMSResult.success("twilio", sid);
        } else {
            String message = extractJsonValue(responseBody, "message");
            String code = extractJsonValue(responseBody, "code");
            String fullErr = (message != null ? message : "Twilio rejected request") + (code != null ? " (Twilio Error Code: " + code + ")" : "");
            System.err.println("[FoodWala OTP] SMS delivery FAILED. Status: " + status + ", Error: " + fullErr);
            return SMSResult.failure("twilio", fullErr, status);
        }
    }

    /**
     * MSG91 India OTP Integration
     */
    private SMSResult sendMsg91(String phone, String otp) throws Exception {
        String authKey = getConfig("MSG91_AUTH_KEY");
        String templateId = getConfig("MSG91_TEMPLATE_ID");

        if (authKey == null || templateId == null) {
            String err = "MSG91 credentials incomplete. Ensure MSG91_AUTH_KEY and MSG91_TEMPLATE_ID are configured in sms.properties.";
            System.err.println("[FoodWala OTP] " + err);
            return SMSResult.failure("msg91", err, 401);
        }

        String rawPhone = phone.replace("+", "").replaceAll("[^0-9]", "");
        System.out.println("[FoodWala OTP] Calling SMS provider: MSG91 (To: " + rawPhone + ")");

        HttpClient client = HttpClient.newBuilder().connectTimeout(Duration.ofSeconds(12)).build();
        String payload = "{\"template_id\":\"" + templateId + "\",\"mobile\":\"" + rawPhone + "\",\"otp\":\"" + otp + "\"}";

        HttpRequest request = HttpRequest.newBuilder()
                .uri(URI.create("https://control.msg91.com/api/v5/otp"))
                .header("authkey", authKey)
                .header("Content-Type", "application/json")
                .header("Accept", "application/json")
                .POST(HttpRequest.BodyPublishers.ofString(payload))
                .build();

        HttpResponse<String> response = client.send(request, HttpResponse.BodyHandlers.ofString());
        int status = response.statusCode();
        String responseBody = response.body();

        System.out.println("[FoodWala OTP] Provider response status: " + status);
        System.out.println("[FoodWala OTP] Provider raw response: " + responseBody);

        if (status >= 200 && status < 300 && responseBody != null && responseBody.contains("\"type\":\"success\"")) {
            System.out.println("[FoodWala OTP] SMS provider message: MSG91 OTP dispatched successfully.");
            System.out.println("[FoodWala OTP] OTP delivery successful -> Real SMS dispatched to mobile!");
            return SMSResult.success("msg91", "msg91_" + System.currentTimeMillis());
        } else {
            String message = extractJsonValue(responseBody, "message");
            String fullErr = "MSG91 Error: " + (message != null ? message : responseBody);
            System.err.println("[FoodWala OTP] SMS delivery FAILED. Status: " + status + ", Error: " + fullErr);
            return SMSResult.failure("msg91", fullErr, status >= 400 ? status : 400);
        }
    }

    /**
     * Resend OTP via Fast2SMS Smart OTP Resend API (/dev/otp/resend)
     * Allowed within a 10-minute window and capped at 5 attempts.
     */
    public SMSResult resendFast2SMS(String phone) {
        if (isDevMode()) {
            System.out.println("[FoodWala OTP] Resend OTP in dev mode for: " + phone);
            return SMSResult.devSuccess("console");
        }

        String apiKey = getConfig("FAST2SMS_API_KEY");
        if (apiKey == null || apiKey.isBlank()) {
            return SMSResult.failure("fast2sms", "FAST2SMS_API_KEY missing", 401);
        }

        String raw10 = phone.replaceAll("[^0-9]", "");
        if (raw10.length() > 10) raw10 = raw10.substring(raw10.length() - 10);

        try {
            HttpClient client = HttpClient.newBuilder().connectTimeout(Duration.ofSeconds(12)).build();
            String payload = "{\"mobile\":\"" + raw10 + "\"}";
            HttpRequest req = HttpRequest.newBuilder()
                    .uri(URI.create("https://www.fast2sms.com/dev/otp/resend"))
                    .header("authorization", apiKey)
                    .header("Content-Type", "application/json")
                    .header("Accept", "application/json")
                    .header("cache-control", "no-cache")
                    .POST(HttpRequest.BodyPublishers.ofString(payload))
                    .build();

            HttpResponse<String> res = client.send(req, HttpResponse.BodyHandlers.ofString());
            int status = res.statusCode();
            String resBody = res.body();

            if (status >= 200 && status < 300 && resBody != null && resBody.contains("\"return\":true")) {
                String reqId = extractJsonValue(resBody, "request_id");
                return SMSResult.success("fast2sms", reqId != null ? reqId : "fast2sms_resend_" + System.currentTimeMillis());
            } else {
                String err = extractFast2SMSError(resBody);
                return SMSResult.failure("fast2sms", "Fast2SMS Resend Error: " + err, status >= 400 ? status : 400);
            }
        } catch (Exception e) {
            return SMSResult.failure("fast2sms", "Fast2SMS Resend exception: " + e.getMessage(), 500);
        }
    }

    private static String extractJsonValue(String json, String key) {
        if (json == null) return null;
        Pattern p = Pattern.compile("\"" + Pattern.quote(key) + "\"\\s*:\\s*\"?([^\"\\},]+)\"?");
        Matcher m = p.matcher(json);
        if (m.find()) {
            return m.group(1).trim();
        }
        return null;
    }
}
