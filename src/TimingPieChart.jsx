import React from 'react';
import { Pie } from 'react-chartjs-2';
import './timing-chart.css';
import {
  Chart as ChartJS,
  ArcElement,
  Tooltip,
  Legend,
  CategoryScale,
  LinearScale
} from 'chart.js';

ChartJS.register(
  ArcElement,
  Tooltip,
  Legend,
  CategoryScale,
  LinearScale
);

const TimingPieChart = ({ timingData }) => {
  // Convert all times to seconds for display
  const data = {
    labels: ['TTFB', 'Load Delay', 'Load Time', 'Render Delay'],
    datasets: [
      {
        data: [
          timingData.ttfb,
          timingData.loadDelay,
          timingData.loadTime,
          timingData.renderDelay,
        ],
        backgroundColor: [
          '#FF6384',
          '#36A2EB',
          '#FFCE56',
          '#4BC0C0'
        ],
        hoverBackgroundColor: [
          '#FF4F72',
          '#2F8FD8',
          '#FFBF3F',
          '#3AA7A7'
        ]
      }
    ]
  };

  const options = {
    plugins: {
      legend: {
        position: 'bottom',
        labels: {
          padding: 20
        }
      },
      tooltip: {
        callbacks: {
          label: (context) => {
            const label = context.label || '';
            const value = context.parsed || 0;
            return `${label}: ${(value / 1000).toFixed(2)}s (${((value / context.dataset.data.reduce((a, b) => a + b, 0)) * 100).toFixed(1)}%)`;
          }
        }
      }
    }
  };

  return (
    <div className="timing-chart">
      <h3>LCP Load Timing Breakdown</h3>
      <div style={{ maxWidth: '500px', margin: '0 auto' }}>
        <Pie data={data} options={options} />
      </div>
    </div>
  );
};

export default TimingPieChart;
