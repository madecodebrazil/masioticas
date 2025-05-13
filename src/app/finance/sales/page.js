"use client";
import { useState, useEffect } from 'react';
import Layout from '@/components/Layout';
import { collection, query, where, getDocs, doc, getDoc, addDoc, deleteDoc, Timestamp } from 'firebase/firestore';
import { getStorage, ref, uploadBytesResumable, getDownloadURL, listAll } from 'firebase/storage';
import { firestore } from '../../../lib/firebaseConfig';
import { useRouter } from 'next/navigation';
import DatePicker from 'react-datepicker';
import 'react-datepicker/dist/react-datepicker.css';
import jsPDF from 'jspdf';
import 'jspdf-autotable';

export default function NovaVenda() {
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedClient, setSelectedClient] = useState(null);
  const [cartItems, setCartItems] = useState([]);
  const [errorMessage, setErrorMessage] = useState('');
  const [currentDate, setCurrentDate] = useState('');
  const [paymentMethod, setPaymentMethod] = useState('Pix');
  const [paymentCondition, setPaymentCondition] = useState('A vista');
  const [availableConditions, setAvailableConditions] = useState(['A vista']);
  const [installments, setInstallments] = useState(1);
  const [showInstallments, setShowInstallments] = useState(false);
  const [totalValue, setTotalValue] = useState(0);
  const [installmentValue, setInstallmentValue] = useState(0);
  const [discountType, setDiscountType] = useState('%');
  const [discount, setDiscount] = useState(0);
  const [finalValue, setFinalValue] = useState(0);
  const [receivingDate, setReceivingDate] = useState(null);
  const [downPayment, setDownPayment] = useState(0);
  const [loading, setLoading] = useState(false);
  const router = useRouter();

  const storage = getStorage();

  useEffect(() => {
    const today = new Date();
    const formattedDate = today.toISOString().split('T')[0];
    setCurrentDate(formattedDate);
  }, []);

  const handleSearchCPF = async () => {
    if (!searchTerm) {
      setErrorMessage('Digite um CPF válido.');
      return;
    }

    try {
      const clientQuery = query(collection(firestore, 'consumers'), where('__name__', '==', searchTerm));
      const clientSnapshot = await getDocs(clientQuery);

      if (clientSnapshot.empty) {
        setErrorMessage('Nenhum cliente encontrado.');
        setSelectedClient(null);
        return;
      }

      const clientData = clientSnapshot.docs[0].data();
      setSelectedClient(clientData);

      const cartRef = doc(firestore, 'cart', searchTerm);
      const cartDoc = await getDoc(cartRef);

      if (cartDoc.exists()) {
        const cartData = cartDoc.data();

        if (!cartData.items || cartData.items.length === 0) {
          setErrorMessage('Carrinho vazio. Não é possível prosseguir com a venda.');
          setCartItems([]);
          setTotalValue(0);
          setFinalValue(0);
          return;
        }

        const total = cartData.items.reduce((acc, item) => acc + parseFloat(item.valor), 0);
        setCartItems(cartData.items);
        setTotalValue(total);
        calculateDiscountedTotal(total, discount, discountType);

        if (total === 0) {
          setErrorMessage('Carrinho com valor 0. Não é possível prosseguir com a venda.');
          return;
        }
      } else {
        setErrorMessage('Carrinho não encontrado para este CPF.');
        setCartItems([]);
        setTotalValue(0);
        setFinalValue(0);
      }

      setErrorMessage('');
    } catch (error) {
      setErrorMessage('Erro ao buscar cliente ou carrinho.');
    }
  };

  const calculateDiscountedTotal = (total, discount, type) => {
    let discountedTotal = total;
    if (type === '%') {
      discountedTotal = total - (total * discount) / 100;
    } else {
      discountedTotal = total - discount;
    }
    setFinalValue(discountedTotal > 0 ? discountedTotal : 0);
    calculateInstallmentValue(discountedTotal, installments);
  };

  const calculateInstallmentValue = (total, numInstallments) => {
    if (numInstallments > 0) {
      const installmentVal = (total - downPayment) / numInstallments;
      setInstallmentValue(installmentVal);
    }
  };

  const handlePaymentMethodChange = (method) => {
    setPaymentMethod(method);

    switch (method) {
      case 'Crediário':
        setAvailableConditions(['Parcelado']);
        setPaymentCondition('Parcelado');
        setShowInstallments(true);
        break;
      case 'Espécie':
      case 'Débito':
      case 'Pix':
      case 'Boleto':
        setAvailableConditions(['A vista']);
        setPaymentCondition('A vista');
        setShowInstallments(false);
        setReceivingDate(null);
        setDownPayment(0);
        break;
      case 'Cartão de Crédito':
        setAvailableConditions(['A vista', 'Parcelado']);
        setPaymentCondition('A vista');
        setShowInstallments(false);
        setReceivingDate(null);
        setDownPayment(0);
        break;
      default:
        setAvailableConditions(['A vista']);
        setPaymentCondition('A vista');
        setShowInstallments(false);
        setReceivingDate(null);
        setDownPayment(0);
        break;
    }
  };

  const handleInstallmentsChange = (numInstallments) => {
    setInstallments(numInstallments);
    calculateInstallmentValue(finalValue, numInstallments);
  };

  const generatePDF = async () => {
    const doc = new jsPDF();
    doc.text('Detalhes da Venda', 10, 10);
    doc.text(`Cliente: ${selectedClient.nome}`, 10, 20);
    doc.text(`CPF: ${searchTerm}`, 10, 30);
    doc.text(`Forma de Pagamento: ${paymentMethod}`, 10, 40);
    doc.text(`Total: R$ ${totalValue.toFixed(2)}`, 10, 50);
    doc.text(`Desconto: R$ ${discount.toFixed(2)} (${discountType})`, 10, 60);
    doc.text(`Valor Final: R$ ${finalValue.toFixed(2)}`, 10, 70);

    doc.autoTable({
      head: [['Produto', 'Valor']],
      body: cartItems.map((item) => [item.produto, `R$ ${item.valor}`]),
      startY: 80,
    });

    const pdfBlob = doc.output('blob');
    await uploadPDFToFirebase(pdfBlob, searchTerm);
  };

  const uploadPDFToFirebase = async (pdfBlob, cpf) => {
    const storageRef = ref(storage, `sales_pdfs/${cpf}/venda.pdf`);
    const listRef = ref(storage, `sales_pdfs/${cpf}`);

    const existingFiles = await listAll(listRef);
    const count = existingFiles.items.length + 1;
    const pdfRef = ref(storage, `sales_pdfs/${cpf}/venda(${count}).pdf`);

    const uploadTask = uploadBytesResumable(pdfRef, pdfBlob);

    uploadTask.on(
      'state_changed',
      (snapshot) => {
        const progress = (snapshot.bytesTransferred / snapshot.totalBytes) * 100;
        console.log('Progresso do upload:', progress);
      },
      (error) => {
        console.error('Erro ao fazer upload do PDF:', error);
      },
      () => {
        getDownloadURL(uploadTask.snapshot.ref).then((downloadURL) => {
          console.log('PDF disponível em:', downloadURL);
        });
      }
    );
  };

  const generateCashflowDescription = () => {
    let description = '';

    if (paymentMethod === 'Crediário') {
      if (downPayment > 0) {
        description = `Venda no Crediário com entrada de R$ ${downPayment.toFixed(2)} e ${installments} parcelas para o cliente ${selectedClient.nome}`;
      } else {
        description = `Venda no Crediário em ${installments} parcelas para o cliente ${selectedClient.nome}`;
      }
    } else if (paymentMethod === 'Cartão de Crédito' && paymentCondition === 'Parcelado') {
      description = `Venda parcelada em ${installments} vezes no Cartão de Crédito para o cliente ${selectedClient.nome}`;
    } else if (paymentMethod === 'Pix' || paymentMethod === 'Espécie' || paymentMethod === 'Débito' || paymentMethod === 'Boleto') {
      description = `Venda à vista via ${paymentMethod} para o cliente ${selectedClient.nome}`;
    } else {
      description = `Venda para o cliente ${selectedClient.nome}`;
    }

    return description;
  };

  const handleSubmit = async () => {
    setLoading(true);

    try {
      const now = new Date();
      let vendaDate = now;

      if (now.getHours() >= 18) {
        vendaDate.setDate(vendaDate.getDate() + 1);
      }

      const saleTimestamp = Timestamp.fromDate(vendaDate); // Mudando para timestamp

      const saleData = {
        cliente: selectedClient.nome,
        cpf: searchTerm,
        data: saleTimestamp,  // Usando o timestamp aqui
        formaPagamento: paymentMethod,
        condicaoPagamento: paymentCondition,
        totalVenda: totalValue,
        descontoAplicado: discount,
        valor: finalValue,
        entrada: downPayment,
        parcelas: showInstallments ? installments : 1,
        lojas: cartItems.map((item) => item.lojas).flat(),
        itens: cartItems
      };

      const saleRef = await addDoc(collection(firestore, 'vendas'), saleData);
      const saleId = saleRef.id;

      // Registra a entrada (se houver) no cashflow
      if (downPayment > 0) {
        const entradaCashflowData = {
          vendaId: saleId,
          data: saleTimestamp,
          cliente: selectedClient.nome,
          cpf: searchTerm,
          formaPagamento: paymentMethod,
          valor: downPayment,  // Valor da entrada
          tipo: 'Crediário',  // Tipo de pagamento
          descricao: `Entrada no Crediário para o cliente ${selectedClient.nome}`,
          lojas: cartItems.map((item) => item.lojas).flat(),
        };

        // Registra a entrada no cashflow
        await addDoc(collection(firestore, 'cashflow'), entradaCashflowData);
      }

      // Se não houver entrada, ou para registrar o valor total não quitado
      const totalCashflowData = {
        vendaId: saleId,
        data: saleTimestamp,
        cliente: selectedClient.nome,
        cpf: searchTerm,
        formaPagamento: paymentMethod,
        valor: downPayment > 0 ? finalValue - downPayment : finalValue,  // Envia o valor restante ou o valor total se não houver entrada
        tipo: 'Crediário',
        descricao: downPayment > 0
          ? `Venda no Crediário com entrada para o cliente ${selectedClient.nome}, faltando ${installments} parcelas`
          : `Venda no Crediário para o cliente ${selectedClient.nome}, ainda não quitado`,
        lojas: cartItems.map((item) => item.lojas).flat(),
      };

      // Registra o valor total não quitado no cashflow
      await addDoc(collection(firestore, 'cashflow'), totalCashflowData);

      // Adiciona o crediário com as parcelas se a forma de pagamento for Crediário
      if (paymentMethod === 'Crediário') {
        const crediarioData = {
          ...saleData,
          dataRecebimento: receivingDate,
          parcelasDetalhadas: generateInstallments(),
        };
        await addDoc(collection(firestore, 'crediarios'), crediarioData);
      }

      const cartRef = doc(firestore, 'cart', searchTerm);
      await deleteDoc(cartRef);

      await generatePDF();

      setLoading(false);
      alert('Venda registrada com sucesso!');
      router.push('/homepage');
    } catch (error) {
      setLoading(false);
      console.error('Erro ao registrar a venda:', error);
      alert('Erro ao registrar a venda. Tente novamente.');
    }
  };


  return (
    <Layout>
      <div className="min-h-screen flex flex-col items-center bg-gray-100">
        <div className="bg-white shadow-md rounded-md mt-8 p-8 w-11/12 max-w-md">
          <div className="flex space-x-4 mb-4">
            <input
              type="text"
              placeholder="Buscar CPF"
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="border border-[#81059e] p-2 rounded w-full focus:outline-none focus:ring-2 focus:ring-[#81059e] text-black"
            />
            <button
              className="bg-[#81059e] text-white p-2 rounded"
              onClick={handleSearchCPF}
            >
              BUSCAR CPF
            </button>
          </div>

          {errorMessage && <p className="text-red-500">{errorMessage}</p>}

          {selectedClient && (
            <>
              <div className="mb-4">
                <label className="block text-[#81059e]">Nome</label>
                <input
                  type="text"
                  value={selectedClient.nome}
                  className="border border-[#81059e] p-2 rounded w-full focus:outline-none focus:ring-2 focus:ring-[#81059e] text-black"
                  readOnly
                />
              </div>

              <div className="mb-4">
                <label className="block text-[#81059e]">Telefone</label>
                <input
                  type="text"
                  value={selectedClient.telefone}
                  className="border border-[#81059e] p-2 rounded w-full focus:outline-none focus:ring-2 focus:ring-[#81059e] text-black"
                  readOnly
                />
              </div>
            </>
          )}

          <div className="mb-4">
            <label className="block text-[#81059e]">Data de entrada</label>
            <input
              type="date"
              value={currentDate}
              className="border border-[#81059e] p-2 rounded w-full focus:outline-none focus:ring-2 focus:ring-[#81059e] text-black"
              readOnly
            />
          </div>

          <div className="mb-4">
            <label className="block text-[#81059e]">Forma de pagamento:</label>
            <select
              className="border border-[#81059e] p-2 rounded w-full focus:outline-none focus:ring-2 focus:ring-[#81059e] text-black"
              value={paymentMethod}
              onChange={(e) => handlePaymentMethodChange(e.target.value)}
            >
              <option>Pix</option>
              <option>Cartão de Crédito</option>
              <option>Boleto</option>
              <option>Débito</option>
              <option>Crediário</option>
              <option>Espécie</option>
            </select>
          </div>

          <div className="mb-4">
            <label className="block text-[#81059e]">Condição de pagamento:</label>
            <select
              className="border border-[#81059e] p-2 rounded w-full focus:outline-none focus:ring-2 focus:ring-[#81059e] text-black"
              value={paymentCondition}
              onChange={(e) => setPaymentCondition(e.target.value)}
            >
              {availableConditions.map((condition) => (
                <option key={condition} value={condition}>
                  {condition}
                </option>
              ))}
            </select>
          </div>

          {showInstallments && (
            <div className="mb-4">
              <label className="block text-[#81059e]">Número de Parcelas</label>
              <input
                type="number"
                className="border border-[#81059e] p-2 rounded w-full focus:outline-none focus:ring-2 focus:ring-[#81059e] text-black"
                value={installments}
                onChange={(e) => handleInstallmentsChange(e.target.value)}
                min="1"
              />
            </div>
          )}

          {showInstallments && (
            <div className="mb-4">
              <label className="block text-[#81059e]">Valor de cada parcela</label>
              <input
                type="text"
                value={`R$ ${installmentValue.toFixed(2)}`}
                className="border border-[#81059e] p-2 rounded w-full focus:outline-none focus:ring-2 focus:ring-[#81059e] text-black"
                readOnly
              />
            </div>
          )}

          <div className="mb-4">
            <label className="block text-[#81059e]">Entrada</label>
            <input
              type="number"
              value={downPayment}
              onChange={(e) => setDownPayment(e.target.value)}
              className="border border-[#81059e] p-2 rounded w-full focus:outline-none focus:ring-2 focus:ring-[#81059e] text-black"
            />
          </div>

          {paymentMethod === 'Crediário' && (
            <div className="mb-4">
              <label className="block text-[#81059e]">Data de Recebimento</label>
              <DatePicker
                selected={receivingDate}
                onChange={(date) => setReceivingDate(date)}
                dateFormat="dd/MM/yyyy"
                className="border border-[#81059e] p-2 rounded w-full focus:outline-none focus:ring-2 focus:ring-[#81059e] text-black"
                placeholderText="Selecione a data de recebimento"
              />
            </div>
          )}

          <div className="mb-4">
            <label className="block text-[#81059e]">Valor Final</label>
            <input
              type="text"
              value={`R$ ${(finalValue - downPayment).toFixed(2)}`}
              className="border border-[#81059e] p-2 rounded w-full focus:outline-none focus:ring-2 focus:ring-[#81059e] text-black"
              readOnly
            />
          </div>

          {loading ? (
            <div className="flex justify-center">
              <div className="spinner-border animate-spin inline-block w-8 h-8 border-4 rounded-full" role="status" />
            </div>
          ) : (
            <button
              className="bg-[#81059e] text-white p-2 rounded w-full"
              onClick={handleSubmit}
            >
              CONFIRMAR VENDA
            </button>
          )}
        </div>
      </div>
    </Layout>
  );
}
