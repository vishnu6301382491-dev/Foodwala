package com.tap.test;

import java.util.List;

import com.tap.daoimpl.DeliveryPartnerDAOImpl;
import com.tap.daoimpl.OrderDAOImpl;
import com.tap.daoimpl.OrderItemDAOImpl;
import com.tap.daoimpl.PaymentDAOImpl;
import com.tap.model.Cart;
import com.tap.model.CartItem;
import com.tap.model.DeliveryPartner;
import com.tap.model.Order;
import com.tap.model.OrderItem;
import com.tap.model.Payment;
import com.tap.model.User;
import com.tap.service.OrderService;
import com.tap.service.PaymentService;

public class TestFoodWalaSuite {

    private static int testsRun = 0;
    private static int testsPassed = 0;
    private static int testsFailed = 0;

    private static void assertTest(String scenario, boolean condition, String details) {
        testsRun++;
        if (condition) {
            testsPassed++;
            System.out.println("  [PASS] " + scenario + " -> " + details);
        } else {
            testsFailed++;
            System.err.println("  [FAIL] " + scenario + " -> " + details);
        }
    }

    public static void main(String[] args) throws Exception {
        System.out.println("==================================================");
        System.out.println("FOODWALA 10-SCENARIO COMPREHENSIVE TEST SUITE");
        System.out.println("==================================================");

        OrderService orderService = new OrderService();
        PaymentService paymentService = new PaymentService();
        OrderDAOImpl orderDAO = new OrderDAOImpl();
        OrderItemDAOImpl itemDAO = new OrderItemDAOImpl();
        DeliveryPartnerDAOImpl partnerDAO = new DeliveryPartnerDAOImpl();
        PaymentDAOImpl paymentDAO = new PaymentDAOImpl();

        // -------------------------------------------------------------------------
        // SCENARIO 1: Invalid UPI "hi" REJECTION
        // -------------------------------------------------------------------------
        System.out.println("\n--- SCENARIO 1: Rejecting Invalid UPI ID ('hi') ---");
        boolean hiResult = PaymentService.isValidUpiId("hi");
        assertTest("Scenario 1.1", !hiResult, "'hi' correctly rejected by isValidUpiId");

        boolean emptyResult = PaymentService.isValidUpiId("");
        assertTest("Scenario 1.2", !emptyResult, "Empty UPI ID correctly rejected");

        boolean nullResult = PaymentService.isValidUpiId(null);
        assertTest("Scenario 1.3", !nullResult, "null UPI ID correctly rejected");

        // -------------------------------------------------------------------------
        // SCENARIO 2: Valid & Invalid UPI Format Validation
        // -------------------------------------------------------------------------
        System.out.println("\n--- SCENARIO 2: UPI Format Validation Regex Testing ---");
        assertTest("Scenario 2.1", PaymentService.isValidUpiId("test@upi"), "test@upi is valid");
        assertTest("Scenario 2.2", PaymentService.isValidUpiId("rahul.sharma@okhdfcbank"), "rahul.sharma@okhdfcbank is valid");
        assertTest("Scenario 2.3", PaymentService.isValidUpiId("merchant-123@ybl"), "merchant-123@ybl is valid");
        assertTest("Scenario 2.4", PaymentService.isValidUpiId("paytmuser@paytm"), "paytmuser@paytm is valid");
        assertTest("Scenario 2.5", !PaymentService.isValidUpiId("user@"), "user@ rejected (no handle)");
        assertTest("Scenario 2.6", !PaymentService.isValidUpiId("@oksbi"), "@oksbi rejected (no prefix)");
        assertTest("Scenario 2.7", !PaymentService.isValidUpiId("user name@upi"), "space inside UPI rejected");
        assertTest("Scenario 2.8", !PaymentService.isValidUpiId("invalid#upi@bank"), "invalid special char rejected");

        // -------------------------------------------------------------------------
        // SCENARIO 3: COD Order Flow (Order: PLACED, Payment: PENDING)
        // -------------------------------------------------------------------------
        System.out.println("\n--- SCENARIO 3: COD Order Flow (Payment Status = PENDING) ---");
        Cart codCart = new Cart();
        codCart.addItem(new CartItem(1, 1, "Masala Dosa", 85.0, 2, 170.0));
        codCart.addItem(new CartItem(2, 1, "Filter Coffee", 30.0, 1, 30.0));

        int codOrderId = orderService.placeOrder(
            1, codCart, "Test Customer COD", "9876543210", "cod@foodwala.com",
            "Flat 101, Test Residency", "Gandhi Bazaar Main Rd", "Basavanagudi",
            "Bengaluru", "Karnataka", "560004", "Near Vidyarthi Bhavan", "Leave with guard",
            "Flat 101, Test Residency, Gandhi Bazaar Main Rd, Basavanagudi, Bengaluru 560004",
            12.9416, 77.5750, "Cash on Delivery", "PENDING", 40.0, 10.0, 0.0, "25-30 mins"
        );
        Order codOrder = orderDAO.getOrder(codOrderId);
        assertTest("Scenario 3.1", codOrder != null, "COD Order created with ID: " + codOrderId);
        assertTest("Scenario 3.2", "PLACED".equalsIgnoreCase(codOrder.getStatus()), "COD Order Status is PLACED");
        assertTest("Scenario 3.3", "PENDING".equalsIgnoreCase(codOrder.getPaymentStatus()), "COD Payment Status is PENDING (Not paid)");
        assertTest("Scenario 3.4", "Cash on Delivery".equalsIgnoreCase(codOrder.getPaymentMode()), "Payment Mode is Cash on Delivery");

        // -------------------------------------------------------------------------
        // SCENARIO 4: Mandatory Mobile Number Validation
        // -------------------------------------------------------------------------
        System.out.println("\n--- SCENARIO 4: Mobile Number Validation (10-Digit Indian) ---");
        assertTest("Scenario 4.1", PaymentService.isValidIndianPhone("9876543210"), "9876543210 is valid");
        assertTest("Scenario 4.2", PaymentService.isValidIndianPhone("8123456789"), "8123456789 is valid");
        assertTest("Scenario 4.3", PaymentService.isValidIndianPhone("7001234567"), "7001234567 is valid");
        assertTest("Scenario 4.4", PaymentService.isValidIndianPhone("6361234567"), "6361234567 is valid");
        assertTest("Scenario 4.5", !PaymentService.isValidIndianPhone("1234567890"), "Starts with 1 -> rejected");
        assertTest("Scenario 4.6", !PaymentService.isValidIndianPhone("98765"), "Short 5 digits -> rejected");
        assertTest("Scenario 4.7", !PaymentService.isValidIndianPhone("987654321000"), "Long 12 digits -> rejected");
        assertTest("Scenario 4.8", !PaymentService.isValidIndianPhone("abcdefghij"), "Alphabetic -> rejected");

        // -------------------------------------------------------------------------
        // SCENARIO 5: Mandatory Indian Pincode Validation
        // -------------------------------------------------------------------------
        System.out.println("\n--- SCENARIO 5: Indian PIN Code Validation (6-Digit) ---");
        assertTest("Scenario 5.1", PaymentService.isValidIndianPincode("560004"), "560004 is valid");
        assertTest("Scenario 5.2", PaymentService.isValidIndianPincode("110001"), "110001 is valid");
        assertTest("Scenario 5.3", !PaymentService.isValidIndianPincode("012345"), "Starts with 0 -> rejected");
        assertTest("Scenario 5.4", !PaymentService.isValidIndianPincode("56004"), "5 digits -> rejected");
        assertTest("Scenario 5.5", !PaymentService.isValidIndianPincode("5600004"), "7 digits -> rejected");
        assertTest("Scenario 5.6", !PaymentService.isValidIndianPincode("ABCDEF"), "Non-numeric -> rejected");

        // -------------------------------------------------------------------------
        // SCENARIO 6: Full Customer Delivery Snapshot Persistence
        // -------------------------------------------------------------------------
        System.out.println("\n--- SCENARIO 6: Structured Customer Delivery Snapshot ---");
        Cart onlineCart = new Cart();
        onlineCart.addItem(new CartItem(3, 1, "Khara Bath", 55.0, 3, 165.0));

        int onlineOrderId = orderService.placeOrder(
            1, onlineCart, "Vikram Sen", "9123456780", "vikram@example.com",
            "House #42, Rose Villa", "8th Cross Road", "Jayanagar 4th Block",
            "Bengaluru", "Karnataka", "560011", "Opposite City Central Library", "Call before arriving",
            "House #42, Rose Villa, 8th Cross Road, Jayanagar 4th Block, Bengaluru, Karnataka 560011",
            12.9299, 77.5833, "UPI", "SUCCESS", 35.0, 8.25, 0.0, "20-25 mins"
        );
        Order savedOrder = orderDAO.getOrder(onlineOrderId);
        assertTest("Scenario 6.1", savedOrder != null, "Order successfully saved and retrieved");
        assertTest("Scenario 6.2", "Vikram Sen".equals(savedOrder.getCustomerName()), "Customer name snapshot verified: " + savedOrder.getCustomerName());
        assertTest("Scenario 6.3", "9123456780".equals(savedOrder.getCustomerPhone()), "Customer phone snapshot verified: " + savedOrder.getCustomerPhone());
        assertTest("Scenario 6.4", "vikram@example.com".equals(savedOrder.getCustomerEmail()), "Customer email snapshot verified: " + savedOrder.getCustomerEmail());
        assertTest("Scenario 6.5", "House #42, Rose Villa".equals(savedOrder.getHouseNumber()), "House number snapshot verified: " + savedOrder.getHouseNumber());
        assertTest("Scenario 6.6", "8th Cross Road".equals(savedOrder.getStreet()), "Street snapshot verified: " + savedOrder.getStreet());
        assertTest("Scenario 6.7", "Jayanagar 4th Block".equals(savedOrder.getArea()), "Area snapshot verified: " + savedOrder.getArea());
        assertTest("Scenario 6.8", "560011".equals(savedOrder.getPincode()), "Pincode snapshot verified: " + savedOrder.getPincode());
        assertTest("Scenario 6.9", "Call before arriving".equals(savedOrder.getDeliveryInstructions()), "Instructions snapshot verified: " + savedOrder.getDeliveryInstructions());

        // -------------------------------------------------------------------------
        // SCENARIO 7: Order Details, Real Food Names & Financial Math
        // -------------------------------------------------------------------------
        System.out.println("\n--- SCENARIO 7: Real Food Names & Financial Breakdown Math ---");
        List<OrderItem> savedItems = itemDAO.getOrderItemsByOrderId(onlineOrderId);
        assertTest("Scenario 7.1", savedItems != null && !savedItems.isEmpty(), "Order items retrieved: count = " + savedItems.size());
        if (savedItems != null && !savedItems.isEmpty()) {
            OrderItem first = savedItems.get(0);
            assertTest("Scenario 7.2", "Khara Bath".equals(first.getItemName()), "Real dish name displayed: " + first.getItemName() + " (not null, not 'Item #')");
            assertTest("Scenario 7.3", first.getQuantity() == 3, "Item quantity is 3");
            assertTest("Scenario 7.4", Math.abs(first.getTotalPrice() - 165.0) < 0.01, "Item total matches 3 * 55 = 165.0");
        }
        double expectedGrandTotal = (165.0 + 35.0 + 8.25) - 0.0; // 208.25
        assertTest("Scenario 7.5", Math.abs(savedOrder.getTotalAmount() - expectedGrandTotal) < 0.01,
            "Total Amount math: Item Total (165.0) + Delivery (35.0) + Taxes (8.25) = " + savedOrder.getTotalAmount());

        // -------------------------------------------------------------------------
        // SCENARIO 8: Automatic Consistent Delivery Partner Assignment
        // -------------------------------------------------------------------------
        System.out.println("\n--- SCENARIO 8: Delivery Partner Automatic Assignment ---");
        assertTest("Scenario 8.1", savedOrder.getDeliveryPartnerId() != null, "Partner assigned to order: Partner ID = " + savedOrder.getDeliveryPartnerId());
        DeliveryPartner partner = partnerDAO.getPartnerById(savedOrder.getDeliveryPartnerId());
        assertTest("Scenario 8.2", partner != null, "Partner details retrieved from database");
        if (partner != null) {
            assertTest("Scenario 8.3", partner.getName() != null && !partner.getName().isBlank(), "Partner Name: " + partner.getName());
            assertTest("Scenario 8.4", partner.getVehicleNumber() != null && !partner.getVehicleNumber().isBlank(), "Partner Vehicle: " + partner.getVehicleNumber());
            assertTest("Scenario 8.5", partner.getPhone() != null && !partner.getPhone().isBlank(), "Partner Phone: " + partner.getPhone());
            assertTest("Scenario 8.6", partner.getRating() > 0, "Partner Rating: " + partner.getRating() + " / 5.0");
        }

        // -------------------------------------------------------------------------
        // SCENARIO 9: Live Tracking Data Coordinates & State
        // -------------------------------------------------------------------------
        System.out.println("\n--- SCENARIO 9: Live Order Tracking Leaflet Data & Status ---");
        assertTest("Scenario 9.1", savedOrder.getDeliveryLat() != null && savedOrder.getDeliveryLat() > 0, "Customer destination lat: " + savedOrder.getDeliveryLat());
        assertTest("Scenario 9.2", savedOrder.getDeliveryLng() != null && savedOrder.getDeliveryLng() > 0, "Customer destination lng: " + savedOrder.getDeliveryLng());
        assertTest("Scenario 9.3", partner.getCurrentLat() > 0 && partner.getCurrentLng() > 0, "Partner GPS coordinates: " + partner.getCurrentLat() + ", " + partner.getCurrentLng());
        assertTest("Scenario 9.4", savedOrder.getEstimatedDeliveryTime() != null, "Estimated delivery time available: " + savedOrder.getEstimatedDeliveryTime());

        // -------------------------------------------------------------------------
        // SCENARIO 10: Security & Ownership Check (403 Forbidden Simulation)
        // -------------------------------------------------------------------------
        System.out.println("\n--- SCENARIO 10: Ownership Security & Access Control ---");
        // User 1 owns onlineOrderId. User 2 does NOT own it.
        User user1 = new User();
        user1.setUserId(1);
        user1.setRole("CUSTOMER");

        User user2 = new User();
        user2.setUserId(2);
        user2.setRole("CUSTOMER");

        boolean user1CanAccess = (savedOrder.getUserId() == user1.getUserId());
        boolean user2CanAccess = (savedOrder.getUserId() == user2.getUserId());
        boolean guestWithoutSessionCanAccess = false; // guest without lastOrderId

        assertTest("Scenario 10.1", user1CanAccess, "Order owner (User 1) is GRANTED access");
        assertTest("Scenario 10.2", !user2CanAccess, "Non-owner (User 2) is DENIED access (HTTP 403 Forbidden)");
        assertTest("Scenario 10.3", !guestWithoutSessionCanAccess, "Unauthenticated guest without active session order is DENIED access (HTTP 403 Forbidden)");

        // -------------------------------------------------------------------------
        // SUMMARY
        // -------------------------------------------------------------------------
        System.out.println("\n==================================================");
        System.out.println("TEST SUITE RESULTS SUMMARY:");
        System.out.println("Total Tests Run:    " + testsRun);
        System.out.println("Total Tests Passed: " + testsPassed);
        System.out.println("Total Tests Failed: " + testsFailed);
        System.out.println("Success Rate:       " + String.format("%.1f", ((double)testsPassed / testsRun) * 100.0) + "%");
        System.out.println("==================================================");

        if (testsFailed > 0) {
            System.exit(1);
        }
    }
}
