/**
 * Contact Enrichment Service
 * 
 * Multi-source contact enrichment with fallback chain:
 * 1. Apollo.io — Best for B2B contacts, org enrichment, decision-maker discovery
 * 2. Hunter.io — Best for finding email addresses from domain names
 * 3. LLM Inference — Use AI to guess email patterns and find public info
 * 4. Manual Flag — Mark for manual research if all else fails
 * 
 * The AI agent needs rich contact data BEFORE making first contact so outreach
 * is personalized and effective.
 */

import { ENV } from "../_core/env";
import { invokeLLM } from "../_core/llm";
import { getDb } from "../db";
import { scrapedBusinesses } from "../../drizzle/schema";
import { eq } from "drizzle-orm";
import { recordCost, calculateAiCost, COSTS } from "./costTracker";

// ─── Types ───

export interface EnrichedContact {
  ownerName: string | null;
  ownerTitle: string | null;
  ownerEmail: string | null;
  ownerPhone: string | null;
  ownerLinkedIn: string | null;
  companySize: string | null;
  annualRevenue: string | null;
  yearFounded: string | null;
  industry: string | null;
  technologies: string[];
  socialProfiles: Record<string, string>;
  enrichmentSource: "apollo" | "hunter" | "llm" | "manual" | "combined";
  confidence: number; // 0-100
  rawData: Record<string, any>;
}

export interface EnrichmentResult {
  businessId: number;
  businessName: string;
  contact: EnrichedContact;
  enrichedAt: Date;
  sourcesAttempted: string[];
  sourcesSucceeded: string[];
}

// ─── Apollo.io Integration ───

async function enrichViaApollo(
  businessName: string,
  domain: string | null,
  location: string | null
): Promise<Partial<EnrichedContact> | null> {
  if (!ENV.apolloApiKey) return null;

  try {
    // Step 1: Organization enrichment
    let orgData: any = null;
    if (domain) {
      const orgRes = await fetch("https://api.apollo.io/api/v1/organizations/enrich", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          "X-Api-Key": ENV.apolloApiKey,
        },
        body: JSON.stringify({ domain }),
      });
      if (orgRes.ok) {
        orgData = await orgRes.json();
      }
    }

    // Step 2: People search — find decision makers at this company
    const peopleSearchBody: any = {
      q_organization_name: businessName,
      person_titles: ["owner", "founder", "ceo", "president", "manager", "director"],
      page: 1,
      per_page: 3,
    };
    if (location) {
      peopleSearchBody.person_locations = [location];
    }

    const peopleRes = await fetch("https://api.apollo.io/api/v1/mixed_people/search", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        "X-Api-Key": ENV.apolloApiKey,
      },
      body: JSON.stringify(peopleSearchBody),
    });

    let personData: any = null;
    if (peopleRes.ok) {
      const result = await peopleRes.json();
      if (result.people && result.people.length > 0) {
        personData = result.people[0]; // Best match
      }
    }

    if (!personData && !orgData) return null;

    const org = orgData?.organization || {};
    return {
      ownerName: personData ? `${personData.first_name || ""} ${personData.last_name || ""}`.trim() : null,
      ownerTitle: personData?.title || null,
      ownerEmail: personData?.email || null,
      ownerPhone: personData?.phone_numbers?.[0]?.sanitized_number || null,
      ownerLinkedIn: personData?.linkedin_url || null,
      companySize: org.estimated_num_employees
        ? `${org.estimated_num_employees} employees`
        : null,
      annualRevenue: org.annual_revenue_printed || null,
      yearFounded: org.founded_year ? String(org.founded_year) : null,
      industry: org.industry || null,
      technologies: org.current_technologies?.map((t: any) => t.name) || [],
      socialProfiles: {
        ...(org.facebook_url ? { facebook: org.facebook_url } : {}),
        ...(org.twitter_url ? { twitter: org.twitter_url } : {}),
        ...(org.linkedin_url ? { linkedin: org.linkedin_url } : {}),
      },
      enrichmentSource: "apollo",
      confidence: personData?.email ? 85 : 50,
      rawData: { org: orgData, person: personData },
    };
  } catch (err) {
    console.error("[ContactEnrichment] Apollo error:", err);
    return null;
  }
}

