// Configuração do Firebase
const firebaseConfig = {
  apiKey: "AIzaSyBSt2VauIq_leJYzSivcDR6PbxvNXqwGcs",
  authDomain: "infinitymaker-c307d.firebaseapp.com",
  projectId: "infinitymaker-c307d",
  storageBucket: "infinitymaker-c307d.appspot.com", // Corrigido para o padrão correto
  messagingSenderId: "1089708172786",
  appId: "1:1089708172786:web:cae8bced8f01eb9be9376b"
};

// Inicializar o Firebase
import { initializeApp } from "https://www.gstatic.com/firebasejs/10.9.0/firebase-app.js";
import { getAuth } from "https://www.gstatic.com/firebasejs/10.9.0/firebase-auth.js";

// Inicializar o Firebase
const app = initializeApp(firebaseConfig);
const auth = getAuth(app);

export { app, auth };