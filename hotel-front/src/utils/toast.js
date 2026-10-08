import { toast } from "react-toastify";

const defaultConfig = {
  position: "top-right",
  autoClose: 3000,
  hideProgressBar: false,
  closeOnClick: true,
  pauseOnHover: true,
  draggable: true,
};

export const showSuccess = (message) => {
  toast.success(message, { ...defaultConfig, toastId: message });
};

export const showError = (message) => {
  toast.error(message, { ...defaultConfig, toastId: message });
};

export const showWarning = (message) => {
  toast.warning(message, { ...defaultConfig, toastId: message });
};

export const showInfo = (message) => {
  toast.info(message, { ...defaultConfig, toastId: message });
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
