"use client";

import Link from 'next/link'; // Importando Link do Next.js para navegação
import Sidebar from '../../components/Sidebar'; // Importando o MobileNavSidebar para navegação mobile
import Image from 'next/image'; // Importando Image para a foto de perfil do usuário
import { useRouter } from 'next/navigation';
import React, { useEffect, useState } from 'react';
import { auth, firestore } from '../../lib/firebaseConfig'; // Importe a instância do Firebase e Firestore
import { doc, getDoc, collection, getDocs, getFirestore } from 'firebase/firestore'; // Importando getFirestore
import { motion } from 'framer-motion'; // Importando o motion para animações
import MobileNavSidebar from '../../components/MB_NavSidebar';
import BottomMobileNav from '../../components/MB_BottomNav';

const db = getFirestore(); // Inicializando Firestore

// Componente de Status das Consultas
const StatusConsultationChart = () => {
  const [consultationStats, setConsultationStats] = useState({
    total: 0,
    agendadas: 0,
    realizadas: 0,
    canceladas: 0,
  });

  // Função para buscar os dados de consultas e calcular o total por status
  const fetchConsultationStats = async () => {
    try {
      const consultationsCollection = collection(db, 'consultations'); // Referência à coleção consultations
      const querySnapshot = await getDocs(consultationsCollection);

      let agendadas = 0;
      let realizadas = 0;
      let canceladas = 0;

      querySnapshot.forEach((doc) => {
        const data = doc.data();
        if (data.status === 'agendada') agendadas++;
        if (data.status === 'realizada') realizadas++;
        if (data.status === 'cancelada') canceladas++;
      });

      setConsultationStats({
        total: agendadas + realizadas + canceladas,
        agendadas,
        realizadas,
        canceladas,
      });
    } catch (error) {
      console.error('Erro ao buscar estatísticas de consultas:', error);
    }
  };

  useEffect(() => {
    fetchConsultationStats();
  }, []);

  return (
    <div className="p-4 rounded-lg shadow-lg bg-white mb-6 max-w-md ml-0 mr-auto"> {/* Ajustando a largura máxima */}
      <h3 className="text-xl font-bold text-black mb-4">Consultas</h3>

      <div className="space-y-2">
        <div className="flex items-center justify-between">
          <span className="flex items-center space-x-2">
            <span className="text-yellow-500 text-lg">●</span>
            <span className="text-black">Total de consultas</span>
          </span>
          <span className="text-black">{consultationStats.total}</span>
        </div>

        <div className="flex items-center justify-between">
          <span className="flex items-center space-x-2">
            <span className="text-blue-500 text-lg">●</span>
            <span className="text-black">Consultas Agendadas</span>
          </span>
          <span className="text-black">{consultationStats.agendadas}</span>
        </div>

        <div className="flex items-center justify-between">
          <span className="flex items-center space-x-2">
            <span className="text-green-500 text-lg">●</span>
            <span className="text-black">Consultas Realizadas</span>
          </span>
          <span className="text-black">{consultationStats.realizadas}</span>
        </div>

        <div className="flex items-center justify-between">
          <span className="flex items-center space-x-2">
            <span className="text-red-500 text-lg">●</span>
            <span className="text-black">Consultas Canceladas</span>
          </span>
          <span className="text-black">{consultationStats.canceladas}</span>
        </div>
      </div>
    </div>
  );
};

