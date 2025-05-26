"use client";

import { useState } from 'react';
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';
import { 
  faChartLine, 
  faClipboardCheck, 
  faFileInvoiceDollar, 
  faUserClock, 
  faCalendarCheck, 
  faClock,
  faCircleCheck,
  faSpinner,
  faTriangleExclamation
} from '@fortawesome/free-solid-svg-icons';

export default function Dashboard() {
  // Estados para dados dinâmicos
  const [performanceData, setPerformanceData] = useState({
    dailySales: 0,
    weekSales: 0,
    monthSales: 0,
    target: 1000
  });

  const [serviceOrders, setServiceOrders] = useState({
    pending: 0,
    completed: 0,
    delayed: 0
  });

  const [commissions, setCommissions] = useState({
    current: 534.27,
    projected: 637.87
  });

  return (
    <div className="flex flex-col -p-2 md:p-4  space-y-6 ">
      {/* Header Section */}
      <div className='bg-gradient-to-b from-[#81059e]/90 to-[#81059e]/70 rounded-none md:rounded-sm shadow-lg p-6'>
      <div className="flex items-center justify-between">
        <h1 className="p-2 text-3xl pb-4 font-semibold text-white">Seus Insights</h1>
        <div className="text-sm text-gray-100">
          {new Date().toLocaleDateString('pt-BR', { 
            weekday: 'long', 
            year: 'numeric', 
            month: 'long', 
            day: 'numeric' 
          })}
        </div>
      </div>

      {/* KPIs Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        {/* Desempenho Geral */}
        <div className="bg-[#fafafa]  rounded-lg p-6">
          <div className="flex justify-between items-center mb-4">
            <h2 className="text-xl font-semibold text-gray-700">Desempenho</h2>
            <FontAwesomeIcon icon={faChartLine} className="text-[#84207B] text-xl" />
          </div>
          <div className="space-y-4">
            <div className="flex justify-between items-center">
              <span className="text-gray-500 text-base">Vendas do Dia</span>
              <span className="font-bold text-purple-300">R$ {performanceData.dailySales.toFixed(2)}</span>
            </div>
            <div className="flex justify-between items-center">
              <span className="text-gray-500 text-base">Meta Diária</span>
              <span className="font-bold text-purple-300">R$ {performanceData.target.toFixed(2)}</span>
            </div>
            <div className="w-full bg-gray-200 rounded-full h-2">
              <div 
                className="bg-[#84207B] h-2 rounded-full" 
                style={{width: `${(performanceData.dailySales/performanceData.target) * 100}%`}}
              ></div>
            </div>
          </div>
        </div>

        {/* Ordens de Serviço */}
        <div className="bg-[#fafafa]  rounded-sm  p-6">
          <div className="flex justify-between items-center mb-4">
            <h2 className="text-xl font-semibold text-gray-700">Ordens de Serviço</h2>
            <FontAwesomeIcon icon={faClipboardCheck} className="text-purple-300 text-xl" />
          </div>
          <div className="grid grid-cols-3 gap-4">
            <div className="text-center">
              <div className="flex items-center justify-center mb-2">
                <FontAwesomeIcon icon={faSpinner} className="text-blue-500 text-xl" />
              </div>
              <div className="text-2xl font-bold text-purple-300">{serviceOrders.pending}</div>
              <div className="text-xs text-gray-500">Pendentes</div>
            </div>
            <div className="text-center">
              <div className="flex items-center justify-center mb-2">
                <FontAwesomeIcon icon={faCircleCheck} className="text-green-500 text-xl pb-2" />
              </div>
              <div className="text-2xl font-bold text-purple-300 pb-4">{serviceOrders.completed}</div>
              <div className="text-xs  text-gray-500">Concluídas</div>
            </div>
            <div className="text-center">
              <div className="flex items-center justify-center mb-2">
                <FontAwesomeIcon icon={faTriangleExclamation} className="text-red-500 text-xl pb-6" />
              </div>
              <div className="text-2xl font-bold pb-6 text-purple-300">{serviceOrders.delayed}</div>
              <div className="text-xs text-gray-500">Atrasadas</div>
            </div>
          </div>
        </div>

        {/* Comissões */}
        <div className="bg-[#fafafa]  rounded-sm border-2 border-gray-200 p-6">
          <div className="flex justify-between items-center mb-4">
            <h2 className="text-xl font-semibold text-gray-700">Comissões</h2>
            <FontAwesomeIcon icon={faFileInvoiceDollar} className="text-[#84207B] text-xl" />
          </div>
          <div className="space-y-4">
            <div className="flex justify-between items-center">
              <span className="text-gray-600 text-base">Comissão Mensal</span>
              <span className="font-bold text-purple-300">R$ {commissions.current}</span>
            </div>
            <div className="flex justify-between items-center">
              <span className="text-gray-600 text-base">Projeção</span>
              <span className="text-purple-500 font-semibold">R$ {commissions.projected}</span>
            </div>
            <div className="w-full bg-gray-200 rounded-full h-2">
              <div 
                className="bg-[#81059e] h-2 rounded-full" 
                style={{width: `${(commissions.current/commissions.projected) * 100}%`}}
              ></div>
            </div>
          </div>
        </div>
      </div>
      </div>

      {/* Agenda e Consultas */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        {/* Agenda do Dia */}
        <div className="bg-[#fafafa]  rounded-sm border-2 p-6 md:col-span-2">
          <div className="flex justify-between items-center mb-4">
            <h2 className="text-lg font-semibold text-gray-700">Agenda do Dia</h2>
            <FontAwesomeIcon icon={faUserClock} className="text-[#81059e] text-xl" />
          </div>
          <div className="space-y-4">
            <div className="p-4 border border-gray-200 rounded-lg">
              <div className="flex justify-between items-center mb-2">
                <span className="font-medium">Próximo Atendimento</span>
                <span className="text-sm text-gray-500">--:--</span>
              </div>
              <div className="text-sm text-gray-600">
                Nenhum agendamento para hoje
              </div>
            </div>
            <div className="flex justify-between text-sm text-gray-600">
              <div className="flex items-center gap-2">
                <FontAwesomeIcon icon={faCalendarCheck} />
                <span>Atendimentos Hoje: 0</span>
              </div>
              <div className="flex items-center gap-2">
                <FontAwesomeIcon icon={faClock} />
                <span>Tempo Médio: 0min</span>
              </div>
            </div>
          </div>
        </div>

        {/* Status do Mês */}
        <div className="bg-[#fafafa]  rounded-sm border-2 p-6">
          <div className="flex justify-between items-center mb-4">
            <h2 className="text-lg font-semibold text-gray-700">Status do Mês</h2>
            <FontAwesomeIcon icon={faChartLine} className="text-[#84207B] text-xl" />
          </div>
          <div className="space-y-4">
            <div className="flex justify-between items-center">
              <span className="text-gray-600">Meta Mensal</span>
              <span className="font-medium">0%</span>
            </div>
            <div className="w-full bg-gray-200 rounded-full h-2">
              <div className="bg-[#84207B] h-2 rounded-full w-0"></div>
            </div>
            <div className="flex justify-between text-sm text-gray-600">
              <span>R$ 0,00</span>
              <span>Meta: R$ 10.000,00</span>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}