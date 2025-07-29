import React, { useEffect } from 'react';
import { useLocation } from "react-router-dom";
import { sha256 } from "js-sha256";
import { detectFileExtension } from "./fileUtils";


// changes colors of body and text based on path
export function ColorController() {
  const location = useLocation();
  
  useEffect(() => {
    const footer = document.querySelector('footer');

    if (location.pathname === "/") {
      document.body.style.background = "var(--primary-bg)";
      document.body.style.color = "var(--primary-text)";
      footer.classList.add('footer-primary');
      footer.classList.remove('footer-secondary');
    } else {
      document.body.style.background = "var(--secondary-bg)";
      document.body.style.color = "var(--secondary-text)";
      footer.classList.add('footer-secondary');
      footer.classList.remove('footer-primary');
    }
  }, [location.pathname]);
  

  return null; // no UI to render
}

// show error or success message
export function Msg({ message, error, onClear }) {
  useEffect(() => {
    if (message) {
      const timer = setTimeout(() => {
        onClear();
      }, 3000);
      return () => clearTimeout(timer);
    }
  }, [message, onClear]);

  if (!message) return null;

  return (
    <div id="msg" className={error ? 'error-msg' : 'success-msg'}>
      {message}
    </div>
  );
}

// Returns today's date in DD/MM/YYYY format
export function getTodayDate() {
  const today = new Date();
  const dd = String(today.getDate()).padStart(2, '0');
  const mm = String(today.getMonth() + 1).padStart(2, '0');
  const yyyy = today.getFullYear();
  return `${dd}/${mm}/${yyyy}`;
}

// Returns hash of today’s date
export function getTodayDateHash() {
  return sha256(getTodayDate());
}

// Checks input against today’s hash
export function isCorrectDateInput(input) {
  const inputHash = sha256(input.trim());
  return inputHash === getTodayDateHash();
}

// updates views 
export async function extractViewData(bytes) {
  const base64 = btoa(String.fromCharCode(...bytes));
  let utf8;

  try {
    utf8 = new TextDecoder().decode(bytes);
  } catch {
    utf8 = "[Unreadable binary data]";
  }

  const ext = await detectFileExtension(bytes);
  return { base64, utf8, ext };
}
