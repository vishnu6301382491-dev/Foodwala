<%@ page language="java" contentType="text/html; charset=UTF-8" pageEncoding="UTF-8"%>
<%@ page import="com.tap.model.Cart" %>
<%@ page import="com.tap.model.User" %>
<%
    Cart cart = (Cart) session.getAttribute("cart");
    if (cart == null || cart.isEmpty()) {
        response.sendRedirect(request.getContextPath() + "/cart");
        return;
    }
    User loggedInUser = (User) session.getAttribute("loggedInUser");
    String paymentMode = (String) request.getAttribute("paymentMode");
    String accountDetail = (String) request.getAttribute("accountDetail");
    Double grandTotalObj = (Double) request.getAttribute("grandTotal");
    double grandTotal = (grandTotalObj != null) ? grandTotalObj : cart.getTotalAmount();
    String maskedAccount = (String) request.getAttribute("maskedAccount");
%>
<!DOCTYPE html>
<html lang="en">
<head>
    <meta charset="UTF-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <title>Secure Payment Gateway (Demo Sandbox) - FoodWala</title>
    <link rel="stylesheet" href="<%=request.getContextPath()%>/style.css">
    <style>
        .gateway-card {
            background: #ffffff;
            border: 2px solid #cbd5e1;
            border-radius: 16px;
            max-width: 500px;
            margin: 40px auto;
            padding: 30px;
            box-shadow: 0 10px 25px rgba(0,0,0,0.1);
        }
        .sandbox-badge {
            background: #fef3c7;
            color: #92400e;
            border: 1px solid #fde68a;
            padding: 6px 12px;
            border-radius: 20px;
            font-size: 12px;
            font-weight: 800;
            display: inline-block;
            text-transform: uppercase;
            letter-spacing: 0.5px;
            margin-bottom: 14px;
        }
    </style>
</head>
<body style="background: #f1f5f9;">

    <!-- NAVBAR -->
    <header class="navbar">
        <div class="nav-container">
            <a href="<%=request.getContextPath()%>/home" class="brand-logo">
                <span class="logo-icon">🍲</span>
                FoodWala
            </a>
            <span style="font-size: 14px; font-weight: 700; color: #64748b;">
                🔒 256-Bit SSL Encrypted Sandbox
            </span>
        </div>
    </header>

    <div class="page-wrap">
        <div class="gateway-card">
            <div style="text-align: center;">
                <span class="sandbox-badge">⚠️ DEMO PAYMENT GATEWAY - SANDBOX MODE</span>
                <h1 style="font-size: 22px; font-weight: 800; color: var(--dark); margin-bottom: 6px;">
                    Authorize Payment
                </h1>
                <p style="font-size: 13px; color: var(--text-muted); margin-bottom: 20px;">
                    This is a development sandbox simulation. <strong>No real money will be charged.</strong>
                </p>
            </div>

            <!-- PAYMENT SUMMARY BOX -->
            <div style="background: #f8fafc; border: 1px solid var(--border-color); border-radius: 10px; padding: 18px; margin-bottom: 24px;">
                <div style="display: flex; justify-content: space-between; margin-bottom: 8px; font-size: 14px;">
                    <span style="color: var(--text-muted);">Merchant:</span>
                    <strong style="color: var(--dark);">FoodWala Technologies</strong>
                </div>
                <div style="display: flex; justify-content: space-between; margin-bottom: 8px; font-size: 14px;">
                    <span style="color: var(--text-muted);">Payment Method:</span>
                    <strong style="color: var(--dark);"><%=paymentMode%></strong>
                </div>
                <div style="display: flex; justify-content: space-between; margin-bottom: 8px; font-size: 14px;">
                    <span style="color: var(--text-muted);">Account / Identifier:</span>
                    <code style="font-weight: 700; color: #2563eb;"><%=maskedAccount != null ? maskedAccount : accountDetail%></code>
                </div>
                <div style="display: flex; justify-content: space-between; padding-top: 10px; border-top: 1px dashed var(--border-color); font-size: 16px;">
                    <span style="font-weight: 700; color: var(--dark);">Amount to Pay:</span>
                    <strong style="font-size: 20px; color: var(--primary);">₹<%=String.format("%.2f", grandTotal)%></strong>
                </div>
            </div>

            <!-- ACTION BUTTONS -->
            <div style="display: flex; flex-direction: column; gap: 12px;">
                <!-- SUCCESS SIMULATION -->
                <form action="<%=request.getContextPath()%>/checkout" method="post">
                    <input type="hidden" name="demoGatewayAction" value="AUTHORIZE">
                    <button type="submit" class="btn btn-block" style="background: #16a34a; font-size: 16px; padding: 14px;">
                        ✓ Authorize &amp; Confirm Demo Payment (Simulate SUCCESS)
                    </button>
                </form>

                <!-- FAILURE SIMULATION -->
                <form action="<%=request.getContextPath()%>/checkout" method="post">
                    <input type="hidden" name="demoGatewayAction" value="FAIL">
                    <button type="submit" class="btn btn-secondary btn-block" style="color: #dc2626; border-color: #fca5a5; background: #fef2f2;">
                        ✕ Decline / Fail Payment (Simulate FAILED)
                    </button>
                </form>

                <!-- CANCEL AND RETURN -->
                <div style="text-align: center; margin-top: 8px;">
                    <a href="<%=request.getContextPath()%>/checkout" style="font-size: 13px; color: var(--text-muted); text-decoration: none;">
                        ← Cancel and Return to Checkout
                    </a>
                </div>
            </div>
        </div>
    </div>

    <!-- FOOTER -->
    <footer class="footer">
        <p>© 2026 FoodWala Sandbox Payment Simulation. PCI-DSS Demonstration Environment.</p>
    </footer>

</body>
</html>
