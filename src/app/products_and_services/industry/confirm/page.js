'use client';
import { useRouter } from 'next/navigation';
import Layout from '@/components/Layout'; // Substitua pelo caminho correto do seu layout
import Image from 'next/image';
import { useState } from 'react'; // Importar useState para controlar o estado do botão
import { addDoc, collection } from 'firebase/firestore';
import { firestore } from '../../../../lib/firebaseConfig'; // Certifique-se de que a importação está correta

const ConfirmarRegistro = ({ searchParams }) => {
  const router = useRouter();
  const [isSubmitting, setIsSubmitting] = useState(false); // Estado para controlar o envio
  const {
    razaoSocial,
    nomeFantasia,
    cnpj,
    email,
    telefone,
    cep,
    numero,
    logradouro,
    estado,
    cidade
  } = searchParams;

  const handleEdit = () => {
    // Redirecionar para a página de edição com os dados atuais
    router.push(`/products_and_services/industry/add-industry?${new URLSearchParams(searchParams).toString()}`);
  };

  const handleConfirm = async () => {
    if (isSubmitting) return; // Evitar envio duplo
    setIsSubmitting(true); // Iniciar o estado de envio
    try {
      // Enviar os dados para a coleção /armacoes_fabricantes no Firestore
      await addDoc(collection(firestore, 'armacoes_fabricantes'), {
        razaoSocial,
        nomeFantasia,
        cnpj,
        email,
        telefone,
        cep,
        numero,
        logradouro,
        estado,
        cidade,
      });
      alert('Registro confirmado com sucesso!');
      // Redirecionar para outra página após confirmação
      router.push('/products_and_services/industry');
    } catch (error) {
      console.error('Erro ao confirmar o registro:', error);
      alert('Ocorreu um erro ao confirmar o registro. Tente novamente.');
    } finally {
      setIsSubmitting(false); // Resetar o estado após a tentativa de envio
    }
  };

  return (
    <Layout>
      <div className="p-4">
        <h1 className="text-2xl font-bold mb-4" style={{ color: '#81059e87' }}>
          Confirmar Registro
        </h1>
        <div className="bg-white shadow-md rounded px-8 pt-6 pb-8 mb-4">
          <p className="text-black mb-2"><strong style={{ color: '#81059e87' }}>Razão Social</strong><br />{razaoSocial}</p>
          <p className="text-black mb-2"><strong style={{ color: '#81059e87' }}>CNPJ</strong><br />{cnpj}</p>
          <p className="text-black mb-2"><strong style={{ color: '#81059e87' }}>Nome Fantasia</strong><br />{nomeFantasia}</p>
          <p className="text-black mb-2"><strong style={{ color: '#81059e87' }}>Email</strong><br />{email}</p>

          {/* Ajustar os campos Telefone, CEP e Número em uma única linha */}
          <div className="flex mb-2">
            <p className="flex-1 text-black">
              <strong style={{ color: '#81059e87' }}>Telefone</strong><br />
              {telefone}
            </p>
            <p className="flex-1 text-black">
              <strong style={{ color: '#81059e87' }}>CEP</strong><br />
              {cep}
            </p>
            <p className="flex-1 text-black">
              <strong style={{ color: '#81059e87' }}>Número</strong><br />
              {numero}
            </p>
          </div>

          <div className="flex mb-2">
            <p className="flex-1 text-black">
              <strong style={{ color: '#81059e87' }}>Logradouro</strong><br />
              {logradouro}
            </p>
            <p className="flex-1 text-black">
              <strong style={{ color: '#81059e87' }}>Cidade</strong><br />
              {cidade}
            </p>
          </div>

          <p className="text-black mb-2"><strong style={{ color: '#81059e87' }}>Estado</strong><br />{estado}</p>

          <div className="flex items-center justify-between mt-8">
            <button
              type="button"
              onClick={handleEdit}
              className="bg-[#81059e87] text-white font-bold py-2 px-4 rounded flex items-center"
            >
              <Image src="/images/edit.png" alt="Editar" width={20} height={20} className="mr-2" /> Editar
            </button>
            <button
              type="button"
              onClick={handleConfirm}
              className="bg-[#81059e87] text-white font-bold py-2 px-4 rounded flex items-center"
              disabled={isSubmitting} // Desabilitar o botão enquanto está enviando
            >
              <Image src="/images/check.png" alt="Confirmar" width={20} height={20} className="mr-2" /> {isSubmitting ? 'Enviando...' : 'Confirmar'}
            </button>
          </div>
        </div>
      </div>
    </Layout>
  );
};

export default ConfirmarRegistro;
