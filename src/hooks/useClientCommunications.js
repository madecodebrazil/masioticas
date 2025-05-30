// hooks/useClientCommunications.js
import { useState, useEffect } from 'react';

export const useClientCommunications = (client) => {
    const [communications, setCommunications] = useState({
        email: null,
        telefones: [],
        redesSociais: {},
        comunicacaoPreferida: null,
        observacoesComunicacao: null
    });
    const [loading, setLoading] = useState(false);

    useEffect(() => {
        if (!client) {
            setCommunications({
                email: null,
                telefones: [],
                redesSociais: {},
                comunicacaoPreferida: null,
                observacoesComunicacao: null
            });
            return;
        }

        setLoading(true);
        
        // Organizar todas as informações de comunicação do cliente
        const clientCommunications = {
            email: client.email || null,
            telefones: client.telefones || [],
            redesSociais: client.redesSociais || {},
            comunicacaoPreferida: client.comunicacaoPreferida || null,
            observacoesComunicacao: client.observacoesComunicacao || null,
            // Campos adicionais que podem existir
            whatsapp: client.whatsapp || null,
            telegram: client.telegram || null,
            skype: client.skype || null,
            linkedin: client.linkedin || null,
            facebook: client.facebook || null,
            instagram: client.instagram || null
        };

        setCommunications(clientCommunications);
        setLoading(false);
    }, [client]);

    // Função auxiliar para formatar telefone
    const formatPhone = (phone) => {
        if (!phone) return phone;
        const cleaned = phone.replace(/\D/g, '');
        if (cleaned.length === 11) {
            return cleaned.replace(/(\d{2})(\d{5})(\d{4})/, '($1) $2-$3');
        } else if (cleaned.length === 10) {
            return cleaned.replace(/(\d{2})(\d{4})(\d{4})/, '($1) $2-$3');
        }
        return phone;
    };

    // Função para gerar link do WhatsApp
    const generateWhatsAppLink = (phoneNumber) => {
        if (!phoneNumber) return null;
        const cleanNumber = phoneNumber.replace(/\D/g, '');
        const formattedNumber = cleanNumber.startsWith('55') ? cleanNumber : `55${cleanNumber}`;
        return `https://wa.me/${formattedNumber}`;
    };

    // Função para verificar se há alguma forma de comunicação
    const hasCommunications = () => {
        return !!(
            communications.email ||
            (communications.telefones && communications.telefones.length > 0) ||
            Object.keys(communications.redesSociais).length > 0 ||
            communications.whatsapp ||
            communications.telegram ||
            communications.skype
        );
    };

    // Função para obter comunicação preferida
    const getPreferredCommunication = () => {
        if (communications.comunicacaoPreferida) {
            return communications.comunicacaoPreferida;
        }
        
        // Lógica para determinar comunicação preferida baseada nos dados disponíveis
        if (communications.telefones && communications.telefones.length > 0) {
            return 'telefone';
        } else if (communications.email) {
            return 'email';
        } else if (communications.whatsapp) {
            return 'whatsapp';
        }
        
        return null;
    };

    // Função para contar total de formas de comunicação
    const getTotalCommunications = () => {
        let count = 0;
        
        if (communications.email) count++;
        if (communications.telefones) count += communications.telefones.length;
        if (communications.redesSociais) count += Object.keys(communications.redesSociais).length;
        if (communications.whatsapp) count++;
        if (communications.telegram) count++;
        if (communications.skype) count++;
        
        return count;
    };

    return {
        communications,
        loading,
        formatPhone,
        generateWhatsAppLink,
        hasCommunications,
        getPreferredCommunication,
        getTotalCommunications
    };
};