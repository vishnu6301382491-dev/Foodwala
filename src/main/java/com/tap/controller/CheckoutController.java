package com.tap.controller;

import java.io.IOException;
import java.io.Serializable;
import java.util.List;
import java.util.UUID;

import com.tap.daoimpl.AddressDAOImpl;
import com.tap.daoimpl.RestaurantDAOImpl;
import com.tap.daoimpl.UserDAOImpl;
import com.tap.model.Address;
import com.tap.model.Cart;
import com.tap.model.CartItem;
import com.tap.model.CurrentLocation;
import com.tap.model.Restaurant;
import com.tap.model.User;
import com.tap.service.OrderService;
import com.tap.service.PaymentService;
import com.tap.util.LocationUtil;

import jakarta.servlet.ServletException;
import jakarta.servlet.annotation.WebServlet;
import jakarta.servlet.http.HttpServlet;
import jakarta.servlet.http.HttpServletRequest;
import jakarta.servlet.http.HttpServletResponse;
import jakarta.servlet.http.HttpSession;

@WebServlet("/checkout")
public class CheckoutController extends HttpServlet {
    private static final long serialVersionUID = 1L;
    private final OrderService orderService = new OrderService();
    private final PaymentService paymentService = new PaymentService();
    private final AddressDAOImpl addressDAO = new AddressDAOImpl();
    private final RestaurantDAOImpl restaurantDAO = new RestaurantDAOImpl();
    private final UserDAOImpl userDAO = new UserDAOImpl();

    public static class PendingOrderData implements Serializable {
        private static final long serialVersionUID = 1L;
        public int userId;
        public String customerName;
        public String customerPhone;
        public String customerEmail;
        public String houseNumber;
        public String street;
        public String area;
        public String city;
        public String state;
        public String pincode;
        public String landmark;
        public String deliveryInstructions;
        public String deliveryAddress;
        public Double deliveryLat;
        public Double deliveryLng;
        public String paymentMode;
        public String accountDetail;
        public double deliveryFee;
        public double taxes;
        public double discount;
        public double grandTotal;
        public String estimatedTime;
    }

    @Override
    protected void doGet(HttpServletRequest request, HttpServletResponse response) 
            throws ServletException, IOException {
        
        HttpSession session = request.getSession();
        User user = (User) session.getAttribute("loggedInUser");

        if (user == null) {
            response.sendRedirect(request.getContextPath() + "/login");
            return;
        }

        // Fetch fresh user profile from DB to ensure accurate, up-to-date information
        User freshUser = userDAO.getUser(user.getUserId());
        if (freshUser != null) {
            user = freshUser;
            session.setAttribute("loggedInUser", user);
        }

        Cart cart = (Cart) session.getAttribute("cart");
        if (cart == null || cart.isEmpty()) {
            response.sendRedirect(request.getContextPath() + "/cart");
            return;
        }

        List<Address> savedAddresses = addressDAO.getAddressesByUserId(user.getUserId());
        Address defaultAddress = addressDAO.getDefaultAddress(user.getUserId());

        // Current location from session or default coordinate center
        CurrentLocation loc = (CurrentLocation) session.getAttribute("currentLocation");
        if (loc == null) {
            loc = new CurrentLocation(12.9416, 77.5750, 10.0,
                                      (defaultAddress != null && defaultAddress.getFormattedAddress() != null ? defaultAddress.getFormattedAddress() : "Bengaluru, Karnataka"),
                                      (defaultAddress != null && defaultAddress.getCity() != null ? defaultAddress.getCity() : "Bengaluru"),
                                      (defaultAddress != null && defaultAddress.getState() != null ? defaultAddress.getState() : "Karnataka"),
                                      (defaultAddress != null && defaultAddress.getPincode() != null ? defaultAddress.getPincode() : ""));
            session.setAttribute("currentLocation", loc);
        }

        // Identify restaurant coordinates to compute delivery fee & time
        int restaurantId = 1;
        for (CartItem ci : cart.getCartItems()) {
            if (ci != null && ci.getRestaurantId() > 0) {
                restaurantId = ci.getRestaurantId();
                break;
            }
        }
        Restaurant rest = restaurantDAO.getRestaurantById(restaurantId);
        double restLat = rest != null ? rest.getLatitude() : 12.9438;
        double restLng = rest != null ? rest.getLongitude() : 77.5738;

        double distanceKm = LocationUtil.calculateDistanceKm(loc.getLatitude(), loc.getLongitude(), restLat, restLng);
        double deliveryFee = LocationUtil.calculateDeliveryFee(distanceKm, cart.getTotalAmount());
        String estimatedTime = LocationUtil.getEstimatedTime(distanceKm);

        // Generate idempotent checkout token
        String idempotencyToken = UUID.randomUUID().toString();
        session.setAttribute("checkoutToken", idempotencyToken);

        request.setAttribute("savedAddresses", savedAddresses);
        request.setAttribute("defaultAddress", defaultAddress);
        request.setAttribute("currentLocation", loc);
        request.setAttribute("restaurant", rest);
        request.setAttribute("distanceKm", distanceKm);
        request.setAttribute("deliveryFee", deliveryFee);
        request.setAttribute("estimatedTime", estimatedTime);

        request.getRequestDispatcher("/checkout.jsp").forward(request, response);
    }

