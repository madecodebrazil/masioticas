// src/components/CarrinhoCompras.js
import React, { useState, useEffect, useRef } from 'react';
import { FiTrash2, FiPlus, FiMinus, FiSearch, FiLayers, FiShoppingBag, FiPlusCircle } from 'react-icons/fi';
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';
import { faQrCode } from '@fortawesome/free-solid-svg-icons';
import { collection, getDocs } from 'firebase/firestore';
import { firestore } from '@/lib/firebaseConfig';
import { useAuth } from '@/hooks/useAuth';
import { Html5Qrcode } from 'html5-qrcode';

const QrCodeScanner = ({ onScan, onClose }) => {
  const qrRef = useRef(null);
  const [scanner, setScanner] = useState(null);
  const [error, setError] = useState(null);

  useEffect(() => {
    if (!qrRef.current) return;

    // Gerar um ID único para o elemento
    const scannerId = "qr-reader-" + Math.random().toString(36).substring(2, 9);
    qrRef.current.id = scannerId;

    // Inicializar o scanner
    const html5QrCode = new Html5Qrcode(scannerId);
    setScanner(html5QrCode);

    const config = { fps: 10, qrbox: { width: 250, height: 250 } };

    // Iniciar a câmera com melhor tratamento de erros
    html5QrCode.start(
      { facingMode: "environment" },
      config,
      (decodedText) => {
        console.log("QR Code detectado:", decodedText);
        onScan(decodedText);
        html5QrCode.stop().catch(e => console.error("Erro ao parar scanner:", e));
        onClose();
      },
      (errorMessage) => {
        // Ignorar erros de leitura normal - são esperados enquanto não há QR code
        console.log("Erro de leitura QR:", errorMessage);
      }
    ).catch(err => {
      console.error("Erro ao iniciar scanner:", err);
      setError(`Erro ao iniciar câmera: ${err.message}`);
    });

    // Cleanup function
    return () => {
      if (html5QrCode && html5QrCode.isScanning) {
        html5QrCode.stop().catch(e => console.error("Erro ao parar scanner:", e));
      }
    };
  }, [onScan, onClose]);

  return (
    <div className="p-3">
      {error ? (
        <div className="text-red-500 text-center p-3 border border-red-300 rounded bg-red-50">
          {error}
          <button
            onClick={onClose}
            className="block mx-auto mt-2 bg-red-500 text-white px-3 py-1 rounded"
          >
            Fechar
          </button>
        </div>
      ) : (
        <>
          <div
            ref={qrRef}
            style={{ width: '100%', maxWidth: 300, height: 300, margin: '0 auto' }}
          />
          <p className="text-sm text-center mt-2 text-gray-600">
            Posicione o código QR no centro da câmera
          </p>
        </>
      )}
    </div>
  );
};

