"use client";

import { useRouter } from "next/navigation";
import Image from "next/image";
import Layout from "@/components/Layout";
import { motion } from "framer-motion";

export default function SalesPage() {
  const router = useRouter();

  // Opções de vendas com ícones e rotas
  const salesOptions = [
    {
      icon: "/images/financeiro/vendas.png",
      label: "Venda Simples",
      route: "/sales/simple_sale"
    },
    {
      icon: "/images/financeiro/vendas.png",
      label: "Venda Detalhada",
      route: "/sales/detailed_sale"
    },
    {
      icon: "/images/financeiro/receber.png",
      label: "Orçamentos",
      route: "/sales/estimates"
    },
    {
      icon: "/images/financeiro/receber.png",
      label: "Novo Orçamento",
      route: "/sales/new_estimate"
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
              onClick={() => router.push(item.route)}
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
      </div>
    </Layout>
  );
}