// ─── Hunter.io Integration ───

async function enrichViaHunter(
  domain: string | null,
  ownerName: string | null
): Promise<Partial<EnrichedContact> | null> {
  if (!ENV.hunterApiKey || !domain) return null;

  try {
    // Step 1: Domain search — find all emails at this domain
    const domainSearchUrl = new URL("https://api.hunter.io/v2/domain-search");
    domainSearchUrl.searchParams.set("domain", domain);
    domainSearchUrl.searchParams.set("api_key", ENV.hunterApiKey);
    domainSearchUrl.searchParams.set("limit", "5");
    // Prioritize senior roles
    domainSearchUrl.searchParams.set("seniority", "senior,executive");

    const domainRes = await fetch(domainSearchUrl.toString());
    let domainData: any = null;
    if (domainRes.ok) {
      domainData = await domainRes.json();
    }

    // Step 2: If we have a name, try email finder
    let emailFinderData: any = null;
    if (ownerName) {
      const nameParts = ownerName.split(" ");
      const firstName = nameParts[0] || "";
      const lastName = nameParts.slice(1).join(" ") || "";

      if (firstName && lastName) {
        const finderUrl = new URL("https://api.hunter.io/v2/email-finder");
        finderUrl.searchParams.set("domain", domain);
        finderUrl.searchParams.set("first_name", firstName);
        finderUrl.searchParams.set("last_name", lastName);
        finderUrl.searchParams.set("api_key", ENV.hunterApiKey);

        const finderRes = await fetch(finderUrl.toString());
        if (finderRes.ok) {
          emailFinderData = await finderRes.json();
        }
      }
    }

    // Extract best contact from results
    const emails = domainData?.data?.emails || [];
    const bestEmail = emailFinderData?.data?.email || emails[0]?.value || null;
    const bestPerson = emails[0] || {};

    if (!bestEmail && !bestPerson.value) return null;

    return {
      ownerName: ownerName || (bestPerson.first_name && bestPerson.last_name
        ? `${bestPerson.first_name} ${bestPerson.last_name}`
        : null),
      ownerTitle: bestPerson.position || null,
      ownerEmail: bestEmail || bestPerson.value || null,
      ownerLinkedIn: bestPerson.linkedin || null,
      enrichmentSource: "hunter",
      confidence: emailFinderData?.data?.score || (bestEmail ? 70 : 40),
      rawData: { domainSearch: domainData, emailFinder: emailFinderData },
    };
  } catch (err) {
    console.error("[ContactEnrichment] Hunter error:", err);
    return null;
  }
}

// ─── LLM Inference Fallback ───

