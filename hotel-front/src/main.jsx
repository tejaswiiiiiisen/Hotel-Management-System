import React from "react";
import ReactDOM from "react-dom/client";
import { BrowserRouter } from "react-router-dom";
import App from "./App.jsx";
import "./index.css";
import { getCurrentOrg, getCurrentOrgId, getCurrentOrgStatus } from "./auth.js";

if (typeof window !== "undefined") {
  window.getCurrentOrg = getCurrentOrg;
  window.getCurrentOrgId = getCurrentOrgId;
  window.getCurrentOrgStatus = getCurrentOrgStatus;
}

ReactDOM.createRoot(document.getElementById("root")).render(
  <React.StrictMode>
    <BrowserRouter>
      <App />
    </BrowserRouter>
  </React.StrictMode>
);
