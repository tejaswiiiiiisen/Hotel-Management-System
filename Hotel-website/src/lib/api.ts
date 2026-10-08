// Small fetch wrapper. In dev the Vite proxy forwards /api to the Express
// backend, so requests are same-origin and the session cookie flows normally.
// `credentials: "include"` also makes it work if the API is served cross-origin.
export async function apiFetch(path: string, options: RequestInit = {}) {
  const headers: Record<string, string> = {
    ...(options.body && typeof options.body === "string"
      ? { "Content-Type": "application/json" }
      : {}),
    ...(options.headers as Record<string, string>),
  };
  return fetch(path, { credentials: "include", ...options, headers });
}
