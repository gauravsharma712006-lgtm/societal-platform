// Error objects can contain MongoDB documents, credentials or presigned URLs.
// Record only the operation and error class; never log requests or raw errors.
export const logError = (operation: string, error: unknown): void => {
  console.error({
    event: operation,
    errorType: error instanceof Error ? error.name : 'UnknownError',
  });
};
