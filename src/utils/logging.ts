export function logError(context: string, error: unknown) {
  if (error instanceof Error) {
    console.error(`[${context}] ${error.message}`);
    console.error(error.stack); //error.stack means the stack trace of the error, which provides information about where the error occurred in the code. It can be helpful for debugging purposes to understand the sequence of function calls that led to the error.
  } else {
    console.error(`[${context}] An unknown error occurred:`, error);
  }
}