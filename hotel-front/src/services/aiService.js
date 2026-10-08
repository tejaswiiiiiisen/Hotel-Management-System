import { getAuthHeaders } from "../auth.js";

export const AI_API_BASE_URL =
  import.meta.env.VITE_AI_API_URL || "http://127.0.0.1:8000";

export const BACKEND_API_BASE_URL =
  import.meta.env.VITE_BACKEND_API_URL || "http://localhost:4000";

/**
 * Health check for FastAPI ML backend
 */
export async function checkAiHealth() {
  try {
    const controller = new AbortController();
    const timeoutId = setTimeout(() => controller.abort(), 2500);
    const res = await fetch(`${AI_API_BASE_URL}/`, { signal: controller.signal });
    clearTimeout(timeoutId);
    if (res.ok) {
      const data = await res.json();
      return { online: true, message: data.message || "Hotel AI API is running" };
    }
    return { online: false, message: `Status code ${res.status}` };
  } catch (err) {
    return { online: false, message: err.message || "FastAPI server unreachable" };
  }
}

/**
 * REVIEW SENTIMENT ANALYSIS
 * Model: TensorFlow / Keras
 */
export async function analyzeReview(data) {
  const response = await fetch(`${AI_API_BASE_URL}/api/review/analyze`, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
    },
    body: JSON.stringify(data),
  });

  const result = await response.json();

  if (!response.ok) {
    throw new Error(result.detail || "Failed to analyze review sentiment.");
  }

  return result;
}

/**
 * CUSTOMER SEGMENTATION
 * Model: Scikit-learn KMeans / RFM
 */
export async function predictCustomerSegment(data) {
  const response = await fetch(`${AI_API_BASE_URL}/api/customer-segmentation/predict`, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
    },
    body: JSON.stringify(data),
  });

  const result = await response.json();

  if (!response.ok) {
    throw new Error(result.detail || "Failed to perform customer segmentation.");
  }

  return result;
}

/**
 * REVENUE PREDICTION
 * Model: Scikit-learn Random Forest / Regressor
 */
export async function predictRevenue(bookingData) {
  const response = await fetch(`${AI_API_BASE_URL}/api/revenue-prediction/predict`, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
    },
    body: JSON.stringify(bookingData),
  });

  const result = await response.json();

  if (!response.ok) {
    throw new Error(result.detail || "Failed to predict revenue.");
  }

  return result;
}

/**
 * BOOKING CANCELLATION RISK
 * Model: XGBoost / Decision Tree
 */
export async function predictCancellation(data) {
  const response = await fetch(`${AI_API_BASE_URL}/api/booking-cancellation/predict`, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
    },
    body: JSON.stringify(data),
  });

  const result = await response.json();

  if (!response.ok) {
    throw new Error(result.detail || "Failed to predict booking cancellation risk.");
  }

  return result;
}

/**
 * HOTEL AI CHATBOT
 * Connected to Hotel Database Intelligence Service
 */
export async function sendChatMessage(message) {
  const response = await fetch(`${BACKEND_API_BASE_URL}/api/chatbot`, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      ...getAuthHeaders(),
    },
    body: JSON.stringify({ message }),
  });

  if (!response.ok) {
    const errData = await response.json().catch(() => ({}));
    throw new Error(errData.message || errData.detail || "Failed to fetch chatbot response.");
  }

  return response.json();
}

/**
 * Live Express Data Fetchers
 */
export async function fetchLiveReviews() {
  const res = await fetch(`${BACKEND_API_BASE_URL}/api/reviews`, {
    headers: getAuthHeaders(),
  });
  if (!res.ok) throw new Error("Failed to fetch live reviews");
  return res.json();
}

export async function fetchLiveBookings() {
  const res = await fetch(`${BACKEND_API_BASE_URL}/api/bookings`, {
    headers: getAuthHeaders(),
  });
  if (!res.ok) throw new Error("Failed to fetch live bookings");
  return res.json();
}

export async function fetchLiveCustomers() {
  const res = await fetch(`${BACKEND_API_BASE_URL}/api/customers`, {
    headers: getAuthHeaders(),
  });
  if (!res.ok) throw new Error("Failed to fetch live customers");
  return res.json();
}

export async function fetchLiveDashboard() {
  const res = await fetch(`${BACKEND_API_BASE_URL}/api/dashboard`, {
    headers: getAuthHeaders(),
  });
  if (!res.ok) throw new Error("Failed to fetch dashboard metrics");
  return res.json();
}
