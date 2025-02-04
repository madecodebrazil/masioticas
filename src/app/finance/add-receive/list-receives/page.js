"use client";
import { useState, useEffect } from "react";
import {
  collection,
  onSnapshot,
  doc,
  setDoc,
  deleteDoc,
} from "firebase/firestore";
import { firestore } from "../../../../lib/firebaseConfig";
import Layout from "@/components/Layout";
import Link from "next/link";
import jsPDF from "jspdf";
import "jspdf-autotable";

export default function CreditosPage() {
  const [crediarios, setCrediarios] = useState([]);
  const [selectedLoja, setSelectedLoja] = useState("");
  const [selectedFormaPagamento, setSelectedFormaPagamento] = useState("");
  const [selectedCrediario, setSelectedCrediario] = useState(null);
  const [selectedParcela, setSelectedParcela] = useState(null);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [checkedParcelas, setCheckedParcelas] = useState({});
  const [mensagemSucesso, setMensagemSucesso] = useState("");

  useEffect(() => {
    const unsubscribe = onSnapshot(
      collection(firestore, "crediarios"),
      (querySnapshot) => {
        const crediariosData = querySnapshot.docs.map((doc) => ({
          id: doc.id,
          ...doc.data(),
        }));
        setCrediarios(crediariosData);
      }
    );

    return () => unsubscribe();
  }, []);

  const openModal = (crediario, parcela = null) => {
    setSelectedCrediario(crediario);
    setSelectedParcela(parcela);
    setCheckedParcelas({});
    setIsModalOpen(true);
  };

  const closeModal = () => {
    console.log("Fechando o modal...");
    setSelectedCrediario(null);
    setSelectedParcela(null);
    setIsModalOpen(false);
    console.log("Modal fechado!");
  };

  const handleCheckboxChange = (parcelaId) => {
    setCheckedParcelas((prevState) => ({
      ...prevState,
      [parcelaId]: !prevState[parcelaId],
    }));
  };

  const handleQuitar = async () => {
    console.log("Iniciando handleQuitar...");

    // Verificações básicas
    if (!selectedLoja || !selectedFormaPagamento) {
      console.log("Loja ou forma de pagamento ausente. Cancelando operação.");
      alert("Por favor, selecione a loja e a forma de pagamento.");
      return;
    }

    try {
      if (selectedParcela) {
        console.log("Quitando parcela específica...");

        const parcelas = selectedCrediario.parcelasDetalhadas || [];
        const parcelasRestantes = parcelas.filter(
          (parcela) => !checkedParcelas[parcela.numeroParcela]
        );

        const crediarioRef = doc(firestore, "crediarios", selectedCrediario.id);

        if (parcelasRestantes.length > 0) {
          await setDoc(
            crediarioRef,
            { parcelasDetalhadas: parcelasRestantes },
            { merge: true }
          );
        } else {
          await deleteDoc(crediarioRef);
        }

        // Registrando com TODOS os parâmetros
        await registrarNoCaixa(
          selectedCrediario,
          selectedParcela,
          selectedLoja,
          selectedFormaPagamento
        );
        await registrarNoCashflow(
          selectedCrediario,
          selectedParcela,
          selectedLoja,
          selectedFormaPagamento
        );
      } else {
        console.log(
          "Nenhuma parcela específica selecionada. Excluindo crediário inteiro..."
        );

        const crediarioRef = doc(firestore, "crediarios", selectedCrediario.id);
        await deleteDoc(crediarioRef);

        // Registrando com TODOS os parâmetros
        await registrarNoCaixa(
          selectedCrediario,
          null,
          selectedLoja,
          selectedFormaPagamento
        );
        await registrarNoCashflow(
          selectedCrediario,
          null,
          selectedLoja,
          selectedFormaPagamento
        );
      }

      // Alerta de sucesso
      alert("Parcela quitada com sucesso!");
      setMensagemSucesso("Parcela quitada com sucesso!");
      setTimeout(() => setMensagemSucesso(""), 3000);

      // Só depois do alerta, feche o modal
      closeModal();
    } catch (error) {
      console.error("Erro ao quitar parcela:", error);
    }
  };

  const registrarNoCaixa = async (
    crediario,
    parcela = null,
    loja,
    formaPagamento
  ) => {
    const lojaSelecionada = loja === "Ótica Popular 1" ? "loja1" : "loja2";
    const dataAtual = new Date()
      .toLocaleDateString("pt-BR")
      .replace(/\//g, "-");

    const caixaRef = collection(
      firestore,
      `${lojaSelecionada}/finances/caixas/${dataAtual}/transactions`
    );

    const transacao = {
      nome: crediario.nome,
      valorFinal: parcela
        ? parseFloat(parcela.valorParcela)
        : parseFloat(crediario.valorParcela),
      cpf: crediario.cpf,
      data: new Date(),
      descricao: parcela
        ? `Quitação de parcela ${parcela.numeroParcela} (CPF: ${crediario.cpf})`
        : `Quitação de crediário (CPF: ${crediario.cpf})`,
      type: "receita",
      formaPagamento: formaPagamento,
    };

    await setDoc(doc(caixaRef), transacao);
  };

  const registrarNoCashflow = async (
    crediario,
    parcela = null,
    loja,
    formaPagamento
  ) => {
    const cashflowRef = collection(firestore, `cashflow`);

    const transacao = {
      nome: crediario.nome,
      valorFinal: parcela
        ? parseFloat(parcela.valorParcela)
        : parseFloat(crediario.valorParcela),
      data: new Date(),
      descricao: parcela
        ? `Quitação de parcela ${parcela.numeroParcela} (CPF: ${crediario.cpf})`
        : `Quitação de crediário (CPF: ${crediario.cpf})`,
      formaPagamento: formaPagamento,
      paymentMethod: formaPagamento,
    };

    await setDoc(doc(cashflowRef), transacao);
  };

  const generatePDF = () => {
    const docPDF = new jsPDF();
    docPDF.text(
      `Detalhes da Parcela ${selectedParcela?.numeroParcela || "Geral"}`,
      10,
      10
    );

    docPDF.text(`Nome do Devedor: ${selectedCrediario.nome}`, 10, 20);
    docPDF.text(`Código do Documento: ${selectedCrediario.id}`, 10, 30);
    if (selectedParcela) {
      docPDF.text(
        `Valor da Parcela: R$ ${parseFloat(
          selectedParcela.valorParcela
        ).toFixed(2)}`,
        10,
        40
      );
      docPDF.text(
        `Data de Vencimento: ${new Date(
          selectedParcela.dataVencimento
        ).toLocaleDateString("pt-BR")}`,
        10,
        50
      );
    } else {
      docPDF.text(
        `Valor Total: R$ ${parseFloat(selectedCrediario.valorParcela).toFixed(
          2
        )}`,
        10,
        40
      );
      docPDF.text(`Nenhuma parcela detalhada`, 10, 50);
    }
    docPDF.save(`Parcela_${selectedParcela?.numeroParcela || "Geral"}.pdf`);
  };

  const handlePrint = () => {
    window.print();
  };

  const getRowColor = (dataRecebimento) => {
    if (!dataRecebimento) return "";

    const hoje = new Date();
    const dataRecebimentoDate = new Date(dataRecebimento.seconds * 1000);
    const diffInDays = Math.ceil(
      (dataRecebimentoDate - hoje) / (1000 * 60 * 60 * 24)
    );

    if (diffInDays < 0) return "bg-red-100";
    if (diffInDays <= 2) return "bg-yellow-100";
    return "bg-white";
  };

  return (
    <Layout>
      <div className="min-h-screen p-4 bg-gray-100">
        <div className="w-full max-w-5xl mx-auto bg-white shadow-md rounded-lg p-6">
          <h2 className="text-lg font-bold text-[#932A83] mb-6">CREDIÁRIOS</h2>

          <div className="mb-4">
            <Link href="/finance/add-receive">
              <button className="bg-[#932A83] text-white px-4 py-2 rounded-md">
                ADICIONAR CONTA A RECEBER
              </button>
            </Link>
          </div>

          {mensagemSucesso && (
            <div className="bg-green-100 text-green-700 p-2 rounded-md mb-4">
              {mensagemSucesso}
            </div>
          )}

          {/* Layout antigo: Tabela */}
          <div className="overflow-x-auto">
            <table className="text-black min-w-full border">
              <thead className="bg-gray-200">
                <tr>
                  <th className="py-2 px-4 border">Cód</th>
                  <th className="py-2 px-4 border">Devedor</th>
                  <th className="py-2 px-4 border">Valor</th>
                  <th className="py-2 px-4 border">Entrada</th>
                  <th className="py-2 px-4 border">Recebimento</th>
                  <th className="py-2 px-4 border">Parcela/Detalhes</th>
                </tr>
              </thead>
              <tbody>
                {crediarios.map((crediario) => {
                  const parcelas = crediario.parcelasDetalhadas || [];
                  const entradaDate = crediario.data
                    ? crediario.data.toDate().toLocaleDateString("pt-BR")
                    : "Data não disponível";

                  const recebimentoDate = crediario.dataRecebimento
                    ? crediario.dataRecebimento
                        .toDate()
                        .toLocaleDateString("pt-BR")
                    : null;

                  // Se não houver parcelas detalhadas, mostra só um row
                  if (parcelas.length === 0) {
                    return (
                      <tr
                        key={crediario.id}
                        onClick={() => openModal(crediario)}
                        className={`cursor-pointer ${getRowColor(
                          crediario.dataRecebimento
                        )}`}
                      >
                        <td className="py-2 px-4 border" title={crediario.id}>
                          {crediario.id}
                        </td>
                        <td className="py-2 px-4 border">
                          {crediario.nome || "Não disponível"}
                        </td>
                        <td className="py-2 px-4 border">
                          {crediario.valorParcela
                            ? `R$ ${parseFloat(crediario.valorParcela).toFixed(
                                2
                              )}`
                            : "N/D"}
                        </td>
                        <td className="py-2 px-4 border">{entradaDate}</td>
                        <td className="py-2 px-4 border">
                          {recebimentoDate || "N/D"}
                        </td>
                        <td className="py-2 px-4 border text-blue-600 underline">
                          Nenhuma parcela detalhada
                        </td>
                      </tr>
                    );
                  } else {
                    // Se tiver parcelas, mostra um row para cada parcela
                    return parcelas.map((parcela, index) => (
                      <tr
                        key={`${crediario.id}-${index}`}
                        className={`cursor-pointer ${getRowColor(
                          crediario.dataRecebimento
                        )}`}
                        onClick={() => openModal(crediario, parcela)}
                      >
                        <td className="py-2 px-4 border" title={crediario.id}>
                          {crediario.id}
                        </td>
                        <td className="py-2 px-4 border">
                          {crediario.nome || "Não disponível"}
                        </td>
                        <td className="py-2 px-4 border">
                          R${" "}
                          {parcela.valorParcela
                            ? parseFloat(parcela.valorParcela).toFixed(2)
                            : "N/D"}
                        </td>
                        <td className="py-2 px-4 border">{entradaDate}</td>
                        <td className="py-2 px-4 border">
                          {recebimentoDate || "N/D"}
                        </td>
                        <td className="py-2 px-4 border text-blue-600 underline">
                          Parcela {parcela.numeroParcela} - Venc:{" "}
                          {parcela.dataVencimento
                            ? new Date(
                                parcela.dataVencimento
                              ).toLocaleDateString("pt-BR")
                            : "Data inválida"}
                        </td>
                      </tr>
                    ));
                  }
                })}
              </tbody>
            </table>
          </div>

          {/* MODAL */}
          {isModalOpen && selectedCrediario && (
            <div className="text-black fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
              <div className="bg-white p-4 sm:p-6 rounded-lg w-full max-w-md sm:max-w-lg shadow-lg">
                <h3 className="text-lg font-bold mb-4 text-[#932A83]">
                  {selectedParcela
                    ? `Parcela ${selectedParcela.numeroParcela}`
                    : "Detalhes do Credor"}
                </h3>
                <p>
                  <strong>Nome do Devedor:</strong> {selectedCrediario.nome}
                </p>
                <p>
                  <strong>Código do Documento:</strong> {selectedCrediario.id}
                </p>
                <p>
                  <strong>Loja:</strong> Ótica Popular 1
                </p>
                <p>
                  <strong>Entrada:</strong>{" "}
                  {selectedCrediario.data
                    ? selectedCrediario.data
                        .toDate()
                        .toLocaleDateString("pt-BR")
                    : "Data não disponível"}
                </p>
                <p>
                  <strong>Recebimento:</strong>{" "}
                  {selectedCrediario.dataRecebimento
                    ? new Date(
                        selectedCrediario.dataRecebimento.seconds * 1000
                      ).toLocaleDateString("pt-BR")
                    : "Data não disponível"}
                </p>
                <p>
                  <strong>Forma de Pagamento da Entrada:</strong>{" "}
                  {selectedCrediario.formaPagamentoEntrada || "Não informado"}
                </p>
                <p>
                  <strong>Forma de Pagamento Selecionada:</strong>{" "}
                  {selectedCrediario.formaPagamento || "Não informado"}
                </p>

                {selectedParcela ? (
                  <div className="mt-4">
                    <div className="mt-4">
                      <label className="block text-[#932A83] font-bold">
                        Loja:
                      </label>
                      <select
                        value={selectedLoja}
                        onChange={(e) => setSelectedLoja(e.target.value)}
                        className="mt-1 block w-full bg-white border border-gray-300 rounded-md shadow-sm px-4 py-3 text-lg"
                      >
                        <option value="">Selecione a loja</option>
                        <option value="Ótica Popular 1">Ótica Popular 1</option>
                        <option value="Ótica Popular 2">Ótica Popular 2</option>
                      </select>
                    </div>
                    <div className="mt-8">
                      <label className="text-[#932A83] font-bold">
                        Forma de Pagamento:
                      </label>
                      <select
                        value={selectedFormaPagamento}
                        onChange={(e) =>
                          setSelectedFormaPagamento(e.target.value)
                        }
                        className="mt-1 block w-full bg-white border border-gray-300 rounded-md shadow-sm px-4 py-3 text-lg"
                      >
                        <option value="">Selecione a forma de pagamento</option>
                        <option value="Dinheiro">Dinheiro</option>
                        <option value="Cartão de Crédito">
                          Cartão de Crédito
                        </option>
                        <option value="Cartão de Débito">
                          Cartão de Débito
                        </option>
                        <option value="Pix">Pix</option>
                        <option value="Boleto">Boleto</option>
                      </select>
                    </div>

                    <h4 className="mt-4 text-md font-bold text-[#932A83]">
                      Detalhes da Parcela:
                    </h4>
                    <p>
                      <strong>Número da Parcela:</strong>{" "}
                      {selectedParcela.numeroParcela}
                    </p>
                    <p>
                      <strong>Valor:</strong> R${" "}
                      {parseFloat(selectedParcela.valorParcela).toFixed(2)}
                    </p>
                    <p>
                      <strong>Vencimento:</strong>{" "}
                      {new Date(
                        selectedParcela.dataVencimento
                      ).toLocaleDateString("pt-BR")}
                    </p>
                    <div>
                      <label>
                        <input
                          type="checkbox"
                          checked={
                            checkedParcelas[selectedParcela.numeroParcela] ||
                            false
                          }
                          onChange={() =>
                            handleCheckboxChange(selectedParcela.numeroParcela)
                          }
                        />
                        Quitar Parcela
                      </label>
                    </div>
                  </div>
                ) : (
                  <div className="mt-4">
                    <p>
                      <strong>Valor Total:</strong> R${" "}
                      {parseFloat(selectedCrediario.valorParcela).toFixed(2)}
                    </p>
                    <p>
                      <strong>Sem parcelas detalhadas</strong>
                    </p>
                    <div>
                      <label>
                        <input
                          type="checkbox"
                          checked={
                            checkedParcelas[selectedCrediario.id] || false
                          }
                          onChange={() =>
                            handleCheckboxChange(selectedCrediario.id)
                          }
                        />
                        Quitar Todo o Crediário
                      </label>
                    </div>
                  </div>
                )}

                {/* Se tiver qualquer parcela “checkada”, habilita o botão Quitar */}
                {Object.values(checkedParcelas).some(
                  (isChecked) => isChecked
                ) && (
                  <div className="flex justify-around mt-6">
                    <button
                      className="bg-[#932A83] text-white p-2 rounded-md flex items-center justify-center"
                      onClick={handleQuitar}
                    >
                      Quitar
                    </button>
                  </div>
                )}

                <div className="flex justify-around mt-6">
                  <button
                    className="bg-[#932A83] text-white p-2 rounded-md flex items-center justify-center"
                    onClick={generatePDF}
                  >
                    <img src="/images/PDF.png" alt="PDF" className="h-6 w-6" />
                  </button>
                  <button
                    className="bg-[#932A83] text-white p-2 rounded-md flex items-center justify-center"
                    onClick={handlePrint}
                  >
                    <img
                      src="/images/Print.png"
                      alt="Imprimir"
                      className="h-6 w-6"
                    />
                  </button>
                </div>

                <button
                  className="absolute top-2 right-2 text-black hover:text-gray-600"
                  onClick={closeModal}
                >
                  &times;
                </button>
              </div>
            </div>
          )}
        </div>
      </div>
    </Layout>
  );
}
