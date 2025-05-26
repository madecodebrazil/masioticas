"use client"

// src/app/register/consumers/add/page.js
import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import ClienteForm from '@/components/ClientForm';
import { useAuth } from '@/hooks/useAuth';
import Layout from '@/components/Layout';
import Link from 'next/link';
import { FiUser, FiArrowLeft, FiHome, FiArrowRight } from 'react-icons/fi';

export default function AddClientePage() {
  const router = useRouter();
  const { user, loading, userPermissions, userData } = useAuth();
  const [selectedLoja, setSelectedLoja] = useState('');
  const [pageReady, setPageReady] = useState(false);

  useEffect(() => {
    // Aguarda o carregamento das informações de autenticação
    if (!loading) {
      if (!user) {
        // Redireciona para login se não estiver autenticado
        router.push('/login');
      } else if (userPermissions) {
        // Verifica se tem permissão para cadastrar clientes
        if (userPermissions.isAdmin || userPermissions.lojas.length > 0) {
          // Se for usuário normal ou admin, usa a primeira loja disponível
          if (userPermissions.lojas.length > 0 && !selectedLoja) {
            setSelectedLoja(userPermissions.lojas[0]);
          }

          setPageReady(true);
        } else {
          // Sem permissão, redireciona para a página inicial
          router.push('/dashboard');
        }
      }
    }
  }, [loading, user, userPermissions, router, selectedLoja]);

  const changeSelectedLoja = (loja) => {
    setSelectedLoja(loja);
  };

  if (loading || !pageReady) {
    return (
      <Layout>
        <div className="flex justify-center items-center min-h-screen">
          <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-[#81059e]"></div>
        </div>
      </Layout>
    );
  }

  const handleSuccessRedirect = () => {
    router.push('/register/consumers');
  };

  const renderLojaName = (lojaId) => {
    const lojaNames = {
      'loja1': 'Loja 1 - Centro',
      'loja2': 'Loja 2 - Caramuru'
    };

    return lojaNames[lojaId] || lojaId;
  };

  return (
    <Layout>
      <div className="min-h-screen pb-20">
        <div className="w-full max-w-5xl mx-auto rounded-lg">
          <h2 className="text-3xl font-bold text-[#81059e] mb-8 mt-8">+ NOVO CLIENTE</h2>

          {/* Seletor de Loja para Admins */}
          {userPermissions?.isAdmin && userPermissions.lojas && userPermissions.lojas.length > 1 && (
            <div className="mb-6">
              <label className="text-[#81059e] font-medium flex items-center gap-2">
                <FiHome /> Selecionar Loja
              </label>
              <select
                value={selectedLoja || ''}
                onChange={(e) => setSelectedLoja(e.target.value)}
                className="border-2 border-[#81059e] p-3 rounded-lg w-full text-black mt-1"
              >
                <option value="">Selecione uma loja</option>
                {userPermissions.lojas.map((loja) => (
                  <option key={loja} value={loja}>
                    {renderLojaName(loja)}
                  </option>
                ))}
              </select>
            </div>
          )}

          <div className='space-x-2 mb-6'>
            <Link href="/register/consumers/list-clients">
              <button className="bg-[#81059e] p-3 rounded-sm text-white flex items-center gap-2">
                <FiArrowRight /> LISTA DE CLIENTES
              </button>
            </Link>
          </div>

          <div className="p-4 bg-gray-50 rounded-lg">
            <h3 className="text-xl font-semibold text-[#81059e] mb-4 flex items-center gap-2">
              <FiUser /> Cadastro de Cliente
            </h3>
            <ClienteForm
              selectedLoja={selectedLoja}
              onSuccessRedirect={handleSuccessRedirect}
              userId={user.uid}
              userName={userData?.nome || user.displayName || ''}
            />
          </div>
        </div>
      </div>
    </Layout>
  );
}