// Configuração do Firebase
const firebaseConfig = {
    apiKey: "AIzaSyAqO6bxuwg3nBov4qECxFpaZ8D9bEc_6FI",
    authDomain: "teste-d208d.firebaseapp.com",
    projectId: "teste-d208d",
    storageBucket: "teste-d208d.firebasestorage.app",
    messagingSenderId: "887353153867",
    appId: "1:887353153867:web:e78d576fc400395b9170ce"
};

/* Configuração do Firebase
const firebaseConfig = {
    apiKey: "AIzaSyAqO6bxuwg3nBov4qECxFpaZ8D9bEc_6FI",
    authDomain: "sistema-ambulancias-16536.firebaseapp.com",
    projectId: "sistema-ambulancias-16536",
    storageBucket: "sistema-ambulancias-16536.firebasestorage.app",
    messagingSenderId: "887353153867",
    appId: "1:887353153867:web:e78d576fc400395b9170ce"
};*/

// Inicializar Firebase
firebase.initializeApp(firebaseConfig);
const db = firebase.firestore();


console.log('🔥 Firebase inicializado com sucesso!');
