"use client";

import React, { useState, useEffect } from "react";
import {
  collection,
  getDocs,
  doc,
  getDoc,
  setDoc,
  updateDoc,
  increment,
} from "firebase/firestore";
import { firestore } from "@/lib/firebaseConfig";
import Layout from "@/components/Layout";
import { FaShoppingCart } from "react-icons/fa";
import Link from "next/link";

/**
 * Componente para exibir e gerenciar um item do carrinho
 */
const CartItem = ({
  item,
  index,
  handleQuantityChange,
  handleRemoveFromCart,
  handleDiscountChange,
  generateQuantityOptions,
}) => {
  const [localDiscount, setLocalDiscount] = useState(item.desconto || 0);
  const [discountType, setDiscountType] = useState(item.discountType || "R$");

  const handleLocalDiscountChange = (e) => {
    setLocalDiscount(e.target.value);
  };

  const handleDiscountTypeChange = (e) => {
    setDiscountType(e.target.value);
  };

  const handleDiscountBlur = async () => {
    await handleDiscountChange(item, index, parseFloat(localDiscount) || 0, discountType);
  };

  const originalTotal = parseFloat(item.valorOriginal || item.valor) * item.quantidade;
  const finalPrice =
    discountType === "%"
      ? originalTotal - (originalTotal * (parseFloat(localDiscount) || 0)) / 100
      : originalTotal - (parseFloat(localDiscount) || 0);

  return (
    <li className="flex items-center space-x-4 p-4 border-b border-gray-200">
      <img
        src={item.imagem || "/images/default.png"}
        alt={item.produto}
        className="w-16 h-16 object-cover rounded-md"
      />
      <div className="flex-1">
        <p className="font-bold text-gray-800">{item.produto}</p>
        <p className="text-gray-600">
          <strong>Valor Original:</strong> R${" "}
          {parseFloat(originalTotal / item.quantidade).toFixed(2)}
        </p>
        <div className="mt-2">
          <label className="block font-bold text-gray-700 mb-2">Quantidade</label>
          <select
            className="border border-gray-300 px-4 py-2 rounded-lg w-24 text-black"
            value={item.quantidade}
            onChange={(e) => handleQuantityChange(item, index, parseInt(e.target.value))}
          >
            {generateQuantityOptions(item.quantidade, item.currentStock).map((option) => (
              <option key={option} value={option}>
                {option}
              </option>
            ))}
          </select>
        </div>

        <div className="mt-2">
          <label className="block font-bold text-gray-700 mb-2">Desconto</label>
          <div className="flex items-center space-x-2">
            <input
              type="number"
              className="border border-gray-300 px-4 py-2 rounded-lg w-24 text-black"
              value={localDiscount}
              onChange={handleLocalDiscountChange}
              onBlur={handleDiscountBlur}
              step="0.01"
              min="0"
            />
            <select
              value={discountType}
              onChange={handleDiscountTypeChange}
              className="border border-gray-300 px-2 py-2 rounded-lg text-black"
            >
              <option value="R$">R$</option>
              <option value="%">%</option>
            </select>
          </div>
        </div>

        <p className="text-gray-600 mt-2">
          <strong>Valor com Desconto:</strong> R${finalPrice.toFixed(2)}
        </p>

        <button onClick={() => handleRemoveFromCart(item, index)} className="text-red-500 mt-2">
          Remover
        </button>
      </div>
    </li>
  );
};

