"use client";

import Link from 'next/link';
import Image from 'next/image';
import { motion } from 'framer-motion';
import Layout from '@/components/Layout';

export default function ProductsPage() {
    const productsItems = [
        { icon: '/images/estoque/Graph.png', label: 'Controle de Produtos', route: '/stock/product-control' },
        { icon: '/images/estoque/Change.png', label: 'Trocas', route: '/stock/exchanges' },
        { icon: '/images/estoque/Supplier.png', label: 'Fornecedores', route: '/register/suppliers' },
        { icon: '/images/estoque/Logistics.png', label: 'Entregas', route: '/stock/delivery' },
        { icon: '/images/estoque/Montagem.png', label: 'Montagem', route: '/stock/assembly' },
        { icon: '/images/estoque/Puzzle.png', label: 'Avarias', route: '/stock/breakdown' },
    ];

    return (
        <Layout>
            <div className="w-full mb-28">
                <div className="grid items-center grid-cols-2 gap-8 sm:grid-cols-3 md:grid-cols-2">
                    <h1 className='text-4xl ml-0 md:ml-4 font-bold text-[#9a5fc7] text-center md:text-left'>Estoque</h1>
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
                                {/* Imagem de fundo sutil */}
                                <div
                                    className="absolute inset-0 opacity-10 pointer-events-none"
                                    style={{
                                        backgroundImage: `url('/images/fundo.png')`,
                                        backgroundSize: 'cover',
                                        backgroundRepeat: 'no-repeat',
                                        backgroundPosition: 'center',
                                    }}
                                ></div>

                                <Image
                                    src={item.icon}
                                    alt={item.label}
                                    width={50}
                                    height={50}
                                    className="object-contain mr-2"
                                />
                                <span className="text-white font-bold text-lg flex-grow text-left">
                                    {item.label}
                                </span>
                            </motion.div>
                        </Link>
                    ))}
                </div>
            </div>
        </Layout>
    );
}