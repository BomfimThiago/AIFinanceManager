import React, { useMemo } from 'react';
import Chart from 'react-apexcharts';
import { Expense } from '../../types';
import { useCurrency } from '../../contexts/CurrencyContext';
import { useGlobalFilters } from '../../contexts/GlobalFiltersContext';
import { getExpenseAmountInCurrency } from '../../utils/currencyHelpers';

interface SpendingHeatmapProps {
  expenses: Expense[];
  onDateClick?: (date: string) => void;
}

const SpendingHeatmap: React.FC<SpendingHeatmapProps> = ({ 
  expenses,
  onDateClick 
}) => {
  const { formatAmount, convertAmount, sessionCurrency } = useCurrency();
  const { updateFilter } = useGlobalFilters();

  const heatmapData = useMemo(() => {
    // Get current year data
    const currentYear = new Date().getFullYear();
    const startDate = new Date(currentYear, 0, 1);
    const endDate = new Date(currentYear, 11, 31);
    
    // Create daily spending map
    const dailySpending = expenses
      .filter(expense => {
        const expenseDate = new Date(expense.date);
        return expenseDate >= startDate && 
               expenseDate <= endDate && 
               expense.type === 'expense';
      })
      .reduce((acc, expense) => {
        const dateKey = expense.date.split('T')[0]; // Get YYYY-MM-DD format
        const convertedAmount = getExpenseAmountInCurrency(expense, sessionCurrency, convertAmount);
        
        if (!acc[dateKey]) {
          acc[dateKey] = 0;
        }
        acc[dateKey] += convertedAmount;
        return acc;
      }, {} as Record<string, number>);

    // Generate heatmap series data
    const series: Array<{
      name: string;
      data: Array<{
        x: string;
        y: number;
      }>;
    }> = [];

    // Create data for each month
    for (let month = 0; month < 12; month++) {
      const monthName = new Date(currentYear, month, 1).toLocaleDateString('en-US', { 
        month: 'short' 
      });
      
      const monthData: Array<{ x: string; y: number }> = [];
      
      // Get days in month
      const daysInMonth = new Date(currentYear, month + 1, 0).getDate();
      
      for (let day = 1; day <= daysInMonth; day++) {
        const dateKey = `${currentYear}-${String(month + 1).padStart(2, '0')}-${String(day).padStart(2, '0')}`;
        const spending = dailySpending[dateKey] || 0;
        
        monthData.push({
          x: day.toString(),
          y: Math.round(spending * 100) / 100
        });
      }
      
      series.push({
        name: monthName,
        data: monthData
      });
    }

    // Calculate max spending for color scale
    const maxSpending = Math.max(...Object.values(dailySpending));
    
    return { series, maxSpending };
  }, [expenses, sessionCurrency, convertAmount]);

  const options = {
    chart: {
      type: 'heatmap' as const,
      fontFamily: 'Inter, sans-serif',
      toolbar: {
        show: true,
        tools: {
          download: true,
          selection: false,
          zoom: false,
          zoomin: false,
          zoomout: false,
          pan: false,
          reset: false
        }
      },
      animations: {
        enabled: true,
        easing: 'easeinout',
        speed: 800
      }
    },
    colors: ['#059669'],
    title: {
      text: `Daily Spending Heatmap - ${new Date().getFullYear()}`,
      align: 'left' as const,
      style: {
        fontSize: '18px',
        fontWeight: 600,
        color: '#111827'
      }
    },
    subtitle: {
      text: 'Click on any day to filter transactions',
      align: 'left' as const,
      style: {
        fontSize: '14px',
        color: '#6B7280'
      }
    },
    plotOptions: {
      heatmap: {
        radius: 2,
        enableShades: true,
        shadeIntensity: 0.5,
        reverseNegativeShade: true,
        distributed: false,
        useFillColorAsStroke: false,
        colorScale: {
          ranges: [
            {
              from: 0,
              to: 0,
              name: 'No spending',
              color: '#F3F4F6'
            },
            {
              from: 0.01,
              to: heatmapData.maxSpending * 0.25,
              name: 'Low',
              color: '#D1FAE5'
            },
            {
              from: heatmapData.maxSpending * 0.25,
              to: heatmapData.maxSpending * 0.5,
              name: 'Medium',
              color: '#6EE7B7'
            },
            {
              from: heatmapData.maxSpending * 0.5,
              to: heatmapData.maxSpending * 0.75,
              name: 'High',
              color: '#10B981'
            },
            {
              from: heatmapData.maxSpending * 0.75,
              to: heatmapData.maxSpending,
              name: 'Very High',
              color: '#047857'
            }
          ]
        }
      }
    },
    dataLabels: {
      enabled: false
    },
    xaxis: {
      type: 'category',
      title: {
        text: 'Day of Month',
        style: {
          fontSize: '12px',
          fontWeight: 600,
          color: '#374151'
        }
      },
      labels: {
        style: {
          fontSize: '11px',
          colors: '#6B7280'
        }
      }
    },
    yaxis: {
      title: {
        text: 'Month',
        style: {
          fontSize: '12px',
          fontWeight: 600,
          color: '#374151'
        }
      },
      labels: {
        style: {
          fontSize: '11px',
          colors: '#6B7280'
        }
      }
    },
    tooltip: {
      enabled: true,
      style: {
        fontSize: '14px',
        fontFamily: 'Inter, sans-serif'
      },
      y: {
        formatter: function(val: number, { seriesIndex, dataPointIndex }: any) {
          if (val === 0) return 'No spending';
          
          const monthName = heatmapData.series[seriesIndex]?.name;
          const day = dataPointIndex + 1;
          const currentYear = new Date().getFullYear();
          
          return `${formatAmount(val)} spent on ${monthName} ${day}, ${currentYear}`;
        }
      },
      marker: {
        show: false
      }
    },
    legend: {
      show: true,
      position: 'bottom' as const,
      horizontalAlign: 'center' as const,
      fontSize: '12px',
      markers: {
        width: 15,
        height: 15,
        radius: 2
      }
    },
    grid: {
      padding: {
        right: 20,
        left: 20
      }
    },
    responsive: [{
      breakpoint: 768,
      options: {
        chart: {
          height: 400
        },
        title: {
          style: {
            fontSize: '16px'
          }
        }
      }
    }]
  };

  const handleDataPointSelection = (event: any, chartContext: any, config: any) => {
    if (config.dataPointIndex !== -1 && config.seriesIndex !== -1) {
      const monthIndex = config.seriesIndex;
      const dayIndex = config.dataPointIndex + 1;
      const currentYear = new Date().getFullYear();
      
      // Create date string
      const selectedDate = `${currentYear}-${String(monthIndex + 1).padStart(2, '0')}-${String(dayIndex).padStart(2, '0')}`;
      
      // Update global filters to show only this date
      updateFilter('startDate', selectedDate);
      updateFilter('endDate', selectedDate);
      
      if (onDateClick) {
        onDateClick(selectedDate);
      }
    }
  };

  return (
    <div className="bg-white rounded-xl shadow-sm border p-6">
      <div className="flex items-center justify-between mb-6">
        <div>
          <h3 className="text-lg font-semibold text-gray-900">Spending Patterns</h3>
          <p className="text-sm text-gray-600 mt-1">
            Darker shades indicate higher spending. Click any day to filter.
          </p>
        </div>
        <div className="flex items-center space-x-2">
          <div className="w-3 h-3 bg-green-500 rounded-sm"></div>
          <span className="text-xs text-gray-500">Daily Spending</span>
        </div>
      </div>
      
      <div className="relative">
        <Chart
          options={options}
          series={heatmapData.series}
          type="heatmap"
          height={450}
          events={{
            dataPointSelection: handleDataPointSelection
          }}
        />
      </div>
      
      {heatmapData.series.length === 0 && (
        <div className="flex flex-col items-center justify-center py-12">
          <div className="w-16 h-16 bg-gray-100 rounded-full flex items-center justify-center mb-4">
            <svg className="w-8 h-8 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z" />
            </svg>
          </div>
          <p className="text-gray-500 text-center">No spending data available for the current year</p>
        </div>
      )}
    </div>
  );
};

export default SpendingHeatmap;