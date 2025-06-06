// Arquivo que exporta todas as funcionalidades do Firebase
import { auth } from './config.js';
import * as authFunctions from './auth.js';
import { initAuthUI, updateUIBasedOnAuthState } from './ui.js';

export {
  auth,
  authFunctions,
  initAuthUI,
  updateUIBasedOnAuthState
};