// components/RouteGuard.js
import { useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { useAuth } from '../hooks/useAuth';

export const RouteGuard = ({ children, requiredLoja }) => {
  const router = useRouter();
  const { user, loading, hasAccessToLoja } = useAuth();

  useEffect(() => {
    if (!loading) {
      if (!user) {
        router.push('/login');
      } else if (requiredLoja && !hasAccessToLoja(requiredLoja)) {
        router.push('/acesso-negado');
      }
    }
  }, [loading, user, requiredLoja, hasAccessToLoja, router]);

  if (loading) {
    return <div>Carregando...</div>;
  }

  if (!user || (requiredLoja && !hasAccessToLoja(requiredLoja))) {
    return null;
  }

  return children;
};