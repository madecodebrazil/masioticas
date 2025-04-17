// src/components/ProductLensConfirmModal.jsx
import React from 'react';
import { useRouter } from 'next/navigation';
import { doc, setDoc, deleteDoc } from 'firebase/firestore';
import { firestore } from '@/lib/firebaseConfig';

const ProductLensConfirmModal = ({ 
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
      const { codigo, lojas } = productData;

      // Salvar o produto na estrutura correta do estoque para cada loja
      const savePromises = lojas.map(async (loja) => {
        const lojaId = loja.includes("Loja 1") ? "loja1" : 
                     loja.includes("Loja 2") ? "loja2" : loja.toLowerCase().replace(/\s+/g, '');
        
        const docRef = doc(
          firestore,
          `/estoque/${lojaId}/lentes`, 
          codigo || productData.sku
        );
        
        await setDoc(docRef, productData);
        console.log(`Produto salvo no estoque da ${loja}:`, productData);
      });
      
      await Promise.all(savePromises);

      // Apagar os dados da coleção 'temp_image'
      const tempDocRef = doc(firestore, "temp_image", codigo || productData.sku);
      await deleteDoc(tempDocRef);
      console.log("Dados temporários removidos com sucesso");

      // Redirecionar o usuário após confirmar
      router.push("/products_and_services/lenses");
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
          <h2 className="text-xl font-bold">Confirmar Cadastro de Lente</h2>
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
                  alt={productData.nome || "Imagem da lente"} 
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
              <h3 className="text-xl font-bold text-[#81059e] mb-2">{productData.nome || "Lente não especificada"}</h3>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <p><span className="font-semibold">Código:</span> {productData.codigo}</p>
                  <p><span className="font-semibold">SKU:</span> {productData.sku}</p>
                  <p><span className="font-semibold">Família:</span> {productData.familia}</p>
                  <p><span className="font-semibold">Sub-família:</span> {productData.subfamilia}</p>
                </div>
                <div>
                  <p><span className="font-semibold">Marca:</span> {productData.marca}</p>
                  <p><span className="font-semibold">Fabricante:</span> {productData.fabricante}</p>
                  <p><span className="font-semibold">Fornecedor:</span> {productData.fornecedor}</p>
                  <p><span className="font-semibold">Índice:</span> {productData.indice}</p>
                </div>
              </div>
            </div>
          </div>
          
          {/* Características técnicas */}
          <div className="mb-6">
            <h4 className="text-lg font-semibold text-[#81059e] mb-2 border-b border-gray-200 pb-1">Características Técnicas</h4>
            <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-4">
              <p><span className="font-semibold">Material:</span> {productData.material}</p>
              <p><span className="font-semibold">Design:</span> {productData.design}</p>
              <p><span className="font-semibold">Unidade:</span> {productData.unidade}</p>
              <p><span className="font-semibold">Esférico:</span> De {productData.esfericoDe} a {productData.esfericoPara}</p>
              <p><span className="font-semibold">Cilindro:</span> De {productData.cilindroDe} a {productData.cilindroPara}</p>
              <p><span className="font-semibold">Diâmetro:</span> De {productData.diametroDe} a {productData.diametroPara}</p>
              {productData.adicaoDe && productData.adicaoPara && (
                <p><span className="font-semibold">Adição:</span> De {productData.adicaoDe} a {productData.adicaoPara}</p>
              )}
            </div>
          </div>
          
          {/* Tecnologias e Tratamentos */}
          <div className="mb-6">
            <h4 className="text-lg font-semibold text-[#81059e] mb-2 border-b border-gray-200 pb-1">Tecnologias e Tratamentos</h4>
            <div className="grid grid-cols-1 gap-4">
              <p><span className="font-semibold">Tipo:</span> {Array.isArray(productData.tipo) ? productData.tipo.join(', ') : productData.tipo}</p>
              {productData.corredor && productData.corredor.length > 0 && (
                <p><span className="font-semibold">Corredor:</span> {Array.isArray(productData.corredor) ? productData.corredor.join(', ') : productData.corredor}</p>
              )}
              <p><span className="font-semibold">Tecnologias:</span> {Array.isArray(productData.tecnologias) ? productData.tecnologias.join(', ') : productData.tecnologias}</p>
              <p><span className="font-semibold">Tratamentos:</span> {Array.isArray(productData.tratamentos) ? productData.tratamentos.join(', ') : productData.tratamentos}</p>
            </div>
          </div>
          
          {/* Informações de preço e estoque */}
          <div className="mb-6">
            <h4 className="text-lg font-semibold text-[#81059e] mb-2 border-b border-gray-200 pb-1">Valores e Estoque</h4>
            <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-4">
              <p><span className="font-semibold">Custo:</span> R$ {formatCurrency(productData.custo)}</p>
              <p><span className="font-semibold">Valor de Venda:</span> <span className="text-green-600 font-bold">R$ {formatCurrency(productData.valor)}</span></p>
              {productData.precoPromocional && (
                <p><span className="font-semibold">Preço Promocional:</span> R$ {formatCurrency(productData.precoPromocional)}</p>
              )}
              <p><span className="font-semibold">Lucro:</span> {productData.percentual_lucro}%</p>
              <p><span className="font-semibold">Custo Médio:</span> R$ {formatCurrency(productData.custo_medio)}</p>
              <p><span className="font-semibold">Quantidade:</span> {productData.quantidade}</p>
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

export default ProductLensConfirmModal;