/**
 * Structured timing information for one traced async operation.
 *
 * This type is deliberately small for Day 33. It gives us enough information
 * to inspect model, retrieval, and agent latency without introducing an
 * external tracing platform yet.
 */
export type AsyncTrace = {
    /**
     * Human-readable operation name, for example `friend-context-agent`.
     */
    operationName: string;

    /**
     * Timestamp from immediately before the operation started.
     */
    startedAt: Date;

    /**
     * Timestamp from immediately after the operation finished or failed.
     */
    finishedAt: Date;

    /**
     * Total operation duration in milliseconds.
     */
    durationMs: number;

    /**
     * Whether the operation completed successfully.
     */
    success: boolean;

    /**
     * Error message recorded when the operation failed.
     *
     * This is intentionally only the message, not the full error object, so the
     * trace remains safe to log without accidentally serialising sensitive data.
     */
    errorMessage?: string;
};

/**
 * Result returned by `traceAsync`.
 *
 * The wrapped operation still returns its normal value, but we also return a
 * trace object so callers can inspect latency and success/failure metadata.
 */
export type TracedAsyncResult<Result> = {
    /**
     * Original value returned by the traced async operation.
     */
    result: Result;

    /**
     * Timing and success metadata for the operation.
     */
    trace: AsyncTrace;
};

/**
 * Runs an async operation and records basic timing metadata.
 *
 * This helper is intentionally provider-agnostic. It can wrap retrieval calls,
 * model calls, agent invocations, embedding generation, or future API handlers.
 *
 * @param operationName - Human-readable name for the operation being measured.
 * @param operation - Async function whose duration should be measured.
 * @returns The operation result plus timing metadata.
 * @throws Re-throws the original error after recording failure metadata.
 */
export async function traceAsync<Result>(
    operationName: string,
    operation: () => Promise<Result>,
): Promise<TracedAsyncResult<Result>> {
    const startedAt = new Date();

    try {
        const result = await operation();
        const finishedAt = new Date();

        return {
            result,
            trace: {
                operationName,
                startedAt,
                finishedAt,
                durationMs: finishedAt.getTime() - startedAt.getTime(),
                success: true,
            },
        };
    } catch (error: unknown) {
        const finishedAt = new Date();

        const errorMessage =
            error instanceof Error ? error.message : String(error);

        /**
         * We intentionally rethrow after building the failure trace.
         *
         * In a later step, we can pass this trace to a logger before throwing.
         * For now, the helper preserves normal error behaviour so wrapping an
         * operation does not silently hide failures.
         */
        throw Object.assign(error instanceof Error ? error : new Error(errorMessage), {
            trace: {
                operationName,
                startedAt,
                finishedAt,
                durationMs: finishedAt.getTime() - startedAt.getTime(),
                success: false,
                errorMessage,
            } satisfies AsyncTrace,
        });
    }
}