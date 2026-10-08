const showToast = (message, type) => {
  const toast = document.createElement("div");
  toast.textContent = message;
  toast.style.cssText = `position:fixed;top:20px;right:20px;z-index:10000;max-width:360px;padding:12px 16px;border-radius:10px;color:#fff;background:${type === "error" ? "#dc2626" : type === "warning" ? "#d97706" : type === "info" ? "#2563eb" : "#16a34a"};box-shadow:0 8px 24px rgba(0,0,0,.2);font:600 13px system-ui;`;
  document.body.appendChild(toast);
  window.setTimeout(() => toast.remove(), 3000);
};

export const showSuccess = (message) => {
  showToast(message, "success");
};

export const showError = (message) => {
  showToast(message, "error");
};

export const showWarning = (message) => {
  showToast(message, "warning");
};

export const showInfo = (message) => {
  showToast(message, "info");
};

export const handleApiError = (error, defaultMessage = "Something went wrong. Please try again later.") => {
  if (error.response) {
    const status = error.response.status;
    if (status === 409) {
      showError("This room is already booked for the selected dates.");
    } else if (status === 403) { showError("Access denied."); } else if (status === 401) { showError("Your session has expired. Please login again."); } else if (status === 409) { showError("This room is already booked for the selected dates."); } else if (status === 404) {
      showError("Requested data was not found.");
    } else if (status === 500) {
      showError("Something went wrong. Please try again later.");
    } else {
      showError(error.response.data?.message || error.response.data?.error || defaultMessage);
    }
  } else if (error.request) {
    showError("Unable to connect to the server. Please try again.");
  } else {
    showError(defaultMessage);
  }
};