async function enrichViaLLM(
  businessName: string,
  address: string | null,
  phone: string | null,
  website: string | null,
  category: string | null,
  googleRating: number | null,
  googleReviewCount: number | null
): Promise<Partial<EnrichedContact> | null> {
  try {
    const prompt = `You are a business intelligence analyst. Based on the following business information, infer what you can about the business owner and decision-maker. Be conservative — only provide information you're reasonably confident about.

Business: ${businessName}
${address ? `Address: ${address}` : ""}
${phone ? `Phone: ${phone}` : ""}
${website ? `Website: ${website}` : "No website"}
${category ? `Category: ${category}` : ""}
${googleRating ? `Google Rating: ${googleRating}/5 (${googleReviewCount} reviews)` : ""}

Based on the business type, location, and size indicators, provide your best assessment:
1. What is the likely owner title? (e.g., Owner, Manager, President)
2. What is the estimated company size?
3. What industry category best fits?
4. What email pattern would they likely use? (e.g., info@, owner@, firstname@)
5. What are the most likely pain points for a business like this without a professional website?
6. What would be the most compelling pitch angle for selling them a website?

Return JSON only.`;

    const response = await invokeLLM({
      messages: [
        { role: "system", content: "You are a business intelligence analyst. Return valid JSON only." },
        { role: "user", content: prompt },
      ],
      response_format: {
        type: "json_schema",
        json_schema: {
          name: "business_intelligence",
          strict: true,
          schema: {
            type: "object",
            properties: {
              likelyOwnerTitle: { type: "string", description: "Most likely title of the decision maker" },
              estimatedSize: { type: "string", description: "Estimated company size (e.g., 1-5, 5-20, 20-50)" },
              industry: { type: "string", description: "Industry category" },
              likelyEmailPattern: { type: "string", description: "Most likely email pattern (e.g., info@domain.com)" },
              topPainPoints: {
                type: "array",
                items: { type: "string" },
                description: "Top 3 pain points for this business without a website",
              },
              bestPitchAngle: { type: "string", description: "Most compelling pitch angle for selling a website" },
              estimatedRevenue: { type: "string", description: "Rough revenue estimate based on indicators" },
              competitivePosition: { type: "string", description: "How they likely compare to competitors" },
            },
            required: [
              "likelyOwnerTitle", "estimatedSize", "industry",
              "likelyEmailPattern", "topPainPoints", "bestPitchAngle",
              "estimatedRevenue", "competitivePosition",
            ],
            additionalProperties: false,
          },
        },
      },
    });

    const content = response.choices?.[0]?.message?.content;
    if (!content) return null;

    const analysis = JSON.parse(content as string);

    // Generate likely email if we have a domain
    let inferredEmail: string | null = null;
    if (website) {
      try {
        const domain = new URL(website.startsWith("http") ? website : `https://${website}`).hostname;
        inferredEmail = analysis.likelyEmailPattern.includes("@")
          ? analysis.likelyEmailPattern
          : `${analysis.likelyEmailPattern}@${domain}`;
      } catch { /* ignore URL parse errors */ }
    }

    return {
      ownerTitle: analysis.likelyOwnerTitle,
      companySize: analysis.estimatedSize,
      industry: analysis.industry,
      ownerEmail: inferredEmail,
      annualRevenue: analysis.estimatedRevenue,
      enrichmentSource: "llm",
      confidence: 30, // Low confidence for LLM-inferred data
      rawData: {
        analysis,
        painPoints: analysis.topPainPoints,
        bestPitchAngle: analysis.bestPitchAngle,
        competitivePosition: analysis.competitivePosition,
      },
    };
  } catch (err) {
    console.error("[ContactEnrichment] LLM inference error:", err);
    return null;
  }
}

// ─── Merge Results from Multiple Sources ───

function mergeEnrichmentResults(results: Array<Partial<EnrichedContact> | null>): EnrichedContact {
  const merged: EnrichedContact = {
    ownerName: null,
    ownerTitle: null,
    ownerEmail: null,
    ownerPhone: null,
    ownerLinkedIn: null,
    companySize: null,
    annualRevenue: null,
    yearFounded: null,
    industry: null,
    technologies: [],
    socialProfiles: {},
    enrichmentSource: "combined",
    confidence: 0,
    rawData: {},
  };

  // Priority: Apollo > Hunter > LLM (higher confidence sources override)
  for (const result of results) {
    if (!result) continue;

    // Only override if the new value is non-null and current is null
    if (result.ownerName && !merged.ownerName) merged.ownerName = result.ownerName;
    if (result.ownerTitle && !merged.ownerTitle) merged.ownerTitle = result.ownerTitle;
    if (result.ownerEmail && !merged.ownerEmail) merged.ownerEmail = result.ownerEmail;
    if (result.ownerPhone && !merged.ownerPhone) merged.ownerPhone = result.ownerPhone;
    if (result.ownerLinkedIn && !merged.ownerLinkedIn) merged.ownerLinkedIn = result.ownerLinkedIn;
    if (result.companySize && !merged.companySize) merged.companySize = result.companySize;
    if (result.annualRevenue && !merged.annualRevenue) merged.annualRevenue = result.annualRevenue;
    if (result.yearFounded && !merged.yearFounded) merged.yearFounded = result.yearFounded;
    if (result.industry && !merged.industry) merged.industry = result.industry;
    if (result.technologies && result.technologies.length > 0) {
      merged.technologies = Array.from(new Set([...merged.technologies, ...result.technologies]));
    }
    if (result.socialProfiles) {
      merged.socialProfiles = { ...merged.socialProfiles, ...result.socialProfiles };
    }
    // Take highest confidence
    if (result.confidence && result.confidence > merged.confidence) {
      merged.confidence = result.confidence;
    }
    // Merge raw data
    if (result.rawData) {
      merged.rawData = { ...merged.rawData, [result.enrichmentSource || "unknown"]: result.rawData };
    }
  }

  // If only one source succeeded, use that source name
  const sources = results.filter(r => r !== null);
  if (sources.length === 1 && sources[0]?.enrichmentSource) {
    merged.enrichmentSource = sources[0].enrichmentSource;
  }

  return merged;
}

