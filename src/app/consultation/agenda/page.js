"use client";
import React, { useState, useEffect } from "react";
import { getFirestore, collection, getDocs } from "firebase/firestore";
import Layout from "@/components/Layout"; // Seu layout instanciado
import { app } from "@/lib/firebaseConfig"; // Certifique-se de que o Firebase está corretamente inicializado
import {
  format,
  addMonths,
  subMonths,
  startOfMonth,
  endOfMonth,
  startOfWeek,
  endOfWeek,
  isSameDay,
  isSameMonth,
  eachDayOfInterval,
} from "date-fns"; // Biblioteca de datas

const db = getFirestore(app); // Inicializando Firestore

const CalendarConsultation = () => {
  const [consultations, setConsultations] = useState([]); // Armazenar todas as consultas
  const [selectedDate, setSelectedDate] = useState(new Date()); // Data selecionada pelo usuário
  const [selectedDay, setSelectedDay] = useState(null); // Armazenar o dia clicado
  const [consultationsByDay, setConsultationsByDay] = useState([]); // Consultas para a data selecionada
  const [isLoading, setIsLoading] = useState(true); // Estado de carregamento

  // Função para buscar todas as consultas no Firestore
  const fetchConsultations = async () => {
    setIsLoading(true); // Inicia o estado de carregamento
    try {
      const consultationsCollection = collection(db, "consultations"); // Referência à coleção consultations
      const querySnapshot = await getDocs(consultationsCollection);

      const consultationsData = [];
      querySnapshot.forEach((doc) => {
        const data = doc.data();
        consultationsData.push({ id: doc.id, ...data }); // Atribuir os dados ao array
      });

      setConsultations(consultationsData); // Armazenar todas as consultas
    } catch (error) {
      console.error("Erro ao buscar consultas:", error);
    } finally {
      setIsLoading(false); // Para o estado de carregamento
    }
  };

  // useEffect para buscar as consultas quando a página carregar
  useEffect(() => {
    fetchConsultations();
  }, []);

  // Função para retornar as consultas de uma data específica
  const getConsultationsByDay = (date) => {
    return consultations.filter((consultation) =>
      isSameDay(new Date(consultation.data.replace(/-/g, "/")), date)
    );
  };

  // Função para gerar os dias do mês atual, incluindo os dias antes e depois para completar as semanas
  const generateCalendarDays = () => {
    const start = startOfWeek(startOfMonth(selectedDate)); // Início da semana do primeiro dia do mês
    const end = endOfWeek(endOfMonth(selectedDate)); // Final da semana do último dia do mês

    return eachDayOfInterval({ start, end });
  };

  // Função para mudar o mês
  const changeMonth = (direction) => {
    if (direction === "prev") {
      setSelectedDate(subMonths(selectedDate, 1)); // Mês anterior
    } else if (direction === "next") {
      setSelectedDate(addMonths(selectedDate, 1)); // Próximo mês
    }
    setSelectedDay(null); // Limpar o dia selecionado quando mudar o mês
    setConsultationsByDay([]); // Limpar as consultas exibidas
  };

  // Função para lidar com o clique em um dia do calendário
  const handleDayClick = (day) => {
    // Define o novo dia selecionado ou desmarca se o mesmo dia for clicado novamente
    if (isSameDay(day, selectedDay)) {
      setSelectedDay(null);
      setConsultationsByDay([]);
    } else {
      setSelectedDay(day);
      setSelectedDate(day);
      const consultationsForDay = getConsultationsByDay(day);
      setConsultationsByDay(consultationsForDay);
    }
  };

  // Função para verificar se um dia tem consultas
  const hasConsultations = (day) => {
    return getConsultationsByDay(day).length > 0;
  };

  const daysOfWeek = ["Dom", "Seg", "Ter", "Qua", "Qui", "Sex", "Sáb"]; // Dias da semana

  return (
    <Layout>
      <div className="min-h-screen flex flex-col items-center justify-center bg-gray-50">
        <h2 className="text-2xl font-semibold text-[#81059e] mb-6">
          CALENDÁRIO DE CONSULTAS
        </h2>

        {/* Navegação do Mês */}
        <div className="flex items-center justify-between mb-4">
          <button
            onClick={() => changeMonth("prev")}
            className="px-4 py-2 bg-[#81059e] text-white rounded-lg hover:bg-[#820f76]"
          >
            Mês Anterior
          </button>
          <h3 className="text-xl font-semibold text-[#81059e] mx-8">
            {format(selectedDate, "MMMM yyyy")}
          </h3>
          <button
            onClick={() => changeMonth("next")}
            className="px-4 py-2 bg-[#81059e] text-white rounded-lg hover:bg-[#820f76]"
          >
            Próximo Mês
          </button>
        </div>

        {/* Calendário */}
        <div className="grid grid-cols-7 gap-4 bg-white rounded-lg p-4 shadow-md">
          {/* Renderizando os dias da semana */}
          {daysOfWeek.map((day, index) => (
            <div
              key={day}
              className={`text-center font-semibold ${index === 0 ? "text-red-500" : "text-black"
                }`} // Domingo em vermelho e os outros dias em preto
            >
              {day}
            </div>
          ))}

          {/* Renderizando os dias do calendário */}
          {generateCalendarDays().map((day, index) => (
            <div
              key={index}
              onClick={() => handleDayClick(day)}
              className={`flex items-center justify-center p-4 rounded-lg cursor-pointer transition-all duration-200 ${isSameDay(day, selectedDay)
                  ? "bg-yellow-300 text-black border-2 border-yellow-600"
                  : hasConsultations(day)
                    ? "bg-gray-100 text-black"
                    : "bg-gray-100 text-black"
                } ${isSameMonth(day, selectedDate) ? "" : "text-gray-400"} ${isSameDay(day, selectedDay)
                  ? "bg-[#81059e] text-white"
                  : ""
                } hover:bg-gray-200`}
            >
              {format(day, "d")}
            </div>
          ))}
        </div>

        {/* Exibição de consultas para o dia selecionado */}
        <div className="w-full max-w-6xl p-4 md:p-8 bg-white rounded-lg shadow-md mt-8">
          <h3 className="text-lg md:text-xl font-semibold text-[#81059e] mb-4 text-center md:text-left">
            {selectedDay
              ? `Consultas para o dia ${format(selectedDay, "dd/MM/yyyy")}`
              : "Selecione um dia para ver as consultas"}
          </h3>

          {consultationsByDay.length > 0 ? (
            <div className="overflow-x-auto">
              <table className="min-w-full bg-white border">
                <thead className="border-b bg-gray-100">
                  <tr>
                    <th className="text-left px-4 py-2 text-[#81059e]">CPF</th>
                    <th className="text-left px-4 py-2 text-[#81059e]">Paciente</th>
                    <th className="text-left px-4 py-2 text-[#81059e]">RG</th>
                    <th className="text-left px-4 py-2 text-[#81059e]">Logradouro</th>
                    <th className="text-left px-4 py-2 text-[#81059e]">Bairro</th>
                    <th className="text-left px-4 py-2 text-[#81059e]">Nº</th>
                    <th className="text-left px-4 py-2 text-[#81059e]">Ametropia</th>
                    <th className="text-left px-4 py-2 text-[#81059e]">Data</th>
                    <th className="text-left px-4 py-2 text-[#81059e]">Hora</th>
                    <th className="text-left px-4 py-2 text-[#81059e]">Clínica</th>
                  </tr>
                </thead>
                <tbody>
                  {consultationsByDay.map((consultation) => (
                    <tr key={consultation.id}>
                      <td className="border-t px-4 py-2 text-black">{consultation.cpf}</td>
                      <td className="border-t px-4 py-2 text-black">{consultation.nomePaciente}</td>
                      <td className="border-t px-4 py-2 text-black">{consultation.rg}</td>
                      <td className="border-t px-4 py-2 text-black">{consultation.logradouro}</td>
                      <td className="border-t px-4 py-2 text-black">{consultation.bairro}</td>
                      <td className="border-t px-4 py-2 text-black">{consultation.numeroCasa}</td>
                      <td className="border-t px-4 py-2 text-black">{consultation.ametropia}</td>
                      <td className="border-t px-4 py-2 text-black">{consultation.data}</td>
                      <td className="border-t px-4 py-2 text-black">{consultation.hora}</td>
                      <td className="border-t px-4 py-2 text-black">
                        {consultation.clinica === "Óticas Popular 2" ? "Óticas Popular 2" : "Óticas Popular 1"}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          ) : (
            <p className="text-center text-gray-500">Nenhuma consulta para o dia selecionado.</p>
          )}
        </div>
      </div>
    </Layout>
  );
};

export default CalendarConsultation;
