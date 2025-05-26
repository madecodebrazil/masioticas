"use client";
import { useRouter } from 'next/navigation';
import { useState, useEffect } from 'react';
import { getFirestore, collection, addDoc, updateDoc, doc, getDoc, query, where, getDocs } from 'firebase/firestore';
import { firestore, auth } from '../../../lib/firebaseConfig';
import { onAuthStateChanged } from 'firebase/auth';
import jsPDF from "jspdf";
import autoTable from "jspdf-autotable";
import { getStorage, ref, uploadBytes, getDownloadURL } from "firebase/storage";
import Layout from '../../../components/Layout';
import Link from 'next/link';
import { FiFileText, FiUser, FiCalendar, FiMapPin, FiTag, FiTrendingUp, FiAlertCircle } from 'react-icons/fi';
import { useAuth } from "@/hooks/useAuth";

export default function OSPage() {
    const { userPermissions, userData } = useAuth();
    const [loadingUserData, setLoadingUserData] = useState(true);
    const router = useRouter();
    const [clientes, setClientes] = useState([]);
    const [lentes, setLentes] = useState([]);
    const [armacoes, setArmacoes] = useState([]);
    const [solares, setSolares] = useState([]);
    const [medicos, setMedicos] = useState([]);
    const [filteredMedicos, setFilteredMedicos] = useState([]);
    const [showSuccessPopup, setShowSuccessPopup] = useState(false);
    const [selectedLoja, setSelectedLoja] = useState(null);
    
    useEffect(() => {
        if (userPermissions) {
            // Se não for admin, usa a primeira loja que tem acesso
            if (!userPermissions.isAdmin && userPermissions.lojas.length > 0) {
                setSelectedLoja(userPermissions.lojas[0]);
            }
            // Se for admin, usa a primeira loja da lista
            else if (userPermissions.isAdmin && userPermissions.lojas.length > 0) {
                setSelectedLoja(userPermissions.lojas[0]);
            }
        }
    }, [userPermissions]);

    useEffect(() => {
        const fetchMedicos = async () => {
            const db = getFirestore();

            // Fetch oftalmologistas
            const oftalmologistasCollection = collection(db, 'oftalmologistas');
            const oftalmologistasSnapshot = await getDocs(oftalmologistasCollection);
            const oftalmologistasList = oftalmologistasSnapshot.docs.map(doc => ({
                id: doc.id,
                nome: doc.data().nomeMedico, // Utilizando o campo correto
            }));

            // Fetch optometristas
            const optometristasCollection = collection(db, 'optometristas');
            const optometristasSnapshot = await getDocs(optometristasCollection);
            const optometristasList = optometristasSnapshot.docs.map(doc => ({
                id: doc.id,
                nome: doc.data().nomeOptometrista, // Utilizando o campo correto
            }));

            // Combine the two lists
            const combinedMedicos = [...oftalmologistasList, ...optometristasList];
            setMedicos(combinedMedicos);
        };

        fetchMedicos();
    }, []);

    // Function to filter medicos based on input
    const handleFilter = (e) => {
        const searchValue = e.target.value.toLowerCase();
        handleChange(e); // Update form data

        if (searchValue) {
            const filtered = medicos.filter(medico =>
                medico.nome && medico.nome.toLowerCase().includes(searchValue)
            );
            setFilteredMedicos(filtered);
        } else {
            setFilteredMedicos([]);
        }
    };

    // Function to handle the selection of a medico
    const handleSelectMedico = (nomeMedico) => {
        handleChange({ target: { name: 'medico', value: nomeMedico } });
        setFilteredMedicos([]); // Hide suggestions after selection
    };
    
    const [lenteDados, setLenteDados] = useState([]);
    const [lenteValida, setLenteValida] = useState(false); // Estado para verificar se a lente é válida
    const [formError, setFormError] = useState('');
    const [formData, setFormData] = useState({
        data: "",
        hora: "",
        loja: "",
        cliente: "",
        referencia: "",
        pedidoCompra: "",
        laboratorio: "",
        dataMontagemInicial: "",
        horaMontagemInicial: "",
        dataMontagemFinal: "",
        horaMontagemFinal: "",
        status: "",
        medico: "",
        esferaDireito: "",
        cilindroDireito: "",
        eixoDireito: "",
        adicaoDireito: "",
        esferaEsquerdo: "",
        cilindroEsquerdo: "",
        eixoEsquerdo: "",
        adicaoEsquerdo: "",
        consultaMedica: "",
        distanciaInterpupilar: "",
        dnpDireito: "",
        alturaDireito: "",
        diagonalDireito: "",
        dnpEsquerdo: "",
        alturaEsquerdo: "",
        diagonalEsquerdo: "",
        armacaoPropria: "",
        lentePropria: "",
        lenteDados: "",
        armacaoDados: "",
    });
    const [laboratorios, setLaboratorios] = useState([]);

    useEffect(() => {
        const fetchLaboratorios = async () => {
            const db = getFirestore();
            const laboratorioCollection = collection(db, 'laboratory');
            const laboratorioSnapshot = await getDocs(laboratorioCollection);
            const laboratorioList = laboratorioSnapshot.docs.map(doc => ({
                id: doc.id,
                ...doc.data()
            }));
            setLaboratorios(laboratorioList);
        };

        fetchLaboratorios();
    }, []);

    const fetchArmacoes = async (query) => {
        try {
            // Buscar armações de loja1 e loja2
            const loja1ArmacoesSnapshot = await getDocs(collection(firestore, 'loja1_armacoes'));
            const loja2ArmacoesSnapshot = await getDocs(collection(firestore, 'loja2_armacoes'));
            const armacoesData = [
                ...loja1ArmacoesSnapshot.docs.map(doc => ({ tipo: 'armação', produto: doc.data().produto, loja: 'loja 1' })),
                ...loja2ArmacoesSnapshot.docs.map(doc => ({ tipo: 'armação', produto: doc.data().produto, loja: 'loja 2' }))
            ];

            // Buscar solares de loja1 e loja2
            const loja1SolaresSnapshot = await getDocs(collection(firestore, 'loja1_solares'));
            const loja2SolaresSnapshot = await getDocs(collection(firestore, 'loja2_solares'));
            const solaresData = [
                ...loja1SolaresSnapshot.docs.map(doc => ({ tipo: 'solar', produto: doc.data().produto, loja: 'loja 1' })),
                ...loja2SolaresSnapshot.docs.map(doc => ({ tipo: 'solar', produto: doc.data().produto, loja: 'loja 2' }))
            ];

            // Combinar armações e solares
            const combinedData = [...armacoesData, ...solaresData];

            // Filtrar as armações e solares que correspondem ao que o usuário digitou
            const filteredData = combinedData.filter(item =>
                item.produto.toLowerCase().includes(query.toLowerCase())
            );
            setArmacoes(filteredData); // Atualiza o estado com as armações e solares filtrados
        } catch (error) {
            console.error('Erro ao buscar armações e solares:', error);
        }
    };

    const fetchClientes = async (query) => {
        try {
            const consumersSnapshot = await getDocs(collection(firestore, 'consumers'));
            const clientsData = consumersSnapshot.docs.map(doc => ({ id: doc.id, ...doc.data() }));

            // Construir um array de opções incluindo clientes e seus filhos
            let options = [];

            clientsData.forEach(client => {
                // Adicionar o próprio cliente
                options.push({
                    type: 'client',
                    id: client.id,
                    nome: client.nome,
                    cpf: client.cpf || '',
                    endereco: {
                        cep: client.cep || '',
                        logradouro: client.logradouro || '',
                        numero: client.numero || '',
                        complemento: client.complemento || '',
                        bairro: client.bairro || '',
                        cidade: client.cidade || '',
                        estado: client.estado || '',
                    },
                });

                // Se o cliente tiver filhos
                if (client.filhos && Array.isArray(client.filhos)) {
                    client.filhos.forEach((filho) => {
                        options.push({
                            type: 'child',
                            id: client.id, // ID do pai
                            nome: filho.nome,
                            cpf: filho.cpf || '',
                            parentName: client.nome,
                            endereco: {
                                cep: client.cep || '',
                                logradouro: client.logradouro || '',
                                numero: client.numero || '',
                                complemento: client.complemento || '',
                                bairro: client.bairro || '',
                                cidade: client.cidade || '',
                                estado: client.estado || '',
                            },
                        });
                    });
                }
            });

            // Filtrar as opções com base na consulta
            const filteredOptions = options.filter(option =>
                option.nome.toLowerCase().includes(query.toLowerCase()) ||
                option.cpf.includes(query)
            );

            setClientes(filteredOptions);
        } catch (error) {
            console.error('Erro ao buscar clientes:', error);
        }
    };

    const fetchLentes = async (query) => {
        try {
            // Buscar lentes de loja1 e loja2
            const loja1LentesSnapshot = await getDocs(collection(firestore, 'loja1_lentes'));
            const loja2LentesSnapshot = await getDocs(collection(firestore, 'loja2_lentes'));
            const lentesData = [
                ...loja1LentesSnapshot.docs.map(doc => ({ id: doc.id, produto: doc.data().produto })),
                ...loja2LentesSnapshot.docs.map(doc => ({ id: doc.id, produto: doc.data().produto }))
            ];

            // Filtrar as lentes que correspondem ao que o usuário digitou
            const filteredLentes = lentesData.filter(lente =>
                lente.produto.toLowerCase().includes(query.toLowerCase())
            );
            setLenteDados(filteredLentes); // Atualiza o estado com as lentes filtradas
        } catch (error) {
            console.error('Erro ao buscar lentes:', error);
        }
    };

    const fetchLenteData = async (lenteNome) => {
        if (!lenteNome) {
            setLenteDados([]);
            setLenteValida(false); // Se o campo estiver vazio, a lente não é válida
            return;
        }

        if (formData.lenteDados === lenteNome) {
            setLenteDados([]);
            return;
        }

        const querySnapshot = await getDocs(collection(firestore, 'loja1_lentes'));

        const results = querySnapshot.docs
            .map(doc => ({ id: doc.id, ...doc.data() }))
            .filter(lente => lente.produto.toLowerCase().includes(lenteNome.toLowerCase()));

        setLenteDados(results);

        // Define se a lente é válida com base nos resultados
        if (results.length > 0) {
            setLenteValida(true);
            setFormError(''); // Limpa o erro se a lente for válida
        } else {
            setLenteValida(false);
            setFormError('Lente não encontrada!'); // Define mensagem de erro se não for válida
        }
    };

    useEffect(() => {
        if (formData.lenteDados) {
            fetchLenteData(formData.lenteDados);
        } else {
            setLenteDados([]); // Limpa os dados se o campo estiver vazio
        }
    }, [formData.lenteDados]);

    const handleChange = (e) => {
        const { name, value, type, checked } = e.target;
        if (type === 'checkbox') {
            setFormData(prev => ({ ...prev, [name]: checked }));
        } else {
            setFormData(prev => ({ ...prev, [name]: value }));
        }
    };

    const handleClear = () => {
        setFormData({
            data: "",
            hora: "",
            loja: "",
            cliente: "",
            referencia: "",
            pedidoCompra: "",
            laboratorio: "",
            dataMontagemInicial: "",
            horaMontagemInicial: "",
            dataMontagemFinal: "",
            horaMontagemFinal: "",
            status: "",
            medico: "",
            esferaDireito: "",
            cilindroDireito: "",
            eixoDireito: "",
            adicaoDireito: "",
            esferaEsquerdo: "",
            cilindroEsquerdo: "",
            eixoEsquerdo: "",
            adicaoEsquerdo: "",
            consultaMedica: "",
            distanciaInterpupilar: "",
            dnpDireito: "",
            alturaDireito: "",
            diagonalDireito: "",
            dnpEsquerdo: "",
            alturaEsquerdo: "",
            diagonalEsquerdo: "",
            armacaoPropria: "",
            lentePropria: "",
            lenteDados: "",
            armacaoDados: "",
        });
        setClientes([]);
        setFilteredMedicos([]);
    };

    const generatePDF = (data) => {
        const pdfDoc = new jsPDF();

        // Cabeçalho do Documento
        pdfDoc.setFontSize(18);
        pdfDoc.text("AUTORIZAÇÃO PARA CONFECÇÃO DE ÓCULOS E TERMOS DE \n PAGAMENTO", 14, 15);

        // Dados da Montagem
        pdfDoc.setFontSize(12);
        pdfDoc.text(`ID do Documento: ${data.id}`, 14, 25);
        pdfDoc.text(`Data Inicial: ${data.dataMontagemInicial} - ${data.horaMontagemInicial}`, 14, 35);
        pdfDoc.text(`Data Final: ${data.dataMontagemFinal} - ${data.horaMontagemFinal}`, 14, 45);

        // Adiciona a tabela de Dados da Receita
        autoTable(pdfDoc, {
            startY: 55,
            head: [['', 'Esfera', 'Cilindro', 'Eixo', 'Adição']],
            body: [
                ['Olho Direito', data.esferaDireito, data.cilindroDireito, data.eixoDireito, data.adicaoDireito],
                ['Olho Esquerdo', data.esferaEsquerdo, data.cilindroEsquerdo, data.eixoEsquerdo, data.adicaoEsquerdo],
            ],
        });

        // Adiciona a tabela de Medidas Pupilares
        autoTable(pdfDoc, {
            startY: pdfDoc.lastAutoTable?.finalY + 10 || 70,
            head: [['', 'DNP', 'Altura', 'Diagonal']],
            body: [
                ['Olho Direito', data.dnpDireito, data.alturaDireito, data.diagonalDireito],
                ['Olho Esquerdo', data.dnpEsquerdo, data.alturaEsquerdo, data.diagonalEsquerdo],
            ],
        });

        // Texto de autorização
        const autorizacaoText = `
    Eu autorizo a confecção das lentes conforme especificações acordadas durante a consulta. Estou ciente de que o processo de fabricação será iniciado imediatamente e que qualquer alteração ou cancelamento poderá incorrer em custos adicionais. Compreendo que as lentes serão produzidas de acordo com as minhas necessidades visuais específicas e aceito os termos estabelecidos para a confecção.
    
    Comprometo-me a efetuar o pagamento integral do valor estipulado na ordem de serviço. Estou ciente de que a conclusão do serviço está condicionada à quitação total do valor acordado e que eventuais pendências financeiras poderão atrasar a entrega das lentes. Aceito todas as condições de pagamento estabelecidas e reconheço minha responsabilidade financeira com a empresa.`;

        pdfDoc.text(autorizacaoText, 14, pdfDoc.lastAutoTable.finalY + 20, { maxWidth: 180 });

        // Espaço para assinatura do cliente
        pdfDoc.text("\n\n__________________________________________________________", 14, pdfDoc.lastAutoTable.finalY + 100);
        pdfDoc.text("\n\nAssinatura do Cliente", 14, pdfDoc.lastAutoTable.finalY + 110);

        // Nova página para o recibo
        pdfDoc.addPage();

        // Título do Recibo
        pdfDoc.setFontSize(18);
        pdfDoc.text("RECIBO DE ENTREGA DE PRODUTOS", 14, 30);

        // Texto do recibo
        const reciboText = `Recebi desta Ótica os óculos novos conforme especificações da venda, após realizar a conferência detalhada de todos os itens:
    
    Confirmo que os itens foram entregues e conferidos em perfeito estado. Fui devidamente informado sobre os cuidados necessários para a manutenção dos óculos e estou ciente de que a garantia cobre exclusivamente defeitos de fabricação pelo período de [período da garantia] a partir da data de entrega.
    
    Estou ciente de que a garantia não cobre danos decorrentes de mau uso, incluindo, mas não se limitando a, quedas, riscos nas lentes, exposição a produtos químicos, deformações da armação por uso inadequado ou outros danos acidentais.
    
    Ao assinar este recibo, declaro que recebi os óculos em perfeitas condições e que compreendi todas as informações fornecidas sobre o uso e a garantia do produto.`;

        pdfDoc.setFontSize(12);
        pdfDoc.text(reciboText, 14, 40, { maxWidth: 180 });

        // Espaço para assinatura no recibo
        pdfDoc.text("\n\n\n\n\n\n__________________________________________________________", 14, 100);
        pdfDoc.text("\n\n\n\n\nAssinatura do cliente ou responsável", 14, 110);

        return pdfDoc;
    };

    const handleSubmit = async (e) => {
        e.preventDefault();
        console.log("Submit button clicked");

        if (!selectedLoja) {
            alert("Selecione uma loja primeiro!");
            return;
        }

        const completeFormData = {
            data: formData.data,
            hora: formData.hora,
            loja: formData.loja || selectedLoja,
            cliente: formData.cliente,
            referencia: formData.referencia,
            pedidoCompra: formData.pedidoCompra,
            laboratorio: formData.laboratorio,
            dataMontagemInicial: formData.dataMontagemInicial,
            horaMontagemInicial: formData.horaMontagemInicial,
            dataMontagemFinal: formData.dataMontagemFinal,
            horaMontagemFinal: formData.horaMontagemFinal,
            status: formData.status,
            medico: formData.medico,
            esferaDireito: formData.esferaDireito,
            cilindroDireito: formData.cilindroDireito,
            eixoDireito: formData.eixoDireito,
            adicaoDireito: formData.adicaoDireito,
            esferaEsquerdo: formData.esferaEsquerdo,
            cilindroEsquerdo: formData.cilindroEsquerdo,
            eixoEsquerdo: formData.eixoEsquerdo,
            adicaoEsquerdo: formData.adicaoEsquerdo,
            consultaMedica: formData.consultaMedica,
            distanciaInterpupilar: formData.distanciaInterpupilar,
            dnpDireito: formData.dnpDireito,
            alturaDireito: formData.alturaDireito,
            diagonalDireito: formData.diagonalDireito,
            dnpEsquerdo: formData.dnpEsquerdo,
            alturaEsquerdo: formData.alturaEsquerdo,
            diagonalEsquerdo: formData.diagonalEsquerdo,
            armacaoPropria: formData.armacaoPropria,
            lentePropria: formData.lentePropria,
            lenteDados: formData.lenteDados,
            armacaoDados: formData.armacaoDados,
        };

        try {
            const lojaSelecionada = completeFormData.loja === "loja2" ? "loja2" : "loja1";

            // Adiciona os dados ao Firestore
            const docRef = await addDoc(collection(firestore, lojaSelecionada, 'services', 'os'), completeFormData);

            // Gera o PDF com os dados atualizados
            const pdfDoc = generatePDF({ ...completeFormData, id: docRef.id });
            const pdfBlob = pdfDoc.output('blob');

            // Envia o PDF ao Firebase Storage
            const storage = getStorage();
            const pdfRef = ref(storage, `${lojaSelecionada}/services_os/pdfs/${docRef.id}.pdf`);
            await uploadBytes(pdfRef, pdfBlob);

            // Obtém a URL do PDF e atualiza o documento
            const downloadURL = await getDownloadURL(pdfRef);
            await updateDoc(doc(firestore, lojaSelecionada, 'services', 'os', docRef.id), {
                pdfUrl: downloadURL
            });

            // Exibir pop-up de sucesso
            setShowSuccessPopup(true);

            // Redirecionar após 2 segundos
            setTimeout(() => {
                setShowSuccessPopup(false); // Oculta o pop-up
                router.push('/products_and_services/OS/list-os'); // Redireciona para a lista de OS
            }, 2000); // 2 segundos

        } catch (error) {
            console.error('Erro ao adicionar o documento e gerar o PDF:', error.message);
        }
    };

    const renderLojaName = (lojaId) => {
        const lojaNames = {
            'loja1': 'Loja 1 - Centro',
            'loja2': 'Loja 2 - Caramuru'
        };

        return lojaNames[lojaId] || lojaId;
    };

    const formatCPF = (cpf) => {
        if (!cpf) return '';

        // Remove caracteres não numéricos
        cpf = cpf.replace(/\D/g, '');

        // Aplica a máscara
        return cpf.replace(/(\d{3})(\d{3})(\d{3})(\d{2})/, '$1.$2.$3-$4');
    };

    return (
        <Layout>
            <div className="min-h-screen">
                <div className="w-full max-w-5xl mx-auto rounded-lg">
                    <h2 className="text-3xl font-bold text-[#81059e] mb-8 mt-8">ORDEM DE SERVIÇO</h2>

                    {/* Seletor de Loja para Admins */}
                    {userPermissions?.isAdmin && (
                        <div className="mb-6">
                            <label className="text-[#81059e] font-medium flex items-center gap-2">
                                <FiMapPin /> Selecionar Loja
                            </label>
                            <select
                                value={selectedLoja || ''}
                                onChange={(e) => setSelectedLoja(e.target.value)}
                                className="border-2 border-[#81059e] p-3 rounded-lg w-full text-black mt-1"
                            >
                                <option value="">Selecione uma loja</option>
                                {userPermissions.lojas.map((loja) => (
                                    <option key={loja} value={loja}>
                                        {renderLojaName(loja)}
                                    </option>
                                ))}
                            </select>
                        </div>
                    )}

                    <div className='space-x-2 mb-6'>
                        <Link href="/products_and_services/OS/list-os">
                            <button className="bg-[#81059e] p-3 rounded-sm text-white">
                                LISTA DE ORDENS DE SERVIÇO
                            </button>
                        </Link>
                        <button
                            onClick={handleClear}
                            className="text-[#81059e] px-4 py-2 border-2 border-[#81059e] font-bold text-base rounded-sm"
                        >
                            Limpar
                        </button>
                    </div>

                    <form onSubmit={handleSubmit} className="mt-8 mb-20">
                        {/* Seção Data e Hora */}
                        <div className="p-4 bg-gray-50 rounded-lg mb-6">
                            <h3 className="text-lg font-semibold text-[#81059e] mb-4 flex items-center gap-2">
                                <FiCalendar /> Data e Hora
                            </h3>
                            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                                <div>
                                    <label className="text-[#81059e] font-medium">Data</label>
                                    <input
                                        type="date"
                                        name="data"
                                        value={formData.data}
                                        onChange={handleChange}
                                        className="border-2 border-[#81059e] p-3 rounded-lg w-full text-black"
                                        required
                                    />
                                </div>
                                <div>
                                    <label className="text-[#81059e] font-medium">Hora</label>
                                    <input
                                        type="time"
                                        name="hora"
                                        value={formData.hora}
                                        onChange={handleChange}
                                        className="border-2 border-[#81059e] p-3 rounded-lg w-full text-black"
                                        required
                                    />
                                </div>
                            </div>
                        </div>

                        {/* Seção Loja */}
                        <div className="p-4 bg-gray-50 rounded-lg mb-6">
                            <h3 className="text-lg font-semibold text-[#81059e] mb-4 flex items-center gap-2">
                                <FiMapPin /> Loja
                            </h3>
                            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                                <div className="flex items-center">
                                    <input
                                        type="radio"
                                        id="loja1"
                                        name="loja"
                                        value="loja1"
                                        onChange={handleChange}
                                        checked={formData.loja === "loja1"}
                                        className="mr-2"
                                    />
                                    <label htmlFor="loja1" className="text-[#81059e] font-medium">
                                        Ótica Popular, Loja 1
                                    </label>
                                </div>
                                <div className="flex items-center">
                                    <input
                                        type="radio"
                                        id="loja2"
                                        name="loja"
                                        value="loja2"
                                        onChange={handleChange}
                                        checked={formData.loja === "loja2"}
                                        className="mr-2"
                                    />
                                    <label htmlFor="loja2" className="text-[#81059e] font-medium">
                                        Ótica Popular, Loja 2
                                    </label>
                                </div>
                            </div>
                        </div>

                        {/* Seção Cliente */}
                        <div className="p-4 bg-gray-50 rounded-lg mb-6">
                            <h3 className="text-lg font-semibold text-[#81059e] mb-4 flex items-center gap-2">
                                <FiUser /> Informações do Cliente
                            </h3>
                            <div className="relative">
                                <label className="text-[#81059e] font-medium">Nome do Cliente</label>
                                <input
                                    type="text"
                                    name="cliente"
                                    value={formData.cliente}
                                    onChange={async (e) => {
                                        const value = e.target.value;
                                        handleChange(e); // Atualiza o estado do formulário
                                        await fetchClientes(value); // Função para buscar clientes
                                    }}
                                    className="border-2 border-[#81059e] p-3 rounded-lg w-full text-black"
                                    placeholder="Buscar pelo Nome, CPF, CNPJ, E-mail ou Telefone"
                                />
                            
                                {/* Renderize a lista de sugestões apenas se houver clientes e o input não estiver vazio */}
                                {clientes.length > 0 && formData.cliente && (
                                    <div className="absolute w-full z-10">
                                        <ul className="bg-white border-2 border-[#81059e] rounded-lg w-full max-h-[104px] overflow-y-auto shadow-lg custom-scroll">
                                            {clientes.map((option) => (
                                                <li
                                                    key={option.id + option.nome}
                                                    onClick={() => {
                                                        setFormData((prevData) => ({
                                                            ...prevData,
                                                            cliente: option.nome, // Nome do cliente ou filho
                                                            // Preenche os campos de endereço
                                                            cep: option.endereco.cep || '',
                                                            logradouro: option.endereco.logradouro || '',
                                                            numero: option.endereco.numero || '',
                                                            complemento: option.endereco.complemento || '',
                                                            bairro: option.endereco.bairro || '',
                                                            cidade: option.endereco.cidade || '',
                                                            estado: option.endereco.estado || '',
                                                        }));
                                                        setClientes([]); // Limpa a lista de sugestões após a seleção
                                                    }}
                                                    className="p-2 hover:bg-purple-50 cursor-pointer text-black border-b last:border-b-0 h-[52px] flex items-center"
                                                >
                                                    {option.nome} {option.type === 'child' ? `(Filho(a) de ${option.parentName})` : ''} - {formatCPF(option.cpf)}
                                                </li>
                                            ))}
                                        </ul>
                                    </div>
                                )}
                            </div>

                            <div className="mt-4">
                                <label className="text-[#81059e] font-medium">Referência</label>
                                <input
                                    type="text"
                                    name="referencia"
                                    value={formData.referencia}
                                    onChange={handleChange}
                                    className="border-2 border-[#81059e] p-3 rounded-lg w-full text-black"
                                />
                            </div>

                            <div className="mt-4">
                                <label className="text-[#81059e] font-medium">Pedido de Compra</label>
                                <input
                                    type="text"
                                    name="pedidoCompra"
                                    value={formData.pedidoCompra}
                                    onChange={handleChange}
                                    className="border-2 border-[#81059e] p-3 rounded-lg w-full text-black"
                                />
                            </div>
                        </div>

                        {/* Seção Laboratório */}
                        <div className="p-4 bg-gray-50 rounded-lg mb-6">
                            <h3 className="text-lg font-semibold text-[#81059e] mb-4 flex items-center gap-2">
                                <FiTag /> Laboratório
                            </h3>
                            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                                {laboratorios.map((laboratorio) => (
                                    <div key={laboratorio.id} className="flex items-center">
                                        <input
                                            type="radio"
                                            id={`lab-${laboratorio.id}`}
                                            name="laboratorio"
                                            value={laboratorio.razaoSocial}
                                            onChange={handleChange}
                                            checked={formData.laboratorio === laboratorio.razaoSocial}
                                            className="mr-2"
                                        />
                                        <label htmlFor={`lab-${laboratorio.id}`} className="text-[#81059e] font-medium">
                                            {laboratorio.razaoSocial}
                                        </label>
                                    </div>
                                ))}
                            </div>
                        </div>

                        {/* Seção Data da Montagem */}
                        <div className="p-4 bg-gray-50 rounded-lg mb-6">
                            <h3 className="text-lg font-semibold text-[#81059e] mb-4 flex items-center gap-2">
                                <FiCalendar /> Data da Montagem
                            </h3>
                            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                                <div>
                                    <label className="text-[#81059e] font-medium">Data Inicial</label>
                                    <input
                                        type="date"
                                        name="dataMontagemInicial"
                                        value={formData.dataMontagemInicial}
                                        onChange={handleChange}
                                        className="border-2 border-[#81059e] p-3 rounded-lg w-full text-black"
                                    />
                                    <input
                                        type="time"
                                        name="horaMontagemInicial"
                                        value={formData.horaMontagemInicial}
                                        onChange={handleChange}
                                        className="border-2 border-[#81059e] p-3 rounded-lg w-full text-black mt-2"
                                    />
                                </div>
                                <div>
                                    <label className="text-[#81059e] font-medium">Data Final</label>
                                    <input
                                        type="date"
                                        name="dataMontagemFinal"
                                        value={formData.dataMontagemFinal}
                                        onChange={handleChange}
                                        className="border-2 border-[#81059e] p-3 rounded-lg w-full text-black"
                                    />
                                    <input
                                        type="time"
                                        name="horaMontagemFinal"
                                        value={formData.horaMontagemFinal}
                                        onChange={handleChange}
                                        className="border-2 border-[#81059e] p-3 rounded-lg w-full text-black mt-2"
                                    />
                                </div>
                            </div>
                        </div>

                        {/* Seção Status */}
                        <div className="p-4 bg-gray-50 rounded-lg mb-6">
                            <h3 className="text-lg font-semibold text-[#81059e] mb-4 flex items-center gap-2">
                                <FiAlertCircle /> Status
                            </h3>
                            <div className="grid grid-cols-2 sm:grid-cols-3 gap-4">
                                <button
                                    type="button"
                                    onClick={() => setFormData({ ...formData, status: "processamentoInicial" })}
                                    className={`px-3 py-2 border-2 ${formData.status === "processamentoInicial" ? "bg-purple-100 border-[#81059e]" : "border-gray-300"} rounded-sm`}
                                >
                                    Em processamento inicial
                                </button>
                                <button
                                    type="button"
                                    onClick={() => setFormData({ ...formData, status: "encaminhadoLaboratorio" })}
                                    className={`px-3 py-2 border-2 ${formData.status === "encaminhadoLaboratorio" ? "bg-purple-100 border-[#81059e]" : "border-gray-300"} rounded-sm`}
                                >
                                    Encaminhado ao Laboratório
                                </button>
                                <button
                                    type="button"
                                    onClick={() => setFormData({ ...formData, status: "montagemProgresso" })}
                                    className={`px-3 py-2 border-2 ${formData.status === "montagemProgresso" ? "bg-purple-100 border-[#81059e]" : "border-gray-300"} rounded-sm`}
                                >
                                    Montagem em Progresso
                                </button>
                                <button
                                    type="button"
                                    onClick={() => setFormData({ ...formData, status: "prontoEntrega" })}
                                    className={`px-3 py-2 border-2 ${formData.status === "prontoEntrega" ? "bg-purple-100 border-[#81059e]" : "border-gray-300"} rounded-sm`}
                                >
                                    Pronto para Entrega
                                </button>
                                <button
                                    type="button"
                                    onClick={() => setFormData({ ...formData, status: "entregueCliente" })}
                                    className={`px-3 py-2 border-2 ${formData.status === "entregueCliente" ? "bg-purple-100 border-[#81059e]" : "border-gray-300"} rounded-sm`}
                                >
                                    Entregue ao cliente
                                </button>
                                <button
                                    type="button"
                                    onClick={() => setFormData({ ...formData, status: "cancelada" })}
                                    className={`px-3 py-2 border-2 ${formData.status === "cancelada" ? "bg-purple-100 border-[#81059e]" : "border-gray-300"} rounded-sm`}
                                >
                                    Cancelada
                                </button>
                            </div>
                            <p className="text-sm text-purple-500 mt-2">
                                Informe em que estágio está o processo de montagem.
                            </p>
                        </div>

                        {/* Seção Médico */}
                        <div className="p-4 bg-gray-50 rounded-lg mb-6">
                            <h3 className="text-lg font-semibold text-[#81059e] mb-4 flex items-center gap-2">
                                <FiUser /> Médico
                            </h3>
                            <div className="relative">
                                <label className="text-[#81059e] font-medium">Nome do Médico</label>
                                <input
                                    type="text"
                                    name="medico"
                                    value={formData.medico || ''}
                                    onChange={handleFilter}
                                    className="border-2 border-[#81059e] p-3 rounded-lg w-full text-black"
                                    placeholder="Digite o nome do médico"
                                    required
                                />
                                {filteredMedicos.length > 0 && (
                                    <div className="absolute w-full z-10">
                                        <ul className="bg-white border-2 border-[#81059e] rounded-lg w-full max-h-[104px] overflow-y-auto shadow-lg custom-scroll">
                                            {filteredMedicos.map(medico => (
                                                <li
                                                    key={medico.id}
                                                    onClick={() => handleSelectMedico(medico.nome)}
                                                    className="p-2 hover:bg-purple-50 cursor-pointer text-black border-b last:border-b-0 h-[52px] flex items-center"
                                                >
                                                    {medico.nome}
                                                </li>
                                            ))}
                                        </ul>
                                    </div>
                                )}
                            </div>
                        </div>

                        {/* Seção Olho Direito */}
                        <div className="p-4 bg-gray-50 rounded-lg mb-6">
                            <h3 className="text-lg font-semibold text-[#81059e] mb-4 flex items-center gap-2">
                                <FiFileText /> Olho Direito
                            </h3>
                            <div className="grid grid-cols-2 md:grid-cols-4 gap-6">
                                {/* Esfera */}
                                <div>
                                    <label className="text-[#81059e] font-medium">Esfera</label>
                                    <select
                                        name="esferaDireito"
                                        value={formData.esferaDireito || ''}
                                        onChange={handleChange}
                                        className="border-2 border-[#81059e] p-3 rounded-lg w-full text-black"
                                    >
                                        <option value="">Selecione...</option>
                                        {Array.from({ length: 221 }, (_, i) => (-30 + i * 0.25).toFixed(2)).map(value => (
                                            <option key={value} value={value}>{value}</option>
                                        ))}
                                    </select>
                                </div>

                                {/* Cilindro */}
                                <div>
                                    <label className="text-[#81059e] font-medium">Cilindro</label>
                                    <select
                                        name="cilindroDireito"
                                        value={formData.cilindroDireito || ''}
                                        onChange={handleChange}
                                        className="border-2 border-[#81059e] p-3 rounded-lg w-full text-black"
                                    >
                                        <option value="">Selecione...</option>
                                        {Array.from({ length: 49 }, (_, i) => (-12 + i * 0.25).toFixed(2)).map(value => (
                                            <option key={value} value={value}>{value}</option>
                                        ))}
                                    </select>
                                </div>

                                {/* Eixo */}
                                <div>
                                    <label className="text-[#81059e] font-medium">Eixo</label>
                                    <select
                                        name="eixoDireito"
                                        value={formData.eixoDireito || ''}
                                        onChange={handleChange}
                                        className="border-2 border-[#81059e] p-3 rounded-lg w-full text-black"
                                    >
                                        <option value="">Selecione...</option>
                                        {Array.from({ length: 181 }, (_, i) => i).map(value => (
                                            <option key={value} value={value}>{value}</option>
                                        ))}
                                    </select>
                                </div>

                                {/* Adição */}
                                <div>
                                    <label className="text-[#81059e] font-medium">Adição</label>
                                    <select
                                        name="adicaoDireito"
                                        value={formData.adicaoDireito || ''}
                                        onChange={handleChange}
                                        className="border-2 border-[#81059e] p-3 rounded-lg w-full text-black"
                                    >
                                        <option value="">Selecione...</option>
                                        {Array.from({ length: 14 }, (_, i) => (0.25 + i * 0.25).toFixed(2)).map(value => (
                                            <option key={value} value={value}>{`+${value}`}</option>
                                        ))}
                                    </select>
                                </div>
                            </div>
                        </div>

                        {/* Seção Olho Esquerdo */}
                        <div className="p-4 bg-gray-50 rounded-lg mb-6">
                            <h3 className="text-lg font-semibold text-[#81059e] mb-4 flex items-center gap-2">
                                <FiFileText /> Olho Esquerdo
                            </h3>
                            <div className="grid grid-cols-2 md:grid-cols-4 gap-6">
                                {/* Esfera - Olho Esquerdo */}
                                <div>
                                    <label className="text-[#81059e] font-medium">Esfera</label>
                                    <select
                                        name="esferaEsquerdo"
                                        value={formData.esferaEsquerdo || ''}
                                        onChange={handleChange}
                                        className="border-2 border-[#81059e] p-3 rounded-lg w-full text-black"
                                    >
                                        <option value="">Selecione...</option>
                                        {Array.from({ length: 221 }, (_, i) => (-30 + i * 0.25).toFixed(2)).map(value => (
                                            <option key={value} value={value}>{value}</option>
                                        ))}
                                    </select>
                                </div>

                                {/* Cilindro - Olho Esquerdo */}
                                <div>
                                    <label className="text-[#81059e] font-medium">Cilindro</label>
                                    <select
                                        name="cilindroEsquerdo"
                                        value={formData.cilindroEsquerdo || ''}
                                        onChange={handleChange}
                                        className="border-2 border-[#81059e] p-3 rounded-lg w-full text-black"
                                    >
                                        <option value="">Selecione...</option>
                                        {Array.from({ length: 49 }, (_, i) => (-12 + i * 0.25).toFixed(2)).map(value => (
                                            <option key={value} value={value}>{value}</option>
                                        ))}
                                    </select>
                                </div>

                                {/* Eixo - Olho Esquerdo */}
                                <div>
                                    <label className="text-[#81059e] font-medium">Eixo</label>
                                    <select
                                        name="eixoEsquerdo"
                                        value={formData.eixoEsquerdo || ''}
                                        onChange={handleChange}
                                        className="border-2 border-[#81059e] p-3 rounded-lg w-full text-black"
                                    >
                                        <option value="">Selecione...</option>
                                        {Array.from({ length: 181 }, (_, i) => i).map(value => (
                                            <option key={value} value={value}>{value}</option>
                                        ))}
                                    </select>
                                </div>

                                {/* Adição - Olho Esquerdo */}
                                <div>
                                    <label className="text-[#81059e] font-medium">Adição</label>
                                    <select
                                        name="adicaoEsquerdo"
                                        value={formData.adicaoEsquerdo || ''}
                                        onChange={handleChange}
                                        className="border-2 border-[#81059e] p-3 rounded-lg w-full text-black"
                                    >
                                        <option value="">Selecione...</option>
                                        {Array.from({ length: 14 }, (_, i) => (0.25 + i * 0.25).toFixed(2)).map(value => (
                                            <option key={value} value={value}>{value}</option>
                                        ))}
                                    </select>
                                </div>
                            </div>
                        </div>

                        {/* Seção Consulta Médica */}
                        <div className="p-4 bg-gray-50 rounded-lg mb-6">
                            <h3 className="text-lg font-semibold text-[#81059e] mb-4 flex items-center gap-2">
                                <FiCalendar /> Consulta Médica
                            </h3>
                            <div>
                                <label className="text-[#81059e] font-medium">Data da Consulta</label>
                                <input
                                    type="date"
                                    name="consultaMedica"
                                    value={formData.consultaMedica || ''}
                                    onChange={handleChange}
                                    className="border-2 border-[#81059e] p-3 rounded-lg w-full text-black"
                                    required
                                />
                                <p className="text-gray-500 text-sm mt-1">Informe data da consulta médica.</p>
                            </div>
                        </div>

                        {/* Seção Distância Interpupilar */}
                        <div className="p-4 bg-gray-50 rounded-lg mb-6">
                            <h3 className="text-lg font-semibold text-[#81059e] mb-4 flex items-center gap-2">
                                <FiTag /> Distância Interpupilar (DIP)
                            </h3>
                            <div>
                                <select
                                    name="distanciaInterpupilar"
                                    value={formData.distanciaInterpupilar || ''}
                                    onChange={handleChange}
                                    className="border-2 border-[#81059e] p-3 rounded-lg w-full text-black"
                                >
                                    <option value="">Nenhum</option>
                                    {['Nenhum', ...Array.from({ length: 73 - 42 + 1 }, (_, i) => (42 + i).toString())].map(value => (
                                        <option key={value} value={value}>{value}</option>
                                    ))}
                                </select>
                                {formData.distanciaInterpupilar && formData.distanciaInterpupilar !== 'Nenhum' && (
                                    <p className="text-gray-500 text-sm mt-1">Distância Interpupilar selecionada: {formData.distanciaInterpupilar} mm</p>
                                )}
                            </div>
                        </div>

                        {/* Seção Medidas Olho Direito */}
                        <div className="p-4 bg-gray-50 rounded-lg mb-6">
                            <h3 className="text-lg font-semibold text-[#81059e] mb-4 flex items-center gap-2">
                                <FiFileText /> Medidas - Olho Direito
                            </h3>
                            <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                                {/* DNP */}
                                <div>
                                    <label className="text-[#81059e] font-medium">DNP</label>
                                    <select
                                        name="dnpDireito"
                                        value={formData.dnpDireito || ''}
                                        onChange={handleChange}
                                        className="border-2 border-[#81059e] p-3 rounded-lg w-full text-black"
                                    >
                                        <option value="">Selecione...</option>
                                        {Array.from({ length: (39.0 - 25.0) / 0.5 + 1 }, (_, i) => (25.0 + i * 0.5).toFixed(1)).map(value => (
                                            <option key={value} value={value}>{value}</option>
                                        ))}
                                    </select>
                                </div>

                                {/* Altura */}
                                <div>
                                    <label className="text-[#81059e] font-medium">Altura</label>
                                    <select
                                        name="alturaDireito"
                                        value={formData.alturaDireito || ''}
                                        onChange={handleChange}
                                        className="border-2 border-[#81059e] p-3 rounded-lg w-full text-black"
                                    >
                                        <option value="">Selecione...</option>
                                        {Array.from({ length: (38.0 - 12.0) / 0.5 + 1 }, (_, i) => (12.0 + i * 0.5).toFixed(1)).map(value => (
                                            <option key={value} value={value}>{value}</option>
                                        ))}
                                    </select>
                                </div>

                                {/* Diagonal */}
                                <div>
                                    <label className="text-[#81059e] font-medium">Diagonal</label>
                                    <select
                                        name="diagonalDireito"
                                        value={formData.diagonalDireito || ''}
                                        onChange={handleChange}
                                        className="border-2 border-[#81059e] p-3 rounded-lg w-full text-black"
                                    >
                                        <option value="">Selecione...</option>
                                        {Array.from({ length: (68.0 - 34.0) / 0.5 + 1 }, (_, i) => (34.0 + i * 0.5).toFixed(1)).map(value => (
                                            <option key={value} value={value}>{value}</option>
                                        ))}
                                    </select>
                                </div>
                            </div>
                        </div>

                        {/* Seção Medidas Olho Esquerdo */}
                        <div className="p-4 bg-gray-50 rounded-lg mb-6">
                            <h3 className="text-lg font-semibold text-[#81059e] mb-4 flex items-center gap-2">
                                <FiFileText /> Medidas - Olho Esquerdo
                            </h3>
                            <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                                {/* DNP */}
                                <div>
                                    <label className="text-[#81059e] font-medium">DNP</label>
                                    <select
                                        name="dnpEsquerdo"
                                        value={formData.dnpEsquerdo || ''}
                                        onChange={handleChange}
                                        className="border-2 border-[#81059e] p-3 rounded-lg w-full text-black"
                                    >
                                        <option value="">Selecione...</option>
                                        {Array.from({ length: (39.0 - 25.0) / 0.5 + 1 }, (_, i) => (25.0 + i * 0.5).toFixed(1)).map(value => (
                                            <option key={value} value={value}>{value}</option>
                                        ))}
                                    </select>
                                </div>

                                {/* Altura */}
                                <div>
                                    <label className="text-[#81059e] font-medium">Altura</label>
                                    <select
                                        name="alturaEsquerdo"
                                        value={formData.alturaEsquerdo || ''}
                                        onChange={handleChange}
                                        className="border-2 border-[#81059e] p-3 rounded-lg w-full text-black"
                                    >
                                        <option value="">Selecione...</option>
                                        {Array.from({ length: (38.0 - 12.0) / 0.5 + 1 }, (_, i) => (12.0 + i * 0.5).toFixed(1)).map(value => (
                                            <option key={value} value={value}>{value}</option>
                                        ))}
                                    </select>
                                </div>

                                {/* Diagonal */}
                                <div>
                                    <label className="text-[#81059e] font-medium">Diagonal</label>
                                    <select
                                        name="diagonalEsquerdo"
                                        value={formData.diagonalEsquerdo || ''}
                                        onChange={handleChange}
                                        className="border-2 border-[#81059e] p-3 rounded-lg w-full text-black"
                                    >
                                        <option value="">Selecione...</option>
                                        {Array.from({ length: (68.0 - 34.0) / 0.5 + 1 }, (_, i) => (34.0 + i * 0.5).toFixed(1)).map(value => (
                                            <option key={value} value={value}>{value}</option>
                                        ))}
                                    </select>
                                </div>
                            </div>
                        </div>

                        {/* Seção Armação e Lentes */}
                        <div className="p-4 bg-gray-50 rounded-lg mb-6">
                            <h3 className="text-lg font-semibold text-[#81059e] mb-4 flex items-center gap-2">
                                <FiTag /> Armação e Lentes
                            </h3>
                            <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mb-4">
                                <div className="border-2 border-gray-300 rounded-lg p-4">
                                    <h4 className="text-[#81059e] font-medium mb-2">Armação Própria</h4>
                                    <div className="flex space-x-4">
                                        <label className="flex items-center">
                                            <input
                                                type="radio"
                                                name="armacaoPropria"
                                                value="sim"
                                                checked={formData.armacaoPropria === 'sim'}
                                                onChange={handleChange}
                                                className="mr-2"
                                            />
                                            <span className="text-[#81059e]">Sim</span>
                                        </label>
                                        <label className="flex items-center">
                                            <input
                                                type="radio"
                                                name="armacaoPropria"
                                                value="nao"
                                                checked={formData.armacaoPropria === 'nao'}
                                                onChange={handleChange}
                                                className="mr-2"
                                            />
                                            <span className="text-[#81059e]">Não</span>
                                        </label>
                                    </div>
                                </div>

                                <div className="border-2 border-gray-300 rounded-lg p-4">
                                    <h4 className="text-[#81059e] font-medium mb-2">Lente Própria</h4>
                                    <div className="flex space-x-4">
                                        <label className="flex items-center">
                                            <input
                                                type="radio"
                                                name="lentePropria"
                                                value="sim"
                                                checked={formData.lentePropria === 'sim'}
                                                onChange={handleChange}
                                                className="mr-2"
                                            />
                                            <span className="text-[#81059e]">Sim</span>
                                        </label>
                                        <label className="flex items-center">
                                            <input
                                                type="radio"
                                                name="lentePropria"
                                                value="nao"
                                                checked={formData.lentePropria === 'nao'}
                                                onChange={handleChange}
                                                className="mr-2"
                                            />
                                            <span className="text-[#81059e]">Não</span>
                                        </label>
                                    </div>
                                </div>
                            </div>

                            {/* Campo para Lente do cliente quando selecionada como própria */}
                            {formData.lentePropria === 'sim' && (
                                <div className="mt-4">
                                    <label className="text-[#81059e] font-medium">Dados da Lente do cliente</label>
                                    <input
                                        type="text"
                                        name="lenteDados"
                                        value={formData.lenteDados || ''}
                                        onChange={handleChange}
                                        className="border-2 border-[#81059e] p-3 rounded-lg w-full text-black"
                                        placeholder="Digite os dados da lente do cliente"
                                    />
                                </div>
                            )}

                            {/* Campo para Armação do cliente quando selecionada como própria */}
                            {formData.armacaoPropria === 'sim' && (
                                <div className="mt-4">
                                    <label className="text-[#81059e] font-medium">Dados da Armação do cliente</label>
                                    <input
                                        type="text"
                                        name="armacaoDados"
                                        value={formData.armacaoDados || ''}
                                        onChange={handleChange}
                                        className="border-2 border-[#81059e] p-3 rounded-lg w-full text-black"
                                        placeholder="Digite os dados da armação do cliente"
                                    />
                                </div>
                            )}

                            {/* Campo para Lente da loja quando não for própria */}
                            {formData.lentePropria === 'nao' && (
                                <div className="mt-4 relative">
                                    <label className="text-[#81059e] font-medium">Dados da Lente</label>
                                    <input
                                        type="text"
                                        name="lenteDados"
                                        value={formData.lenteDados || ''}
                                        onChange={async (e) => {
                                            const value = e.target.value;
                                            handleChange(e); // Atualiza o estado do formulário
                                            await fetchLentes(value); // Busca lentes conforme o que for digitado
                                        }}
                                        className="border-2 border-[#81059e] p-3 rounded-lg w-full text-black"
                                        placeholder="Digite os dados da lente"
                                    />
                                    <p className="text-sm text-gray-500 mt-1">Buscar descrição das lentes na loja.</p>

                                    {/* Renderize a lista de sugestões apenas se houver lentes e o input não estiver vazio */}
                                    {lenteDados.length > 0 && formData.lenteDados && (
                                        <div className="absolute w-full z-10">
                                            <ul className="bg-white border-2 border-[#81059e] rounded-lg w-full max-h-[104px] overflow-y-auto shadow-lg custom-scroll">
                                                {lenteDados.map((lente) => (
                                                    <li
                                                        key={lente.id}
                                                        className="p-2 hover:bg-purple-50 cursor-pointer text-black border-b last:border-b-0 h-[52px] flex items-center"
                                                        onClick={() => {
                                                            setFormData((prevData) => ({
                                                                ...prevData,
                                                                lenteDados: lente.produto, // Preenche o campo com a lente selecionada
                                                            }));
                                                            setLenteDados([]); // Limpa a lista de sugestões após a seleção
                                                        }}
                                                    >
                                                        {lente.produto}
                                                    </li>
                                                ))}
                                            </ul>
                                        </div>
                                    )}
                                </div>
                            )}

                            {/* Campo para Armação da loja quando não for própria */}
                            {formData.armacaoPropria === 'nao' && (
                                <div className="mt-4 relative">
                                    <label className="text-[#81059e] font-medium">Digite os dados da armação</label>
                                    <input
                                        type="text"
                                        name="armacaoDados"
                                        value={formData.armacaoDados || ''}
                                        onChange={async (e) => {
                                            const value = e.target.value;
                                            handleChange(e); // Atualiza o estado do formulário
                                            // Fazer fetch das armações e solares da loja quando não for armação própria
                                            if (value.length > 0) {
                                                await fetchArmacoes(value); // Função para buscar armações e solares da loja
                                            }
                                        }}
                                        className="border-2 border-[#81059e] p-3 rounded-lg w-full text-black"
                                        placeholder="Buscar armação"
                                    />
                                    <p className="text-sm text-gray-500 mt-1">Buscar descrição de armação na loja.</p>

                                    {/* Renderize a lista de sugestões apenas se houver armações e solares e o input não estiver vazio */}
                                    {armacoes.length > 0 && formData.armacaoDados && (
                                        <div className="absolute w-full z-10">
                                            <ul className="bg-white border-2 border-[#81059e] rounded-lg w-full max-h-[104px] overflow-y-auto shadow-lg custom-scroll">
                                                {armacoes.map((item, index) => (
                                                    <li
                                                        key={index}
                                                        className="p-2 hover:bg-purple-50 cursor-pointer text-black border-b last:border-b-0 h-[52px] flex items-center"
                                                        onClick={() => {
                                                            setFormData((prevData) => ({
                                                                ...prevData,
                                                                armacaoDados: item.produto // Preenche o campo com a armação ou solar selecionada
                                                            }));
                                                            setArmacoes([]); // Limpa a lista de sugestões após a seleção
                                                        }}
                                                    >
                                                        {item.produto} {item.tipo === 'solar' ? `[SOLAR]` : ''} ({item.loja})
                                                    </li>
                                                ))}
                                            </ul>
                                        </div>
                                    )}
                                </div>
                            )}
                        </div>

                        {/* Popup de sucesso */}
                        {showSuccessPopup && (
                            <div className="fixed top-4 right-4 bg-green-500 text-white px-4 py-2 rounded-lg shadow-lg">
                                Sucesso! OS foi salva.
                            </div>
                        )}

                        {/* Botões de ação */}
                        <div className="flex justify-center gap-4 mt-8">
                            <button
                                type="submit"
                                className="bg-[#81059e] p-3 px-6 rounded-sm text-white flex items-center gap-2"
                            >
                                REGISTRAR
                            </button>
                            <button
                                type="button"
                                onClick={handleClear}
                                className="border-2 border-[#81059e] p-3 px-6 rounded-sm text-[#81059e] flex items-center gap-2"
                            >
                                CANCELAR
                            </button>
                        </div>
                    </form>
                </div>
            </div>
        </Layout>
    );
}