const Catalogo = () => {
  const [filteredProducts, setFilteredProducts] = useState([]);
  const [searchTerm, setSearchTerm] = useState("");
  const [selectedLoja, setSelectedLoja] = useState("ambas");
  const [products, setProducts] = useState([]);
  const [selectedProduct, setSelectedProduct] = useState(null);

  // Campo único para busca de cliente (CPF ou nome)
  const [customerSearchTerm, setCustomerSearchTerm] = useState("");

  const [cartItems, setCartItems] = useState([]);
  const [isAddingToCart, setIsAddingToCart] = useState(false);
  const [showCartDropdown, setShowCartDropdown] = useState(false);
  const [customerName, setCustomerName] = useState("");
  const [cpf, setCpf] = useState("");
  const [os, setOs] = useState('');
  const [clientName, setClientName] = useState('');

  const [selectedValues, setSelectedValues] = useState({
    esfericoOde: "",
    esfericoOpara: "",
    esfericoOee: "",
    esfericoOepara: "",
    cilindroOde: "",
    cilindroOpara: "",
    cilindroOee: "",
    cilindroOepara: "",
    adicaoDe: "",
    adicaoPara: "",

    // Campos para desconto no modal do produto
    localDiscount: 0,
    discountType: "R$",
    esfericoOptions: [],
    cilindroOptions: [],
    adicaoOptions: [],
  });

  const [selectedLojaForSale, setSelectedLojaForSale] = useState("");

  const filterProducts = () => {
    const filtered = products.filter((product) => {
      const searchTermLower = searchTerm.toLowerCase();
      const productData = `
        ${product.produto}
        ${product.genero || ""}
        ${product.marca || ""}
        ${product.familia || ""}
        ${product.categoria || ""}
      `.toLowerCase();

      return productData.includes(searchTermLower);
    });
    setFilteredProducts(filtered);
  };

  useEffect(() => {
    filterProducts();
  }, [searchTerm, products]);

  const getCollectionName = (categoria, loja) => {
    if (categoria === "armação") return `${loja}_armacoes`;
    if (categoria === "lentes") return `${loja}_lentes`;
    if (categoria === "solar") return `${loja}_solares`;
    return null;
  };

  const fetchCartItems = async () => {
    try {
      let matchingConsumer = null;

      const consumersSnapshot = await getDocs(collection(firestore, "consumers"));
      const isCPF = /^\d{11}$/.test(customerSearchTerm);

      if (isCPF) {
        matchingConsumer = consumersSnapshot.docs.find(
          (doc) => doc.data().cpf === customerSearchTerm
        );
      } else {
        matchingConsumer = consumersSnapshot.docs.find((doc) =>
          doc.data().nome.toLowerCase().includes(customerSearchTerm.toLowerCase())
        );
      }

      if (!matchingConsumer) {
        alert("Cliente não encontrado.");
        setCustomerName("");
        setCpf("");
        setCartItems([]);
        return;
      }

      const consumerData = matchingConsumer.data();
      setCustomerName(consumerData.nome);
      setCpf(consumerData.cpf);

      const cartRef = doc(firestore, "cart", consumerData.cpf);
      const cartSnap = await getDoc(cartRef);

      if (cartSnap.exists()) {
        const items = cartSnap.data().items || [];

        const updatedItems = await Promise.all(
          items.map(async (item) => {
            const collectionName = getCollectionName(item.categoria, item.loja);
            const productRef = doc(firestore, collectionName, item.id);
            const productSnap = await getDoc(productRef);

            if (productSnap.exists()) {
              const currentStock = productSnap.data().quantidade;
              return {
                ...item,
                currentStock,
                valorOriginal: item.valor,
              };
            } else {
              return {
                ...item,
                currentStock: 0,
                valorOriginal: item.valor,
              };
            }
          })
        );

        setCartItems(updatedItems);
      } else {
        setCartItems([]);
      }
    } catch (error) {
      console.error("Erro ao buscar itens do carrinho:", error);
    }
  };

  const generateIntervalOptions = (start, end) => {
    let options = [];
    const startNum = parseFloat(start);
    const endNum = parseFloat(end);

    if (isNaN(startNum) || isNaN(endNum)) {
      console.error("Valores não são números válidos");
      return options;
    }

    for (let i = startNum; i <= endNum; i += 0.25) {
      options.push(i.toFixed(2));
    }

    return options;
  };

  const fetchProducts = async () => {
    try {
      const [loja1, loja2] = await Promise.all([
        fetchProductsFromLoja("loja1"),
        fetchProductsFromLoja("loja2"),
      ]);
      setProducts([...loja1, ...loja2]);
    } catch (error) {
      console.error("Erro ao buscar produtos:", error);
    }
  };

  const fetchProductsFromLoja = async (loja) => {
    const categorias = ["armacoes", "lentes", "solares"];
    let lojaProducts = [];
    for (const categoria of categorias) {
      const snapshot = await getDocs(collection(firestore, `${loja}_${categoria}`));
      lojaProducts = [
        ...lojaProducts,
        ...snapshot.docs.map((doc) => ({
          id: doc.id,
          categoria,
          loja,
          ...doc.data(),
        })),
      ];
    }
    return lojaProducts;
  };

  useEffect(() => {
    fetchProducts();
  }, [selectedLoja]);

  const handleDiscountChange = async (itemToUpdate, index, newDiscount, newDiscountType) => {
    try {
      const cartRef = doc(firestore, "cart", cpf);
      const cartSnap = await getDoc(cartRef);
      if (cartSnap.exists()) {
        const cartData = cartSnap.data();
        const items = cartData.items || [];
        items[index].desconto = newDiscount;
        items[index].discountType = newDiscountType;
        await updateDoc(cartRef, { items });
      }
    } catch (error) {
      console.error("Erro ao alterar o desconto:", error);
    }
  };

  const handleProductClick = (product) => {
    setSelectedProduct(product);
    setSelectedLojaForSale(product.loja);

    if (product.categoria === "lentes") {
      const esfericoOptions = generateIntervalOptions(product.esfericoDe, product.esfericoPara);
      const cilindroOptions = generateIntervalOptions(product.cilindroDe, product.cilindroPara);
      const adicaoOptions = generateIntervalOptions(product.adicaoDe, product.adicaoPara);

      setSelectedValues((prev) => ({
        ...prev,
        esfericoOptions,
        cilindroOptions,
        adicaoOptions: adicaoOptions.length ? adicaoOptions : null,
      }));
    } else {
      setSelectedValues((prev) => ({
        ...prev,
        esfericoOptions: [],
        cilindroOptions: [],
        adicaoOptions: [],
      }));
    }
  };

  const addToCartWithDiscount = async (product, finalPrice, desconto, discountType) => {
    if (!cpf || cpf.length !== 11) {
      alert("CPF inválido. Por favor, insira um CPF com 11 dígitos.");
      return;
    }

    setIsAddingToCart(true);

    try {
      const cartRef = doc(firestore, "cart", cpf);
      const cartSnap = await getDoc(cartRef);

      const productData = {
        ...product,
        quantidade: 1,
        // Guardando o valor original e final
        valorOriginal: product.valor,
        valor: finalPrice.toFixed(2),
        desconto,
        discountType,
        // Mantendo campos de lentes se houver
        esfericoOde: selectedValues.esfericoOde,
        esfericoOpara: selectedValues.esfericoOpara,
        esfericoOee: selectedValues.esfericoOee,
        esfericoOepara: selectedValues.esfericoOepara,
        cilindroOde: selectedValues.cilindroOde,
        cilindroOpara: selectedValues.cilindroOpara,
        cilindroOee: selectedValues.cilindroOee,
        cilindroOepara: selectedValues.cilindroOepara,
        adicaoDe: selectedValues.adicaoDe || null,
        adicaoPara: selectedValues.adicaoPara || null,
        os, // Adicionando O.S.
        clientName // Adicionando Nome do Cliente
      };

      if (cartSnap.exists()) {
        const cartData = cartSnap.data();
        cartData.items.push(productData);
        await updateDoc(cartRef, { items: cartData.items });
      } else {
        await setDoc(cartRef, {
          items: [productData],
          cpf,
        });
      }

      alert("Produto adicionado ao carrinho com sucesso!");
      await fetchCartItems();
    } catch (error) {
      console.error("Erro ao adicionar produto ao carrinho:", error);
    } finally {
      setIsAddingToCart(false);
      setSelectedProduct(null);
    }
  };

  const addToCart = () => {
    // Calcula o valor final com desconto no modal antes de adicionar
    const originalPrice = parseFloat(selectedProduct.valor);
    const desconto = parseFloat(selectedValues.localDiscount || 0);
    const tipo = selectedValues.discountType || "R$";
    let finalPrice = originalPrice;
    if (tipo === "%") {
      finalPrice = originalPrice - (originalPrice * desconto) / 100;
    } else {
      finalPrice = originalPrice - desconto;
    }
    if (finalPrice < 0) finalPrice = 0;

    addToCartWithDiscount(selectedProduct, finalPrice, desconto, tipo);
  };

  const handleRemoveFromCart = async (itemToRemove, index) => {
    try {
      const cartRef = doc(firestore, "cart", cpf);
      const cartSnap = await getDoc(cartRef);
      if (cartSnap.exists()) {
        const cartData = cartSnap.data();
        const items = cartData.items || [];
        const updatedItems = items.filter((_, idx) => idx !== index);

        await updateDoc(cartRef, { items: updatedItems });

        const collectionName = getCollectionName(itemToRemove.categoria, itemToRemove.loja);
        const productRef = doc(firestore, collectionName, itemToRemove.id);
        await updateDoc(productRef, {
          quantidade: increment(itemToRemove.quantidade),
        });

        await fetchCartItems();
      }
    } catch (error) {
      console.error("Erro ao remover produto do carrinho:", error);
    }
  };

  const handleQuantityChange = async (itemToUpdate, index, newQuantity) => {
    try {
      const quantityDifference = newQuantity - itemToUpdate.quantidade;
      const collectionName = getCollectionName(itemToUpdate.categoria, itemToUpdate.loja);
      const productRef = doc(firestore, collectionName, itemToUpdate.id);
      const productSnap = await getDoc(productRef);

      if (productSnap.exists()) {
        const productData = productSnap.data();
        if (quantityDifference > 0) {
          if (productData.quantidade >= quantityDifference) {
            const cartRef = doc(firestore, "cart", cpf);
            const cartSnap = await getDoc(cartRef);
            if (cartSnap.exists()) {
              const cartData = cartSnap.data();
              const items = cartData.items || [];
              items[index].quantidade = newQuantity;
              await updateDoc(cartRef, { items });
              await updateDoc(productRef, { quantidade: increment(-quantityDifference) });
              await fetchCartItems();
            }
          } else {
            alert("Não há estoque suficiente para este produto.");
          }
        } else if (quantityDifference < 0) {
          const cartRef = doc(firestore, "cart", cpf);
          const cartSnap = await getDoc(cartRef);
          if (cartSnap.exists()) {
            const cartData = cartSnap.data();
            const items = cartData.items || [];
            items[index].quantidade = newQuantity;
            await updateDoc(cartRef, { items });
            await updateDoc(productRef, { quantidade: increment(-quantityDifference) });
            await fetchCartItems();
          }
        }
      }
    } catch (error) {
      console.error("Erro ao alterar a quantidade:", error);
    }
  };

  const generateQuantityOptions = (currentQuantity, currentStock) => {
    const maxQuantity = currentQuantity + currentStock;
    const options = [];
    for (let i = 1; i <= maxQuantity; i++) {
      options.push(i);
    }
    return options;
  };

  // Cálculo do valor total no carrinho (apenas para exibir)
  const valorTotalVenda = cartItems.reduce((acc, item) => {
    const originalTotal = parseFloat(item.valorOriginal || item.valor) * item.quantidade;
    const localDiscount = item.desconto || 0;
    const discountType = item.discountType || "R$";
    const finalPrice =
      discountType === "%"
        ? originalTotal - (originalTotal * (parseFloat(localDiscount) || 0)) / 100
        : originalTotal - (parseFloat(localDiscount) || 0);
    return acc + finalPrice;
  }, 0);

  return (
    <Layout>
      <div className="p-4 w-full">
        <div className="flex flex-wrap justify-between items-center mb-6">
          <h1 className="text-4xl ml-0 md:ml-4 font-bold text-[#9a5fc7] text-center md:text-left">
            CATÁLOGO
          </h1>
          <div className="flex flex-col sm:flex-row space-y-2 sm:space-y-0 sm:space-x-4 w-full sm:w-auto">
            <input
              type="text"
              placeholder="Buscar produto"
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="border border-gray-300 px-4 py-2 rounded-lg text-black w-full sm:w-auto"
            />
            <button
              className="bg-purple-700 text-white px-4 py-2 rounded-lg w-full sm:w-auto"
              onClick={filterProducts}
            >
              Buscar
            </button>
          </div>
        </div>

        {/* Grid de produtos */}
        <div className="grid grid-cols-2 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4">
          {filteredProducts.map((product, index) => (
            <div
              key={`${product.id}-${index}`}
              className="border rounded-lg shadow-md p-4 bg-white cursor-pointer"
              onClick={() => handleProductClick(product)}
            >
              <img
                src={product.imagem || "/images/default.png"}
                alt={product.produto}
                className="w-full h-48 object-cover rounded-md"
              />
              <h2 className="text-center font-bold mt-4 text-[#81059e] text-md uppercase">
                {product.produto}
              </h2>

              <p className="font-bold text-black text-sm text-center">
                R$ {product.valor}
              </p>
            </div>
          ))}
        </div>

        {/* Modal do produto selecionado */}
        {selectedProduct && (

          <div className="fixed inset-0 bg-black bg-opacity-50 flex justify-center items-center z-50 overflow-y-auto">
            <div className="bg-white p-4 sm:p-6 rounded-lg shadow-lg w-11/12 max-w-4xl relative overflow-y-auto max-h-[90vh]">
              <div className="flex flex-col sm:flex-row justify-center items-center">
                <img
                  src={selectedProduct.imagem || "/images/default.png"}
                  alt={selectedProduct.produto}
                  className="w-full sm:w-48 h-48 object-cover rounded-lg mb-4 sm:mb-0"
                />
                <div className="ml-0 sm:ml-4 w-full text-center sm:text-left">
                  <h2 className="font-bold text-xl sm:text-2xl mb-4 text-[#800080]">
                    {selectedProduct.produto} - {selectedProduct.categoria}
                  </h2>
                  <div className="mb-4">
                    <label className="block font-semibold text-gray-700 mb-1">O.S.</label>
                    <input
                      type="text"
                      className="border border-gray-300 px-2 py-1 rounded w-full text-black"
                      value={os}
                      onChange={(e) => setOs(e.target.value)}
                    />
                  </div>

                  <div className="mb-4">
                    <label className="block font-semibold text-gray-700 mb-1">Nome do Cliente</label>
                    <input
                      type="text"
                      className="border border-gray-300 px-2 py-1 rounded w-full text-black"
                      value={clientName}
                      onChange={(e) => setClientName(e.target.value)}
                    />
                  </div>

                  {/* Descrição do produto */}
                  {selectedProduct.marca && (
                    <p className="text-black">
                      <strong>Marca:</strong> {selectedProduct.marca}
                    </p>
                  )}
                  {selectedProduct.familia && (
                    <p className="text-black">
                      <strong>Família:</strong> {selectedProduct.familia}
                    </p>
                  )}
                  {selectedProduct.genero && (
                    <p className="text-black">
                      <strong>Gênero:</strong> {selectedProduct.genero}
                    </p>
                  )}

                  <p className="text-black font-bold mb-2 mt-2">
                    Preço Original: R${" "}
                    {parseFloat(selectedProduct.valor).toFixed(2)}
                  </p>

                  {/* Se for lente, exibir opções de esférico, cilindro e adição */}
                  {selectedProduct.categoria === "lentes" && (
                    <div className="mb-4">
                      <p className="font-bold text-[#800080] mb-2">
                        Configurações da Lente
                      </p>
                      <div className="mb-2">
                        <label className="block font-semibold text-gray-700 mb-1">
                          Esférico
                        </label>
                        <select
                          className="border border-gray-300 px-2 py-1 rounded w-full text-black"
                          value={selectedValues.esfericoOde}
                          onChange={(e) =>
                            setSelectedValues((prev) => ({
                              ...prev,
                              esfericoOde: e.target.value,
                            }))
                          }
                        >
                          <option value="">Selecione</option>
                          {selectedValues.esfericoOptions.map((option) => (
                            <option key={option} value={option}>
                              {option}
                            </option>
                          ))}
                        </select>
                      </div>

                      <div className="mb-2">
                        <label className="block font-semibold text-gray-700 mb-1">
                          Cilindro
                        </label>
                        <select
                          className="border border-gray-300 px-2 py-1 rounded w-full text-black"
                          value={selectedValues.cilindroOde}
                          onChange={(e) =>
                            setSelectedValues((prev) => ({
                              ...prev,
                              cilindroOde: e.target.value,
                            }))
                          }
                        >
                          <option value="">Selecione</option>
                          {selectedValues.cilindroOptions.map((option) => (
                            <option key={option} value={option}>
                              {option}
                            </option>
                          ))}
                        </select>
                      </div>

                      {selectedValues.adicaoOptions && (
                        <div className="mb-2">
                          <label className="block font-semibold text-gray-700 mb-1">
                            Adição
                          </label>
                          <select
                            className="border border-gray-300 px-2 py-1 rounded w-full text-black"
                            value={selectedValues.adicaoDe}
                            onChange={(e) =>
                              setSelectedValues((prev) => ({
                                ...prev,
                                adicaoDe: e.target.value,
                              }))
                            }
                          >
                            <option value="">Selecione</option>
                            {selectedValues.adicaoOptions.map((option) => (
                              <option key={option} value={option}>
                                {option}
                              </option>
                            ))}
                          </select>
                        </div>
                      )}
                    </div>
                  )}

                  {/* Campo para inserir desconto no modal */}
                  <div className="mb-4">
                    <label className="block font-bold text-gray-700 mb-2">
                      Desconto (opcional)
                    </label>
                    <div className="flex items-center space-x-2">
                      <input
                        type="number"
                        className="border border-gray-300 px-4 py-2 rounded-lg w-24 text-black"
                        value={selectedValues.localDiscount}
                        onChange={(e) =>
                          setSelectedValues((prev) => ({
                            ...prev,
                            localDiscount: e.target.value,
                          }))
                        }
                        step="0.01"
                        min="0"
                      />
                      <select
                        value={selectedValues.discountType}
                        onChange={(e) =>
                          setSelectedValues((prev) => ({
                            ...prev,
                            discountType: e.target.value,
                          }))
                        }
                        className="border border-gray-300 px-2 py-2 rounded-lg text-black"
                      >
                        <option value="R$">R$</option>
                        <option value="%">%</option>
                      </select>
                    </div>
                  </div>

                  {/* Cálculo do valor final com desconto */}
                  {(() => {
                    const originalPrice = parseFloat(selectedProduct.valor);
                    const desconto = parseFloat(selectedValues.localDiscount || 0);
                    const tipo = selectedValues.discountType || "R$";
                    let finalPrice = originalPrice;
                    if (tipo === "%") {
                      finalPrice = originalPrice - (originalPrice * desconto) / 100;
                    } else {
                      finalPrice = originalPrice - desconto;
                    }
                    if (finalPrice < 0) finalPrice = 0;
                    return (
                      <p className="text-black font-bold mb-2">
                        Valor com Desconto: R$ {finalPrice.toFixed(2)}
                      </p>
                    );
                  })()}

                  <input
                    type="text"
                    placeholder="Digite o CPF"
                    className="border-2 border-[#81059e] px-4 py-2 rounded-lg w-full text-black mb-4"
                    value={cpf}
                    onChange={(e) => setCpf(e.target.value)}
                  />

                  <button
                    className="bg-purple-700 text-white px-4 py-2 rounded-lg w-full mt-4"
                    onClick={addToCart}
                    disabled={isAddingToCart}
                  >
                    {isAddingToCart ? "Adicionando..." : "Adicionar ao Carrinho"}
                  </button>

                  <button
                    className="bg-gray-500 text-white px-4 py-2 rounded-lg w-full mt-2"
                    onClick={() => setSelectedProduct(null)}
                  >
                    Fechar
                  </button>
                </div>
              </div>
            </div>
          </div>
        )}

        <button
          className="fixed bottom-4 right-4 bg-purple-700 text-white p-4 rounded-full shadow-lg"
          onClick={() => setShowCartDropdown(true)}
        >
          <FaShoppingCart size={24} />
        </button>

        {showCartDropdown && (
          <div className="fixed top-0 right-0 w-full max-w-md bg-white shadow-lg p-4 h-full z-50 overflow-y-auto">
            <div className="flex justify-between items-center mb-4">
              <h3 className="text-black text-lg font-bold">Carrinho</h3>
              <button
                className="text-gray-600"
                onClick={() => setShowCartDropdown(false)}
              >
                X
              </button>
            </div>

            <div className="mb-4">
              <label className="block text-black font-semibold mb-2">
                Buscar Cliente (CPF ou Nome)
              </label>
              <div className="flex flex-col space-y-2">
                <input
                  type="text"
                  value={customerSearchTerm}
                  onChange={(e) => setCustomerSearchTerm(e.target.value)}
                  placeholder="Digite CPF (11 dígitos) ou Nome"
                  className="border border-gray-300 px-4 py-2 rounded-lg w-full text-black"
                />
                <button
                  onClick={fetchCartItems}
                  className="bg-purple-700 text-white px-4 py-2 rounded-lg"
                >
                  Buscar
                </button>
              </div>
            </div>

            {customerName && (
              <div className="mb-4">
                <p className="font-bold text-black">Cliente: {customerName}</p>
                <p className="text-black">CPF: {cpf}</p>
              </div>
            )}

            <ul className="space-y-4">
              {cartItems.length > 0 ? (
                cartItems.map((item, index) => (
                  <CartItem
                    key={index}
                    item={item}
                    index={index}
                    handleQuantityChange={handleQuantityChange}
                    handleRemoveFromCart={handleRemoveFromCart}
                    handleDiscountChange={handleDiscountChange}
                    generateQuantityOptions={generateQuantityOptions}
                  />
                ))
              ) : (
                <p className="text-center text-gray-500">Carrinho vazio.</p>
              )}
            </ul>

            <div className="mt-4 text-black font-bold">
              Total da Venda (c/ descontos): R$ {valorTotalVenda.toFixed(2)}
            </div>

            <Link
              href={`/commercial/sales/new_sale?cpf=${cpf}&valor=${valorTotalVenda.toFixed(2)}`}
              className={`bg-purple-700 text-white px-4 py-2 rounded-lg w-full mt-4 text-center block ${cartItems.length === 0 ? "opacity-50 pointer-events-none" : ""
                }`}
            >
              Finalizar Venda
            </Link>
          </div>
        )}
      </div>
    </Layout>
  );
};

export default Catalogo;
