"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import Image from "next/image";
import Layout from "@/components/Layout";
import { motion } from "framer-motion";
import ModalNovaVenda from "@/components/ModalNovaVenda";
import { useAuth } from "@/hooks/useAuth";

export default function SalesPage() {
  const router = useRouter();
  const { userPermissions } = useAuth();
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [selectedLoja, setSelectedLoja] = useState(
    userPermissions?.lojas?.[0] || "loja1"
  );

  // Opções de vendas com ícones e rotas
  const salesOptions = [
    {
      icon: "/images/financeiro/vendas.png",
      label: "Nova Venda",
      action: () => setIsModalOpen(true)
    },
    {
      icon: "/images/financeiro/receber.png",
      label: "Novo orçamento",
      route: "/sales/estimates"
    },
    {
      icon: "/images/financeiro/receber.png",
      label: "Histórico de Vendas",
      route: "/sales/history"
    },
    {
      icon: "/images/financeiro/receber.png",
      label: "Histórico de Orçamentos",
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
      <div className="min-h-screen p-4">
        <h1 className="text-4xl font-bold text-[#9a5fc7] mb-8">Vendas</h1>

        <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-2 lg:grid-cols-2 gap-6">
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

        {/* Modal de Nova Venda */}
        <ModalNovaVenda 
          isOpen={isModalOpen} 
          onClose={() => setIsModalOpen(false)} 
          selectedLoja={selectedLoja} 
        />
      </div>
    </Layout>
  );
}