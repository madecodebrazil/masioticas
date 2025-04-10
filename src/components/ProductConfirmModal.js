// src/components/ProductConfirmationModal.jsx
import React from 'react';
import { useRouter } from 'next/navigation';
import { doc, setDoc, deleteDoc } from 'firebase/firestore';
import { firestore } from '@/lib/firebaseConfig';


const ProductConfirmModal = ({ 
  isOpen, 
  onClose, 
  productData, 
  setIsLoading 
}) => {
  const router = useRouter();

  if (!isOpen) return null;

  const handleConfirmSubmit = async () => {
    setIsLoading(true);

    try {
      const { codigo, lojas, avaria } = productData;

      // Garantir que 'avaria' esteja sempre presente
      const dataToSend = {
        ...productData,
        avaria: avaria !== undefined ? avaria : false,
      };

      // Salvar o produto na estrutura correta do estoque para cada loja
      const savePromises = lojas.map(async (loja) => {
        const lojaId = loja.includes("Loja 1") ? "loja1" : 
                     loja.includes("Loja 2") ? "loja2" : loja.toLowerCase().replace(/\s+/g, '');
        
        const docRef = doc(
          firestore,
          `/estoque/${lojaId}/armacoes`, 
          codigo
        );
        
        await setDoc(docRef, dataToSend);
        console.log(`Produto salvo no estoque da ${loja}:`, dataToSend);
      });
      
      await Promise.all(savePromises);

      // Apagar os dados da coleção 'temp_image'
      const tempDocRef = doc(firestore, "temp_image", codigo);
      await deleteDoc(tempDocRef);
      console.log("Dados temporários removidos com sucesso");

      // Redirecionar o usuário após confirmar
      router.push("/products_and_services/frames");
    } catch (error) {
      console.error("Erro ao confirmar e enviar os dados:", error);
      alert(`Erro ao salvar o produto: ${error.message}`);
    } finally {
      setIsLoading(false);
      onClose();
    }
  };

  // Função para formatar valores monetários
  const formatCurrency = (value) => {
    if (!value) return "0,00";
    return parseFloat(value).toLocaleString('pt-BR', {
      minimumFractionDigits: 2,
      maximumFractionDigits: 2
    });
  };

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 z-50 flex items-center justify-center p-4">
      <div className="bg-white rounded-lg shadow-xl w-full max-w-4xl max-h-[90vh] overflow-y-auto">
        {/* Cabeçalho do Modal */}
        <div className="bg-[#81059e] text-white p-4 rounded-t-lg">
          <h2 className="text-xl font-bold">Confirmar Cadastro de Produto</h2>
        </div>
        
        {/* Conteúdo do Modal */}
        <div className="p-6">
          {/* Seção de imagem e informações básicas */}
          <div className="flex flex-col md:flex-row gap-6 mb-6">
            {/* Imagem do produto */}
            <div className="w-full md:w-1/3">
              {productData.imagemUrl ? (
                <img 
                  src={productData.imagemUrl} 
                  alt={productData.titulo || "Imagem do produto"} 
                  className="w-full h-auto object-contain border border-gray-300 rounded-md" 
                />
              ) : (
                <div className="w-full h-48 bg-gray-200 flex items-center justify-center rounded-md">
                  <span className="text-gray-500">Sem imagem disponível</span>
                </div>
              )}
            </div>
            
            {/* Informações principais */}
            <div className="w-full md:w-2/3">
              <h3 className="text-xl font-bold text-[#81059e] mb-2">{productData.titulo || "Produto não especificado"}</h3>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <p><span className="font-semibold">Código:</span> {productData.codigo}</p>
                  <p><span className="font-semibold">SKU:</span> {productData.sku}</p>
                  <p><span className="font-semibold">Tipo:</span> {productData.subcategoria?.toUpperCase()}</p>
                  <p><span className="font-semibold">Código de Barras:</span> {productData.codigoBarras}</p>
                </div>
                <div>
                  <p><span className="font-semibold">Marca:</span> {productData.marca}</p>
                  <p><span className="font-semibold">Fabricante:</span> {productData.fabricante}</p>
                  <p><span className="font-semibold">Fornecedor:</span> {productData.fornecedor}</p>
                  <p><span className="font-semibold">Gênero:</span> {productData.genero}</p>
                </div>
              </div>
            </div>
          </div>
          
          {/* Características do produto */}
          <div className="mb-6">
            <h4 className="text-lg font-semibold text-[#81059e] mb-2 border-b border-gray-200 pb-1">Características</h4>
            <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-4">
              <p><span className="font-semibold">Material:</span> {productData.material}</p>
              <p><span className="font-semibold">Cor:</span> {productData.cor}</p>
              <p><span className="font-semibold">Formato:</span> {productData.formato}</p>
              <p><span className="font-semibold">Aro:</span> {productData.aro}</p>
              <p><span className="font-semibold">Ponte:</span> {productData.ponte}</p>
              <p><span className="font-semibold">Haste:</span> {productData.haste}</p>
              <p><span className="font-semibold">Lente:</span> {productData.lente}</p>
            </div>
          </div>
          
          {/* Informações de preço e quantidade */}
          <div className="mb-6">
            <h4 className="text-lg font-semibold text-[#81059e] mb-2 border-b border-gray-200 pb-1">Valores e Estoque</h4>
            <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-4">
              <p><span className="font-semibold">Custo:</span> R$ {formatCurrency(productData.custo)}</p>
              <p><span className="font-semibold">Valor de Venda:</span> <span className="text-green-600 font-bold">R$ {formatCurrency(productData.valor)}</span></p>
              <p><span className="font-semibold">Lucro:</span> {productData.percentual_lucro}%</p>
              <p><span className="font-semibold">Custo Médio:</span> R$ {formatCurrency(productData.custo_medio)}</p>
              <p><span className="font-semibold">Quantidade:</span> {productData.quantidade}</p>
              <p><span className="font-semibold">Unidade:</span> {productData.unidade}</p>
            </div>
          </div>
          
          {/* Informações fiscais */}
          <div className="mb-6">
            <h4 className="text-lg font-semibold text-[#81059e] mb-2 border-b border-gray-200 pb-1">Informações Fiscais</h4>
            <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-4">
              <p><span className="font-semibold">NCM:</span> {productData.NCM}</p>
              <p><span className="font-semibold">CEST:</span> {productData.CEST}</p>
              <p><span className="font-semibold">CFOP:</span> {productData.cfop}</p>
              <p><span className="font-semibold">CSOSN:</span> {productData.csosn}</p>
              <p><span className="font-semibold">Origem:</span> {productData.origem_produto}</p>
            </div>
          </div>
          
          {/* Lojas */}
          <div className="mb-6">
            <h4 className="text-lg font-semibold text-[#81059e] mb-2 border-b border-gray-200 pb-1">Lojas</h4>
            <div className="flex flex-wrap gap-2">
              {Array.isArray(productData.lojas) ? 
                productData.lojas.map((loja, index) => (
                  <span key={index} className="bg-[#81059e] text-white px-3 py-1 rounded-full text-sm">
                    {loja}
                  </span>
                )) : 
                <span className="text-gray-500">Nenhuma loja selecionada</span>
              }
            </div>
          </div>
        </div>
        
        {/* Rodapé com botões */}
        <div className="bg-gray-100 p-4 rounded-b-lg flex justify-end gap-4">
          <button
            onClick={onClose}
            className="bg-gray-500 hover:bg-gray-600 text-white px-4 py-2 rounded-lg transition-colors"
          >
            Cancelar
          </button>
          <button
            onClick={handleConfirmSubmit}
            className="bg-[#81059e] hover:bg-[#6a0480] text-white px-4 py-2 rounded-lg transition-colors"
          >
            Confirmar Cadastro
          </button>
        </div>
      </div>
    </div>
  );
};

export default ProductConfirmModal;