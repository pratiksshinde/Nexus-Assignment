export async function api(path, options = {}) {
  const isFormData = options.body instanceof FormData;
  const response = await fetch(`/api${path}`, {
    ...options,
    signal: options.signal || AbortSignal.timeout(30000),
    headers: {
      ...(!isFormData && { "Content-Type": "application/json" }),
      ...options.headers,
    },
  });
  const data = response.status === 204 ? null : await response.json();
  if (!response.ok) {
    const safeMessages = {
      "Invalid email or password": "The email or password is incorrect.",
      "An account already exists with this email": "An account already exists with this email.",
      "Password must be at least 8 characters": "Use a password with at least 8 characters.",
      "The campaign needs at least one contact with an email": "Add at least one contact with a valid email address.",
      "Campaign has already been queued": "This campaign has already been sent or scheduled.",
      "Scheduled time is invalid or in the past": "Choose a valid future date and time.",
    };
    const fallback = {
      400: "Please check the entered information and try again.",
      401: "Please sign in to continue.",
      403: "You do not have permission to do that.",
      404: "The requested item could not be found.",
      409: "This action is not available right now.",
      500: "Something went wrong. Please try again.",
      503: "The service is temporarily unavailable. Please try again shortly.",
    };
    throw new Error(safeMessages[data?.message] || fallback[response.status] || "Unable to complete the request.");
  }
  return data;
}
