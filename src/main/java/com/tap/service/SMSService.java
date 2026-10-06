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
 * Modular SMS provider support: Twilio, 2Factor (India), MSG91, and Console (Dev Mode).
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
        // Try loading from classpath
        try (InputStream is = getClass().getClassLoader().getResourceAsStream("sms.properties")) {
            if (is != null) {
                fileConfig.load(is);
                System.out.println("[FoodWala SMS Service] Loaded configuration from classpath: sms.properties");
                return;
            }
        } catch (Exception e) {}

        // Try loading from WEB-INF/classes or application root
        String[] potentialPaths = {
            "sms.properties",
            "src/main/resources/sms.properties",
            "WEB-INF/classes/sms.properties"
        };

        for (String p : potentialPaths) {
            File f = new File(p);
            if (f.exists()) {
                try (FileInputStream fis = new FileInputStream(f)) {
                    fileConfig.load(fis);
                    System.out.println("[FoodWala SMS Service] Loaded configuration from file: " + f.getAbsolutePath());
                    return;
                } catch (Exception e) {}
            }
        }
    }

    public String getConfig(String key) {
        // 1. System property (e.g. -DSMS_PROVIDER=twilio)
        String val = System.getProperty(key);
        if (val != null && !val.isBlank()) return val.trim();

        // 2. Environment variable
        val = System.getenv(key);
        if (val != null && !val.isBlank()) return val.trim();

        // 3. Properties file
        val = fileConfig.getProperty(key);
        if (val != null && !val.isBlank()) return val.trim();

        return null;
    }

    public String getProvider() {
        String p = getConfig("SMS_PROVIDER");
        return (p != null && !p.isBlank()) ? p.toLowerCase() : "console";
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
        System.out.println("[FoodWala OTP] Mode: " + (devMode ? "DEVELOPMENT (Console)" : "PRODUCTION (Live SMS)"));

        // If in development mode or provider is 'console'
        if (devMode || "console".equals(provider)) {
            System.out.println("==================================================");
            System.out.println("[FoodWala OTP] Development OTP: " + otp);
            System.out.println("[FoodWala OTP] Recipient: " + phone);
            System.out.println("[FoodWala OTP] Expiration: 5 minutes");
            System.out.println("[FoodWala OTP] SMS Note: Console simulation active. No real SMS sent.");
            System.out.println("==================================================");
            return SMSResult.devSuccess("console");
        }

        // Live Production Delivery
        try {
            switch (provider) {
                case "twilio":
                    return sendTwilio(phone, otp);
                case "2factor":
                    return send2Factor(phone, otp);
                case "msg91":
                    return sendMsg91(phone, otp);
                default:
                    System.err.println("[FoodWala OTP] Unknown SMS provider: " + provider);
                    return SMSResult.failure(provider, "Unknown SMS provider configured: " + provider, 400);
            }
        } catch (Exception e) {
            System.err.println("[FoodWala OTP] SMS delivery FAILED with exception: " + e.getMessage());
            e.printStackTrace();
            return SMSResult.failure(provider, "SMS provider connection error: " + e.getMessage(), 500);
        }
    }

    /**
     * Twilio SMS Integration
     */
    private SMSResult sendTwilio(String phone, String otp) throws Exception {
        String accountSid = getConfig("TWILIO_ACCOUNT_SID");
        String authToken = getConfig("TWILIO_AUTH_TOKEN");
        String fromPhone = getConfig("TWILIO_PHONE_NUMBER");

        if (accountSid == null || authToken == null || fromPhone == null) {
            String err = "Twilio credentials incomplete. Ensure TWILIO_ACCOUNT_SID, TWILIO_AUTH_TOKEN, and TWILIO_PHONE_NUMBER are configured.";
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

        if (status >= 200 && status < 300) {
            String sid = extractJsonValue(responseBody, "sid");
            System.out.println("[FoodWala OTP] SMS provider message: Message accepted by Twilio. SID: " + sid);
            System.out.println("[FoodWala OTP] OTP delivery successful");
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
     * 2Factor India SMS Integration (Fast transactional SMS gateway for Indian mobile numbers)
     */
    private SMSResult send2Factor(String phone, String otp) throws Exception {
        String apiKey = getConfig("TWO_FACTOR_API_KEY");
        if (apiKey == null) {
            String err = "2Factor API Key missing. Ensure TWO_FACTOR_API_KEY is configured.";
            System.err.println("[FoodWala OTP] " + err);
            return SMSResult.failure("2factor", err, 401);
        }

        String cleanPhone = phone.replace("+91", "").replaceAll("[^0-9]", "");
        System.out.println("[FoodWala OTP] Calling SMS provider: 2Factor (To: " + cleanPhone + ")");

        HttpClient client = HttpClient.newBuilder().connectTimeout(Duration.ofSeconds(12)).build();
        String uri = "https://2factor.in/API/V1/" + URLEncoder.encode(apiKey, StandardCharsets.UTF_8)
                + "/SMS/" + URLEncoder.encode(cleanPhone, StandardCharsets.UTF_8)
                + "/" + URLEncoder.encode(otp, StandardCharsets.UTF_8) + "/FOODWALA";

        HttpRequest request = HttpRequest.newBuilder()
                .uri(URI.create(uri))
                .header("Accept", "application/json")
                .GET()
                .build();

        HttpResponse<String> response = client.send(request, HttpResponse.BodyHandlers.ofString());
        int status = response.statusCode();
        String responseBody = response.body();

        System.out.println("[FoodWala OTP] Provider response status: " + status);

        if (status == 200 && responseBody != null && responseBody.contains("\"Status\":\"Success\"")) {
            String details = extractJsonValue(responseBody, "Details");
            System.out.println("[FoodWala OTP] SMS provider message: 2Factor Session ID: " + details);
            System.out.println("[FoodWala OTP] OTP delivery successful");
            return SMSResult.success("2factor", details);
        } else {
            String details = extractJsonValue(responseBody, "Details");
            String fullErr = "2Factor SMS failed: " + (details != null ? details : responseBody);
            System.err.println("[FoodWala OTP] SMS delivery FAILED. Status: " + status + ", Error: " + fullErr);
            return SMSResult.failure("2factor", fullErr, status != 200 ? status : 400);
        }
    }

    /**
     * MSG91 India OTP Integration
     */
    private SMSResult sendMsg91(String phone, String otp) throws Exception {
        String authKey = getConfig("MSG91_AUTH_KEY");
        String templateId = getConfig("MSG91_TEMPLATE_ID");

        if (authKey == null || templateId == null) {
            String err = "MSG91 credentials incomplete. Ensure MSG91_AUTH_KEY and MSG91_TEMPLATE_ID are configured.";
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

        if (status >= 200 && status < 300 && responseBody != null && responseBody.contains("\"type\":\"success\"")) {
            System.out.println("[FoodWala OTP] SMS provider message: MSG91 OTP dispatched successfully.");
            System.out.println("[FoodWala OTP] OTP delivery successful");
            return SMSResult.success("msg91", "msg91_" + System.currentTimeMillis());
        } else {
            String message = extractJsonValue(responseBody, "message");
            String fullErr = "MSG91 Error: " + (message != null ? message : responseBody);
            System.err.println("[FoodWala OTP] SMS delivery FAILED. Status: " + status + ", Error: " + fullErr);
            return SMSResult.failure("msg91", fullErr, status >= 400 ? status : 400);
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
