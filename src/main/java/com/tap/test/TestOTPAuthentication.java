package com.tap.test;

import com.tap.controller.SendOTPServlet;
import com.tap.controller.VerifyOTPServlet;
import com.tap.model.User;
import com.tap.service.SMSService;
import com.tap.service.SMSService.SMSResult;

public class TestOTPAuthentication {
    public static void main(String[] args) {
        System.out.println("==================================================");
        System.out.println("TESTING FOODWALA OTP & SMS SUBSYSTEM");
        System.out.println("==================================================");

        int passed = 0;
        int total = 0;

        // 1. Phone Normalization
        total++;
        String n1 = SendOTPServlet.normalizePhone("6301382491");
        if ("+916301382491".equals(n1)) {
            System.out.println("PASS: 10-digit phone normalized: " + n1);
            passed++;
        } else {
            System.err.println("FAIL: 10-digit phone normalized -> " + n1);
        }

        total++;
        String n2 = SendOTPServlet.normalizePhone("+91 63013 82491");
        if ("+916301382491".equals(n2)) {
            System.out.println("PASS: +91 spaced phone normalized: " + n2);
            passed++;
        } else {
            System.err.println("FAIL: +91 spaced phone normalized -> " + n2);
        }

        total++;
        String n3 = SendOTPServlet.normalizePhone("06301382491");
        if ("+916301382491".equals(n3)) {
            System.out.println("PASS: 0-prefixed phone normalized: " + n3);
            passed++;
        } else {
            System.err.println("FAIL: 0-prefixed phone normalized -> " + n3);
        }

        total++;
        String invalid = SendOTPServlet.normalizePhone("12345");
        if (invalid == null) {
            System.out.println("PASS: Invalid phone rejected as null");
            passed++;
        } else {
            System.err.println("FAIL: Invalid phone not rejected -> " + invalid);
        }

        // 2. Hash OTP Consistency
        total++;
        String phone = "+916301382491";
        String testOtp = "584920";
        String hash1 = SendOTPServlet.hashOtp(phone, testOtp);
        String hash2 = SendOTPServlet.hashOtp(phone, testOtp);
        String hashDifferent = SendOTPServlet.hashOtp(phone, "111111");

        if (hash1 != null && hash1.equals(hash2) && !hash1.equals(hashDifferent)) {
            System.out.println("PASS: SHA-256 OTP hashing is deterministic & unique");
            passed++;
        } else {
            System.err.println("FAIL: OTP hashing error");
        }

        // 3. User model getName() & setName()
        total++;
        User u = new User();
        u.setName("Vishnu Vardhan");
        if ("Vishnu Vardhan".equals(u.getName()) && "Vishnu Vardhan".equals(u.getUsername())) {
            System.out.println("PASS: User model getName() / setName() aliases work correctly");
            passed++;
        } else {
            System.err.println("FAIL: User model alias failure");
        }

        // 4. SMSService Console Dev Mode
        total++;
        SMSResult devRes = SMSService.getInstance().sendOtp(phone, "123456");
        if (devRes.success && devRes.isDevMode && "console".equalsIgnoreCase(devRes.provider)) {
            System.out.println("PASS: SMSService console mode successfully logs OTP without pretending real SMS was sent");
            passed++;
        } else {
            System.err.println("FAIL: SMSService dev mode failed");
        }

        // 5. SMSService Twilio missing credentials rejection
        total++;
        System.setProperty("SMS_PROVIDER", "twilio");
        System.setProperty("OTP_DEV_MODE", "false");
        SMSResult twilioFail = SMSService.getInstance().sendOtp(phone, "123456");
        if (!twilioFail.success && twilioFail.statusCode == 401 && twilioFail.errorMessage.contains("Twilio credentials incomplete")) {
            System.out.println("PASS: SMSService correctly rejects unconfigured Twilio with success=false and 401 status");
            passed++;
        } else {
            System.err.println("FAIL: SMSService did not properly reject unconfigured Twilio -> success=" + twilioFail.success + ", msg=" + twilioFail.errorMessage);
        }

        // 6. SMSService 2Factor missing credentials rejection
        total++;
        System.setProperty("SMS_PROVIDER", "2factor");
        System.setProperty("OTP_DEV_MODE", "false");
        SMSResult twoFactorFail = SMSService.getInstance().sendOtp(phone, "123456");
        if (!twoFactorFail.success && twoFactorFail.statusCode == 401 && twoFactorFail.errorMessage.contains("2Factor API Key missing")) {
            System.out.println("PASS: SMSService correctly rejects unconfigured 2Factor with success=false and 401 status");
            passed++;
        } else {
            System.err.println("FAIL: SMSService did not properly reject unconfigured 2Factor");
        }

        // Reset System properties back
        System.clearProperty("SMS_PROVIDER");
        System.clearProperty("OTP_DEV_MODE");

        System.out.println("==================================================");
        System.out.println("RESULTS: " + passed + "/" + total + " PASSED");
        System.out.println("==================================================");
    }
}