// ─── Main Enrichment Function ───

/**
 * Enrich a scraped business with contact information using the fallback chain:
 * Apollo → Hunter → LLM → Manual flag
 */
export async function enrichBusinessContact(businessId: number): Promise<EnrichmentResult | null> {
  const db = (await getDb())!;

  // Get business data
  const [business] = await db
    .select()
    .from(scrapedBusinesses)
    .where(eq(scrapedBusinesses.id, businessId))
    .limit(1);

  if (!business) {
    console.error(`[ContactEnrichment] Business ${businessId} not found`);
    return null;
  }

  console.log(`[ContactEnrichment] Enriching: ${business.businessName}`);

  const sourcesAttempted: string[] = [];
  const sourcesSucceeded: string[] = [];
  const results: Array<Partial<EnrichedContact> | null> = [];

  // Extract domain from website if available
  let domain: string | null = null;
  if (business.website) {
    try {
      domain = new URL(
        business.website.startsWith("http") ? business.website : `https://${business.website}`
      ).hostname;
    } catch { /* ignore */ }
  }

  // Cost gate: only run expensive Apollo/Hunter for well-qualified leads
  // LLM inference always runs (no per-call API cost beyond our Anthropic usage)
  const qualScore = business.websiteScore !== null && business.websiteScore !== undefined
    ? (business.hasWebsite ? 50 + (100 - business.websiteScore) / 2 : 70)
    : (business.hasWebsite ? 50 : 70);
  const shouldEnrichExpensive = qualScore >= 65;

  // Steps 1-2: Apollo + Hunter — only for well-qualified leads (cost gate)
  let apolloResult: Partial<EnrichedContact> | null = null;
  if (shouldEnrichExpensive) {
    sourcesAttempted.push("apollo");
    apolloResult = await enrichViaApollo(business.businessName, domain, business.address);
    if (apolloResult) {
      sourcesSucceeded.push("apollo");
      results.push(apolloResult);
      recordCost({ costType: "enrichment", amountCents: COSTS.APOLLO_ENRICH, scrapedBusinessId: businessId, description: "Apollo.io organization enrichment" });
      console.log(`[ContactEnrichment] Apollo found data for ${business.businessName}`);
    }

    if (domain && !apolloResult?.ownerEmail) {
      sourcesAttempted.push("hunter");
      const hunterResult = await enrichViaHunter(domain, apolloResult?.ownerName || null);
      if (hunterResult) {
        sourcesSucceeded.push("hunter");
        results.push(hunterResult);
        recordCost({ costType: "enrichment", amountCents: COSTS.HUNTER_EMAIL, scrapedBusinessId: businessId, description: "Hunter.io email discovery" });
        console.log(`[ContactEnrichment] Hunter found email for ${business.businessName}`);
      }
    }
  } else {
    console.log(`[ContactEnrichment] Skipping Apollo/Hunter for ${business.businessName} (score ${qualScore.toFixed(0)} < 65)`);
  }

  // Step 3: LLM inference (always run for pain points and pitch angle)
  sourcesAttempted.push("llm");
  const llmResult = await enrichViaLLM(
    business.businessName,
    business.address,
    business.phone,
    business.website,
    business.businessTypes?.[0] || null,
    business.rating ? Number(business.rating) : null,
    business.reviewCount
  );
  if (llmResult) {
    sourcesSucceeded.push("llm");
    results.push(llmResult);
    // Record AI cost — use rough estimate since enrichViaLLM doesn't return token counts
    recordCost({ costType: "ai_generation", amountCents: 2, scrapedBusinessId: businessId, description: "AI enrichment dossier" });
  }

  // Merge all results
  const contact = mergeEnrichmentResults(results);

  // If we got nothing useful, flag for manual research
  if (!contact.ownerEmail && !contact.ownerPhone && !contact.ownerName) {
    contact.enrichmentSource = "manual";
    contact.confidence = 0;
  }

  // Store enrichment data back to the business record
  const enrichmentData = {
    ownerName: contact.ownerName,
    ownerTitle: contact.ownerTitle,
    ownerEmail: contact.ownerEmail,
    ownerPhone: contact.ownerPhone,
    ownerLinkedIn: contact.ownerLinkedIn,
    companySize: contact.companySize,
    annualRevenue: contact.annualRevenue,
    yearFounded: contact.yearFounded,
    industry: contact.industry,
    technologies: contact.technologies,
    socialProfiles: contact.socialProfiles,
    painPoints: contact.rawData?.llm?.painPoints || [],
    bestPitchAngle: contact.rawData?.llm?.bestPitchAngle || "",
    competitivePosition: contact.rawData?.llm?.competitivePosition || "",
    enrichmentSource: contact.enrichmentSource,
    confidence: contact.confidence,
    enrichedAt: new Date().toISOString(),
  };

  await db
    .update(scrapedBusinesses)
    .set({
      enrichmentData: JSON.stringify(enrichmentData),
      status: contact.confidence >= 50 ? "enriched" : "scoring" as const,
    })
    .where(eq(scrapedBusinesses.id, businessId));

  return {
    businessId,
    businessName: business.businessName,
    contact,
    enrichedAt: new Date(),
    sourcesAttempted,
    sourcesSucceeded,
  };
}

