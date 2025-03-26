"use client";

import Link from 'next/link';
import Sidebar from '../../components/Sidebar';
import Image from 'next/image';
import { useRouter } from 'next/navigation';
import React, { useEffect, useState } from 'react';
import { auth, firestore } from '../../lib/firebaseConfig';
import { doc, getDoc } from 'firebase/firestore';
import { motion } from 'framer-motion';
import MobileNavSidebar from '../../components/MB_NavSidebar';
import BottomMobileNav from '../../components/MB_BottomNav';

export default function ProductsPage() {
  const [userData, setUserData] = useState(null);
  const [loading, setLoading] = useState(true);
  const router = useRouter();

  const fetchUserData = async (uid) => {
    try {
      // Novo caminho para o documento
      const docRef = doc(firestore, `lojas/loja1/users/${uid}/dados/perfil`);
      const docSnap = await getDoc(docRef);

      if (docSnap.exists()) {
        setUserData(docSnap.data());
      } else {
        console.log('Nenhum documento encontrado para o UID:', uid);
        // Criar dados iniciais
        await setDoc(docRef, {
          nome: "Usuário Padrão",
          email: auth.currentUser.email,
          imageUrl: "/images/default-avatar.png",
          cargo: "colaborador",
          createdAt: new Date()
        });

        // Buscar dados novamente
        const newDocSnap = await getDoc(docRef);
        setUserData(newDocSnap.data());
      }
    } catch (error) {
      console.error("Erro ao buscar os dados do usuário:", error);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    const unsubscribe = auth.onAuthStateChanged((user) => {
      if (user) {
        fetchUserData(user.uid);
      } else {
        router.push('/login');
      }
    });
    return () => unsubscribe();
  }, [router]);

  if (loading) {
    return (
      <div className="flex justify-center items-center h-screen">
        <p>Carregando...</p>
      </div>
    );
  }

  if (!userData) {
    return (
      <div className="flex justify-center items-center h-screen">
        <p>Usuário não encontrado.</p>
      </div>
    );
  }

  const userPhotoURL = userData?.imageUrl || '/images/default-avatar.png';

  const productsItems = [
    { icon: '/images/consultas/prancheta.png', label: 'Consultas', route: 'consultation/medical-consultation' },
    { icon: '/images/consultas/agenda.png', label: 'Agenda', route: 'consultation/agenda' },
    { icon: '/images/cadastro/Heart.Monitor.png', label: 'Pacientes', route: '/consultation/medical-consultation/list-consultation' },
    { icon: '/images/cadastro/Ophthalmology.png', label: 'Oftalmologista', route: '/consultation/ophthalmologist' },
    { icon: '/images/cadastro/Glasses.png', label: 'Optometrista', route: '/consultation/optometrist' },
  ];

  return (
    <div className="relative min-h-screen bg-[#81059e]">
      <div className="flex flex-col lg:flex-row relative min-h-screen">
        <div className="hidden lg:block w-64 flex-shrink-0 z-10">
          <Sidebar />
        </div>

        <MobileNavSidebar
          userPhotoURL={userPhotoURL}
          userData={userData}
          handleLogout={() => router.push("/login")}
        />

        <div className="absolute top-2 right-8 z-30 hidden lg:block">
          <Image
            src={userPhotoURL}
            alt="User Avatar"
            width={60}
            height={60}
            className="rounded-full object-cover border-4 border-purple-200 shadow-md bg-white"
          />
        </div>

        <div className="flex-1 relative">
          <main className="bg-white rounded-[25px] p-4 lg:p-6 w-full max-w-5xl mx-auto relative z-20 m-10 ml-0 md:ml-14 mt-20 h-[500px]">
            <div className="w-full">
              <div className="grid items-center grid-cols-2 gap-8 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 xl:grid-cols-2">
                {productsItems.map((item, index) => (
                  <Link key={index} href={item.route}>
                    <motion.div
                      className="relative flex justify-center items-center text-white w-full h-[100px] sm:h-[90px] rounded-md transition-transform transform hover:scale-110 hover:shadow-2xl hover:brightness-110 cursor-pointer px-6 overflow-hidden"
                      style={{
                        background: 'linear-gradient(to right, #9a5fc7, #9a5fc7)',
                        boxShadow: '0px 10px 20px rgba(0, 0, 0, 0.5)',
                      }}
                      initial={{ opacity: 0, scale: 0.9 }}
                      animate={{ opacity: 1, scale: 1 }}
                      transition={{ duration: 0.5, delay: index * 0.1 }}
                    >
                      <div
                        className="absolute inset-0 opacity-10 pointer-events-none"
                        style={{
                          backgroundImage: 'url("/images/fundo.png")',
                          backgroundSize: 'cover',
                          backgroundRepeat: 'no-repeat',
                          backgroundPosition: 'center',
                        }}
                      />
                      <div className="relative z-10 flex flex-row justify-start items-center w-full h-full">
                        <Image
                          src={item.icon}
                          alt={item.label}
                          width={50}
                          height={50}
                          className="object-contain mr-4"
                        />
                        <span className="text-white font-bold text-lg text-left flex-grow">
                          {item.label}
                        </span>
                      </div>
                    </motion.div>
                  </Link>
                ))}
              </div>
            </div>
          </main>
        </div>
      </div>
      <BottomMobileNav />
    </div>
  );
}