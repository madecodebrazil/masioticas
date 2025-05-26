"use client";

import { useState, useEffect } from 'react';
import { sendPasswordResetEmail } from 'firebase/auth';
import { useRouter } from 'next/navigation';
import { auth } from '../../../lib/firebaseConfig';
import { motion } from 'framer-motion';
import Link from 'next/link';

export default function ResetPassword() {
    const [email, setEmail] = useState('');
    const [error, setError] = useState('');
    const [success, setSuccess] = useState(false);
    const [isButtonDisabled, setIsButtonDisabled] = useState(true);
    const [isLoading, setIsLoading] = useState(false);
    const [isMobile, setIsMobile] = useState(false);
    const router = useRouter();

    // Função para enviar o email de redefinição de senha
    const handleResetPassword = async (e) => {
        e.preventDefault();

        // Validação do email antes de enviar
        if (!email) {
            setError('Por favor, informe o seu e-mail.');
            return;
        }

        try {
            setIsLoading(true);
            await sendPasswordResetEmail(auth, email);
            setSuccess(true);
            setError('');
        } catch (err) {
            setError(getFirebaseErrorMessage(err));
            console.error(err);
        } finally {
            setIsLoading(false);
        }
    };

    // Função para mapear os erros do Firebase e retornar mensagens amigáveis
    const getFirebaseErrorMessage = (error) => {
        if (error && error.code) {
            switch (error.code) {
                case 'auth/invalid-email':
                    return 'Endereço de email inválido. Por favor, insira um email válido.';
                case 'auth/user-not-found':
                    return 'Nenhum usuário encontrado com este e-mail. Verifique e tente novamente.';
                case 'auth/too-many-requests':
                    return 'Muitas tentativas de envio. Tente novamente mais tarde.';
                case 'auth/network-request-failed':
                    return 'Falha de conexão com a rede. Verifique sua conexão e tente novamente.';
                default:
                    return 'Um erro inesperado ocorreu. Tente novamente mais tarde.';
            }
        }
        return 'Um erro desconhecido ocorreu.';
    };

    // Detectar quando o usuário está em um dispositivo mobile
    useEffect(() => {
        const handleResize = () => {
            setIsMobile(window.innerWidth <= 768);
        };

        handleResize(); 
        window.addEventListener('resize', handleResize);

        return () => {
            window.removeEventListener('resize', handleResize);
        };
    }, []);

    // Habilitar ou desabilitar o botão com base no campo de email
    useEffect(() => {
        setIsButtonDisabled(email === '' || !isValidEmail(email));
    }, [email]);

    // Função para validar formato de email
    const isValidEmail = (email) => {
        const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
        return emailRegex.test(email);
    };

    return (
        <motion.div
            initial={{ opacity: 0, scale: 0.9 }}
            animate={{ opacity: 1, scale: 1 }}
            exit={{ opacity: 0, scale: 0.9 }}
            transition={{ duration: 0.5 }}
            className="flex h-screen w-full relative overflow-hidden bg-cover bg-center"
            style={{ backgroundImage: "url('/images/login.png')" }}
        >
            {/* Overlay gradiente */}
            <div className="absolute inset-0 bg-gradient-to-r from-black/40 to-black/60 z-0"></div>

            {/* Div da esquerda (visível apenas em desktop) */}
            {!isMobile && (
                <div className="w-1/2 h-full relative flex justify-start items-start z-10">
                    <div className='flex items-start'>
                        <img src="/images/masioticaslogo.png" alt="Logo" className="w-44" />
                    </div>
                </div>
            )}

            {/* Div da direita com o formulário de redefinição */}
            <div className={`${isMobile ? 'w-full' : 'w-1/2'} flex flex-col justify-center items-center relative z-10`}>
                <div className='flex w-[610px] items-center justify-center h-[400px] md:h-[500px] rounded-2xl'>
                    {/* Conteúdo do formulário */}
                    <div className="box-it w-full max-w-xs">
                        <h2 className="text-center text-white text-4xl font-semibold mb-4">Recuperar Senha</h2>
                        
                        {success ? (
                            <div className="bg-green-100 border border-green-400 text-green-700 px-4 py-3 rounded mb-4">
                                <p>Email enviado com sucesso! Verifique sua caixa de entrada e siga as instruções para redefinir sua senha.</p>
                                <div className="mt-4 text-center">
                                    <Link href="/login">
                                        <button className="text-[#81059e] hover:underline">
                                            Voltar para o login
                                        </button>
                                    </Link>
                                </div>
                            </div>
                        ) : (
                            <>
                                <p className="text-white text-sm text-center mb-6">
                                    Informe seu email cadastrado para receber as instruções de recuperação de senha.
                                </p>

                                {error && <p className="text-red-500 text-sm text-center mb-4">{error}</p>}

                                <form onSubmit={handleResetPassword} className="flex flex-col">
                                    <label htmlFor="email" className="text-[#81059e] pb-2 font-semibold"></label>
                                    <input
                                        type="email"
                                        id="email"
                                        name="email"
                                        placeholder="E-mail"
                                        value={email}
                                        onChange={(e) => setEmail(e.target.value)}
                                        className="mb-4 px-4 text-black py-2 rounded-sm border-2 bg-white border-gray-300 bg-transparent"
                                        required
                                    />

                                    <div className="btn flex justify-center mt-4">
                                        <button
                                            type="submit"
                                            className={`w-full text-base text-white font-semibold bg-[#81059e] border border-[#81059e] rounded-sm px-4 py-3 hover:bg-opacity-90 transition-all duration-300 ${
                                                isButtonDisabled || isLoading ? 'opacity-50 cursor-not-allowed' : ''
                                            }`}
                                            disabled={isButtonDisabled || isLoading}
                                        >
                                            {isLoading ? 'Enviando...' : 'Enviar Email'}
                                        </button>
                                    </div>
                                    
                                    <div className="mt-4 text-center">
                                        <Link href="/login">
                                            <button className="text-purple-300 hover:underline">
                                                Voltar para o login
                                            </button>
                                        </Link>
                                    </div>
                                </form>
                            </>
                        )}
                    </div>

                    {/* Onda no canto inferior direito */}
                    <img
                        src="/images/img.png"
                        alt="Onda"
                        className="absolute bottom-0 right-0 w-[200px] h-auto z-[-1]"
                    />
                </div>

                {/* Logo no topo para mobile */}
                {isMobile && (
                    <div className="absolute top-0 w-full h-[110px] flex justify-center items-center z-20">
                        <img src="/images/masioticaslogo.png" alt="Logo" className="logo w-44 pt-4" />
                    </div>
                )}
            </div>
        </motion.div>
    );
}