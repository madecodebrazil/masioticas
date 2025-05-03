// src/lib/firebaseConfig.js
import { initializeApp } from 'firebase/app';
import { getAuth } from 'firebase/auth';
import { getFirestore } from 'firebase/firestore';
import { getStorage } from 'firebase/storage';

const firebaseConfig = {
    apiKey: "AIzaSyAZS_XKio60FCXp9dfzhKIMCrKLCNuiqng",
    authDomain: "masioticas3.firebaseapp.com",
    projectId: "masioticas3",
    storageBucket: "masioticas3.firebasestorage.app", // Atualizado com o novo domínio
    messagingSenderId: "573531523425",
    appId: "1:573531523425:web:91e10b8251a2f657f81d20",
    measurementId: "G-3D15P2HV9J"
};

const app = initializeApp(firebaseConfig);
const auth = getAuth(app);
const firestore = getFirestore(app);
const storage = getStorage(app);

export { firestore, auth, storage, app };