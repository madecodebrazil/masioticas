// components/CarrinhoCompras.js
import { useState, useEffect, useRef } from 'react';
import {
  FiSearch, FiPlus, FiMinus, FiTrash2, FiInfo,
  FiShoppingBag, FiBarChart2, FiTag, FiPackage,
  FiAlertCircle, FiLayers, FiPlusCircle, FiEye, FiCheckCircle
} from 'react-icons/fi';
import { collection, getDocs } from 'firebase/firestore';
import { firestore } from '@/lib/firebaseConfig';
import { useAuth } from '@/hooks/useAuth';

// Substituir a declaração do componente e a definição de props
const CarrinhoCompras = ({
  products = [],
  cartItems = [],
  setCartItems,
  selectedLoja,
  // Remova estas linhas que estão causando conflito com o useState interno
  // collections = [],
  // setCollections,
  updateCartValue
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
  const { userPermissions } = useAuth();

  // Mantenha o estado interno de collections
  const [collections, setCollections] = useState([
    {
      id: 1,
      name: "Coleção 1",
      items: [],
      requiresOS: true,
      generateOS: true,
      forceGenerateOS: false // Novo campo para forçar geração de OS mesmo sem kit completo
    }
  ]);
  const [activeCollection, setActiveCollection] = useState(1);
  const [showOSForm, setShowOSForm] = useState(false);
  const [generatedOS, setGeneratedOS] = useState([]);

  // Exponha as collections para o componente pai
  useEffect(() => {
    // Se o componente pai tiver uma função para obter as collections
    if (typeof updateCartValue === 'function') {
      // Você pode adicionar um segundo parâmetro na função updateCartValue
      // para passar as collections atualizadas para o componente pai
      const subtotal = cartItems.reduce((total, item) =>
        total + ((item.valor || item.preco || 0) * item.quantity), 0
      );
      updateCartValue(subtotal, collections);
    }
  }, [collections, cartItems, updateCartValue]);


  const addCollection = () => {
    const newCollectionId = collections.length + 1;
    setCollections([
      ...collections,
      {
        id: newCollectionId,
        name: `Coleção ${newCollectionId}`,
        items: [],
        requiresOS: true,
        generateOS: true,
        forceGenerateOS: false
      }
    ]);
    setActiveCollection(newCollectionId);
  };

  const toggleForceGenerateOS = (collectionId, value) => {
    const updatedCollections = collections.map(c => {
      if (c.id === collectionId) {
        return {
          ...c,
          forceGenerateOS: value
        };
      }
      return c;
    });
    setCollections(updatedCollections);
  };


  // Adicionar produto à coleção ativa
  const addToCollection = (product) => {
    if (!product) return;

    // Verificar o tipo de produto
    const productType = product.categoria;
    const isFrame = productType === 'armacoes';
    const isLens = productType === 'lentes';
    const isSunglass = productType === 'solares';

    // Se for óculos de sol, não precisa de OS
    const requiresOS = !isSunglass;

    // Encontrar a coleção ativa
    const collection = collections.find(c => c.id === activeCollection);

    // Verificar limitações da coleção
    if (requiresOS) {
      // Verificar se já existe uma armação na coleção
      const hasFrame = collection.items.some(item => item.categoria === 'armacoes');
      if (isFrame && hasFrame) {
        setError('Esta coleção já possui uma armação. Crie uma nova coleção para adicionar outra armação.');
        return false;
      }

      // Verificar se já existe uma lente na coleção
      const hasLens = collection.items.some(item => item.categoria === 'lentes');
      if (isLens && hasLens) {
        setError('Esta coleção já possui lentes. Crie uma nova coleção para adicionar outras lentes.');
        return false;
      }
    }

    // Adicionar o produto à coleção ativa
    const updatedCollections = collections.map(c => {
      if (c.id === activeCollection) {
        return {
          ...c,
          items: [...c.items, { ...product, quantity: newProductQty }],
          requiresOS: requiresOS
        };
      }
      return c;
    });

    setCollections(updatedCollections);
    return true;
  }


  // Adicione esta função para atualizar a opção de gerar OS
  const toggleGenerateOS = (collectionId, value) => {
    const updatedCollections = collections.map(c => {
      if (c.id === collectionId) {
        return {
          ...c,
          generateOS: value
        };
      }
      return c;
    });
    setCollections(updatedCollections);
  };


  // Função para remover item de uma coleção
  const removeFromCollection = (collectionId, productId, categoria) => {
    // Atualizar collections
    const updatedCollections = collections.map(c => {
      if (c.id === collectionId) {
        return {
          ...c,
          items: c.items.filter(item => !(item.id === productId && item.categoria === categoria))
        };
      }
      return c;
    });

    setCollections(updatedCollections);

    // Atualizar também o cartItems para manter compatibilidade
    setCartItems(cartItems.filter(item =>
      !(item.id === productId && item.categoria === categoria && item.collectionId === collectionId)
    ));
  };



  // Função para verificar quais coleções precisam de OS
  // Modificar a função getOSCollections para permitir OS em outros casos
  const getOSCollections = () => {
    return collections.filter(c => {
      // Verifica se tem armação E lentes (caso padrão)
      const hasFrameAndLens = c.items.some(item => item.categoria === 'armacoes') &&
        c.items.some(item => item.categoria === 'lentes');

      // Verifica se tem apenas armação ou apenas lentes mas com forceGenerateOS ativado
      const hasFrameOrLensAndForced = c.forceGenerateOS &&
        (c.items.some(item => item.categoria === 'armacoes') ||
          c.items.some(item => item.categoria === 'lentes'));

      // Gera OS se: 
      // 1. generateOS está ativo E
      // 2. Tem armação E lentes OU tem armação OU lentes com força ativada
      return c.generateOS && (hasFrameAndLens || hasFrameOrLensAndForced);
    });
  };


  // Buscar produtos do estoque
  useEffect(() => {
    if (userPermissions) {  // Verifique se userPermissions está disponível
      fetchProductsFromEstoque();
    }
  }, [selectedLoja, userPermissions]);

  // Buscar produtos do estoque no Firebase - CORRIGIDO
  const fetchProductsFromEstoque = async () => {
    try {
      setLoading(true);
      setError('');
      const produtosData = [];
      let debugInfo = {};

      // Determinar quais lojas o usuário tem acesso
      const lojasAcessiveis = userPermissions?.isAdmin || userPermissions?.acesso_total
        ? ['loja1', 'loja2']  // Admin ou acesso total vê todas as lojas
        : userPermissions?.lojas || []; // Usuário normal vê apenas suas lojas designadas

      // Se selectedLoja for especificado e o usuário tiver acesso, use apenas essa loja
      const lojasParaBuscar = selectedLoja && lojasAcessiveis.includes(selectedLoja)
        ? [selectedLoja]
        : lojasAcessiveis;

      // Buscar produtos para cada loja e categoria
      for (const loja of lojasParaBuscar) {
        for (const categoria of categorias) {
          try {
            // Caminho correto para o Firestore
            const produtosRef = collection(firestore, `estoque/${loja}/${categoria}`);

            // Registrar informações para debug
            debugInfo[`${loja}-${categoria}`] = {
              path: `estoque/${loja}/${categoria}`,
              attempt: true
            };

            const produtosSnapshot = await getDocs(produtosRef);
            debugInfo[`${loja}-${categoria}`].docsCount = produtosSnapshot.size;
            debugInfo[`${loja}-${categoria}`].success = true;

            // Mapear documentos para o formato correto
            produtosSnapshot.docs.forEach((docProduto) => {
              const produtoData = docProduto.data();
              produtosData.push({
                id: docProduto.id,
                ...produtoData,
                loja: loja, // Importante incluir a loja de origem
                categoria: categoria
              });
            });
          } catch (err) {
            debugInfo[`${loja}-${categoria}`] = {
              path: `estoque/${loja}/${categoria}`,
              error: err.message,
              success: false
            };
            console.error(`Erro ao buscar produtos da categoria ${categoria} na loja ${loja}:`, err);
          }
        }
      }

      // Definir as informações de debug
      setDebug(debugInfo);

      // Filtrar produtos com quantidade > 0
      const produtosComEstoque = produtosData.filter(p => parseInt(p.quantidade) > 0);

      if (produtosComEstoque.length === 0 && produtosData.length > 0) {
        setEstoqueData(produtosData); // Mostrar todos mesmo sem estoque
        setError('Aviso: Mostrando produtos sem estoque disponível');
      } else if (produtosComEstoque.length > 0) {
        setEstoqueData(produtosComEstoque);
      } else {
        setError(`Nenhum produto encontrado no estoque da loja ${selectedLoja}. Verifique a estrutura do banco de dados.`);
      }

    } catch (err) {
      console.error('Erro ao carregar os produtos do estoque:', err);
      setError(`Erro ao carregar os dados do estoque: ${err.message}`);
      setDebug({ error: err.message });
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
        total + ((item.valor || item.preco || 0) * item.quantity), 0
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
      // Busca nos produtos do estoque - CORRIGIDO para usar os mesmos campos que o componente de estoque
      const filtered = estoqueData.filter(product => {
        const titulo = (product.titulo || '').toLowerCase();
        const codigo = (product.codigo || '').toLowerCase();
        const marca = (product.marca || '').toLowerCase();
        const sku = (product.sku || '').toLowerCase();

        return titulo.includes(searchTermLower) ||
          codigo.includes(searchTermLower) ||
          marca.includes(searchTermLower) ||
          sku.includes(searchTermLower);
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
  // Adicionar produto ao carrinho
  const addToCart = (product) => {
    if (!product) return;

    // Verificar se tem estoque disponível (ignorar se estivermos mostrando produtos sem estoque)
    const quantidadeEstoque = parseInt(product.quantidade) || 0;
    if (quantidadeEstoque < newProductQty && error !== 'Aviso: Mostrando produtos sem estoque disponível') {
      setError(`Quantidade solicitada excede o estoque disponível (${quantidadeEstoque})`);
      setTimeout(() => setError(''), 3000);
      return;
    }

    // Simular loading ao adicionar
    setLoadingStates(prev => ({ ...prev, [product.id]: true }));

    setTimeout(() => {
      // Adicionar à coleção ativa
      const collection = collections.find(c => c.id === activeCollection);

      // Verificar o tipo de produto
      const productType = product.categoria;
      const isFrame = productType === 'armacoes';
      const isLens = productType === 'lentes';
      const isSunglass = productType === 'solares';

      // Se for óculos de sol, não precisa de OS
      const requiresOS = !isSunglass;

      // Verificar limitações da coleção
      if (requiresOS) {
        // Verificar se já existe uma armação na coleção
        const hasFrame = collection.items.some(item => item.categoria === 'armacoes');
        if (isFrame && hasFrame) {
          setError('Esta coleção já possui uma armação. Crie uma nova coleção para adicionar outra armação.');
          setTimeout(() => setError(''), 3000);
          return;
        }

        // Verificar se já existe uma lente na coleção
        const hasLens = collection.items.some(item => item.categoria === 'lentes');
        if (isLens && hasLens) {
          setError('Esta coleção já possui lentes. Crie uma nova coleção para adicionar outras lentes.');
          setTimeout(() => setError(''), 3000);
          return;
        }
      }

      // Adicionar o produto à coleção ativa
      const updatedCollections = collections.map(c => {
        if (c.id === activeCollection) {
          return {
            ...c,
            items: [...c.items, { ...product, quantity: newProductQty }],
            requiresOS: requiresOS
          };
        }
        return c;
      });

      setCollections(updatedCollections);

      // Verificar se o produto já está no carrinho
      const existingItem = cartItems.find(item => item.id === product.id && item.categoria === product.categoria);

      if (existingItem) {
        // Verificar se a nova quantidade total excede o estoque
        const newTotalQty = existingItem.quantity + newProductQty;
        if (quantidadeEstoque < newTotalQty && error !== 'Aviso: Mostrando produtos sem estoque disponível') {
          setError(`Quantidade total excede o estoque disponível (${quantidadeEstoque})`);
          setLoadingStates(prev => ({ ...prev, [product.id]: false }));
          setTimeout(() => setError(''), 3000);
          return;
        }

        // Aumentar a quantidade se já estiver no carrinho
        setCartItems(cartItems.map(item =>
          (item.id === product.id && item.categoria === product.categoria)
            ? { ...item, quantity: newTotalQty }
            : item
        ));
      } else {
        // Adicionar novo item ao carrinho - CORRIGIDO para usar a mesma estrutura do componente de estoque
        const produtoFormatado = {
          id: product.id,
          categoria: product.categoria,
          loja: product.loja || selectedLoja,
          titulo: product.titulo || '',
          nome: product.titulo || '', // Manter compatibilidade com ambos os campos
          codigo: product.codigo || '',
          marca: product.marca || '',
          sku: product.sku || '',
          valor: parseFloat(product.valor) || 0,
          preco: parseFloat(product.valor) || 0, // Manter compatibilidade com ambos os campos
          custo: parseFloat(product.custo) || 0,
          quantidade: product.quantidade,
          quantity: newProductQty, // Quantidade no carrinho
          collectionId: activeCollection // Associar à coleção ativa
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
  
// Modificação na função updateQuantity no CarrinhoCompras.js
const updateQuantity = (productId, categoria, newQuantity) => {
  if (newQuantity < 1) return;

  // Verificar se a quantidade não excede o estoque
  const product = estoqueData.find(p => p.id === productId && p.categoria === categoria);
  const stockQuantity = parseInt(product?.quantidade) || 0;

  if (newQuantity > stockQuantity && error !== 'Aviso: Mostrando produtos sem estoque disponível') {
    setError(`Quantidade máxima disponível: ${stockQuantity}`);
    setTimeout(() => setError(''), 3000);
    return;
  }

  // Atualizar a quantidade no carrinho
  setCartItems(cartItems.map(item =>
    (item.id === productId && item.categoria === categoria)
      ? { ...item, quantity: newQuantity }
      : item
  ));

  // IMPORTANTE: Atualizar também a quantidade na coleção correspondente
  const updatedCollections = collections.map(collection => {
    const updatedItems = collection.items.map(item => 
      (item.id === productId && item.categoria === categoria) 
        ? { ...item, quantity: newQuantity } 
        : item
    );
    
    return {
      ...collection,
      items: updatedItems
    };
  });
  
  setCollections(updatedCollections);
};

  // Remover produto do carrinho
  const removeFromCart = (productId, categoria) => {
    setCartItems(cartItems.filter(item => !(item.id === productId && item.categoria === categoria)));
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
      total + ((item.valor || item.preco || 0) * item.quantity), 0
    ) || 0;
  };

  // Calcular total do carrinho
  const calculateTotal = () => {
    return cartItems.reduce((total, item) =>
      total + ((item.valor || item.preco || 0) * item.quantity), 0
    );
  };

  // Determinar ícone da categoria
  const getCategoryIcon = (category) => {
    switch (category) {
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

      {/* Botões de seleção de loja - ADICIONE AQUI */}
      <div className="flex justify-between items-center p-2 bg-gray-50 border-b border-gray-200">
        <span className="text-sm text-gray-500">Selecionar loja:</span>
        <div className="flex gap-2">
          <button
            onClick={() => {
              console.log("Buscando produtos da loja1");
              const newSelectedLoja = "loja1";
              fetchProductsFromEstoque(newSelectedLoja);
            }}
            className="px-2 py-1 text-xs bg-purple-100 text-purple-700 rounded"
          >
            Loja 1
          </button>
          <button
            onClick={() => {
              console.log("Buscando produtos da loja2");
              const newSelectedLoja = "loja2";
              fetchProductsFromEstoque(newSelectedLoja);
            }}
            className="px-2 py-1 text-xs bg-purple-100 text-purple-700 rounded"
          >
            Loja 2
          </button>
        </div>
      </div>

      {/* Seleção de coleções */}
      <div className="p-3 bg-gray-50 border-b border-gray-200">
        <div className="flex justify-between items-center mb-2">
          <h3 className="text-sm font-medium text-gray-700 flex items-center">
            <FiLayers className="mr-2 text-[#81059e]" /> Coleções de Produtos
          </h3>
          <button
            onClick={addCollection}
            className="text-xs bg-[#81059e] text-white px-3 py-1 rounded flex items-center"
          >
            <FiPlusCircle className="mr-1" /> Nova Coleção
          </button>
        </div>

        <div className="flex flex-wrap gap-2">
          {collections.map(collection => (
            <button
              key={collection.id}
              onClick={() => setActiveCollection(collection.id)}
              className={`px-3 py-1 text-xs rounded-full flex items-center ${activeCollection === collection.id
                ? 'bg-[#81059e] text-white'
                : 'bg-gray-200 text-gray-700'
                }`}
            >
              {collection.name}
              {getOSCollections().some(c => c.id === collection.id) && (
                <FiCheckCircle className="ml-1 text-green-400" />
              )}
              <span className="ml-1 bg-gray-600 text-white text-xs px-1.5 rounded-full">
                {collection.items.length}
              </span>
            </button>
          ))}
        </div>
      </div>

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
              placeholder="Buscar produto por título, código ou marca"
              ref={produtoInputRef}
            />
            {filteredProducts.length > 0 && (
              <div className="absolute z-20 mt-1 w-[400px] bg-white shadow-xl rounded-md border border-gray-300 max-h-80 overflow-auto">
                <div className="sticky top-0 bg-[#81059e] text-white p-2 text-sm font-medium">
                  {filteredProducts.length} produtos encontrados
                </div>
                {filteredProducts.map(product => (
                  <div
                    key={`${product.id}-${product.categoria}`}
                    className="p-3 hover:bg-purple-50 cursor-pointer border-b last:border-b-0 transition-colors"
                    onClick={() => addToCart(product)}
                  >
                    <div className="flex justify-between items-center">
                      <div className="flex-1">
                        <div className="font-medium text-[#81059e]">
                          {product.titulo || "Produto sem título"}
                        </div>
                        <div className="flex justify-between text-sm">
                          <span className="text-gray-600">
                            {product.marca || "Sem marca"} |
                            Cód: {product.codigo || "N/A"}
                          </span>
                        </div>
                        <div className="text-xs text-gray-500 mt-1">
                          {getCategoryName(product.categoria)} - Estoque: {product.quantidade || 0}
                        </div>
                      </div>
                      <div className="flex flex-col items-end">
                        <span className="font-semibold text-[#81059e]">
                          {formatCurrency(product.valor || 0)}
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
            {/* Lista de Produtos no Carrinho Agrupados por Coleção */}
            {collections.map(collection => (
              <div
                key={collection.id}
                className={`p-3 cursor-pointer ${expandedGroup === `collection-${collection.id}`
                  ? 'bg-purple-50'
                  : 'bg-gray-50'
                  }`}
                onClick={() => setExpandedGroup(
                  expandedGroup === `collection-${collection.id}`
                    ? null
                    : `collection-${collection.id}`
                )}
              >
                <div className="flex justify-between items-center">
                  <div className="flex items-center gap-2 text-[#81059e] font-medium">
                    <FiLayers />
                    <span>{collection.name}</span>
                    <span className="bg-[#81059e] text-white text-xs px-2 py-0.5 rounded-full">
                      {collection.items.length}
                    </span>

                    {/* Controles para gerar OS, com novos checks para diferentes cenários */}
                    <div className="flex items-center ml-2" onClick={(e) => e.stopPropagation()}>
                      {/* Armação + Lentes = OS automática */}
                      {collection.items.some(item => item.categoria === 'armacoes') &&
                        collection.items.some(item => item.categoria === 'lentes') && (
                          <label className="text-xs bg-green-100 text-green-700 px-2 py-0.5 rounded-full flex items-center gap-1">
                            <input
                              type="checkbox"
                              checked={collection.generateOS === true}
                              onChange={(e) => toggleGenerateOS(collection.id, e.target.checked)}
                              className="form-checkbox h-3 w-3 text-[#81059e]"
                            />
                            Gerar OS (Kit completo)
                          </label>
                        )}

                      {/* Apenas armação ou apenas lentes = OS opcional */}
                      {((collection.items.some(item => item.categoria === 'armacoes') &&
                        !collection.items.some(item => item.categoria === 'lentes')) ||
                        (!collection.items.some(item => item.categoria === 'armacoes') &&
                          collection.items.some(item => item.categoria === 'lentes'))) && (
                          <label className="text-xs bg-yellow-100 text-yellow-700 px-2 py-0.5 rounded-full flex items-center gap-1 ml-1">
                            <input
                              type="checkbox"
                              checked={collection.forceGenerateOS === true}
                              onChange={(e) => toggleForceGenerateOS(collection.id, e.target.checked)}
                              className="form-checkbox h-3 w-3 text-[#81059e]"
                            />
                            Gerar OS (Kit incompleto)
                          </label>
                        )}

                      {/* Nem armação nem lentes */}
                      {!collection.items.some(item => item.categoria === 'armacoes') &&
                        !collection.items.some(item => item.categoria === 'lentes') && (
                          <span className="text-xs bg-gray-100 text-gray-600 px-2 py-0.5 rounded-full">
                            Sem produtos para OS
                          </span>
                        )}

                      {/* Óculos solares - Nunca gera OS */}
                      {collection.items.some(item => item.categoria === 'solares') &&
                        !collection.items.some(item => item.categoria === 'armacoes') &&
                        !collection.items.some(item => item.categoria === 'lentes') && (
                          <span className="text-xs bg-blue-100 text-blue-700 px-2 py-0.5 rounded-full">
                            Sem OS (Solar)
                          </span>
                        )}
                    </div>
                  </div>

                  <div className="flex items-center gap-3">
                    <span className="font-semibold text-[#81059e]">
                      {formatCurrency(
                        collection.items.reduce((total, item) =>
                          total + ((item.valor || item.preco || 0) * item.quantity), 0
                        )
                      )}
                    </span>
                    <svg
                      className={`w-5 h-5 text-gray-500 transition-transform ${expandedGroup === `collection-${collection.id}` ? 'transform rotate-180' : ''
                        }`}
                      fill="none"
                      stroke="currentColor"
                      viewBox="0 0 24 24"
                    >
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M19 9l-7 7-7-7" />
                    </svg>
                  </div>
                </div>
                {expandedGroup === `collection-${collection.id}` && (
                  <div className="divide-y divide-gray-100">
                    {collection.items.map(item => (
                      <div key={`${item.id}-${item.categoria}`} className="p-4 hover:bg-gray-50 transition-colors">
                        {/* Renderização do item como já feito anteriormente */}
                        <div className="flex items-start gap-4">
                          {/* Imagem do produto (placeholder) */}
                          <div className="w-16 h-16 bg-gray-100 flex items-center justify-center rounded border border-gray-200 flex-shrink-0">
                            {getCategoryIcon(item.categoria)}
                          </div>

                          {/* Detalhes do produto */}
                          <div className="flex-1">
                            <div className="flex justify-between">
                              <h3 className="font-medium text-gray-900">
                                {item.titulo || item.nome || "Produto sem título"}
                              </h3>
                              <button
                                onClick={(e) => {
                                  e.stopPropagation();
                                  removeFromCollection(collection.id, item.id, item.categoria);
                                }}
                                className="text-red-500 hover:text-red-700 p-1"
                                title="Remover produto"
                              >
                                <FiTrash2 size={16} />
                              </button>
                            </div>

                            <div className="text-sm text-gray-500 mb-2">
                              {item.categoria === 'armacoes' ? 'Armação' :
                                item.categoria === 'lentes' ? 'Lentes' :
                                  item.categoria === 'solares' ? 'Óculos Solar' : 'Outro Produto'}
                              {item.marca && ` | Marca: ${item.marca}`}
                              {item.codigo && ` | Código: ${item.codigo}`}
                            </div>

                            {/* Informações adicionais (expansível) */}
                            {showDetails === `${item.id}-${item.categoria}` && (
                              <div className="mt-2 text-sm text-gray-600 bg-gray-50 p-3 rounded-lg border border-gray-200">
                                <div className="grid grid-cols-2 gap-2">
                                  <div>
                                    <span className="font-semibold">Categoria:</span> {getCategoryName(item.categoria)}
                                  </div>
                                  <div>
                                    <span className="font-semibold">Estoque disponível:</span> {item.quantidade || "N/A"}
                                  </div>
                                  <div>
                                    <span className="font-semibold">Loja:</span> {item.loja === 'loja1' ? 'Loja 1' : 'Loja 2'}
                                  </div>
                                  <div>
                                    <span className="font-semibold">Valor de custo:</span> {formatCurrency(item.custo || 0)}
                                  </div>
                                  {item.sku && (
                                    <div>
                                      <span className="font-semibold">SKU:</span> {item.sku}
                                    </div>
                                  )}
                                </div>
                              </div>
                            )}

                            {/* Controles e preço */}
                            <div className="flex justify-between items-center mt-2">
                              <div className="flex items-center">
                                <button
                                  onClick={(e) => {
                                    e.stopPropagation();
                                    updateQuantity(item.id, item.categoria, item.quantity - 1);
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
                                  onChange={(e) => updateQuantity(item.id, item.categoria, parseInt(e.target.value) || 1)}
                                  className="w-12 h-8 border-t border-b border-gray-300 text-center text-sm focus:outline-none focus:ring-1 focus:ring-[#81059e]"
                                />
                                <button
                                  onClick={(e) => {
                                    e.stopPropagation();
                                    updateQuantity(item.id, item.categoria, item.quantity + 1);
                                  }}
                                  className="w-8 h-8 flex items-center justify-center border border-gray-300 rounded-r-md bg-gray-50 text-gray-600 hover:bg-gray-100"
                                >
                                  <FiPlus size={14} />
                                </button>

                                <button
                                  onClick={(e) => {
                                    e.stopPropagation();
                                    setShowDetails(showDetails === `${item.id}-${item.categoria}` ? null : `${item.id}-${item.categoria}`);
                                  }}
                                  className="ml-2 p-1 text-gray-500 hover:text-[#81059e]"
                                  title="Mostrar detalhes"
                                >
                                  <FiInfo size={18} />
                                </button>
                              </div>

                              <div className="text-right">
                                <div className="text-sm text-gray-500">
                                  {formatCurrency(item.valor || item.preco || 0)} x {item.quantity}
                                </div>
                                <div className="font-medium text-[#81059e]">
                                  {formatCurrency((item.valor || item.preco || 0) * item.quantity)}
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
    </div >
  );
};

export default CarrinhoCompras;