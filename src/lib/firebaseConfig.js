
import { initializeApp } from 'firebase/app';
import { getFirestore } from 'firebase/firestore';
import { getAuth } from 'firebase/auth';
import { getStorage } from 'firebase/storage'; // Importa o Firebase Storage

// Configuração do projeto Firebase
const firebaseConfig = {
    apiKey: "AIzaSyBSRYdnzwAagJzIZwhxUp8_Hm3rViw5wmU",
    authDomain: "masioticas-1979.firebaseapp.com",
    projectId: "masioticas-1979",
    storageBucket: "masioticas-1979.firebasestorage.app",
    messagingSenderId: "29879003827",
    appId: "1:29879003827:web:5d87b1c748dbf2361c5ec6",
    measurementId: "G-2N4RL2MG86"
  };

// Inicializa o Firebase com a configuração fornecida
const app = initializeApp(firebaseConfig);

// Inicializa o Firestore
const firestore = getFirestore(app);

// Inicializa o Firebase Auth
const auth = getAuth(app);

// Inicializa o Firebase Storage
const storage = getStorage(app); // Adiciona o Storage

const db = getFirestore(app);

// Exporte as instâncias de Firestore, Auth e Storage para uso no restante da aplicação
export { firestore, app, auth, db, storage };