    @Override
    protected void doPost(HttpServletRequest request, HttpServletResponse response) 
            throws ServletException, IOException {
        
        HttpSession session = request.getSession();
        User user = (User) session.getAttribute("loggedInUser");

        if (user == null) {
            response.sendRedirect(request.getContextPath() + "/login");
            return;
        }

        Cart cart = (Cart) session.getAttribute("cart");
        if (cart == null || cart.isEmpty()) {
            response.sendRedirect(request.getContextPath() + "/cart");
            return;
        }

        // 1. Check for Demo Payment Gateway Sandbox Actions
        String demoAction = request.getParameter("demoGatewayAction");
        if (demoAction != null && !demoAction.isBlank()) {
            String actionOrderIdStr = request.getParameter("orderId");
            int actionOrderId = 0;
            if (actionOrderIdStr != null && !actionOrderIdStr.isBlank()) {
                try { actionOrderId = Integer.parseInt(actionOrderIdStr.trim()); } catch (Exception ignored) {}
            }
            if (actionOrderId <= 0) {
                Integer sessId = (Integer) session.getAttribute("lastOrderId");
                if (sessId != null) actionOrderId = sessId;
            }

            PendingOrderData pending = (PendingOrderData) session.getAttribute("pendingCheckoutData");

            if ("FAIL".equalsIgnoreCase(demoAction)) {
                // Payment was simulated as FAILED
                if (actionOrderId > 0) {
                    new com.tap.daoimpl.OrderDAOImpl().updatePaymentFailure(actionOrderId, "Simulated payment failure / declined in sandbox");
                }
                session.removeAttribute("pendingCheckoutData");
                request.setAttribute("error", "Payment Failed: The simulated banking transaction was declined. Your order was NOT placed. You may try again or select Cash on Delivery.");
                doGet(request, response);
                return;
            } else if ("AUTHORIZE".equalsIgnoreCase(demoAction)) {
                // Payment was simulated as SUCCESS -> Finalize order!
                session.removeAttribute("pendingCheckoutData");
                try {
                    int finalOrderId = actionOrderId;
                    if (finalOrderId <= 0 && pending != null) {
                        finalOrderId = orderService.placeOrder(
                            pending.userId, cart, pending.customerName, pending.customerPhone, pending.customerEmail,
                            pending.houseNumber, pending.street, pending.area, pending.city, pending.state, pending.pincode,
                            pending.landmark, pending.deliveryInstructions, pending.deliveryAddress,
                            pending.deliveryLat, pending.deliveryLng, pending.paymentMode != null ? pending.paymentMode : "RAZORPAY", "PAID",
                            pending.deliveryFee, pending.taxes, pending.discount, pending.estimatedTime
                        );
                    }

                    if (finalOrderId > 0) {
                        // Update order status to CONFIRMED and payment to PAID
                        new com.tap.daoimpl.OrderDAOImpl().updateOrderStatus(finalOrderId, "CONFIRMED", "PAYMENT_GATEWAY", "Online payment authorized & verified");
                        new com.tap.daoimpl.OrderDAOImpl().updatePaymentStatus(finalOrderId, "PAID");

                        // Create confirmed payment record
                        double total = (pending != null) ? pending.grandTotal : (cart != null ? cart.getTotalAmount() : 0.0);
                        paymentService.initiatePayment(finalOrderId, total, (pending != null && pending.paymentMode != null) ? pending.paymentMode : "RAZORPAY", (pending != null ? pending.accountDetail : null));
                        new com.tap.daoimpl.PaymentDAOImpl().recordRazorpayPayment(finalOrderId, "order_sim_" + finalOrderId, "pay_sim_" + System.currentTimeMillis(), "sandbox_verified", total, "UPI", "SUCCESS");

                        // Store last processed order and clear cart
                        session.setAttribute("lastOrderId", finalOrderId);
                        if (cart != null) {
                            cart.clear();
                            session.setAttribute("cart", cart);
                        }
                        session.removeAttribute("cartRestaurantId");

                        response.sendRedirect(request.getContextPath() + "/order-details?orderId=" + finalOrderId);
                        return;
                    } else {
                        request.setAttribute("error", "Payment session expired. Please review your order and try again.");
                        doGet(request, response);
                        return;
                    }
                } catch (Exception e) {
                    e.printStackTrace();
                    request.setAttribute("error", "Error finalizing confirmed order: " + e.getMessage());
                    doGet(request, response);
                    return;
                }
            }
        }

        // 2. Standard Checkout Form Submission
        int userId = user.getUserId();
        String customerName = request.getParameter("deliveryName");
        String customerPhone = request.getParameter("deliveryPhone");
        String customerEmail = request.getParameter("deliveryEmail");
        String houseNumber = request.getParameter("houseNumber");
        String street = request.getParameter("street");
        String area = request.getParameter("area");
        String city = request.getParameter("city");
        String state = request.getParameter("state");
        String pincode = request.getParameter("pincode");
        String landmark = request.getParameter("landmark");
        String deliveryInstructions = request.getParameter("deliveryInstructions");
        String deliveryAddress = request.getParameter("deliveryAddress");
        String latStr = request.getParameter("deliveryLat");
        String lngStr = request.getParameter("deliveryLng");
        String paymentMode = request.getParameter("paymentMode");
        String accountDetail = request.getParameter("accountDetail");

        // BACKEND VALIDATION 1: Recipient Name
        if (customerName == null || customerName.trim().length() < 3) {
            request.setAttribute("error", "Please provide a valid recipient full name (at least 3 characters).");
            doGet(request, response);
            return;
        }

        // BACKEND VALIDATION 2: Mobile Number (Indian 10-digit)
        if (!PaymentService.isValidIndianPhone(customerPhone)) {
            request.setAttribute("error", "Please enter a valid 10-digit Indian mobile number (e.g. starting with 6, 7, 8, 9).");
            doGet(request, response);
            return;
        }

        // BACKEND VALIDATION 3: Address & Location
        if (city == null || city.trim().isEmpty()) {
            city = "Bengaluru";
        }
        if (state == null || state.trim().isEmpty()) {
            state = "Karnataka";
        }
        if (pincode == null || pincode.trim().isEmpty()) {
            pincode = "";
        }

        if (!pincode.isEmpty() && !PaymentService.isValidIndianPincode(pincode)) {
            request.setAttribute("error", "Please enter a valid 6-digit Indian PIN code.");
            doGet(request, response);
            return;
        }

        if ((deliveryAddress == null || deliveryAddress.trim().isEmpty()) && 
            (houseNumber == null || houseNumber.trim().isEmpty() || street == null || street.trim().isEmpty())) {
            request.setAttribute("error", "Please enter a complete delivery address (House/Flat No. and Street).");
            doGet(request, response);
            return;
        }

        if (deliveryAddress == null || deliveryAddress.trim().isEmpty()) {
            deliveryAddress = (houseNumber != null && !houseNumber.isBlank() ? houseNumber + ", " : "") +
                              (street != null && !street.isBlank() ? street + ", " : "") +
                              (area != null && !area.isBlank() ? area + ", " : "") +
                              (city != null && !city.isBlank() ? city + ", " : "") +
                              (state != null && !state.isBlank() ? state + " " : "") +
                              (pincode != null ? pincode : "");
            if (landmark != null && !landmark.isBlank()) {
                deliveryAddress += " (Landmark: " + landmark + ")";
            }
        }
        if (houseNumber == null || houseNumber.trim().isEmpty()) {
            houseNumber = "";
        }
        if (street == null || street.trim().isEmpty()) {
            street = deliveryAddress;
        }

        // BACKEND VALIDATION 4: Payment Method & Details
        if (paymentMode == null || paymentMode.isBlank()) {
            paymentMode = "Cash on Delivery";
        }

        if ("UPI".equalsIgnoreCase(paymentMode)) {
            if (!PaymentService.isValidUpiId(accountDetail)) {
                request.setAttribute("error", "Invalid UPI ID format. Please enter a valid UPI address (e.g. user@okhdfcbank, user@upi, user@paytm).");
                doGet(request, response);
                return;
            }
        } else if ("Credit/Debit Card".equalsIgnoreCase(paymentMode)) {
            if (accountDetail == null || accountDetail.replaceAll("\\D", "").length() < 12) {
                request.setAttribute("error", "Please enter a valid card number (at least 12 digits).");
                doGet(request, response);
                return;
            }
        }

        // Fallbacks for optional fields
        if (customerEmail == null || customerEmail.isBlank()) {
            customerEmail = (user.getEmail() != null) ? user.getEmail() : "";
        }
        if (deliveryAddress == null || deliveryAddress.isBlank()) {
            deliveryAddress = String.format("%s, %s, %s, %s, %s - %s",
                (houseNumber != null ? houseNumber : ""),
                (street != null ? street : ""),
                (area != null ? area : ""),
                (city != null ? city : "Bengaluru"),
                (state != null ? state : "Karnataka"),
                (pincode != null ? pincode : "")
            ).replaceAll(", ,", ",").trim();
        }

        Double deliveryLat = 12.9416;
        Double deliveryLng = 77.5750;
        try {
            if (latStr != null && !latStr.isBlank()) deliveryLat = Double.parseDouble(latStr.trim());
            if (lngStr != null && !lngStr.isBlank()) deliveryLng = Double.parseDouble(lngStr.trim());
        } catch (Exception ignored) {}

        // Calculate delivery fee & transit time based on backend distance
        int restaurantId = 1;
        for (CartItem ci : cart.getCartItems()) {
            if (ci != null && ci.getRestaurantId() > 0) {
                restaurantId = ci.getRestaurantId();
                break;
            }
        }
        Restaurant rest = restaurantDAO.getRestaurantById(restaurantId);
        double restLat = rest != null ? rest.getLatitude() : 12.9438;
        double restLng = rest != null ? rest.getLongitude() : 77.5738;

        double distanceKm = LocationUtil.calculateDistanceKm(deliveryLat, deliveryLng, restLat, restLng);
        double itemTotal = cart.getTotalAmount();
        double deliveryFee = LocationUtil.calculateDeliveryFee(distanceKm, itemTotal);
        double taxes = itemTotal * 0.05;
        double discount = 0.0;
        double grandTotal = (itemTotal + deliveryFee + taxes) - discount;
        String estimatedTime = LocationUtil.getEstimatedTime(distanceKm);

        // Populate Pending Data container
        PendingOrderData pending = new PendingOrderData();
        pending.userId = userId;
        pending.customerName = customerName;
        pending.customerPhone = customerPhone;
        pending.customerEmail = customerEmail;
        pending.houseNumber = houseNumber;
        pending.street = street;
        pending.area = area;
        pending.city = city;
        pending.state = state;
        pending.pincode = pincode;
        pending.landmark = landmark;
        pending.deliveryInstructions = deliveryInstructions;
        pending.deliveryAddress = deliveryAddress;
        pending.deliveryLat = deliveryLat;
        pending.deliveryLng = deliveryLng;
        pending.paymentMode = paymentMode;
        pending.accountDetail = accountDetail;
        pending.deliveryFee = deliveryFee;
        pending.taxes = taxes;
        pending.discount = discount;
        pending.grandTotal = grandTotal;
        pending.estimatedTime = estimatedTime;

        // 3. Routing based on Payment Mode
        if ("Cash on Delivery".equalsIgnoreCase(paymentMode) || "COD".equalsIgnoreCase(paymentMode)) {
            // COD: Place order immediately with Payment Status PENDING
            try {
                int orderId = orderService.placeOrder(
                    pending.userId, cart, pending.customerName, pending.customerPhone, pending.customerEmail,
                    pending.houseNumber, pending.street, pending.area, pending.city, pending.state, pending.pincode,
                    pending.landmark, pending.deliveryInstructions, pending.deliveryAddress,
                    pending.deliveryLat, pending.deliveryLng, "Cash on Delivery", "PENDING",
                    pending.deliveryFee, pending.taxes, pending.discount, pending.estimatedTime
                );

                // Create COD payment transaction record
                paymentService.initiatePayment(orderId, grandTotal, "Cash on Delivery", null);

                session.setAttribute("lastOrderId", orderId);
                cart.clear();
                session.setAttribute("cart", cart);
                session.removeAttribute("cartRestaurantId");

                response.sendRedirect(request.getContextPath() + "/order-details?orderId=" + orderId);
                return;
            } catch (Exception e) {
                e.printStackTrace();
                request.setAttribute("error", "Unable to complete order: " + e.getMessage());
                doGet(request, response);
                return;
            }
        } else {
            // Online/Prepaid (UPI, Card, Net Banking, Razorpay):
            // Place order into database with PENDING payment status, then forward to Payment Gateway
            try {
                int orderId = orderService.placeOrder(
                    pending.userId, cart, pending.customerName, pending.customerPhone, pending.customerEmail,
                    pending.houseNumber, pending.street, pending.area, pending.city, pending.state, pending.pincode,
                    pending.landmark, pending.deliveryInstructions, pending.deliveryAddress,
                    pending.deliveryLat, pending.deliveryLng, paymentMode, "PENDING",
                    pending.deliveryFee, pending.taxes, pending.discount, pending.estimatedTime
                );

                session.setAttribute("lastOrderId", orderId);
                session.setAttribute("pendingCheckoutData", pending);
                request.setAttribute("orderId", orderId);
                request.setAttribute("paymentMode", paymentMode);
                request.setAttribute("accountDetail", accountDetail);
                request.setAttribute("maskedAccount", PaymentService.maskAccountInfo(paymentMode, accountDetail));
                request.setAttribute("grandTotal", grandTotal);
                request.getRequestDispatcher("/paymentGateway.jsp").forward(request, response);
                return;
            } catch (Exception e) {
                e.printStackTrace();
                request.setAttribute("error", "Unable to initialize online order: " + e.getMessage());
                doGet(request, response);
                return;
            }
        }
    }
}