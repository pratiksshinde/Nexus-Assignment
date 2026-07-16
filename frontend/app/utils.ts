export const errorMessage = (error: unknown) =>
  error instanceof Error ? error.message : "Something went wrong";

export const displayDate = (value?: string) =>
  value ? new Date(value).toLocaleString() : "—";

export const friendlyDeliveryReason = (reason?: string) => {
  if (!reason) return "—";
  if (reason.includes("421-4.7.28")) return "Gmail temporarily delayed this email because the sender was rate-limited.";
  if (reason.includes("blacklist user") || reason === "blocked") return "The recipient address was blocked by the email provider.";
  return reason.length > 160 ? `${reason.slice(0, 157)}…` : reason;
};
