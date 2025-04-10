import React from 'react';
import Link from 'next/link';
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';
import {
  faBox,
  faExchange,
  faPencilAlt,
} from '@fortawesome/free-solid-svg-icons';

const ProductDetailModal = ({ produto, isOpen, onClose, onTransfer }) => {
  if (!isOpen || !produto) return null;

  return (
    <div className="fixed inset-0 flex items-center justify-center bg-black bg-opacity-50 z-50">
      <div className="bg-white rounded-lg shadow-lg w-full max-w-4xl max-h-[90vh] overflow-y-auto">
        <div className="bg-[#81059e] text-white p-4 rounded-t-lg flex justify-between items-center">
          <h3 className="text-xl font-bold">Detalhes do Produto</h3>
          <button 
            onClick={onClose}
            className="text-white hover:text-gray-200"
          >
            ✕
          </button>
        </div>

        <div className="p-6">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            {/* Detalhes do produto */}
            <div>
              <h4 className="text-xl font-bold text-[#81059e] mb-4">{produto.titulo || 'Produto sem título'}</h4>
              
              <div className="space-y-4">
                <div className="grid grid-cols-2 gap-x-4 gap-y-2">
                  <div className="font-medium">Código:</div>
                  <div>{produto.codigo || 'N/A'}</div>
                  
                  <div className="font-medium">SKU:</div>
                  <div>{produto.sku || 'N/A'}</div>
                  
                  <div className="font-medium">Categoria:</div>
                  <div>
                    {produto.categoria === 'armacoes' ? 'Armação' :
                     produto.categoria === 'lentes' ? 'Lente' : 'Solar'}
                  </div>
                  
                  <div className="font-medium">Marca:</div>
                  <div>{produto.marca || 'N/A'}</div>
                  
                  <div className="font-medium">Loja:</div>
                  <div>{produto.loja === 'loja1' ? 'Loja 1' : 'Loja 2'}</div>
                  
                  <div className="font-medium">Fornecedor:</div>
                  <div>{produto.fornecedor || 'N/A'}</div>
                  
                  <div className="font-medium">Fabricante:</div>
                  <div>{produto.fabricante || 'N/A'}</div>
                  
                  <div className="font-medium">Quantidade:</div>
                  <div>{produto.quantidade} unidades</div>
                  
                  <div className="font-medium">Preço de Custo:</div>
                  <div>R$ {parseFloat(produto.custo || 0).toFixed(2)}</div>
                  
                  <div className="font-medium">Preço de Venda:</div>
                  <div>R$ {parseFloat(produto.valor || 0).toFixed(2)}</div>
                  
                  <div className="font-medium">Margem de Lucro:</div>
                  <div>{produto.percentual_lucro || 'N/A'}%</div>
                </div>
                
                {/* Propriedades específicas por categoria */}
                {(produto.categoria === 'armacoes' || produto.categoria === 'solares') && (
                  <div className="mt-4">
                    <h5 className="font-semibold text-[#81059e] mb-2">Especificações Técnicas</h5>
                    <div className="grid grid-cols-2 gap-x-4 gap-y-2">
                      {produto.material && (
                        <>
                          <div className="font-medium">Material:</div>
                          <div>{produto.material}</div>
                        </>
                      )}
                      {produto.formato && (
                        <>
                          <div className="font-medium">Formato:</div>
                          <div>{produto.formato}</div>
                        </>
                      )}
                      {produto.cor && (
                        <>
                          <div className="font-medium">Cor:</div>
                          <div>{produto.cor}</div>
                        </>
                      )}
                      {produto.aro && (
                        <>
                          <div className="font-medium">Aro:</div>
                          <div>{produto.aro}</div>
                        </>
                      )}
                      {produto.ponte && (
                        <>
                          <div className="font-medium">Ponte:</div>
                          <div>{produto.ponte}</div>
                        </>
                      )}
                      {produto.haste && (
                        <>
                          <div className="font-medium">Haste:</div>
                          <div>{produto.haste}</div>
                        </>
                      )}
                      {produto.lente && (
                        <>
                          <div className="font-medium">Lente:</div>
                          <div>{produto.lente}</div>
                        </>
                      )}
                      {produto.genero && (
                        <>
                          <div className="font-medium">Gênero:</div>
                          <div>{produto.genero}</div>
                        </>
                      )}
                    </div>
                  </div>
                )}
                
                {produto.categoria === 'lentes' && (
                  <div className="mt-4">
                    <h5 className="font-semibold text-[#81059e] mb-2">Especificações Técnicas</h5>
                    <div className="grid grid-cols-2 gap-x-4 gap-y-2">
                      {produto.material && (
                        <>
                          <div className="font-medium">Material:</div>
                          <div>{produto.material}</div>
                        </>
                      )}
                      {produto.indice && (
                        <>
                          <div className="font-medium">Índice:</div>
                          <div>{produto.indice}</div>
                        </>
                      )}
                      {produto.design && (
                        <>
                          <div className="font-medium">Design:</div>
                          <div>{produto.design}</div>
                        </>
                      )}
                      {produto.diametroDe && produto.diametroPara && (
                        <>
                          <div className="font-medium">Diâmetro:</div>
                          <div>De {produto.diametroDe} a {produto.diametroPara}</div>
                        </>
                      )}
                      {produto.esfericoDe && produto.esfericoPara && (
                        <>
                          <div className="font-medium">Esférico:</div>
                          <div>De {produto.esfericoDe} a {produto.esfericoPara}</div>
                        </>
                      )}
                      {produto.cilindroDe && produto.cilindroPara && (
                        <>
                          <div className="font-medium">Cilindro:</div>
                          <div>De {produto.cilindroDe} a {produto.cilindroPara}</div>
                        </>
                      )}
                      {produto.tecnologia && produto.tecnologia.length > 0 && (
                        <>
                          <div className="font-medium">Tecnologias:</div>
                          <div>{Array.isArray(produto.tecnologia) ? produto.tecnologia.join(', ') : produto.tecnologia}</div>
                        </>
                      )}
                      {produto.tratamento && produto.tratamento.length > 0 && (
                        <>
                          <div className="font-medium">Tratamentos:</div>
                          <div>{Array.isArray(produto.tratamento) ? produto.tratamento.join(', ') : produto.tratamento}</div>
                        </>
                      )}
                    </div>
                  </div>
                )}
                
                {/* Informações fiscais */}
                <div className="mt-4">
                  <h5 className="font-semibold text-[#81059e] mb-2">Informações Fiscais</h5>
                  <div className="grid grid-cols-2 gap-x-4 gap-y-2">
                    <div className="font-medium">NCM:</div>
                    <div>{produto.NCM || 'N/A'}</div>
                    
                    <div className="font-medium">CEST:</div>
                    <div>{produto.CEST || produto.cest || 'N/A'}</div>
                    
                    <div className="font-medium">CSOSN:</div>
                    <div>{produto.CSOSN || produto.csosn || 'N/A'}</div>
                  </div>
                </div>
              </div>
              
              {/* Botões de ação */}
              <div className="mt-6 flex space-x-3">
                <Link href={`/products_and_services/${produto.categoria === 'armacoes' ? 'frames' : produto.categoria === 'lentes' ? 'lenses' : 'solar'}/edit?id=${produto.id}&loja=${produto.loja}`}>
                  <button className="bg-blue-500 text-white px-4 py-2 rounded hover:bg-blue-600 transition">
                    <FontAwesomeIcon icon={faPencilAlt} className="mr-2" /> Editar Produto
                  </button>
                </Link>
                <button
                  onClick={() => {
                    onClose();
                    onTransfer(produto);
                  }}
                  className="bg-orange-500 text-white px-4 py-2 rounded hover:bg-orange-600 transition"
                >
                  <FontAwesomeIcon icon={faExchange} className="mr-2" /> Transferir
                </button>
              </div>
            </div>
            
            {/* Imagem do produto */}
            <div>
              <div className="bg-gray-100 rounded-lg p-4 h-full flex flex-col justify-between">
                <div className="flex-grow flex items-center justify-center">
                  {produto.imagemUrl ? (
                    <img 
                      src={produto.imagemUrl} 
                      alt={produto.titulo || 'Produto'} 
                      className="max-w-full max-h-80 object-contain" 
                      onError={(e) => {
                        e.target.onerror = null;
                        e.target.src = '/images/placeholder-product.png';
                      }}
                    />
                  ) : (
                    <div className="h-64 w-64 bg-gray-200 flex items-center justify-center">
                      <FontAwesomeIcon icon={faBox} className="text-gray-400 text-6xl" />
                    </div>
                  )}
                </div>
                
                <div className="mt-4 text-center">
                  <div className="font-semibold text-gray-700">Código: {produto.codigo}</div>
                  <div className="text-gray-600">
                    {produto.categoria === 'armacoes' ? 'Armação' :
                     produto.categoria === 'lentes' ? 'Lente' : 'Óculos Solar'} - 
                    {produto.loja === 'loja1' ? ' Loja 1' : ' Loja 2'}
                  </div>
                  <div className="mt-2 font-bold text-lg">
                    R$ {parseFloat(produto.valor || 0).toFixed(2)}
                  </div>
                  <div className={`mt-1 font-semibold ${parseInt(produto.quantidade) < 10 ? 'text-red-600' : parseInt(produto.quantidade) < 50 ? 'text-yellow-600' : 'text-green-600'}`}>
                    Estoque: {produto.quantidade} unidades
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
        
        <div className="bg-gray-100 px-6 py-4 rounded-b-lg flex justify-end">
          <button
            onClick={onClose}
            className="px-4 py-2 bg-gray-500 text-white rounded-md hover:bg-gray-600 transition"
          >
            Fechar
          </button>
        </div>
      </div>
    </div>
  );
};

export default ProductDetailModal;