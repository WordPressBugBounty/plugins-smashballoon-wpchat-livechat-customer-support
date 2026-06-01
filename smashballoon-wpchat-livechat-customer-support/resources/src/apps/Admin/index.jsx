import { createRoot } from 'react-dom/client';
import 'react-phone-number-input/style.css';
import React from 'react';
import Admin from './Admin';
import './admin.css';

// Get RTL direction from WordPress HTML element
const isRTL = document.documentElement.dir === 'rtl';

const adminElement = document.getElementById('wp-chat-admin');
if (adminElement && !adminElement._reactRoot) {
  // Set dir attribute on admin container to match WordPress
  if (isRTL) {
    adminElement.setAttribute('dir', 'rtl');
  }

  const createRootEl = createRoot(adminElement);
  adminElement._reactRoot = createRootEl;

  createRootEl.render(
    <Admin />
  );
}