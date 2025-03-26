import { initializeApp } from 'firebase/app';
import { getFirestore } from 'firebase/firestore';
import { getAuth } from 'firebase/auth';
import { getStorage } from 'firebase/storage';

const firebaseConfig = {
    apiKey: "AIzaSyAZS_XKio60FCXp9dfzhKIMCrKLCNuiqng",
    authDomain: "masioticas3.firebaseapp.com",
    projectId: "masioticas3",
    storageBucket: "masioticas3.appspot.com", // Corrigido o formato
    messagingSenderId: "573531523425",
    appId: "1:573531523425:web:91e10b8251a2f657f81d20",
    measurementId: "G-3D15P2HV9J"
};

// Inicializa o Firebase
const app = initializeApp(firebaseConfig);

// Inicializa os serviços
const firestore = getFirestore(app);
const auth = getAuth(app);
const storage = getStorage(app);

// Exporta apenas o necessário
export { firestore, auth, storage, app };