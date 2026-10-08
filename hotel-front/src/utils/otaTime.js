/**
 * Converts ISO timestamp or Date object into human-readable relative time string
 * @param {string | Date | number} timestamp
 * @returns {string} e.g. "Just now", "2 mins ago", "1 hour ago", "3 days ago"
 */
export function getRelativeTimeString(timestamp) {
  if (!timestamp) return "Never";
  const date = new Date(timestamp);
  if (isNaN(date.getTime())) return String(timestamp);

  const now = new Date();
  const diffInSeconds = Math.floor((now.getTime() - date.getTime()) / 1000);

  if (diffInSeconds < 30) {
    return "Just now";
  }
  if (diffInSeconds < 60) {
    return `${diffInSeconds}s ago`;
  }

  const diffInMinutes = Math.floor(diffInSeconds / 60);
  if (diffInMinutes < 60) {
    return `${diffInMinutes} ${diffInMinutes === 1 ? "min" : "mins"} ago`;
  }

  const diffInHours = Math.floor(diffInMinutes / 60);
  if (diffInHours < 24) {
    return `${diffInHours} ${diffInHours === 1 ? "hour" : "hours"} ago`;
  }

  const diffInDays = Math.floor(diffInHours / 24);
  if (diffInDays < 30) {
    return `${diffInDays} ${diffInDays === 1 ? "day" : "days"} ago`;
  }

  return date.toLocaleDateString("en-IN", { month: "short", day: "numeric" });
}

/** Formats currency in Indian Rupees format (₹4,200) */
export function formatINR(amount) {
  if (typeof amount !== "number" || isNaN(amount)) return "₹0";
  return `₹${amount.toLocaleString("en-IN")}`;
}
