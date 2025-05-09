"use client"; 

import { useEffect } from 'react';
import { useRouter } from 'next/router';
import OsManager from '@/components/OSManager';
import { useAuth } from '@/hooks/useAuth';
import Layout from "../../../components/Layout";


export default function OrdemServicoPage() {
  const { user, loading, userPermissions } = useAuth();
  const router = useRouter();

  // Verificação de autenticação e permissões
  useEffect(() => {
    if (!loading && !user) {
      router.push('/login');
    }
  }, [user, loading, router]);

  if (loading) {
    return <LoadingScreen />;
  }

  if (!user) {
    return null; // Vai redirecionar para o login, não precisa renderizar nada
  }

  return (
    <Layout>
      <h1 className="text-2xl font-bold mb-6">Gerenciamento de Ordens de Serviço</h1>
      <OsManager />
    </Layout>
  );
}