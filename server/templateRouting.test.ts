import { describe, expect, it } from "vitest";
import { selectTemplate } from "./services/templateEngine";

describe("selectTemplate — service/agency routing", () => {
  // ── Service / professional (default tone) ───────────────────────────────────
  it("routes 'service' to service/professional.html", () => {
    expect(selectTemplate("service", "professional")).toBe("service/professional.html");
  });

  it("routes 'service business' to service/professional.html", () => {
    expect(selectTemplate("service business", "clean modern")).toBe("service/professional.html");
  });

  it("routes 'professional service' to service/professional.html", () => {
    expect(selectTemplate("professional service", "minimal")).toBe("service/professional.html");
  });

  it("routes 'professional services' to service/professional.html", () => {
    expect(selectTemplate("professional services", "bold")).toBe("service/professional.html");
  });

  it("routes 'agency' to service/professional.html", () => {
    expect(selectTemplate("agency", "professional")).toBe("service/professional.html");
  });

  it("routes 'marketing agency' to service/professional.html", () => {
    expect(selectTemplate("marketing agency", "bold dark")).toBe("service/professional.html");
  });

  it("routes 'design agency' (via includes) to service/professional.html", () => {
    expect(selectTemplate("design agency", "minimal")).toBe("service/professional.html");
  });

  it("routes 'web design' to service/professional.html", () => {
    expect(selectTemplate("web design", "professional")).toBe("service/professional.html");
  });

  it("routes 'website design' to service/professional.html", () => {
    expect(selectTemplate("website design", "clean")).toBe("service/professional.html");
  });

  it("routes 'marketing' to service/professional.html", () => {
    expect(selectTemplate("marketing", "professional")).toBe("service/professional.html");
  });

  it("routes 'consulting' to service/professional.html", () => {
    expect(selectTemplate("consulting", "professional")).toBe("service/professional.html");
  });

  it("routes 'consultant' to service/professional.html", () => {
    expect(selectTemplate("consultant", "clean modern")).toBe("service/professional.html");
  });

  it("routes 'management consulting' (via includes) to service/professional.html", () => {
    expect(selectTemplate("management consulting", "corporate")).toBe("service/professional.html");
  });

  it("routes 'technology' to service/professional.html", () => {
    expect(selectTemplate("technology", "modern")).toBe("service/professional.html");
  });

  it("routes 'saas' to service/professional.html", () => {
    expect(selectTemplate("saas", "clean")).toBe("service/professional.html");
  });

  it("routes 'software' to service/professional.html", () => {
    expect(selectTemplate("software", "minimal")).toBe("service/professional.html");
  });

  it("routes 'cleaning' to service/professional.html", () => {
    expect(selectTemplate("cleaning", "professional")).toBe("service/professional.html");
  });

  it("routes 'landscaping' to service/professional.html", () => {
    expect(selectTemplate("landscaping", "professional")).toBe("service/professional.html");
  });

  it("routes 'handyman' to service/professional.html", () => {
    expect(selectTemplate("handyman", "professional")).toBe("service/professional.html");
  });

  // ── Service / friendly-local (warm/local tone) ──────────────────────────────
  it("routes 'service' + warm tone to service/friendly-local.html", () => {
    expect(selectTemplate("service", "warm friendly")).toBe("service/friendly-local.html");
  });

  it("routes 'cleaning service' + local tone to service/friendly-local.html", () => {
    expect(selectTemplate("cleaning service", "local neighborhood")).toBe("service/friendly-local.html");
  });

  it("routes 'lawn care' + casual tone to service/friendly-local.html", () => {
    expect(selectTemplate("lawn care", "casual friendly")).toBe("service/friendly-local.html");
  });

  it("routes 'handyman service' + community tone to service/friendly-local.html", () => {
    expect(selectTemplate("handyman service", "community focused")).toBe("service/friendly-local.html");
  });

  // ── Existing industry mappings must be preserved ────────────────────────────
  it("still routes 'contractor' to contractor template", () => {
    expect(selectTemplate("contractor", "professional")).toBe("contractor/light-professional.html");
  });

  it("still routes 'roofing' to dark contractor template (bold tone)", () => {
    expect(selectTemplate("roofing", "bold dark industrial")).toBe("contractor/dark-industrial.html");
  });

  it("still routes 'plumbing' to contractor template", () => {
    expect(selectTemplate("plumbing", "professional")).toBe("contractor/light-professional.html");
  });

  it("still routes 'restaurant' to restaurant template", () => {
    expect(selectTemplate("restaurant", "warm casual")).toBe("restaurant/warm-casual.html");
  });

  it("still routes 'gym' to gym template", () => {
    expect(selectTemplate("gym", "clean modern")).toBe("gym/clean-modern.html");
  });

  it("still routes 'salon' to salon template", () => {
    expect(selectTemplate("salon", "warm boutique")).toBe("salon/warm-boutique.html");
  });

  it("still routes 'salon' + luxury tone to editorial template", () => {
    expect(selectTemplate("salon", "luxury editorial")).toBe("salon/editorial-luxury.html");
  });

  it("still routes 'boutique' to boutique template", () => {
    expect(selectTemplate("boutique", "warm lifestyle")).toBe("boutique/warm-lifestyle.html");
  });

  it("still routes 'coffee' to coffee template", () => {
    expect(selectTemplate("coffee", "cozy neighborhood")).toBe("coffee/cozy-neighborhood.html");
  });

  // ── Ecommerce must NOT be caught by service branch ──────────────────────────
  it("does NOT route 'ecommerce' to service template", () => {
    expect(selectTemplate("ecommerce", "professional")).toBe("ecommerce/catalog.html");
  });

  it("does NOT route 'online store' to service template", () => {
    expect(selectTemplate("online store", "professional")).toBe("ecommerce/catalog.html");
  });

  it("does NOT route 'marketplace' to service template", () => {
    expect(selectTemplate("marketplace", "professional")).toBe("ecommerce/catalog.html");
  });

  // ── Unknown types still fall to LLM fallback ───────────────────────────────
  it("returns null for unknown types (LLM fallback)", () => {
    expect(selectTemplate("artisan woodworking studio", "rustic")).toBeNull();
  });

  it("returns null for empty type", () => {
    expect(selectTemplate("", "professional")).toBeNull();
  });
});
