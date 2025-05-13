"use client";
import { createPortal } from 'react-dom';
import React, { useState, useEffect } from 'react';
import { doc, setDoc, getDoc } from 'firebase/firestore';
import { ref, uploadBytes, getDownloadURL } from 'firebase/storage';
import { firestore, storage } from '@/lib/firebaseConfig';
import { useAuth } from '@/hooks/useAuth';
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';
import {
  faClock,
  faBuilding,
  faMoneyBill,
  faUsers,
  faBox,
  faTimes,
  faSave,
  faUser,
  faGear,
  faChevronLeft,
  faBars
} from '@fortawesome/free-solid-svg-icons';

const ConfigurationsModal = ({ isOpen, onClose }) => {
  const { userPermissions, user } = useAuth();
  const [abaAtiva, setAbaAtiva] = useState('perfil');
  const [isAdmin, setIsAdmin] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [menuOpen, setMenuOpen] = useState(true); // Menu aberto por padrão em desktop
  const [isMobile, setIsMobile] = useState(false);
  const [config, setConfig] = useState({
    horarios: {
      abertura: '08:00',
      fechamento: '18:00',
      aberturaSabado: '08:00',
      fechamentoSabado: '13:00',
      domingoFechado: true
    },
    perfil: {
      imageUrl: '',
      nome: '',
      cargo: ''
    },
    financeiro: {
      taxaJurosPadrao: 0
    }
  });
  const [selectedFile, setSelectedFile] = useState(null);

  // Verificar tamanho da tela quando o componente montar e quando a janela for redimensionada
  useEffect(() => {
    const checkScreenSize = () => {
      setIsMobile(window.innerWidth < 768);
      // Em dispositivos móveis, o menu começa fechado
      setMenuOpen(window.innerWidth >= 768);
    };

    checkScreenSize();
    window.addEventListener('resize', checkScreenSize);
    return () => window.removeEventListener('resize', checkScreenSize);
  }, []);

  useEffect(() => {
    // Verificar se o usuário é administrador
    setIsAdmin(userPermissions?.isAdmin || false);

    // Carregar configurações existentes
    const carregarConfiguracoes = async () => {
      try {
        const horariosDoc = await getDoc(doc(firestore, 'configuracoes', 'horarios'));
        if (horariosDoc.exists()) {
          setConfig(prev => ({
            ...prev,
            horarios: horariosDoc.data()
          }));
        }
      } catch (error) {
        console.error("Erro ao carregar configurações:", error);
      }
    };

    if (isOpen) {
      carregarConfiguracoes();
      document.body.style.overflow = 'hidden';
    }

    // Limpar efeito ao desmontar o componente
    return () => {
      document.body.style.overflow = 'auto';
    };
  }, [userPermissions, isOpen]);

  const handleSalvar = async () => {
    if (!isAdmin) {
      alert("Apenas administradores podem alterar as configurações do sistema.");
      return;
    }

    setIsLoading(true);

    try {
      // Salvar configurações no Firestore com base na aba ativa
      if (abaAtiva === 'horarios') {
        await setDoc(doc(firestore, 'configuracoes', 'horarios'), config.horarios);
      }
      // Adicione mais condições para outras abas conforme necessário

      alert("Configurações salvas com sucesso!");
      document.body.style.overflow = 'auto';
      onClose();
    } catch (error) {
      console.error("Erro ao salvar configurações:", error);
      alert("Erro ao salvar configurações. Tente novamente.");
    } finally {
      setIsLoading(false);
    }
  };

  const handleInputChange = (e) => {
    const { name, value, type, checked } = e.target;

    // Atualiza o estado com base na aba ativa
    if (abaAtiva === 'horarios') {
      setConfig(prev => ({
        ...prev,
        horarios: {
          ...prev.horarios,
          [name]: type === 'checkbox' ? checked : value
        }
      }));
    } else if (abaAtiva === 'perfil') {
      setConfig(prev => ({
        ...prev,
        perfil: {
          ...prev.perfil,
          [name]: value
        }
      }));
    } else if (abaAtiva === 'financeiro') {
      setConfig(prev => ({
        ...prev,
        financeiro: {
          ...prev.financeiro,
          [name]: value
        }
      }));
    }
  };

  const handleClose = () => {
    document.body.style.overflow = 'auto';
    onClose();
  };

  const handleFileChange = (e) => {
    const file = e.target.files[0];
    if (file) {
      // Validar o tipo do arquivo
      if (!file.type.startsWith('image/')) {
        alert('Por favor, selecione apenas arquivos de imagem.');
        return;
      }

      // Validar o tamanho do arquivo (máximo 5MB)
      if (file.size > 5 * 1024 * 1024) {
        alert('O arquivo é muito grande. Por favor, selecione uma imagem menor que 5MB.');
        return;
      }

      setSelectedFile(file);
    }
  };

  const handleUpload = async () => {
    if (!selectedFile) return;

    setIsLoading(true);

    try {
      // 1. Upload da imagem para o Firebase Storage
      const storageRef = ref(storage, `profile-images/${user.uid}`);
      await uploadBytes(storageRef, selectedFile);
      const downloadURL = await getDownloadURL(storageRef);

      // 2. Determinar caminho do documento correto
      let userDocRef;
      if (userPermissions?.isAdmin) {
        userDocRef = doc(firestore, `admins/${user.uid}`);
      } else {
        const lojaId = userPermissions?.lojas?.[0] || 'loja1';
        userDocRef = doc(firestore, `lojas/${lojaId}/users/${user.uid}`);
      }

      // 3. Salvar a URL da imagem no Firestore
      await setDoc(userDocRef, {
        imageUrl: downloadURL,
        ultimaAtualizacao: new Date().toISOString()
      }, { merge: true });

      // 4. Atualizar o estado local
      setConfig(prev => ({
        ...prev,
        perfil: {
          ...prev.perfil,
          imageUrl: downloadURL
        }
      }));

      setSelectedFile(null);
      setIsLoading(false);
      alert("Foto de perfil atualizada com sucesso!");
    } catch (error) {
      console.error("Erro ao salvar imagem:", error);
      setIsLoading(false);
      alert(`Erro ao salvar imagem: ${error.message}`);
    }
  };

  // Função para formatar o valor do desconto
  const handleTaxaJurosChange = (e) => {
    const valor = e.target.value.replace(/\D/g, '');
    if (valor === '') {
      setConfig(prev => ({
        ...prev,
        financeiro: {
          ...prev.financeiro,
          taxaJurosPadrao: 0
        }
      }));
      return;
    }

    // Formata como percentual (mantém o valor em centavos para consistência)
    const valorFormatado = Number(valor) / 100;
    setConfig(prev => ({
      ...prev,
      financeiro: {
        ...prev.financeiro,
        taxaJurosPadrao: valorFormatado
      }
    }));
  };

  // Função para formatar o valor exibido
  const formatTaxaJurosValue = () => {
    if (!config.financeiro?.taxaJurosPadrao) return '';

    // Para percentual, formata apenas o número com duas casas decimais
    return config.financeiro.taxaJurosPadrao.toLocaleString('pt-BR', {
      minimumFractionDigits: 2,
      maximumFractionDigits: 2
    });
  };

  // Definição das abas
  const abas = [
    { id: 'perfil', nome: 'Perfil', icon: faUser },
    { id: 'empresa', nome: 'Geral', icon: faBuilding },
    { id: 'financeiro', nome: 'Financeiro', icon: faMoneyBill },
    { id: 'horarios', nome: 'Usuários', icon: faClock },
    { id: 'usuarios', nome: 'Cadastro', icon: faUsers },
    { id: 'estoque', nome: 'Estoque', icon: faBox }
  ];

  const handleAbaClick = (id) => {
    setAbaAtiva(id);
    // Em mobile, fecha o menu ao selecionar uma aba
    if (isMobile) {
      setMenuOpen(false);
    }
  };

  // Renderizar conteúdo da aba selecionada
  const renderConteudoAba = () => {
    switch (abaAtiva) {
      case 'perfil':
        return (
          <div className="space-y-6">
            <div className="bg-gray-50 p-4 rounded-lg">
              <h4 className="font-medium text-[#81059e] mb-3">Configurações de Perfil</h4>
              <div className="space-y-4">
                <div className="flex flex-col sm:flex-row items-center gap-4">
                  <div className="relative">
                    {config.perfil.imageUrl ? (
                      <img
                        src={config.perfil.imageUrl}
                        alt="Foto de perfil"
                        className="w-24 h-24 rounded-full object-cover border-2 border-[#81059e]"
                      />
                    ) : (
                      <div className="w-24 h-24 rounded-full bg-gray-200 flex items-center justify-center border-2 border-[#81059e]">
                        <FontAwesomeIcon icon={faUser} className="text-gray-400 text-2xl" />
                      </div>
                    )}
                  </div>
                  <div className="w-full">
                    <input
                      type="file"
                      accept="image/*"
                      onChange={handleFileChange}
                      className="hidden"
                      id="fotoPerfil"
                    />
                    <div className="flex flex-wrap gap-2">
                      <label
                        htmlFor="fotoPerfil"
                        className="inline-block px-4 py-2 bg-[#81059e] text-white rounded-md cursor-pointer hover:bg-[#690480] transition-colors"
                      >
                        {isLoading ? 'Enviando...' : 'Escolher Foto'}
                      </label>
                      {selectedFile && !isLoading && (
                        <button
                          onClick={handleUpload}
                          className="px-4 py-2 bg-green-600 text-white rounded-md hover:bg-green-700 transition-colors"
                        >
                          Enviar
                        </button>
                      )}
                    </div>
                    {selectedFile && (
                      <p className="mt-2 text-sm text-gray-600 break-all">
                        Arquivo: {selectedFile.name}
                      </p>
                    )}
                  </div>
                </div>
                <div>
                  <label className="block text-sm text-gray-600 mb-1">Nome</label>
                  <input
                    type="text"
                    name="nome"
                    value={config.perfil.nome}
                    onChange={handleInputChange}
                    className="border border-gray-300 p-2 rounded w-full"
                    placeholder="Seu nome"
                  />
                </div>
                <div>
                  <label className="block text-sm text-gray-600 mb-1">Cargo</label>
                  <input
                    type="text"
                    name="cargo"
                    value={config.perfil.cargo}
                    onChange={handleInputChange}
                    className="border border-gray-300 p-2 rounded w-full"
                    placeholder="Seu cargo"
                  />
                </div>
              </div>
            </div>
          </div>
        );

      case 'empresa':
        return (
          <div className="p-4 bg-gray-50 rounded-lg">
            <h4 className="font-medium text-[#81059e] mb-3">Informações da Empresa</h4>
            <div className="space-y-4">
              <div>
                <label className="block text-sm text-gray-600 mb-1">Nome da Empresa</label>
                <input
                  type="text"
                  name="nomeEmpresa"
                  className="border border-gray-300 p-2 rounded w-full"
                  placeholder="MASI Óticas"
                />
              </div>
              <div>
                <label className="block text-sm text-gray-600 mb-1">CNPJ</label>
                <input
                  type="text"
                  name="cnpj"
                  className="border border-gray-300 p-2 rounded w-full"
                  placeholder="XX.XXX.XXX/XXXX-XX"
                />
              </div>
              <div>
                <label className="block text-sm text-gray-600 mb-1">Endereço</label>
                <input
                  type="text"
                  name="endereco"
                  className="border border-gray-300 p-2 rounded w-full"
                  placeholder="Av. Principal, 123"
                />
              </div>
              <div>
                <label className="block text-sm text-gray-600 mb-1">Telefone</label>
                <input
                  type="text"
                  name="telefone"
                  className="border border-gray-300 p-2 rounded w-full"
                  placeholder="(00) 0000-0000"
                />
              </div>
            </div>
          </div>
        );

      case 'financeiro':
        return (
          <div className="p-4 bg-gray-50 rounded-lg">
            <h4 className="font-medium text-[#81059e] mb-3">Configurações Financeiras</h4>
            <div className="space-y-4">
              <div>
                <label className="block text-sm text-gray-600 mb-1">Taxa de Juros Padrão (%)</label>
                <input
                  type="text"
                  name="taxaJurosPadrao"
                  value={formatTaxaJurosValue()}
                  onChange={handleTaxaJurosChange}
                  className="border border-gray-300 p-2 rounded w-full"
                  placeholder="0.00"
                />
                <p className="text-xs text-gray-500 mt-1">Taxa de juros aplicada automaticamente em contas a receber vencidas</p>
              </div>
              <div>
                <label className="block text-sm text-gray-600 mb-1">Formas de Pagamento</label>
                <div className="space-y-2">
                  <div className="flex items-center">
                    <input type="checkbox" id="pix" className="mr-2" />
                    <label htmlFor="pix">PIX</label>
                  </div>
                  <div className="flex items-center">
                    <input type="checkbox" id="cartao" className="mr-2" />
                    <label htmlFor="cartao">Cartão de Crédito</label>
                  </div>
                  <div className="flex items-center">
                    <input type="checkbox" id="boleto" className="mr-2" />
                    <label htmlFor="boleto">Boleto</label>
                  </div>
                  <div className="flex items-center">
                    <input type="checkbox" id="dinheiro" className="mr-2" />
                    <label htmlFor="dinheiro">Dinheiro</label>
                  </div>
                </div>
              </div>
              <div>
                <label className="block text-sm text-gray-600 mb-1">Parcelamento Máximo</label>
                <select className="border border-gray-300 p-2 rounded w-full">
                  <option>1x</option>
                  <option>2x</option>
                  <option>3x</option>
                  <option>6x</option>
                  <option>12x</option>
                </select>
              </div>
            </div>
          </div>
        );

      case 'usuarios':
        return (
          <div className="p-4 bg-gray-50 rounded-lg">
            <h4 className="font-medium text-[#81059e] mb-3">Configurações de Usuários</h4>
            <div className="space-y-4">
              <div>
                <label className="block text-sm text-gray-600 mb-1">Política de Senhas</label>
                <div className="space-y-2">
                  <div className="flex items-center">
                    <input type="checkbox" id="senha_min" className="mr-2" />
                    <label htmlFor="senha_min">Mínimo de 8 caracteres</label>
                  </div>
                  <div className="flex items-center">
                    <input type="checkbox" id="senha_maiuscula" className="mr-2" />
                    <label htmlFor="senha_maiuscula">Exigir letra maiúscula</label>
                  </div>
                  <div className="flex items-center">
                    <input type="checkbox" id="senha_numero" className="mr-2" />
                    <label htmlFor="senha_numero">Exigir número</label>
                  </div>
                  <div className="flex items-center">
                    <input type="checkbox" id="senha_especial" className="mr-2" />
                    <label htmlFor="senha_especial">Exigir caractere especial</label>
                  </div>
                </div>
              </div>
              <div>
                <label className="block text-sm text-gray-600 mb-1">Expiração de Sessão</label>
                <select className="border border-gray-300 p-2 rounded w-full">
                  <option>30 minutos</option>
                  <option>1 hora</option>
                  <option>8 horas</option>
                  <option>24 horas</option>
                </select>
              </div>
            </div>
          </div>
        );

      case 'estoque':
        return (
          <div className="p-4 bg-gray-50 rounded-lg">
            <h4 className="font-medium text-[#81059e] mb-3">Configurações de Estoque</h4>
            <div className="space-y-4">
              <div>
                <label className="block text-sm text-gray-600 mb-1">Alerta de Estoque Baixo</label>
                <input
                  type="number"
                  className="border border-gray-300 p-2 rounded w-full"
                  placeholder="5"
                />
                <p className="text-xs text-gray-500 mt-1">Quantidade mínima para alerta</p>
              </div>
              <div>
                <label className="block text-sm text-gray-600 mb-1">Método de Avaliação</label>
                <select className="border border-gray-300 p-2 rounded w-full">
                  <option>FIFO (Primeiro a entrar, primeiro a sair)</option>
                  <option>LIFO (Último a entrar, primeiro a sair)</option>
                  <option>Custo Médio</option>
                </select>
              </div>
              <div className="flex items-center">
                <input type="checkbox" id="auto_pedido" className="mr-2" />
                <label htmlFor="auto_pedido">Gerar pedido automático quando estoque baixo</label>
              </div>
            </div>
          </div>
        );

      default:
        return <div className="p-4">Selecione uma opção no menu</div>;
    }
  };

  if (!isOpen) return null;

  // Encontra a aba ativa para exibir no cabeçalho em modo móvel
  const abaAtual = abas.find(aba => aba.id === abaAtiva);

  const modalContent = (
    <div className="fixed inset-0 flex items-center justify-center bg-black bg-opacity-50 z-50 p-0 sm:p-4">
      <div className="bg-white rounded-lg shadow-lg w-full max-w-4xl h-full sm:h-auto sm:max-h-[90vh] overflow-hidden relative flex flex-col">
        {/* Cabeçalho */}
        <div className="bg-[#81059e] p-3 sm:p-4 flex justify-between items-center">
          <div className="flex items-center">
            {isMobile && (
              <button 
                onClick={() => setMenuOpen(!menuOpen)} 
                className="text-white mr-3"
              >
                <FontAwesomeIcon icon={menuOpen ? faChevronLeft : faBars} size="lg" />
              </button>
            )}
            <h3 className="text-lg sm:text-xl font-bold text-white flex items-center">
              <FontAwesomeIcon icon={faGear} className="mr-2" />
              {isMobile && !menuOpen ? abaAtual?.nome || 'Configurações' : 'Configurações do Sistema'}
            </h3>
          </div>
          <button
            onClick={handleClose}
            className="text-white hover:text-gray-200"
          >
            <FontAwesomeIcon icon={faTimes} size="lg" />
          </button>
        </div>

        {/* Área de conteúdo com layout ajustável */}
        <div className="flex flex-1 overflow-hidden">
          {/* Menu lateral - tem visibilidade controlada no mobile */}
          {(menuOpen || !isMobile) && (
            <div className={`${isMobile ? 'absolute inset-0 z-10 bg-white' : 'w-64'} bg-gray-100 overflow-y-auto`}>
              <ul className="p-2 space-y-1">
                {abas.map((aba) => (
                  <li key={aba.id}>
                    <button
                      onClick={() => handleAbaClick(aba.id)}
                      className={`w-full text-left p-3 rounded-md flex items-center
                        ${abaAtiva === aba.id ?
                          'bg-[#81059e] text-white font-medium' :
                          'text-gray-700 hover:bg-gray-200'}`}
                    >
                      <FontAwesomeIcon icon={aba.icon} className="mr-3" />
                      {aba.nome}
                    </button>
                  </li>
                ))}
              </ul>
            </div>
          )}

          {/* Conteúdo da aba */}
          <div className={`flex-1 p-4 overflow-y-auto ${(menuOpen && isMobile) ? 'hidden' : 'block'}`}>
            {renderConteudoAba()}
          </div>
        </div>

        {/* Rodapé com botões */}
        <div className="flex justify-end gap-2 p-3 border-t bg-gray-50">
          <button
            type="button"
            onClick={handleClose}
            className="px-3 py-2 text-[#81059e] bg-white hover:bg-gray-50 text-sm sm:text-base"
            disabled={isLoading}
          >
            Cancelar
          </button>
          <button
            type="button"
            onClick={handleSalvar}
            className="px-3 py-2 rounded-md text-white bg-[#81059e] hover:bg-[#690480] flex items-center gap-1 text-sm sm:text-base"
            disabled={isLoading || !isAdmin}
          >
            <FontAwesomeIcon icon={faSave} /> 
            <span className="hidden sm:inline">Salvar</span>
          </button>
        </div>
      </div>
    </div>
  );

  // Verifica se estamos no navegador antes de usar createPortal
  if (typeof window === 'undefined') {
    return null;
  }

  return createPortal(modalContent, document.body);
};

export default ConfigurationsModal;