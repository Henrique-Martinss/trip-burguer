// ========== INICIALIZAÇÃO FIREBASE PARA ADMIN ==========
const firebaseConfig = {
  apiKey: "AIzaSyAtD50vwrWbb1z0k239KkC3VcTELm2SGRc",
  authDomain: "trip-burguer.firebaseapp.com",
  databaseURL: "https://trip-burguer-default-rtdb.firebaseio.com",
  projectId: "trip-burguer",
  storageBucket: "trip-burguer.firebasestorage.app",
  messagingSenderId: "750797200394",
  appId: "1:750797200394:web:07ae813155f5e97388d3f3"
};

// ========== INICIALIZAR FIREBASE ==========
firebase.initializeApp(firebaseConfig);
const firestoreDB = firebase.firestore();
const fbAuth = firebase.auth();
const fbStorage = firebase.storage();

console.log('✓ Firebase inicializado no painel admin');