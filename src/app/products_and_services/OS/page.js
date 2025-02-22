"use client";
import { useRouter } from 'next/navigation';
import { useState, useEffect } from 'react';
import { getFirestore, collection, addDoc, updateDoc, doc, getDoc, query, where, getDocs } from 'firebase/firestore';
import { firestore, auth } from '../../../lib/firebaseConfig';
import { onAuthStateChanged } from 'firebase/auth';
import jsPDF from "jspdf";
import autoTable from "jspdf-autotable";
import { getStorage, ref, uploadBytes, getDownloadURL } from "firebase/storage";
import Sidebar from '../../../components/Sidebar';
import MobileNavSidebar from '../../../components/MB_NavSidebar';


export default function OSPage() {
    const [userData, setUserData] = useState(null);
    const [loadingUserData, setLoadingUserData] = useState(true);
    const router = useRouter();
    const [clientes, setClientes] = useState([]);
    const [lentes, setLentes] = useState([]);
    const [armacoes, setArmacoes] = useState([]);
    const [solares, setSolares] = useState([]);
    const [medicos, setMedicos] = useState([]);
    const [filteredMedicos, setFilteredMedicos] = useState([]);
    const [showSuccessPopup, setShowSuccessPopup] = useState(false);
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
    const userPhotoURL = userData?.imageUrl || '/default-avatar.png';
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

    useEffect(() => {
        const fetchUserData = async (user) => {
            try {
                const docRef = doc(firestore, 'loja1', 'users', user.uid, 'dados');
                const docSnap = await getDoc(docRef);

                if (docSnap.exists()) {
                    setUserData(docSnap.data());
                } else {
                    console.log('No such document!');
                }
            } catch (error) {
                console.error("Erro ao buscar dados do usuário:", error);
            }
            setLoadingUserData(false);
        };

        const unsubscribe = onAuthStateChanged(auth, (user) => {
            if (user) {
                fetchUserData(user);
            } else {
                router.push('/login');
            }
        });

        return () => unsubscribe();
    }, [router]);

    const handleChange = (e) => {
        const { name, value } = e.target;
        setFormData((prevData) => ({ ...prevData, [name]: value }));
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

        const completeFormData = {
            data: formData.data,
            hora: formData.hora,
            loja: formData.loja,
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




    if (loadingUserData) {
        return <div>Carregando dados do usuário...</div>;
    }

    return (
        <div className="flex flex-col min-h-screen bg-[#81059e]">
            <MobileNavSidebar
                userPhotoURL={userPhotoURL}
                userData={userData}
                handleLogout={() => router.push("/login")}
            />
            <div className="hidden lg:block w-16">
                <Sidebar />
            </div>

            <div className="flex flex-col items-center justify-center w-full mt-12 lg:mt-0">
                <div className="flex-1 flex justify-center items-center w-full p-6">
                    <div className="bg-white p-6 rounded-3xl shadow-lg border border-gray-300 w-full max-w-3xl">
                        <main className=''>
                            <button
                                className="bg-[#81059e] text-white font-bold px-4 py-2 rounded-lg mb-4"
                                onClick={() => router.push("/products_and_services/OS/list-os")}
                            >
                                Ir para Listagem de OS
                            </button>
                            <form onSubmit={handleSubmit} className="p-4 text-black bg-white justify-center rounded-lg shadow-md">
                                {/* Data e Hora */}
                                <fieldset className="mb-4">
                                    <legend>Data - Hora</legend>
                                    <div className="flex space-x-4">
                                        <div className="flex-1">
                                            <label>Data</label>
                                            <input
                                                type="date"
                                                name="data"
                                                value={formData.data}
                                                onChange={handleChange}
                                                className="form-input w-full border border-gray-400 rounded-lg px-3 py-2"
                                                required
                                            />
                                        </div>
                                        <div className="flex-1">
                                            <label>Hora</label>
                                            <input
                                                type="time"
                                                name="hora"
                                                value={formData.hora}
                                                onChange={handleChange}
                                                className="form-input w-full border border-gray-400 rounded-lg px-3 py-2"
                                                required
                                            />
                                        </div>
                                    </div>
                                </fieldset>

                                {/* Loja */}
                                <fieldset className="mb-4">
                                    <legend>Loja</legend>
                                    <div className="flex space-x-4">
                                        <div className="flex-1">
                                            <label><input type="radio" name="loja" value="loja1" onChange={handleChange} /> Ótica Popular, Loja 1</label>
                                        </div>
                                        <div className="flex-1">
                                            <label><input type="radio" name="loja" value="loja2" onChange={handleChange} /> Ótica Popular, Loja 2</label>
                                        </div>
                                    </div>
                                </fieldset>

                                {/* Cliente, Referência e Pedido de Compra */}
                                <fieldset className="mb-4">
                                    <legend>Montagem</legend>
                                    <div className="mb-4 relative">
                                        <div className="flex-1">
                                            <label>Cliente</label>
                                            <input
                                                type="text"
                                                name="cliente"
                                                value={formData.cliente}
                                                onChange={async (e) => {
                                                    const value = e.target.value;
                                                    handleChange(e); // Atualiza o estado do formulário
                                                    await fetchClientes(value); // Função para buscar clientes
                                                }}
                                                className="form-input w-full border border-gray-400 rounded-lg px-3 py-2"
                                                placeholder="Buscar pelo Nome, CPF, CNPJ, E-mail ou Telefone"
                                            />
                                        </div>

                                        {/* Renderize a lista de sugestões apenas se houver clientes e o input não estiver vazio */}
                                        {clientes.length > 0 && formData.cliente && (
                                            <ul className="absolute left-0 right-0 z-10 mt-1 bg-white border border-gray-300 rounded-lg max-h-48 overflow-y-auto shadow-lg">
                                                {clientes.map((option) => (
                                                    <li
                                                        key={option.id + option.nome}
                                                        className="p-2 cursor-pointer hover:bg-gray-100"
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
                                                    >
                                                        {option.nome} {option.type === 'child' ? `(Filho(a) de ${option.parentName})` : ''} - {option.cpf}
                                                    </li>
                                                ))}
                                            </ul>
                                        )}


                                        <div className="mb-4">
                                            <label>Referência</label>
                                            <input
                                                type="text"
                                                name="referencia"
                                                value={formData.referencia}
                                                onChange={handleChange}
                                                className="form-input w-full border border-gray-400 rounded-lg px-3 py-2"
                                            />
                                        </div>
                                        <div className="">
                                            <label>Pedido de Compra</label>
                                            <input
                                                type="text"
                                                name="pedidoCompra"
                                                value={formData.pedidoCompra}
                                                onChange={handleChange}
                                                className="form-input w-full border border-gray-400 rounded-lg px-3 py-2"
                                            />
                                        </div>
                                    </div>
                                </fieldset>
                                <fieldset className="mb-4">
                                    <legend className="text-purple-700 font-semibold mb-2">Laboratório</legend>
                                    <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
                                        {laboratorios.map((laboratorio) => (
                                            <div key={laboratorio.id}>
                                                <label className="inline-flex items-center">
                                                    <input
                                                        type="radio"
                                                        name="laboratorio"
                                                        value={laboratorio.razaoSocial}
                                                        onChange={handleChange}
                                                        className="mr-2"
                                                    />
                                                    {laboratorio.razaoSocial}
                                                </label>
                                            </div>
                                        ))}
                                    </div>
                                </fieldset>



                                {/* Data Inicial e Final */}
                                <fieldset className="mb-4">
                                    <legend class="text-purple-400">Data da Montagem</legend>
                                    <div className="mb-4">
                                        <div className="flex-1">
                                            <label>Data Inicial</label>
                                            <input
                                                type="date"
                                                name="dataMontagemInicial"
                                                value={formData.dataMontagemInicial}
                                                onChange={handleChange}
                                                className="form-input w-full border border-gray-400 rounded-lg px-3 py-2"
                                            />
                                            <input
                                                type="time"
                                                name="horaMontagemInicial"
                                                value={formData.horaMontagemInicial}
                                                onChange={handleChange}
                                                className="form-input w-full border border-gray-400 rounded-lg px-3 py-2 mt-2"
                                            />
                                        </div>
                                    </div>
                                    <div className="mb-4">
                                        <div className="flex-1">
                                            <label>Data Final</label>
                                            <input
                                                type="date"
                                                name="dataMontagemFinal"
                                                value={formData.dataMontagemFinal}
                                                onChange={handleChange}
                                                className="form-input w-full border border-gray-400 rounded-lg px-3 py-2"
                                            />
                                            <input
                                                type="time"
                                                name="horaMontagemFinal"
                                                value={formData.horaMontagemFinal}
                                                onChange={handleChange}
                                                className="form-input w-full border border-gray-400 rounded-lg px-3 py-2 mt-2"
                                            />
                                        </div>
                                    </div>
                                </fieldset>
                                <fieldset className="mb-4">
                                    <legend className="text-purple-700 font-semibold mb-2">Status</legend>
                                    <div className="grid grid-cols-2 sm:grid-cols-3 gap-4">
                                        <button
                                            type="button"
                                            onClick={() => setFormData({ ...formData, status: "processamentoInicial" })}
                                            className={`px-2 py-2 w-full border border-gray-400 rounded-none ${formData.status === "processamentoInicial" ? "bg-purple-200" : "bg-white"}`}
                                        >
                                            Em processamento inicial
                                        </button>
                                        <button
                                            type="button"
                                            onClick={() => setFormData({ ...formData, status: "encaminhadoLaboratorio" })}
                                            className={`px-4 py-2 w-full border border-gray-400 rounded-none ${formData.status === "encaminhadoLaboratorio" ? "bg-purple-200" : "bg-white"}`}
                                        >
                                            Encaminhado ao Laboratório
                                        </button>
                                        <button
                                            type="button"
                                            onClick={() => setFormData({ ...formData, status: "montagemProgresso" })}
                                            className={`px-4 py-2 w-full border border-gray-400 rounded-none ${formData.status === "montagemProgresso" ? "bg-purple-200" : "bg-white"}`}
                                        >
                                            Montagem em Progresso
                                        </button>
                                        <button
                                            type="button"
                                            onClick={() => setFormData({ ...formData, status: "prontoEntrega" })}
                                            className={`px-4 py-2 w-full border border-gray-400 rounded-none ${formData.status === "prontoEntrega" ? "bg-purple-200" : "bg-white"}`}
                                        >
                                            Pronto para Entrega
                                        </button>
                                        <button
                                            type="button"
                                            onClick={() => setFormData({ ...formData, status: "entregueCliente" })}
                                            className={`px-4 py-2 w-full border border-gray-400 rounded-none ${formData.status === "entregueCliente" ? "bg-purple-200" : "bg-white"}`}
                                        >
                                            Entregue ao cliente
                                        </button>
                                        <button
                                            type="button"
                                            onClick={() => setFormData({ ...formData, status: "cancelada" })}
                                            className={`px-4 py-2 w-full border border-gray-400 rounded-none ${formData.status === "cancelada" ? "bg-purple-200" : "bg-white"}`}
                                        >
                                            Cancelada
                                        </button>
                                    </div>
                                    <p className="text-sm text-purple-500 mt-2">
                                        Informe em que estágio está o processo de montagem.
                                    </p>
                                </fieldset>

                                <fieldset className="mb-4">
                                    <legend className="text-purple-700 font-semibold mb-2">Médico</legend>
                                    <div className="flex">
                                        <div className="flex-1 relative">
                                            <label>Nome do Médico</label>
                                            <input
                                                type="text"
                                                name="medico"
                                                value={formData.medico || ''}
                                                onChange={handleFilter}
                                                className="form-input w-full border border-gray-400 rounded-lg px-3 py-2"
                                                placeholder="Digite o nome do médico"
                                                required
                                            />
                                            {filteredMedicos.length > 0 && (
                                                <ul className="absolute bg-white border border-gray-300 rounded-lg w-full mt-1 max-h-48 overflow-y-auto z-10">
                                                    {filteredMedicos.map(medico => (
                                                        <li
                                                            key={medico.id}
                                                            onClick={() => handleSelectMedico(medico.nome)}
                                                            className="cursor-pointer px-3 py-2 hover:bg-gray-200"
                                                        >
                                                            {medico.nome}
                                                        </li>
                                                    ))}
                                                </ul>
                                            )}
                                        </div>
                                    </div>
                                </fieldset>

                                <fieldset className="mb-4">
                                    <legend className="text-purple-700 font-semibold mb-2">Olho Direito</legend>
                                    <div className="flex space-x-4">
                                        {/* Esfera */}
                                        <div className="flex-1">
                                            <label className="text-purple-700">Esfera</label>
                                            <select
                                                name="esferaDireito"
                                                value={formData.esferaDireito || ''}
                                                onChange={handleChange}
                                                className="form-select w-full border border-gray-400 rounded-lg px-3 py-2"
                                            >
                                                <option value="">Selecione...</option>
                                                {Array.from({ length: 221 }, (_, i) => (-30 + i * 0.25).toFixed(2)).map(value => (
                                                    <option key={value} value={value}>{value}</option>
                                                ))}
                                            </select>
                                        </div>

                                        {/* Cilindro */}
                                        <div className="flex-1">
                                            <label className="text-purple-700">Cilindro</label>
                                            <select
                                                name="cilindroDireito"
                                                value={formData.cilindroDireito || ''}
                                                onChange={handleChange}
                                                className="form-select w-full border border-gray-400 rounded-lg px-3 py-2"
                                            >
                                                <option value="">Selecione...</option>
                                                {Array.from({ length: 49 }, (_, i) => (-12 + i * 0.25).toFixed(2)).map(value => (
                                                    <option key={value} value={value}>{value}</option>
                                                ))}
                                            </select>
                                        </div>

                                        {/* Eixo */}
                                        <div className="flex-1">
                                            <label className="text-purple-700">Eixo</label>
                                            <select
                                                name="eixoDireito"
                                                value={formData.eixoDireito || ''}
                                                onChange={handleChange}
                                                className="form-select w-full border border-gray-400 rounded-lg px-3 py-2"
                                            >
                                                <option value="">Selecione...</option>
                                                {Array.from({ length: 181 }, (_, i) => i).map(value => (
                                                    <option key={value} value={value}>{value}</option>
                                                ))}
                                            </select>
                                        </div>

                                        {/* Adição */}
                                        <div className="flex-1">
                                            <label className="text-purple-700">Adição</label>
                                            <select
                                                name="adicaoDireito"
                                                value={formData.adicaoDireito || ''}
                                                onChange={handleChange}
                                                className="form-select w-full border border-gray-400 rounded-lg px-3 py-2"
                                            >
                                                <option value="">Selecione...</option>
                                                {Array.from({ length: 14 }, (_, i) => (0.25 + i * 0.25).toFixed(2)).map(value => (
                                                    <option key={value} value={value}>{`+${value}`}</option>
                                                ))}
                                            </select>
                                        </div>
                                    </div>
                                </fieldset>
                                <fieldset className="mb-4">
                                    <legend className="text-purple-700 font-semibold mb-2">Olho Esquerdo</legend>
                                    <div className="flex space-x-4">
                                        {/* Esfera - Olho Esquerdo */}
                                        <div className="flex-1">
                                            <label className="text-purple-700">Esfera</label>
                                            <select
                                                name="esferaEsquerdo"
                                                value={formData.esferaEsquerdo || ''}
                                                onChange={handleChange}
                                                className="form-select w-full border border-gray-400 rounded-lg px-3 py-2"
                                            >
                                                <option value="">Selecione...</option>
                                                {Array.from({ length: 221 }, (_, i) => (-30 + i * 0.25).toFixed(2)).map(value => (
                                                    <option key={value} value={value}>{value}</option>
                                                ))}
                                            </select>
                                        </div>

                                        {/* Cilindro - Olho Esquerdo */}
                                        <div className="flex-1">
                                            <label className="text-purple-700">Cilindro</label>
                                            <select
                                                name="cilindroEsquerdo"
                                                value={formData.cilindroEsquerdo || ''}
                                                onChange={handleChange}
                                                className="form-select w-full border border-gray-400 rounded-lg px-3 py-2"
                                            >
                                                <option value="">Selecione...</option>
                                                {Array.from({ length: 49 }, (_, i) => (-12 + i * 0.25).toFixed(2)).map(value => (
                                                    <option key={value} value={value}>{value}</option>
                                                ))}
                                            </select>
                                        </div>

                                        {/* Eixo - Olho Esquerdo */}
                                        <div className="flex-1">
                                            <label className="text-purple-700">Eixo</label>
                                            <select
                                                name="eixoEsquerdo"
                                                value={formData.eixoEsquerdo || ''}
                                                onChange={handleChange}
                                                className="form-select w-full border border-gray-400 rounded-lg px-3 py-2"
                                            >
                                                <option value="">Selecione...</option>
                                                {Array.from({ length: 181 }, (_, i) => (i).toFixed(0)).map(value => (
                                                    <option key={value} value={value}>{value}</option>
                                                ))}
                                            </select>
                                        </div>

                                        {/* Adição - Olho Esquerdo */}
                                        <div className="flex-1">
                                            <label className="text-purple-700">Adição</label>
                                            <select
                                                name="adicaoEsquerdo"
                                                value={formData.adicaoEsquerdo || ''}
                                                onChange={handleChange}
                                                className="form-select w-full border border-gray-400 rounded-lg px-3 py-2"
                                            >
                                                <option value="">Selecione...</option>
                                                {Array.from({ length: 14 }, (_, i) => (0.25 + i * 0.25).toFixed(2)).map(value => (
                                                    <option key={value} value={value}>{value}</option>
                                                ))}
                                            </select>
                                        </div>
                                    </div>
                                </fieldset>
                                <fieldset className="mb-4">
                                    <legend className="text-purple-700 font-semibold mb-2">Consulta médica</legend>
                                    <div>
                                        <input
                                            type="date"
                                            name="consultaMedica"
                                            value={formData.consultaMedica || ''}
                                            onChange={handleChange}
                                            className="form-input w-full border border-gray-400 rounded-lg px-3 py-2"
                                            required
                                        />
                                        <p className="text-gray-500 text-sm">Informe data da consulta médica.</p>
                                    </div>
                                </fieldset>
                                <div className="flex-1">
                                    <label className="text-purple-700">Distância Interpupilar (DIP)</label>
                                    <select
                                        name="distanciaInterpupilar"
                                        value={formData.distanciaInterpupilar || ''}
                                        onChange={handleChange}
                                        className="form-select w-full border border-gray-400 rounded-lg px-3 py-2"
                                    >
                                        <option value="">Nenhum</option>
                                        {['Nenhum', ...Array.from({ length: 73 - 42 + 1 }, (_, i) => (42 + i).toString())].map(value => (
                                            <option key={value} value={value}>{value}</option>
                                        ))}
                                    </select>
                                    {formData.distanciaInterpupilar && formData.distanciaInterpupilar !== 'Nenhum' && (
                                        <p>Distância Interpupilar selecionada: {formData.distanciaInterpupilar} mm</p>
                                    )}
                                </div>
                                <fieldset className="mb-4">
                                    <legend className="text-purple-700 font-semibold mb-2">Olho Direito</legend>
                                    <div className="flex space-x-4">

                                        {/* DNP */}
                                        <div className="flex-1">
                                            <label className="text-purple-700">DNP</label>
                                            <select
                                                name="dnpDireito"
                                                value={formData.dnpDireito || ''}
                                                onChange={handleChange}
                                                className="form-select w-full border border-gray-400 rounded-lg px-3 py-2"
                                            >
                                                <option value="">Selecione...</option>
                                                {Array.from({ length: (39.0 - 25.0) / 0.5 + 1 }, (_, i) => (25.0 + i * 0.5).toFixed(1)).map(value => (
                                                    <option key={value} value={value}>{value}</option>
                                                ))}
                                            </select>
                                        </div>

                                        {/* Altura */}
                                        <div className="flex-1">
                                            <label className="text-purple-700">Altura</label>
                                            <select
                                                name="alturaDireito"
                                                value={formData.alturaDireito || ''}
                                                onChange={handleChange}
                                                className="form-select w-full border border-gray-400 rounded-lg px-3 py-2"
                                            >
                                                <option value="">Selecione...</option>
                                                {Array.from({ length: (38.0 - 12.0) / 0.5 + 1 }, (_, i) => (12.0 + i * 0.5).toFixed(1)).map(value => (
                                                    <option key={value} value={value}>{value}</option>
                                                ))}
                                            </select>
                                        </div>

                                        {/* Diagonal */}
                                        <div className="flex-1">
                                            <label className="text-purple-700">Diagonal</label>
                                            <select
                                                name="diagonalDireito"
                                                value={formData.diagonalDireito || ''}
                                                onChange={handleChange}
                                                className="form-select w-full border border-gray-400 rounded-lg px-3 py-2"
                                            >
                                                <option value="">Selecione...</option>
                                                {Array.from({ length: (68.0 - 34.0) / 0.5 + 1 }, (_, i) => (34.0 + i * 0.5).toFixed(1)).map(value => (
                                                    <option key={value} value={value}>{value}</option>
                                                ))}
                                            </select>
                                        </div>

                                    </div>
                                </fieldset>
                                <fieldset className="mb-4">
                                    <legend className="text-purple-700 font-semibold mb-2">Olho Esquerdo</legend>
                                    <div className="flex space-x-4">

                                        {/* DNP */}
                                        <div className="flex-1">
                                            <label className="text-purple-700">DNP</label>
                                            <select
                                                name="dnpEsquerdo"
                                                value={formData.dnpEsquerdo || ''}
                                                onChange={handleChange}
                                                className="form-select w-full border border-gray-400 rounded-lg px-3 py-2"
                                            >
                                                <option value="">Selecione...</option>
                                                {Array.from({ length: (39.0 - 25.0) / 0.5 + 1 }, (_, i) => (25.0 + i * 0.5).toFixed(1)).map(value => (
                                                    <option key={value} value={value}>{value}</option>
                                                ))}
                                            </select>
                                        </div>

                                        {/* Altura */}
                                        <div className="flex-1">
                                            <label className="text-purple-700">Altura</label>
                                            <select
                                                name="alturaEsquerdo"
                                                value={formData.alturaEsquerdo || ''}
                                                onChange={handleChange}
                                                className="form-select w-full border border-gray-400 rounded-lg px-3 py-2"
                                            >
                                                <option value="">Selecione...</option>
                                                {Array.from({ length: (38.0 - 12.0) / 0.5 + 1 }, (_, i) => (12.0 + i * 0.5).toFixed(1)).map(value => (
                                                    <option key={value} value={value}>{value}</option>
                                                ))}
                                            </select>
                                        </div>

                                        {/* Diagonal */}
                                        <div className="flex-1">
                                            <label className="text-purple-700">Diagonal</label>
                                            <select
                                                name="diagonalEsquerdo"
                                                value={formData.diagonalEsquerdo || ''}
                                                onChange={handleChange}
                                                className="form-select w-full border border-gray-400 rounded-lg px-3 py-2"
                                            >
                                                <option value="">Selecione...</option>
                                                {Array.from({ length: (68.0 - 34.0) / 0.5 + 1 }, (_, i) => (34.0 + i * 0.5).toFixed(1)).map(value => (
                                                    <option key={value} value={value}>{value}</option>
                                                ))}
                                            </select>
                                        </div>

                                    </div>
                                </fieldset>
                                <div className="flex-1">
                                    <fieldset className="border border-gray-400 rounded-lg p-2">
                                        <legend className="text-purple-700 font-semibold">Armação Própria</legend>
                                        <div className="flex space-x-4">
                                            <label className="flex items-center">
                                                <input
                                                    type="radio"
                                                    name="armacaoPropria"
                                                    value="sim"
                                                    checked={formData.armacaoPropria === 'sim'}
                                                    onChange={handleChange}
                                                    className="form-radio text-purple-600"
                                                />
                                                <span className="ml-2">Sim</span>
                                            </label>
                                            <label className="flex items-center">
                                                <input
                                                    type="radio"
                                                    name="armacaoPropria"
                                                    value="nao"
                                                    checked={formData.armacaoPropria === 'nao'}
                                                    onChange={handleChange}
                                                    className="form-radio text-purple-600"
                                                />
                                                <span className="ml-2">Não</span>
                                            </label>
                                        </div>
                                    </fieldset>
                                </div>
                                <div className="flex-1">
                                    <fieldset className="border border-gray-400 rounded-lg p-2">
                                        <legend className="text-purple-700 font-semibold">Lente Própria</legend>
                                        <div className="flex space-x-4">
                                            <label className="flex items-center">
                                                <input
                                                    type="radio"
                                                    name="lentePropria"
                                                    value="sim"
                                                    checked={formData.lentePropria === 'sim'}
                                                    onChange={handleChange}
                                                    className="form-radio text-purple-600"
                                                />
                                                <span className="ml-2">Sim</span>
                                            </label>
                                            <label className="flex items-center">
                                                <input
                                                    type="radio"
                                                    name="lentePropria"
                                                    value="nao"
                                                    checked={formData.lentePropria === 'nao'}
                                                    onChange={handleChange}
                                                    className="form-radio text-purple-600"
                                                />
                                                <span className="ml-2">Não</span>
                                            </label>
                                        </div>
                                    </fieldset>
                                </div>
                                {/* Armação */}
                                {formData.lentePropria === 'sim' && (
                                    <div className="mt-4">
                                        <label className="text-purple-700">Dados da Lente do cliente</label>
                                        <input
                                            type="text"
                                            name="lenteDados"
                                            value={formData.lenteDados || ''}
                                            onChange={handleChange}
                                            className="form-input w-full border border-gray-400 rounded-lg px-3 py-2"
                                            placeholder="Digite os dados da lente do cliente"
                                        />
                                    </div>
                                )}
                                {/* Armação */}
                                {formData.armacaoPropria === 'sim' && (
                                    <div className="mt-4">
                                        <label className="text-purple-700">Dados da Armação do cliente</label>
                                        <input
                                            type="text"
                                            name="armacaoDados"
                                            value={formData.armacaoDados || ''}
                                            onChange={handleChange}
                                            className="form-input w-full border border-gray-400 rounded-lg px-3 py-2"
                                            placeholder="Digite os dados da armação do cliente"
                                        />
                                    </div>
                                )}

                                {formData.lentePropria === 'nao' && (
                                    <div className="mt-4 relative">
                                        <label className="text-purple-700">Dados da Lente</label>
                                        <input
                                            type="text"
                                            name="lenteDados"
                                            value={formData.lenteDados || ''}
                                            onChange={async (e) => {
                                                const value = e.target.value;
                                                handleChange(e); // Atualiza o estado do formulário
                                                await fetchLentes(value); // Busca lentes conforme o que for digitado
                                            }}
                                            className="form-input w-full border border-gray-400 rounded-lg px-3 py-2"
                                            placeholder="Digite os dados da lente"
                                        />
                                        <p className="text-sm text-gray-600 mt-1">Buscar descrição das lentes na loja.</p>

                                        {/* Renderize a lista de sugestões apenas se houver lentes e o input não estiver vazio */}
                                        {lenteDados.length > 0 && formData.lenteDados && (
                                            <ul className="absolute left-0 right-0 z-10 mt-1 bg-white border border-gray-300 rounded-lg max-h-48 overflow-y-auto shadow-lg">
                                                {lenteDados.map((lente, index) => (
                                                    <li
                                                        key={lente.id}
                                                        className="p-2 cursor-pointer hover:bg-gray-100"
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
                                        )}
                                    </div>
                                )}




                                {formData.armacaoPropria === 'nao' && (
                                    <div className="mt-4 relative">
                                        <label className="text-purple-700">Digite os dados da armação</label>
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
                                            className="form-input w-full border border-gray-400 rounded-lg px-3 py-2"
                                            placeholder="Buscar armação"
                                        />
                                        <p className="text-sm text-gray-600 mt-1">Buscar descrição de armação na loja.</p>

                                        {/* Renderize a lista de sugestões apenas se houver armações e solares e o input não estiver vazio */}
                                        {armacoes.length > 0 && formData.armacaoDados && (
                                            <ul className="absolute left-0 right-0 z-10 mt-1 bg-white border border-gray-300 rounded-lg max-h-48 overflow-y-auto shadow-lg">
                                                {armacoes.map((item, index) => (
                                                    <li
                                                        key={index}
                                                        className="p-2 cursor-pointer hover:bg-gray-100"
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
                                        )}
                                    </div>
                                )}




                                {showSuccessPopup && (
                                    <div className="fixed top-4 right-4 bg-green-500 text-white px-4 py-2 rounded-lg shadow-lg">
                                        Sucesso! OS foi salva.
                                    </div>
                                )}

                                <div className="flex justify-end">
                                    <button
                                        type="submit" // Chamando a função handleSubmit no clique do botão
                                        className="mt-4 btn btn-primary px-4 py-2 bg-[#9f206b] text-white rounded-lg hover:bg-[#e91e63]"
                                    >
                                        Salvar
                                    </button>
                                </div>

                            </form>
                        </main>
                    </div>
                </div>
            </div>
        </div>
    );
}   