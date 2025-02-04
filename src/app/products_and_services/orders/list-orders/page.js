"use client";
import { useEffect, useState } from "react";
import { useRouter } from "next/navigation"; // Novo pacote de navegação
import Layout from "@/components/Layout";
import { getFirestore, collection, getDocs } from "firebase/firestore"; // Importando Firestore diretamente
import { app } from "../../../../lib/firebaseConfig"; // Importando a configuração do Firebase App

export default function ListOrders() {
  const [orders, setOrders] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const firestore = getFirestore(app); // Instanciando o Firestore
  const router = useRouter();

  // Função para buscar pedidos
  const fetchOrders = async () => {
    try {
      const querySnapshot = await getDocs(collection(firestore, "pedidos"));
      const ordersList = querySnapshot.docs.map((doc) => ({
        id: doc.id,
        ...doc.data(),
      }));
      setOrders(ordersList);
      setLoading(false);
    } catch (err) {
      setError("Erro ao carregar os pedidos.");
      setLoading(false);
    }
  };

  // Hook para carregar os pedidos na montagem do componente
  useEffect(() => {
    fetchOrders();
  }, []);

  return (
    <Layout>
      <div className="max-w-5xl mx-auto bg-white shadow-md rounded-lg p-6">
        <h2 className="text-2xl text-center text-[#932A83] mb-6">LISTA DE PEDIDOS</h2>

        {/* Exibir spinner de carregamento */}
        {loading && (
          <div className="flex justify-center items-center">
            <div className="loader border-t-4 border-b-4 border-[#932A83] rounded-full w-12 h-12 animate-spin"></div>
          </div>
        )}

        {/* Exibir erro caso exista */}
        {error && (
          <div className="text-red-500 text-center mb-4">
            {error}
          </div>
        )}

        {/* Exibir tabela de pedidos se não estiver carregando */}
        {!loading && !error && orders.length > 0 && (
          <div className="overflow-x-auto">
            <table className="min-w-full bg-white border-collapse">
              <thead>
                <tr>
                  <th className="py-3 px-6 bg-[#932A83] text-white text-left">ID</th>
                  <th className="py-3 px-6 bg-[#932A83] text-white text-left">Cliente</th>
                  <th className="py-3 px-6 bg-[#932A83] text-white text-left">Distribuidor</th>
                  <th className="py-3 px-6 bg-[#932A83] text-white text-left">Valor</th>
                  <th className="py-3 px-6 bg-[#932A83] text-white text-left">Status</th>
                </tr>
              </thead>
              <tbody>
                {orders.map((order) => (
                  <tr key={order.id} className="border-b hover:bg-gray-50">
                    <td className="py-3 px-6 text-left text-black">{order.id}</td>
                    <td className="py-3 px-6 text-left text-black">{order.cliente}</td>
                    <td className="py-3 px-6 text-left text-black">{order.distribuidor}</td>
                    <td className="py-3 px-6 text-left text-black">R$ {order.valor}</td>
                    <td className="py-3 px-6 text-left text-black">{order.status}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}

        {/* Caso não tenha pedidos */}
        {!loading && !error && orders.length === 0 && (
          <div className="text-center text-gray-600 mt-4">
            Nenhum pedido encontrado.
          </div>
        )}
      </div>

      {/* Estilos para o spinner */}
      <style jsx>{`
        .loader {
          border: 4px solid #f3f3f3; /* Light grey */
          border-top: 4px solid #932A83; /* Purple */
          border-radius: 50%;
          width: 36px;
          height: 36px;
          animation: spin 1s linear infinite;
        }

        @keyframes spin {
          0% {
            transform: rotate(0deg);
          }
          100% {
            transform: rotate(360deg);
          }
        }
      `}</style>
    </Layout>
  );
}
