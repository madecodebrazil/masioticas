"use client";

import Link from 'next/link'; // Importando Link do Next.js para navegação
import Image from 'next/image'; // Importando Image para a foto de perfil do usuário
import { useRouter } from 'next/navigation';
import React, { useEffect, useState } from 'react'; // Certifique-se de que React está importado
import { auth, firestore } from '../../lib/firebaseConfig'; // Firebase instância correta
import { doc, getDoc, collection, getDocs } from 'firebase/firestore'; // Firestore funções
import { motion } from 'framer-motion'; // Importando animações
import Layout from '@/components/Layout'; // Usando seu componente Layout

const AgreementsPage = () => {
  const [userData, setUserData] = useState(null);
  const [loading, setLoading] = useState(true);
  const [totalAgreements, setTotalAgreements] = useState(0); // Total de acordos
  const router = useRouter();

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
      setLoading(false);
    }
  };

  const fetchTotalAgreements = async () => {
    try {
      const agreementsSnapshot = await getDocs(collection(firestore, 'loja1', 'agreements', 'acordos'));

      // Filtra e conta todos os documentos que não sejam o documento 'counters'
      const validAgreements = agreementsSnapshot.docs.filter(doc => doc.id !== 'counters');

      setTotalAgreements(validAgreements.length); // Define o total de acordos válidos
    } catch (error) {
      console.error("Erro ao buscar os acordos:", error);
    }
  };

  useEffect(() => {
    const unsubscribe = auth.onAuthStateChanged((user) => {
      if (user) {
        fetchUserData(user.uid);
        fetchTotalAgreements(); // Busca o total de acordos quando o usuário está autenticado
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

  const userPhotoURL = userData?.imageUrl || '/default-avatar.png';

  const agreementsItems = [
    { icon: '/images/cobranca/Agreement.png', label: 'Novo Acordo', route: '/billing/create-agreement' },
    { icon: '/images/cobranca/Sign.Document.png', label: 'Listar Acordos', route: '/billing/list_agreements' },
  ];

  return (
    <Layout>
      <div className="flex flex-1 justify-center items-center">
        <div className="absolute top-4 right-4 z-30 hidden lg:block">
          {/* <Image
            src={userPhotoURL}
            alt="User Avatar"
            width={80}
            height={80}
            className="rounded-full object-cover border-2 border-white shadow-md"
          /> */}
        </div>
        <main className="bg-white rounded-[25px] p-4 lg:p-6 w-full max-w-6xl mx-auto relative z-20 min-h-[400px]">

          <div className="w-full">
            <div className="grid grid-cols-1 lg:grid-cols-3 gap-4 mb-4">
              <div className="bg-white rounded-md shadow p-4">
                <h3 className="font-bold text-gray-700 mb-2">Acordos</h3>
                <ul className="text-sm">
                  <li><span className="text-black">Total de Acordos: {totalAgreements}</span></li>
                </ul>
              </div>
            </div>

            <div className="grid items-center grid-cols-2 gap-8 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 xl:grid-cols-2">
              {agreementsItems.map((item, index) => (
                <Link key={index} href={item.route}>
                  <motion.div
                    className="relative flex justify-start items-center bg-gradient-to-r from-[#81059e] to-[#B7328C] text-white w-full h-[100px] rounded-xl transition-transform transform hover:scale-110 hover:shadow-2xl hover:brightness-110 cursor-pointer px-6 overflow-hidden"
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
                        backgroundImage: `url('/images/fundo.png')`,
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
                        className="object-contain mr-4" // Espaço entre o ícone e o texto
                      />
                      {/* Texto alinhado à esquerda */}
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
    </Layout>
  );
};

export default AgreementsPage;
