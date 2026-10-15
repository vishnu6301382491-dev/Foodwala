/**
 * FoodWala — Downloadable PDF Receipt Service
 * Powered by jsPDF (loaded via CDN)
 * Generates an official, beautifully styled tax invoice and receipt for food delivery orders.
 */
(function (window) {
  'use strict';

  const JSPDF_CDN = 'https://cdnjs.cloudflare.com/ajax/libs/jspdf/2.5.1/jspdf.umd.min.js';

  // Helper: load jsPDF dynamically if not already available on window
  function ensureJsPdfLoaded() {
    return new Promise((resolve, reject) => {
      if (window.jspdf && window.jspdf.jsPDF) {
        return resolve(window.jspdf.jsPDF);
      }
      // Check if script tag is already in DOM
      let existing = document.querySelector(`script[src="${JSPDF_CDN}"]`);
      if (existing) {
        existing.addEventListener('load', () => {
          if (window.jspdf && window.jspdf.jsPDF) {
            resolve(window.jspdf.jsPDF);
          } else {
            reject(new Error('jsPDF loaded but window.jspdf.jsPDF not found'));
          }
        });
        existing.addEventListener('error', (e) => reject(e));
        return;
      }
      const script = document.createElement('script');
      script.src = JSPDF_CDN;
      script.crossOrigin = 'anonymous';
      script.onload = () => {
        if (window.jspdf && window.jspdf.jsPDF) {
          resolve(window.jspdf.jsPDF);
        } else {
          reject(new Error('jsPDF loaded but window.jspdf.jsPDF not found'));
        }
      };
      script.onerror = (err) => reject(err);
      document.head.appendChild(script);
    });
  }

  // Format currency with "Rs." for clean PDF rendering across all standard fonts
  function formatRs(amount) {
    const num = Number(amount) || 0;
    return 'Rs. ' + num.toFixed(2);
  }

  // Format date and time
  function formatDateTime(dateInput) {
    if (!dateInput) return new Date().toLocaleString('en-IN');
    const d = new Date(dateInput);
    if (isNaN(d.getTime())) return String(dateInput);
    return d.toLocaleString('en-IN', {
      day: 'numeric',
      month: 'short',
      year: 'numeric',
      hour: '2-digit',
      minute: '2-digit',
      hour12: true
    });
  }

  /**
   * Generates and downloads a PDF receipt for the given order
   * @param {Object} order - FoodWala order object
   */
  async function downloadReceipt(order) {
    if (!order) {
      if (window.FoodWalaApp && window.FoodWalaApp.showToast) {
        window.FoodWalaApp.showToast('Order details not found to generate receipt.', 'error');
      }
      return;
    }

    try {
      const jsPDF = await ensureJsPdfLoaded();
      const doc = new jsPDF({
        orientation: 'portrait',
        unit: 'mm',
        format: 'a4'
      });

      const orderId = order.orderId || order.id || 'ORDER';
      const cleanOrderId = String(orderId).replace(/^#/, '');
      const dateText = formatDateTime(order.createdAtMs || order.createdAt);
      const customerName = order.customerName || (order.name || 'Customer');
      const customerPhone = order.customerPhone || (order.phone || 'N/A');
      const customerEmail = order.customerEmail || (order.email || 'N/A');
      const deliveryAddress = order.deliveryAddress || (order.address || 'Bengaluru');
      const restaurantName = order.restaurantName || 'Bengaluru Restaurant';
      const restaurantAddress = order.restaurantAddress || 'Bengaluru, Karnataka';
      const paymentMode = order.paymentMethod || 'UPI Instant';
      const paymentId = order.razorpayPaymentId || (order.paymentStatus === 'PAID' ? 'PAID-ONLINE' : 'COD');
      const items = Array.isArray(order.items) ? order.items : [];

      // Calculate totals if missing
      const itemTotal = Number(order.itemTotal) || items.reduce((sum, it) => sum + (Number(it.price) * Number(it.quantity || 1)), 0);
      const deliveryFee = Number(order.deliveryFee) || 0;
      const platformFee = Number(order.platformFee) || 5;
      const gst = Number(order.gst) || Math.round(itemTotal * 0.05);
      const discount = Number(order.discount) || 0;
      const grandTotal = Number(order.grandTotal) || (itemTotal + deliveryFee + platformFee + gst - discount);

      // --- 1. HEADER BANNER ---
      // Red brand background: [220, 53, 69]
      doc.setFillColor(220, 53, 69);
      doc.rect(0, 0, 210, 32, 'F');

      // FoodWala logo / title
      doc.setTextColor(255, 255, 255);
      doc.setFont('helvetica', 'bold');
      doc.setFontSize(22);
      doc.text('FoodWala', 15, 15);

      doc.setFont('helvetica', 'normal');
      doc.setFontSize(9);
      doc.text("Bengaluru's Premier Food Discovery & Delivery Network", 15, 22);
      doc.text("GSTIN: 29AABCF1234F1Z8 | FSSAI: 11223344005566", 15, 27);

      // Right header: Tax Invoice / DEMO
      const isDemo = Boolean(order.isDemo || (typeof window !== 'undefined' && window.FOODWALA_IS_DEMO_MODE));
      if (isDemo) {
        doc.setFillColor(255, 193, 7);
        doc.roundedRect(128, 10, 18, 6, 1, 1, 'F');
        doc.setTextColor(0, 0, 0);
        doc.setFont('helvetica', 'bold');
        doc.setFontSize(8);
        doc.text('DEMO', 131, 14.5);

        doc.setTextColor(255, 255, 255);
        doc.setFont('helvetica', 'bold');
        doc.setFontSize(13);
        doc.text('DEMO RECEIPT', 195, 15, { align: 'right' });
        doc.setFont('helvetica', 'normal');
        doc.setFontSize(8.5);
        doc.text('STORED LOCALLY IN BROWSER', 195, 21, { align: 'right' });
        doc.text(`Invoice Ref: #${cleanOrderId} [DEMO]`, 195, 26, { align: 'right' });
      } else {
        doc.setFont('helvetica', 'bold');
        doc.setFontSize(13);
        doc.text('TAX INVOICE / RECEIPT', 195, 15, { align: 'right' });
        doc.setFont('helvetica', 'normal');
        doc.setFontSize(9);
        doc.text('ORIGINAL FOR RECIPIENT', 195, 21, { align: 'right' });
        doc.text(`Invoice Ref: #${cleanOrderId}`, 195, 26, { align: 'right' });
      }

      // --- 2. ORDER & RESTAURANT INFO BOX ---
      let y = 40;
      doc.setFillColor(248, 249, 250);
      doc.roundedRect(15, y, 180, 28, 2, 2, 'F');
      doc.setDrawColor(222, 226, 230);
      doc.roundedRect(15, y, 180, 28, 2, 2, 'S');

      // Left column: Order Metadata
      doc.setTextColor(33, 37, 41);
      doc.setFont('helvetica', 'bold');
      doc.setFontSize(10);
      doc.text('ORDER DETAILS', 20, y + 6);

      doc.setFont('helvetica', 'normal');
      doc.setFontSize(8.5);
      doc.text(`Order ID: #${cleanOrderId}`, 20, y + 12);
      doc.text(`Date & Time: ${dateText}`, 20, y + 17);
      doc.text(`Payment Mode: ${paymentMode}`, 20, y + 22);

      // Right column: Restaurant Metadata
      doc.setFont('helvetica', 'bold');
      doc.setFontSize(10);
      doc.text('RESTAURANT DETAILS', 110, y + 6);

      doc.setFont('helvetica', 'normal');
      doc.setFontSize(8.5);
      doc.text(`Name: ${restaurantName}`, 110, y + 12);
      const restAddrLines = doc.splitTextToSize(`Address: ${restaurantAddress}`, 80);
      doc.text(restAddrLines, 110, y + 17);
      if (paymentId && paymentId !== 'N/A') {
        doc.text(`Payment Ref: ${paymentId}`, 20, y + 26);
      }

      // --- 3. CUSTOMER & DELIVERY ADDRESS BOX ---
      y = 73;
      doc.setFillColor(248, 249, 250);
      doc.roundedRect(15, y, 180, 24, 2, 2, 'F');
      doc.roundedRect(15, y, 180, 24, 2, 2, 'S');

      doc.setTextColor(220, 53, 69);
      doc.setFont('helvetica', 'bold');
      doc.setFontSize(9.5);
      doc.text('DELIVERY TO:', 20, y + 6);

      doc.setTextColor(33, 37, 41);
      doc.setFont('helvetica', 'bold');
      doc.setFontSize(9);
      doc.text(`${customerName}  |  Phone: ${customerPhone}  |  Email: ${customerEmail}`, 20, y + 12);

      doc.setFont('helvetica', 'normal');
      doc.setFontSize(8.5);
      const addrLines = doc.splitTextToSize(`Address: ${deliveryAddress}`, 170);
      doc.text(addrLines, 20, y + 17);

      // --- 4. ITEMS TABLE ---
      y = 104;
      // Header row
      doc.setFillColor(235, 238, 242);
      doc.rect(15, y, 180, 7.5, 'F');

      doc.setTextColor(33, 37, 41);
      doc.setFont('helvetica', 'bold');
      doc.setFontSize(8.5);
      doc.text('#', 18, y + 5.2);
      doc.text('Item Description', 28, y + 5.2);
      doc.text('Qty', 125, y + 5.2, { align: 'center' });
      doc.text('Price', 158, y + 5.2, { align: 'right' });
      doc.text('Amount', 190, y + 5.2, { align: 'right' });

      y += 8;
      doc.setFont('helvetica', 'normal');
      doc.setFontSize(8.5);

      if (items.length === 0) {
        doc.text('Food Order Delicacies (Combo Meal)', 28, y + 5);
        doc.text('1', 125, y + 5, { align: 'center' });
        doc.text(formatRs(grandTotal), 158, y + 5, { align: 'right' });
        doc.text(formatRs(grandTotal), 190, y + 5, { align: 'right' });
        y += 7;
      } else {
        items.forEach((item, index) => {
          const qty = Number(item.quantity) || 1;
          const price = Number(item.price) || 0;
          const lineTotal = price * qty;
          const itemName = item.name || `Food Item ${index + 1}`;

          // Alternate row subtle shading
          if (index % 2 === 1) {
            doc.setFillColor(250, 250, 250);
            doc.rect(15, y, 180, 7, 'F');
          }

          doc.setTextColor(50, 50, 50);
          doc.text(String(index + 1), 18, y + 4.8);
          
          const truncatedName = itemName.length > 45 ? itemName.substring(0, 43) + '...' : itemName;
          doc.text(truncatedName, 28, y + 4.8);

          doc.text(String(qty), 125, y + 4.8, { align: 'center' });
          doc.text(formatRs(price), 158, y + 4.8, { align: 'right' });
          doc.text(formatRs(lineTotal), 190, y + 4.8, { align: 'right' });

          doc.setDrawColor(240, 240, 240);
          doc.line(15, y + 7, 195, y + 7);
          y += 7;

          // Page overflow check (just in case)
          if (y > 230) {
            doc.addPage();
            y = 20;
          }
        });
      }

      // --- 5. BILL SUMMARY (Right Side) ---
      y += 4;
      const summaryStartX = 110;
      doc.setDrawColor(220, 220, 220);
      doc.line(summaryStartX, y, 195, y);
      y += 5;

      const summaryRows = [
        { label: 'Item Total', value: formatRs(itemTotal) },
        { label: 'Delivery Fee', value: deliveryFee === 0 ? 'FREE' : formatRs(deliveryFee) },
        { label: 'Platform Fee', value: formatRs(platformFee) },
        { label: 'GST & Taxes (5%)', value: formatRs(gst) }
      ];

      if (discount > 0) {
        summaryRows.push({ label: 'Coupon Discount', value: `- ${formatRs(discount)}` });
      }

      doc.setFontSize(8.5);
      summaryRows.forEach(row => {
        doc.setFont('helvetica', 'normal');
        doc.setTextColor(100, 100, 100);
        doc.text(row.label, summaryStartX, y);
        doc.setTextColor(33, 37, 41);
        doc.setFont('helvetica', 'bold');
        doc.text(row.value, 190, y, { align: 'right' });
        y += 5.5;
      });

      // Grand Total Highlight
      doc.setFillColor(254, 237, 238);
      doc.rect(summaryStartX - 2, y - 2, 87, 9, 'F');
      doc.setDrawColor(220, 53, 69);
      doc.rect(summaryStartX - 2, y - 2, 87, 9, 'S');

      doc.setTextColor(220, 53, 69);
      doc.setFont('helvetica', 'bold');
      doc.setFontSize(10.5);
      doc.text('Grand Total Paid', summaryStartX + 2, y + 4.2);
      doc.text(formatRs(grandTotal), 190, y + 4.2, { align: 'right' });

      // Delivery Partner Note on left of summary
      doc.setTextColor(108, 117, 125);
      doc.setFont('helvetica', 'normal');
      doc.setFontSize(8);
      if (order.deliveryPartner && order.deliveryPartner.name) {
        doc.text(`Delivered by: ${order.deliveryPartner.name} (${order.deliveryPartner.vehicle || 'Bike'})`, 15, y - 10);
      }
      doc.text(`Payment Status: ${order.paymentStatus || 'PAID'}`, 15, y - 5);
      doc.text(`Order Status: ${order.status || 'Delivered'}`, 15, y);

      // --- 6. FOOTER & COMPLIANCE ---
      const footerY = 270;
      doc.setDrawColor(220, 53, 69);
      doc.setLineWidth(0.5);
      doc.line(15, footerY, 195, footerY);

      if (isDemo) {
        doc.setFont('helvetica', 'bold');
        doc.setFontSize(8);
        doc.setTextColor(220, 53, 69);
        doc.text('*** DEMO ORDER: Simulated locally in browser. No real transaction took place. ***', 105, footerY + 4, { align: 'center' });
      }

      doc.setFont('helvetica', 'normal');
      doc.setFontSize(7.5);
      doc.setTextColor(108, 117, 125);
      doc.text('This is a computer-generated invoice and does not require a physical signature.', 105, footerY + (isDemo ? 8 : 5), { align: 'center' });
      doc.text('For queries or support, reach us at foodwalapp@gmail.com | 100% Authentic Bengaluru Delicacies', 105, footerY + (isDemo ? 12 : 9), { align: 'center' });
      doc.text('FoodWala Inc. &bull; Bengaluru, Karnataka, India &bull; www.foodwala.com', 105, footerY + (isDemo ? 16 : 13), { align: 'center' });

      // --- 7. SAVE FILE ---
      const fileName = `FoodWala_Receipt_${cleanOrderId}.pdf`;
      doc.save(fileName);

      if (window.FoodWalaApp && window.FoodWalaApp.showToast) {
        window.FoodWalaApp.showToast(`Receipt downloaded: ${fileName}`, 'success');
      }

      return true;
    } catch (err) {
      console.error('[FoodWala Receipt] Failed to generate PDF receipt:', err);
      if (window.FoodWalaApp && window.FoodWalaApp.showToast) {
        window.FoodWalaApp.showToast('Unable to generate PDF receipt. Please check internet connection.', 'error');
      }
      return false;
    }
  }

  window.FoodWalaReceipt = {
    downloadReceipt: downloadReceipt,
    formatRs: formatRs,
    formatDateTime: formatDateTime
  };

})(typeof window !== 'undefined' ? window : this);