const CarrinhoCompras = ({
  cartItems = [],
  setCartItems,
  selectedLoja,
  formatCurrency,
  calculateTotal,
  updateCartValue,
  updateCollections,
  setActiveCollection
}) => {
  // Estados para a busca e controle de produtos
  const [productSearchTerm, setProductSearchTerm] = useState('');
  const [filteredProducts, setFilteredProducts] = useState([]);
  const [newProductQty, setNewProductQty] = useState(1);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [estoqueData, setEstoqueData] = useState([]);
  const [showQrScanner, setShowQrScanner] = useState(false);
  const searchInputRef = useRef(null);

  // Estados para coleções
  const [collections, setCollections] = useState([
    {
      id: 1,
      name: "Coleção 1",
      items: [],
    }
  ]);
  const [activeCollectionId, setActiveCollectionId] = useState(1);

  const { userPermissions } = useAuth();
  const categorias = ['armacoes', 'lentes', 'solares'];
  const [showQr, setShowQr] = useState(false);

  // Notificar o componente pai quando as coleções são alteradas
  useEffect(() => {
    if (typeof updateCollections === 'function') {
      updateCollections(collections);
    }
  }, [collections, updateCollections]);

  // Notificar o componente pai quando a coleção ativa muda
  useEffect(() => {
    if (typeof setActiveCollection === 'function') {
      setActiveCollection(activeCollectionId);
    }
  }, [activeCollectionId, setActiveCollection]);

  // Buscar produtos do estoque quando a loja é selecionada
  useEffect(() => {
    if (selectedLoja && userPermissions) {
      fetchProductsFromEstoque();
    }
  }, [selectedLoja, userPermissions]);

  // Atualizar o componente pai quando o carrinho mudar
  useEffect(() => {
    if (typeof updateCartValue === 'function') {
      const subtotal = cartItems.reduce((total, item) =>
        total + ((item.valor || item.preco || 0) * item.quantity), 0
      );
      updateCartValue(subtotal, collections);
    }
  }, [cartItems, collections, updateCartValue]);

  // Buscar produtos do estoque no Firebase
  const fetchProductsFromEstoque = async () => {
    try {
      setLoading(true);
      setError('');
      const produtosData = [];

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
            const produtosRef = collection(firestore, `estoque/${loja}/${categoria}`);
            const produtosSnapshot = await getDocs(produtosRef);

            // Mapear documentos para o formato correto
            produtosSnapshot.docs.forEach((docProduto) => {
              const produtoData = docProduto.data();
              produtosData.push({
                id: docProduto.id,
                ...produtoData,
                loja: loja,
                categoria: categoria
              });
            });
          } catch (err) {
            console.error(`Erro ao buscar produtos da categoria ${categoria} na loja ${loja}:`, err);
          }
        }
      }

      // Filtrar produtos com quantidade > 0
      const produtosComEstoque = produtosData.filter(p => parseInt(p.quantidade) > 0);

      if (produtosComEstoque.length === 0 && produtosData.length > 0) {
        setEstoqueData(produtosData); // Mostrar todos mesmo sem estoque
        setError('Aviso: Mostrando produtos sem estoque disponível');
      } else if (produtosComEstoque.length > 0) {
        setEstoqueData(produtosComEstoque);
      } else {
        setError(`Nenhum produto encontrado no estoque.`);
      }

    } catch (err) {
      console.error('Erro ao carregar os produtos do estoque:', err);
      setError(`Erro ao carregar os dados do estoque: ${err.message}`);
    } finally {
      setLoading(false);
    }
  };

  // Filtrar produtos com base no termo de busca
  useEffect(() => {
    if (productSearchTerm.trim() === '') {
      setFilteredProducts([]);
    } else {
      const searchTermLower = productSearchTerm.toLowerCase();
      // Busca nos produtos do estoque
      const filtered = estoqueData.filter(product => {
        const nome = (product.nome || '').toLowerCase();
        const codigo = (product.codigo || '').toLowerCase();
        const marca = (product.marca || '').toLowerCase();
        const sku = (product.sku || '').toLowerCase();

        return nome.includes(searchTermLower) ||
          codigo.includes(searchTermLower) ||
          marca.includes(searchTermLower) ||
          sku.includes(searchTermLower);
      });
      setFilteredProducts(filtered);
    }
  }, [productSearchTerm, estoqueData]);

  // Formatar para moeda brasileira (R$)
  const formatCurrencyValue = (value) => {
    if (typeof formatCurrency === 'function') {
      return formatCurrency(value);
    } else {
      return new Intl.NumberFormat('pt-BR', {
        style: 'currency',
        currency: 'BRL'
      }).format(value || 0);
    }
  };

  // Função para verificar se um produto precisa de OS
  const precisaDeOS = (item) => {
    if (!item || !item.categoria) return false;

    const categoriasComOS = ['armacoes', 'lentes', 'solares'];

    if (item.categoria === 'solares') {
      return item.info_geral?.tem_grau || item.info_adicional?.tem_grau || false;
    }

    return categoriasComOS.includes(item.categoria);
  };

  // Adicionar uma nova coleção
  const addCollection = () => {
    const newCollectionId = collections.length + 1;
    setCollections([
      ...collections,
      {
        id: newCollectionId,
        name: `Coleção ${newCollectionId}`,
        items: []
      }
    ]);
    setActiveCollectionId(newCollectionId);
    setCartItems([]);
  };

  // Modificar setActiveCollection para filtrar cartItems por coleção ativa
  const handleSetActiveCollection = (collectionId) => {
    setActiveCollectionId(collectionId);

    const activeCollectionItems = collections
      .find(c => c.id === collectionId)?.items || [];

    const cartItemsForCollection = activeCollectionItems.map(item => ({
      ...item,
      collectionId: collectionId
    }));

    setCartItems(cartItemsForCollection);
  };

  // Remover uma coleção
  const removeCollection = (collectionId) => {
    // Não permitir remover a última coleção
    if (collections.length <= 1) return;

    // Se a coleção sendo removida for a ativa, mudar para a primeira coleção
    if (collectionId === activeCollectionId) {
      setActiveCollectionId(collections[0].id);
    }

    // Remover a coleção
    const updatedCollections = collections.filter(c => c.id !== collectionId);
    setCollections(updatedCollections);

    // Remover itens do carrinho que pertenciam à coleção removida
    setCartItems(cartItems.filter(item => item.collectionId !== collectionId));
  };

  // Adicionar produto ao carrinho
  const addToCart = (product) => {
    if (!product) return;

    // Verificar se tem estoque disponível
    const quantidadeEstoque = parseInt(product.quantidade) || 0;
    if (quantidadeEstoque < newProductQty && error !== 'Aviso: Mostrando produtos sem estoque disponível') {
      setError(`Quantidade solicitada excede o estoque disponível (${quantidadeEstoque})`);
      setTimeout(() => setError(''), 3000);
      return;
    }

    // Adicionar à coleção ativa
    const updatedCollections = collections.map(c => {
      if (c.id === activeCollectionId) {
        // Verificar se o produto já existe na coleção
        const existingItemIndex = c.items.findIndex(item =>
          item.id === product.id && item.categoria === product.categoria
        );

        if (existingItemIndex >= 0) {
          // Atualizar a quantidade do item existente
          const updatedItems = [...c.items];
          updatedItems[existingItemIndex].quantity += newProductQty;
          return {
            ...c,
            items: updatedItems
          };
        } else {
          // Adicionar novo item à coleção
          return {
            ...c,
            items: [...c.items, {
              ...product,
              quantity: newProductQty,
              collectionId: activeCollectionId
            }]
          };
        }
      }
      return c;
    });

    setCollections(updatedCollections);

    // Verificar se o produto já está no carrinho
    const existingItemIndex = cartItems.findIndex(item =>
      item.id === product.id && item.categoria === product.categoria
    );

    if (existingItemIndex >= 0) {
      // Atualizar quantidade do item existente
      const updatedCartItems = [...cartItems];
      updatedCartItems[existingItemIndex].quantity += newProductQty;
      setCartItems(updatedCartItems);
    } else {
      // Adicionar novo item ao carrinho
      const produtoFormatado = {
        id: product.id,
        categoria: product.categoria,
        loja: product.loja || selectedLoja,
        nome: product.nome || '',
        codigo: product.codigo || '',
        marca: product.marca || '',
        sku: product.sku || '',
        valor: parseFloat(product.valor) || 0,
        preco: parseFloat(product.valor) || 0, // Manter compatibilidade com ambos os campos
        quantity: newProductQty,
        collectionId: activeCollectionId
      };

      setCartItems([...cartItems, produtoFormatado]);
    }

    // Limpar campos
    setProductSearchTerm('');
    setFilteredProducts([]);
    setNewProductQty(1);

    if (searchInputRef.current) {
      searchInputRef.current.focus();
    }
  };

  // Atualizar quantidade no carrinho
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

    // Atualizar também a quantidade na coleção correspondente
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
    // Remover do carrinho principal
    setCartItems(cartItems.filter(item =>
      !(item.id === productId && item.categoria === categoria)
    ));

    // Remover da coleção
    const updatedCollections = collections.map(collection => ({
      ...collection,
      items: collection.items.filter(item =>
        !(item.id === productId && item.categoria === categoria)
      )
    }));

    setCollections(updatedCollections);
  };

  // Calcular total do carrinho
  const getTotal = () => {
    if (typeof calculateTotal === 'function') {
      return calculateTotal();
    } else {
      return cartItems.reduce((acc, item) => acc + (item.preco || item.valor || 0) * (item.quantity || 1), 0);
    }
  };

  // Função para processar o QR code lido
  const handleScan = (data) => {
    if (data) {
      console.log(`QR Code lido: ${data}`);
      console.log('Produtos disponíveis:', estoqueData);

      // Limpar o código de caracteres especiais e espaços
      const cleanedData = data.trim().toLowerCase();

      // Tentar encontrar o produto usando diferentes campos
      const foundProduct = estoqueData.find(product => {
        // Verificar se o produto tem os campos necessários
        if (!product) return false;

        // Criar um array de campos para verificar
        const fieldsToCheck = [
          product.codigo,
          product.sku,
          product.id,
          product.titulo,
          product.nome
        ].filter(Boolean); // Remove valores undefined/null

        // Verificar se algum dos campos contém o código lido
        return fieldsToCheck.some(field =>
          field.toString().toLowerCase().includes(cleanedData)
        );
      });

      if (foundProduct) {
        console.log('Produto encontrado:', foundProduct);
        addToCart(foundProduct);
        setShowQrScanner(false);
      } else {
        console.log('Produto não encontrado. Código:', cleanedData);
        setError(`Produto com código "${cleanedData}" não encontrado no estoque`);
        setTimeout(() => setError(''), 3000);
      }
    }
  };

  return (
    <div className="border-2 border-gray-200 rounded-sm bg-white overflow-hidden">
      {/* Mensagem de erro */}
      {error && (
        <div className={`p-2 text-center ${error.includes('Aviso') ? 'bg-yellow-100 text-yellow-700' : 'bg-red-100 text-red-700'} flex items-center justify-center`}>
          {error}
        </div>
      )}

      {/* Seleção de coleções */}
      <div className="p-3 bg-gray-50 border-b border-gray-200">
        <div className="flex justify-between items-center mb-2">
          <h3 className="text-base font-medium text-gray-700 flex items-center">
            <FiLayers className="mr-2 text-[#81059e]" /> Coleções de Produtos
          </h3>
          <button
            onClick={addCollection}
            className="text-xs bg-[#81059e] opacity-70 text-white px-3 py-1 rounded-sm flex items-center transition-colors"
          >
            <FiPlusCircle className="mr-1 text-lg" /> <p className='text-sm'>Nova Coleção</p>
          </button>
        </div>

        <div className="flex flex-wrap gap-2">
          {collections.map(collection => (
            <div key={collection.id} className="relative group">
              <button
                onClick={() => handleSetActiveCollection(collection.id)}
                className={`px-4 py-2 text-xs rounded-sm flex items-center transition-all duration-200 ${activeCollectionId === collection.id
                  ? 'bg-[#81059e] text-white shadow-md'
                  : 'bg-gray-200 text-gray-700 hover:bg-gray-300'
                  }`}
              >
                {collection.name}
                <span className={`ml-1 px-1.5 rounded-full text-xs ${activeCollectionId === collection.id
                  ? 'bg-white text-[#81059e]'
                  : 'bg-gray-600 text-white'
                  }`}>
                  {collection.items.length}
                </span>
                {collection.items && collection.items.some(item => precisaDeOS(item)) && (
                  <span className="ml-1 w-2 h-2 rounded-full bg-purple-500"></span>
                )}
              </button>
              {collections.length > 1 && (
                <button
                  onClick={(e) => {
                    e.stopPropagation();
                    removeCollection(collection.id);
                  }}
                  className="absolute -top-1 -right-1 bg-red-500 text-white rounded-full w-4 h-4 flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity duration-200 hover:bg-red-600"
                >
                  ×
                </button>
              )}
            </div>
          ))}
        </div>
      </div>

      {/* Barra de busca e controles */}
      <div className="p-3 flex flex-col gap-2">
        <div className="flex gap-2">
          {/* Input de busca */}
          <div className="relative flex-1">
            <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
              <FiSearch className="text-gray-400" />
            </div>
            <input
              type="text"
              value={productSearchTerm}
              onChange={(e) => setProductSearchTerm(e.target.value)}
              className="border-2 rounded-md pl-10 p-2 w-full"
              placeholder="Buscar produtos..."
              ref={searchInputRef}
            />
          </div>

          {/* Botão de QR Code */}
          <button
            onClick={() => setShowQrScanner(!showQrScanner)}
            className="p-2 bg-[#81059e] text-white rounded-sm flex items-center gap-1"
            type="button"
          >
            <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 448 512" className="w-6 h-6 fill-current">
              <path d="M0 80C0 53.5 21.5 32 48 32l96 0c26.5 0 48 21.5 48 48l0 96c0 26.5-21.5 48-48 48l-96 0c-26.5 0-48-21.5-48-48L0 80zM64 96l0 64 64 0 0-64L64 96zM0 336c0-26.5 21.5-48 48-48l96 0c26.5 0 48 21.5 48 48l0 96c0 26.5-21.5 48-48 48l-96 0c-26.5 0-48-21.5-48-48l0-96zm64 16l0 64 64 0 0-64-64 0zM304 32l96 0c26.5 0 48 21.5 48 48l0 96c0 26.5-21.5 48-48 48l-96 0c-26.5 0-48-21.5-48-48l0-96c0-26.5 21.5-48 48-48zm80 64l-64 0 0 64 64 0 0-64zM256 304c0-8.8 7.2-16 16-16l64 0c8.8 0 16 7.2 16 16s7.2 16 16 16l32 0c8.8 0 16-7.2 16-16s7.2-16 16-16s16 7.2 16 16l0 96c0 8.8-7.2 16-16 16l-64 0c-8.8 0-16-7.2-16-16s-7.2-16-16-16s-16 7.2-16 16l0 64c0 8.8-7.2 16-16 16l-32 0c-8.8 0-16-7.2-16-16l0-160zM368 480a16 16 0 1 1 0-32 16 16 0 1 1 0 32zm64 0a16 16 0 1 1 0-32 16 16 0 1 1 0 32z" />
            </svg>
            QR
          </button>
        </div>

        {/* Exibição dos produtos filtrados */}
        {productSearchTerm && filteredProducts.length > 0 && (
          <div className="mt-2 max-h-60 overflow-y-auto border rounded-md">
            {filteredProducts.map((product) => (
              <div
                key={`${product.id}-${product.categoria}`}
                className="p-3 border-b last:border-b-0 hover:bg-gray-50 cursor-pointer"
                onClick={() => addToCart(product)}
              >
                <div className="font-medium">{product.nome || "Produto sem nome"}</div>
                <div className="text-sm text-gray-600">
                  {formatCurrencyValue(product.valor || 0)} - Estoque: {product.quantidade}
                </div>
                <div className="text-xs text-gray-500">
                  {product.codigo && `Código: ${product.codigo}`} {product.marca && `- Marca: ${product.marca}`}
                  <span className="ml-2 inline-block px-2 py-0.5 rounded-full bg-purple-100 text-purple-700">
                    {product.categoria === 'armacoes' ? 'Armação' :
                      product.categoria === 'lentes' ? 'Lente' :
                        product.categoria === 'solares' ? 'Óculos Solar' :
                          'Categoria não definida'}
                  </span>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>

      {/* Scanner de QR Code */}
      {showQrScanner && (
        <div className="p-3 border-t border-gray-200">
          <div className="flex justify-between items-center mb-2">
            <h3 className="text-sm font-medium text-gray-700">Scanner de QR Code</h3>
            <button
              onClick={() => setShowQrScanner(false)}
              className="text-gray-500 hover:text-gray-700"
            >
              ×
            </button>
          </div>
          <QrCodeScanner
            onScan={handleScan}
            onClose={() => setShowQrScanner(false)}
          />
        </div>
      )}

      {/* Lista de produtos */}
      <div className="p-3">
        {loading ? (
          <div className="text-center p-5">
            <svg className="animate-spin h-8 w-8 mx-auto text-[#81059e]" viewBox="0 0 24 24">
              <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" fill="none" />
              <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z" />
            </svg>
            <p className="mt-2 text-gray-600">Carregando produtos...</p>
          </div>
        ) : cartItems.length === 0 ? (
          <div className="text-center p-5">
            <div className="bg-purple-100 rounded-full w-12 h-12 flex items-center justify-center mx-auto mb-3">
              <FiShoppingBag className="text-[#81059e] text-xl" />
            </div>
            <h3 className="text-lg font-medium">Seu carrinho está vazio</h3>
            <p className="text-gray-500 mb-3">Busque produtos para adicionar à venda</p>
            <p className="text-sm text-gray-500">{estoqueData.length} produtos disponíveis para venda</p>
            <button
              onClick={() => setProductSearchTerm('a')}
              className="text-[#81059e] text-sm underline"
            >
              Ver todos os produtos
            </button>
          </div>
        ) : (
          <div className="space-y-3">
            {cartItems.map(item => (
              <div
                key={`${item.id}-${item.categoria}`}
                className={`p-3 border rounded-md flex justify-between items-center ${precisaDeOS(item) ? 'border-purple-200 bg-purple-50' : ''
                  }`}
              >
                <div className="flex-1">
                  <div className="font-medium flex items-center">
                    {item.titulo || item.nome || "Produto sem título"}
                    {precisaDeOS(item) && (
                      <span className="ml-2 text-xs bg-purple-100 text-purple-700 px-2 py-0.5 rounded-full">
                        OS
                      </span>
                    )}
                  </div>
                  <div className="text-sm text-gray-600">
                    {formatCurrencyValue(item.valor || item.preco || 0)} x {item.quantity}
                  </div>
                </div>

                <div className="flex items-center gap-2">
                  <button
                    onClick={() => updateQuantity(item.id, item.categoria, item.quantity - 1)}
                    className="p-1 text-gray-500 hover:text-gray-700"
                  >
                    <FiMinus />
                  </button>
                  <span className="w-6 text-center">{item.quantity}</span>
                  <button
                    onClick={() => updateQuantity(item.id, item.categoria, item.quantity + 1)}
                    className="p-1 text-gray-500 hover:text-gray-700"
                  >
                    <FiPlus />
                  </button>
                  <button
                    onClick={() => removeFromCart(item.id, item.categoria)}
                    className="p-1 text-red-500 hover:text-red-700"
                  >
                    <FiTrash2 />
                  </button>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>

      {/* Total do carrinho */}
      {cartItems.length > 0 && (
        <div className="p-3 bg-gray-50 border-t border-gray-200">
          <div className="flex justify-between items-center mb-2">
            <span className="font-medium">Total:</span>
            <span className="font-medium text-lg text-[#81059e]">
              {formatCurrencyValue(getTotal())}
            </span>
          </div>

          {/* Legenda */}
          <div className="mt-2 text-xs text-gray-600 flex items-center gap-1">
            <span className="px-2 py-0.5 bg-purple-100 text-purple-700 rounded-full">OS</span>
            <span>= Produto requer Ordem de Serviço</span>
          </div>
        </div>
      )}
    </div>
  );
};

export default CarrinhoCompras;