import React from 'react';
import { Line } from 'react-chartjs-2'; // Line chart is used for area chart, just with fill: true
import {
  Chart as ChartJS,
  CategoryScale,
  LinearScale,
  PointElement,
  LineElement,
  Title,
  Tooltip,
  Legend,
  Filler, // Don't forget to import Filler for area charts
} from 'chart.js';

// Register Chart.js components, including Filler
ChartJS.register(
  CategoryScale,
  LinearScale,
  PointElement,
  LineElement,
  Title,
  Tooltip,
  Legend,
  Filler // Register Filler plugin
);

const AreaChart = ({ title, labels, data, borderColor, backgroundColor }) => {
  const chartData = {
    labels: labels,
    datasets: [
      {
        label: title,
        data: data,
        borderColor: borderColor || 'rgb(153, 102, 255)',
        backgroundColor: backgroundColor || 'rgba(153, 102, 255, 0.2)',
        tension: 0.4, // Makes the line curved
        fill: true, // This makes it an area chart
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
    scales: {
      y: {
        beginAtZero: true,
      },
    },
  };

  return <Line data={chartData} options={options} />;
};

export default AreaChart;