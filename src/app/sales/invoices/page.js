"use client";

import { useAuth } from '@/hooks/useAuth';
import { useRouter } from 'next/navigation';
import Layout from '@/components/Layout';

import { useState } from 'react';

export default function Invoices() {
    const { userData, loading, hasAccessToLoja } = useAuth();
    const [isContasPagarOpen, setIsContasPagarOpen] = useState(false);
    const router = useRouter();

    // Não precisamos mais do fetchUserData pois o hook useAuth já faz isso

    if (loading) {
        return (
            <div className="flex justify-center items-center py-10">
              <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-[#81059e]"></div>
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

    return (
        <Layout>
            <div><p>Em Produção</p></div>
        </Layout>
    );
}