import { ENV } from "../_core/env";

const NAMECHEAP_API = "https://api.namecheap.com/xml.response";

export async function checkDomainAvailability(domain: string): Promise<{
  available: boolean;
  price?: number;
  domain: string;
}> {
  if (!ENV.namecheapApiKey) {
    return { available: true, price: 12.98, domain };
  }
  try {
    const params = new URLSearchParams({
      ApiUser: ENV.namecheapApiUser,
      ApiKey: ENV.namecheapApiKey,
      UserName: ENV.namecheapApiUser,
      ClientIp: ENV.namecheapClientIp,
      Command: "namecheap.domains.check",
      DomainList: domain,
    });
    const res = await fetch(`${NAMECHEAP_API}?${params}`);
    const text = await res.text();
    const available = text.includes('Available="true"');
    return { available, price: 12.98, domain };
  } catch {
    return { available: false, domain };
  }
}

export async function suggestDomains(businessName: string, keywords: string[] = []): Promise<string[]> {
  const clean = businessName.toLowerCase().replace(/[^a-z0-9]/g, "");
  const suggestions = [
    `${clean}.com`,
    `${clean}co.com`,
    `get${clean}.com`,
    `${clean}hq.com`,
    `${clean}studio.com`,
    `${clean}pro.com`,
    `my${clean}.com`,
    `the${clean}.com`,
    ...keywords.map((k) => `${clean}${k.toLowerCase()}.com`),
  ];
  return suggestions.slice(0, 8);
}

export async function registerDomain(
  domain: string,
  customerInfo: {
    firstName: string;
    lastName: string;
    email: string;
    phone: string;
    address: string;
    city: string;
    state: string;
    zip: string;
    country: string;
  }
): Promise<{ success: boolean; error?: string }> {
  if (!ENV.namecheapApiKey) {
    console.log(`[DomainService] Mock registration for ${domain}`);
    return { success: true };
  }
  try {
    const params = new URLSearchParams({
      ApiUser: ENV.namecheapApiUser,
      ApiKey: ENV.namecheapApiKey,
      UserName: ENV.namecheapApiUser,
      ClientIp: ENV.namecheapClientIp,
      Command: "namecheap.domains.create",
      DomainName: domain,
      Years: "1",
      RegistrantFirstName: customerInfo.firstName,
      RegistrantLastName: customerInfo.lastName,
      RegistrantEmailAddress: customerInfo.email,
      RegistrantPhone: customerInfo.phone,
      RegistrantAddress1: customerInfo.address,
      RegistrantCity: customerInfo.city,
      RegistrantStateProvince: customerInfo.state,
      RegistrantPostalCode: customerInfo.zip,
      RegistrantCountry: customerInfo.country,
      TechFirstName: customerInfo.firstName,
      TechLastName: customerInfo.lastName,
      TechEmailAddress: customerInfo.email,
      TechPhone: customerInfo.phone,
      TechAddress1: customerInfo.address,
      TechCity: customerInfo.city,
      TechStateProvince: customerInfo.state,
      TechPostalCode: customerInfo.zip,
      TechCountry: customerInfo.country,
      AdminFirstName: customerInfo.firstName,
      AdminLastName: customerInfo.lastName,
      AdminEmailAddress: customerInfo.email,
      AdminPhone: customerInfo.phone,
      AdminAddress1: customerInfo.address,
      AdminCity: customerInfo.city,
      AdminStateProvince: customerInfo.state,
      AdminPostalCode: customerInfo.zip,
      AdminCountry: customerInfo.country,
      AuxBillingFirstName: customerInfo.firstName,
      AuxBillingLastName: customerInfo.lastName,
      AuxBillingEmailAddress: customerInfo.email,
      AuxBillingPhone: customerInfo.phone,
      AuxBillingAddress1: customerInfo.address,
      AuxBillingCity: customerInfo.city,
      AuxBillingStateProvince: customerInfo.state,
      AuxBillingPostalCode: customerInfo.zip,
      AuxBillingCountry: customerInfo.country,
      Nameservers: "dns1.namecheaphosting.com,dns2.namecheaphosting.com",
      AddFreeWhoisguard: "yes",
      WGEnabled: "yes",
    });
    const res = await fetch(`${NAMECHEAP_API}?${params}`);
    const text = await res.text();
    const success = text.includes('IsSuccess="true"') || text.includes('Registered="true"');
    return { success };
  } catch (err: any) {
    return { success: false, error: err.message };
  }
}
