import { getFirestore, collection, addDoc, serverTimestamp } from 'firebase/firestore';
import { getAuth } from 'firebase/auth';

export const createNotification = async ({ title, message, userId = null }) => {
    const db = getFirestore();
    const auth = getAuth();

    // Se não for especificado um userId, usa o usuário atual
    const targetUserId = userId || auth.currentUser?.uid;

    if (!targetUserId) {
        throw new Error('Usuário não autenticado');
    }

    const notification = {
        title,
        message,
        userId: targetUserId,
        read: false,
        createdAt: serverTimestamp()
    };

    try {
        const docRef = await addDoc(collection(db, 'notifications'), notification);
        return docRef.id;
    } catch (error) {
        console.error('Erro ao criar notificação:', error);
        throw error;
    }
}; 