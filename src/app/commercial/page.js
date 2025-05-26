"use client";

import Link from 'next/link';
import Image from 'next/image';
import { motion } from 'framer-motion';
import Layout from '@/components/Layout';

export default function ProductsPage() {
    // Defina os ícones e rótulos dos produtos
    const productsItems = [
        { icon: '/images/FA.png', label: 'Venda', route: '/sales' },
        { icon: '/images/CD.png', label: 'Caixa diário', route: '/finance/cashier_day' },
        { icon: '/images/catalogos.png', label: 'Catálogos', route: '/commercial/brochure' },
        { icon: '/images/catalogos.png', label: 'Consulta SPC e SERASA', route: '/commercial/brochure' },
        { icon: '/images/catalogos.png', label: 'Buscador de Lentes', route: '/commercial/brochure' },
    ];

    return (
        <Layout>
            <div className="w-full">
                <div className="grid items-center grid-cols-2 gap-8 sm:grid-cols-3 md:grid-cols-2">
                <h1 className='text-4xl ml-0 md:ml-4 font-bold text-[#9a5fc7] text-center md:text-left'>Comercial</h1>
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
                                        backgroundImage: `url('/images/fundo.png')`,
                                        backgroundSize: 'cover',
                                        backgroundRepeat: 'no-repeat',
                                        backgroundPosition: 'center',
                                    }}
                                ></div>

                                <div className="relative z-10 flex flex-row justify-start items-center w-full h-full">
                                    <Image
                                        src={item.icon}
                                        alt={item.label}
                                        width={50}
                                        height={50}
                                        className="object-contain mr-4"
                                    />
                                    <span className="text-white font-bold text-lg text-left flex-grow">
                                        {item.label}
                                    </span>
                                </div>
                            </motion.div>
                        </Link>
                    ))}
                </div>
            </div>
        </Layout>
    );
}