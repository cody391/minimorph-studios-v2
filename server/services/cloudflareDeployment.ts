import { createHash } from "crypto";
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

  // Build files map with SHA-256 hashes (required by CF Pages v2 Direct Upload API)
  const files: Record<string, { content: string; contentType: string; hash: string }> = {};

  for (const [pageName, html] of Object.entries(params.pages)) {
    const fileName = pageName === "index" ? "index.html" : `${pageName}.html`;
    files[`/${fileName}`] = {
      content: html,
      contentType: "text/html",
      hash: createHash("sha256").update(html).digest("hex"),
    };
  }

  // Add _redirects so clean URLs resolve without .html extension
  const redirectsContent = Object.keys(params.pages)
    .filter(p => p !== "index")
    .map(p => `/${p} /${p}.html 200`)
    .join("\n");
  if (redirectsContent) {
    files["/_redirects"] = {
      content: redirectsContent,
      contentType: "text/plain",
      hash: createHash("sha256").update(redirectsContent).digest("hex"),
    };
  }

  // Step 1: POST manifest to create the deployment
  const manifest: Record<string, string> = {};
  for (const [path, { hash }] of Object.entries(files)) {
    manifest[path] = hash;
  }
  const manifestForm = new FormData();
  manifestForm.append("manifest", JSON.stringify(manifest));

  const deployRes = await fetch(
    `${CF_API}/accounts/${ENV.cloudflareAccountId}/pages/projects/${params.projectName}/deployments`,
    {
      method: "POST",
      headers: { "Authorization": `Bearer ${ENV.cloudflareApiToken}` },
      body: manifestForm,
    }
  );

  const deployData = await deployRes.json() as any;
  if (!deployData.success) {
    throw new Error(`Cloudflare deployment failed: ${JSON.stringify(deployData.errors)}`);
  }

  const deploymentId: string = deployData.result?.id;
  const requiredHashes: string[] = deployData.result?.required_file_hashes ?? [];

  // Step 2: Upload each file that CF doesn't already have cached
  for (const [path, { content, contentType, hash }] of Object.entries(files)) {
    if (!requiredHashes.includes(hash)) continue;
    const uploadForm = new FormData();
    uploadForm.append(hash, new Blob([content], { type: contentType }), path.slice(1));
    const uploadRes = await fetch(
      `${CF_API}/accounts/${ENV.cloudflareAccountId}/pages/projects/${params.projectName}/deployments/${deploymentId}/files`,
      {
        method: "POST",
        headers: { "Authorization": `Bearer ${ENV.cloudflareApiToken}` },
        body: uploadForm,
      }
    );
    const uploadData = await uploadRes.json() as any;
    if (!uploadData.success) {
      throw new Error(`CF file upload failed for ${path}: ${JSON.stringify(uploadData.errors)}`);
    }
  }

  // Step 3: Finalize the deployment
  await fetch(
    `${CF_API}/accounts/${ENV.cloudflareAccountId}/pages/projects/${params.projectName}/deployments/${deploymentId}/finish`,
    {
      method: "POST",
      headers: { "Authorization": `Bearer ${ENV.cloudflareApiToken}` },
    }
  );

  return {
    success: true,
    deploymentUrl: deployData.result?.url || `https://${params.projectName}.pages.dev`,
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
