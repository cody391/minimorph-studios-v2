export interface BuildLogEntry {
  timestamp: string;
  phase: string;
  status: "info" | "success" | "warning" | "error" | "fix";
  message: string;
  detail?: string;
}

export class BuildReporter {
  private reportId: number;
  private log: BuildLogEntry[] = [];
  private db: any;

  constructor(reportId: number, db: any) {
    this.reportId = reportId;
    this.db = db;
  }

  async info(phase: string, message: string, detail?: string) {
    this.addEntry("info", phase, message, detail);
    await this.flush();
  }

  async success(phase: string, message: string, detail?: string) {
    this.addEntry("success", phase, message, detail);
    await this.flush();
  }

  async warn(phase: string, message: string, detail?: string) {
    this.addEntry("warning", phase, message, detail);
    await this.flush();
  }

  async error(phase: string, message: string, detail?: string) {
    this.addEntry("error", phase, message, detail);
    await this.flush();
  }

  async fix(phase: string, message: string, detail?: string) {
    this.addEntry("fix", phase, message, detail);
    await this.flush();
  }

  private addEntry(status: BuildLogEntry["status"], phase: string, message: string, detail?: string) {
    this.log.push({ timestamp: new Date().toISOString(), phase, status, message, detail });
    console.log(`[BuildReport #${this.reportId}] [${phase.toUpperCase()}] [${status.toUpperCase()}] ${message}`);
  }

  private async flush() {
    try {
      const { siteBuildReports } = await import("../../drizzle/schema");
      const { eq } = await import("drizzle-orm");
      await this.db
        .update(siteBuildReports)
        .set({ buildLog: this.log as any, sbr_updatedAt: new Date() } as any)
        .where(eq(siteBuildReports.id, this.reportId));
    } catch (e: any) {
      console.error("[BuildReporter] Flush failed:", e.message);
    }
  }

  getLog(): BuildLogEntry[] {
    return this.log;
  }

  getReportId(): number {
    return this.reportId;
  }

  static async create(customerId: number, projectId: number, db: any): Promise<BuildReporter> {
    const { siteBuildReports } = await import("../../drizzle/schema");
    const [result] = await db.insert(siteBuildReports).values({
      customerId,
      projectId,
      status: "building",
      buildStartedAt: new Date(),
      buildLog: [] as any,
    });
    const reportId = (result as any).insertId || 0;
    console.log(`[BuildReporter] Created report #${reportId}`);
    return new BuildReporter(reportId, db);
  }

  async updateStatus(status: string, extra?: Record<string, any>) {
    try {
      const { siteBuildReports } = await import("../../drizzle/schema");
      const { eq } = await import("drizzle-orm");
      await this.db
        .update(siteBuildReports)
        .set({ status, ...(extra ?? {}), sbr_updatedAt: new Date() } as any)
        .where(eq(siteBuildReports.id, this.reportId));
    } catch (e: any) {
      console.error("[BuildReporter] Status update failed:", e.message);
    }
  }
}
