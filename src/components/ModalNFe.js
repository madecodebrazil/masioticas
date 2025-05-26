// components/ModalNFe.js
import { useState } from 'react';
import { doc, updateDoc, collection, addDoc, serverTimestamp } from 'firebase/firestore';
import { firestore } from '@/lib/firebaseConfig';
import { useAuth } from '@/hooks/useAuth';
import { FiFileText, FiX, FiCheck, FiPrinter, FiMail } from 'react-icons/fi';

const ModalNFe = ({ isOpen, onClose, saleId, client, items, total, selectedLoja }) => {
  // Estados
  const [nfType, setNfType] = useState('nfce'); // nfce ou nfe
  const [loading, setLoading] = useState(false);
  const [success, setSuccess] = useState(false);
  const [error, setError] = useState('');
  const [nfNumber, setNfNumber] = useState('');
  const [sendEmail, setSendEmail] = useState(client?.email ? true : false);
  const [printerSelected, setPrinterSelected] = useState(true);

  // Obter informações do usuário atual
  const { user, userData } = useAuth();

  // Função para emitir a nota fiscal
  const emitirNota = async () => {
    try {
      setLoading(true);
      setError('');

      // Simulação da emissão - em um caso real, usaria uma API de emissão de NF
      // como FOCUS NFe ou algum outro provedor de serviços de emissão
      
      // Gerar um número de nota fictício para simulação
      const numeroNota = Math.floor(Math.random() * 1000000).toString().padStart(9, '0');
      setNfNumber(numeroNota);

      // Criar registro da nota fiscal no Firebase
      const notaFiscal = {
        tipo: nfType.toUpperCase(),
        numero: numeroNota,
        vendaId: saleId,
        cliente: {
          id: client.id,
          nome: client.nome,
          cpf: client.cpf || ''
        },
        itens: items.map(item => ({
          id: item.id,
          nome: item.info_geral?.nome,
          quantidade: item.quantity,
          valorUnitario: item.info_geral?.preco,
          valorTotal: item.info_geral?.preco * item.quantity
        })),
        valorTotal: total,
        dataEmissao: serverTimestamp(),
        emitidoPor: {
          id: user?.uid,
          nome: userData?.nome || user?.email
        },
        status: 'emitida',
        impresso: printerSelected,
        emailEnviado: sendEmail && client?.email ? true : false
      };

      // Caminho para o documento da nota fiscal
      const notasRef = collection(firestore, `lojas/${selectedLoja}/notas_fiscais`);
      await addDoc(notasRef, notaFiscal);

      // Atualizar o registro da venda com o número da nota fiscal
      const vendaRef = doc(firestore, `lojas/${selectedLoja}/vendas/items/${saleId}`);
      await updateDoc(vendaRef, {
        notaFiscal: {
          tipo: nfType.toUpperCase(),
          numero: numeroNota,
          dataEmissao: serverTimestamp()
        }
      });

      // Simular um pequeno atraso para dar feedback ao usuário
      setTimeout(() => {
        setSuccess(true);
        setLoading(false);
      }, 2000);

    } catch (err) {
      console.error('Erro ao emitir nota fiscal:', err);
      setError('Falha ao emitir a nota fiscal. Tente novamente.');
      setLoading(false);
    }
  };

  // Se o modal não estiver aberto, não renderiza nada
  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 overflow-y-auto">
      <div className="flex items-center justify-center min-h-screen pt-4 px-4 pb-20 text-center sm:block sm:p-0">
        <div className="fixed inset-0 transition-opacity" aria-hidden="true">
          <div className="absolute inset-0 bg-gray-500 opacity-75"></div>
        </div>

        <span className="hidden sm:inline-block sm:align-middle sm:h-screen" aria-hidden="true">&#8203;</span>

        <div className="inline-block align-bottom bg-white rounded-lg text-left overflow-hidden shadow-xl transform transition-all sm:my-8 sm:align-middle sm:max-w-lg sm:w-full">
          {/* Cabeçalho do modal */}
          <div className="bg-[#81059e] px-4 py-3 sm:px-6 flex justify-between items-center">
            <h3 className="text-lg leading-6 font-medium text-white flex items-center">
              <FiFileText className="mr-2" /> Emissão de Nota Fiscal
            </h3>
            <button
              onClick={onClose}
              className="bg-[#81059e] rounded-md text-white hover:text-gray-200 focus:outline-none"
            >
              <FiX size={24} />
            </button>
          </div>

          {/* Corpo do modal */}
          <div className="bg-white px-4 pt-5 pb-4 sm:p-6 sm:pb-4">
            {/* Exibir mensagem de erro */}
            {error && (
              <div className="bg-red-100 border-l-4 border-red-500 text-red-700 p-4 mb-4">
                <p>{error}</p>
              </div>
            )}

            {success ? (
              <div className="text-center">
                <div className="mx-auto flex items-center justify-center h-12 w-12 rounded-full bg-green-100">
                  <FiCheck className="h-6 w-6 text-green-600" />
                </div>
                <h3 className="mt-2 text-lg font-medium text-gray-900">Nota Fiscal Emitida com Sucesso!</h3>
                <div className="mt-2">
                  <p className="text-sm text-gray-500">
                    Número da Nota: <span className="font-semibold">{nfType.toUpperCase()} {nfNumber}</span>
                  </p>
                  {sendEmail && client?.email && (
                    <p className="text-sm text-gray-500 mt-1">
                      Um email com a nota fiscal foi enviado para {client.email}
                    </p>
                  )}
                  {printerSelected && (
                    <p className="text-sm text-gray-500 mt-1">
                      A nota fiscal foi enviada para impressão
                    </p>
                  )}
                </div>
                <div className="mt-5">
                  <button
                    type="button"
                    onClick={onClose}
                    className="inline-flex justify-center px-4 py-2 text-sm font-medium text-white bg-[#81059e] border border-transparent rounded-md hover:bg-[#6f0486] focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-[#81059e]"
                  >
                    Concluir
                  </button>
                </div>
              </div>
            ) : (
              <div>
                <div className="mb-4">
                  <p className="text-sm text-gray-500 mb-2">Selecione o tipo de nota fiscal:</p>
                  <div className="flex space-x-2">
                    <button
                      type="button"
                      onClick={() => setNfType('nfce')}
                      className={`px-4 py-2 text-sm font-medium rounded-md ${
                        nfType === 'nfe'
                          ? 'bg-[#81059e] text-white'
                          : 'bg-gray-200 text-gray-700 hover:bg-gray-300'
                      }`}
                    >
                      NF-e (Empresarial)
                    </button>
                  </div>
                </div>

                <div className="mb-4">
                  <p className="text-sm text-gray-500 mb-2">Resumo da venda:</p>
                  <div className="border rounded-md p-3 bg-gray-50">
                    <p><strong>Cliente:</strong> {client.nome}</p>
                    {client.cpf && <p><strong>CPF:</strong> {client.cpf}</p>}
                    <p><strong>Valor Total:</strong> R$ {total.toFixed(2)}</p>
                    <p><strong>Quantidade de Itens:</strong> {items.length}</p>
                  </div>
                </div>

                <div className="mb-4">
                  <p className="text-sm text-gray-500 mb-2">Opções adicionais:</p>
                  <div className="flex flex-col space-y-2">
                    <label className="inline-flex items-center">
                      <input
                        type="checkbox"
                        checked={printerSelected}
                        onChange={() => setPrinterSelected(!printerSelected)}
                        className="form-checkbox h-5 w-5 text-[#81059e]"
                      />
                      <span className="ml-2 text-gray-700 flex items-center">
                        <FiPrinter className="mr-1" /> Imprimir nota fiscal
                      </span>
                    </label>

                    {client.email && (
                      <label className="inline-flex items-center">
                        <input
                          type="checkbox"
                          checked={sendEmail}
                          onChange={() => setSendEmail(!sendEmail)}
                          className="form-checkbox h-5 w-5 text-[#81059e]"
                        />
                        <span className="ml-2 text-gray-700 flex items-center">
                          <FiMail className="mr-1" /> Enviar por e-mail para {client.email}
                        </span>
                      </label>
                    )}
                  </div>
                </div>
              </div>
            )}
          </div>

          {/* Rodapé do modal */}
          {!success && (
            <div className="bg-gray-50 px-4 py-3 sm:px-6 sm:flex sm:flex-row-reverse">
              <button
                type="button"
                onClick={emitirNota}
                disabled={loading}
                className="w-full inline-flex justify-center rounded-md border border-transparent shadow-sm px-4 py-2 bg-[#81059e] text-base font-medium text-white hover:bg-[#6f0486] focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-[#81059e] sm:ml-3 sm:w-auto sm:text-sm"
              >
                {loading ? (
                  <>
                    <div className="animate-spin h-4 w-4 border-2 border-white rounded-full border-t-transparent mr-2"></div>
                    Processando...
                  </>
                ) : (
                  'Emitir Nota Fiscal'
                )}
              </button>
              <button
                type="button"
                onClick={onClose}
                disabled={loading}
                className="mt-3 w-full inline-flex justify-center rounded-md border border-gray-300 shadow-sm px-4 py-2 bg-white text-base font-medium text-gray-700 hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-[#81059e] sm:mt-0 sm:w-auto sm:text-sm"
              >
                Cancelar
              </button>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

export default ModalNFe; 