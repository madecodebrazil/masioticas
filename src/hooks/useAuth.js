// src/hooks/useAuth.js
import { useState, useEffect } from 'react';
import { onAuthStateChanged } from 'firebase/auth';
import { doc, getDoc } from 'firebase/firestore';
import { auth, firestore } from '@/lib/firebaseConfig';

export const useAuth = () => {
  const [user, setUser] = useState(null);
  const [userData, setUserData] = useState(null);
  const [userPermissions, setUserPermissions] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    // Verificar se auth existe antes de usar
    if (!auth) {
      console.error('Firebase auth not initialized');
      setLoading(false);
      return;
    }

    const unsubscribe = onAuthStateChanged(auth, async (user) => {
      if (user) {
        // Verifica primeiro se é um admin
        const adminDoc = await getDoc(doc(firestore, `admins/${user.uid}`));

        if (adminDoc.exists()) {
          const adminData = adminDoc.data();
          setUserPermissions({
            isAdmin: true,
            acesso_total: adminData.acesso_total,
            lojas: adminData.permissoes.lojas
          });
          setUserData({
            ...adminData,
            cargo: adminData.cargo // Garantindo que o cargo seja incluído
          });
        } else {
          // Verifica permissões em cada loja - CORRIGIDO O CAMINHO
          const loja1Doc = await getDoc(doc(firestore, `lojas/loja1/users/${user.uid}`));
          const loja2Doc = await getDoc(doc(firestore, `lojas/loja2/users/${user.uid}`));

          const lojas = [];
          let userData = null;

          if (loja1Doc.exists()) {
            lojas.push('loja1');
            userData = loja1Doc.data();
          }
          if (loja2Doc.exists()) {
            lojas.push('loja2');
            userData = userData || loja2Doc.data();
          }

          setUserPermissions({
            isAdmin: false,
            acesso_total: false,
            lojas: lojas
          });
          setUserData(userData);
        }

        setUser(user);
      } else {
        setUser(null);
        setUserData(null);
        setUserPermissions(null);
      }
      setLoading(false);
    });

    return () => unsubscribe();
  }, []);

  const hasAccessToLoja = (loja) => {
    if (!userPermissions) return false;
    if (userPermissions.acesso_total) return true;
    return userPermissions.lojas.includes(loja);
  };

  return {
    user,
    userData,
    loading,
    userPermissions,
    hasAccessToLoja
  };
};