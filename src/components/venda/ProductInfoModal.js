import React from 'react';
import { FiX, FiImage } from 'react-icons/fi';

const ProductInfoModal = ({ product, onClose }) => {
  if (!product) return null;

  // Função para verificar e exibir valores ou "N/A"
  const displayValue = (value) => {
    if (value === undefined || value === null || value === '') {
      return "N/A";
    }
    return value;
  };

  // Determinar a categoria do produto
  const categoria = product.categoria || (product.subcategoria === 'solar' ? 'solares' : '');
  
  // Título baseado na categoria
  const tituloEspecificacoes = categoria === 'armacoes' || categoria === 'solares' 
    ? 'Especificações da Armação' 
    : categoria === 'lentes' 
      ? 'Especificações da Lente'
      : 'Especificações do Produto';

  // Obter a imagem do produto (diferentes campos dependendo do tipo)
  const getProductImage = () => {
    if (product.imagem) {
      return product.imagem;
    } else if (product.imagemUrl) {
      return product.imagemUrl;
    }
    return null;
  };

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 z-50 flex items-center justify-center p-4">
      <div className="bg-white rounded-lg shadow-xl w-full max-w-2xl overflow-hidden flex flex-col" style={{ maxHeight: '90vh' }}>
        {/* Cabeçalho do modal */}
        <div className="flex justify-between items-center p-4 border-b bg-[#81059e] text-white">
          <h3 className="text-xl font-bold">Informações do Produto</h3>
          <button onClick={onClose} className="text-white hover:text-gray-200">
            <FiX size={24} />
          </button>
        </div>
        
        {/* Conteúdo do modal com scroll interno */}
        <div className="overflow-y-auto flex-grow" style={{ maxHeight: 'calc(90vh - 124px)' }}>
          {/* Área da imagem e detalhes principais */}
          <div className="flex flex-col md:flex-row border-b pb-4">
            {/* Imagem do produto */}
            <div className="p-6 md:w-1/2 flex justify-center items-center">
              {getProductImage() ? (
                <img 
                  src={getProductImage()} 
                  alt={product.nome || "Produto"} 
                  className="w-full h-auto object-contain max-h-[200px]"
                />
              ) : (
                <div className="w-full h-48 bg-gray-100 rounded-md flex flex-col items-center justify-center">
                  <FiImage size={40} className="text-gray-400 mb-2" />
                  <span className="text-gray-500">Sem imagem disponível</span>
                </div>
              )}
            </div>
            
            {/* Informações principais */}
            <div className="px-6 py-3 md:w-1/2 flex flex-col justify-center">
              <div className="grid grid-cols-2 gap-y-2 w-full">
                <div>
                  <h4 className="text-sm font-medium text-gray-500">Código</h4>
                  <p className="font-medium">{displayValue(product.codigo)}</p>
                </div>
                <div>
                  <h4 className="text-sm font-medium text-gray-500">SKU</h4>
                  <p>{displayValue(product.sku)}</p>
                </div>
                <div>
                  <h4 className="text-sm font-medium text-gray-500">Marca</h4>
                  <p>{displayValue(product.marca)}</p>
                </div>
                <div>
                  <h4 className="text-sm font-medium text-gray-500">Estoque</h4>
                  <p>{product.quantidade || "0"} unidades</p>
                </div>
              </div>
            </div>
          </div>
          
          {/* Especificações - em formato de tabela (como na imagem) */}
          <div className="px-6 pb-6">
            <h4 className="text-lg font-medium py-3 border-b">
              {tituloEspecificacoes}
            </h4>
            
            <div className="grid grid-cols-3 gap-4 mt-3">
              {/* Primeira coluna */}
              <div className="flex flex-col space-y-4">
                <div>
                  <h5 className="text-sm font-medium text-gray-500">Material</h5>
                  <p>{displayValue(product.material)}</p>
                </div>
                <div>
                  <h5 className="text-sm font-medium text-gray-500">Código Fabricante</h5>
                  <p>{displayValue(product.codigoFabricante)}</p>
                </div>
                <div>
                  <h5 className="text-sm font-medium text-gray-500">Cor</h5>
                  <p>{displayValue(product.cor)}</p>
                </div>
                <div>
                  <h5 className="text-sm font-medium text-gray-500">Ponte</h5>
                  <p>{displayValue(product.ponte)}</p>
                </div>
              </div>
              
              {/* Segunda coluna */}
              <div className="flex flex-col space-y-4">
                <div>
                  <h5 className="text-sm font-medium text-gray-500">Código</h5>
                  <p>{displayValue(product.codigo)}</p>
                </div>
                <div>
                  <h5 className="text-sm font-medium text-gray-500">NCM</h5>
                  <p>{displayValue(product.NCM)}</p>
                </div>
                <div>
                  <h5 className="text-sm font-medium text-gray-500">Gênero</h5>
                  <p>{displayValue(product.genero)}</p>
                </div>
                <div>
                  <h5 className="text-sm font-medium text-gray-500">Haste</h5>
                  <p>{displayValue(product.haste)}</p>
                </div>
              </div>
              
              {/* Terceira coluna */}
              <div className="flex flex-col space-y-4">
                <div>
                  <h5 className="text-sm font-medium text-gray-500">Marca</h5>
                  <p>{displayValue(product.marca)}</p>
                </div>
                <div>
                  <h5 className="text-sm font-medium text-gray-500">Fornecedor</h5>
                  <p>{displayValue(product.fornecedor)}</p>
                </div>
                <div>
                  <h5 className="text-sm font-medium text-gray-500">Código de Barras</h5>
                  <p>{displayValue(product.codigoBarras)}</p>
                </div>
                <div>
                  <h5 className="text-sm font-medium text-gray-500">Aro</h5>
                  <p>{displayValue(product.aro)}</p>
                </div>
              </div>
            </div>
          </div>
          
          {/* Mostrar adicionais baseados em categoria */}
          {categoria === 'lentes' && (
            <div className="px-6 pb-6">
              <h4 className="text-lg font-medium py-3 border-b">
                Especificações Técnicas da Lente
              </h4>
              
              <div className="grid grid-cols-3 gap-4 mt-3">
                <div>
                  <h5 className="text-sm font-medium text-gray-500">Índice</h5>
                  <p>{displayValue(product.indice)}</p>
                </div>
                <div>
                  <h5 className="text-sm font-medium text-gray-500">Família</h5>
                  <p>{displayValue(product.familia)}</p>
                </div>
                <div>
                  <h5 className="text-sm font-medium text-gray-500">Subfamília</h5>
                  <p>{displayValue(product.subfamilia)}</p>
                </div>
                <div>
                  <h5 className="text-sm font-medium text-gray-500">Tipo</h5>
                  <p>{Array.isArray(product.tipo) ? product.tipo.join(", ") : displayValue(product.tipo)}</p>
                </div>
                <div>
                  <h5 className="text-sm font-medium text-gray-500">Tratamentos</h5>
                  <p>{Array.isArray(product.tratamentos) ? product.tratamentos.join(", ") : displayValue(product.tratamentos)}</p>
                </div>
              </div>
            </div>
          )}
        </div>
        
        {/* Botão de fechar fixo na parte inferior */}
        <div className="p-4 border-t flex justify-end bg-white">
          <button
            onClick={onClose}
            className="px-6 py-2 bg-[#81059e] hover:bg-[#6a0484] text-white rounded"
          >
            Fechar
          </button>
        </div>
      </div>
    </div>
  );
};

export default ProductInfoModal;