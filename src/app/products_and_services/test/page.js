"use client";
import React, { useEffect, useState } from 'react';
import Layout from '@/components/Layout';
import { doc, setDoc, getDocs, collection } from 'firebase/firestore';
import { getStorage, ref, uploadBytes, getDownloadURL } from 'firebase/storage';
import { firestore } from '../../../lib/firebaseConfig';
import Link from 'next/link';

export default function FormularioLentes() {
    const [selectedLojas, setSelectedLojas] = useState([]);
    const [formData, setFormData] = useState({
        produto: "",
        data: "",
        hora: "",
        fabricante: "",
        distribuidor: "",
        marca: "",
        familia: "",
        tipo: "",
        formato: "",
        material: "",
        indice: "",
        recursos: "",
        tratamentos: "",
        NCM: "",
        custo: "",
        valor: "",
        imagem: null
    });
    const [isLoading, setIsLoading] = useState(false);
    const [showSuccessPopup, setShowSuccessPopup] = useState(false);
    const [fabricantes, setFabricantes] = useState([]);
    const [distribuidores, setDistribuidores] = useState([]);
    const [marcas, setMarcas] = useState([]);
    const [familias, setFamilias] = useState([]);
    const [tipos, setTipos] = useState([]);
    const [formatos, setFormatos] = useState([]);
    const [materiais, setMateriais] = useState([]);
    const [indices, setIndices] = useState([]);
    const [recursos, setRecursos] = useState([]);
    const [tratamentos, setTratamentos] = useState([]);

    useEffect(() => {
        const now = new Date();
        const date = now.toISOString().split("T")[0];
        const time = now.toTimeString().split(":").slice(0, 2).join(":");
        setFormData((prevData) => ({
            ...prevData,
            data: date,
            hora: time,
        }));
    }, []);
    const handleLojaClick = (loja) => {
        setSelectedLojas((prevSelectedLojas) => {
            if (prevSelectedLojas.includes(loja)) {
                return prevSelectedLojas.filter((selectedLoja) => selectedLoja !== loja);
            } else {
                return [...prevSelectedLojas, loja];
            }
        });
    };
    // Funções para buscar dados do Firestore
    const fetchFabricantes = async () => {
        try {
            const snapshot = await getDocs(collection(firestore, 'lentes_fabricantes'));
            setFabricantes(snapshot.docs.map(doc => doc.data().name));
        } catch (error) {
            console.error('Erro ao buscar fabricantes:', error);
        }
    };

    const fetchDistribuidores = async () => {
        try {
            const snapshot = await getDocs(collection(firestore, 'lentes_distribuidores'));
            setDistribuidores(snapshot.docs.map(doc => doc.data().name));
        } catch (error) {
            console.error('Erro ao buscar distribuidores:', error);
        }
    };

    const fetchMarcas = async () => {
        try {
            const snapshot = await getDocs(collection(firestore, 'lentes_marcas'));
            setMarcas(snapshot.docs.map(doc => doc.data().name));
        } catch (error) {
            console.error('Erro ao buscar marcas:', error);
        }
    };

    const fetchFamilias = async () => {
        try {
            const snapshot = await getDocs(collection(firestore, 'lentes_familias'));
            setFamilias(snapshot.docs.map(doc => doc.data().name));
        } catch (error) {
            console.error('Erro ao buscar famílias:', error);
        }
    };

    const fetchTipos = async () => {
        try {
            const snapshot = await getDocs(collection(firestore, 'lentes_tipos'));
            setTipos(snapshot.docs.map(doc => doc.data().name));
        } catch (error) {
            console.error('Erro ao buscar tipos:', error);
        }
    };

    const fetchFormatos = async () => {
        try {
            const snapshot = await getDocs(collection(firestore, 'lentes_formatos'));
            setFormatos(snapshot.docs.map(doc => doc.data().name));
        } catch (error) {
            console.error('Erro ao buscar formatos:', error);
        }
    };

    const fetchMateriais = async () => {
        try {
            const snapshot = await getDocs(collection(firestore, 'lentes_materiais'));
            setMateriais(snapshot.docs.map(doc => doc.data().name));
        } catch (error) {
            console.error('Erro ao buscar materiais:', error);
        }
    };

    const fetchIndices = async () => {
        try {
            const snapshot = await getDocs(collection(firestore, 'lentes_indices'));
            setIndices(snapshot.docs.map(doc => doc.data().value));
        } catch (error) {
            console.error('Erro ao buscar índices:', error);
        }
    };

    const fetchRecursos = async () => {
        try {
            const snapshot = await getDocs(collection(firestore, 'lentes_recursos'));
            setRecursos(snapshot.docs.map(doc => doc.data().name));
        } catch (error) {
            console.error('Erro ao buscar recursos:', error);
        }
    };

    const fetchTratamentos = async () => {
        try {
            const snapshot = await getDocs(collection(firestore, 'lentes_tratamentos'));
            setTratamentos(snapshot.docs.map(doc => doc.data().name));
        } catch (error) {
            console.error('Erro ao buscar tratamentos:', error);
        }
    };

    useEffect(() => {
        fetchFabricantes();
        fetchDistribuidores();
        fetchMarcas();
        fetchFamilias();
        fetchTipos();
        fetchFormatos();
        fetchMateriais();
        fetchIndices();
        fetchRecursos();
        fetchTratamentos();
    }, []);

    const handleChange = (e) => {
        const { name, value, files } = e.target;
        setFormData((prevData) => ({
            ...prevData,
            [name]: files ? files[0] : value
        }));
    };
    const handleClearSelection = () => {
        const now = new Date();
        const date = now.toISOString().split("T")[0]; // Data atual
        const time = now.toTimeString().split(":").slice(0, 2).join(":"); // Hora atual

        // Limpa os campos do formulário e a seleção de lojas
        setFormData({
            data: date,
            hora: time,
            fabricante: "",
            distribuidor: "",
            marca: "",
            familia: "",
            tipo: "",
            formato: "",
            material: "",
            indice: "",
            recursos: "",
            tratamentos: "",
            NCM: "",
            custo: "",
            valor: "",
            imagem: null
        });

        // Limpa a seleção de lojas
        setSelectedLojas([]);
    };


    const handleSubmit = async (e) => {
        e.preventDefault();
        setIsLoading(true);
        let imageUrl = null;

        try {
            // Upload da imagem, se houver
            if (formData.imagem) {
                const storage = getStorage();
                const storageRef = ref(storage, `lentes/${formData.imagem.name}`);
                await uploadBytes(storageRef, formData.imagem);
                imageUrl = await getDownloadURL(storageRef);
            }

            // Dados para enviar ao Firestore, incluindo a imagem
            const dataToSend = { ...formData, imagem: imageUrl };

            // Verifica se alguma loja foi selecionada
            if (selectedLojas.length === 0) {
                alert('Selecione ao menos uma loja antes de enviar o formulário');
                setIsLoading(false);
                return;
            }

            // Envia para cada loja selecionada
            for (const loja of selectedLojas) {
                const firestoreCollection = loja === 'Loja 1' ? 'loja1_lentes' : 'loja2_lentes';
                // Aqui usamos o nome do produto em vez da marca para o documento
                const docRef = doc(firestore, firestoreCollection, formData.produto);
                await setDoc(docRef, dataToSend);
            }

            // Exibe popup de sucesso e reseta o estado
            setShowSuccessPopup(true);
            setTimeout(() => {
                setShowSuccessPopup(false);
            }, 2500);

            console.log('Produto enviado com sucesso!', dataToSend);
        } catch (error) {
            console.error('Erro ao enviar o produto: ', error);
        } finally {
            setIsLoading(false);
        }
    };


    return (
        <div>
            <Layout>
                <div className="relative flex items-center mt-4">
                    {/* Ícone na extrema esquerda */}
                    <Link href="/products_and_services/lenses">
                        <img
                            src="/images/angle-left-solid.svg" // Caminho para o ícone
                            alt="Ícone de voltar"
                            className="cursor-pointer hover:opacity-80 transition" // Adiciona hover com pointer e transição de opacidade
                            style={{ width: '20px', height: '20px' }} // Define o tamanho do ícone
                        />
                    </Link>

                    {/* Botão centralizado "LENTES REGISTRADAS" */}
                    <div className="flex items-center justify-center space-x-4 mx-auto">
                        <button
                            className="bg-[#800080] text-white font-bold px-6 py-2 rounded-lg shadow hover:bg-[#660066] transition inline-flex items-center"
                            onClick={() => Router.push('/products/lentes')} // Lógica para exibir lentes registradas
                        >
                            LENTES REGISTRADAS
                        </button>

                        {/* Botão "LIMPAR SELEÇÃO" próximo ao botão "LENTES REGISTRADAS" */}
                        <button
                            type="button"
                            className="bg-[#800080] text-white font-bold px-6 py-2 rounded-lg shadow hover:bg-[#660066] transition"
                            onClick={handleClearSelection} // Chama a função para limpar a seleção
                        >
                            LIMPAR SELEÇÃO
                        </button>
                    </div>
                </div>

                <h2 className="text-3xl text-center font-semibold text-[#800080]">ADICIONAR LENTE</h2>
                <form onSubmit={handleSubmit} className="space-y-6">
                    <div className="flex-1">
                        <label className="block text-md font-bold text-[#800080]">Data:</label>
                        <input
                            type="date"
                            name="data"
                            value={formData.data}
                            onChange={handleChange}
                            className="bg-gray-100 px-4 py-2 rounded-lg text-black w-full mt-2"
                        />
                    </div>

                    {/* Campo de Hora */}
                    <div className="flex-1">
                        <label className="block text-md font-bold text-[#800080]">Hora:</label>
                        <input
                            type="time"
                            name="hora"
                            value={formData.hora}
                            onChange={handleChange}
                            className="bg-gray-100 px-4 py-2 rounded-lg text-black w-full mt-2"
                        />
                    </div>
                    {/* Seção para selecionar a loja (alinhado ao flex-end) */}
                    <div className="flex-1">
                        <h3 className="text-md font-bold text-[#800080] mb-2">Loja</h3>
                        <div className="flex space-x-4">
                            {['Loja 1', 'Loja 2'].map((loja) => (
                                <button
                                    key={loja}
                                    type="button"
                                    onClick={() => handleLojaClick(loja)}
                                    className={`py-2 px-4 border-2 rounded-lg font-bold transition-all duration-300 whitespace-nowrap ${selectedLojas.includes(loja)
                                        ? 'border-[#800080] text-white bg-[#754099]'
                                        : 'border-[#800080] text-black hover:bg-[#81059e] hover:text-white'
                                        }`}
                                >
                                    {loja.toUpperCase()}
                                </button>
                            ))}
                        </div>
                    </div>
                    {/* FABRICANTE */}
                    <div className="space-y-4">
                        <h3 className="text-lg font-semibold text-[#800080]">Fabricante:</h3>
                        <div className="grid grid-cols-3 gap-3">
                            {fabricantes.map((fabricante) => (
                                <button
                                    key={fabricante}
                                    type="button"
                                    onClick={() => setFormData({ ...formData, fabricante })}
                                    className={`py-2 px-4 border rounded-lg font-bold text-center transition-all duration-300 ease-in-out transform
                                        ${formData.fabricante === fabricante
                                            ? 'bg-[#800080] text-white shadow-lg scale-105'
                                            : 'bg-white text-black border border-[#800080] hover:bg-[#800080] hover:text-white'}`}
                                >
                                    {fabricante.toUpperCase()}
                                </button>
                            ))}
                        </div>
                    </div>
                    {/* DISTRIBUIDOR */}
                    <div className="space-y-4">
                        <h3 className="text-lg font-semibold text-[#800080]">Distribuidor:</h3>
                        <div className="grid grid-cols-3 gap-3">
                            {distribuidores.map((distribuidor) => (
                                <button
                                    key={distribuidor}
                                    type="button"
                                    onClick={() => setFormData({ ...formData, distribuidor })}
                                    className={`py-2 px-4 border rounded-lg font-bold text-center transition-all duration-300 ease-in-out transform
                                        ${formData.distribuidor === distribuidor
                                            ? 'bg-[#800080] text-white shadow-lg scale-105'
                                            : 'bg-white text-black border border-[#800080] hover:bg-[#800080] hover:text-white'}`}
                                >
                                    {distribuidor.toUpperCase()}
                                </button>
                            ))}
                        </div>
                    </div>
                    {/* MARCA */}
                    <div className="space-y-4">
                        <h3 className="text-lg font-semibold text-[#800080]">Marca:</h3>
                        <div className="grid grid-cols-3 gap-3">
                            {marcas.map((marca) => (
                                <button
                                    key={marca}
                                    type="button"
                                    onClick={() => setFormData({ ...formData, marca })}
                                    className={`py-2 px-4 border rounded-lg font-bold text-center transition-all duration-300 ease-in-out transform
                                        ${formData.marca === marca
                                            ? 'bg-[#800080] text-white shadow-lg scale-105'
                                            : 'bg-white text-black border border-[#800080] hover:bg-[#800080] hover:text-white'}`}
                                >
                                    {marca.toUpperCase()}
                                </button>
                            ))}
                        </div>
                    </div>
                    {/* FAMILIA */}
                    <div className="space-y-4">
                        <h3 className="text-lg font-semibold text-[#800080]">Família:</h3>
                        <div className="grid grid-cols-3 gap-3">
                            {familias.map((familia) => (
                                <button
                                    key={familia}
                                    type="button"
                                    onClick={() => setFormData({ ...formData, familia })}
                                    className={`py-2 px-4 border rounded-lg font-bold text-center transition-all duration-300 ease-in-out transform
                                        ${formData.familia === familia
                                            ? 'bg-[#800080] text-white shadow-lg scale-105'
                                            : 'bg-white text-black border border-[#800080] hover:bg-[#800080] hover:text-white'}`}
                                >
                                    {familia.toUpperCase()}
                                </button>
                            ))}
                        </div>
                    </div>
                    {/* TIPO */}
                    <div className="space-y-4">
                        <h3 className="text-lg font-semibold text-[#800080]">Tipo:</h3>
                        <div className="grid grid-cols-3 gap-3">
                            {tipos.map((tipo) => (
                                <button
                                    key={tipo}
                                    type="button"
                                    onClick={() => setFormData({ ...formData, tipo })}
                                    className={`py-2 px-4 border rounded-lg font-bold text-center transition-all duration-300 ease-in-out transform
                                        ${formData.tipo === tipo
                                            ? 'bg-[#800080] text-white shadow-lg scale-105'
                                            : 'bg-white text-black border border-[#800080] hover:bg-[#800080] hover:text-white'}`}
                                >
                                    {tipo.toUpperCase()}
                                </button>
                            ))}
                        </div>
                    </div>
                    {/* Formato */}
                    <div className="space-y-4">
                        <h3 className="text-lg font-semibold text-[#800080]">Formato:</h3>
                        <div className="grid grid-cols-3 gap-3">
                            {formatos.map((formato) => (
                                <button
                                    key={formato}
                                    type="button"
                                    onClick={() => setFormData({ ...formData, formato })}
                                    className={`py-2 px-4 border rounded-lg font-bold text-center transition-all duration-300 ease-in-out transform
                                        ${formData.formato === formato
                                            ? 'bg-[#800080] text-white shadow-lg scale-105'
                                            : 'bg-white text-black border border-[#800080] hover:bg-[#800080] hover:text-white'}`}
                                >
                                    {formato.toUpperCase()}
                                </button>
                            ))}
                        </div>
                    </div>
                    {/* Material */}
                    <div className="space-y-4">
                        <h3 className="text-lg font-semibold text-[#800080]">Material:</h3>
                        <div className="grid grid-cols-3 gap-3">
                            {materiais.map((material) => (
                                <button
                                    key={material}
                                    type="button"
                                    onClick={() => setFormData({ ...formData, material })}
                                    className={`py-2 px-4 border rounded-lg font-bold text-center transition-all duration-300 ease-in-out transform
                                        ${formData.material === material
                                            ? 'bg-[#800080] text-white shadow-lg scale-105'
                                            : 'bg-white text-black border border-[#800080] hover:bg-[#800080] hover:text-white'}`}
                                >
                                    {material.toUpperCase()}
                                </button>
                            ))}
                        </div>
                    </div>
                    {/* Indice */}
                    <div className="space-y-4">
                        <h3 className="text-lg font-semibold text-[#800080]">Índice:</h3>
                        <div className="grid grid-cols-3 gap-3">
                            {indices.map((indice) => (
                                <button
                                    key={indice}
                                    type="button"
                                    onClick={() => setFormData({ ...formData, indice })}
                                    className={`py-2 px-4 border rounded-lg font-bold text-center transition-all duration-300 ease-in-out transform
                                        ${formData.indice === indice
                                            ? 'bg-[#800080] text-white shadow-lg scale-105'
                                            : 'bg-white text-black border border-[#800080] hover:bg-[#800080] hover:text-white'}`}
                                >
                                    {indice}
                                </button>
                            ))}
                        </div>
                    </div>
                    {/* Recursos */}
                    <div className="space-y-4">
                        <h3 className="text-lg font-semibold text-[#800080]">Recursos:</h3>
                        <div className="grid grid-cols-3 gap-3">
                            {recursos.map((recurso) => (
                                <button
                                    key={recurso}
                                    type="button"
                                    onClick={() => setFormData({ ...formData, recurso })}
                                    className={`py-2 px-4 border rounded-lg font-bold text-center transition-all duration-300 ease-in-out transform
                                        ${formData.recurso === recurso
                                            ? 'bg-[#800080] text-white shadow-lg scale-105'
                                            : 'bg-white text-black border border-[#800080] hover:bg-[#800080] hover:text-white'}`}
                                >
                                    {recurso.toUpperCase()}
                                </button>
                            ))}
                        </div>
                    </div>
                    {/* Tratamentos */}
                    <div className="space-y-4">
                        <h3 className="text-lg font-semibold text-[#800080]">Tratamentos:</h3>
                        <div className="grid grid-cols-3 gap-3">
                            {tratamentos.map((tratamento) => (
                                <button
                                    key={tratamento}
                                    type="button"
                                    onClick={() => setFormData({ ...formData, tratamento })}
                                    className={`py-2 px-4 border rounded-lg font-bold text-center transition-all duration-300 ease-in-out transform
                                        ${formData.tratamento === tratamento
                                            ? 'bg-[#800080] text-white shadow-lg scale-105'
                                            : 'bg-white text-black border border-[#800080] hover:bg-[#800080] hover:text-white'}`}
                                >
                                    {tratamento.toUpperCase()}
                                </button>
                            ))}
                        </div>
                    </div>
                    <form onSubmit={handleSubmit} className="space-y-6">
                        {/* Campo de NCM */}
                        <div className="space-y-4">
                            <h3 className="text-lg font-semibold text-[#800080]">NCM:</h3>
                            <div className="grid grid-cols-3 gap-3">
                                {['900.311.00', '9001.50.00', '9004.10.00'].map((NCM) => (
                                    <button
                                        key={NCM}
                                        type="button"
                                        onClick={() => setFormData({ ...formData, NCM })}
                                        className={`py-2 px-4 border rounded-lg font-bold text-center transition-all duration-300 ease-in-out transform
                        ${formData.NCM === NCM
                                                ? 'bg-[#800080] text-white shadow-lg scale-105'
                                                : 'bg-white text-black border border-[#800080] hover:bg-[#800080] hover:text-white'}`}
                                    >
                                        {NCM}
                                    </button>
                                ))}
                            </div>
                        </div>

                        {/* Campo de Custo */}
                        <div className="space-y-4">
                            <h3 className="text-lg font-semibold text-[#800080]">Custo (Informe valor de custo):</h3>
                            <div className="flex items-center border border-[#800080] rounded-lg">
                                <span className="px-2 text-gray-400">R$</span>
                                <input
                                    type="number"
                                    name="custo"
                                    value={formData.custo}
                                    onChange={(e) => setFormData({ ...formData, custo: e.target.value })}
                                    placeholder="0,00"
                                    className="w-full px-2 py-2 text-black focus:outline-none focus:border-[#800080] focus:ring-1 focus:ring-[#800080] rounded-lg"
                                    required
                                />
                            </div>
                        </div>

                        {/* Campo de Valor */}
                        <div className="space-y-4">
                            <h3 className="text-lg font-semibold text-[#800080]">Valor R$ (Informe preço de Venda):</h3>
                            <div className="flex items-center border border-[#800080] rounded-lg">
                                <span className="px-2 text-gray-400">R$</span>
                                <input
                                    type="number"
                                    name="valor"
                                    value={formData.valor}
                                    onChange={(e) => setFormData({ ...formData, valor: e.target.value })}
                                    placeholder="0,00"
                                    className="w-full px-2 py-2 text-black focus:outline-none focus:border-[#800080] focus:ring-1 focus:ring-[#800080] rounded-lg"
                                    required
                                />
                            </div>
                        </div>

                        {/* Campo de Imagem */}
                        <div className="space-y-4">
                            <h3 className="text-lg font-semibold text-[#800080]">Imagem (Tipos permitidos: png, gif, jpg, jpeg):</h3>
                            <input
                                type="file"
                                name="imagem"
                                accept="image/png, image/gif, image/jpg, image/jpeg"
                                onChange={(e) => setFormData({ ...formData, imagem: e.target.files[0] })} // Captura o arquivo de imagem
                                className="w-full px-4 py-2 border bg-gray-100 rounded-lg text-black focus:outline-none focus:border-[#800080] focus:ring-1 focus:ring-[#800080]"
                                required
                            />
                            <p className="text-sm text-gray-500">Apenas um arquivo. Limite de 2 MB.</p>
                        </div>
                    </form>

                    <div className="space-y-4">
                        <h3 className="text-lg font-semibold text-[#800080]">Produto:</h3>
                        <input
                            type="text"
                            name="produto"
                            value={formData.produto} // Assumindo que `produto` é parte do estado `formData`
                            onChange={(e) => setFormData({ ...formData, produto: e.target.value })}
                            placeholder="Informe o nome do produto"
                            className="w-full px-4 py-2 border bg-gray-100 rounded-lg text-black focus:outline-none focus:border-[#800080] focus:ring-1 focus:ring-[#800080]"
                            required
                        />
                    </div>

                    {/* Campos adicionais de Distribuidor, Marca, Família, Tipo, etc. */}
                    {/* Siga o padrão acima para cada campo, baseado na estrutura original */}

                    <div className="flex justify-center mt-4">
                        <button
                            type="submit"
                            className={`bg-[#9f206b] text-white font-bold px-6 py-2 rounded-lg shadow hover:bg-[#850f56] transition ${isLoading ? 'opacity-50 cursor-not-allowed' : ''
                                }`}
                            disabled={isLoading}
                        >
                            {isLoading ? ' <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-[#81059e]"></div>' : 'REGISTRAR LENTE'}
                        </button>
                    </div>

                    {showSuccessPopup && (
                        <div className="fixed bottom-4 right-4 bg-green-500 text-white p-4 rounded-lg shadow-lg">
                            <p>Produto enviado com sucesso!</p>
                        </div>
                    )}
                </form>
            </Layout>
        </div>
    );
}
