'use client'
import { useState } from 'react';
import Layout from '@/components/Layout';
import { useRouter } from 'next/navigation';
import { firestore } from '../../../lib/firebaseConfig'; // Firestore import
import { doc, getDoc } from 'firebase/firestore';
import { addDays, format } from 'date-fns';

export default function ControleCaixa() {
  const router = useRouter();
  const [selectedDate, setSelectedDate] = useState(null); // Estado para armazenar o dia selecionado
  const [errorMessage, setErrorMessage] = useState('');

  // Função para obter o nome do mês atual
  const getMonthName = () => {
    const monthNames = [
      'JANEIRO', 'Fevereiro', 'MARÇO', 'ABRIL', 'MAIO', 'JUNHO',
      'JULHO', 'AGOSTO', 'SETEMBRO', 'OUTUBRO', 'NOVEMBRO', 'DEZEMBRO'
    ];
    const date = new Date();
    return monthNames[date.getMonth()];
  };

  // Função para verificar se já existe um caixa para a data selecionada
  const checkExistingCashiers = async (formattedDate) => {
    const store1DocRef = doc(firestore, `loja1/finances/caixas/${formattedDate}`);
    const store2DocRef = doc(firestore, `loja2/finances/caixas/${formattedDate}`);
    const store1Exists = await getDoc(store1DocRef);
    const store2Exists = await getDoc(store2DocRef);
    return { store1Exists: store1Exists.exists(), store2Exists: store2Exists.exists() };
  };

  // Função para renderizar os dias do calendário
  const renderCalendarDays = () => {
    const today = new Date(); // Data atual
    const currentMonth = today.getMonth(); // Mês atual
    const currentYear = today.getFullYear(); // Ano atual
    const firstDayOfMonth = new Date(currentYear, currentMonth, 1); // Primeiro dia do mês atual
    const daysInMonth = new Date(currentYear, currentMonth + 1, 0).getDate(); // Total de dias no mês
    const currentHour = today.getHours(); // Hora atual

    const daysArray = [];

    // Adicionar dias vazios para alinhar o primeiro dia do mês corretamente
    for (let i = 0; i < firstDayOfMonth.getDay(); i++) {
      daysArray.push(null); // Dias em branco
    }

    // Preencher os dias do mês
    for (let day = 1; day <= daysInMonth; day++) {
      daysArray.push(day);
    }

    return daysArray.map((day, index) => {
      if (!day) {
        return <div key={index} className="w-full h-full" />; // Espaço vazio para alinhar corretamente
      }

      const clickedDate = new Date(currentYear, currentMonth, day);
      const isFutureDate = clickedDate.setHours(0, 0, 0, 0) > today.setHours(0, 0, 0, 0); // Verificar se é uma data futura

      const formattedDateForURL = format(clickedDate, 'dd-MM-yyyy'); // Formatando a data

      // Se for após as 18h, permitir que o dia seguinte seja clicado
      const isNextDay = day === today.getDate() + 1 && currentHour >= 18;

      return (
        <button
          key={index}
          onClick={async () => {
            setSelectedDate(day); // Atualiza o estado com o dia selecionado
            const formattedDate = format(clickedDate, 'dd|MM|yyyy');
            const { store1Exists, store2Exists } = await checkExistingCashiers(formattedDate);

            // Verificar se existem caixas abertos para a data selecionada
            if (store1Exists && store2Exists) {
              router.push(`/finance/cashier_day/options?date=${formattedDateForURL}`);
            } else {
              router.push(`/finance/cashier_day/options?date=${formattedDateForURL}`);
            }
          }}
          className={`flex items-center justify-center p-3 w-full h-full rounded-full font-bold transition-all duration-300 ease-in-out ${selectedDate === day
              ? 'bg-purple-500 text-white border-purple-500 shadow-lg'
              : index % 7 === 0
                ? 'text-red-500/70 text-xl font-normal'
                : 'text-[#81059e]/70 text-xl font-normal hover:bg-purple-500 hover:text-white'
            }`}
          style={{
            cursor: isFutureDate && !isNextDay ? 'not-allowed' : 'pointer', // Habilita o próximo dia após as 18h
          }}
          disabled={isFutureDate && !isNextDay} // Desabilita dias futuros, exceto o dia seguinte após as 18h
        >
          {day}
        </button>
      );
    });
  };

  return (
    <Layout>
      <div className="p-2">


        {/* Título e Mês atual */}
        <div className="text-center mb-6">
          <h2 className="text-4xl font-bold" style={{ color: '#81059e' }}>SELECIONE UMA DATA</h2>

        </div>

        {/* Calendário */}
        <div className=" p-6 rounded-lg mb-20">
          <div className='flex justify-start p-2  border-[#81059e]/70 mb-2'>
            <p className="text-3xl" style={{ color: '#81059e', }}>{getMonthName()}</p>
          </div>
          <div className="grid grid-cols-7 gap-4 text-center text-lg font-bold border-b-2 pb-4">
            {['DOM', 'SEG', 'TER', 'QUA', 'QUI', 'SEX', 'SAB'].map((day, index) => (
              <div key={index} className={`uppercase flex items-center justify-center h-10 ${index === 0 ? 'text-white bg-red-400/30 opacity-85 rounded-full' : 'text-white bg-[#81059e]/30 rounded-full'}`}>
                {day}
              </div>
            ))}
          </div>

          {/* Dias do mês */}
          <div className="grid grid-cols-7 gap-4 mt-4">
            {renderCalendarDays()}
          </div>
        </div>

        {errorMessage && (
          <div className="mt-4 text-yellow-500 text-center">
            {errorMessage}
          </div>
        )}
      </div>
    </Layout>
  );
}
