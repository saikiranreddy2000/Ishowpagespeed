import React from 'react';

import { Line } from 'react-chartjs-2';
import {
  Chart as ChartJS,
  CategoryScale,
  LinearScale,
  PointElement,
  LineElement,
  Title,
  Tooltip,
  Legend
} from 'chart.js';

ChartJS.register(CategoryScale, LinearScale, PointElement, LineElement, Title, Tooltip, Legend);

export default function CruxGraphChart({ cruxData, metric }) {
  // Support new CrUX API structure (histogramTimeseries, percentilesTimeseries, collectionPeriods)
  if (!cruxData || typeof cruxData !== 'object') {
    return <div style={{ margin: '18px 0', color: '#c00', textAlign: 'center' }}>No historical data available for this metric.</div>;
  }

  // Prefer url-level data if present, else fall back to origin-level data
  // url data: cruxData.urlMetrics or cruxData.metrics.url or cruxData.metrics[metric].url
  // origin data: cruxData.metrics or cruxData.metrics.origin or cruxData.metrics[metric].origin
  let metrics = null;
  if (cruxData.urlMetrics) {
    metrics = cruxData.urlMetrics;
  } else if (cruxData.metrics && cruxData.metrics.url) {
    metrics = cruxData.metrics.url;
  } else if (cruxData.metrics && cruxData.metrics.origin) {
    metrics = cruxData.metrics.origin;
  } else if (cruxData.metrics) {
    metrics = cruxData.metrics;
  } else if (cruxData[metric]) {
    metrics = { [metric]: cruxData[metric] };
  }
  if (!metrics) {
    return <div style={{ margin: '18px 0', color: '#c00', textAlign: 'center' }}>No historical data available for this metric.</div>;
  }
  const metricMap = {
    'largest_contentful_paint': { key: 'largest_contentful_paint', label: 'LCP', unit: 's' },
    'cumulative_layout_shift': { key: 'cumulative_layout_shift', label: 'CLS', unit: '' },
    'interaction_to_next_paint': { key: 'interaction_to_next_paint', label: 'INP', unit: 'ms' },
    'first_contentful_paint': { key: 'first_contentful_paint', label: 'FCP', unit: 's' },
  };

  let labels = [];
  let good = [], ni = [], poor = [], values = [];
  let unit = '';
  if (metric && metricMap[metric]) {
    unit = metricMap[metric].unit;
    const metricObj = metrics[metric];
    // New API: histogramTimeseries (array of 3 histograms, each with densities[]), percentilesTimeseries.p75s[], collectionPeriods[]
    const hist = metricObj?.histogramTimeseries;
    const percentiles = metricObj?.percentilesTimeseries?.p75s;
    const periods = cruxData.collectionPeriods;
    if (Array.isArray(hist) && hist.length === 3 && Array.isArray(percentiles) && Array.isArray(periods)) {
      // Use the minimum length to avoid out-of-bounds
      const len = Math.min(
        hist[0].densities.length,
        hist[1].densities.length,
        hist[2].densities.length,
        percentiles.length,
        periods.length
      );
      labels = Array.from({ length: len }, (_, i) => {
        const p = periods[i];
        if (p && p.firstDate) {
          // Format: YYYY-MM (Month and Year)
          return `${p.firstDate.year}-${String(p.firstDate.month).padStart(2, '0')}`;
        }
        return `Period ${i + 1}`;
      });
      good = hist[0].densities.slice(0, len).map(d => Number((d * 100).toFixed(1)));
      ni = hist[1].densities.slice(0, len).map(d => Number((d * 100).toFixed(1)));
      poor = hist[2].densities.slice(0, len).map(d => Number((d * 100).toFixed(1)));
      values = percentiles.slice(0, len).map(val => {
        if (val == null) return null;
        if (unit === 's') return Number(val).toFixed(2);
        if (unit === 'ms') return Number(val).toFixed(0);
        return val;
      });
    } else {
      // fallback to old logic if not present
      labels = [metricMap[metric].label];
      good = [metricObj?.histogram?.[0]?.density ? Number((metricObj.histogram[0].density * 100).toFixed(1)) : 0];
      ni = [metricObj?.histogram?.[1]?.density ? Number((metricObj.histogram[1].density * 100).toFixed(1)) : 0];
      poor = [metricObj?.histogram?.[2]?.density ? Number((metricObj.histogram[2].density * 100).toFixed(1)) : 0];
      values = [metricObj?.percentile ? (unit === 's' ? (metricObj.percentile / 1000).toFixed(2) : metricObj.percentile) : null];
    }
  } else {
    labels = [
      'FCP (s)',
      'LCP (s)',
      'CLS',
      'INP (ms)'
    ];
    good = labels.map((_, i) => {
      const key = Object.values(metricMap)[i]?.key || Object.keys(cruxData.metrics)[i];
      return cruxData.metrics[key]?.histogram?.[0]?.density ? Number((cruxData.metrics[key].histogram[0].density * 100).toFixed(1)) : 0;
    });
    ni = labels.map((_, i) => {
      const key = Object.values(metricMap)[i]?.key || Object.keys(cruxData.metrics)[i];
      return cruxData.metrics[key]?.histogram?.[1]?.density ? Number((cruxData.metrics[key].histogram[1].density * 100).toFixed(1)) : 0;
    });
    poor = labels.map((_, i) => {
      const key = Object.values(metricMap)[i]?.key || Object.keys(cruxData.metrics)[i];
      return cruxData.metrics[key]?.histogram?.[2]?.density ? Number((cruxData.metrics[key].histogram[2].density * 100).toFixed(1)) : 0;
    });
    values = labels.map((_, i) => {
      const key = Object.values(metricMap)[i]?.key || Object.keys(cruxData.metrics)[i];
      const val = cruxData.metrics[key]?.percentile;
      if (val == null) return null;
      const u = metricMap[key]?.unit || '';
      if (u === 's') return (val / 1000).toFixed(2);
      if (u === 'ms') return val.toFixed(0);
      return val;
    });
  }

  // Only show the value line if there is at least one non-null value and at least 1 label
  const hasValueData = Array.isArray(values) && values.some(v => v !== null && v !== undefined && v !== 'NaN') && Array.isArray(labels) && labels.length > 0;
  if (!hasValueData) {
    return <div style={{ margin: '18px 0', color: '#c00', textAlign: 'center' }}>No historical data available for this metric.</div>;
  }

  // Highlight the most recent month (last point) with a larger point radius
  const lastIdx = labels.length - 1;
  const valuePointRadius = values.map((_, idx) => (idx === lastIdx ? 8 : 6));
  const valuePointBorderWidth = values.map((_, idx) => (idx === lastIdx ? 3 : 1));

  const chartData = {
    labels,
    datasets: [
      {
        label: 'Good',
        borderColor: '#059669',
        backgroundColor: 'rgba(5,150,105,0.15)',
        data: good,
        fill: false,
        tension: 0.3,
        pointRadius: 5,
        pointBackgroundColor: '#059669',
        yAxisID: 'y',
        hidden: true, // Hide by default, focus on value line
      },
      {
        label: 'Needs Improvement',
        borderColor: '#fd7e14',
        backgroundColor: 'rgba(253,126,20,0.15)',
        data: ni,
        fill: false,
        tension: 0.3,
        pointRadius: 5,
        pointBackgroundColor: '#fd7e14',
        yAxisID: 'y',
        hidden: true,
      },
      {
        label: 'Poor',
        borderColor: '#e53e3e',
        backgroundColor: 'rgba(229,62,62,0.15)',
        data: poor,
        fill: false,
        tension: 0.3,
        pointRadius: 5,
        pointBackgroundColor: '#e53e3e',
        yAxisID: 'y',
        hidden: true,
      },
      {
        label: metricMap[metric]?.label + ' (percentile)',
        borderColor: '#0078d4',
        backgroundColor: 'rgba(0,120,212,0.15)',
        data: values,
        fill: false,
        tension: 0.3,
        pointRadius: valuePointRadius,
        pointBorderWidth: valuePointBorderWidth,
        pointBackgroundColor: '#0078d4',
        yAxisID: 'y2',
      }
    ]
  };

  const options = {
    responsive: true,
    plugins: {
      legend: { display: false },
      title: { display: true, text: metricMap[metric]?.label ? `${metricMap[metric].label} Historical Values (last ${labels.length} months)` : 'Core Web Vitals Distribution (%)' },
      tooltip: {
        callbacks: {
      title: function(context) {
        // Show full YYYY-MM for clarity, and show both start and end dates
        const idx = context[0]?.dataIndex;
        const label = labels[idx] || '';
        // Find start and end dates from periods if available
        let start = '', end = '';
        if (Array.isArray(context[0]?.chart?.data?.labels) && context[0]?.chart?.data?.labels.length > 1) {
          const chartLabels = context[0].chart.data.labels;
          start = chartLabels[0];
          end = chartLabels[chartLabels.length - 1];
        }
        // Only show if both are valid dates
        if (start && end && start !== end) {
          return `${label} (Start: ${start}, End: ${end})`;
        }
        return label;
      },
          label: function(context) {
            if (context.dataset.label.includes('percentile')) {
              return `${context.dataset.label}: ${context.parsed.y}${unit}`;
            }
            return `${context.dataset.label}: ${context.parsed.y}%`;
          }
        }
      }
    },
    scales: {
      x: {
        title: { display: true, text: labels.length > 1 ? 'Month' : 'Metric' },
        ticks: {
          autoSkip: false,
          maxRotation: 45,
          minRotation: 0,
          callback: function(value, idx) {
            // Show all months, but abbreviate if >8 months
            const label = labels[idx];
            if (labels.length > 8 && typeof label === 'string' && label.match(/^\d{4}-\d{2}/)) {
              // Show only year for Jan, full for July, else MM
              if (label.endsWith('-01')) return label.slice(2, 4) + ' Jan';
              if (label.endsWith('-07')) return label.slice(2, 4) + ' Jul';
              return label.slice(5, 7);
            }
            return label;
          }
        }
      },
      y: { beginAtZero: true, max: 100, title: { display: true, text: 'Percent of Users' }, display: false },
      y2: {
        position: 'left',
        beginAtZero: true,
        title: { display: true, text: unit ? `Value (${unit})` : 'Value' },
        grid: { drawOnChartArea: true },
        ticks: {
          callback: function(value) {
            return value + (unit ? unit : '');
          }
        }
      }
    }
  };

  return (
    <div style={{ margin: '18px 0' }}>
      <Line data={chartData} options={options} />
    </div>
  );
}
