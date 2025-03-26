import { Pie } from 'react-chartjs-2';
import { Chart as ChartJS, ArcElement, Tooltip, Legend } from 'chart.js';

// Registre os elementos necessários do ChartJS
ChartJS.register(ArcElement, Tooltip, Legend);

export default function SalesPieChart({ salesByCategory }) {
    const data = {
        labels: ['Armação', 'Lente', 'Solar'],
        datasets: [
            {
                label: 'Vendas por Categoria',
                data: [
                    salesByCategory.armaçãoCount || 0,
                    salesByCategory.lenteCount || 0,
                    salesByCategory.solarCount || 0,
                ],
                backgroundColor: ['#FF6384', '#36A2EB', '#FFCE56'],
                hoverBackgroundColor: ['#FF6384', '#36A2EB', '#FFCE56'],
            },
        ],
    };
    

    return (
        <div className="w-full h-64">
            <Pie data={data} />
        </div>
    );
}
