"use client";

import Link from 'next/link';
import Image from 'next/image';
import { useRouter } from 'next/navigation';
import React, { useState } from 'react';
import { motion } from 'framer-motion';
import { useAuth } from '@/hooks/useAuth';
import Layout from '@/components/Layout';

export default function ProductsPage() {
  const { userData, loading } = useAuth();
  const router = useRouter();

  if (loading) {
    return (
      <div className="flex justify-center items-center h-screen">
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

  const productsItems = [
    { icon: '/images/consultas/prancheta.png', label: 'Consultas', route: 'consultation/medical-consultation' },
    { icon: '/images/consultas/agenda.png', label: 'Agenda', route: 'consultation/agenda' },
    { icon: '/images/consultas/agenda.png', label: 'Receitas', route: 'consultation/receitas' },
    { icon: '/images/cadastro/Heart.Monitor.png', label: 'Pacientes', route: '/consultation/medical-consultation/list-consultation' },
    { icon: '/images/cadastro/Ophthalmology.png', label: 'Oftalmologista', route: '/consultation/ophthalmologist' },
    { icon: '/images/cadastro/Glasses.png', label: 'Optometrista', route: '/consultation/optometrist' },
  ];

  return (
    <Layout>
      <div>
        <main>
          <div className="w-full">
            <div className="grid items-center grid-cols-2 gap-8 sm:grid-cols-3 md:grid-cols-2">
              <h1 className='text-4xl ml-0 md:ml-4 font-bold text-[#9a5fc7] text-center md:text-left'>Consultas</h1>
              {productsItems.map((item, index) => (
                <Link key={index} href={item.route}>
                  <motion.div
                    className="relative flex justify-center items-center text-white w-full h-[100px] sm:h-[90px] rounded-md transition-transform transform hover:scale-110 hover:shadow-2xl hover:brightness-110 cursor-pointer px-6 overflow-hidden"
                    style={{
                      background: 'linear-gradient(to right, #9a5fc7, #9a5fc7)',
                      boxShadow: '0px 10px 20px rgba(0, 0, 0, 0.5)',
                    }}
                    initial={{ opacity: 0, scale: 0.9 }}
                    animate={{ opacity: 1, scale: 1 }}
                    transition={{ duration: 0.5, delay: index * 0.1 }}
                  >
                    <div
                      className="absolute inset-0 opacity-10 pointer-events-none"
                      style={{
                        backgroundImage: 'url("/images/fundo.png")',
                        backgroundSize: 'cover',
                        backgroundRepeat: 'no-repeat',
                        backgroundPosition: 'center',
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
                      <span className="font-semibold text-sm sm:text-base lg:text-lg flex-grow text-left">
                        {item.label}
                      </span>
                    </div>
                  </motion.div>
                </Link>
              ))}
            </div>
          </div>
        </main>
      </div>
    </Layout>
  );
}