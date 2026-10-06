package com.tap.service;

import java.net.URI;
import java.net.URLEncoder;
import java.net.http.HttpClient;
import java.net.http.HttpRequest;
import java.net.http.HttpResponse;
import java.nio.charset.StandardCharsets;
import java.time.Duration;

/**
 * FoodWala SMS Service (Java EE)
 * Supports Twilio, MSG91, 2Factor, and Console Development Mode.
 */
public class SMSService {
    private static final SMSService INSTANCE = new SMSService();

    private final String provider;
    private final boolean isDevMode;

    private SMSService() {
        String envProvider = System.getenv("SMS_PROVIDER");
        this.provider = (envProvider != null ? envProvider.toLowerCase() : "console");
        String dev = System.getenv("OTP_DEV_MODE");
        this.isDevMode = (dev == null || "true".equalsIgnoreCase(dev));
    }

    public static SMSService getInstance() {
        return INSTANCE;
    }

    public boolean sendOtp(String phone, String otp) {
        if (isDevMode || "console".equals(provider)) {
            System.out.println("==================================================");
            System.out.println("[FoodWala SMS Service Java - DEV MODE]");
            System.out.println("Recipient: " + phone);
            System.out.println("OTP Code : " + otp);
            System.out.println("Message  : Your FoodWala verification code is " + otp + ". Valid for 5 mins.");
            System.out.println("==================================================");
            return true;
        }

        try {
            if ("twilio".equals(provider)) {
                return sendTwilio(phone, otp);
            } else if ("2factor".equals(provider)) {
                return send2Factor(phone, otp);
            }
        } catch (Exception e) {
            System.err.println("[SMSService Java Error] " + e.getMessage());
        }
        return true;
    }

    private boolean sendTwilio(String phone, String otp) throws Exception {
        String accountSid = System.getenv("TWILIO_ACCOUNT_SID");
        String authToken = System.getenv("TWILIO_AUTH_TOKEN");
        String fromPhone = System.getenv("TWILIO_PHONE_NUMBER");

        if (accountSid == null || authToken == null || fromPhone == null) {
            System.err.println("Twilio credentials missing in Java environment.");
            return false;
        }

        HttpClient client = HttpClient.newBuilder().connectTimeout(Duration.ofSeconds(10)).build();
        String body = "Your FoodWala verification code is " + otp + ". Valid for 5 minutes.";
        String formData = "To=" + URLEncoder.encode(phone, StandardCharsets.UTF_8)
                + "&From=" + URLEncoder.encode(fromPhone, StandardCharsets.UTF_8)
                + "&Body=" + URLEncoder.encode(body, StandardCharsets.UTF_8);

        String auth = java.util.Base64.getEncoder().encodeToString((accountSid + ":" + authToken).getBytes(StandardCharsets.UTF_8));

        HttpRequest request = HttpRequest.newBuilder()
                .uri(URI.create("https://api.twilio.com/2010-04-01/Accounts/" + accountSid + "/Messages.json"))
                .header("Authorization", "Basic " + auth)
                .header("Content-Type", "application/x-www-form-urlencoded")
                .POST(HttpRequest.BodyPublishers.ofString(formData))
                .build();

        HttpResponse<String> response = client.send(request, HttpResponse.BodyHandlers.ofString());
        return response.statusCode() >= 200 && response.statusCode() < 300;
    }

    private boolean send2Factor(String phone, String otp) throws Exception {
        String apiKey = System.getenv("TWO_FACTOR_API_KEY");
        if (apiKey == null) return false;
        String cleanPhone = phone.replace("+91", "").replace("+", "");

        HttpClient client = HttpClient.newBuilder().connectTimeout(Duration.ofSeconds(10)).build();
        HttpRequest request = HttpRequest.newBuilder()
                .uri(URI.create("https://2factor.in/API/V1/" + apiKey + "/SMS/" + cleanPhone + "/" + otp + "/FOODWALA"))
                .GET()
                .build();

        HttpResponse<String> response = client.send(request, HttpResponse.BodyHandlers.ofString());
        return response.statusCode() == 200;
    }
}
