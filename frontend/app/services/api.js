import axios from "axios";

const safeMessages = {
  "Invalid email or password": "The email or password is incorrect.",
  "An account already exists with this email": "An account already exists with this email.",
  "Password must be at least 8 characters": "Use a password with at least 8 characters.",
  "The campaign needs at least one contact with an email": "Add at least one contact with a valid email address.",
  "Campaign has already been queued": "This campaign has already been sent or scheduled.",
  "Scheduled time is invalid or in the past": "Choose a valid future date and time.",
};

const fallbackMessages = {
  400: "Please check the entered information and try again.",
  401: "Please sign in to continue.",
  403: "You do not have permission to do that.",
  404: "The requested item could not be found.",
  409: "This action is not available right now.",
  500: "Something went wrong. Please try again.",
  503: "The service is temporarily unavailable. Please try again shortly.",
};

export const apiClient = axios.create({
  baseURL: "/api",
  timeout: 30000,
  withCredentials: true,
});

apiClient.interceptors.response.use(
  (response) => response.data,
  (error) => {
    const status = error.response?.status;
    const backendMessage = error.response?.data?.message;
    const message =
      safeMessages[backendMessage] ||
      fallbackMessages[status] ||
      (error.code === "ECONNABORTED"
        ? "The request took too long. Please try again."
        : "Unable to complete the request. Please try again.");

    return Promise.reject(new Error(message));
  },
);
