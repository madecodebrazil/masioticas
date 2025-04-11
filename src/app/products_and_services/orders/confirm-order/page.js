"use client";
import { useRouter } from 'next/navigation'; // Importando o novo pacote de navegação
import { useSearchParams } from 'next/navigation'; // Para pegar os parâmetros da URL
import Layout from '@/components/Layout';
import { getFirestore, doc, setDoc } from "firebase/firestore"; // Importando Firestore diretamente
import { app } from '../../../../lib/firebaseConfig'; // Importando a configuração do Firebase App
import { Suspense, useState } from 'react'; // Usando o useState para gerenciar o estado de carregamento e sucesso

export function ConfirmOrder() {
  const router = useRouter();
  const searchParams = useSearchParams(); // Captura dos parâmetros da URL
  const firestore = getFirestore(app); // Instanciando o Firestore a partir da configuração do app
  const [loading, setLoading] = useState(false); // Estado para controlar o spinner
  const [success, setSuccess] = useState(false); // Estado para exibir popup de sucesso

  // Conversão dos parâmetros da query string em um objeto de dados
  const formData = Object.fromEntries(new URLSearchParams(searchParams));

  const handleEdit = () => {
    // Converte os dados de formData para query string
    const queryString = new URLSearchParams(formData).toString();

    // Redireciona para a página anterior com os dados preenchidos na URL
    router.push(`/products_and_services/orders?${queryString}`);
  };

  const handleSave = async () => {
    // Iniciar o spinner de carregamento
    setLoading(true);

    // Gerar um ID único para o pedido
    const pedidoId = new Date().getTime().toString();

    // Salvar os dados no Firestore
    try {
      await setDoc(doc(firestore, "pedidos", pedidoId), formData);

      // Mostrar popup de sucesso após salvar
      setSuccess(true);

      // Parar o spinner
      setLoading(false);

      // Após alguns segundos, redirecionar
      setTimeout(() => {
        setSuccess(false);
        router.push('/products_and_services/orders/list-orders');
      }, 2000);
    } catch (error) {
      console.error("Erro ao salvar o pedido:", error);
      setLoading(false); // Parar o spinner caso ocorra um erro
    }
  };

  return (
    <Layout>
      <div className="max-w-3xl mx-auto bg-white shadow-md rounded-lg p-6">
        <h2 className="text-2xl text-center text-[#81059e] mb-6">CONFIRMAR ORDEM DE SERVIÇO</h2>

        {/* Exibir spinner durante o carregamento */}
        {loading && (
          <div className="flex justify-center items-center">
            <div className="loader border-t-4 border-b-4 border-[#81059e] rounded-full w-12 h-12 animate-spin"></div>
          </div>
        )}

        {/* Exibir o conteúdo apenas se não estiver carregando */}
        {!loading && (
          <>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              {Object.keys(formData).map((key) => (
                <div key={key}>
                  <label className="block text-[#81059e] font-bold mb-1">{key.charAt(0).toUpperCase() + key.slice(1)}</label>
                  <p className="w-full px-3 py-2 text-black bg-transparent">
                    {formData[key]}
                  </p>
                </div>
              ))}
            </div>

            <div className="mt-6 flex justify-between">
              <button
                onClick={handleEdit}
                className="bg-gray-500 text-white px-6 py-2 rounded-md hover:bg-gray-600"
              >
                Editar
              </button>
              <button
                onClick={handleSave}
                className="bg-[#81059e] text-white px-6 py-2 rounded-md hover:bg-[#81059e]/90"
              >
                Confirmar e Salvar
              </button>
            </div>
          </>
        )}

        {/* Exibir o popup de sucesso */}
        {success && (
          <div className="fixed top-0 left-0 w-full h-full flex justify-center items-center bg-black bg-opacity-50">
            <div className="bg-white p-6 rounded-lg shadow-lg">
              <h2 className="text-lg text-[#81059e]">Pedido salvo com sucesso!</h2>
            </div>
          </div>
        )}
      </div>

      {/* Estilos para o spinner */}
      <style jsx>{`
        .loader {
          border: 4px solid #f3f3f3; /* Light grey */
          border-top: 4px solid #81059e; /* Purple */
          border-radius: 50%;
          width: 36px;
          height: 36px;
          animation: spin 1s linear infinite;
        }

        @keyframes spin {
          0% { transform: rotate(0deg); }
          100% { transform: rotate(360deg); }
        }
      `}</style>
    </Layout>
  );
}
export default function Page() {
  return (
    <Suspense fallback={<div> <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-[#81059e]"></div></div>}>
      <ConfirmOrder />
    </Suspense>
  );
}