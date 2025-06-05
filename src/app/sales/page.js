"use client";

import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import Image from "next/image";
import Layout from "@/components/Layout";
import { motion } from "framer-motion";
import { useAuth } from "@/hooks/useAuth";

export default function SalesPage() {
  const router = useRouter();
  const { userPermissions } = useAuth();
  
  // Inicializar estados com null para garantir um valor definido
  const [isVendaModalOpen, setIsVendaModalOpen] = useState(false);
  const [isOrcamentoModalOpen, setIsOrcamentoModalOpen] = useState(false);
  const [selectedLoja, setSelectedLoja] = useState(
    userPermissions?.lojas?.[0] || "loja1"
  );
  
  // Estado para controlar renderização condicional do modal
  const [renderVendaModal, setRenderVendaModal] = useState(false);
  const [renderOrcamentoModal, setRenderOrcamentoModal] = useState(false);

  // Abrir modal de venda apenas quando o botão for clicado
  const handleOpenVendaModal = () => {
    setRenderVendaModal(true); // Primeiro ativa a renderização do componente
    // Pequeno timeout para garantir que o componente seja montado antes de abrir
    setTimeout(() => {
      setIsVendaModalOpen(true);
    }, 50);
  };

  // Fechar modal de venda
  const handleCloseVendaModal = () => {
    setIsVendaModalOpen(false);
    // Remover o componente do DOM após a animação de fechamento
    setTimeout(() => {
      setRenderVendaModal(false);
    }, 300);
  };

  // Abrir modal de orçamento apenas quando o botão for clicado
  const handleOpenOrcamentoModal = () => {
    setRenderOrcamentoModal(true);
    setTimeout(() => {
      setIsOrcamentoModalOpen(true);
    }, 50);
  };

  // Fechar modal de orçamento
  const handleCloseOrcamentoModal = () => {
    setIsOrcamentoModalOpen(false);
    setTimeout(() => {
      setRenderOrcamentoModal(false);
    }, 300);
  };

  // Opções de vendas com ícones e rotas
  const salesOptions = [
    {
      icon: "/images/financeiro/vendas.png",
      label: "Nova Venda",
      route:"/sales/add_sales"
    },
    {
      icon: "/images/financeiro/receber.png",
      label: "Minhas Vendas",
      route: "/sales/history"
    },
    {
      icon: "/images/financeiro/receber.png",
      label: "Meus Orçamentos",
      route: "/sales/estimates-history"
    },
    {
      icon: "/images/financeiro/receber.png",
      label: "Relatórios",
      route: "/sales/reports"
    },
    {
      icon: "/images/financeiro/receber.png",
      label: "NF-e & NFC-e",
      route: "/sales/invoices"
    }
  ];

  return (
    <Layout>
      <div>
        <div>
          <main>
            <div className="w-full">
              <div className="grid items-center grid-cols-2 gap-8 sm:grid-cols-3 md:grid-cols-2">
                <h1 className="text-4xl ml-0 md:ml-4 font-bold text-[#9a5fc7] text-center md:text-left">Vendas</h1>

                {salesOptions.map((item, index) => (
                  <div
                    key={index}
                    onClick={() => item.action ? item.action() : router.push(item.route)}
                    className="cursor-pointer"
                  >
                    <motion.div
                      className="relative flex justify-center items-center text-white w-full h-[100px] sm:h-[100px] rounded-md transition-transform transform hover:scale-105 hover:shadow-xl hover:brightness-110 cursor-pointer px-6 overflow-hidden"
                      style={{
                        background: "linear-gradient(to right, #9a5fc7, #9a5fc7)",
                        boxShadow: "0px 10px 20px rgba(0, 0, 0, 0.3)",
                      }}
                      initial={{ opacity: 0, scale: 0.9 }}
                      animate={{ opacity: 1, scale: 1 }}
                      transition={{ duration: 0.5, delay: index * 0.1 }}
                    >
                      <div
                        className="absolute inset-0 opacity-10 pointer-events-none"
                        style={{
                          backgroundImage: 'url("/images/fundo.png")',
                          backgroundSize: "cover",
                          backgroundRepeat: "no-repeat",
                          backgroundPosition: "center",
                        }}
                      />
                      <div className="relative z-10 flex flex-row justify-start items-center w-full h-full">
                        <Image
                          src={item.icon}
                          alt={item.label}
                          width={50}
                          height={50}
                          className="object-contain mr-4"
                        />
                        <span className="font-semibold text-lg flex-grow text-left">
                          {item.label}
                        </span>
                      </div>
                    </motion.div>
                  </div>
                ))}
              </div>
              
              {/* Renderização condicional dos modais */}
              {renderVendaModal && (
                <ModalNovaVenda
                  isOpen={isVendaModalOpen}
                  onClose={handleCloseVendaModal}
                  selectedLoja={selectedLoja}
                />
              )}

              {renderOrcamentoModal && (
                <ModalNovoOrcamento
                  isOpen={isOrcamentoModalOpen}
                  onClose={handleCloseOrcamentoModal}
                  selectedLoja={selectedLoja}
                />
              )}
            </div>
          </main>
        </div>
      </div>
    </Layout >
  );
}