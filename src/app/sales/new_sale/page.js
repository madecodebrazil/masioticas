"use client";

export const dynamic = "force-dynamic";

import React, { useState, Suspense, useEffect } from "react";
import Layout from "@/components/Layout";
import { firestore, auth } from "../../../lib/firebaseConfig";
import {
  collection,
  getDocs,
  addDoc,
  doc,
  getDoc,
  deleteDoc,
  Timestamp,
  writeBatch,
} from "firebase/firestore";
import { useRouter, useSearchParams } from "next/navigation";
import jsPDF from "jspdf";
import "jspdf-autotable";

import {
  getStorage,
  ref,
  uploadBytesResumable,
  getDownloadURL,
} from "firebase/storage";
import DatePicker from "react-datepicker";
import "react-datepicker/dist/react-datepicker.css";
import CurrencyInput from "react-currency-input-field";



// --------------------------------------------------------
// COMPONENTE PRINCIPAL: NovaVendaContent
// --------------------------------------------------------
function NovaVendaContent() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const [creditCardInstallments, setCreditCardInstallments] = useState(1);

  // Estado para guardar erros de validação
  const [formErrors, setFormErrors] = useState({});

  // Estado para capturar o usuário logado
  const [user, setUser] = useState(null);

  // Estado do formulário e variáveis relacionadas
  const [formData, setFormData] = useState({
    cpf: "",
    nome: "",
    telefone: "",
    data: new Date(),
    formaPagamento: "Pix",
    condicaoPagamento: "A vista",
    entrada: 0,
    valorVenda: 0,
    loja: "Loja 1",
    tipo: "vendas",
    parcelas: 1,
    cardDetails: [],
    debitCardDetails: [],
    pixPaymentAmount: 0, // Campo para valor em Pix/Dinheiro
  });

  // Pagamentos adicionais
  const [additionalPayments, setAdditionalPayments] = useState([]);

  // ... (demais states)
  const [scheduleEntry, setScheduleEntry] = useState(false);
  const [scheduledEntryDate, setScheduledEntryDate] = useState(null);
  const [loading, setLoading] = useState(false);
  const [totalValue, setTotalValue] = useState(0);

  // Estados de desconto
  const [discount, setDiscount] = useState(0);
  const [discountType, setDiscountType] = useState("%");

  const [finalValue, setFinalValue] = useState(0);
  const [installments, setInstallments] = useState(1);
  const [downPayment, setDownPayment] = useState(0);
  const [installmentValue, setInstallmentValue] = useState(0);
  const [paymentMethod, setPaymentMethod] = useState("Pix");
  const [crediarioInstallments, setCrediarioInstallments] = useState(1);
  const [paymentCondition, setPaymentCondition] = useState("A vista");
  const [availableConditions, setAvailableConditions] = useState(["A vista"]);
  const [showInstallments, setShowInstallments] = useState(false);
  const [receivingDate, setReceivingDate] = useState(null);

  const [loadingClientData, setLoadingClientData] = useState(false);
  const [clientFound, setClientFound] = useState(false);
  const [cartItems, setCartItems] = useState([]);

  // Método de pagamento da entrada
  const [downPaymentMethod, setDownPaymentMethod] = useState("");
  const [downPaymentInstallments, setDownPaymentInstallments] = useState(1);
  const [downPaymentCondition, setDownPaymentCondition] = useState("A vista");
  const [downPaymentCardDetails, setDownPaymentCardDetails] = useState({
    cardNumber: "",
    expiryDate: "",
    cvv: "",
    aut: "",
    bandeira: "",
  });
  const [useSameCardDetails, setUseSameCardDetails] = useState(false);
  const [showDownPaymentInstallments, setShowDownPaymentInstallments] =
    useState(false);

  // ------------------------------------------------------------------------------------------------
  // 1) HOOK PARA OBTER O UID DO USUÁRIO LOGADO
  // ------------------------------------------------------------------------------------------------
  useEffect(() => {
    const unsubscribe = auth.onAuthStateChanged((loggedInUser) => {
      if (loggedInUser) {
        setUser(loggedInUser);
      } else {
        router.push("/login");
      }
    });
    return () => unsubscribe();
  }, [router]);

  // 2) SE TIVER CPF NA URL, BUSCA AUTOMATICAMENTE
  useEffect(() => {
    const cpfFromUrl = searchParams.get("cpf");
    if (cpfFromUrl) {
      setFormData((prevData) => ({
        ...prevData,
        cpf: cpfFromUrl,
      }));
      handleSearchCPF(cpfFromUrl);
    }
  }, [searchParams]);

  // 3) SEMPRE QUE ALGUNS CAMPOS MUDAM, RECALCULA O VALOR FINAL
  useEffect(() => {
    calculateDiscountedTotal(totalValue, discount, discountType);
  }, [totalValue, discount, discountType, downPayment, installments]);

  // ------------------------------------------------------------------------------------------------
  // 4) FUNÇÃO DE VALIDAÇÃO
  // ------------------------------------------------------------------------------------------------
  function validateForm(
    formData,
    paymentMethod,
    downPayment,
    downPaymentMethod,
    crediarioInstallments,
    additionalPayments
  ) {
    const errors = {};

    // 1) CPF obrigatório
    if (!formData.cpf || formData.cpf.trim() === "") {
      errors.cpf = "CPF é obrigatório.";
    }
    // 2) Nome obrigatório
    if (!formData.nome || formData.nome.trim() === "") {
      errors.nome = "Nome é obrigatório.";
    }
    // 3) Telefone obrigatório
    if (!formData.telefone || formData.telefone.trim() === "") {
      errors.telefone = "Telefone é obrigatório.";
    }
    // 4) Loja obrigatória
    if (!formData.loja || formData.loja.trim() === "") {
      errors.loja = "Loja é obrigatória.";
    }
    // 5) Forma de pagamento obrigatória
    if (!paymentMethod || paymentMethod.trim() === "") {
      errors.formaPagamento = "Forma de pagamento é obrigatória.";
    }

    // 6) Se Pix ou Dinheiro, exigir valor > 0 (pixPaymentAmount)
    if (
      (paymentMethod === "Pix" || paymentMethod === "Dinheiro") &&
      (!formData.pixPaymentAmount || formData.pixPaymentAmount <= 0)
    ) {
      errors.pixPaymentAmount = "Valor do pagamento em Pix/Dinheiro é obrigatório.";
    }

    // 7) Se houver entrada (downPayment > 0), exigir downPaymentMethod
    if (downPayment > 0 && !downPaymentMethod) {
      errors.downPaymentMethod =
        "Método de pagamento da entrada é obrigatório quando há valor de entrada.";
    }

    // 8) Se o método principal for "Cartão de Crédito", verificar se há dados do cartão
    if (paymentMethod === "Cartão de Crédito") {
      if (!formData.cardDetails || formData.cardDetails.length === 0) {
        errors.cardDetails =
          "É obrigatório adicionar pelo menos 1 cartão de crédito.";
      } else {
        formData.cardDetails.forEach((card, index) => {
          if (!card.cardNumber || card.cardNumber.trim() === "") {
            errors[`cardNumber_${index}`] = `Número do Cartão ${index + 1} é obrigatório.`;
          }
          if (!card.expiryDate || card.expiryDate.trim() === "") {
            errors[`expiryDate_${index}`] = `Validade do Cartão ${index + 1} é obrigatória.`;
          }
          if (!card.cvv || card.cvv.trim() === "") {
            errors[`cvv_${index}`] = `CVV do Cartão ${index + 1} é obrigatório.`;
          }
        });
      }
    }

    // 9) Se o método principal for "Cartão de Débito", verificar dados do cartão
    if (paymentMethod === "Cartão de Débito") {
      if (!formData.debitCardDetails || formData.debitCardDetails.length === 0) {
        errors.debitCardDetails =
          "É obrigatório adicionar pelo menos 1 cartão de débito.";
      } else {
        formData.debitCardDetails.forEach((card, index) => {
          if (!card.cardNumber || card.cardNumber.trim() === "") {
            errors[`debitCardNumber_${index}`] = `Número do Cartão Débito ${index + 1} é obrigatório.`;
          }
          if (!card.expiryDate || card.expiryDate.trim() === "") {
            errors[`debitCardExpiryDate_${index}`] = `Validade do Cartão Débito ${index + 1} é obrigatória.`;
          }
          if (!card.cvv || card.cvv.trim() === "") {
            errors[`debitCardCvv_${index}`] = `CVV do Cartão Débito ${index + 1} é obrigatório.`;
          }
        });
      }
    }

    // 10) Se Crediário ou Boleto, verificar número de parcelas
    if (
      (paymentMethod === "Crediário" || paymentMethod === "Boleto") &&
      (!crediarioInstallments || crediarioInstallments < 1)
    ) {
      errors.crediarioInstallments =
        "É obrigatório informar ao menos 1 parcela para crediário/boleto.";
    }

    // 11) Se existirem pagamentos adicionais, validar
    if (additionalPayments && additionalPayments.length > 0) {
      additionalPayments.forEach((pay, idx) => {
        // Método obrigatório
        if (!pay.method || pay.method.trim() === "") {
          errors[`additionalMethod_${idx}`] = `Método de pagamento adicional #${idx + 1} é obrigatório.`;
        }

        // Valor > 0 obrigatório
        if (!pay.value || pay.value <= 0) {
          errors[`additionalValue_${idx}`] = `Valor do pagamento adicional #${idx + 1} deve ser maior que 0.`;
        }

        // Se for cartão de crédito ou débito, dados obrigatórios
        if (
          pay.method === "Cartão de Crédito" ||
          pay.method === "Cartão de Débito"
        ) {
          if (!pay.cardNumber || pay.cardNumber.trim() === "") {
            errors[`additionalCardNumber_${idx}`] = `Número do Cartão adicional #${idx + 1} é obrigatório.`;
          }
          if (!pay.expiryDate || pay.expiryDate.trim() === "") {
            errors[`additionalExpiryDate_${idx}`] = `Validade do Cartão adicional #${idx + 1} é obrigatória.`;
          }
          if (!pay.cvv || pay.cvv.trim() === "") {
            errors[`additionalCvv_${idx}`] = `CVV do Cartão adicional #${idx + 1} é obrigatório.`;
          }
        }
      });
    }

    return errors;
  }

  // ------------------------------------------------------------------------------------------------
  // LÓGICA PARA PAGAMENTOS ADICIONAIS
  // ------------------------------------------------------------------------------------------------
  const handleAddPaymentMethod = () => {
    setAdditionalPayments((prev) => [
      ...prev,
      {
        method: "",
        value: 0,
        id: Date.now(),
        installments: 1,
        cardNumber: "",
        expiryDate: "",
        cvv: "",
        aut: "",
        bandeira: "",
        amount: 0,
      },
    ]);
  };

  const handleRemovePaymentMethod = (id) => {
    setAdditionalPayments((prev) => prev.filter((payment) => payment.id !== id));
  };

  const handleAdditionalPaymentChange = (id, field, value) => {
    setAdditionalPayments((prev) =>
      prev.map((payment) =>
        payment.id === id ? { ...payment, [field]: value } : payment
      )
    );
  };

  // ------------------------------------------------------------------------------------------------
  // FUNÇÕES DE DETECÇÃO DE BANDEIRA E ETC.
  // ------------------------------------------------------------------------------------------------
  const handleAdditionalPaymentCardBrand = (id, number) => {
    const brand = detectCardBrand(number);
    setAdditionalPayments((prev) =>
      prev.map((payment) =>
        payment.id === id ? { ...payment, bandeira: brand } : payment
      )
    );
  };

  const detectCardBrand = (cardNumber) => {
    const sanitized = cardNumber.replace(/\D/g, "");
    const patterns = {
      Visa: /^4[0-9]{0,}$/,
      MasterCard: /^(5[1-5][0-9]{0,}|2[2-7][0-9]{0,})$/,
      "American Express": /^3[47][0-9]{0,}$/,
      Discover: /^(6011|65|64[4-9])[0-9]{0,}$/,
      "Diners Club": /^3[0689][0-9]{0,}$/,
      JCB: /^35[0-9]{0,}$/,
      Elo: /^(4011|4312|4389|4514|4576|5041|5067|5090|6277|6362|6363|6500|6516|6550)/,
      Hipercard: /^(606282|3841)[0-9]{0,}$/,
    };
    for (const brand in patterns) {
      if (patterns[brand].test(sanitized)) {
        return brand;
      }
    }
    return "";
  };

  // ------------------------------------------------------------------------------------------------
  // FUNÇÕES PARA ADICIONAR/REMOVER CARTÕES DE CRÉDITO E DÉBITO
  // ------------------------------------------------------------------------------------------------
  const handleAddCard = () => {
    setFormData((prevData) => ({
      ...prevData,
      cardDetails: [
        ...prevData.cardDetails,
        {
          cardNumber: "",
          expiryDate: "",
          cvv: "",
          aut: "",
          bandeira: "",
          amount: 0,
          installments: 1,
        },
      ],
    }));
  };

  const handleRemoveCard = (index) => {
    const updatedCardDetails = [...formData.cardDetails];
    updatedCardDetails.splice(index, 1);
    setFormData((prevData) => ({
      ...prevData,
      cardDetails: updatedCardDetails,
    }));
  };

  const handleCardDetailChange = (index, field, value) => {
    const updatedCardDetails = [...formData.cardDetails];
    updatedCardDetails[index][field] = value;
    if (field === "cardNumber") {
      updatedCardDetails[index].bandeira = detectCardBrand(value);
    }
    setFormData((prevData) => ({
      ...prevData,
      cardDetails: updatedCardDetails,
    }));
  };

  const handleAddDebitCard = () => {
    setFormData((prevData) => ({
      ...prevData,
      debitCardDetails: [
        ...prevData.debitCardDetails,
        {
          cardNumber: "",
          expiryDate: "",
          cvv: "",
          aut: "",
          bandeira: "",
          amount: 0,
        },
      ],
    }));
  };

  const handleRemoveDebitCard = (index) => {
    const updatedDebitCardDetails = [...formData.debitCardDetails];
    updatedDebitCardDetails.splice(index, 1);
    setFormData((prevData) => ({
      ...prevData,
      debitCardDetails: updatedDebitCardDetails,
    }));
  };

  const handleDebitCardDetailChange = (index, field, value) => {
    const updatedDebitCardDetails = [...formData.debitCardDetails];
    updatedDebitCardDetails[index][field] = value;

    if (field === "cardNumber") {
      updatedDebitCardDetails[index].bandeira = detectCardBrand(value);
    }

    setFormData((prevData) => ({
      ...prevData,
      debitCardDetails: updatedDebitCardDetails,
    }));
  };

  // ------------------------------------------------------------------------------------------------
  // FUNÇÃO PARA ATUALIZAR O VALOR TOTAL (CONSIDERANDO DESCONTO, ENTRADA, ETC.)
  // ------------------------------------------------------------------------------------------------
  const calculateDiscountedTotal = (total, discount, type) => {
    let discountedTotal = total - downPayment;
    if (type === "%") {
      discountedTotal = discountedTotal - (discountedTotal * discount) / 100;
    } else {
      discountedTotal = discountedTotal - discount;
    }
    const totalAfterDownPayment = discountedTotal;
    setFinalValue(totalAfterDownPayment > 0 ? totalAfterDownPayment : 0);
    calculateInstallmentValue(totalAfterDownPayment, installments);
  };

  const calculateInstallmentValue = (total, numInstallments) => {
    if (numInstallments > 0) {
      const installmentVal = total / numInstallments;
      setInstallmentValue(installmentVal);
    }
  };

  // ------------------------------------------------------------------------------------------------
  // ESCOLHA DE FORMA DE PAGAMENTO
  // ------------------------------------------------------------------------------------------------
  const handlePaymentMethodChange = (method) => {
    setPaymentMethod(method);
    if (method === "Cartão de Crédito") {
      setFormData((prevData) => ({
        ...prevData,
        cardDetails: [
          {
            cardNumber: "",
            expiryDate: "",
            cvv: "",
            aut: "",
            bandeira: "",
            amount: finalValue,
            installments: 1,
          },
        ],
      }));
      setAvailableConditions(["A vista", "Parcelado"]);
      setPaymentCondition("A vista");
      setShowInstallments(false);
      setInstallments(1);
    } else if (method === "Cartão de Débito") {
      setFormData((prevData) => ({
        ...prevData,
        debitCardDetails: [
          {
            cardNumber: "",
            expiryDate: "",
            cvv: "",
            aut: "",
            bandeira: "",
            amount: finalValue,
          },
        ],
      }));
      setAvailableConditions(["A vista"]);
      setPaymentCondition("A vista");
      setShowInstallments(false);
      setInstallments(1);
    } else {
      setFormData((prevData) => ({
        ...prevData,
        cardDetails: [],
        debitCardDetails: [],
      }));
      switch (method) {
        case "Crediário":
          setAvailableConditions(["Parcelado"]);
          setPaymentCondition("Parcelado");
          setShowInstallments(true);
          break;
        case "Boleto":
          setAvailableConditions(["Parcelado"]);
          setPaymentCondition("Parcelado");
          setShowInstallments(true);
          break;
        default:
          setAvailableConditions(["A vista"]);
          setPaymentCondition("A vista");
          setShowInstallments(false);
          setInstallments(1);
          break;
      }
    }
  };

  // ------------------------------------------------------------------------------------------------
  // SCHEDULE ENTRY (AGENDAR ENTRADA)
  // ------------------------------------------------------------------------------------------------
  const handleScheduleEntry = async () => {
    if (!scheduledEntryDate) {
      alert("Por favor, selecione uma data para o agendamento da entrada.");
      return;
    }

    try {
      const entryCrediarioData = {
        title: `Entrada - ${formData.cpf}`,
        cpf: formData.cpf,
        nome: formData.nome,
        telefone: formData.telefone,
        data: Timestamp.now(),
        formaPagamento: "Crediário",
        condicaoPagamento: "A vista",
        valorVenda: downPayment,
        valorFinal: downPayment,
        loja: formData.loja === "Loja 1" ? "loja1" : "loja2",
        parcelas: 1,
        parcelasDetalhadas: [
          {
            numeroParcela: 1,
            valorParcela: downPayment,
            dataVencimento: scheduledEntryDate.toISOString().split("T")[0],
          },
        ],
        tipo: "entrada",
        descricao: `Entrada agendada no valor de R$ ${downPayment.toFixed(2)}`,
        dataRecebimento: Timestamp.fromDate(scheduledEntryDate),
        userId: user.uid,
      };

      await addDoc(collection(firestore, "a_receber"), entryCrediarioData);
      await addDoc(collection(firestore, "crediarios"), entryCrediarioData);

      console.log("Entrada agendada salva como crediário:", entryCrediarioData);
      alert("Entrada agendada com sucesso!");
    } catch (error) {
      console.error("Erro ao agendar a entrada:", error);
      alert("Erro ao agendar a entrada. Por favor, tente novamente.");
    }
  };

  const handleDownPaymentMethodChange = (method) => {
    setDownPaymentMethod(method);
    switch (method) {
      case "Cartão de Crédito":
        setDownPaymentCondition("A vista");
        setShowDownPaymentInstallments(false);
        break;
      default:
        setDownPaymentCondition("A vista");
        setShowDownPaymentInstallments(false);
        setDownPaymentInstallments(1);
        break;
    }
  };

  const handleInstallmentsChange = (numInstallments) => {
    setInstallments(numInstallments);
    calculateInstallmentValue(finalValue, numInstallments);
  };

  const handleDownPaymentInstallmentsChange = (numInstallments) => {
    setDownPaymentInstallments(numInstallments);
  };

  // ------------------------------------------------------------------------------------------------
  // BUSCA CPF E CARREGA O CARRINHO
  // ------------------------------------------------------------------------------------------------
  const handleSearchCPF = async (cpfValue) => {
    const searchValue = cpfValue || formData.cpf;
    const rawCPF = searchValue.replace(/\D/g, "");
    if (rawCPF.length !== 11) {
      alert("Por favor, insira um CPF com 11 dígitos (apenas números).");
      return;
    }
    setLoadingClientData(true);

    try {
      const clientsCollection = collection(firestore, "consumers");
      const snapshot = await getDocs(clientsCollection);
      const foundClients = snapshot.docs
        .map((doc) => ({ id: doc.id, ...doc.data() }))
        .filter((client) => client.cpf.replace(/\D/g, "") === rawCPF);

      if (foundClients.length > 0) {
        const client = foundClients[0];
        setFormData((prevData) => ({
          ...prevData,
          cpf: rawCPF,
          nome: client.nome,
          telefone: client.telefone && client.telefone.trim() !== ""
            ? client.telefone
            : (client.telefones && client.telefones.length > 0
              ? client.telefones[0]
              : "")
        }));
        setClientFound(true);

        const cartRef = doc(firestore, "cart", rawCPF);
        const cartDoc = await getDoc(cartRef);
        if (cartDoc.exists()) {
          const cartData = cartDoc.data();
          setCartItems(cartData.items);
          const totalCartValue = cartData.items.reduce(
            (acc, item) => acc + parseFloat(item.valor) * item.quantidade,
            0
          );
          setTotalValue(totalCartValue);
          setFormData((prevData) => ({
            ...prevData,
            valorVenda: totalCartValue,
          }));
        } else {
          alert("Carrinho não encontrado para este CPF.");
          setTotalValue(0);
          setFormData((prevData) => ({
            ...prevData,
            valorVenda: 0,
          }));
        }
      } else {
        alert("Nenhum cliente encontrado.");
        setClientFound(false);
      }
    } catch (error) {
      console.error("Erro ao buscar cliente:", error);
    } finally {
      setLoadingClientData(false);
    }
  };

  // ------------------------------------------------------------------------------------------------
  // HANDLE CHANGE GERAL
  // ------------------------------------------------------------------------------------------------
  const handleChange = (e) => {
    const { name, value } = e.target || {};

    if (name === "data") {
      setFormData((prevData) => ({
        ...prevData,
        data: value,
      }));
    } else if (name.startsWith("cardDetails.")) {
      const field = name.split(".")[1];
      const updatedCardDetails = {
        ...formData.cardDetails,
        [field]: value,
      };
      if (field === "cardNumber") {
        updatedCardDetails.bandeira = detectCardBrand(value);
      }
      setFormData((prevData) => ({
        ...prevData,
        cardDetails: updatedCardDetails,
      }));
    } else if (name.startsWith("downPaymentCardDetails.")) {
      const field = name.split(".")[1];
      const updatedDownPaymentCardDetails = {
        ...downPaymentCardDetails,
        [field]: value,
      };
      if (field === "cardNumber") {
        updatedDownPaymentCardDetails.bandeira = detectCardBrand(value);
      }
      setDownPaymentCardDetails(updatedDownPaymentCardDetails);
    } else if (name === "useSameCardDetails") {
      setUseSameCardDetails(e.target.checked);
      if (e.target.checked) {
        setDownPaymentCardDetails(formData.cardDetails);
      } else {
        setDownPaymentCardDetails({
          cardNumber: "",
          expiryDate: "",
          cvv: "",
          aut: "",
          bandeira: "",
        });
      }
    } else {
      setFormData((prevData) => ({
        ...prevData,
        [name]:
          name === "valorVenda" ||
            name === "entrada" ||
            name === "desconto" ||
            name === "parcelas" ||
            name === "pixPaymentAmount"
            ? parseFloat(value) || 0
            : value,
      }));
    }

    if (name === "formaPagamento") {
      handlePaymentMethodChange(value);
    }

    if (name === "condicaoPagamento") {
      setPaymentCondition(value);
      if (value === "Parcelado" && paymentMethod === "Cartão de Crédito") {
        setShowInstallments(true);
      } else {
        setShowInstallments(false);
        setInstallments(1);
      }
    }

    if (name === "downPaymentMethod") {
      handleDownPaymentMethodChange(value);
    }

    if (name === "downPaymentCondition") {
      setDownPaymentCondition(value);
      if (value === "Parcelado") {
        setShowDownPaymentInstallments(true);
      } else {
        setShowDownPaymentInstallments(false);
        setDownPaymentInstallments(1);
      }
    }
  };

  // ------------------------------------------------------------------------------------------------
  // GERA DESCRIÇÃO DA VENDA (EXIBIDA NO SALE DATA)
  // ------------------------------------------------------------------------------------------------
  const gerarDescricaoVenda = () => {
    let descricao = "";
    if (paymentMethod === "Crediário") {
      if (downPayment > 0) {
        descricao = `Venda a crediário com entrada de R$ ${downPayment.toFixed(
          2
        )} e ${installments} parcelas restantes.`;
      } else {
        descricao = `Venda a crediário sem entrada, com ${installments} parcelas a serem pagas.`;
      }
    } else if (paymentMethod === "Cartão de Crédito") {
      if (formData.cardDetails.length > 1) {
        descricao = "Venda parcelada em múltiplos cartões de crédito:\n";
        formData.cardDetails.forEach((card, index) => {
          descricao += `- Cartão ${index + 1} (${card.bandeira || "N/A"
            }): R$ ${card.amount.toFixed(2)} em ${card.installments
            } parcelas.\n`;
        });
      } else if (formData.cardDetails.length === 1) {
        const card = formData.cardDetails[0];
        if (paymentCondition === "Parcelado") {
          descricao = `Venda parcelada no cartão de crédito (${card.bandeira || "N/A"
            }) em ${installments} vezes.`;
        } else {
          descricao = `Venda à vista no cartão de crédito (${card.bandeira || "N/A"
            }).`;
        }
      } else {
        descricao = "Venda no cartão de crédito.";
      }
    } else if (paymentMethod === "Cartão de Débito") {
      if (formData.debitCardDetails.length > 1) {
        descricao = "Venda em múltiplos cartões de débito:\n";
        formData.debitCardDetails.forEach((card, index) => {
          descricao += `- Cartão ${index + 1} (${card.bandeira || "N/A"
            }): R$ ${card.amount.toFixed(2)}.\n`;
        });
      } else if (formData.debitCardDetails.length === 1) {
        const card = formData.debitCardDetails[0];
        descricao = `Venda no cartão de débito (${card.bandeira || "N/A"
          }) no valor de R$ ${card.amount.toFixed(2)}.`;
      } else {
        descricao = "Venda no cartão de débito.";
      }
    } else if (paymentMethod === "Pix") {
      descricao = "Venda à vista via Pix.";
    } else if (paymentMethod === "Dinheiro") {
      descricao = "Venda à vista em dinheiro.";
    } else if (paymentMethod === "Boleto") {
      descricao = "Venda à vista via boleto bancário.";
    } else {
      descricao = "Venda realizada.";
    }
    return descricao;
  };

  // ------------------------------------------------------------------------------------------------
  // HANDLE SUBMIT (FINALIZAR VENDA)
  // ------------------------------------------------------------------------------------------------
  const handleSubmit = async (e) => {
    e.preventDefault();
    if (loading) return;

    console.log("Iniciando validação do formulário...");
    // 1) CHAMA A FUNÇÃO DE VALIDAÇÃO
    const errors = validateForm(
      formData,
      paymentMethod,
      downPayment,
      downPaymentMethod,
      crediarioInstallments,
      additionalPayments
    );
    console.log("Erros de validação:", errors);
    if (Object.keys(errors).length > 0) {
      setFormErrors(errors);
      // (Opcional) scroll até o primeiro campo com erro
      const firstErrorField = Object.keys(errors)[0];
      document.getElementById(firstErrorField)?.scrollIntoView({
        behavior: "smooth",
        block: "center",
      });
      return;
    } else {
      setFormErrors({});
    }

    // 2) VERIFICA SE O CARRINHO E O CLIENTE ESTÃO OK
    console.log("Verificando cliente e carrinho...");
    if (!clientFound || cartItems.length === 0 || totalValue <= 0) {
      alert(
        "Por favor, busque o CPF e certifique-se de que o carrinho não esteja vazio."
      );
      return;
    }

    setLoading(true);

    // 3) PEGA DATA DO CAIXA
    let currentDate = new Date();
    let caixaDate = currentDate;
    const hour = currentDate.getHours();
    if (hour >= 18) {
      caixaDate = new Date(currentDate);
      caixaDate.setDate(caixaDate.getDate() + 1);
    }
    const formattedDate = `${caixaDate
      .getDate()
      .toString()
      .padStart(2, "0")}-${(caixaDate.getMonth() + 1)
        .toString()
        .padStart(2, "0")}-${caixaDate.getFullYear()}`;

    try {
      console.log("Preparando dados da venda...");
      const desconto = discount;
      const entrada = Number(downPayment) || 0;
      const lojaFirestore = formData.loja === "Loja 1" ? "loja1" : "loja2";
      const descricaoVenda = gerarDescricaoVenda();

      // MONTA DADOS DA VENDA
      const saleData = {
        title: `Venda ${formData.cpf}`,
        cpf: formData.cpf,
        debitCardDetails: formData.debitCardDetails,
        nome: formData.nome,
        telefone: formData.telefone,
        data: Timestamp.fromDate(formData.data),
        formaPagamento: paymentMethod,
        condicaoPagamento: paymentCondition,
        desconto: desconto,
        discountType: discountType,
        entrada: entrada,
        valorVenda: parseFloat(formData.valorVenda),
        valorFinal: finalValue,
        loja: lojaFirestore,
        parcelas: crediarioInstallments,
        creditCardInstallments: creditCardInstallments,
        items: cartItems,
        tipo: "vendas",
        descricao: descricaoVenda,
        dataRecebimento: receivingDate ? Timestamp.fromDate(receivingDate) : null,
        userId: user.uid,
        dataVenda: Timestamp.now(),
        downPaymentMethod: downPaymentMethod,
        cardDetails: formData.cardDetails,
        downPaymentCardDetails: downPaymentCardDetails,
        useSameCardDetails: useSameCardDetails,
        downPaymentInstallments: downPaymentInstallments,
      };

      console.log("Dados da venda montados:", saleData);

      // -------------------------------------------------------------------------
      // A) CHECA/ATUALIZA ESTOQUE ANTES DE CRIAR QUAISQUER DOCUMENTOS
      // -------------------------------------------------------------------------
      console.log("Verificando estoque antes de criar documentos...");
      await updateStock(cartItems, formData.loja);
      // Se faltar estoque, updateStock deve lançar um erro (throw Error(...)).
      // Assim o fluxo cai no catch e aborta a venda.

      // -------------------------------------------------------------------------
      // B) SE O ESTOQUE ESTÁ OK, PROSSEGUIR COM A CRIAÇÃO DOS DOCUMENTOS
      // -------------------------------------------------------------------------

      // SE NÃO FOR CREDIÁRIO/BOLETO OU SE TIVER ENTRADA > 0, LANÇA PAGAMENTO À VISTA
      if (
        (paymentMethod !== "Crediário" && paymentMethod !== "Boleto") ||
        entrada > 0
      ) {
        console.log("Processando pagamento à vista...");

        // DINHEIRO OU PIX
        if (paymentMethod === "Dinheiro" || paymentMethod === "Pix") {
          const cashflowData = {
            ...saleData,
            valorVenda: entrada > 0 ? entrada : saleData.valorFinal,
            formaPagamento: paymentMethod,
          };
          const cashflowRef = collection(firestore, "cashflow");
          await addDoc(cashflowRef, cashflowData);
          const transactionsRef = collection(
            firestore,
            `${lojaFirestore}/finances/caixas/${formattedDate}/transactions`
          );
          await addDoc(transactionsRef, cashflowData);
        }

        // CARTÃO DE CRÉDITO
        if (paymentMethod === "Cartão de Crédito") {
          const totalCreditCardAmount = formData.cardDetails.reduce(
            (sum, card) => sum + (card.amount || 0),
            0
          );
          const consolidatedCreditCardData = {
            ...saleData,
            valorVenda: totalCreditCardAmount,
            formaPagamento: "Cartão de Crédito",
            detalhesCartao: formData.cardDetails.map((card, index) => ({
              numeroParcelas: card.installments,
              bandeira: card.bandeira,
              valor: card.amount,
              idCartao: `Cartão ${index + 1}`,
            })),
          };
          await addDoc(collection(firestore, "cashflow"), consolidatedCreditCardData);
          await addDoc(
            collection(
              firestore,
              `${lojaFirestore}/finances/caixas/${formattedDate}/transactions`
            ),
            consolidatedCreditCardData
          );
        }

        // CARTÃO DE DÉBITO
        if (paymentMethod === "Cartão de Débito") {
          const totalDebitCardAmount = formData.debitCardDetails.reduce(
            (sum, card) => sum + (card.amount || 0),
            0
          );
          const consolidatedDebitCardData = {
            ...saleData,
            valorVenda: totalDebitCardAmount,
            formaPagamento: "Cartão de Débito",
            detalhesCartao: formData.debitCardDetails.map((card, index) => ({
              bandeira: card.bandeira,
              valor: card.amount,
              idCartao: `Cartão ${index + 1}`,
            })),
          };
          await addDoc(collection(firestore, "cashflow"), consolidatedDebitCardData);
          await addDoc(
            collection(
              firestore,
              `${lojaFirestore}/finances/caixas/${formattedDate}/transactions`
            ),
            consolidatedDebitCardData
          );
        }
      }

      // AGENDAR ENTRADA (SE O USUÁRIO ESCOLHEU)
      if (scheduleEntry && scheduledEntryDate) {
        console.log("Agendando entrada...");
        const entryCrediarioData = {
          title: `Entrada - ${formData.cpf}`,
          cpf: formData.cpf,
          nome: formData.nome,
          telefone: formData.telefone,
          data: Timestamp.now(),
          formaPagamento: "Crediário",
          condicaoPagamento: "A vista",
          valorVenda: downPayment,
          valorFinal: downPayment,
          loja: lojaFirestore,
          parcelas: 1,
          parcelasDetalhadas: [
            {
              numeroParcela: 1,
              valorParcela: downPayment,
              dataVencimento: scheduledEntryDate.toISOString().split("T")[0],
            },
          ],
          tipo: "entrada",
          descricao: `Entrada agendada no valor de R$ ${downPayment.toFixed(2)}`,
          dataRecebimento: Timestamp.fromDate(scheduledEntryDate),
          userId: user.uid,
        };
        await addDoc(collection(firestore, "a_receber"), entryCrediarioData);
        await addDoc(collection(firestore, "crediarios"), entryCrediarioData);
        await handleScheduleEntry();
      }

      // SE FOR CREDIÁRIO OU BOLETO, GERA PARCELAS
      let parcelasDetalhadas = [];
      if (paymentMethod === "Crediário" || paymentMethod === "Boleto") {
        console.log("Gerando parcelas para crediário ou boleto...");
        parcelasDetalhadas = gerarParcelas(
          new Date(),
          crediarioInstallments,
          finalValue
        );
        const receivableData = {
          ...saleData,
          parcelasDetalhadas,
        };
        if (paymentMethod === "Crediário") {
          await addDoc(collection(firestore, "a_receber"), receivableData);
          await addDoc(collection(firestore, "crediarios"), receivableData);
        }
        if (paymentMethod === "Boleto") {
          await addDoc(collection(firestore, "a_receber"), receivableData);
        }
      }

      // Certifique-se de que parcelasDetalhadas é um array
      parcelasDetalhadas = parcelasDetalhadas || [];

      // SALVA A VENDA EM "VENDAS"
      console.log("Salvando venda...");
      const vendaRef = await addDoc(collection(firestore, "vendas"), {
        ...saleData,
        parcelasDetalhadas,
      });
      const saleId = vendaRef.id;

      if (saleId) {
        console.log("Venda salva com sucesso, ID:", saleId);

        // GERA PDF
        await generatePDF(saleData, saleId, parcelasDetalhadas);

        // LIMPA CARRINHO
        const cartRef = doc(firestore, "cart", formData.cpf);
        await deleteDoc(cartRef);

        alert("Venda finalizada com sucesso!");
        router.push("/commercial/sales");
      }

      // LÓGICA PARA PAGAMENTOS ADICIONAIS (EXEMPLO)
      for (const pay of additionalPayments) {
        if (pay.method === "Cartão de Crédito") {
          console.log("Pagamento adicional no Cartão de Crédito:", pay);
        }
        if (pay.method === "Cartão de Débito") {
          console.log("Pagamento adicional no Cartão de Débito:", pay);
        }
        // etc...
      }
    } catch (error) {
      console.error("Erro ao finalizar a venda:", error);
      alert(error.message || "Erro ao finalizar a venda.");
    } finally {
      setLoading(false);
    }
  };


  const [endereco, setEndereco] = useState("");
  // ------------------------------------------------------------------------------------------------
  // UPDATE STOCK
  // ------------------------------------------------------------------------------------------------
  const updateStock = async (cartItems, loja) => {
    const batch = writeBatch(firestore);
    for (const item of cartItems) {
      let collectionName = "";
      if (item.categoria === "armacoes" || item.categoria === "armação") {
        collectionName =
          loja === "Loja 1" ? "loja1_armacoes" : "loja2_armacoes";
      } else if (item.categoria === "lentes") {
        collectionName = loja === "Loja 1" ? "loja1_lentes" : "loja2_lentes";
      } else if (item.categoria === "solares") {
        collectionName =
          loja === "Loja 1" ? "loja1_solares" : "loja2_solares";
      } else {
        console.error(
          `Categoria desconhecida para item: ${item.id} com categoria: ${item.categoria}`
        );
        continue;
      }
      if (!collectionName || !item.id) {
        console.error(`Nome da coleção ou ID do item faltando: ${item.id}`);
        continue;
      }
      const productRef = doc(firestore, collectionName, item.id);
      const productDoc = await getDoc(productRef);
      if (productDoc.exists()) {
        const productData = productDoc.data();
        const newQuantity = productData.quantidade - item.quantidade;
        if (newQuantity < 0) {
          throw new Error(`Estoque insuficiente para o produto ${item.produto}`);
        }
        batch.update(productRef, { quantidade: newQuantity });
      } else {
        console.error(`Produto não encontrado: ${item.id}`);
      }
    }
    await batch.commit();
  };

  // ------------------------------------------------------------------------------------------------
  // FUNÇÃO GERAR PARCELAS
  // ------------------------------------------------------------------------------------------------
  const gerarParcelas = (dataInicial, numParcelas, valorTotal) => {
    const parcelas = [];
    const valorParcela = parseFloat((valorTotal / numParcelas).toFixed(2));
    for (let i = 0; i < numParcelas; i++) {
      const dataParcela = new Date(dataInicial);
      dataParcela.setMonth(dataParcela.getMonth() + i);
      if (dataParcela.getDate() < dataInicial.getDate()) {
        dataParcela.setDate(0);
      }
      parcelas.push({
        numeroParcela: i + 1,
        valorParcela,
        dataVencimento: dataParcela.toISOString().split("T")[0],
      });
    }
    return parcelas;
  };

  const fetchClienteEndereco = async (cpfCliente) => {
    try {

      // Obter a referência ao documento no Firestore
      const clienteDocRef = doc(db, "consumers", cpfCliente);
      const clienteDoc = await getDoc(clienteDocRef);

      if (!clienteDoc.exists()) {
        return "Endereço do cliente não informado";
      }

      const clienteData = clienteDoc.data();

      // Montar o endereço
      const logradouro = clienteData.logradouro || "Logradouro não informado";
      const numero = clienteData.numero || "s/n";
      const bairro = clienteData.bairro || "Bairro não informado";
      const cidade = clienteData.cidade || "Cidade não informada";
      const estado = clienteData.estado || "Estado não informado";

      const enderecoFormatado = `${logradouro}, ${numero}, ${bairro}, ${cidade}, ${estado}`.trim();

      return enderecoFormatado;
    } catch (error) {
      return "Endereço do cliente não informado";
    }
  };


  const cpfCliente = "12345678912";
  fetchClienteEndereco(cpfCliente).then((enderecoRetornado) => {
    setEndereco(enderecoRetornado);
  });

  const generatePDF = async (saleData, saleId, parcelasDetalhadas) => {
    // ----------------------------------------------------------------------------
    // 1) Criar a instância do jsPDF
    // ----------------------------------------------------------------------------
    const doc = new jsPDF({
      orientation: "portrait",
      unit: "pt", // Se preferir mm, lembre-se de ajustar tudo (margens, colunas etc.).
      format: "a4",
    });

    // ----------------------------------------------------------------------------
    // 2) Configurações de layout e variáveis de posição
    // ----------------------------------------------------------------------------
    const marginLeft = 40;
    const marginTop = 50;
    const bottomMargin = 40;
    let cursorY = marginTop;
    const lineHeight = 14;

    // ----------------------------------------------------------------------------
    // 3) Função para verificar e criar nova página se precisar
    // ----------------------------------------------------------------------------
    const checkPageEnd = (neededHeight = 0) => {
      const pageHeight = doc.internal.pageSize.getHeight();
      if (cursorY + neededHeight > pageHeight - bottomMargin) {
        doc.addPage();
        cursorY = marginTop;
      }
    };

    // ----------------------------------------------------------------------------
    // 4) Função para desenhar textos multi-linha
    // ----------------------------------------------------------------------------
    const drawMultiLineText = (text, x, maxWidth, customLineHeight = lineHeight) => {
      const lines = doc.splitTextToSize(text, maxWidth);
      lines.forEach((line) => {
        checkPageEnd(customLineHeight);
        doc.text(line, x, cursorY);
        cursorY += customLineHeight;
      });
    };

    // ----------------------------------------------------------------------------
    // 5) Seção: Cabeçalho (Ótica Popular)
    // ----------------------------------------------------------------------------
    doc.setFont("helvetica", "bold");
    doc.setFontSize(12);

    const pageWidth = doc.internal.pageSize.getWidth();
    const centralText = "Ótica Popular";
    let centralTextWidth = doc.getTextWidth(centralText);
    doc.text(centralText, (pageWidth - centralTextWidth) / 2, cursorY);
    cursorY += lineHeight;

    doc.setFontSize(10);
    doc.setFont("helvetica", "normal");

    const infos = [
      "CNPJ: 10.187.550/0001-15",
      "Endereço: Rua Riachuelo, 510, Ed. J Benício, SL-02",
      "Telefone: (86) 99391-2222 / (86) 99595-6868",
    ];

    infos.forEach((info) => {
      checkPageEnd(lineHeight);
      const infoWidth = doc.getTextWidth(info);
      doc.text(info, (pageWidth - infoWidth) / 2, cursorY);
      cursorY += lineHeight;
    });

    cursorY += 20; // Espaço extra após cabeçalho

    // ----------------------------------------------------------------------------
    // 6) Seção: Dados do Cliente
    // ----------------------------------------------------------------------------
    // a) Cliente
    doc.setFont("helvetica", "bold");
    checkPageEnd(lineHeight);
    doc.text("Cliente:", marginLeft, cursorY);

    doc.setFont("helvetica", "normal");
    doc.text(`${saleData.nome}`, marginLeft + 45, cursorY);
    cursorY += lineHeight;

    // b) CPF
    doc.setFont("helvetica", "bold");
    checkPageEnd(lineHeight);
    doc.text("CPF:", marginLeft, cursorY);

    doc.setFont("helvetica", "normal");
    doc.text(`${saleData.cpf}`, marginLeft + 28, cursorY);
    cursorY += lineHeight;

    // c) Endereço
    const enderecoCliente = await fetchClienteEndereco(saleData.cpf);
    doc.setFont("helvetica", "bold");
    checkPageEnd(lineHeight);
    doc.text("Endereço:", marginLeft, cursorY);

    doc.setFont("helvetica", "normal");
    drawMultiLineText(enderecoCliente, marginLeft + 55, 500);

    // d) Telefones
    let telefonesCliente = [];
    if (Array.isArray(saleData.telefonesCliente)) {
      telefonesCliente = saleData.telefonesCliente;
    } else if (saleData.telefone) {
      telefonesCliente = [saleData.telefone];
    }

    doc.setFont("helvetica", "bold");
    checkPageEnd(lineHeight);
    doc.text("Telefone(s):", marginLeft, cursorY);

    doc.setFont("helvetica", "normal");
    doc.text(telefonesCliente.join(" / "), marginLeft + 65, cursorY);
    cursorY += 20;

    // ----------------------------------------------------------------------------
    // 7) Seção: Data de Emissão / Número do Documento
    // ----------------------------------------------------------------------------
    const dataVenda = saleData.data.toDate();
    const dataEmissao = dataVenda.toLocaleDateString("pt-BR");
    const horaEmissao = dataVenda.toLocaleTimeString("pt-BR", {
      hour: "2-digit",
      minute: "2-digit",
    });

    doc.setFont("helvetica", "bold");
    checkPageEnd(lineHeight);
    doc.text("Data de Emissão:", marginLeft, cursorY);

    doc.setFont("helvetica", "normal");
    doc.text(`${dataEmissao} às ${horaEmissao}`, marginLeft + 85, cursorY);
    cursorY += lineHeight;

    const numeroDocumento = saleId || "----";
    doc.setFont("helvetica", "bold");
    checkPageEnd(lineHeight);
    doc.text("Número do Documento:", marginLeft, cursorY);

    doc.setFont("helvetica", "normal");
    doc.text(`${numeroDocumento} - Via 1`, marginLeft + 115, cursorY);
    cursorY += 20;

    // ----------------------------------------------------------------------------
    // 8) Seção: Tabela de Produtos (autoTable lida com a quebra de página)
    // ----------------------------------------------------------------------------
    const bodyTable = saleData.items.map((item) => {
      const qtd = item.quantidade;
      const unidade = item.categoria === "lentes" ? "PA" : "PC";
      const codigo = item.id;
      const descricao = item.produto;
      const valorUnit = parseFloat(item.valor) || 0;
      const unitario = `R$ ${valorUnit.toFixed(2)}`;
      const total = `R$ ${(qtd * valorUnit).toFixed(2)}`;
      return [qtd, unidade, codigo, descricao, unitario, total];
    });

    doc.setFontSize(10);
    doc.autoTable({
      startY: cursorY,
      margin: { left: marginLeft, right: 40 },
      head: [["Quant.", "UN", "Código", "Descrição", "Unitário", "Total"]],
      body: bodyTable,
      theme: "grid",
      styles: { font: "helvetica", fontSize: 9, overflow: "linebreak" },
      headStyles: { fillColor: [147, 42, 131] },
      columnStyles: {
        0: { cellWidth: 35 },
        1: { cellWidth: 25 },
        2: { cellWidth: 50 },
        3: { cellWidth: 180, overflow: "linebreak" },
        4: { cellWidth: 60 },
        5: { cellWidth: 60 },
      },
      pageBreak: "auto",
      didDrawPage: (data) => {
        cursorY = data.cursor.y + 15;
      },
    });

    // Volta a fonte para 10pt, helvetica normal
    doc.setFontSize(10);
    doc.setFont("helvetica", "normal");

    // ----------------------------------------------------------------------------
    // 9) Subtotal, Desconto e Entrada
    // ----------------------------------------------------------------------------
    let finalY = cursorY;

    const subtotalSemDesconto = saleData.valorVenda || 0;
    const desconto = saleData.desconto || 0;
    const totalComDesconto = saleData.valorFinal || subtotalSemDesconto;
    const percentualDesconto =
      saleData.discountType === "%"
        ? `${desconto}%`
        : `R$ ${desconto.toFixed(2)}`;

    doc.setFont("helvetica", "bold");
    checkPageEnd(lineHeight);
    doc.text(`Subtotal (sem desconto): R$ ${subtotalSemDesconto.toFixed(2)}`, marginLeft, finalY);
    finalY += lineHeight;

    if (desconto > 0) {
      const valorDescontoReais =
        saleData.discountType === "%"
          ? (subtotalSemDesconto * desconto) / 100
          : desconto;

      checkPageEnd(lineHeight);
      doc.text(
        `Desconto de ${percentualDesconto}: R$ ${valorDescontoReais.toFixed(2)}`,
        marginLeft,
        finalY
      );
      finalY += lineHeight;
    }

    if (saleData.entrada && saleData.entrada > 0) {
      checkPageEnd(lineHeight);
      doc.text("Entrada:", marginLeft, finalY);

      doc.setFont("helvetica", "normal");
      doc.text(`R$ ${saleData.entrada.toFixed(2)}`, marginLeft + 50, finalY);
      finalY += 20;

      doc.setFont("helvetica", "bold");
    }

    checkPageEnd(lineHeight);
    doc.text(`Total a Pagar: R$ ${totalComDesconto.toFixed(2)}`, marginLeft, finalY);
    finalY += 20;

    // ----------------------------------------------------------------------------
    // 10) Detalhes da Forma de Pagamento
    // ----------------------------------------------------------------------------
    doc.setFont("helvetica", "bold");
    checkPageEnd(lineHeight);
    doc.text("Forma de Pagamento:", marginLeft, finalY);
    finalY += lineHeight;

    doc.setFont("helvetica", "normal");
    const metodoPagamento = saleData.formaPagamento || "Não informado";

    // ----------------------------------------------------------------------------
    // LÓGICA PRINCIPAL: Verificar o parcelamento
    // ----------------------------------------------------------------------------
    const isParcelado = parcelasDetalhadas && parcelasDetalhadas.length > 1;

    if (!isParcelado) {
      // -- Caso seja À VISTA (ou só 1 parcela):
      checkPageEnd(lineHeight);
      doc.text(
        parcelasDetalhadas?.length === 1
          ? `Pagamento: 1 Parcela (${metodoPagamento})`
          : "Pagamento à vista.",
        marginLeft,
        finalY
      );
      finalY += lineHeight;

      const dataPagamento = saleData.dataPagamento
        ? new Date(saleData.dataPagamento).toLocaleDateString("pt-BR")
        : new Date().toLocaleDateString("pt-BR");

      doc.text(`Método: ${metodoPagamento}`, marginLeft + 20, finalY);
      finalY += lineHeight;
      doc.text(`Data: ${dataPagamento}`, marginLeft + 20, finalY);
      finalY += lineHeight;

      finalY += 20;

      // -------------------------------------------------------------------------
      // 11) Assinatura do Cliente (mesma página, pois não é parcelado)
      // -------------------------------------------------------------------------
      checkPageEnd(54);
      doc.setFont("helvetica", "bold");
      doc.text("Assinatura do Cliente:", marginLeft, finalY);
      finalY += 40;

      doc.text(`${saleData.nome}`, marginLeft, finalY);
      finalY += lineHeight;
      doc.text(`CPF: ${saleData.cpf}`, marginLeft, finalY);
      finalY += lineHeight;

    } else {
      // -- Caso seja PARCELADO (mais de 1 parcela):
      checkPageEnd(lineHeight);
      doc.text(
        `Pagamento Parcelado (${metodoPagamento}) em ${parcelasDetalhadas.length} vezes.`,
        marginLeft,
        finalY
      );
      finalY += lineHeight;

      // Preview rápido das parcelas na página atual (opcional)
      parcelasDetalhadas.forEach((parcela, index) => {
        checkPageEnd(lineHeight);
        const resumo = `Parcela ${index + 1}: R$ ${parseFloat(parcela.valorParcela).toFixed(2)} (venc. ${parcela.dataVencimento})`;
        doc.text(resumo, marginLeft + 20, finalY);
        finalY += lineHeight;
      });

      finalY += 20;

      // 2) Agora sim, criamos NOVA PÁGINA para a Confissão, Tabela de Parcelas e Assinatura
      doc.addPage();
      cursorY = marginTop;

      // 2.1) Declaração de Confissão de Dívida (um parágrafo único)
      doc.setFont("helvetica", "bold");
      doc.text("8. Declaração de Confissão de Dívida", marginLeft, cursorY);
      cursorY += lineHeight;

      doc.setFont("helvetica", "normal");
      // Texto sem quebras manuais: um parágrafo único
      const declaracao = `Eu, ${saleData.nome}, portador do CPF nº ${saleData.cpf}, declaro que tenho uma dívida no valor de R$ ${totalComDesconto.toFixed(
        2
      )} referente à compra dos produtos acima discriminados, a ser paga em ${parcelasDetalhadas.length
        } parcela(s). Caso haja atraso no pagamento, incidirão juros e multa conforme previsto.`;

      drawMultiLineText(declaracao, marginLeft, 500);
      cursorY += 10;

      // 2.2) Tabela de Parcelas
      doc.setFont("helvetica", "bold");
      checkPageEnd(lineHeight);
      doc.text("Parcela   Data de Vencimento   Nº do Doc   Valor", marginLeft, cursorY);
      cursorY += lineHeight;

      doc.setFont("helvetica", "normal");
      parcelasDetalhadas.forEach((parcela) => {
        checkPageEnd(lineHeight);
        const textoParcela = `${parcela.numeroParcela}/${parcelasDetalhadas.length}`;
        const textoData = parcela.dataVencimento;
        const numDocParcela = saleId || "----";
        const valorParcela = `R$ ${parseFloat(parcela.valorParcela).toFixed(2)}`;

        const linha = `${textoParcela}           ${textoData}           ${numDocParcela}           ${valorParcela}`;
        doc.text(linha, marginLeft, cursorY);
        cursorY += lineHeight;
      });

      cursorY += 20;

      // 2.3) Assinatura do Cliente (na NOVA página)
      checkPageEnd(54);
      doc.setFont("helvetica", "bold");
      doc.text("Assinatura do Cliente:", marginLeft, cursorY);
      cursorY += 40;

      doc.text(`${saleData.nome}`, marginLeft, cursorY);
      cursorY += lineHeight;
      doc.text(`CPF: ${saleData.cpf}`, marginLeft, cursorY);
      cursorY += lineHeight;
    }

    // ----------------------------------------------------------------------------
    // 12) Gerar Blob e fazer Upload
    // ----------------------------------------------------------------------------
    const pdfBlob = doc.output("blob");
    await uploadPDFToFirebase(pdfBlob, saleData.cpf, saleId);
  };






  // ------------------------------------------------------------------------------------------------
  // FUNÇÃO UPLOAD PDF PARA STORAGE
  // ------------------------------------------------------------------------------------------------
  const uploadPDFToFirebase = async (pdfBlob, cpf, saleId) => {
    const storage = getStorage();
    const storageRef = ref(
      storage,
      `comercial_vendas/${cpf}/${saleId}/venda_${cpf}_${saleId}.pdf`
    );

    const uploadTask = uploadBytesResumable(storageRef, pdfBlob);
    uploadTask.on(
      "state_changed",
      (snapshot) => {
        const progress =
          (snapshot.bytesTransferred / snapshot.totalBytes) * 100;
      },
      (error) => {
      },
      () => {
        getDownloadURL(uploadTask.snapshot.ref).then((downloadURL) => {
        });
      }
    );
  };

  // ------------------------------------------------------------------------------------------------
  // ALTERAÇÕES EM DADOS DO CARTÃO DE ENTRADA
  // ------------------------------------------------------------------------------------------------
  const handleDownPaymentCardDetailChange = (field, value) => {
    const updatedDetails = { ...downPaymentCardDetails, [field]: value };
    if (field === "cardNumber") {
      updatedDetails.bandeira = detectCardBrand(value);
    }
    setDownPaymentCardDetails(updatedDetails);
  };

  // ------------------------------------------------------------------------------------------------
  // RENDER
  // ------------------------------------------------------------------------------------------------
  return (
    <Layout>
      <div className="p-6">
        <h1 className="text-2xl font-bold mb-4" style={{ color: "#81059e" }}>
          NOVA VENDA
        </h1>

        <form
          onSubmit={handleSubmit}
          className="bg-white p-6 rounded-lg shadow-md space-y-4"
        >
          {/* CAMPO CPF + BOTÃO BUSCAR */}
          <div className="flex space-x-4">
            <div className="w-full">
              <label
                htmlFor="cpf"
                className="block text-sm font-bold mb-1"
                style={{ color: "#81059e87" }}
              >
                CPF
              </label>
              <input
                id="cpf"
                type="text"
                name="cpf"
                value={formData.cpf}
                onChange={handleChange}
                placeholder="Buscar CPF"
                className={`border border-gray-300 p-2 rounded-lg w-full text-black ${formErrors.cpf ? "border-red-500" : ""
                  }`}
              />
              {formErrors.cpf && (
                <p className="text-red-600 text-sm mt-1">{formErrors.cpf}</p>
              )}
            </div>
            <button
              type="button"
              onClick={() => handleSearchCPF()}
              className="bg-[#81059e] text-white font-bold px-4 py-2 rounded-lg self-end"
              disabled={loadingClientData}
              style={{ height: "42px" }}
            >
              {loadingClientData ? "Buscando..." : "Buscar"}
            </button>
          </div>

          {/* NOME / TELEFONE (SOMENTE SE CLIENTFOUND, MAS MESMO ASSIM VALIDA) */}
          <div>
            <label
              htmlFor="nome"
              className="block text-sm font-bold mb-1"
              style={{ color: "#81059e87" }}
            >
              Nome
            </label>
            <input
              id="nome"
              type="text"
              name="nome"
              value={formData.nome}
              onChange={handleChange}
              placeholder="Nome do cliente"
              className={`border border-gray-300 p-2 rounded-lg w-full text-black ${formErrors.nome ? "border-red-500" : ""
                }`}
              readOnly={clientFound}
            />
            {formErrors.nome && (
              <p className="text-red-600 text-sm mt-1">{formErrors.nome}</p>
            )}
          </div>

          <div>
            <label
              htmlFor="telefone"
              className="block text-sm font-bold mb-1"
              style={{ color: "#81059e87" }}
            >
              Telefone
            </label>
            <input
              id="telefone"
              type="text"
              name="telefone"
              value={formData.telefone}
              onChange={handleChange}
              placeholder="Telefone"
              className={`border border-gray-300 p-2 rounded-lg w-full text-black ${formErrors.telefone ? "border-red-500" : ""
                }`}
              readOnly={clientFound}
            />
            {formErrors.telefone && (
              <p className="text-red-600 text-sm mt-1">{formErrors.telefone}</p>
            )}
          </div>

          {/* LOJA */}
          <div>
            <label
              htmlFor="loja"
              className="block text-sm font-bold mb-1"
              style={{ color: "#81059e87" }}
            >
              Loja
            </label>
            <select
              id="loja"
              name="loja"
              value={formData.loja}
              onChange={handleChange}
              className={`border border-gray-300 p-2 rounded-lg w-full text-black ${formErrors.loja ? "border-red-500" : ""
                }`}
            >
              <option value="Loja 1">Loja 1</option>
              <option value="Loja 2">Loja 2</option>
            </select>
            {formErrors.loja && (
              <p className="text-red-600 text-sm mt-1">{formErrors.loja}</p>
            )}
          </div>

          {/* DATA */}
          <div>
            <label
              htmlFor="data"
              className="block text-sm font-bold mb-1"
              style={{ color: "#81059e87" }}
            >
              Data
            </label>
            <DatePicker
              id="data"
              selected={formData.data}
              onChange={(date) =>
                handleChange({ target: { name: "data", value: date } })
              }
              dateFormat="dd/MM/yyyy"
              className="border border-gray-300 p-2 rounded-lg w-full text-black"
            />
          </div>

          {/* TIPO DE DESCONTO */}
          <div>
            <label
              htmlFor="discountType"
              className="block text-sm font-bold mb-1"
              style={{ color: "#81059e87" }}
            >
              Tipo de Desconto
            </label>
            <select
              id="discountType"
              name="discountType"
              value={discountType}
              onChange={(e) => setDiscountType(e.target.value)}
              className="border border-gray-300 p-2 rounded-lg w-full text-black"
            >
              <option value="%">Porcentagem (%)</option>
              <option value="R$">Valor (R$)</option>
            </select>
          </div>

          {/* VALOR DO DESCONTO */}
          <div>
            <label
              htmlFor="desconto"
              className="block text-sm font-bold mb-1"
              style={{ color: "#81059e87" }}
            >
              Desconto
            </label>
            <CurrencyInput
              id="desconto"
              name="desconto"
              placeholder={discountType === "%" ? "% de desconto" : "R$ 0,00"}
              value={discount}
              decimalsLimit={2}
              decimalSeparator=","
              groupSeparator="."
              prefix={discountType === "R$" ? "R$ " : ""}
              suffix={discountType === "%" ? "%" : ""}
              onValueChange={(value) => {
                setDiscount(parseFloat(value) || 0);
              }}
              className="border border-gray-300 p-2 rounded-lg w-full text-black"
            />
          </div>

          {/* FORMA DE PAGAMENTO */}
          <div>
            <label
              htmlFor="formaPagamento"
              className="block text-sm font-bold mb-1"
              style={{ color: "#81059e87" }}
            >
              Forma de Pagamento
            </label>
            <select
              id="formaPagamento"
              name="formaPagamento"
              value={paymentMethod}
              onChange={(e) => handleChange(e)}
              className={`border border-gray-300 p-2 rounded-lg w-full text-black ${formErrors.formaPagamento ? "border-red-500" : ""
                }`}
            >
              <option value="Pix">Pix</option>
              <option value="Dinheiro">Dinheiro</option>
              <option value="Cartão de Crédito">Cartão de Crédito</option>
              <option value="Cartão de Débito">Cartão de Débito</option>
              <option value="Boleto">Boleto</option>
              <option value="Crediário">Crediário</option>
            </select>
            {formErrors.formaPagamento && (
              <p className="text-red-600 text-sm mt-1">
                {formErrors.formaPagamento}
              </p>
            )}

            {/* Se for Crediário */}
            {paymentMethod === "Crediário" && (
              <div className="mt-2">
                <label
                  className="block text-sm font-bold mb-1"
                  style={{ color: "#81059e87" }}
                >
                  Número de Parcelas (Crediário)
                </label>
                <input
                  type="number"
                  name="crediarioParcelas"
                  value={crediarioInstallments}
                  onChange={(e) =>
                    setCrediarioInstallments(Number(e.target.value))
                  }
                  min={1}
                  placeholder="Digite o número de parcelas"
                  className={`border border-gray-300 p-2 rounded-lg w-full text-black ${formErrors.crediarioInstallments ? "border-red-500" : ""
                    }`}
                />
                {formErrors.crediarioInstallments && (
                  <p className="text-red-600 text-sm mt-1">
                    {formErrors.crediarioInstallments}
                  </p>
                )}
              </div>
            )}

            {/* Se for Boleto */}
            {paymentMethod === "Boleto" && (
              <div className="mt-2">
                <label
                  className="block text-sm font-bold mb-1"
                  style={{ color: "#81059e87" }}
                >
                  Número de Parcelas (Boleto)
                </label>
                <input
                  type="number"
                  name="boletoParcelas"
                  value={crediarioInstallments}
                  onChange={(e) =>
                    setCrediarioInstallments(Number(e.target.value))
                  }
                  min={1}
                  placeholder="Digite o número de parcelas para boleto"
                  className={`border border-gray-300 p-2 rounded-lg w-full text-black ${formErrors.crediarioInstallments ? "border-red-500" : ""
                    }`}
                />
                {formErrors.crediarioInstallments && (
                  <p className="text-red-600 text-sm mt-1">
                    {formErrors.crediarioInstallments}
                  </p>
                )}
              </div>
            )}

            {/* Se for Dinheiro/Pix, valor é obrigatório */}
            {(paymentMethod === "Dinheiro" || paymentMethod === "Pix") && (
              <div className="mt-2">
                <label
                  htmlFor="paymentValue"
                  className="block text-sm font-bold mb-1"
                  style={{ color: "#81059e87" }}
                >
                  Valor em {paymentMethod}
                </label>
                <CurrencyInput
                  id="paymentValue"
                  name="pixPaymentAmount"
                  placeholder="R$ 0,00"
                  value={formData.pixPaymentAmount || 0}
                  decimalsLimit={2}
                  decimalSeparator=","
                  groupSeparator="."
                  prefix="R$ "
                  onValueChange={(value) => {
                    setFormData((prevData) => ({
                      ...prevData,
                      pixPaymentAmount: parseFloat(value) || 0,
                    }));
                  }}
                  className={`border border-gray-300 p-2 rounded-lg w-full text-black ${formErrors.pixPaymentAmount ? "border-red-500" : ""
                    }`}
                />
                {formErrors.pixPaymentAmount && (
                  <p className="text-red-600 text-sm mt-1">
                    {formErrors.pixPaymentAmount}
                  </p>
                )}
              </div>
            )}

            {/* Botão de adicionar pagamentos adicionais */}
            <div className="mt-4">
              <button
                type="button"
                onClick={handleAddPaymentMethod}
                className="bg-blue-500 text-white font-bold px-4 py-2 rounded-lg"
              >
                Adicionar Método de Pagamento
              </button>
            </div>

            {/* Lista de pagamentos adicionais */}
            {additionalPayments.map((payment) => (
              <div
                key={payment.id}
                className="additional-payment-section border p-4 my-2 rounded-lg shadow-md"
              >
                <h4
                  className="text-lg font-bold mb-4"
                  style={{ color: "#81059e87" }}
                >
                  Método de Pagamento Adicional
                </h4>

                {/* Método */}
                <div>
                  <label
                    className="block text-sm font-bold mb-1"
                    style={{ color: "#81059e87" }}
                  >
                    Método
                  </label>
                  <select
                    value={payment.method}
                    onChange={(e) =>
                      handleAdditionalPaymentChange(
                        payment.id,
                        "method",
                        e.target.value
                      )
                    }
                    className={`border border-gray-300 p-2 rounded-lg w-full text-black ${formErrors[`additionalMethod_${payment.id}`]
                        ? "border-red-500"
                        : ""
                      }`}
                  >
                    <option value="">Selecione</option>
                    <option value="Pix">Pix</option>
                    <option value="Dinheiro">Dinheiro</option>
                    <option value="Boleto">Boleto</option>
                    <option value="Crediário">Crediário</option>
                    <option value="Cartão de Crédito">Cartão de Crédito</option>
                    <option value="Cartão de Débito">Cartão de Débito</option>
                  </select>
                  {formErrors[`additionalMethod_${payment.id}`] && (
                    <p className="text-red-600 text-sm mt-1">
                      {formErrors[`additionalMethod_${payment.id}`]}
                    </p>
                  )}
                </div>

                {/* Valor */}
                <div>
                  <label
                    className="block text-sm font-bold mb-1"
                    style={{ color: "#81059e87" }}
                  >
                    Valor
                  </label>
                  <CurrencyInput
                    name={`additionalPaymentValue_${payment.id}`}
                    placeholder="R$ 0,00"
                    value={payment.value || 0}
                    decimalsLimit={2}
                    decimalSeparator=","
                    groupSeparator="."
                    prefix="R$ "
                    onValueChange={(val) => {
                      const parsedVal = parseFloat(val) || 0;
                      handleAdditionalPaymentChange(payment.id, "value", parsedVal);
                      handleAdditionalPaymentChange(payment.id, "amount", parsedVal);
                    }}
                    className={`border border-gray-300 p-2 rounded-lg w-full text-black ${formErrors[`additionalValue_${payment.id}`]
                        ? "border-red-500"
                        : ""
                      }`}
                  />
                  {formErrors[`additionalValue_${payment.id}`] && (
                    <p className="text-red-600 text-sm mt-1">
                      {formErrors[`additionalValue_${payment.id}`]}
                    </p>
                  )}
                </div>

                {/* Se boleto ou crediário, parcelas e data inicial */}
                {(payment.method === "Boleto" ||
                  payment.method === "Crediário") && (
                    <>
                      <div>
                        <label
                          className="block text-sm font-bold mb-1"
                          style={{ color: "#81059e87" }}
                        >
                          Número de Parcelas
                        </label>
                        <input
                          type="number"
                          value={payment.installments || 1}
                          onChange={(e) =>
                            handleAdditionalPaymentChange(
                              payment.id,
                              "installments",
                              parseInt(e.target.value, 10) || 1
                            )
                          }
                          min={1}
                          className="border border-gray-300 p-2 rounded-lg w-full text-black"
                        />
                      </div>

                      <div>
                        <label
                          className="block text-sm font-bold mb-1"
                          style={{ color: "#81059e87" }}
                        >
                          Data de Vencimento Inicial
                        </label>
                        <DatePicker
                          selected={payment.startDate || new Date()}
                          onChange={(date) =>
                            handleAdditionalPaymentChange(payment.id, "startDate", date)
                          }
                          dateFormat="dd/MM/yyyy"
                          className="border border-gray-300 p-2 rounded-lg w-full text-black"
                        />
                      </div>
                    </>
                  )}

                {/* Se cartão de crédito adicional */}
                {payment.method === "Cartão de Crédito" && (
                  <>
                    <div>
                      <label
                        className="block text-sm font-bold mb-1"
                        style={{ color: "#81059e87" }}
                      >
                        Parcelas (Crédito)
                      </label>
                      <input
                        type="number"
                        min={1}
                        value={payment.installments || 1}
                        onChange={(e) =>
                          handleAdditionalPaymentChange(
                            payment.id,
                            "installments",
                            parseInt(e.target.value, 10) || 1
                          )
                        }
                        className="border border-gray-300 p-2 rounded-lg w-full text-black"
                        placeholder="Número de parcelas"
                      />
                    </div>

                    <div>
                      <label
                        className="block text-sm font-bold mb-1"
                        style={{ color: "#81059e87" }}
                      >
                        Número do Cartão (Crédito)
                      </label>
                      <input
                        type="text"
                        value={payment.cardNumber || ""}
                        onChange={(e) => {
                          handleAdditionalPaymentChange(
                            payment.id,
                            "cardNumber",
                            e.target.value
                          );
                          handleAdditionalPaymentCardBrand(payment.id, e.target.value);
                        }}
                        placeholder="Número do Cartão"
                        className={`border border-gray-300 p-2 rounded-lg w-full text-black ${formErrors[`additionalCardNumber_${payment.id}`]
                            ? "border-red-500"
                            : ""
                          }`}
                      />
                      {formErrors[`additionalCardNumber_${payment.id}`] && (
                        <p className="text-red-600 text-sm mt-1">
                          {formErrors[`additionalCardNumber_${payment.id}`]}
                        </p>
                      )}
                    </div>

                    <div className="flex space-x-4">
                      <div className="w-1/2">
                        <label
                          className="block text-sm font-bold mb-1"
                          style={{ color: "#81059e87" }}
                        >
                          Validade (Crédito)
                        </label>
                        <input
                          type="text"
                          value={payment.expiryDate || ""}
                          onChange={(e) =>
                            handleAdditionalPaymentChange(
                              payment.id,
                              "expiryDate",
                              e.target.value
                            )
                          }
                          placeholder="MM/AA"
                          className={`border border-gray-300 p-2 rounded-lg w-full text-black ${formErrors[`additionalExpiryDate_${payment.id}`]
                              ? "border-red-500"
                              : ""
                            }`}
                        />
                        {formErrors[`additionalExpiryDate_${payment.id}`] && (
                          <p className="text-red-600 text-sm mt-1">
                            {formErrors[`additionalExpiryDate_${payment.id}`]}
                          </p>
                        )}
                      </div>
                      <div className="w-1/2">
                        <label
                          className="block text-sm font-bold mb-1"
                          style={{ color: "#81059e87" }}
                        >
                          CVV (Crédito)
                        </label>
                        <input
                          type="text"
                          value={payment.cvv || ""}
                          onChange={(e) =>
                            handleAdditionalPaymentChange(payment.id, "cvv", e.target.value)
                          }
                          placeholder="CVV"
                          className={`border border-gray-300 p-2 rounded-lg w-full text-black ${formErrors[`additionalCvv_${payment.id}`]
                              ? "border-red-500"
                              : ""
                            }`}
                        />
                        {formErrors[`additionalCvv_${payment.id}`] && (
                          <p className="text-red-600 text-sm mt-1">
                            {formErrors[`additionalCvv_${payment.id}`]}
                          </p>
                        )}
                      </div>
                    </div>

                    <div>
                      <label
                        className="block text-sm font-bold mb-1"
                        style={{ color: "#81059e87" }}
                      >
                        AUT (Crédito)
                      </label>
                      <input
                        type="text"
                        value={payment.aut || ""}
                        onChange={(e) =>
                          handleAdditionalPaymentChange(payment.id, "aut", e.target.value)
                        }
                        placeholder="Código de Autorização"
                        className="border border-gray-300 p-2 rounded-lg w-full text-black"
                      />
                    </div>

                    <div>
                      <label
                        className="block text-sm font-bold mb-1"
                        style={{ color: "#81059e87" }}
                      >
                        Bandeira (Crédito)
                      </label>
                      <input
                        type="text"
                        value={payment.bandeira || ""}
                        readOnly
                        className="border border-gray-300 p-2 rounded-lg w-full text-black"
                      />
                    </div>
                  </>
                )}

                {/* Se cartão de débito adicional */}
                {payment.method === "Cartão de Débito" && (
                  <>
                    <div>
                      <label
                        className="block text-sm font-bold mb-1"
                        style={{ color: "#81059e87" }}
                      >
                        Número do Cartão (Débito)
                      </label>
                      <input
                        type="text"
                        value={payment.cardNumber || ""}
                        onChange={(e) => {
                          handleAdditionalPaymentChange(
                            payment.id,
                            "cardNumber",
                            e.target.value
                          );
                          handleAdditionalPaymentCardBrand(payment.id, e.target.value);
                        }}
                        placeholder="Número do Cartão"
                        className={`border border-gray-300 p-2 rounded-lg w-full text-black ${formErrors[`additionalCardNumber_${payment.id}`]
                            ? "border-red-500"
                            : ""
                          }`}
                      />
                      {formErrors[`additionalCardNumber_${payment.id}`] && (
                        <p className="text-red-600 text-sm mt-1">
                          {formErrors[`additionalCardNumber_${payment.id}`]}
                        </p>
                      )}
                    </div>

                    <div className="flex space-x-4">
                      <div className="w-1/2">
                        <label
                          className="block text-sm font-bold mb-1"
                          style={{ color: "#81059e87" }}
                        >
                          Validade (Débito)
                        </label>
                        <input
                          type="text"
                          value={payment.expiryDate || ""}
                          onChange={(e) =>
                            handleAdditionalPaymentChange(
                              payment.id,
                              "expiryDate",
                              e.target.value
                            )
                          }
                          placeholder="MM/AA"
                          className={`border border-gray-300 p-2 rounded-lg w-full text-black ${formErrors[`additionalExpiryDate_${payment.id}`]
                              ? "border-red-500"
                              : ""
                            }`}
                        />
                        {formErrors[`additionalExpiryDate_${payment.id}`] && (
                          <p className="text-red-600 text-sm mt-1">
                            {formErrors[`additionalExpiryDate_${payment.id}`]}
                          </p>
                        )}
                      </div>
                      <div className="w-1/2">
                        <label
                          className="block text-sm font-bold mb-1"
                          style={{ color: "#81059e87" }}
                        >
                          CVV (Débito)
                        </label>
                        <input
                          type="text"
                          value={payment.cvv || ""}
                          onChange={(e) =>
                            handleAdditionalPaymentChange(payment.id, "cvv", e.target.value)
                          }
                          placeholder="CVV"
                          className={`border border-gray-300 p-2 rounded-lg w-full text-black ${formErrors[`additionalCvv_${payment.id}`]
                              ? "border-red-500"
                              : ""
                            }`}
                        />
                        {formErrors[`additionalCvv_${payment.id}`] && (
                          <p className="text-red-600 text-sm mt-1">
                            {formErrors[`additionalCvv_${payment.id}`]}
                          </p>
                        )}
                      </div>
                    </div>

                    <div>
                      <label
                        className="block text-sm font-bold mb-1"
                        style={{ color: "#81059e87" }}
                      >
                        AUT (Débito)
                      </label>
                      <input
                        type="text"
                        value={payment.aut || ""}
                        onChange={(e) =>
                          handleAdditionalPaymentChange(payment.id, "aut", e.target.value)
                        }
                        placeholder="Código de Autorização"
                        className="border border-gray-300 p-2 rounded-lg w-full text-black"
                      />
                    </div>

                    <div>
                      <label
                        className="block text-sm font-bold mb-1"
                        style={{ color: "#81059e87" }}
                      >
                        Bandeira (Débito)
                      </label>
                      <input
                        type="text"
                        value={payment.bandeira || ""}
                        readOnly
                        className="border border-gray-300 p-2 rounded-lg w-full text-black"
                      />
                    </div>
                  </>
                )}

                <button
                  type="button"
                  onClick={() => handleRemovePaymentMethod(payment.id)}
                  className="bg-red-500 text-white font-bold px-4 py-2 rounded-lg mt-4"
                >
                  Remover
                </button>
              </div>
            ))}
          </div>

          {/* SE CARTÃO DE CRÉDITO (PRINCIPAL) */}
          {paymentMethod === "Cartão de Crédito" && (
            <>
              {formData.cardDetails.map((card, index) => (
                <div
                  key={index}
                  className="card-detail-section border p-4 my-2 rounded-lg shadow-md"
                >
                  <h4
                    className="text-lg font-bold mb-4"
                    style={{ color: "#81059e87" }}
                  >
                    Cartão {index + 1}
                  </h4>

                  <div>
                    <label
                      className="block text-sm font-bold mb-1"
                      style={{ color: "#81059e87" }}
                    >
                      Número de Parcelas (Cartão {index + 1})
                    </label>
                    <input
                      type="number"
                      min={1}
                      value={card.installments}
                      onChange={(e) =>
                        handleCardDetailChange(index, "installments", Number(e.target.value))
                      }
                      className={`border border-gray-300 p-2 rounded-lg w-full text-black ${formErrors.cardDetails ? "border-red-500" : ""
                        }`}
                      placeholder="Digite o número de parcelas"
                    />
                  </div>

                  <div>
                    <label
                      className="block text-sm font-bold mb-1"
                      style={{ color: "#81059e87" }}
                    >
                      Valor
                    </label>
                    <CurrencyInput
                      name={`cardValue_${index}`}
                      placeholder="R$ 0,00"
                      value={card.amount || 0}
                      decimalsLimit={2}
                      decimalSeparator=","
                      groupSeparator="."
                      prefix="R$ "
                      onValueChange={(value) =>
                        handleCardDetailChange(
                          index,
                          "amount",
                          parseFloat(value) || 0
                        )
                      }
                      className="border border-gray-300 p-2 rounded-lg w-full text-black"
                    />
                  </div>

                  <div>
                    <label
                      className="block text-sm font-bold mb-1"
                      style={{ color: "#81059e87" }}
                    >
                      Número do Cartão
                    </label>
                    <input
                      type="text"
                      value={card.cardNumber}
                      onChange={(e) =>
                        handleCardDetailChange(index, "cardNumber", e.target.value)
                      }
                      placeholder="Número do Cartão"
                      className={`border border-gray-300 p-2 rounded-lg w-full text-black ${formErrors[`cardNumber_${index}`] ? "border-red-500" : ""
                        }`}
                    />
                    {formErrors[`cardNumber_${index}`] && (
                      <p className="text-red-600 text-sm mt-1">
                        {formErrors[`cardNumber_${index}`]}
                      </p>
                    )}
                  </div>

                  <div className="flex space-x-4">
                    <div className="w-1/2">
                      <label
                        className="block text-sm font-bold mb-1"
                        style={{ color: "#81059e87" }}
                      >
                        Validade
                      </label>
                      <input
                        type="text"
                        value={card.expiryDate}
                        onChange={(e) =>
                          handleCardDetailChange(index, "expiryDate", e.target.value)
                        }
                        placeholder="MM/AA"
                        className={`border border-gray-300 p-2 rounded-lg w-full text-black ${formErrors[`expiryDate_${index}`] ? "border-red-500" : ""
                          }`}
                      />
                      {formErrors[`expiryDate_${index}`] && (
                        <p className="text-red-600 text-sm mt-1">
                          {formErrors[`expiryDate_${index}`]}
                        </p>
                      )}
                    </div>
                    <div className="w-1/2">
                      <label
                        className="block text-sm font-bold mb-1"
                        style={{ color: "#81059e87" }}
                      >
                        CVV
                      </label>
                      <input
                        type="text"
                        value={card.cvv}
                        onChange={(e) =>
                          handleCardDetailChange(index, "cvv", e.target.value)
                        }
                        placeholder="CVV"
                        className={`border border-gray-300 p-2 rounded-lg w-full text-black ${formErrors[`cvv_${index}`] ? "border-red-500" : ""
                          }`}
                      />
                      {formErrors[`cvv_${index}`] && (
                        <p className="text-red-600 text-sm mt-1">
                          {formErrors[`cvv_${index}`]}
                        </p>
                      )}
                    </div>
                  </div>

                  <div>
                    <label
                      className="block text-sm font-bold mb-1"
                      style={{ color: "#81059e87" }}
                    >
                      Bandeira
                    </label>
                    <input
                      type="text"
                      value={card.bandeira}
                      readOnly
                      className="border border-gray-300 p-2 rounded-lg w-full text-black"
                    />
                  </div>

                  <button
                    type="button"
                    onClick={() => handleRemoveCard(index)}
                    className="bg-red-500 text-white font-bold px-4 py-2 rounded-lg mt-4"
                  >
                    Remover este cartão
                  </button>
                </div>
              ))}

              <button
                type="button"
                onClick={handleAddCard}
                className="bg-blue-500 text-white font-bold px-4 py-2 rounded-lg mt-4"
              >
                Adicionar outro cartão
              </button>
            </>
          )}

          {/* SE CARTÃO DE DÉBITO (PRINCIPAL) */}
          {paymentMethod === "Cartão de Débito" && (
            <>
              {formData.debitCardDetails.map((card, index) => (
                <div
                  key={index}
                  className="card-detail-section border p-4 my-2 rounded-lg shadow-md"
                >
                  <h4
                    className="text-lg font-bold mb-4"
                    style={{ color: "#81059e87" }}
                  >
                    Cartão Débito {index + 1}
                  </h4>

                  <div>
                    <label
                      className="block text-sm font-bold mb-1"
                      style={{ color: "#81059e87" }}
                    >
                      Valor
                    </label>
                    <CurrencyInput
                      name={`cardValue_${index}`}
                      placeholder="R$ 0,00"
                      value={card.amount || 0}
                      decimalsLimit={2}
                      decimalSeparator=","
                      groupSeparator="."
                      prefix="R$ "
                      onValueChange={(value) =>
                        handleDebitCardDetailChange(
                          index,
                          "amount",
                          parseFloat(value) || 0
                        )
                      }
                      className="border border-gray-300 p-2 rounded-lg w-full text-black"
                    />
                  </div>

                  <div>
                    <label
                      className="block text-sm font-bold mb-1"
                      style={{ color: "#81059e87" }}
                    >
                      Número do Cartão
                    </label>
                    <input
                      type="text"
                      value={card.cardNumber}
                      onChange={(e) =>
                        handleDebitCardDetailChange(index, "cardNumber", e.target.value)
                      }
                      placeholder="Número do Cartão"
                      className={`border border-gray-300 p-2 rounded-lg w-full text-black ${formErrors.debitCardDetails ? "border-red-500" : ""
                        }`}
                    />
                  </div>

                  <div className="flex space-x-4">
                    <div className="w-1/2">
                      <label
                        className="block text-sm font-bold mb-1"
                        style={{ color: "#81059e87" }}
                      >
                        Validade
                      </label>
                      <input
                        type="text"
                        value={card.expiryDate}
                        onChange={(e) =>
                          handleDebitCardDetailChange(index, "expiryDate", e.target.value)
                        }
                        placeholder="MM/AA"
                        className={`border border-gray-300 p-2 rounded-lg w-full text-black ${formErrors[`debitCardExpiryDate_${index}`]
                            ? "border-red-500"
                            : ""
                          }`}
                      />
                      {formErrors[`debitCardExpiryDate_${index}`] && (
                        <p className="text-red-600 text-sm mt-1">
                          {formErrors[`debitCardExpiryDate_${index}`]}
                        </p>
                      )}
                    </div>

                    <div className="w-1/2">
                      <label
                        className="block text-sm font-bold mb-1"
                        style={{ color: "#81059e87" }}
                      >
                        CVV
                      </label>
                      <input
                        type="text"
                        value={card.cvv}
                        onChange={(e) =>
                          handleDebitCardDetailChange(index, "cvv", e.target.value)
                        }
                        placeholder="CVV"
                        className={`border border-gray-300 p-2 rounded-lg w-full text-black ${formErrors[`debitCardCvv_${index}`] ? "border-red-500" : ""
                          }`}
                      />
                      {formErrors[`debitCardCvv_${index}`] && (
                        <p className="text-red-600 text-sm mt-1">
                          {formErrors[`debitCardCvv_${index}`]}
                        </p>
                      )}
                    </div>
                  </div>

                  <div>
                    <label
                      className="block text-sm font-bold mb-1"
                      style={{ color: "#81059e87" }}
                    >
                      AUT
                    </label>
                    <input
                      type="text"
                      value={card.aut}
                      onChange={(e) =>
                        handleDebitCardDetailChange(index, "aut", e.target.value)
                      }
                      placeholder="Código de Autorização"
                      className="border border-gray-300 p-2 rounded-lg w-full text-black"
                    />
                  </div>

                  <div>
                    <label
                      className="block text-sm font-bold mb-1"
                      style={{ color: "#81059e87" }}
                    >
                      Bandeira
                    </label>
                    <input
                      type="text"
                      value={card.bandeira}
                      readOnly
                      className="border border-gray-300 p-2 rounded-lg w-full text-black"
                    />
                  </div>

                  <button
                    type="button"
                    onClick={() => handleRemoveDebitCard(index)}
                    className="bg-red-500 text-white font-bold px-4 py-2 rounded-lg mt-2"
                  >
                    Remover este cartão
                  </button>
                </div>
              ))}

              <button
                type="button"
                onClick={handleAddDebitCard}
                className="bg-blue-500 text-white font-bold px-4 py-2 rounded-lg mt-4"
              >
                Adicionar outro cartão de débito
              </button>
            </>
          )}

          {/* ENTRADA */}
          <div>
            <label
              htmlFor="entrada"
              className="block text-sm font-bold mb-1"
              style={{ color: "#81059e87" }}
            >
              Entrada
            </label>
            <CurrencyInput
              id="entrada"
              name="entrada"
              placeholder="R$ 0,00"
              value={downPayment || 0}
              decimalsLimit={2}
              decimalSeparator=","
              groupSeparator="."
              prefix="R$ "
              onValueChange={(value) => {
                setDownPayment(parseFloat(value) || 0);
              }}
              className="border border-gray-300 p-2 rounded-lg w-full text-black"
            />
          </div>

          {/* SE HOUVER ENTRADA, MOSTRA MÉTODO DA ENTRADA */}
          {downPayment > 0 && (
            <>
              <div>
                <label
                  htmlFor="downPaymentMethod"
                  className="block text-sm font-bold mb-1"
                  style={{ color: "#81059e87" }}
                >
                  Forma de Pagamento da Entrada
                </label>
                <select
                  id="downPaymentMethod"
                  name="downPaymentMethod"
                  value={downPaymentMethod}
                  onChange={(e) => handleDownPaymentMethodChange(e.target.value)}
                  className={`border border-gray-300 p-2 rounded-lg w-full text-black ${formErrors.downPaymentMethod ? "border-red-500" : ""
                    }`}
                >
                  <option value="">Selecione</option>
                  <option value="Dinheiro">Dinheiro</option>
                  <option value="Cartão de Crédito">Cartão de Crédito</option>
                  <option value="Cartão de Débito">Cartão de Débito</option>
                  <option value="Pix">Pix</option>
                  <option value="Boleto">Boleto</option>
                </select>
                {formErrors.downPaymentMethod && (
                  <p className="text-red-600 text-sm mt-1">
                    {formErrors.downPaymentMethod}
                  </p>
                )}
              </div>

              <div className="mt-4">
                <input
                  type="checkbox"
                  id="scheduleEntry"
                  checked={scheduleEntry}
                  onChange={(e) => setScheduleEntry(e.target.checked)}
                  className="mr-2"
                />
                <label
                  htmlFor="scheduleEntry"
                  className="text-sm"
                  style={{ color: "#81059e87" }}
                >
                  Agendar a entrada?
                </label>
              </div>

              {scheduleEntry && (
                <div className="mt-4">
                  <label
                    htmlFor="scheduledEntryDate"
                    className="block text-sm font-bold mb-1"
                    style={{ color: "#81059e87" }}
                  >
                    Data do Agendamento
                  </label>
                  <DatePicker
                    id="scheduledEntryDate"
                    selected={scheduledEntryDate}
                    onChange={(date) => setScheduledEntryDate(date)}
                    dateFormat="dd/MM/yyyy"
                    className="border border-gray-300 p-2 rounded-lg w-full text-black"
                    placeholderText="Selecione a data de agendamento"
                  />
                </div>
              )}

              {/* Se a entrada for Cartão de Crédito */}
              {downPaymentMethod === "Cartão de Crédito" && (
                <>
                  <div>
                    <label
                      htmlFor="downPaymentCondition"
                      className="block text-sm font-bold mb-1"
                      style={{ color: "#81059e87" }}
                    >
                      Condição de Pagamento da Entrada
                    </label>
                    <select
                      id="downPaymentCondition"
                      name="downPaymentCondition"
                      value={downPaymentCondition}
                      onChange={(e) => setDownPaymentCondition(e.target.value)}
                      className="border border-gray-300 p-2 rounded-lg w-full text-black"
                    >
                      <option value="A vista">A vista</option>
                      <option value="Parcelado">Parcelado</option>
                    </select>
                  </div>

                  {showDownPaymentInstallments &&
                    downPaymentCondition === "Parcelado" && (
                      <div>
                        <label
                          className="block text-sm font-bold mb-1"
                          style={{ color: "#81059e87" }}
                        >
                          Número de Parcelas da Entrada
                        </label>
                        <input
                          type="number"
                          name="downPaymentInstallments"
                          value={downPaymentInstallments}
                          onChange={(e) =>
                            handleDownPaymentInstallmentsChange(
                              Number(e.target.value)
                            )
                          }
                          placeholder="Número de Parcelas"
                          className="border border-gray-300 p-2 rounded-lg w-full text-black"
                        />
                      </div>
                    )}

                  {/* Dados do Cartão de Crédito para a Entrada */}
                  <div>
                    <label
                      htmlFor="downPaymentCardNumber"
                      className="block text-sm font-bold mb-1"
                      style={{ color: "#81059e87" }}
                    >
                      Número do Cartão (Entrada)
                    </label>
                    <input
                      id="downPaymentCardNumber"
                      type="text"
                      name="downPaymentCardDetails.cardNumber"
                      value={downPaymentCardDetails.cardNumber}
                      onChange={(e) =>
                        handleDownPaymentCardDetailChange("cardNumber", e.target.value)
                      }
                      placeholder="Número do Cartão"
                      className="border border-gray-300 p-2 rounded-lg w-full text-black"
                    />
                  </div>
                  <div className="flex space-x-4">
                    <div className="w-1/2">
                      <label
                        htmlFor="downPaymentCardExpiry"
                        className="block text-sm font-bold mb-1"
                        style={{ color: "#81059e87" }}
                      >
                        Validade (Entrada)
                      </label>
                      <input
                        id="downPaymentCardExpiry"
                        type="text"
                        name="downPaymentCardDetails.expiryDate"
                        value={downPaymentCardDetails.expiryDate}
                        onChange={(e) =>
                          handleDownPaymentCardDetailChange("expiryDate", e.target.value)
                        }
                        placeholder="MM/AA"
                        className="border border-gray-300 p-2 rounded-lg w-full text-black"
                      />
                    </div>
                    <div className="w-1/2">
                      <label
                        htmlFor="downPaymentCardCVV"
                        className="block text-sm font-bold mb-1"
                        style={{ color: "#81059e87" }}
                      >
                        CVV (Entrada)
                      </label>
                      <input
                        id="downPaymentCardCVV"
                        type="text"
                        name="downPaymentCardDetails.cvv"
                        value={downPaymentCardDetails.cvv}
                        onChange={(e) =>
                          handleDownPaymentCardDetailChange("cvv", e.target.value)
                        }
                        placeholder="CVV"
                        className="border border-gray-300 p-2 rounded-lg w-full text-black"
                      />
                    </div>
                  </div>
                  <div>
                    <label
                      htmlFor="downPaymentCardAut"
                      className="block text-sm font-bold mb-1"
                      style={{ color: "#81059e87" }}
                    >
                      AUT (Entrada)
                    </label>
                    <input
                      id="downPaymentCardAut"
                      type="text"
                      name="downPaymentCardDetails.aut"
                      value={downPaymentCardDetails.aut}
                      onChange={(e) =>
                        handleDownPaymentCardDetailChange("aut", e.target.value)
                      }
                      placeholder="Código de Autorização"
                      className="border border-gray-300 p-2 rounded-lg w-full text-black"
                    />
                  </div>
                  <div>
                    <label
                      htmlFor="downPaymentCardBandeira"
                      className="block text-sm font-bold mb-1"
                      style={{ color: "#81059e87" }}
                    >
                      Bandeira (Entrada)
                    </label>
                    <input
                      id="downPaymentCardBandeira"
                      type="text"
                      name="downPaymentCardDetails.bandeira"
                      value={downPaymentCardDetails.bandeira}
                      readOnly
                      className="border border-gray-300 p-2 rounded-lg w-full text-black"
                    />
                  </div>
                </>
              )}

              {/* Se a entrada for Cartão de Débito */}
              {downPaymentMethod === "Cartão de Débito" && (
                <>
                  <div>
                    <label
                      htmlFor="downPaymentDebitCardNumber"
                      className="block text-sm font-bold mb-1"
                      style={{ color: "#81059e87" }}
                    >
                      Número do Cartão (Débito)
                    </label>
                    <input
                      id="downPaymentDebitCardNumber"
                      type="text"
                      name="downPaymentCardDetails.cardNumber"
                      value={downPaymentCardDetails.cardNumber}
                      onChange={(e) =>
                        handleDownPaymentCardDetailChange("cardNumber", e.target.value)
                      }
                      placeholder="Número do Cartão"
                      className="border border-gray-300 p-2 rounded-lg w-full text-black"
                    />
                  </div>
                  <div className="flex space-x-4">
                    <div className="w-1/2">
                      <label
                        htmlFor="downPaymentDebitCardExpiry"
                        className="block text-sm font-bold mb-1"
                        style={{ color: "#81059e87" }}
                      >
                        Validade (Débito)
                      </label>
                      <input
                        id="downPaymentDebitCardExpiry"
                        type="text"
                        name="downPaymentCardDetails.expiryDate"
                        value={downPaymentCardDetails.expiryDate}
                        onChange={(e) =>
                          handleDownPaymentCardDetailChange("expiryDate", e.target.value)
                        }
                        placeholder="MM/AA"
                        className="border border-gray-300 p-2 rounded-lg w-full text-black"
                      />
                    </div>
                    <div className="w-1/2">
                      <label
                        htmlFor="downPaymentDebitCardCVV"
                        className="block text-sm font-bold mb-1"
                        style={{ color: "#81059e87" }}
                      >
                        CVV (Débito)
                      </label>
                      <input
                        id="downPaymentDebitCardCVV"
                        type="text"
                        name="downPaymentCardDetails.cvv"
                        value={downPaymentCardDetails.cvv}
                        onChange={(e) =>
                          handleDownPaymentCardDetailChange("cvv", e.target.value)
                        }
                        placeholder="CVV"
                        className="border border-gray-300 p-2 rounded-lg w-full text-black"
                      />
                    </div>
                  </div>
                  <div>
                    <label
                      htmlFor="downPaymentDebitCardAut"
                      className="block text-sm font-bold mb-1"
                      style={{ color: "#81059e87" }}
                    >
                      AUT (Débito)
                    </label>
                    <input
                      id="downPaymentDebitCardAut"
                      type="text"
                      name="downPaymentCardDetails.aut"
                      value={downPaymentCardDetails.aut}
                      onChange={(e) =>
                        handleDownPaymentCardDetailChange("aut", e.target.value)
                      }
                      placeholder="Código de Autorização"
                      className="border border-gray-300 p-2 rounded-lg w-full text-black"
                    />
                  </div>
                  <div>
                    <label
                      htmlFor="downPaymentDebitCardBandeira"
                      className="block text-sm font-bold mb-1"
                      style={{ color: "#81059e87" }}
                    >
                      Bandeira (Débito)
                    </label>
                    <input
                      id="downPaymentDebitCardBandeira"
                      type="text"
                      name="downPaymentCardDetails.bandeira"
                      value={downPaymentCardDetails.bandeira}
                      readOnly
                      className="border border-gray-300 p-2 rounded-lg w-full text-black"
                    />
                  </div>
                </>
              )}
            </>
          )}

          {/* LISTA DE ITENS NO CARRINHO (SE HOUVER) */}
          {cartItems.length > 0 && (
            <div className="my-4">
              <h2 className="text-xl font-bold mb-2" style={{ color: "#81059e" }}>
                Itens no Carrinho
              </h2>
              {cartItems.map((item, index) => (
                <div
                  key={index}
                  className="flex items-center mb-4 border-b pb-4"
                >
                  <img
                    src={item.imagem || "/images/default.png"}
                    alt={item.produto}
                    className="w-16 h-16 object-cover rounded"
                  />
                  <div className="ml-4 text-black">
                    <p className="font-bold">{item.produto}</p>
                    <p>Valor Unitário: R$ {parseFloat(item.valor).toFixed(2)}</p>
                    <p>Quantidade: {item.quantidade}</p>
                  </div>
                </div>
              ))}
            </div>
          )}

          {/* RESUMO (SUBTOTAL / DESCONTO / ENTRADA / TOTAL) */}
          <div className="mt-4 text-black">
            <p>Subtotal: R$ {totalValue.toFixed(2)}</p>
            {discount > 0 && (
              <p>
                Desconto:{" "}
                {discountType === "%"
                  ? `${discount}% (R$ ${(totalValue * (discount / 100)).toFixed(2)})`
                  : `R$ ${discount.toFixed(2)}`}
              </p>
            )}
            {downPayment > 0 && <p>Entrada: R$ {downPayment.toFixed(2)}</p>}
            <p>Total Final: R$ {finalValue.toFixed(2)}</p>
          </div>

          {/* SE FOR CARTÃO DE CRÉDITO (INFO EXTRA) */}
          {paymentMethod === "Cartão de Crédito" && (
            <div className="mt-4 text-black">
              <p>
                Total alocado em cartões: R${" "}
                {formData.cardDetails
                  .reduce((sum, card) => sum + (card.amount || 0), 0)
                  .toFixed(2)}
              </p>
              <p>
                Total restante: R${" "}
                {(
                  finalValue -
                  formData.cardDetails.reduce((sum, card) => sum + (card.amount || 0), 0)
                ).toFixed(2)}
              </p>
            </div>
          )}

          {/* BOTÃO FINALIZAR */}
          <div className="flex justify-end">
            <button
              type="submit"
              className={`bg-[#81059e] text-white font-bold px-6 py-3 rounded-lg mt-4 ${loading ? "opacity-50 cursor-not-allowed" : ""
                }`}
              disabled={loading}
            >
              {loading ? "Finalizando..." : "Finalizar Venda"}
            </button>
          </div>
        </form>
      </div>
    </Layout>
  );
}

// --------------------------------------------------------
// EXPORT DEFAULT (WRAPPER COM SUSPENSE)
// --------------------------------------------------------
export default function NovaVendaPage() {
  return (
    <Suspense fallback={<p>carregando</p>}>
      <NovaVendaContent />
    </Suspense>
  );
}
