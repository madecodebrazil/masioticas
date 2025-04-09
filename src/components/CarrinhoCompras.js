// components/CarrinhoCompras.js
import { useState, useEffect, useRef } from 'react';
import { 
  FiSearch, FiPlus, FiMinus, FiTrash2, FiInfo, 
  FiShoppingBag, FiBarChart2, FiTag, FiPackage,
  FiAlertCircle
} from 'react-icons/fi';
import { collection, getDocs, query, where } from 'firebase/firestore';
import { firestore } from '@/lib/firebaseConfig';

const CarrinhoCompras = ({ 
  products = [],  
  cartItems = [], 
  setCartItems,
  selectedLoja,
  updateCartValue // Função para atualizar valores externos
}) => {
  // Estados para busca de produtos
  const [productSearchTerm, setProductSearchTerm] = useState('');
  const [filteredProducts, setFilteredProducts] = useState([]);
  const [newProductQty, setNewProductQty] = useState(1);
  const produtoInputRef = useRef(null);
  const [showDetails, setShowDetails] = useState(null);
  const [loadingStates, setLoadingStates] = useState({});
  const [expandedGroup, setExpandedGroup] = useState(null);
  const [groupedCart, setGroupedCart] = useState({});
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [categorias] = useState(['armacoes', 'lentes', 'solares']);
  const [estoqueData, setEstoqueData] = useState([]);
  const [debug, setDebug] = useState(null);

  // Buscar produtos do estoque
  useEffect(() => {
    if (selectedLoja) {
      fetchProductsFromEstoque();
    }
  }, [selectedLoja]);

  // Buscar produtos do estoque no Firebase - CAMINHO CORRIGIDO
  const fetchProductsFromEstoque = async () => {
    try {
      setLoading(true);
      setError('');
      let allProducts = [];
      let debugInfo = {}; // Para armazenar informações de debug

      // Percorrer cada categoria (armacoes, lentes, solares)
      for (const categoria of categorias) {
        try {
          // CAMINHO CORRIGIDO com base na captura de tela: estoque > loja1 > armacoes
          const productsRef = collection(firestore, `estoque/${selectedLoja}/${categoria}`);
          
          // Capturar informações para debug
          debugInfo[categoria] = {
            path: `estoque/${selectedLoja}/${categoria}`,
            attempt: true
          };
          
          const querySnapshot = await getDocs(productsRef);
          
          debugInfo[categoria].docsCount = querySnapshot.size;
          debugInfo[categoria].success = true;
          
          // Mapear documentos para objetos de produto
          const categoryProducts = querySnapshot.docs.map(doc => {
            const data = doc.data();
            return {
              id: doc.id,
              categoria: categoria,
              nome: data.nome || data.info_geral?.nome || `Produto ${doc.id}`,
              marca: data.marca || data.info_geral?.marca || "Sem marca",
              codigo: data.codigo || data.info_geral?.codigo || doc.id,
              preco: data.preco || data.info_geral?.preco || 0,
              quantidade: data.quantidade || 0,
              info_geral: data.info_geral || {
                nome: data.nome || `Produto ${doc.id}`,
                marca: data.marca || "Sem marca",
                codigo: data.codigo || doc.id,
                preco: data.preco || 0
              },
              info_adicional: data.info_adicional || {}
            };
          });
          
          allProducts = [...allProducts, ...categoryProducts];
        } catch (err) {
          debugInfo[categoria].error = err.message;
          debugInfo[categoria].success = false;
          console.error(`Erro ao buscar categoria ${categoria}:`, err);
        }
      }

      // Definir as informações de debug
      setDebug(debugInfo);

      // Filtrar produtos com quantidade disponível
      const productsList = allProducts.filter(product => 
        (product.quantidade || 0) > 0
      );

      // Se não houver produtos, tentar buscar sem filtro de quantidade
      if (productsList.length === 0 && allProducts.length > 0) {
        setEstoqueData(allProducts);
        setError('Aviso: Mostrando produtos sem estoque disponível');
      } else {
        setEstoqueData(productsList);
      }

      // Se não encontrou nenhum produto, mostrar mensagem
      if (allProducts.length === 0) {
        setError(`Nenhum produto encontrado no estoque. Verifique a estrutura do banco de dados.`);
      }
      
    } catch (err) {
      console.error('Erro ao buscar produtos:', err);
      setError('Falha ao carregar produtos do estoque. Verifique o console para mais detalhes.');
      setDebug({error: err.message});
    } finally {
      setLoading(false);
    }
  };

  // Exibir informações de debug quando solicitado
  const showDebugInfo = () => {
    console.log('DEBUG INFO:', debug);
    alert('Informações de debug foram registradas no console.');
  };

  // Agrupar itens por categoria
  useEffect(() => {
    const grouped = cartItems.reduce((acc, item) => {
      const categoria = item.categoria || 'outros';
      if (!acc[categoria]) {
        acc[categoria] = [];
      }
      acc[categoria].push(item);
      return acc;
    }, {});
    setGroupedCart(grouped);
    
    // Calcular e propagar os valores do carrinho para o componente pai
    if (typeof updateCartValue === 'function') {
      const subtotal = cartItems.reduce((total, item) => 
        total + ((item.preco || item.info_geral?.preco || 0) * item.quantity), 0
      );
      updateCartValue(subtotal);
    }
  }, [cartItems, updateCartValue]);

  // Filtrar produtos com base no termo de busca
  useEffect(() => {
    if (productSearchTerm.trim() === '') {
      setFilteredProducts([]);
    } else {
      const searchTermLower = productSearchTerm.toLowerCase();
      // Busca nos produtos do estoque
      const filtered = estoqueData.filter(product => {
        const nome = (product.nome || product.info_geral?.nome || '').toLowerCase();
        const codigo = (product.codigo || product.info_geral?.codigo || '').toLowerCase();
        const marca = (product.marca || product.info_geral?.marca || '').toLowerCase();
        
        return nome.includes(searchTermLower) || 
               codigo.includes(searchTermLower) || 
               marca.includes(searchTermLower);
      });
      setFilteredProducts(filtered);
    }
  }, [productSearchTerm, estoqueData]);

  // Formatar para moeda brasileira (R$)
  const formatCurrency = (value) => {
    return new Intl.NumberFormat('pt-BR', {
      style: 'currency',
      currency: 'BRL'
    }).format(value || 0);
  };

  // Adicionar produto ao carrinho
  const addToCart = (product) => {
    if (!product) return;

    // Verificar se tem estoque disponível (ignorar se estivermos mostrando produtos sem estoque)
    if ((product.quantidade || 0) < newProductQty && error !== 'Aviso: Mostrando produtos sem estoque disponível') {
      setError(`Quantidade solicitada excede o estoque disponível (${product.quantidade || 0})`);
      setTimeout(() => setError(''), 3000);
      return;
    }

    // Simular loading ao adicionar
    setLoadingStates(prev => ({ ...prev, [product.id]: true }));

    setTimeout(() => {
      // Verificar se o produto já está no carrinho
      const existingItem = cartItems.find(item => item.id === product.id);

      if (existingItem) {
        // Verificar se a nova quantidade total excede o estoque
        const newTotalQty = existingItem.quantity + newProductQty;
        if ((product.quantidade || 0) < newTotalQty && error !== 'Aviso: Mostrando produtos sem estoque disponível') {
          setError(`Quantidade total excede o estoque disponível (${product.quantidade || 0})`);
          setLoadingStates(prev => ({ ...prev, [product.id]: false }));
          setTimeout(() => setError(''), 3000);
          return;
        }

        // Aumentar a quantidade se já estiver no carrinho
        setCartItems(cartItems.map(item =>
          item.id === product.id
            ? { ...item, quantity: newTotalQty }
            : item
        ));
      } else {
        // Adicionar novo item ao carrinho
        const produtoFormatado = {
          id: product.id,
          categoria: product.categoria,
          nome: product.nome || product.info_geral?.nome,
          marca: product.marca || product.info_geral?.marca,
          codigo: product.codigo || product.info_geral?.codigo,
          preco: product.preco || product.info_geral?.preco || 0,
          info_geral: {
            nome: product.nome || product.info_geral?.nome,
            marca: product.marca || product.info_geral?.marca,
            codigo: product.codigo || product.info_geral?.codigo,
            preco: product.preco || product.info_geral?.preco || 0
          },
          info_adicional: product.info_adicional || {},
          quantidade: product.quantidade || 0,
          quantity: newProductQty // Quantidade no carrinho
        };

        setCartItems([...cartItems, produtoFormatado]);
      }

      // Limpar campos
      setProductSearchTerm('');
      setFilteredProducts([]);
      setNewProductQty(1);
      setLoadingStates(prev => ({ ...prev, [product.id]: false }));
      
      if (produtoInputRef.current) {
        produtoInputRef.current.focus();
      }
    }, 300);
  };

  // Atualizar quantidade no carrinho
  const updateQuantity = (productId, newQuantity) => {
    if (newQuantity < 1) return;

    // Verificar se a quantidade não excede o estoque
    const product = estoqueData.find(p => p.id === productId);
    const stockQuantity = product?.quantidade || 0;

    if (newQuantity > stockQuantity && error !== 'Aviso: Mostrando produtos sem estoque disponível') {
      setError(`Quantidade máxima disponível: ${stockQuantity}`);
      setTimeout(() => setError(''), 3000);
      return;
    }

    setCartItems(cartItems.map(item =>
      item.id === productId
        ? { ...item, quantity: newQuantity }
        : item
    ));
  };

  // Remover produto do carrinho
  const removeFromCart = (productId) => {
    setCartItems(cartItems.filter(item => item.id !== productId));
  };

  // Limpar carrinho
  const clearCart = () => {
    if (cartItems.length > 0 && confirm('Tem certeza que deseja limpar o carrinho?')) {
      setCartItems([]);
    }
  };

  // Calcular totais por categoria
  const calculateCategoryTotal = (category) => {
    return groupedCart[category]?.reduce((total, item) => 
      total + ((item.preco || item.info_geral?.preco || 0) * item.quantity), 0
    ) || 0;
  };

  // Calcular total do carrinho
  const calculateTotal = () => {
    return cartItems.reduce((total, item) => 
      total + ((item.preco || item.info_geral?.preco || 0) * item.quantity), 0
    );
  };

  // Determinar ícone da categoria
  const getCategoryIcon = (category) => {
    switch(category) {
      case 'armacoes':
        return <FiPackage />;
      case 'lentes':
        return <FiBarChart2 />;
      case 'solares':
        return <FiTag />;
      default:
        return <FiShoppingBag />;
    }
  };
  
  // Traduzir nome da categoria
  const getCategoryName = (category) => {
    const translations = {
      'armacoes': 'Armações',
      'lentes': 'Lentes',
      'solares': 'Óculos Solares',
      'outros': 'Outros Produtos'
    };
    return translations[category] || category;
  };

  return (
    <div className="border-2 border-gray-200 rounded-lg bg-white overflow-hidden">
      {/* Mensagem de erro */}
      {error && (
        <div className={`p-2 text-center ${error.includes('Aviso') ? 'bg-yellow-100 text-yellow-700' : 'bg-red-100 text-red-700'} flex items-center justify-center`}>
          <FiAlertCircle className="mr-2" />
          {error}
          {error.includes('estrutura') && (
            <button 
              onClick={showDebugInfo}
              className="ml-2 underline text-blue-600 text-xs"
            >
              Debug
            </button>
          )}
        </div>
      )}
      
      {/* Barra de Busca de Produtos */}
      <div className="p-4 border-b border-gray-200 bg-gray-50">
        <div className="flex gap-2 items-center">
          <div className="relative flex-1">
            <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
              <FiSearch className="text-gray-400" />
            </div>
            <input
              type="text"
              value={productSearchTerm}
              onChange={(e) => setProductSearchTerm(e.target.value)}
              className="border-2 border-[#81059e] pl-10 p-2 rounded-lg w-full"
              placeholder="Buscar produto por nome, código ou marca"
              ref={produtoInputRef}
            />
            {filteredProducts.length > 0 && (
              <div className="absolute z-20 mt-1 w-[400px] bg-white shadow-xl rounded-md border border-gray-300 max-h-80 overflow-auto">
                <div className="sticky top-0 bg-[#81059e] text-white p-2 text-sm font-medium">
                  {filteredProducts.length} produtos encontrados
                </div>
                {filteredProducts.map(product => (
                  <div
                    key={product.id}
                    className="p-3 hover:bg-purple-50 cursor-pointer border-b last:border-b-0 transition-colors"
                    onClick={() => addToCart(product)}
                  >
                    <div className="flex justify-between items-center">
                      <div className="flex-1">
                        <div className="font-medium text-[#81059e]">
                          {product.nome || product.info_geral?.nome || "Produto sem nome"}
                        </div>
                        <div className="flex justify-between text-sm">
                          <span className="text-gray-600">
                            {product.marca || product.info_geral?.marca || "Sem marca"} | 
                            Cód: {product.codigo || product.info_geral?.codigo || "N/A"}
                          </span>
                        </div>
                        <div className="text-xs text-gray-500 mt-1">
                          {getCategoryName(product.categoria)} - Estoque: {product.quantidade || 0}
                        </div>
                      </div>
                      <div className="flex flex-col items-end">
                        <span className="font-semibold text-[#81059e]">
                          {formatCurrency(product.preco || product.info_geral?.preco || 0)}
                        </span>
                        <button 
                          className="mt-1 text-xs bg-[#81059e] text-white px-2 py-1 rounded flex items-center gap-1"
                          disabled={loadingStates[product.id]}
                        >
                          {loadingStates[product.id] ? (
                            <span className="flex items-center">
                              <svg className="animate-spin h-3 w-3 mr-1" viewBox="0 0 24 24">
                                <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" fill="none" />
                                <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z" />
                              </svg>
                              Adicionando
                            </span>
                          ) : (
                            <>
                              <FiPlus size={12} /> Adicionar
                            </>
                          )}
                        </button>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
          <div className="flex items-center border-2 border-[#81059e] rounded-lg overflow-hidden">
            <button 
              onClick={() => setNewProductQty(prev => Math.max(1, prev - 1))}
              className="px-3 py-2 bg-gray-100 text-[#81059e] hover:bg-gray-200 border-r border-[#81059e]"
            >
              <FiMinus size={16} />
            </button>
            <input
              type="number"
              min="1"
              value={newProductQty}
              onChange={(e) => setNewProductQty(parseInt(e.target.value) || 1)}
              className="w-14 text-center p-2 focus:outline-none focus:ring-2 focus:ring-[#81059e] focus:ring-opacity-50"
            />
            <button 
              onClick={() => setNewProductQty(prev => prev + 1)}
              className="px-3 py-2 bg-gray-100 text-[#81059e] hover:bg-gray-200 border-l border-[#81059e]"
            >
              <FiPlus size={16} />
            </button>
          </div>
        </div>
      </div>

      {/* Lista de Produtos no Carrinho */}
      <div className="divide-y divide-gray-100">
        {loading ? (
          <div className="p-8 text-center">
            <div className="mx-auto flex items-center justify-center h-12 w-12 rounded-full bg-purple-100 mb-4">
              <svg className="animate-spin h-6 w-6 text-[#81059e]" viewBox="0 0 24 24">
                <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" fill="none" />
                <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z" />
              </svg>
            </div>
            <h3 className="text-lg font-medium text-gray-900 mb-1">Carregando produtos...</h3>
          </div>
        ) : cartItems.length === 0 ? (
          <div className="p-8 text-center">
            <div className="mx-auto flex items-center justify-center h-12 w-12 rounded-full bg-purple-100 mb-4">
              <FiShoppingBag className="h-6 w-6 text-[#81059e]" />
            </div>
            <h3 className="text-lg font-medium text-gray-900 mb-1">Seu carrinho está vazio</h3>
            <p className="text-gray-500 mb-4">Busque produtos para adicionar à venda</p>
            
            {/* Status do estoque */}
            <div className="mt-4 text-sm text-gray-500">
              {estoqueData.length === 0 ? (
                <p>Nenhum produto encontrado no estoque</p>
              ) : (
                <p>{estoqueData.length} produtos disponíveis para venda</p>
              )}
              <button 
                onClick={() => {
                  setProductSearchTerm('a');
                  setTimeout(() => setProductSearchTerm(''), 100);
                }}
                className="mt-2 text-[#81059e] underline"
              >
                Ver todos os produtos
              </button>
            </div>
          </div>
        ) : (
          <>
            {/* Produtos organizados por categoria */}
            {Object.keys(groupedCart).map(category => (
              <div key={category} className="border-b border-gray-200 last:border-b-0">
                <div 
                  className={`p-3 cursor-pointer ${expandedGroup === category ? 'bg-purple-50' : 'bg-gray-50'}`}
                  onClick={() => setExpandedGroup(expandedGroup === category ? null : category)}
                >
                  <div className="flex justify-between items-center">
                    <div className="flex items-center gap-2 text-[#81059e] font-medium">
                      {getCategoryIcon(category)}
                      <span>{getCategoryName(category)}</span>
                      <span className="bg-[#81059e] text-white text-xs px-2 py-0.5 rounded-full">
                        {groupedCart[category].length}
                      </span>
                    </div>
                    <div className="flex items-center gap-3">
                      <span className="font-semibold text-[#81059e]">
                        {formatCurrency(calculateCategoryTotal(category))}
                      </span>
                      <svg 
                        className={`w-5 h-5 text-gray-500 transition-transform ${expandedGroup === category ? 'transform rotate-180' : ''}`} 
                        fill="none" 
                        stroke="currentColor" 
                        viewBox="0 0 24 24"
                      >
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M19 9l-7 7-7-7" />
                      </svg>
                    </div>
                  </div>
                </div>

                {/* Produtos da categoria (expandível) */}
                {expandedGroup === category && (
                  <div className="divide-y divide-gray-100">
                    {groupedCart[category].map(item => (
                      <div key={item.id} className="p-4 hover:bg-gray-50 transition-colors">
                        <div className="flex items-start gap-4">
                          {/* Imagem do produto (placeholder) */}
                          <div className="w-16 h-16 bg-gray-100 flex items-center justify-center rounded border border-gray-200 flex-shrink-0">
                            {getCategoryIcon(category)}
                          </div>
                          
                          {/* Detalhes do produto */}
                          <div className="flex-1">
                            <div className="flex justify-between">
                              <h3 className="font-medium text-gray-900">
                                {item.nome || item.info_geral?.nome || "Produto sem nome"}
                              </h3>
                              <button
                                onClick={(e) => {
                                  e.stopPropagation();
                                  removeFromCart(item.id);
                                }}
                                className="text-red-500 hover:text-red-700 p-1"
                                title="Remover produto"
                              >
                                <FiTrash2 size={16} />
                              </button>
                            </div>
                            
                            <div className="text-sm text-gray-500 mb-2">
                              Marca: {item.marca || item.info_geral?.marca || "N/A"} | 
                              Código: {item.codigo || item.info_geral?.codigo || "N/A"}
                            </div>
                            
                            {/* Informações adicionais (expansível) */}
                            {showDetails === item.id && (
                              <div className="mt-2 text-sm text-gray-600 bg-gray-50 p-3 rounded-lg border border-gray-200">
                                <div className="grid grid-cols-2 gap-2">
                                  <div>
                                    <span className="font-semibold">Categoria:</span> {getCategoryName(item.categoria)}
                                  </div>
                                  <div>
                                    <span className="font-semibold">Estoque disponível:</span> {item.quantidade || "N/A"}
                                  </div>
                                  {item.info_adicional && Object.entries(item.info_adicional).map(([key, value]) => (
                                    <div key={key}>
                                      <span className="font-semibold">{key}:</span> {value}
                                    </div>
                                  ))}
                                </div>
                              </div>
                            )}
                            
                            {/* Controles e preço */}
                            <div className="flex justify-between items-center mt-2">
                              <div className="flex items-center">
                                <button
                                  onClick={(e) => {
                                    e.stopPropagation();
                                    updateQuantity(item.id, item.quantity - 1);
                                  }}
                                  className="w-8 h-8 flex items-center justify-center border border-gray-300 rounded-l-md bg-gray-50 text-gray-600 hover:bg-gray-100"
                                  disabled={item.quantity <= 1}
                                >
                                  <FiMinus size={14} />
                                </button>
                                <input
                                  type="number"
                                  min="1"
                                  value={item.quantity}
                                  onChange={(e) => updateQuantity(item.id, parseInt(e.target.value) || 1)}
                                  className="w-12 h-8 border-t border-b border-gray-300 text-center text-sm focus:outline-none focus:ring-1 focus:ring-[#81059e]"
                                />
                                <button
                                  onClick={(e) => {
                                    e.stopPropagation();
                                    updateQuantity(item.id, item.quantity + 1);
                                  }}
                                  className="w-8 h-8 flex items-center justify-center border border-gray-300 rounded-r-md bg-gray-50 text-gray-600 hover:bg-gray-100"
                                >
                                  <FiPlus size={14} />
                                </button>
                                
                                <button
                                  onClick={(e) => {
                                    e.stopPropagation();
                                    setShowDetails(showDetails === item.id ? null : item.id);
                                  }}
                                  className="ml-2 p-1 text-gray-500 hover:text-[#81059e]"
                                  title="Mostrar detalhes"
                                >
                                  <FiInfo size={18} />
                                </button>
                              </div>
                              
                              <div className="text-right">
                                <div className="text-sm text-gray-500">
                                  {formatCurrency(item.preco || item.info_geral?.preco || 0)} x {item.quantity}
                                </div>
                                <div className="font-medium text-[#81059e]">
                                  {formatCurrency((item.preco || item.info_geral?.preco || 0) * item.quantity)}
                                </div>
                              </div>
                            </div>
                          </div>
                        </div>
                      </div>
                    ))}
                  </div>
                )}
              </div>
            ))}

            {/* Resumo do carrinho */}
            <div className="p-4 bg-gray-50 flex justify-between items-center">
              <div>
                <span className="text-sm text-gray-500">Total de itens: {cartItems.length}</span>
                <button 
                  onClick={clearCart}
                  className="ml-4 text-red-500 hover:text-red-700 text-sm flex items-center gap-1"
                >
                  <FiTrash2 size={14} /> Limpar
                </button>
              </div>
              <div className="text-right">
                <div className="text-xs text-gray-500">SUBTOTAL</div>
                <div className="text-lg font-semibold text-[#81059e]">
                  {formatCurrency(calculateTotal())}
                </div>
              </div>
            </div>
          </>
        )}
      </div>
    </div>
  );
};

export default CarrinhoCompras;