export interface InvoiceParams {
  invoiceNumber: string; // "INV-202605-42"
  invoiceDate: string;   // "May 2, 2026"
  businessName: string;
  contactName: string;
  contactEmail: string;
  packageTier: string;   // "Growth"
  monthlyPrice: string;  // "199.00"
  monthLabel: string;    // "May 2026"
}

export function generateInvoiceHtml(p: InvoiceParams): string {
  return `<!DOCTYPE html>
<html>
<head>
<meta charset="utf-8">
<style>
  body { font-family: Arial, sans-serif; color: #222; background: #fff; margin: 0; padding: 40px; }
  .header { display: flex; justify-content: space-between; align-items: flex-start; border-bottom: 3px solid #1a1a2e; padding-bottom: 24px; margin-bottom: 32px; }
  .brand { font-size: 22px; font-weight: 700; color: #1a1a2e; }
  .brand-sub { font-size: 12px; color: #666; margin-top: 4px; }
  .invoice-meta { text-align: right; }
  .invoice-title { font-size: 28px; font-weight: 700; color: #1a1a2e; text-transform: uppercase; letter-spacing: 2px; }
  .invoice-num { font-size: 13px; color: #666; margin-top: 4px; }
  .bill-to { margin-bottom: 32px; }
  .bill-to h3 { font-size: 11px; text-transform: uppercase; letter-spacing: 1px; color: #888; margin: 0 0 8px; }
  .bill-to p { margin: 2px 0; font-size: 14px; }
  table { width: 100%; border-collapse: collapse; margin-bottom: 24px; }
  thead th { background: #1a1a2e; color: #fff; padding: 10px 16px; text-align: left; font-size: 12px; text-transform: uppercase; letter-spacing: 1px; }
  tbody td { padding: 12px 16px; border-bottom: 1px solid #e5e5e5; font-size: 14px; }
  .total-row td { font-weight: 700; font-size: 16px; border-top: 2px solid #1a1a2e; border-bottom: none; }
  .footer { margin-top: 48px; padding-top: 20px; border-top: 1px solid #e5e5e5; font-size: 11px; color: #999; text-align: center; }
</style>
</head>
<body>
  <div class="header">
    <div>
      <div class="brand">MiniMorph Studios</div>
      <div class="brand-sub">Beautiful websites for growing businesses</div>
      <div class="brand-sub" style="margin-top:8px;">Muskegon, MI 49440 &bull; hello@minimorphstudios.net</div>
    </div>
    <div class="invoice-meta">
      <div class="invoice-title">Invoice</div>
      <div class="invoice-num">${p.invoiceNumber}</div>
      <div class="invoice-num" style="margin-top:8px;"><strong>Date:</strong> ${p.invoiceDate}</div>
    </div>
  </div>

  <div class="bill-to">
    <h3>Bill To</h3>
    <p><strong>${p.contactName}</strong></p>
    <p>${p.businessName}</p>
    <p>${p.contactEmail}</p>
  </div>

  <table>
    <thead>
      <tr>
        <th>Description</th>
        <th>Period</th>
        <th style="text-align:right;">Amount</th>
      </tr>
    </thead>
    <tbody>
      <tr>
        <td>
          <strong>MiniMorph Studios — ${p.packageTier} Plan</strong><br>
          <span style="font-size:12px;color:#666;">Monthly website management, hosting &amp; support</span>
        </td>
        <td>${p.monthLabel}</td>
        <td style="text-align:right;">$${p.monthlyPrice}</td>
      </tr>
    </tbody>
    <tfoot>
      <tr class="total-row">
        <td colspan="2" style="text-align:right;">Total Due</td>
        <td style="text-align:right;">$${p.monthlyPrice}</td>
      </tr>
    </tfoot>
  </table>

  <p style="font-size:13px;color:#555;">Payment is processed automatically via your saved payment method on file. No action required.</p>
  <p style="font-size:13px;color:#555;">Questions? Reply to this email or log in to your Customer Portal.</p>

  <div class="footer">MiniMorph Studios &bull; Muskegon, MI 49440 &bull; hello@minimorphstudios.net</div>
</body>
</html>`;
}

export function invoiceToBase64(html: string): string {
  return Buffer.from(html).toString("base64");
}
