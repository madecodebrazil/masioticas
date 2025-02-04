"use client";

import { useState, useEffect } from 'react';
import { signInWithEmailAndPassword } from 'firebase/auth';
import { FaEye, FaEyeSlash } from 'react-icons/fa'; // Importa os ícones de olho
import { useRouter } from 'next/navigation';
import { auth } from '../../lib/firebaseConfig';
import { motion } from 'framer-motion';

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
            className="flex h-screen w-full bg-gradient-to-b from-white to-[#DBE4F8] relative overflow-hidden"
        >
            {/* Div da esquerda com o gradiente roxo e rounded apenas na direita */}
            {!isMobile && (
                <div dir="rtl" className="w-1/2 h-full relative flex justify-end bg-[#9000ff]">
                    <div className='flex items-start'>
                        <img src="/images/logomasi_branca.png " alt="Logo" className="h-20 p-4" /></div>
                    <img src="/images/hero_mulher.png" alt="Estático" className="w-3/4 h-auto absolute transform -translate-x-1/2 -translate-y-1/2 top-1/2 left-1/2" />
                </div>
            )}

            {/* Div da direita com o formulário de login */}
            <div className={`box ${isMobile ? 'w-full' : 'w-1/2'} flex flex-col justify-center items-center relative z-10 bg-[#9000ff]`}>

                <div className='flex bg-white w-[610px] items-center justify-center h-[400px] md:h-[500px] rounded-2xl'>

                    <div className="box-it w-full max-w-xs">
                        <h2 className="text-center text-[#9000ff] text-5xl font-semibold mb-6">Entrar</h2>

                        {error && <p className="text-red-500 text-sm text-center mb-4">{error}</p>}

                        <form onSubmit={handleLogin} className="flex flex-col">
                            <label htmlFor="email" className="text-[#9000ff] pb-2 font-semibold"></label>
                            <input
                                type="email"
                                id="email"
                                name="email"
                                placeholder="E-mail"
                                value={email}
                                onChange={(e) => setEmail(e.target.value)}
                                className="mb-1 px-4 text-black py-2 rounded-xl border-2 border-gray-300 bg-transparent "
                                required
                            />

                            <label htmlFor="password" className="text-[#9000ff] pb-2 font-semibold"></label>
                            <div className='relative'>
                                <input
                                    type={passwordVisible ? 'text' : 'password'} // Alterna entre 'text' e 'password'
                                    placeholder="Senha"
                                    value={password}
                                    onChange={(e) => setPassword(e.target.value)}
                                    className="mb-4 px-4 py-2 text-black rounded-xl border-2 border-gray-300 bg-transparent w-full"
                                />
                                <button
                                    type="button"
                                    onClick={() => setPasswordVisible(!passwordVisible)} // Alterna a visibilidade
                                    className="absolute right-4 top-1/3 transform -translate-y-1/2 text-xl text-gray-600 pt-2 pr-1"
                                >
                                    {passwordVisible ? <FaEyeSlash /> : <FaEye />} {/* Mostra o ícone de olho */}
                                </button>
                            </div>

                            <div className="btn flex justify-center mt-6">
                                <button
                                    type="submit"
                                    className={`w-full text-base text-white font-semibold bg-[#9000ff] border border-[#9000ff] rounded-xl px-4 py-3 hover:bg-opacity-90 transition-all duration-300 ${isButtonDisabled || isLoading ? 'opacity-50 cursor-not-allowed' : ''}`}
                                    disabled={isButtonDisabled || isLoading} // Desabilitar o botão se estiver vazio ou carregando
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

                {/* Div roxa para o mobile em cima do formulário, com altura reduzida */}
                {isMobile && (
                    <div className="absolute top-0 w-full h-[110px] flex justify-center items-center z-10">
                       <img src="/images/logomasi_branca.png " alt="Logo" className="logo h-20 p-4" />
                    </div>
                )}
            </div>
        </motion.div>
    );
}
