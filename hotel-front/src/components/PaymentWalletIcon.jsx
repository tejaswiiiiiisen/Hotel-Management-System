import React from "react";

/**
 * Unified Payment Wallet Icon matching the project theme (#667eea)
 * Matches user's custom wallet icon design with top card & side clasp button.
 */
export default function PaymentWalletIcon({ size = 20, color = "currentColor", style = {}, className = "" }) {
  return (
    <svg
      width={size}
      height={size}
      viewBox="0 0 24 24"
      fill="none"
      xmlns="http://www.w3.org/2000/svg"
      className={`payment-wallet-icon ${className}`}
      style={{ display: "inline-block", verticalAlign: "middle", flexShrink: 0, ...style }}
    >
      {/* Top Card / Flap sticking out */}
      <path
        d="M7 5.5H16C16.8284 5.5 17.5 6.17157 17.5 7V8H5.5V7C5.5 6.17157 6.17157 5.5 7 5.5Z"
        fill={color}
        fillOpacity="0.25"
        stroke={color}
        strokeWidth="1.8"
        strokeLinejoin="round"
      />
      {/* Main Rounded Wallet Body */}
      <rect
        x="3"
        y="8.5"
        width="18"
        height="11.5"
        rx="3.5"
        fill={color}
        fillOpacity="0.2"
        stroke={color}
        strokeWidth="2"
      />
      {/* Wallet Clasp / Lock Flap */}
      <path
        d="M15 11.5H19.5C20.3284 11.5 21 12.1716 21 13V15.5C21 16.3284 20.3284 17 19.5 17H15C13.8954 17 13 16.1046 13 15V13.5C13 12.3954 13.8954 11.5 15 11.5Z"
        fill="#ffffff"
        stroke={color}
        strokeWidth="1.8"
      />
      {/* Snap Button Dot */}
      <circle cx="17.5" cy="14.25" r="1.1" fill={color} />
    </svg>
  );
}
