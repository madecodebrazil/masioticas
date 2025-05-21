"use client";

import { useState, useEffect } from 'react';
import { signInWithEmailAndPassword } from 'firebase/auth';
import { FaEye, FaEyeSlash } from 'react-icons/fa';
import { useRouter } from 'next/navigation';
import { auth } from '../../lib/firebaseConfig';
import { motion } from 'framer-motion';
import Link from 'next/link';

export default function Login() {
    const [email, setEmail] = useState('');
    const [password, setPassword] = useState('');
    const [passwordVisible, setPasswordVisible] = useState(false); // Estado para controlar visibilidade
    const [error, setError] = useState('');
    const [isButtonDisabled, setIsButtonDisabled] = useState(true); // Botão desabilitado inicialmente
    const [isLoading, setIsLoading] = useState(false); // Controla o estado "Entrando..."
    const [isMobile, setIsMobile] = useState(false); // Estado para verificar se a tela é mobile
    const router = useRouter();

    // Função de login
    const handleLogin = async (e) => {
        e.preventDefault();

        // Validação dos campos antes de tentar login
        if (!email || !password) {
            setError('Por favor, preencha o e-mail e a senha.');
            return;
        }

        try {
            setIsLoading(true); // Exibe o estado "Entrando..." enquanto faz login
            await signInWithEmailAndPassword(auth, email, password);
            router.push('/homepage');
        } catch (err) {
            setError(getFirebaseErrorMessage(err)); // Define a mensagem de erro apropriada
            console.log(err);
        } finally {
            setIsLoading(false); // Reabilitar o botão após o processo
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
                case 'auth/wrong-password':
                    return 'Senha incorreta. Verifique sua senha e tente novamente.';
                case 'auth/too-many-requests':
                    return 'Muitas tentativas falhas de login. Tente novamente mais tarde.';
                case 'auth/network-request-failed':
                    return 'Falha de conexão com a rede. Verifique sua conexão e tente novamente.';
                case 'auth/invalid-credential':
                    return 'Email ou senha incorretos, tente novamente.';
                default:
                    return 'Um erro inesperado ocorreu. Tente novamente mais tarde.';
            }
        }
        return 'Um erro desconhecido ocorreu.';
    };

    // Detectar quando o usuário está em um dispositivo mobile
    useEffect(() => {
        const handleResize = () => {
            setIsMobile(window.innerWidth <= 768); // Define como mobile se a largura da tela for <= 768px
        };

        handleResize(); // Verificar imediatamente ao carregar
        window.addEventListener('resize', handleResize); // Atualizar quando a janela for redimensionada

        return () => {
            window.removeEventListener('resize', handleResize);
        };
    }, []);

    // Habilitar ou desabilitar o botão com base nos campos de email e senha
    useEffect(() => {
        setIsButtonDisabled(email === '' || password === ''); // Desabilitar se o email ou senha estiverem vazios
    }, [email, password]);

    return (
        <motion.div
            initial={{ opacity: 0, scale: 0.9 }}
            animate={{ opacity: 1, scale: 1 }}
            exit={{ opacity: 0, scale: 0.9 }}
            transition={{ duration: 0.5 }}
            className="flex h-screen w-full relative overflow-hidden bg-cover bg-center"
            style={{ backgroundImage: "url('/images/login.png')" }}
        >
            {/* Overlay gradiente para melhorar contraste */}
            <div className="absolute inset-0 bg-gradient-to-r from-black/40 to-black/60 z-0"></div>

            {/* Div da esquerda */}
            {!isMobile && (
                <div className="w-1/2 h-full relative flex justify-start items-start z-10">
                    <div className='flex items-start'>
                        <img src="/images/masioticaslogo.png" alt="Logo" className="w-44" />
                    </div>
                </div>
            )}

            {/* Div da direita com o formulário de login */}
            <div className={`${isMobile ? 'w-full' : 'w-1/2'} flex flex-col justify-center items-center relative z-10`}>
                <div className='flex w-[610px] items-center justify-center h-[400px] md:h-[500px] rounded-2xl'>
                    {/* Conteúdo do formulário permanece o mesmo */}
                    <div className="box-it w-full max-w-xs">
                        <h2 className="text-center text-white text-5xl font-semibold mb-6">Entrar</h2>

                        {error && <p className="text-red-500 text-sm text-center mb-4">{error}</p>}

                        <form onSubmit={handleLogin} className="flex flex-col">
                            <label htmlFor="email" className="text-[#81059e] pb-2 font-semibold"></label>
                            <input
                                type="email"
                                id="email"
                                name="email"
                                placeholder="E-mail"
                                value={email}
                                onChange={(e) => setEmail(e.target.value)}
                                className="mb-1 px-4 text-black py-2 rounded-sm border-2 bg-white border-gray-300 bg-transparent "
                                required
                            />

                            <label htmlFor="password" className="text-[#81059e] pb-2 font-semibold"></label>
                            <div className='relative'>
                                <input
                                    type={passwordVisible ? 'text' : 'password'}
                                    placeholder="Senha"
                                    value={password}
                                    onChange={(e) => setPassword(e.target.value)}
                                    className="mb-4 px-4 py-2 text-black rounded-sm border-2 bg-white border-gray-300 bg-transparent w-full"
                                />
                                <button
                                    type="button"
                                    onClick={() => setPasswordVisible(!passwordVisible)}
                                    className="absolute right-4 top-1/3 transform -translate-y-1/2 text-xl text-gray-600 pt-2 pr-1"
                                >
                                    {passwordVisible ? <FaEyeSlash /> : <FaEye />}
                                </button>
                            </div>

                            <div className='flex justify-between'>
                                <a href='#' className='text-left text-purple-300 underline text-sm pl-1'>Cliente? Cadastre-se</a>
                                <Link href="/login/reset_password" className='text-right text-purple-300 underline text-sm pr-1'>
                                    Esqueceu a senha?
                                </Link>
                            </div>

                            <div className="btn flex justify-center mt-4">
                                <button
                                    type="submit"
                                    className={`w-full text-base text-white font-semibold bg-[#81059e] border border-[#81059e] rounded-sm px-4 py-3 hover:bg-opacity-90 transition-all duration-300 ${isButtonDisabled || isLoading ? 'opacity-50 cursor-not-allowed' : ''}`}
                                    disabled={isButtonDisabled || isLoading}
                                >
                                    {isLoading ? 'Carregando' : 'Fazer Login'}
                                </button>
                            </div>
                        </form>
                    </div>

                    {/* Onda posicionada no canto inferior direito */}
                    <img
                        src="/images/img.png"
                        alt="Onda"
                        className="absolute bottom-0 right-0 w-[200px] h-auto z-[-1]"
                    />
                </div>

                {/* Div para o mobile em cima do formulário */}
                {isMobile && (
                    <div className="absolute top-0 w-full h-[110px] flex justify-center items-center z-20">
                        <img src="/images/masioticaslogo.png" alt="Logo" className="logo w-44 pt-4" />
                    </div>
                )}
            </div>
        </motion.div>
    );
}
