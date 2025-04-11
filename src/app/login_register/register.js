// pages/admin/register.js
import { useEffect, useState } from 'react';
import { useRouter } from 'next/router';
import { doc, getDoc } from 'firebase/firestore';
import { firestore } from '../../lib/firebaseConfig';
import AdminRegisterForm from '../../components/AdminRegisterForm';

export default function AdminRegisterPage() {
  const [isAdmin, setIsAdmin] = useState(false);
  const [loading, setLoading] = useState(true);
  const router = useRouter();

  useEffect(() => {
    const checkAdminStatus = async () => {
      // Verificar se o usuário atual é admin
      const userDoc = await getDoc(doc(firestore, 'colaboradores', auth.currentUser.uid));
      if (userDoc.exists() && userDoc.data().level_perm === "3") {
        setIsAdmin(true);
      } else {
        router.push('/unauthorized');
      }
      setLoading(false);
    };

    checkAdminStatus();
  }, []);

  if (loading) return <div> <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-[#81059e]"></div></div>;
  if (!isAdmin) return null;

  return <AdminRegisterForm />;
}