// Configuração do Firebase
const firebaseConfig = {
    apiKey: "SUA APIKEY",
    authDomain: "NOME DO SEU BANCO",
    projectId: "NOME E NÚMERO DO PROJETO",
    storageBucket: "NOME E NÚMERO DO PROJETO.firebasestorage.app",
    messagingSenderId: "CÓDIGO DO SEU PROJETO",
    appId: "APP ID"
};

// Inicializar Firebase
firebase.initializeApp(firebaseConfig);
const db = firebase.firestore();

console.log('🔥 Firebase inicializado com sucesso!');