/**
 * Batch enrich businesses that haven't been contact-enriched yet
 */
export async function batchEnrichContacts(limit = 10): Promise<{
  total: number;
  enriched: number;
  partial: number;
  failed: number;
}> {
  const db = (await getDb())!;

  // Find businesses that need contact enrichment
  // (enriched by our system but not contact-enriched)
  const businesses = await db
    .select({ id: scrapedBusinesses.id })
    .from(scrapedBusinesses)
    .where(eq(scrapedBusinesses.status, "scraped"))
    .limit(limit);

  const stats = { total: businesses.length, enriched: 0, partial: 0, failed: 0 };

  for (const biz of businesses) {
    try {
      const result = await enrichBusinessContact(biz.id);
      if (result) {
        if (result.contact.confidence >= 50) {
          stats.enriched++;
        } else {
          stats.partial++;
        }
      } else {
        stats.failed++;
      }
    } catch (err) {
      console.error(`[ContactEnrichment] Failed to enrich business ${biz.id}:`, err);
      stats.failed++;
    }

    // Rate limit: 500ms between enrichments
    await new Promise(resolve => setTimeout(resolve, 500));
  }

  console.log(`[ContactEnrichment] Batch complete: ${stats.enriched} enriched, ${stats.partial} partial, ${stats.failed} failed`);
  return stats;
}

/**
 * Check which enrichment APIs are configured
 */
export function getEnrichmentStatus(): {
  apollo: boolean;
  hunter: boolean;
  llm: boolean;
  recommendation: string;
} {
  const apollo = !!ENV.apolloApiKey;
  const hunter = !!ENV.hunterApiKey;

  let recommendation = "";
  if (!apollo && !hunter) {
    recommendation = "No contact enrichment APIs configured. The system will use LLM inference only (lower quality). Add Apollo.io or Hunter.io API keys in Settings for much better contact data.";
  } else if (apollo && !hunter) {
    recommendation = "Apollo.io configured. Add Hunter.io for better email discovery as a fallback.";
  } else if (!apollo && hunter) {
    recommendation = "Hunter.io configured. Add Apollo.io for richer company and people data.";
  } else {
    recommendation = "Full enrichment chain configured. Apollo + Hunter + LLM inference active.";
  }

  return { apollo, hunter, llm: true, recommendation };
}
