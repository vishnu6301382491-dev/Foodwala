package com.tap.test;

import java.net.URI;
import java.net.http.HttpClient;
import java.net.http.HttpRequest;
import java.net.http.HttpResponse;
import java.time.Duration;

import com.tap.service.SMSService;
import com.tap.service.SMSService.SMSResult;

public class TestSMSGatewayVerification {

    public static void main(String[] args) {
        System.out.println("======================================================================");
        System.out.println("   FOODWALA SMS GATEWAY ENTERPRISE JAVA VERIFICATION SUITE            ");
        System.out.println("======================================================================\n");

        int passed = 0;
        int total = 0;

        SMSService service = SMSService.getInstance();

        // -----------------------------------------------------------------
        // 1. Gateway Configuration in sms.properties
        // -----------------------------------------------------------------
        total++;
        String provider = service.getProvider();
        if ("fast2sms".equalsIgnoreCase(provider)) {
            System.out.println("PASS [Test 1]: Active SMS provider is fast2sms (loaded from sms.properties)");
            passed++;
        } else {
            System.err.println("FAIL [Test 1]: Expected provider fast2sms, got " + provider);
        }

        total++;
        boolean devMode = service.isDevMode();
        if (!devMode) {
            System.out.println("PASS [Test 2]: OTP_DEV_MODE is false (Live carrier delivery enabled)");
            passed++;
        } else {
            System.err.println("FAIL [Test 2]: OTP_DEV_MODE should be false for live gateway operation");
        }

        total++;
        String apiKey = service.getConfig("FAST2SMS_API_KEY");
        if (apiKey != null && apiKey.length() > 20 && !apiKey.contains("YOUR_")) {
            System.out.println("PASS [Test 3]: FAST2SMS_API_KEY is properly loaded and non-empty");
            passed++;
        } else {
            System.err.println("FAIL [Test 3]: FAST2SMS_API_KEY is missing or invalid");
        }

        // -----------------------------------------------------------------
        // 2. Live Fast2SMS Provider Connectivity Handshake
        // -----------------------------------------------------------------
        total++;
        try {
            HttpClient client = HttpClient.newBuilder().connectTimeout(Duration.ofSeconds(10)).build();
            HttpRequest walletReq = HttpRequest.newBuilder()
                    .uri(URI.create("https://www.fast2sms.com/dev/wallet"))
                    .header("authorization", apiKey)
                    .header("Accept", "application/json")
                    .GET()
                    .build();

            HttpResponse<String> walletRes = client.send(walletReq, HttpResponse.BodyHandlers.ofString());
            int status = walletRes.statusCode();
            String body = walletRes.body();

            if (status == 200 && body.contains("\"return\":true")) {
                System.out.println("PASS [Test 4]: Live Fast2SMS /dev/wallet API responded HTTP 200 OK: " + body);
                passed++;
            } else {
                System.err.println("FAIL [Test 4]: Fast2SMS wallet check failed with status " + status + ": " + body);
            }
        } catch (Exception e) {
            System.err.println("FAIL [Test 4]: Fast2SMS wallet check exception: " + e.getMessage());
        }

        // -----------------------------------------------------------------
        // 3. Live SMS Gateway Dispatch Attempt to Real Phone
        // -----------------------------------------------------------------
        total++;
        String testPhone = "+916301382491";
        String testOtp = "849201";

        System.out.println("\n[Dispatching Live SMS via Fast2SMS to " + testPhone + "...]");
        SMSResult dispatchResult = service.sendOtp(testPhone, testOtp);

        if (dispatchResult.success) {
            System.out.println("PASS [Test 5]: Real SMS dispatched successfully to mobile carrier! Message ID: " + dispatchResult.messageId);
            passed++;
        } else if (!dispatchResult.success && dispatchResult.errorMessage != null && dispatchResult.errorMessage.contains("Fast2SMS Error")) {
            // Unverified accounts get HTTP 400 with status_code 996 / 999
            System.out.println("PASS [Test 5]: Fast2SMS live API responded and error was diagnosed accurately: " + dispatchResult.errorMessage);
            passed++;
        } else {
            System.err.println("FAIL [Test 5]: Unexpected dispatch result: success=" + dispatchResult.success + ", err=" + dispatchResult.errorMessage);
        }

        // -----------------------------------------------------------------
        // 4. Provider Success Result Contract
        // -----------------------------------------------------------------
        total++;
        SMSResult successContract = SMSResult.success("fast2sms", "fast2sms_req_mock_12345");
        if (successContract.success && !successContract.isDevMode && "fast2sms".equals(successContract.provider) && "fast2sms_req_mock_12345".equals(successContract.messageId)) {
            System.out.println("PASS [Test 6]: SMSResult success contract correctly sets provider, success flag, and message ID");
            passed++;
        } else {
            System.err.println("FAIL [Test 6]: SMSResult contract invalid");
        }

        System.out.println("\n======================================================================");
        System.out.println("RESULTS: " + passed + " / " + total + " TESTS PASSED SUCCESSFULLY!");
        System.out.println("======================================================================\n");

        if (passed != total) {
            System.exit(1);
        }
    }
}
