// Arquivo para inicialização do Firebase
// Este arquivo pode ser incluído via tag script em qualquer página que precise do Firebase

import { initializeApp } from "https://www.gstatic.com/firebasejs/10.9.0/firebase-app.js";
import { getAuth } from "https://www.gstatic.com/firebasejs/10.9.0/firebase-auth.js";

// Configuração do Firebase fornecida pelo console
const firebaseConfig = {
  apiKey: "AIzaSyBSt2VauIq_leJYzSivcDR6PbxvNXqwGcs",
  authDomain: "infinitymaker-c307d.firebaseapp.com",
  projectId: "infinitymaker-c307d",
  storageBucket: "infinitymaker-c307d.appspot.com", // Corrigido para o padrão correto do Firebase Storage
  messagingSenderId: "1089708172786",
  appId: "1:1089708172786:web:cae8bced8f01eb9be9376b"
};

// Inicializar o Firebase
const app = initializeApp(firebaseConfig);
const auth = getAuth(app);

console.log("Firebase inicializado com sucesso!");

// Exportar para uso em outros módulos
export { app, auth };