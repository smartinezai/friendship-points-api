import { describe, expect, it } from "vitest";
import { traceAsync } from "../ai/tracing/traceAsync.js";

describe("traceAsync test group", () => {
    it("test case that returns the async result with success trace metadata", async () => {
        const tracedResult = await traceAsync("test-operation", async () => {
            return "completed";
        });

        expect(tracedResult.result).toBe("completed");
        expect(tracedResult.trace.operationName).toBe("test-operation");
        expect(tracedResult.trace.success).toBe(true);
        expect(tracedResult.trace.durationMs).toBeGreaterThanOrEqual(0);
        expect(tracedResult.trace.startedAt).toBeInstanceOf(Date);
        expect(tracedResult.trace.finishedAt).toBeInstanceOf(Date);
    });

    it("test case that rethrows failures with trace metadata attached", async () => {
        expect.assertions(5);

        try {
            await traceAsync("failing-operation", async () => {
                throw new Error("controlled failure");
            });
        } catch (error: unknown) {
            expect(error).toBeInstanceOf(Error);

            const tracedError = error as Error & {
                trace?: {
                    operationName: string;
                    success: boolean;
                    errorMessage?: string;
                    durationMs: number;
                };
            };

            expect(tracedError.trace?.operationName).toBe(
                "failing-operation",
            );
            expect(tracedError.trace?.success).toBe(false);
            expect(tracedError.trace?.errorMessage).toBe(
                "controlled failure",
            );
            expect(tracedError.trace?.durationMs).toBeGreaterThanOrEqual(0);
        }
    });
});