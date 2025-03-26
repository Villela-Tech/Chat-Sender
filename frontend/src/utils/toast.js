import { toast } from "react-toastify";

export const toastError = (err) => {
  const message = err.response?.data?.error || err.message || "An error occurred";
  toast.error(message);
};

export const toastSuccess = (message) => {
  toast.success(message);
};

export const toastInfo = (message) => {
  toast.info(message);
};

export const toastWarning = (message) => {
  toast.warning(message);
}; 