import React from 'react';
import { Pie } from 'react-chartjs-2';
import {
  Chart as ChartJS,
  ArcElement, // Import ArcElement for Pie/Doughnut charts
  Tooltip,
  Legend,
} from 'chart.js';

// Register Chart.js components
ChartJS.register(ArcElement, Tooltip, Legend);

const PieChart = ({ title, labels, data, backgroundColor }) => {
  const chartData = {
    labels: labels,
    datasets: [
      {
        label: title,
        data: data,
        backgroundColor: backgroundColor || [
          'rgba(255, 99, 132, 0.7)', // Red
          'rgba(54, 162, 235, 0.7)', // Blue
          'rgba(255, 206, 86, 0.7)', // Yellow
          'rgba(75, 192, 192, 0.7)', // Green
          'rgba(153, 102, 255, 0.7)', // Purple
          'rgba(255, 159, 64, 0.7)', // Orange
        ],
        borderColor: backgroundColor ? backgroundColor.map(color => color.replace('0.7', '1')) : [
          'rgba(255, 99, 132, 1)',
          'rgba(54, 162, 235, 1)',
          'rgba(255, 206, 86, 1)',
          'rgba(75, 192, 192, 1)',
          'rgba(153, 102, 255, 1)',
          'rgba(255, 159, 64, 1)',
        ],
        borderWidth: 1,
      },
    ],
  };

  const options = {
    responsive: true,
    plugins: {
      legend: {
        position: 'top',
      },
      title: {
        display: true,
        text: title,
      },
    },
  };

  return <Pie data={chartData} options={options} />;
};

export default PieChart;