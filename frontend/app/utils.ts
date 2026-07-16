export const errorMessage = (error: unknown) =>
  error instanceof Error ? error.message : "Something went wrong";

export const displayDate = (value?: string) =>
  value ? new Date(value).toLocaleString() : "—";
