"use client"; 

import React from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';
import { faArrowLeft, faHardHat, faTools } from '@fortawesome/free-solid-svg-icons';

export default function OnlineStore() {
  const router = useRouter();

  return (
    <div className="flex flex-col items-center justify-center min-h-screen bg-gradient-to-b from-[#81059e] to-[#B7328C] p-4">
      <div className="bg-white rounded-lg shadow-2xl p-8 max-w-lg w-full text-center">
        <div className="flex justify-center mb-6">
          <FontAwesomeIcon 
            icon={faHardHat} 
            className="text-[#81059e] text-8xl"
          />
        </div>
        
        <h1 className="text-3xl font-bold text-[#81059e] mb-4">
          Em Construção
        </h1>
        
        <p className="text-gray-600 mb-8 text-lg">
          A <span className='text-purple-400 block'>Página de Integrações</span> da Masi Óticas está sendo desenvolvida. 
          Em breve você terá acesso a todos os nossos produtos.
        </p>
        
        <div className="flex flex-col sm:flex-row items-center justify-center gap-4">
          <button 
            onClick={() => router.back()} 
            className="flex items-center justify-center gap-2 bg-[#81059e] text-white px-6 py-3 rounded-md hover:bg-[#9b32b2] transition-colors"
          >
            <FontAwesomeIcon icon={faArrowLeft} />
            <span>Voltar</span>
          </button>
          
          <Link href="/homepage">
            <button className="flex items-center justify-center gap-2 bg-[#D291BC] text-white px-6 py-3 rounded-md hover:bg-[#e0a5cc] transition-colors">
              <FontAwesomeIcon icon={faTools} />
              <span>Ir para Dashboard</span>
            </button>
          </Link>
        </div>
      </div>
    </div>
  );
}