"use client";

import { motion } from 'framer-motion';
import Sidebar from './Sidebar'; // Certifique-se de ajustar o caminho para o componente Sidebar

export default function Header() {
    // Variáveis de animação para o header
    const containerVariants = {
        hidden: { opacity: 0, translateY: -50 },
        visible: {
            opacity: 1,
            translateY: 0,
            transition: { duration: 1, ease: 'easeOut' },
        },
    };

    return (
        <motion.div
            initial="hidden"
            animate="visible"
            variants={containerVariants}
            className="absolute inset-0 bg-gradient-to-b from-[#81059e] to-[#E437CA] z-0"
        />
    );
}
