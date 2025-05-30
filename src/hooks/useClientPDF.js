// hooks/useClientPDF.js
import { useState } from 'react';
import { pdf } from '@react-pdf/renderer';
import ClientPDFTemplate from '@/components/ClientPDFTemplate';

export const useClientPDF = () => {
    const [isGenerating, setIsGenerating] = useState(false);

    const openClientPDF = async (client, titularData = null, dependentesData = []) => {
        setIsGenerating(true);

        try {
            const blob = await pdf(
                <ClientPDFTemplate
                    client={client}
                    titularData={titularData}
                    dependentesData={dependentesData}
                />
            ).toBlob();

            const url = URL.createObjectURL(blob);

            // Pequeno delay para contornar CSP
            setTimeout(() => {
                const newWindow = window.open();
                newWindow.location.href = url;
            }, 100);

        } catch (error) {
            console.error('Erro ao gerar PDF:', error);
            throw error;
        } finally {
            setIsGenerating(false);
        }
    };

    return {
        openClientPDF,
        isGenerating
    };
};