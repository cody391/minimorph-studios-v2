// Single source of truth for Cloudflare nameservers.
// IMPORTANT: These must match the nameservers assigned to the Cloudflare zone
// used for customer domains. Verify against your Cloudflare account DNS dashboard
// before deploying. All customer-facing DNS instructions and Namecheap domain
// registrations use this pair.
export const CLOUDFLARE_NS1 = "vera.ns.cloudflare.com";
export const CLOUDFLARE_NS2 = "wade.ns.cloudflare.com";
