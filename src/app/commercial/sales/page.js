"use client";
import { useEffect, useState } from "react";
import { collection, getDocs } from "firebase/firestore";
import { firestore } from "../../../lib/firebaseConfig";
import Layout from "@/components/Layout";
import { formatCurrency } from "@/components/formatCurrency";
import Link from "next/link";
import { Timestamp } from "firebase/firestore";
import { getStorage, ref, getDownloadURL } from "firebase/storage"; // Import para manipular o Storage

export default function SalesListPage() {
  const [sales, setSales] = useState([]);
  const [loading, setLoading] = useState(true);
  const [filter, setFilter] = useState("all");
  const [filteredSales, setFilteredSales] = useState([]);
  const [selectedSale, setSelectedSale] = useState({});

  const [showModal, setShowModal] = useState(false);
  const [pdfUrl, setPdfUrl] = useState(""); // Estado para armazenar o link do PDF
  const [showFilters, setShowFilters] = useState(false); // Estado para controlar a exibição dos filtros

  const storage = getStorage(); // Instância do Firebase Storage

  // Função para formatar um Timestamp para uma data legível
  const formatTimestamp = (timestamp) => {
    if (timestamp instanceof Timestamp) {
      const date = timestamp.toDate();
      return date.toLocaleDateString("pt-BR"); // Retorna a data no formato DD/MM/AAAA
    }
    return "";
  };

  // Buscar as vendas na coleção 'vendas'
  useEffect(() => {
    const fetchSales = async () => {
      try {
        const salesRef = collection(firestore, "vendas");
        const salesSnapshot = await getDocs(salesRef);
        const allSales = salesSnapshot.docs.map((doc) => {
          const data = doc.data();
          return {
            id: doc.id,
            ...data,
            formaPagamento: data.formaPagamento?.trim().toLowerCase(),
          };
        });

        setSales(allSales);
        setLoading(false);
      } catch (error) {
        console.error("Erro ao buscar vendas:", error);
      }
    };

    fetchSales();
  }, []);

  // Atualizar as vendas filtradas sempre que 'filter' ou 'sales' mudar
  useEffect(() => {
    const filterSales = () => {
      if (filter === "all") {
        setFilteredSales(sales);
      } else if (filter === "vendas") {
        setFilteredSales(sales.filter((sale) => sale.tipo === "vendas"));
      } else if (filter === "orcamentos") {
        setFilteredSales(sales.filter((sale) => sale.tipo === "orcamento"));
      }
    };

    filterSales();
  }, [filter, sales]);

  // Função para abrir o modal e buscar o PDF da venda
  const handleShowDetails = async (sale) => {
    const normalizedSale = {
      ...sale,
      formaPagamento: sale.formaPagamento?.trim().toLowerCase(),
    };

    setSelectedSale(normalizedSale);
    setShowModal(true);

    // Gera o caminho do PDF no Firebase Storage
    const pdfRef = ref(
      storage,
      `comercial_vendas/${sale.cpf}/${sale.id}/venda_${sale.cpf}_${sale.id}.pdf`
    );
    try {
      const url = await getDownloadURL(pdfRef);
      setPdfUrl(url); // Armazena o link do PDF no estado
    } catch (error) {
      console.error("Erro ao buscar o PDF da venda:", error);
      setPdfUrl(""); // Caso não encontre, não define o link
    }
  };

  // Função para fechar o modal
  const handleCloseModal = () => {
    setSelectedSale(null);
    setShowModal(false);
    setPdfUrl(""); // Reseta o link do PDF ao fechar o modal
  };

  // Função para compartilhar o link do PDF no WhatsApp
  const handleWhatsAppShare = () => {
    if (!pdfUrl) return; // Se não tiver PDF, não faz nada

    // Texto de compartilhamento
    const message = `Confira os detalhes da venda: ${pdfUrl}`;

    // Codifica a mensagem para ser usada no WhatsApp
    const whatsappUrl = `https://wa.me/?text=${encodeURIComponent(message)}`;

    // Abre o WhatsApp com o link codificado
    window.open(whatsappUrl, "_blank");
  };

  return (
    <Layout>
      <div className="min-h-screen bg-gray-100 p-4 sm:p-6">
        <div className="bg-white shadow-md rounded-lg p-4 sm:p-6">
          <div className="flex flex-col sm:flex-row justify-between items-center mb-4">
            <h1 className="text-lg sm:text-2xl font-bold text-[#932A83]">
              Vendas
            </h1>

            <div className="flex w-full justify-around space-x-2 sm:space-x-4 mt-2 sm:mt-0">
              <Link href="/commercial/sales/new_sale">
                <button className="bg-[#932A83] text-white w-full sm:w-auto px-3 py-1 sm:px-4 sm:py-2 rounded-full flex items-center justify-center space-x-1 sm:space-x-2 text-sm sm:text-base">
                  <span>Nova Venda</span>
                  <svg
                    className="w-4 h-4 sm:w-5 sm:h-5"
                    fill="none"
                    stroke="currentColor"
                    viewBox="0 0 24 24"
                    xmlns="http://www.w3.org/2000/svg"
                  >
                    <path
                      strokeLinecap="round"
                      strokeLinejoin="round"
                      strokeWidth="2"
                      d="M5 12h14m-7-7v14"
                    />
                  </svg>
                </button>
              </Link>

              <Link href="/commercial/sales/new_estimate">
                <button className="bg-[#932A83] text-white w-full sm:w-auto px-3 py-1 sm:px-4 sm:py-2 rounded-full flex items-center justify-center space-x-1 sm:space-x-2 text-sm sm:text-base">
                  <span>Novo Orçamento</span>
                  <svg
                    className="w-4 h-4 sm:w-5 sm:h-5"
                    fill="none"
                    stroke="currentColor"
                    viewBox="0 0 24 24"
                    xmlns="http://www.w3.org/2000/svg"
                  >
                    <path
                      strokeLinecap="round"
                      strokeLinejoin="round"
                      strokeWidth="2"
                      d="M5 12h14m-7-7v14"
                    />
                  </svg>
                </button>
              </Link>
            </div>
          </div>

          {/* Ícone de filtro */}
          <div className="flex justify-end items-center mb-6">
            <button
              className="bg-[#932A83] text-white px-3 py-2 rounded-full"
              onClick={() => setShowFilters(!showFilters)}
            >
              <i className="fa fa-filter" aria-hidden="true">
                Filtrar
              </i>
            </button>
          </div>

          {/* Menu de Filtros */}
          {showFilters && (
            <div className="flex flex-col space-y-2 mb-6">
              <button
                className={`px-4 py-2 rounded-full ${
                  filter === "all"
                    ? "bg-[#932A83] text-white"
                    : "bg-gray-200 text-black"
                }`}
                onClick={() => setFilter("all")}
              >
                Todos
              </button>
              <button
                className={`px-4 py-2 rounded-full ${
                  filter === "vendas"
                    ? "bg-[#932A83] text-white"
                    : "bg-gray-200 text-black"
                }`}
                onClick={() => setFilter("vendas")}
              >
                Vendas
              </button>
              <button
                className={`px-4 py-2 rounded-full ${
                  filter === "orcamentos"
                    ? "bg-[#932A83] text-white"
                    : "bg-gray-200 text-black"
                }`}
                onClick={() => setFilter("orcamentos")}
              >
                Orçamentos
              </button>
            </div>
          )}

          {loading ? (
            <div className="text-center">Carregando...</div>
          ) : (
            <div>
              {filteredSales.length === 0 ? (
                <p className="text-gray-600">Nenhuma venda encontrada.</p>
              ) : (
                <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
                  {filteredSales.map((sale) => (
                    <div
                      key={sale.id}
                      className="bg-gray-50 rounded-lg p-4 shadow-md flex flex-col justify-between"
                    >
                      <div>
                        <h3 className="text-lg font-bold text-[#932A83]">
                          {sale.nome}
                        </h3>
                        <p className="text-sm text-gray-600">
                          Forma de pagamento:{" "}
                          <strong>{sale.formaPagamento}</strong>
                        </p>
                        <p className="text-black">
                          <strong>Condição de Pagamento:</strong>{" "}
                          {["crediário", "boleto"].includes(
                            sale?.formaPagamento
                          )
                            ? "À prazo"
                            : "À vista"}
                        </p>
                      </div>
                      <div className="mt-4">
                        <p className="text-xl font-bold text-[#932A83]">
                          {formatCurrency(sale.valorFinal)}
                        </p>
                        <p className="text-sm text-gray-600">{`${sale.parcelas} Parcelas`}</p>
                      </div>

                      <div className="flex justify-between items-center mt-4">
                        <button
                          className="text-[#932A83] flex items-center space-x-2"
                          onClick={() => handleShowDetails(sale)}
                        >
                          <svg
                            className="w-5 h-5"
                            fill="none"
                            stroke="currentColor"
                            viewBox="0 0 24 24"
                            xmlns="http://www.w3.org/2000/svg"
                          >
                            <path
                              strokeLinecap="round"
                              strokeLinejoin="round"
                              strokeWidth="2"
                              d="M17 16l4-4m0 0l-4-4m4 4H3"
                            />
                          </svg>
                          <span>Detalhes</span>
                        </button>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>
          )}
        </div>
      </div>

      {/* Modal de detalhes */}
      {showModal && selectedSale && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center">
          <div className="bg-white p-6 rounded-lg shadow-lg max-w-lg w-full sm:w-11/12">
            <h2 className="text-xl font-bold text-[#932A83] mb-4">
              Detalhes da Venda
            </h2>

            <p className="text-black">
              <strong>Cliente:</strong> {selectedSale.nome}
            </p>
            <p className="text-black">
              <strong>CPF:</strong> {selectedSale.cpf}
            </p>
            <p className="text-black">
              <strong>Telefone:</strong> {selectedSale.telefone}
            </p>
            <p className="text-black">
              <strong>Forma de Pagamento:</strong> {selectedSale.formaPagamento}
            </p>
            <p className="text-black">
              <strong>Condição de Pagamento:</strong>{" "}
              {["crediário", "boleto"].includes(selectedSale?.formaPagamento)
                ? "À prazo"
                : "À vista"}
            </p>

            <p className="text-black">
              <strong>Desconto:</strong> {formatCurrency(selectedSale.desconto)}
            </p>
            <p className="text-black">
              <strong>Entrada:</strong> {formatCurrency(selectedSale.entrada)}
            </p>
            <p className="text-black">
              <strong>Total de Parcelas:</strong> {selectedSale.parcelas}
            </p>
            <p className="text-black">
              <strong>Valor da Venda:</strong>{" "}
              {formatCurrency(selectedSale.valorVenda)}
            </p>
            <p className="text-black">
              <strong>Valor Final (com desconto):</strong>{" "}
              {formatCurrency(selectedSale.valorFinal)}
            </p>
            <p className="text-black">
              <strong>Data da Venda:</strong>{" "}
              {formatTimestamp(selectedSale.data)}
            </p>
            <p className="text-black">
              <strong>Data de Recebimento:</strong>{" "}
              {formatTimestamp(selectedSale.dataRecebimento)}
            </p>

            {pdfUrl ? (
              <div className="mt-4">
                <a
                  href={pdfUrl}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="bg-[#932A83] text-white px-4 py-2 rounded-md"
                >
                  Baixar PDF
                </a>
              </div>
            ) : (
              <p className="text-red-500 mt-4">PDF da venda não encontrado.</p>
            )}

            {/* Botão de compartilhar no WhatsApp (exibido apenas se o PDF estiver disponível) */}
            {pdfUrl && (
              <div className="flex justify-center mt-4">
                <button
                  onClick={handleWhatsAppShare}
                  className="bg-[#25D366] text-white px-4 py-2 rounded-md"
                >
                  Compartilhar no WhatsApp
                </button>
              </div>
            )}

            <div className="mt-6 text-right">
              <button
                onClick={handleCloseModal}
                className="bg-[#932A83] text-white px-4 py-2 rounded-md"
              >
                Fechar
              </button>
            </div>
          </div>
        </div>
      )}
    </Layout>
  );
}
