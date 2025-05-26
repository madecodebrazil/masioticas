'use client';

import { useEffect } from 'react';
import { useRouter } from 'next/navigation'; // Alterado de next/router para next/navigation
import OsManager from '@/components/OSManager';
import { useAuth } from '@/hooks/useAuth';
import Layout from "@/components/Layout"; // Corrigido o caminho de importação

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
    return <div className="flex items-center justify-center min-h-screen">
      <p>Carregando...</p>
    </div>; // Substitui o LoadingScreen que parece não estar definido
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