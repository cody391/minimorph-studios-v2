import { execFile } from "child_process";
import { promisify } from "util";
import fs from "fs";
import os from "os";
import path from "path";
import { ENV } from "../_core/env";

const execFileAsync = promisify(execFile);

const CF_API = "https://api.cloudflare.com/client/v4"; // used for project create, domain management

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

  const tmpDir = fs.mkdtempSync(path.join(os.tmpdir(), "cf-pages-"));
  try {
    const htmlPages: string[] = [];
    for (const [pageName, content] of Object.entries(params.pages)) {
      // Files with explicit extensions (sitemap.xml, robots.txt) are written as-is
      const hasExt = /\.[a-z]{2,4}$/.test(pageName);
      const fileName = hasExt
        ? pageName
        : pageName === "index"
          ? "index.html"
          : `${pageName}.html`;
      fs.writeFileSync(path.join(tmpDir, fileName), content, "utf-8");
      if (!hasExt) htmlPages.push(pageName);
    }

    // Add _redirects so clean URLs resolve without .html extension
    const redirectsContent = htmlPages
      .filter(p => p !== "index")
      .map(p => `/${p} /${p}.html 200`)
      .join("\n");
    if (redirectsContent) {
      fs.writeFileSync(path.join(tmpDir, "_redirects"), redirectsContent, "utf-8");
    }

    const { stdout, stderr } = await execFileAsync(
      "npx",
      ["wrangler@latest", "pages", "deploy", tmpDir, "--project-name", params.projectName, "--branch", "main"],
      {
        env: {
          ...process.env,
          CLOUDFLARE_API_TOKEN: ENV.cloudflareApiToken,
          CLOUDFLARE_ACCOUNT_ID: ENV.cloudflareAccountId,
        },
        timeout: 180000,
      }
    );

    const output = stdout + stderr;
    const match = output.match(/https:\/\/[a-f0-9]+\.[^.\s]+\.pages\.dev/);
    const deploymentUrl = match ? match[0] : `https://${params.projectName}.pages.dev`;
    return { success: true, deploymentUrl };
  } finally {
    fs.rmSync(tmpDir, { recursive: true, force: true });
  }
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
