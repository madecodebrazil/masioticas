"use client";
import React, { useState, useEffect } from "react";
import { collection, getDocs, query, where } from "firebase/firestore";
import { firestore } from "@/lib/firebaseConfig";
import Layout from "@/components/Layout";
import { useAuth } from "@/hooks/useAuth";
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
  parseISO
} from "date-fns";
import { ptBR } from "date-fns/locale";
import Image from "next/image";
import { motion } from "framer-motion";

const CalendarConsultation = () => {
  const { userData, loading, userPermissions } = useAuth();
  const [consultations, setConsultations] = useState([]);
  const [selectedDate, setSelectedDate] = useState(new Date());
  const [selectedDay, setSelectedDay] = useState(null);
  const [consultationsByDay, setConsultationsByDay] = useState([]);
  const [isLoading, setIsLoading] = useState(true);
  const [currentLoja, setCurrentLoja] = useState("loja1");

  // Função para buscar consultas da loja selecionada
  const fetchConsultations = async (lojaId) => {
    setIsLoading(true);
    try {
      // Usar a estrutura correta de lojas do seu sistema
      const consultationsRef = collection(firestore, `lojas/${lojaId}/consultas`);
      const querySnapshot = await getDocs(consultationsRef);

      const consultationsData = [];
      querySnapshot.forEach((doc) => {
        const data = doc.data();
        // Garantir que a data seja tratada corretamente
        const consultationDate = data.data_consulta?.toDate ?
          data.data_consulta.toDate() :
          (typeof data.data_consulta === 'string' ? parseISO(data.data_consulta) : new Date());

        consultationsData.push({
          id: doc.id,
          ...data,
          dataFormatada: format(consultationDate, 'dd/MM/yyyy'),
          dataObj: consultationDate
        });
      });

      setConsultations(consultationsData);
    } catch (error) {
      console.error("Erro ao buscar consultas:", error);
    } finally {
      setIsLoading(false);
    }
  };

  // useEffect para buscar as consultas quando a loja mudar
  useEffect(() => {
    if (!loading && userPermissions) {
      // Se for admin, pode escolher a loja
      if (userPermissions.isAdmin) {
        fetchConsultations(currentLoja);
      }
      // Se não for admin, usa a primeira loja disponível
      else if (userPermissions.lojas && userPermissions.lojas.length > 0) {
        const lojaId = userPermissions.lojas[0];
        setCurrentLoja(lojaId);
        fetchConsultations(lojaId);
      }
    }
  }, [loading, userPermissions, currentLoja]);

  // Função para obter consultas de um dia específico
  const getConsultationsByDay = (date) => {
    return consultations.filter((consultation) => {
      const consultationDate = consultation.dataObj;
      return isSameDay(consultationDate, date);
    });
  };

  // Função para mudar a loja (somente para admins)
  const handleLojaChange = (lojaId) => {
    setCurrentLoja(lojaId);
  };

  // Função para gerar os dias do calendário
  const generateCalendarDays = () => {
    const start = startOfWeek(startOfMonth(selectedDate), { weekStartsOn: 0 });
    const end = endOfWeek(endOfMonth(selectedDate), { weekStartsOn: 0 });
    return eachDayOfInterval({ start, end });
  };

  // Função para mudar o mês
  const changeMonth = (direction) => {
    if (direction === "prev") {
      setSelectedDate(subMonths(selectedDate, 1));
    } else if (direction === "next") {
      setSelectedDate(addMonths(selectedDate, 1));
    }
    setSelectedDay(null);
    setConsultationsByDay([]);
  };

  // Função para lidar com o clique em um dia
  const handleDayClick = (day) => {
    if (selectedDay && isSameDay(day, selectedDay)) {
      setSelectedDay(null);
      setConsultationsByDay([]);
    } else {
      setSelectedDay(day);
      const dayConsultations = getConsultationsByDay(day);
      setConsultationsByDay(dayConsultations);
    }
  };

  // Verifica se um dia tem consultas
  const hasConsultations = (day) => {
    return getConsultationsByDay(day).length > 0;
  };

  // Dias da semana em português
  const daysOfWeek = ["Dom", "Seg", "Ter", "Qua", "Qui", "Sex", "Sáb"];

  if (loading) {
    return (
      <div className="flex justify-center items-center h-screen">
        <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-[#81059e]"></div>
      </div>
    );
  }

  return (
    <Layout>
      <div className="min-h-screen p-4">
        <div className="mb-6">
          <h1 className="text-3xl md:text-4xl font-bold text-[#9a5fc7] mb-2">
            Calendário de Consultas
          </h1>
          <p className="text-gray-600">
            Visualize e gerencie todas as consultas agendadas
          </p>
        </div>

        {/* Seletor de loja (apenas para admins) */}
        {userPermissions && userPermissions.isAdmin && userPermissions.lojas && userPermissions.lojas.length > 0 && (
          <div className="mb-6">
            <h2 className="text-lg font-semibold text-[#9a5fc7] mb-2">Selecione a Loja:</h2>
            <div className="flex space-x-4">
              {userPermissions.lojas.map((loja) => (
                <button
                  key={loja}
                  className={`px-4 py-2 rounded-md ${currentLoja === loja
                    ? "bg-[#9a5fc7] text-white"
                    : "bg-gray-200 text-gray-700 hover:bg-gray-300"
                    }`}
                  onClick={() => handleLojaChange(loja)}
                >
                  {loja === "loja1" ? "Loja 1" : "Loja 2"}
                </button>
              ))}
            </div>
          </div>
        )}

        {/* Navegação do mês */}
        <motion.div
          className="bg-white rounded-xl shadow-lg p-6 mb-6"
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.3 }}
        >
          <div className="flex items-center justify-between mb-6">
            <button
              onClick={() => changeMonth("prev")}
              className="px-4 py-2 bg-[#9a5fc7] text-white rounded-lg hover:bg-[#8347af] transition-colors"
            >
              <span className="flex items-center">
                <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5 mr-1" viewBox="0 0 20 20" fill="currentColor">
                  <path fillRule="evenodd" d="M12.707 5.293a1 1 0 010 1.414L9.414 10l3.293 3.293a1 1 0 01-1.414 1.414l-4-4a1 1 0 010-1.414l4-4a1 1 0 011.414 0z" clipRule="evenodd" />
                </svg>
                Mês Anterior
              </span>
            </button>
            <h3 className="text-xl font-bold text-[#9a5fc7]">
              {format(selectedDate, "MMMM yyyy", { locale: ptBR }).toUpperCase()}
            </h3>
            <button
              onClick={() => changeMonth("next")}
              className="px-4 py-2 bg-[#9a5fc7] text-white rounded-lg hover:bg-[#8347af] transition-colors"
            >
              <span className="flex items-center">
                Próximo Mês
                <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5 ml-1" viewBox="0 0 20 20" fill="currentColor">
                  <path fillRule="evenodd" d="M7.293 14.707a1 1 0 010-1.414L10.586 10 7.293 6.707a1 1 0 011.414-1.414l4 4a1 1 0 010 1.414l-4 4a1 1 0 01-1.414 0z" clipRule="evenodd" />
                </svg>
              </span>
            </button>
          </div>

          {/* Calendário */}
          <div className="grid grid-cols-7 gap-2">
            {/* Cabeçalho dos dias da semana */}
            {daysOfWeek.map((day, index) => (
              <div
                key={day}
                className={`text-center font-semibold py-2 ${index === 0 ? "text-red-500" : "text-[#9a5fc7]"
                  }`}
              >
                {day}
              </div>
            ))}

            {/* Dias do calendário */}
            {generateCalendarDays().map((day, index) => {
              const hasConsultation = hasConsultations(day);
              const isToday = isSameDay(day, new Date());
              const isSelected = selectedDay && isSameDay(day, selectedDay);
              const isCurrentMonth = isSameMonth(day, selectedDate);

              return (
                <motion.div
                  key={index}
                  onClick={() => handleDayClick(day)}
                  whileHover={{ scale: 1.05 }}
                  whileTap={{ scale: 0.95 }}
                  className={`
                    flex flex-col items-center justify-center p-2 rounded-lg cursor-pointer
                    ${!isCurrentMonth ? "text-gray-300" : ""}
                    ${isToday ? "ring-2 ring-[#9a5fc7]" : ""}
                    ${isSelected ? "bg-[#9a5fc7] text-white" : hasConsultation ? "bg-purple-100" : "bg-gray-50"}
                    ${isCurrentMonth && !isSelected ? "hover:bg-purple-50" : ""}
                    transition-all duration-200
                  `}
                >
                  <span className={`text-lg ${isSelected ? "font-bold" : ""}`}>
                    {format(day, "d")}
                  </span>
                  {hasConsultation && !isSelected && (
                    <div className="mt-1 w-2 h-2 rounded-full bg-[#9a5fc7]"></div>
                  )}
                </motion.div>
              );
            })}
          </div>
        </motion.div>

        {/* Lista de consultas para o dia selecionado */}
        <motion.div
          className="bg-white rounded-xl shadow-lg p-6"
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.3, delay: 0.1 }}
        >
          <h3 className="text-xl font-bold text-[#9a5fc7] mb-4">
            {selectedDay
              ? `Consultas do dia ${format(selectedDay, "dd/MM/yyyy")}`
              : "Selecione um dia para ver as consultas"}
          </h3>

          {isLoading ? (
            <div className="flex justify-center items-center h-40">
              <p>Carregando consultas...</p>
            </div>
          ) : consultationsByDay.length > 0 ? (
            <div className="overflow-x-auto">
              <table className="min-w-full divide-y divide-gray-200">
                <thead>
                  <tr>
                    <th className="px-4 py-3 bg-gray-50 text-left text-xs font-medium text-[#9a5fc7] uppercase tracking-wider">Horário</th>
                    <th className="px-4 py-3 bg-gray-50 text-left text-xs font-medium text-[#9a5fc7] uppercase tracking-wider">Paciente</th>
                    <th className="px-4 py-3 bg-gray-50 text-left text-xs font-medium text-[#9a5fc7] uppercase tracking-wider">Contato</th>
                    <th className="px-4 py-3 bg-gray-50 text-left text-xs font-medium text-[#9a5fc7] uppercase tracking-wider">Procedimento</th>
                    <th className="px-4 py-3 bg-gray-50 text-left text-xs font-medium text-[#9a5fc7] uppercase tracking-wider">Profissional</th>
                    <th className="px-4 py-3 bg-gray-50 text-left text-xs font-medium text-[#9a5fc7] uppercase tracking-wider">Status</th>
                  </tr>
                </thead>
                <tbody className="bg-white divide-y divide-gray-200">
                  {consultationsByDay.map((consultation) => (
                    <tr key={consultation.id} className="hover:bg-gray-50">
                      <td className="px-4 py-3 whitespace-nowrap text-sm font-medium text-gray-900">
                        {consultation.hora || "Não informado"}
                      </td>
                      <td className="px-4 py-3 whitespace-nowrap text-sm text-gray-700">
                        {consultation.nomePaciente || "Não informado"}
                      </td>
                      <td className="px-4 py-3 whitespace-nowrap text-sm text-gray-700">
                        {consultation.telefone || "Não informado"}
                      </td>
                      <td className="px-4 py-3 whitespace-nowrap text-sm text-gray-700">
                        {consultation.tipoProcedimento || "Consulta Padrão"}
                      </td>
                      <td className="px-4 py-3 whitespace-nowrap text-sm text-gray-700">
                        {consultation.profissional || "Não atribuído"}
                      </td>
                      <td className="px-4 py-3 whitespace-nowrap text-sm">
                        <span className={`px-2 inline-flex text-xs leading-5 font-semibold rounded-full ${consultation.status === "concluida" ? "bg-green-100 text-green-800" :
                          consultation.status === "cancelada" ? "bg-red-100 text-red-800" :
                            "bg-yellow-100 text-yellow-800"
                          }`}>
                          {consultation.status === "concluida" ? "Concluída" :
                            consultation.status === "cancelada" ? "Cancelada" :
                              "Agendada"}
                        </span>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          ) : (
            <div className="flex flex-col items-center justify-center py-12 bg-gray-50 rounded-lg">
              <div className="text-[#9a5fc7] mb-4">
                <svg xmlns="http://www.w3.org/2000/svg" className="h-12 w-12" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z" />
                </svg>
              </div>
              <p className="text-gray-600 text-center">
                {selectedDay
                  ? "Não há consultas agendadas para este dia."
                  : "Selecione um dia no calendário para visualizar as consultas."}
              </p>
              {selectedDay && (
                <button className="mt-4 px-4 py-2 bg-[#9a5fc7] text-white rounded-lg hover:bg-[#8347af] transition-colors">
                  Agendar Nova Consulta
                </button>
              )}
            </div>
          )}
        </motion.div>
      </div>
    </Layout>
  );
};

export default CalendarConsultation;