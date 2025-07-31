import React, { useMemo } from 'react';

import Chart from 'react-apexcharts';

import { useCurrency } from '../../contexts/CurrencyContext';
import { useGlobalFilters } from '../../contexts/GlobalFiltersContext';
import { Expense } from '../../types';
import { getExpenseAmountInCurrency } from '../../utils/currencyHelpers';

interface InteractiveSpendingTimelineProps {
  expenses: Expense[];
  onTimeRangeSelect?: (startDate: string, endDate: string) => void;
}

const InteractiveSpendingTimeline: React.FC<InteractiveSpendingTimelineProps> = ({
  expenses,
  onTimeRangeSelect,
}) => {
  const { formatAmount, convertAmount, sessionCurrency } = useCurrency();
  const { updateFilter } = useGlobalFilters();

  const chartData = useMemo(() => {
    // Group expenses by month
    const monthlyData = expenses.reduce(
      (acc, expense) => {
        const date = new Date(expense.date);
        const monthKey = `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, '0')}`;

        const convertedAmount = getExpenseAmountInCurrency(expense, sessionCurrency, convertAmount);

        if (!acc[monthKey]) {
          acc[monthKey] = { income: 0, expenses: 0, date: monthKey };
        }

        if (expense.type === 'income') {
          acc[monthKey].income += convertedAmount;
        } else {
          acc[monthKey].expenses += convertedAmount;
        }

        return acc;
      },
      {} as Record<string, { income: number; expenses: number; date: string }>
    );

    // Sort by date and prepare chart data
    const sortedData = Object.values(monthlyData).sort((a, b) => a.date.localeCompare(b.date));

    return {
      categories: sortedData.map(item => {
        const [year, month] = item.date.split('-');
        return new Date(parseInt(year), parseInt(month) - 1).toLocaleDateString('en-US', {
          month: 'short',
          year: 'numeric',
        });
      }),
      series: [
        {
          name: 'Income',
          data: sortedData.map(item => Math.round(item.income * 100) / 100),
          color: '#10B981',
        },
        {
          name: 'Expenses',
          data: sortedData.map(item => Math.round(item.expenses * 100) / 100),
          color: '#EF4444',
        },
        {
          name: 'Net',
          data: sortedData.map(item => Math.round((item.income - item.expenses) * 100) / 100),
          color: '#6366F1',
        },
      ],
      rawData: sortedData,
    };
  }, [expenses, sessionCurrency, convertAmount]);

  const options = {
    chart: {
      type: 'line' as const,
      fontFamily: 'Inter, sans-serif',
      toolbar: {
        show: true,
        tools: {
          download: true,
          selection: true,
          zoom: true,
          zoomin: true,
          zoomout: true,
          pan: true,
          reset: true,
        },
      },
      animations: {
        enabled: true,
        easing: 'easeinout',
        speed: 800,
      },
      zoom: {
        enabled: true,
        type: 'x',
      },
      selection: {
        enabled: true,
        type: 'x',
        fill: {
          color: '#3B82F6',
          opacity: 0.1,
        },
        stroke: {
          width: 1,
          color: '#3B82F6',
          opacity: 0.4,
          dashArray: 3,
        },
      },
    },
    colors: ['#10B981', '#EF4444', '#6366F1'],
    dataLabels: {
      enabled: false,
    },
    stroke: {
      width: [3, 3, 4],
      curve: 'smooth' as const,
      dashArray: [0, 0, 5],
    },
    markers: {
      size: [4, 4, 6],
      strokeWidth: 2,
      strokeColors: ['#fff'],
      hover: {
        size: 8,
      },
    },
    xaxis: {
      categories: chartData.categories,
      type: 'category',
      labels: {
        style: {
          fontSize: '12px',
          fontWeight: 500,
          colors: '#6B7280',
        },
        rotate: -45,
      },
      axisBorder: {
        show: true,
        color: '#E5E7EB',
      },
      axisTicks: {
        show: true,
        color: '#E5E7EB',
      },
    },
    yaxis: {
      title: {
        text: `Amount (${sessionCurrency})`,
        style: {
          fontSize: '12px',
          fontWeight: 600,
          color: '#374151',
        },
      },
      labels: {
        style: {
          fontSize: '12px',
          colors: '#6B7280',
        },
        formatter: function (val: number) {
          return formatAmount(val);
        },
      },
    },
    tooltip: {
      shared: true,
      intersect: false,
      style: {
        fontSize: '14px',
        fontFamily: 'Inter, sans-serif',
      },
      y: {
        formatter: function (val: number) {
          return formatAmount(val);
        },
      },
      marker: {
        show: true,
      },
    },
    legend: {
      position: 'top' as const,
      horizontalAlign: 'right' as const,
      floating: true,
      offsetY: -25,
      offsetX: -5,
      fontSize: '14px',
      fontWeight: 500,
      markers: {
        width: 12,
        height: 12,
        strokeWidth: 0,
        radius: 12,
      },
    },
    grid: {
      show: true,
      borderColor: '#F3F4F6',
      strokeDashArray: 0,
      position: 'back' as const,
      xaxis: {
        lines: {
          show: true,
        },
      },
      yaxis: {
        lines: {
          show: true,
        },
      },
    },
    fill: {
      type: 'gradient',
      gradient: {
        shade: 'light',
        type: 'vertical',
        shadeIntensity: 0.5,
        gradientToColors: undefined,
        inverseColors: true,
        opacityFrom: 0.8,
        opacityTo: 0.1,
        stops: [0, 100],
      },
    },
    responsive: [
      {
        breakpoint: 768,
        options: {
          chart: {
            height: 300,
          },
          legend: {
            position: 'bottom',
            offsetY: 0,
          },
        },
      },
    ],
  };

  const handleSelection = (chartContext: any, { xaxis }: any) => {
    if (xaxis.min !== undefined && xaxis.max !== undefined) {
      const startIndex = Math.floor(xaxis.min);
      const endIndex = Math.ceil(xaxis.max);

      if (startIndex >= 0 && endIndex < chartData.rawData.length) {
        const startDate = chartData.rawData[startIndex].date + '-01';
        const endDate = chartData.rawData[endIndex].date + '-31';

        // Update global filters with date range
        updateFilter('startDate', startDate);
        updateFilter('endDate', endDate);

        if (onTimeRangeSelect) {
          onTimeRangeSelect(startDate, endDate);
        }
      }
    }
  };

  return (
    <div className="bg-white rounded-xl shadow-sm border p-6">
      <div className="flex items-center justify-between mb-6">
        <div>
          <h3 className="text-lg font-semibold text-gray-900">Spending Timeline</h3>
          <p className="text-sm text-gray-600 mt-1">Select a time range to filter transactions</p>
        </div>
        <div className="flex items-center space-x-4">
          <div className="flex items-center space-x-2">
            <div className="w-3 h-3 bg-green-500 rounded-full"></div>
            <span className="text-xs text-gray-600">Income</span>
          </div>
          <div className="flex items-center space-x-2">
            <div className="w-3 h-3 bg-red-500 rounded-full"></div>
            <span className="text-xs text-gray-600">Expenses</span>
          </div>
          <div className="flex items-center space-x-2">
            <div className="w-3 h-3 bg-indigo-500 rounded-full"></div>
            <span className="text-xs text-gray-600">Net</span>
          </div>
        </div>
      </div>

      <div className="relative">
        <Chart
          options={options}
          series={chartData.series}
          type="line"
          height={350}
          events={{
            selection: handleSelection,
          }}
        />
      </div>

      {chartData.series[0].data.length === 0 && (
        <div className="flex flex-col items-center justify-center py-12">
          <div className="w-16 h-16 bg-gray-100 rounded-full flex items-center justify-center mb-4">
            <svg
              className="w-8 h-8 text-gray-400"
              fill="none"
              stroke="currentColor"
              viewBox="0 0 24 24"
            >
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth={2}
                d="M9 19v-6a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2a2 2 0 002-2zm0 0V9a2 2 0 012-2h2a2 2 0 012 2v10m-6 0a2 2 0 002 2h2a2 2 0 002-2m0 0V5a2 2 0 012-2h2a2 2 0 012 2v14a2 2 0 01-2 2h-2a2 2 0 01-2-2z"
              />
            </svg>
          </div>
          <p className="text-gray-500 text-center">
            No timeline data available for the selected filters
          </p>
        </div>
      )}
    </div>
  );
};

export default InteractiveSpendingTimeline;
