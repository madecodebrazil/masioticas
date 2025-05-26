// components/ProductDetailModal.js
import { useState, useEffect } from 'react';
import { FiX, FiEdit, FiInfo, FiPackage, FiDollarSign, FiTag, FiBox } from 'react-icons/fi';
import { useAuth } from '@/hooks/useAuth';

const ProductDetailModal = ({ product, isOpen, onClose, selectedLoja, onPriceUpdate }) => {
  const [isEditing, setIsEditing] = useState(false);
  const [editedPrice, setEditedPrice] = useState('');
  const [loading, setLoading] = useState(false);
  const [message, setMessage] = useState({ type: '', text: '' });
  const { userPermissions } = useAuth();

  // Verificar se o usuário é admin
  const isAdmin = userPermissions?.isAdmin || userPermissions?.acesso_total;

  useEffect(() => {
    if (product) {
      setEditedPrice(product.valor || product.preco || '0');
    }
  }, [product]);

  if (!isOpen || !product) return null;

  // Formatar valor como moeda
  const formatCurrency = (value) => {
    return new Intl.NumberFormat('pt-BR', {
      style: 'currency',
      currency: 'BRL'
    }).format(value);
  };

  // Obter ícone baseado na categoria
  const getCategoryIcon = (category) => {
    switch (category) {
      case 'armacoes':
        return <FiPackage className="text-purple-500" />;
      case 'lentes':
        return <FiTag className="text-blue-500" />;
      case 'solares':
        return <FiBox className="text-orange-500" />;
      default:
        return <FiInfo className="text-gray-500" />;
    }
  };

  // Traduzir nome da categoria
  const getCategoryName = (category) => {
    const translations = {
      'armacoes': 'Armação',
      'lentes': 'Lente',
      'solares': 'Óculos Solar',
      'outros': 'Outro Produto'
    };
    return translations[category] || category;
  };

  // Atualizar preço apenas localmente (não no banco)
  const handleUpdatePrice = () => {
    if (!isAdmin) return;
    
    setLoading(true);
    setMessage({ type: '', text: '' });
    
    try {
      const numericPrice = parseFloat(editedPrice.replace(/[^\d,]/g, '').replace(',', '.'));
      
      if (isNaN(numericPrice)) {
        throw new Error('Preço inválido');
      }
      
      // Chamar o callback para atualizar apenas o carrinho e interface
      if (typeof onPriceUpdate === 'function') {
        onPriceUpdate(product.id, product.categoria, numericPrice);
      }
      
      setMessage({ 
        type: 'success', 
        text: 'Preço atualizado para esta venda!' 
      });
      
      setTimeout(() => {
        setIsEditing(false);
        setMessage({ type: '', text: '' });
      }, 2000);
    } catch (error) {
      console.error('Erro ao atualizar preço:', error);
      setMessage({ 
        type: 'error', 
        text: `Erro ao atualizar: ${error.message}` 
      });
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 overflow-y-auto bg-black bg-opacity-50 flex items-center justify-center">
      <div className="bg-white rounded-lg shadow-xl w-full max-w-2xl max-h-[90vh] overflow-hidden flex flex-col">
        {/* Cabeçalho */}
        <div className="bg-[#81059e] px-4 py-3 flex justify-between items-center">
          <div className="flex items-center space-x-2 text-white">
            {getCategoryIcon(product.categoria)}
            <h3 className="font-medium">{getCategoryName(product.categoria)}</h3>
          </div>
          <button
            onClick={onClose}
            className="text-white hover:text-gray-200 transition-colors focus:outline-none"
          >
            <FiX size={24} />
          </button>
        </div>

        {/* Conteúdo */}
        <div className="p-6 flex-grow overflow-y-auto">
          <div className="mb-4">
            <h2 className="text-xl font-bold text-[#81059e] mb-2">
              {product.titulo || product.nome || "Produto sem título"}
            </h2>
            <div className="flex items-center text-sm text-gray-500">
              <span className="font-medium mr-2">Código:</span>
              <span>{product.codigo || "N/A"}</span>
              {product.sku && (
                <>
                  <span className="mx-2">|</span>
                  <span className="font-medium mr-2">SKU:</span>
                  <span>{product.sku}</span>
                </>
              )}
            </div>
          </div>

          {/* Grid de informações */}
          <div className="grid grid-cols-2 gap-4 mb-6">
            <div className="space-y-3">
              <div>
                <p className="text-sm text-gray-500 font-medium">Marca</p>
                <p>{product.marca || "N/A"}</p>
              </div>
              <div>
                <p className="text-sm text-gray-500 font-medium">Loja</p>
                <p>{product.loja === 'loja1' ? 'Loja 1' : 'Loja 2'}</p>
              </div>
              <div>
                <p className="text-sm text-gray-500 font-medium">Fornecedor</p>
                <p>{product.fornecedor || "N/A"}</p>
              </div>
            </div>
            
            <div className="space-y-3">
              <div>
                <p className="text-sm text-gray-500 font-medium">Estoque</p>
                <p className={`font-medium ${parseInt(product.quantidade) < 5 ? 'text-red-600' : 'text-green-600'}`}>
                  {product.quantidade || 0} unidades
                </p>
              </div>
              <div>
                <p className="text-sm text-gray-500 font-medium">Preço de Custo</p>
                <p>{formatCurrency(product.custo || 0)}</p>
              </div>
              <div>
                <p className="text-sm text-gray-500 font-medium">Preço de Venda</p>
                {isEditing ? (
                  <div className="flex items-center mt-1">
                    <input
                      type="text"
                      value={editedPrice}
                      onChange={(e) => setEditedPrice(e.target.value)}
                      className="border border-gray-300 rounded p-1 w-24 text-sm"
                    />
                    <button
                      onClick={handleUpdatePrice}
                      disabled={loading}
                      className="ml-2 bg-[#81059e] text-white px-2 py-1 rounded text-sm disabled:bg-purple-300"
                    >
                      {loading ? 'Salvando...' : 'Aplicar'}
                    </button>
                  </div>
                ) : (
                  <div className="flex items-center">
                    <p className="font-semibold text-[#81059e]">
                      {formatCurrency(product.valor || product.preco || 0)}
                    </p>
                    {isAdmin && (
                      <button
                        onClick={() => setIsEditing(true)}
                        className="ml-2 text-gray-400 hover:text-[#81059e]"
                        title="Ajustar preço para esta venda"
                      >
                        <FiEdit size={14} />
                      </button>
                    )}
                  </div>
                )}
              </div>
            </div>
          </div>

          {/* Mensagem de feedback */}
          {message.text && (
            <div className={`p-2 mb-4 rounded text-sm ${
              message.type === 'success' ? 'bg-green-100 text-green-800' : 'bg-red-100 text-red-800'
            }`}>
              {message.text}
            </div>
          )}

          {/* Especificações técnicas */}
          {product.categoria === 'armacoes' && (
            <div className="mb-6">
              <h4 className="font-medium text-[#81059e] mb-2">Especificações da Armação</h4>
              <div className="grid grid-cols-2 gap-3 bg-gray-50 p-3 rounded">
                {product.material && (
                  <div>
                    <p className="text-xs text-gray-500">Material</p>
                    <p className="text-sm">{product.material}</p>
                  </div>
                )}
                {product.formato && (
                  <div>
                    <p className="text-xs text-gray-500">Formato</p>
                    <p className="text-sm">{product.formato}</p>
                  </div>
                )}
                {product.cor && (
                  <div>
                    <p className="text-xs text-gray-500">Cor</p>
                    <p className="text-sm">{product.cor}</p>
                  </div>
                )}
                {product.genero && (
                  <div>
                    <p className="text-xs text-gray-500">Gênero</p>
                    <p className="text-sm">{product.genero}</p>
                  </div>
                )}
              </div>
            </div>
          )}

          {product.categoria === 'lentes' && (
            <div className="mb-6">
              <h4 className="font-medium text-[#81059e] mb-2">Especificações da Lente</h4>
              <div className="grid grid-cols-2 gap-3 bg-gray-50 p-3 rounded">
                {product.material && (
                  <div>
                    <p className="text-xs text-gray-500">Material</p>
                    <p className="text-sm">{product.material}</p>
                  </div>
                )}
                {product.indice && (
                  <div>
                    <p className="text-xs text-gray-500">Índice</p>
                    <p className="text-sm">{product.indice}</p>
                  </div>
                )}
                {product.design && (
                  <div>
                    <p className="text-xs text-gray-500">Design</p>
                    <p className="text-sm">{product.design}</p>
                  </div>
                )}
                {product.tratamento && (
                  <div>
                    <p className="text-xs text-gray-500">Tratamentos</p>
                    <p className="text-sm">{Array.isArray(product.tratamento) ? product.tratamento.join(', ') : product.tratamento}</p>
                  </div>
                )}
              </div>
            </div>
          )}

          {product.categoria === 'solares' && (
            <div className="mb-6">
              <h4 className="font-medium text-[#81059e] mb-2">Especificações do Óculos Solar</h4>
              <div className="grid grid-cols-2 gap-3 bg-gray-50 p-3 rounded">
                {product.material && (
                  <div>
                    <p className="text-xs text-gray-500">Material</p>
                    <p className="text-sm">{product.material}</p>
                  </div>
                )}
                {product.cor && (
                  <div>
                    <p className="text-xs text-gray-500">Cor</p>
                    <p className="text-sm">{product.cor}</p>
                  </div>
                )}
                {product.formato && (
                  <div>
                    <p className="text-xs text-gray-500">Formato</p>
                    <p className="text-sm">{product.formato}</p>
                  </div>
                )}
                {product.polarizado !== undefined && (
                  <div>
                    <p className="text-xs text-gray-500">Polarizado</p>
                    <p className="text-sm">{product.polarizado ? 'Sim' : 'Não'}</p>
                  </div>
                )}
              </div>
            </div>
          )}

          {/* Observações - se houver */}
          {product.observacoes && (
            <div className="mb-4">
              <h4 className="font-medium text-[#81059e] mb-1">Observações</h4>
              <p className="text-sm bg-gray-50 p-3 rounded">{product.observacoes}</p>
            </div>
          )}
          
          {isAdmin && (
            <div className="mt-4 bg-blue-50 p-2 rounded text-sm text-blue-700">
              <p>Nota: O ajuste de preço é válido apenas para esta venda e não altera o preço do produto no cadastro.</p>
            </div>
          )}
        </div>

        {/* Rodapé */}
        <div className="bg-gray-50 px-6 py-3 flex justify-between items-center border-t border-gray-200">
          <div className="flex items-center text-gray-500">
            <FiDollarSign className="mr-1" />
            <span className="text-sm">
              {formatCurrency(product.valor || product.preco || 0)}
            </span>
          </div>
          <button
            onClick={onClose}
            className="px-4 py-2 bg-[#81059e] text-white rounded hover:bg-[#6f0486] transition-colors"
          >
            Fechar
          </button>
        </div>
      </div>
    </div>
  );
};

export default ProductDetailModal;