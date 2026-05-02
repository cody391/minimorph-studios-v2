import { ENV } from "../_core/env";

const CF_API = "https://api.cloudflare.com/client/v4";

export function getProjectName(businessName: string, projectId: number): string {
  const slug = businessName
    .toLowerCase()
    .replace(/[^a-z0-9]/g, "-")
    .replace(/-+/g, "-")
    .replace(/^-|-$/g, "")
    .slice(0, 40);
  return `mm-${slug}-${projectId}`;
}

export async function createPagesProject(params: {
  projectName: string;
  customerId: number;
}): Promise<{ success: boolean; projectName: string; url: string }> {
  if (!ENV.cloudflareApiToken || !ENV.cloudflareAccountId) {
    console.log("[Cloudflare] Not configured — skipping project creation");
    return { success: false, projectName: params.projectName, url: "" };
  }

  const res = await fetch(
    `${CF_API}/accounts/${ENV.cloudflareAccountId}/pages/projects`,
    {
      method: "POST",
      headers: {
        "Authorization": `Bearer ${ENV.cloudflareApiToken}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        name: params.projectName,
        production_branch: "main",
      }),
    }
  );

  const data = await res.json() as any;
  if (!data.success) {
    throw new Error(`Cloudflare project creation failed: ${JSON.stringify(data.errors)}`);
  }

  return {
    success: true,
    projectName: params.projectName,
    url: `https://${params.projectName}.pages.dev`,
  };
}

export async function deployToPages(params: {
  projectName: string;
  pages: Record<string, string>;
}): Promise<{ success: boolean; deploymentUrl: string }> {
  if (!ENV.cloudflareApiToken || !ENV.cloudflareAccountId) {
    return { success: false, deploymentUrl: "" };
  }

  const formData = new FormData();

  for (const [pageName, html] of Object.entries(params.pages)) {
    const fileName = pageName === "index" ? "index.html" : `${pageName}.html`;
    const blob = new Blob([html], { type: "text/html" });
    formData.append("files", blob, fileName);
  }

  // Add _redirects so page names resolve without .html extension
  const redirects = Object.keys(params.pages)
    .filter(p => p !== "index")
    .map(p => `/${p} /${p}.html 200`)
    .join("\n");
  formData.append("files", new Blob([redirects], { type: "text/plain" }), "_redirects");

  const res = await fetch(
    `${CF_API}/accounts/${ENV.cloudflareAccountId}/pages/projects/${params.projectName}/deployments`,
    {
      method: "POST",
      headers: { "Authorization": `Bearer ${ENV.cloudflareApiToken}` },
      body: formData,
    }
  );

  const data = await res.json() as any;
  if (!data.success) {
    throw new Error(`Cloudflare deployment failed: ${JSON.stringify(data.errors)}`);
  }

  return {
    success: true,
    deploymentUrl: data.result?.url || `https://${params.projectName}.pages.dev`,
  };
}

export async function addCustomDomain(params: {
  projectName: string;
  domain: string;
}): Promise<{ success: boolean; status: string }> {
  if (!ENV.cloudflareApiToken || !ENV.cloudflareAccountId) {
    return { success: false, status: "not_configured" };
  }

  const res = await fetch(
    `${CF_API}/accounts/${ENV.cloudflareAccountId}/pages/projects/${params.projectName}/domains`,
    {
      method: "POST",
      headers: {
        "Authorization": `Bearer ${ENV.cloudflareApiToken}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify({ name: params.domain }),
    }
  );

  const data = await res.json() as any;
  return {
    success: data.success,
    status: data.result?.status || "pending",
  };
}

export async function checkDomainStatus(params: {
  projectName: string;
  domain: string;
}): Promise<{ active: boolean; status: string }> {
  if (!ENV.cloudflareApiToken || !ENV.cloudflareAccountId) {
    return { active: false, status: "not_configured" };
  }

  const res = await fetch(
    `${CF_API}/accounts/${ENV.cloudflareAccountId}/pages/projects/${params.projectName}/domains`,
    { headers: { "Authorization": `Bearer ${ENV.cloudflareApiToken}` } }
  );

  const data = await res.json() as any;
  const domainRecord = data.result?.find((d: any) => d.name === params.domain);
  return {
    active: domainRecord?.status === "active",
    status: domainRecord?.status || "not_found",
  };
}

export async function redeployPages(params: {
  projectName: string;
  pages: Record<string, string>;
}): Promise<{ success: boolean }> {
  const result = await deployToPages(params);
  return { success: result.success };
}
