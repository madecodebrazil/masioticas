// src/pages/ordem-servico/index.js
import { useEffect } from 'react';
import { useRouter } from 'next/router';
import { Container } from '@/components/ui/container';
import OsManager from '@/components/ordens-servico/OsManager';
import { useAuth } from '@/hooks/useAuth';
import LoadingScreen from '@/components/ui/LoadingScreen';

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
    <Container>
      <h1 className="text-2xl font-bold mb-6">Gerenciamento de Ordens de Serviço</h1>
      <OsManager />
    </Container>
  );
}