export default function ProductsPage() {
  const [userData, setUserData] = useState(null);
  const [loading, setLoading] = useState(true); // Estado de carregamento
  const router = useRouter();

  // Função para buscar os dados do usuário logado no Firestore
  const fetchUserData = async (uid) => {
    try {
      const docRef = doc(firestore, `loja1/users/${uid}/dados`);
      const docSnap = await getDoc(docRef);

      if (docSnap.exists()) {
        setUserData(docSnap.data());
      } else {
        console.log('Nenhum documento encontrado para o UID:', uid);
      }
    } catch (error) {
      console.error("Erro ao buscar os dados do usuário:", error);
    } finally {
      setLoading(false); // Conclui o carregamento
    }
  };

  useEffect(() => {
    // Verifica se o usuário está autenticado
    const unsubscribe = auth.onAuthStateChanged((user) => {
      if (user) {
        // Busca os dados do Firestore usando o UID do usuário logado
        fetchUserData(user.uid);
      } else {
        router.push('/login'); // Redireciona para a página de login se não estiver logado
      }
    });

    return () => unsubscribe();
  }, [router]);

  // Verifique o carregamento
  if (loading) {
    return (
      <div className="flex justify-center items-center h-screen">
        <p>Carregando...</p>
      </div>
    );
  }

  // Se os dados do usuário não forem encontrados
  if (!userData) {
    return (
      <div className="flex justify-center items-center h-screen">
        <p>Usuário não encontrado.</p>
      </div>
    );
  }

  // Definindo a URL da foto do usuário. Se não houver imagem, será usado um avatar padrão.
  const userPhotoURL = userData?.imageUrl || '/default-avatar.png';

  // Defina os ícones e rótulos dos products_and_services
  const productsItems = [
    { icon: '/images/consultas/prancheta.png', label: 'Consultas', route: 'consultation/medical-consultation' },
    { icon: '/images/consultas/agenda.png', label: 'Agenda', route: 'consultation/agenda' },
    { icon: '/images/cadastro/Heart.Monitor.png', label: 'Pacientes', route: '/consultation/medical-consultation/list-consultation' },
    { icon: '/images/cadastro/Ophthalmology.png', label: 'Oftalmologista', route: '/consultation/ophthalmologist' },
    { icon: '/images/cadastro/Glasses.png', label: 'Optometrista', route: '/consultation/optometrist' },
  ];

  return (
    <div className="relative min-h-screen bg-[#932A83]">
      <div className="flex flex-col lg:flex-row relative min-h-screen">
        {/* Sidebar para telas grandes */}
        <div className="hidden lg:block w-64 z-10">
          <Sidebar /> {/* Instanciando o componente Sidebar em telas grandes */}
        </div>

        <MobileNavSidebar
          userPhotoURL={userPhotoURL}
          userData={userData} // Certifique-se de passar o userData aqui
          handleLogout={() => router.push("/login")} // Função de logout que redireciona para a página de login
        /> {/* Instanciando o MobileNavSidebar em telas pequenas */}
<div className="absolute top-4 right-4 z-30 hidden lg:block">
            <Image
              src={userPhotoURL}
              alt="User Avatar"
              width={80} // Largura da imagem
              height={80} // Altura da imagem
              className="rounded-full object-cover border-2 border-white shadow-md"
            />
          </div>
        {/* Main Content */}
        <main className="bg-white rounded-[25px] p-4 lg:p-6 w-full max-w-6xl mx-auto relative z-20 min-h-[400px] mt-8 mb-8">
          {/* Container para a foto do usuário - visível apenas em telas grandes */}
          

          {/* Adicionando o Chart com os Status das Consultas */}
          <StatusConsultationChart />

          <div className="w-full">
            {/* Cards de Produtos com imagem de fundo opaca e animações */}
            <div className="grid grid-cols-2 gap-4 md:grid-cols-4 mb-20">
            {productsItems.map((item, index) => (
  <Link key={index} href={item.route}>
    <motion.div
      className="relative flex justify-start items-center bg-gradient-to-r from-[#932A83] to-[#B7328C] text-white w-full h-[100px] rounded-xl transition-transform transform hover:scale-105 hover:shadow-xl cursor-pointer px-6 overflow-hidden"
      style={{
        boxShadow: '0px 10px 25px rgba(0, 0, 0, 0.5)',
      }}
      initial={{ opacity: 0, scale: 0.9 }}
      animate={{ opacity: 1, scale: 1 }}
      transition={{ duration: 0.5, delay: index * 0.1 }}
    >
      {/* Imagem de fundo sutil */}
      <div
        className="absolute inset-0 opacity-10 pointer-events-none"
        style={{
          backgroundImage: `url('/images/fundo.png')`, // Substitua pelo caminho correto da imagem
          backgroundSize: 'cover',
          backgroundRepeat: 'no-repeat',
          backgroundPosition: 'center',
        }}
      ></div>

      <div className="relative z-10 flex flex-row justify-start items-center w-full h-full">
        {/* Ícone à esquerda */}
        <Image
          src={item.icon}
          alt={item.label}
          width={50}
          height={50}
          className="object-contain mr-4" // Adiciona uma margem à direita do ícone para espaçamento
        />
        {/* Texto alinhado à esquerda */}
        <span className="text-white font-bold text-lg text-left flex-grow">
          {item.label}
        </span>
      </div>
    </motion.div>
  </Link>
))}

              {<BottomMobileNav />}
            </div>
          </div>
        </main>
      </div>
    </div>
  );
}
