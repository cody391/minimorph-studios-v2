export function generateContractText(params: {
  customerName: string;
  businessName: string;
  packageTier: string;
  packagePrice: number;
  addons: { name: string; price: number }[];
  totalMonthly: number;
  domainName?: string;
  startDate: Date;
}): string {
  const endDate = new Date(params.startDate);
  endDate.setFullYear(endDate.getFullYear() + 1);

  const addonList = params.addons.length
    ? params.addons.map((a) => `  - ${a.name}: $${a.price}/mo`).join("\n")
    : "  - None";

  const tierLabel = params.packageTier.charAt(0).toUpperCase() + params.packageTier.slice(1);

  return `
WEBSITE DESIGN & SERVICES AGREEMENT
MiniMorph Studios

Customer: ${params.customerName}
Business: ${params.businessName}
Date: ${params.startDate.toLocaleDateString()}
Contract Term: 12 months (${params.startDate.toLocaleDateString()} – ${endDate.toLocaleDateString()})

SERVICES & INVESTMENT
Package: ${tierLabel} — $${params.packagePrice}/mo
Add-ons:
${addonList}
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
Total Monthly Investment: $${params.totalMonthly}/mo
${params.domainName ? `Domain: ${params.domainName} (included, managed by MiniMorph Studios)` : ""}

WHAT'S INCLUDED
✓ Professional website design and development
✓ Mobile-responsive design
✓ SSL certificate and security monitoring
✓ Hosting and infrastructure management
✓ DNS management${params.domainName ? ` and domain registration (${params.domainName})` : ""}
✓ Up to 3 rounds of revisions
✓ Ongoing maintenance and updates
✓ SEO optimization
✓ Monthly performance reporting
✓ Customer support

TERMS
1. TERM: This agreement is for a minimum of 12 months from the start date above.
2. PAYMENT: Monthly payments are due on the same date each month. First payment is due upon contract signing.
3. CANCELLATION: Either party may cancel with 30 days written notice after the initial 12-month term. Early termination during the initial term requires payment of remaining months.
4. REVISIONS: Up to 3 rounds of revisions are included. Additional revisions are $149/round.
5. OWNERSHIP: Upon completion and while the contract is active, the customer owns all custom content created for their site. MiniMorph Studios retains ownership of proprietary frameworks and tools.
6. HOSTING: MiniMorph Studios provides hosting, SSL, CDN, and domain management. Downtime SLA: 99.9% uptime.
7. SUPPORT: Support requests are answered within 1-2 business days (Priority Support subscribers within 4 hours).
8. INTELLECTUAL PROPERTY: Customer warrants they own or have rights to all content they provide.
9. LIMITATION OF LIABILITY: MiniMorph Studios is not liable for indirect or consequential damages.
10. GOVERNING LAW: This agreement is governed by the laws of Michigan, United States.

By proceeding with payment, the customer acknowledges they have read, understood, and agreed to these terms.

MiniMorph Studios
contact@minimorphstudios.com
`.trim();
}
