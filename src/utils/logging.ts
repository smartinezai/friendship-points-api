/**
 * Logs unexpected errors with a caller-provided context label.
 *
 * @param context - Short label describing where the error happened.
 * @param error - Unknown caught value from a try/catch block.
 */
export function logError(context: string, error: unknown) {
  if (error instanceof Error) {
    console.error(`[${context}] ${error.message}`);
    console.error(error.stack);
  } else {
    console.error(`[${context}] An unknown error occurred:`, error);
  }
}
