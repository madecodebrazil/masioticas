import { useState, useEffect } from 'react';
import { getFirestore, collection, query, where, onSnapshot, orderBy, writeBatch, doc, updateDoc } from 'firebase/firestore';
import { getAuth } from 'firebase/auth';

export const useNotifications = () => {
    const [notifications, setNotifications] = useState([]);
    const [unreadCount, setUnreadCount] = useState(0);
    const [isPermissionGranted, setIsPermissionGranted] = useState(false);

    useEffect(() => {
        // Solicitar permissão para notificações
        if ('Notification' in window) {
            Notification.requestPermission().then(permission => {
                setIsPermissionGranted(permission === 'granted');
            });
        }

        const auth = getAuth();
        const user = auth.currentUser;

        if (!user) return;

        const db = getFirestore();
        const notificationsRef = collection(db, 'notifications');
        const q = query(
            notificationsRef,
            where('userId', '==', user.uid),
            orderBy('createdAt', 'desc')
        );

        const unsubscribe = onSnapshot(q, (snapshot) => {
            const newNotifications = [];
            let unread = 0;

            snapshot.forEach((doc) => {
                const data = doc.data();
                newNotifications.push({
                    id: doc.id,
                    ...data,
                    createdAt: data.createdAt?.toDate()
                });
                if (!data.read) unread++;
            });

            setNotifications(newNotifications);
            setUnreadCount(unread);

            // Mostrar notificação do navegador para novas notificações
            if (isPermissionGranted && newNotifications.length > 0 && newNotifications[0].createdAt > new Date(Date.now() - 10000)) {
                new Notification(newNotifications[0].title, {
                    body: newNotifications[0].message,
                    icon: '/favicon.ico'
                });
            }
        });

        return () => unsubscribe();
    }, [isPermissionGranted]);

    const markAsRead = async (notificationId) => {
        const db = getFirestore();
        const notificationRef = doc(db, 'notifications', notificationId);
        await updateDoc(notificationRef, { read: true });
    };

    const markAllAsRead = async () => {
        const db = getFirestore();
        const batch = writeBatch(db);

        notifications.forEach(notification => {
            if (!notification.read) {
                const notificationRef = doc(db, 'notifications', notification.id);
                batch.update(notificationRef, { read: true });
            }
        });

        await batch.commit();
    };

    return {
        notifications,
        unreadCount,
        markAsRead,
        markAllAsRead,
        isPermissionGranted
    };
}; 