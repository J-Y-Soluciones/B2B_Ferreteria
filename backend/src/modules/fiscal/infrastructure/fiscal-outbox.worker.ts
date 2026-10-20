import { ProcessFiscalOutboxUseCase } from "../application/process-fiscal-outbox.use-case.js";

export class FiscalOutboxWorker {
  private timer: NodeJS.Timeout | null = null;
  private isProcessing = false;

  constructor(
    private readonly useCase: ProcessFiscalOutboxUseCase,
    private readonly pollingIntervalMs: number,
  ) {}

  public start(): void {
    if (this.timer) return;
    this.timer = setInterval(() => this.tick(), this.pollingIntervalMs);
  }

  public stop(): void {
    if (this.timer) {
      clearInterval(this.timer);
      this.timer = null;
    }
  }

  private async tick(): Promise<void> {
    if (this.isProcessing) return;
    this.isProcessing = true;

    try {
      await this.useCase.execute();
    } catch (err: unknown) {
      console.error("Fiscal Worker execution error:", err);
    } finally {
      this.isProcessing = false;
    }
  }
}
