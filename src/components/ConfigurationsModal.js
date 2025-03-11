"use client";
import { createPortal } from 'react-dom';
import React, { useState, useEffect } from 'react';
import { doc, setDoc, getDoc } from 'firebase/firestore';
import { firestore } from '@/lib/firebaseConfig';
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
  faExclamationTriangle
} from '@fortawesome/free-solid-svg-icons';

const ConfigurationsModal = ({ isOpen, onClose }) => {
  const { userPermissions } = useAuth();
  const [abaAtiva, setAbaAtiva] = useState('horarios');
  const [isAdmin, setIsAdmin] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [config, setConfig] = useState({
    horarios: {
      abertura: '08:00',
      fechamento: '18:00',
      aberturaSabado: '08:00',
      fechamentoSabado: '13:00',
      domingoFechado: true
    }
  });

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
    }
    // Adicione lógica para outras abas conforme necessário
  };
  
  const handleClose = () => {
    document.body.style.overflow = 'auto';
    onClose();
  };

  // Definição das abas
  const abas = [
    { id: 'empresa', nome: 'Geral', icon: faBuilding },
    { id: 'financeiro', nome: 'Financeiro', icon: faMoneyBill },
    { id: 'horarios', nome: 'Usuários', icon: faClock },
    { id: 'usuarios', nome: 'Cadastro', icon: faUsers },
    { id: 'estoque', nome: 'Estoque', icon: faBox }
  ];

  // Renderizar conteúdo da aba selecionada
  const renderConteudoAba = () => {
    switch (abaAtiva) {
      case 'horarios':
        return (
          <div className="space-y-6">
            {/* Horários durante a semana */}
            <div className="bg-gray-50 p-4 rounded-lg">
              <h4 className="font-medium text-[#81059e] mb-3">Horário de Funcionamento (Seg-Sex)</h4>
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm text-gray-600 mb-1">Horário de Abertura</label>
                  <input
                    type="time"
                    name="abertura"
                    value={config.horarios.abertura}
                    onChange={handleInputChange}
                    className="border border-gray-300 p-2 rounded w-full"
                  />
                </div>
                <div>
                  <label className="block text-sm text-gray-600 mb-1">Horário de Fechamento</label>
                  <input
                    type="time"
                    name="fechamento"
                    value={config.horarios.fechamento}
                    onChange={handleInputChange}
                    className="border border-gray-300 p-2 rounded w-full"
                  />
                </div>
              </div>
            </div>

            {/* Horários aos sábados */}
            <div className="bg-gray-50 p-4 rounded-lg">
              <h4 className="font-medium text-[#81059e] mb-3">Horário de Funcionamento (Sábados)</h4>
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm text-gray-600 mb-1">Horário de Abertura</label>
                  <input
                    type="time"
                    name="aberturaSabado"
                    value={config.horarios.aberturaSabado}
                    onChange={handleInputChange}
                    className="border border-gray-300 p-2 rounded w-full"
                  />
                </div>
                <div>
                  <label className="block text-sm text-gray-600 mb-1">Horário de Fechamento</label>
                  <input
                    type="time"
                    name="fechamentoSabado"
                    value={config.horarios.fechamentoSabado}
                    onChange={handleInputChange}
                    className="border border-gray-300 p-2 rounded w-full"
                  />
                </div>
              </div>
            </div>

            {/* Opção para domingo */}
            <div className="bg-gray-50 p-4 rounded-lg">
              <div className="flex items-center">
                <input
                  type="checkbox"
                  id="domingoFechado"
                  name="domingoFechado"
                  checked={config.horarios.domingoFechado}
                  onChange={handleInputChange}
                  className="h-4 w-4 text-[#81059e] border-gray-300 rounded"
                />
                <label htmlFor="domingoFechado" className="ml-2 text-gray-700">
                  Loja não funciona aos domingos
                </label>
              </div>
            </div>

            <div className="bg-yellow-50 p-4 rounded-lg border border-yellow-200">
              <div className="flex">
                <div className="flex-shrink-0">
                  <FontAwesomeIcon icon={faExclamationTriangle} className="h-5 w-5 text-yellow-400" />
                </div>
                <div className="ml-3">
                  <h3 className="text-sm font-medium text-yellow-800">
                    Observação importante
                  </h3>
                  <div className="mt-2 text-sm text-yellow-700">
                    <p>
                      As configurações de horário afetam a permissão para abertura de caixa.
                      Fora dos horários configurados, não será possível abrir o caixa.
                    </p>
                  </div>
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

  const modalContent = (
    <div 
      className="fixed inset-0 flex items-center justify-center bg-black bg-opacity-50 z-50"
    >
      <div 
        className="bg-[#81059e] rounded-lg shadow-lg w-full max-w-4xl max-h-[90vh] overflow-hidden relative"
      >
        <div className="flex justify-between items-center p-4 border-b">
          <h3 className="text-xl font-bold text-white">
            <FontAwesomeIcon icon={faClock} className="mr-2 text-white" /> Configurações do Sistema
          </h3>
          <button 
            onClick={handleClose}
            className="text-gray-500 hover:text-gray-700"
          >
            <FontAwesomeIcon icon={faTimes} size="lg" />
          </button>
        </div>
        
        <div className="flex h-[calc(90vh-120px)]">
          {/* Menu lateral */}
          <div className="w-64 bg-gray-100 p-4 overflow-y-auto">
            <ul className="space-y-2">
              {abas.map((aba) => (
                <li key={aba.id}>
                  <button
                    onClick={() => setAbaAtiva(aba.id)}
                    className={`w-full text-left p-3 rounded-md flex items-center
                      ${abaAtiva === aba.id ? 
                        'bg-[#81059e] text-gray-200 font-medium' : 
                        'text-gray-700 hover:bg-gray-200'}`}
                  >
                    <FontAwesomeIcon icon={aba.icon} className="mr-3" />
                    {aba.nome}
                  </button>
                </li>
              ))}
            </ul>
          </div>
          
          {/* Conteúdo da aba */}
          <div className="flex-1 p-6 overflow-y-auto">
            {renderConteudoAba()}
          </div>
        </div>

        <div className="flex justify-end gap-3 p-4 border-t bg-gray-50">
          <button
            type="button"
            onClick={handleClose}
            className="px-4 py-2 border border-gray-300 rounded-md text-gray-700 bg-white hover:bg-gray-50"
            disabled={isLoading}
          >
            Cancelar
          </button>
          <button
            type="button"
            onClick={handleSalvar}
            className="px-4 py-2 rounded-md text-white bg-[#81059e] hover:bg-[#690480] flex items-center gap-2"
            disabled={isLoading || !isAdmin}
          >
            {isLoading ? 'Salvando...' : (
              <>
                <FontAwesomeIcon icon={faSave} /> Salvar
              </>
            )}
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