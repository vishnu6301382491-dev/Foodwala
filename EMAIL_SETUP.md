# FoodWala — EmailJS Integration & Setup Guide

This guide explains how to connect **EmailJS** to send automated, professional order receipts from **`foodwalapp@gmail.com`** directly to customers upon checkout on your static GitHub Pages website.

> [!NOTE]
> Since FoodWala is hosted as a client-side static application on GitHub Pages, **EmailJS** provides secure email delivery without requiring a dedicated Node.js or Java server runtime.
> **Security Notice**: Never enter or commit raw Gmail account passwords. EmailJS connects securely using Google OAuth and API public tokens.

---

## Step 1: Create a Free EmailJS Account
1. Open [https://www.emailjs.com/](https://www.emailjs.com/) and click **Sign Up Free**.
2. Register with your Google account or email. The free tier includes **200 free emails per month** with no credit card required.

---

## Step 2: Connect the Gmail Service (`foodwalapp@gmail.com`)
1. In the EmailJS dashboard, click **Email Services** in the left sidebar.
2. Click **Add New Service**.
3. Select **Gmail** from the list of providers.
4. Set the **Service Name** to `FoodWala Gmail` (or any label you prefer).
5. Click **Connect Account** and log in to **`foodwalapp@gmail.com`**.
6. Grant EmailJS permission to send messages on your behalf.
7. Note down your **Service ID** (e.g., `service_foodwala` or `service_abc1234`).
8. Click **Create Service**.

---

## Step 3: Create the Email Receipt Template
1. In the left sidebar, click **Email Templates**.
2. Click **Create New Template**.
3. Configure the email template settings on the right panel:
   - **Template Name**: `FoodWala Order Receipt`
   - **Subject**: `FoodWala Receipt for Order {{order_id}} — {{restaurant}}`
   - **From Name**: `FoodWala`
   - **From Email**: `foodwalapp@gmail.com`
   - **To Email**: `{{to_email}}`
   - **Reply-To**: `foodwalapp@gmail.com`
4. In the main email editor window, switch to the **HTML** tab.
5. Open [`receipt-email-template.html`](./receipt-email-template.html) in this project, copy the entire HTML content, and paste it into the editor.
6. Click **Save** in the top right.
7. Note down your **Template ID** (e.g., `template_foodwala` or `template_xyz5678`).

### Template Variables Used:
| Variable | Description | Example |
| :--- | :--- | :--- |
| `{{to_email}}` | Customer's email address | `customer@gmail.com` |
| `{{customer_name}}` | Name of the recipient | `Vishnu` |
| `{{order_id}}` | Unique FoodWala Order ID | `#FW-20854` |
| `{{restaurant}}` | Ordered restaurant name | `Meghana Foods` |
| `{{items}}` | Formatted multi-line items list | `1. 2x Chicken Biryani — Rs. 640` |
| `{{total}}` | Final order grand total with Rs. | `Rs. 677.00` |
| `{{payment_mode}}` | Payment method used | `Razorpay (Test Sandbox)` / `UPI` |
| `{{order_date}}` | Formatted date and time | `15 Oct 2026, 12:45 AM` |
| `{{address}}` | Complete delivery address | `Flat 402, Green Glen Layout, Bengaluru` |

---

## Step 4: Obtain Your Public API Key
1. In the EmailJS dashboard, click **Account** in the bottom left.
2. In the **API Keys** section, copy your **Public Key** (e.g., `y0uR_PubL1c_k3y_abc123`).

---

## Step 5: Paste Your 3 Keys into `js/emailService.js`
Open [`js/emailService.js`](./js/emailService.js). Your active configuration is:

```javascript
  const EMAILJS_CONFIG = {
    SERVICE_ID: 'service_s6chkik',       // EmailJS Gmail Service ID
    TEMPLATE_ID: 'template_fs6ee5x',     // EmailJS Receipt Template ID
    PUBLIC_KEY: 'wE9osxGnQVfki9oIW',     // EmailJS Browser Public Key
    SENDER_EMAIL: 'foodwalapp@gmail.com' // Verified sender email
  };
```

> [!SECURITY]
> **Important Security Rule**: Do **not** commit or expose your **Private Key** in client-side code or public GitHub repositories. In EmailJS, the browser SDK only needs the `PUBLIC_KEY`. The Private Key is reserved for private, server-side backend operations.

---

## Step 6: Verify the Live Workflow
1. Navigate to [`checkout.html`](./checkout.html) on your local dev server or GitHub Pages.
2. Ensure your customer email address is entered (prefilled or editable).
3. Place a test order (using Razorpay Test Mode or UPI Instant).
4. You should see a green toast:
   > **Receipt sent to your_email@example.com**
5. Check your inbox for the styled FoodWala receipt!
6. Click **Download Receipt** on [`orders.html`](./orders.html) or the tracking page to get the instant PDF invoice.
