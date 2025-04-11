"use client";

import React, { useState, useEffect } from "react";
import Layout from "@/components/Layout";
import { collection, getDocs, doc, getDoc, updateDoc, setDoc } from "firebase/firestore";
import { firestore } from "../../lib/firebaseConfig";

const ProdutosRegistrados = () => {
  const [cpf, setCpf] = useState(""); // CPF do usuário
  const [armacoes, setArmacoes] = useState([]); // Estado para armazenar as armações
  const [lentes, setLentes] = useState([]); // Estado para armazenar as lentes
  const [solares, setSolares] = useState([]); // Estado para armazenar os solares
  const [cartItems, setCartItems] = useState([]); // Produtos no carrinho
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState(null);
  const [selectedLoja, setSelectedLoja] = useState("ambas");
  const [showCartDropdown, setShowCartDropdown] = useState(false); // Estado do dropdown do carrinho
  const [cpfNotRegistered, setCpfNotRegistered] = useState(false); // Estado para mostrar se o CPF não está registrado
  const [discountPercentage, setDiscountPercentage] = useState(0); // Estado para o desconto

  // Função para verificar se o CPF existe na coleção /consumers
  const checkCpfInConsumers = async () => {
    if (cpf.length !== 11) {
      alert("Por favor, insira um CPF válido com 11 dígitos.");
      return false;
    }

    try {
      const consumerRef = doc(firestore, "consumers", cpf);
      const consumerSnap = await getDoc(consumerRef);

      if (!consumerSnap.exists()) {
        setCpfNotRegistered(true); // Exibe a opção de cadastrar o CPF
        return false; // CPF ainda não existe
      } else {
        setCpfNotRegistered(false); // CPF já registrado
        return true;
      }
    } catch (error) {
      console.error("Erro ao verificar o CPF: ", error);
      alert("Erro ao verificar o CPF.");
      return false;
    }
  };

  // Função para buscar armações, lentes e solares no Firestore
  const fetchProdutos = async () => {
    try {
      setIsLoading(true);

      // Buscar armações, lentes e solares das lojas
      let loja1Armacoes = [];
      let loja2Armacoes = [];
      let loja1Lentes = [];
      let loja2Lentes = [];
      let loja1Solares = [];
      let loja2Solares = [];

      if (selectedLoja === "loja1" || selectedLoja === "ambas") {
        const loja1ArmacoesSnapshot = await getDocs(collection(firestore, "loja1_armacoes"));
        const loja1LentesSnapshot = await getDocs(collection(firestore, "loja1_lentes"));
        const loja1SolaresSnapshot = await getDocs(collection(firestore, "loja1_solares"));
        loja1Armacoes = loja1ArmacoesSnapshot.docs.map((doc) => ({ id: doc.id, loja: "Loja 1", ...doc.data() }));
        loja1Lentes = loja1LentesSnapshot.docs.map((doc) => ({ id: doc.id, loja: "Loja 1", ...doc.data() }));
        loja1Solares = loja1SolaresSnapshot.docs.map((doc) => ({ id: doc.id, loja: "Loja 1", ...doc.data() }));
      }

      if (selectedLoja === "loja2" || selectedLoja === "ambas") {
        const loja2ArmacoesSnapshot = await getDocs(collection(firestore, "loja2_armacoes"));
        const loja2LentesSnapshot = await getDocs(collection(firestore, "loja2_lentes"));
        const loja2SolaresSnapshot = await getDocs(collection(firestore, "loja2_solares"));
        loja2Armacoes = loja2ArmacoesSnapshot.docs.map((doc) => ({ id: doc.id, loja: "Loja 2", ...doc.data() }));
        loja2Lentes = loja2LentesSnapshot.docs.map((doc) => ({ id: doc.id, loja: "Loja 2", ...doc.data() }));
        loja2Solares = loja2SolaresSnapshot.docs.map((doc) => ({ id: doc.id, loja: "Loja 2", ...doc.data() }));
      }

      // Combinar os resultados das duas lojas
      setArmacoes([...loja1Armacoes, ...loja2Armacoes]);
      setLentes([...loja1Lentes, ...loja2Lentes]);
      setSolares([...loja1Solares, ...loja2Solares]);

      setIsLoading(false);
    } catch (error) {
      console.error("Erro ao carregar os produtos:", error);
      setError("Erro ao carregar os dados dos produtos.");
      setIsLoading(false);
    }
  };

  useEffect(() => {
    fetchProdutos(); // Busca os produtos quando o componente é montado ou quando a loja selecionada muda
  }, [selectedLoja]);

  // Função para calcular o valor total com desconto
  const calculateTotalWithDiscount = () => {
    const total = cartItems.reduce((sum, item) => sum + item.valor * item.quantidade, 0);
    const discount = (total * discountPercentage) / 100;
    return total - discount;
  };

  // Função para adicionar produtos ao carrinho no Firestore
  const addToCart = async (product) => {
    if (!cpf) {
      alert("Por favor, insira um CPF válido.");
      return;
    }

    const isCpfValid = await checkCpfInConsumers();
    if (!isCpfValid) return;

    try {
      const cartRef = doc(firestore, "cart", cpf); // Documento no Firestore baseado no CPF
      const cartSnap = await getDoc(cartRef);

      if (cartSnap.exists()) {
        // Atualizar o carrinho existente
        const existingCart = cartSnap.data();

        // Verifica se o produto já está no carrinho
        const productIndex = existingCart.items.findIndex(item => item.id === product.id);

        if (productIndex > -1) {
          // Produto já está no carrinho, incrementa a quantidade
          existingCart.items[productIndex].quantidade += 1;
        } else {
          // Adiciona o produto ao carrinho com quantidade inicial de 1
          product.quantidade = 1;
          existingCart.items.push(product);
        }

        await updateDoc(cartRef, { items: existingCart.items });
      } else {
        // Criar novo carrinho para o CPF
        product.quantidade = 1; // Define a quantidade inicial
        await setDoc(cartRef, {
          cpf,
          items: [product],
        });
      }

      // Atualiza o estado local
      setCartItems((prevItems) => {
        const itemIndex = prevItems.findIndex(item => item.id === product.id);
        if (itemIndex > -1) {
          // Produto já no carrinho, incrementa a quantidade no estado local
          const updatedItems = [...prevItems];
          updatedItems[itemIndex].quantidade += 1;
          return updatedItems;
        } else {
          // Adiciona o produto ao estado local
          return [...prevItems, { ...product, quantidade: 1 }];
        }
      });

      alert("Produto adicionado ao carrinho!");
    } catch (error) {
      console.error("Erro ao adicionar produto ao carrinho: ", error);
      alert("Erro ao adicionar produto ao carrinho.");
    }
  };

  return (
    <Layout>
      <div className="p-4 sm:p-6">
        <h1 className="text-2xl font-bold text-[#800080] mb-4">Produtos Registrados</h1>

        {/* Input para buscar produtos e CPF */}
        <div className="flex flex-col sm:flex-row justify-between items-center mb-4 space-y-4 sm:space-y-0">
          <input
            type="text"
            placeholder="Digite o CPF"
            className="border-2 border-gray-300 rounded-lg px-4 py-2 w-full sm:w-1/3 text-black"
            value={cpf}
            onChange={(e) => setCpf(e.target.value)}
          />

          <select
            className="border-2 border-gray-300 rounded-lg px-4 py-2 w-full sm:w-1/3 text-black"
            value={selectedLoja}
            onChange={(e) => setSelectedLoja(e.target.value)}
          >
            <option value="ambas">Ambas as Lojas</option>
            <option value="loja1">Loja 1</option>
            <option value="loja2">Loja 2</option>
          </select>

          <div className="flex space-x-4">
            <button
              onClick={() => {
                setShowCartDropdown(!showCartDropdown);
                fetchCartItems(); // Carregar o carrinho ao clicar no botão
              }}
              className="bg-blue-500 text-white px-4 py-2 rounded-lg"
            >
              Mostrar Carrinho
            </button>

            <button
              onClick={async () => {
                const isCpfValid = await checkCpfInConsumers(); // Verifica o CPF sem mostrar o carrinho
                if (isCpfValid) {
                  alert("CPF verificado. Você pode continuar adicionando produtos.");
                }
              }}
              className="bg-gray-500 text-white px-4 py-2 rounded-lg"
            >
              OK
            </button>
          </div>
        </div>

        {/* Dropdown do carrinho */}
        {showCartDropdown && (
          <div className="absolute z-10 w-full max-w-md bg-white shadow-lg p-4 mt-2 rounded-lg">
            <h3 className="text-black text-lg font-bold mb-4">Carrinho de {cpf}</h3>
            {cartItems.length > 0 ? (
              <ul>
                {cartItems.map((item, index) => (
                  <li key={index} className="text-black mb-2 flex items-center space-x-4">
                    <img
                      src={typeof item.imagem === 'string' ? item.imagem : '/images/default_icon.png'}
                      alt={item.produto || 'Produto'}
                      className="w-16 h-16 object-cover rounded-md"
                    />

                    <div>
                      <p><strong>Produto:</strong> {item.produto}</p>
                      <p><strong>Valor:</strong> R$ {item.valor}</p>
                      <p><strong>Loja:</strong> {item.loja}</p>
                    </div>
                  </li>
                ))}
              </ul>
            ) : (
              <p>Carrinho vazio.</p>
            )}

            {/* Campo de desconto */}
            <div className="mt-4">
              <label className="block mb-2 text-black">Desconto (%)</label>
              <input
                type="number"
                value={discountPercentage}
                onChange={(e) => setDiscountPercentage(Number(e.target.value))}
                className="border-2 border-[#81059e] px-4 py-2 rounded-lg w-full text-black"
                min="0"
                max="100"
              />
            </div>

            {/* Exibir o total com desconto */}
            <div className="mt-4">
              <p className="text-lg font-bold text-black">Total com desconto: R$ {calculateTotalWithDiscount().toFixed(2)}</p>
            </div>
          </div>
        )}
      </div>
    </Layout>
  );
};

export default ProdutosRegistrados;
