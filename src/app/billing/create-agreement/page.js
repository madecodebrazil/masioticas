"use client";
import { useRouter } from 'next/navigation';
import { useState, useEffect } from 'react';
import { collection, getDocs, setDoc, doc } from "firebase/firestore"; 
import { firestore } from '../../../lib/firebaseConfig';
import Sidebar from '@/components/Sidebar'; 

export default function LentesPage() {
    return (
        <div className="flex w-full min-h-screen">
            <div className="hidden lg:block w-16">
                <Sidebar />
            </div>

            <div className="flex-1 flex flex-col bg-gray-100 min-h-screen">
                <div className="bg-[#932A83] flex-1 flex items-center justify-center p-4 md:p-8">
                    <div className="z-50 bg-white w-full sm:w-[90%] md:w-[90%] lg:w-[60%] flex items-center justify-center p-4 sm:p-8 rounded-3xl shadow-lg border border-gray-300">
                        <LensesForm />
                    </div>
                </div>
            </div>
        </div>
    );
}

function LensesForm() {
    const [formData, setFormData] = useState({
        data: '',
        hora: '',
        pessoa: '',
        cpf: '',
        email: '',
        loja: 'Óticas Popular 1',
        status: 'Em aberto',
        valor: '',
    });
    const [isLoading, setIsLoading] = useState(false);
    const [showSuccessPopup, setShowSuccessPopup] = useState(false);
    const [userSuggestions, setUserSuggestions] = useState([]); // Estado para sugestões de clientes
    const [allConsumers, setAllConsumers] = useState([]); // Todos os consumidores carregados localmente
    const router = useRouter();

    // Carregar todos os consumidores ao montar o componente
    useEffect(() => {
        const fetchAllConsumers = async () => {
            try {
                const consumersCollectionRef = collection(firestore, 'consumers');
                const querySnapshot = await getDocs(consumersCollectionRef);
                const consumers = querySnapshot.docs.map((doc) => ({
                    id: doc.id,
                    cpf: doc.data().cpf,
                    email: doc.data().email,
                    nome: doc.data().nome,
                }));
                console.log("Consumidores carregados:", consumers);
                setAllConsumers(consumers);
            } catch (error) {
                console.error('Erro ao carregar consumidores:', error);
            }
        };

        fetchAllConsumers(); // Chama a função para carregar consumidores

        const now = new Date();
        const dataAtual = now.toISOString().split('T')[0];
        const horaAtual = now.toTimeString().split(' ')[0];
        setFormData((prevData) => ({
            ...prevData,
            data: dataAtual,
            hora: horaAtual,
        }));
        console.log("Data e hora inicializadas:", dataAtual, horaAtual);
    }, []);

    const handleChange = (e) => {
        const { name, value } = e.target;
        setFormData({
            ...formData,
            [name]: value,
        });

        if (name === 'pessoa') {
            filterUserSuggestions(value); // Filtrar sugestões localmente ao digitar o nome
        }
    };

    // Função para filtrar localmente os consumidores
    const filterUserSuggestions = (nome) => {
        if (nome.trim() === "") {
            setUserSuggestions([]); // Limpar sugestões se o campo de nome estiver vazio
            return;
        }

        const nomeLowerCase = nome.toLowerCase(); // Normalizar o nome digitado
        const filteredSuggestions = allConsumers.filter((consumer) =>
            consumer.nome.toLowerCase().includes(nomeLowerCase)
        );

        console.log("Sugestões filtradas:", filteredSuggestions);
        setUserSuggestions(filteredSuggestions);
    };

    const selectUser = (user) => {
        console.log("Cliente selecionado:", user);
        setFormData((prevData) => ({
            ...prevData,
            pessoa: user.nome,
            cpf: user.cpf,    // Preencher CPF ao selecionar um cliente
            email: user.email, // Preencher Email ao selecionar um cliente
        }));
        setUserSuggestions([]); // Limpar sugestões após a seleção
    };

    const handleStatusChange = (status) => {
        console.log("Status selecionado:", status);
        setFormData({
            ...formData,
            status,
        });
    };

    const handleSubmit = async (e) => {
        e.preventDefault();
        setIsLoading(true);
        console.log("Formulário enviado. Dados:", formData);
    
        try {
            // Extrair a data e hora do formulário
            const { data, hora } = formData;
    
            // Separar os componentes da data
            const [year, month, day] = data.split('-').map(Number);
            // Separar os componentes da hora
            const [hours, minutes] = hora.split(':').map(Number);
    
            // Criar o timestamp correto usando Date.UTC
            const combinedDateTime = new Date(Date.UTC(year, month - 1, day, hours, minutes));
    
            // Verificar se o valor do timestamp é válido
            if (isNaN(combinedDateTime.getTime())) {
                throw new Error('Data ou hora inválida.');
            }
    
            // Preparar os dados do formulário, incluindo o timestamp da data/hora combinada
            const agreementData = {
                ...formData,
                data: combinedDateTime, // Salvar o timestamp no campo 'data'
            };
    
            console.log("Dados do acordo com timestamp:", agreementData);
    
            // Definir as referências das coleções com base na loja selecionada
            let docRef;
            if (formData.loja === "Óticas Popular 1") {
                docRef = doc(collection(firestore, 'loja1', 'agreements', 'acordos'));
            } else if (formData.loja === "Óticas Popular 2") {
                docRef = doc(collection(firestore, 'loja2', 'agreements', 'acordos'));
            }
    
            // Salvar o acordo na coleção correta
            await setDoc(docRef, agreementData);
    
            console.log("Acordo registrado com sucesso na loja:", formData.loja);
    
            setShowSuccessPopup(true);
            setIsLoading(false);
    
            setTimeout(() => {
                setShowSuccessPopup(false);
                router.push('/homepage');
            }, 2500);
    
        } catch (error) {
            console.error('Erro ao enviar os dados de acordos:', error);
            setIsLoading(false);
        }
    };
    
    
    

    return (
        <form onSubmit={handleSubmit} className="text-[#800080] w-full space-y-6">
            <h1 className="text-[#932A83] text-2xl font-bold mb-6 text-center">FAZER UM ACORDO</h1>

            <div className="grid grid-cols-2 gap-4">
                <div className="flex flex-col relative">
                    <label className="block text-sm font-bold mb-2 text-[#932A83]">Nome do Cliente *</label>
                    <input
                        type="text"
                        name="pessoa"
                        value={formData.pessoa}
                        onChange={handleChange}
                        placeholder="Nome do cliente"
                        className="border border-[#932A83] rounded w-full py-2 px-3 text-gray-700"
                        required
                    />
                    {userSuggestions.length > 0 && (
                        <ul className="absolute z-10 bg-white border border-gray-300 rounded mt-2 w-full">
                            {userSuggestions.map((user) => (
                                <li
                                    key={user.id}
                                    className="p-2 hover:bg-gray-200 cursor-pointer"
                                    onClick={() => selectUser(user)}
                                >
                                    {user.nome}
                                </li>
                            ))}
                        </ul>
                    )}
                </div>

                <div className="flex flex-col">
                    <label className="block text-sm font-bold mb-2 text-[#932A83]">CPF *</label>
                    <input
                        type="text"
                        name="cpf"
                        value={formData.cpf}
                        onChange={handleChange}
                        placeholder="CPF"
                        className="border border-[#932A83] rounded w-full py-2 px-3 text-gray-700"
                        required
                    />
                </div>

                <div className="flex flex-col">
                    <label className="block text-sm font-bold mb-2 text-[#932A83]">Email *</label>
                    <input
                        type="email"
                        name="email"
                        value={formData.email}
                        onChange={handleChange}
                        placeholder="Email"
                        className="border border-[#932A83] rounded w-full py-2 px-3 text-gray-700"
                        required
                    />
                </div>

                <div className="flex flex-col">
                    <label className="block text-sm font-bold mb-2 text-[#932A83]">Data *</label>
                    <input
                        type="date"
                        name="data"
                        value={formData.data}
                        onChange={handleChange}
                        className="border border-[#932A83] rounded w-full py-2 px-3 text-gray-700"
                        required
                    />
                </div>

                <div className="flex flex-col">
                    <label className="block text-sm font-bold mb-2 text-[#932A83]">Hora *</label>
                    <input
                        type="time"
                        name="hora"
                        value={formData.hora}
                        onChange={handleChange}
                        className="border border-[#932A83] rounded w-full py-2 px-3 text-gray-700"
                        required
                    />
                </div>

                <div className="flex flex-col">
                    <label className="block text-sm font-bold mb-2 text-[#932A83]">Loja *</label>
                    <select
                        name="loja"
                        value={formData.loja}
                        onChange={handleChange}
                        className="border border-[#932A83] rounded w-full py-2 px-3 text-gray-700"
                        required
                    >
                        <option value="Óticas Popular 1">Óticas Popular 1</option>
                        <option value="Óticas Popular 2">Óticas Popular 2</option>
                    </select>
                </div>

                <div className="flex flex-col">
                    <label className="block text-sm font-bold mb-2 text-[#932A83]">Valor da Dívida *</label>
                    <input
                        type="text"
                        name="valor"
                        value={formData.valor}
                        onChange={handleChange}
                        placeholder="Valor da dívida"
                        className="border border-[#932A83] rounded w-full py-2 px-3 text-gray-700"
                        required
                    />
                </div>
            </div>

            <div className="mt-6">
                <label className="block text-sm font-bold mb-2 text-[#932A83]">Status *</label>
                <div className="flex space-x-4">
                    <button
                        type="button"
                        className={`border border-[#932A83] rounded py-2 px-4 ${formData.status === 'Em aberto' ? 'bg-[#932A83] text-white' : 'text-[#932A83] bg-white'}`}
                        onClick={() => handleStatusChange('Em aberto')}
                    >
                        EM ABERTO
                    </button>
                    <button
                        type="button"
                        className={`border border-[#932A83] rounded py-2 px-4 ${formData.status === 'Advogado' ? 'bg-[#932A83] text-white' : 'text-[#932A83] bg-white'}`}
                        onClick={() => handleStatusChange('Advogado')}
                    >
                        ADVOGADO
                    </button>
                    <button
                        type="button"
                        className={`border border-[#932A83] rounded py-2 px-4 ${formData.status === 'Judicial' ? 'bg-[#932A83] text-white' : 'text-[#932A83] bg-white'}`}
                        onClick={() => handleStatusChange('Judicial')}
                    >
                        JUDICIAL
                    </button>
                </div>
            </div>

            <div className="flex justify-center space-x-4 mt-6">
                <button
                    type="button"
                    className="bg-[#932A83] text-white py-2 px-4 rounded hover:bg-[#7a1b6b]"
                    onClick={() => setFormData({
                        data: '',
                        hora: '',
                        pessoa: '',
                        cpf: '',
                        email: '',
                        loja: 'Óticas Popular 1',
                        status: 'Em aberto',
                        valor: '',
                    })}
                >
                    LIMPAR
                </button>

                <button
                    type="submit"
                    className="bg-[#932A83] text-white py-2 px-4 rounded hover:bg-[#7a1b6b]"
                    disabled={isLoading}
                >
                    {isLoading ? 'Salvando...' : 'REGISTRAR'}
                </button>
            </div>

            {showSuccessPopup && (
                <div className="fixed inset-0 bg-black bg-opacity-50 flex justify-center items-center">
                    <div className="bg-white p-6 rounded shadow-lg">
                        <p className="text-lg font-bold text-green-600">Acordo registrado com sucesso!</p>
                    </div>
                </div>
            )}
        </form>
    );
}
