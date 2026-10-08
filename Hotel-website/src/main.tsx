import React from "react";
import ReactDOM from "react-dom/client";
import { BrowserRouter } from "react-router-dom";
import App from "./App";
import { GuestsProvider } from "./context/GuestsContext";
import "./index.css";

ReactDOM.createRoot(document.getElementById("root") as HTMLElement).render(
  <React.StrictMode>
    <BrowserRouter>
      <GuestsProvider>
        <App />
      </GuestsProvider>
    </BrowserRouter>
  </React.StrictMode>
);
