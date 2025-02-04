"use client";
import { useEffect, useState } from 'react';
import { auth } from '@/lib/firebaseConfig';
import { onAuthStateChanged } from "firebase/auth";
import { getDoc, doc } from "firebase/firestore";
import { firestore } from '@/lib/firebaseConfig';
import Sidebar from '@/components/Sidebar'; 
import MobileNavSidebar from '@/components/MB_NavSidebar';
import { useRouter } from 'next/navigation';

const Layout = ({ children }) => {
    const [userData, setUserData] = useState(null);
    const [userPhotoURL, setUserPhotoURL] = useState('/default-avatar.png'); // Imagem padrão
    const [loading, setLoading] = useState(true);
    const router = useRouter();

    useEffect(() => {
        const unsubscribe = onAuthStateChanged(auth, async (user) => {
            if (user) {
                const docRef = doc(firestore, `loja1/users/${user.uid}/dados`);
                const docSnap = await getDoc(docRef);

                if (docSnap.exists()) {
                    const userFirestoreData = docSnap.data();
                    setUserData(userFirestoreData);
                    setUserPhotoURL(userFirestoreData.imageUrl || '/default-avatar.png');
                } else {
                    console.log('Documento não encontrado no Firestore.');
                }
            } else {
                router.push('/login');
            }

            setLoading(false); // Desativa o carregamento após a verificação
        });

        return () => unsubscribe();
    }, [router]);

    if (loading) {
        return <div>Carregando...</div>;
    }

    return (
        <>
        <head>
        <link rel="icon" type="image/x-icon" href="/favicon.ico" />
        </head>
        <div className=" flex flex-col w-full min-h-screen bg-[#932A83]"> {/* Fundo roxo aplicado */}
            {/* Sidebar para telas grandes */}
            <div className="hidden lg:block w-16">
                <Sidebar />
            </div>

            <div className="flex-1 flex flex-col bg-[#932A83] min-h-screen"> {/* Cor de fundo roxa */}
                <MobileNavSidebar userPhotoURL={userPhotoURL} userData={userData} />
                <div className="flex-1 flex items-center justify-center p-4 md:p-8">
                    <div className=" lg:ml-64 z-30 justify-center bg-[#F0F4FD] w-full sm:w-[90%] sm:ml-0 md:ml-0 md:w-[90%] lg:w-[80%] lg:h-[100%] p-4 sm:p-8 rounded-3xl shadow-lg border border-gray-300bg-yellow-300 ">
                        {children}
                    </div>
                </div>
            </div>
        </div>
        </>
    );
};

export default Layout;
