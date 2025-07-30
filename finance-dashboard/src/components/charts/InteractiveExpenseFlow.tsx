import React, { useMemo } from 'react';
import Chart from 'react-apexcharts';
import { Expense } from '../../types';
import { useCurrency } from '../../contexts/CurrencyContext';
import { useGlobalFilters } from '../../contexts/GlobalFiltersContext';
import { getExpenseAmountInCurrency } from '../../utils/currencyHelpers';

interface InteractiveExpenseFlowProps {
  expenses: Expense[];
  onCategoryClick?: (category: string) => void;
}

const InteractiveExpenseFlow: React.FC<InteractiveExpenseFlowProps> = ({ 
  expenses, 
  onCategoryClick 
}) => {
  const { formatAmount, convertAmount, selectedCurrency } = useCurrency();
  const { updateFilter } = useGlobalFilters();

  const chartData = useMemo(() => {
    // Group expenses by category and calculate totals
    const categoryData = expenses
      .filter(expense => expense.type === 'expense')
      .reduce((acc, expense) => {
        const convertedAmount = getExpenseAmountInCurrency(expense, selectedCurrency, convertAmount);
        
        if (!acc[expense.category]) {
          acc[expense.category] = 0;
        }
        acc[expense.category] += convertedAmount;
        return acc;
      }, {} as Record<string, number>);

    // Sort categories by amount and get top 10
    const sortedCategories = Object.entries(categoryData)
      .sort(([, a], [, b]) => b - a)
      .slice(0, 10);

    return {
      categories: sortedCategories.map(([category]) => category),
      amounts: sortedCategories.map(([, amount]) => amount),
      colors: [
        '#FF6B6B', '#4ECDC4', '#45B7D1', '#96CEB4', '#FECA57',
        '#FF9FF3', '#54A0FF', '#5F27CD', '#00D2D3', '#FF9F43'
      ]
    };
  }, [expenses, selectedCurrency, convertAmount]);

  const options = {
    chart: {
      type: 'donut' as const,
      fontFamily: 'Inter, sans-serif',
      toolbar: {
        show: false
      },
      animations: {
        enabled: true,
        easing: 'easeinout',
        speed: 800,
        animateGradually: {
          enabled: true,
          delay: 150
        },
        dynamicAnimation: {
          enabled: true,
          speed: 350
        }
      }
    },
    colors: chartData.colors,
    labels: chartData.categories,
    dataLabels: {
      enabled: true,
      formatter: function(val: number, opts: any) {
        const amount = chartData.amounts[opts.seriesIndex];
        return formatAmount(amount);
      },
      style: {
        fontSize: '12px',
        fontWeight: 600,
        colors: ['#fff']
      },
      dropShadow: {
        enabled: true,
        top: 1,
        left: 1,
        blur: 1,
        opacity: 0.8
      }
    },
    legend: {
      position: 'bottom' as const,
      horizontalAlign: 'center' as const,
      floating: false,
      fontSize: '14px',
      fontWeight: 500,
      markers: {
        width: 12,
        height: 12,
        strokeWidth: 0,
        radius: 12
      },
      itemMargin: {
        horizontal: 10,
        vertical: 5
      }
    },
    plotOptions: {
      pie: {
        donut: {
          size: '65%',
          background: 'transparent',
          labels: {
            show: true,
            name: {
              show: true,
              fontSize: '16px',
              fontWeight: 600,
              color: '#374151',
              offsetY: -10
            },
            value: {
              show: true,
              fontSize: '24px',
              fontWeight: 700,
              color: '#111827',
              offsetY: 10,
              formatter: function(val: string) {
                const amount = parseFloat(val);
                return formatAmount(amount);
              }
            },
            total: {
              show: true,
              showAlways: false,
              label: 'Total Expenses',
              fontSize: '14px',
              fontWeight: 600,
              color: '#6B7280',
              formatter: function() {
                const total = chartData.amounts.reduce((sum, amount) => sum + amount, 0);
                return formatAmount(total);
              }
            }
          }
        },
        expandOnClick: true,
        customScale: 1.1
      }
    },
    tooltip: {
      enabled: true,
      style: {
        fontSize: '14px',
        fontFamily: 'Inter, sans-serif'
      },
      y: {
        formatter: function(val: number) {
          return formatAmount(val);
        }
      },
      marker: {
        show: true
      }
    },
    states: {
      hover: {
        filter: {
          type: 'lighten',
          value: 0.15
        }
      },
      active: {
        allowMultipleDataPointsSelection: false,
        filter: {
          type: 'darken',
          value: 0.35
        }
      }
    },
    responsive: [{
      breakpoint: 768,
      options: {
        chart: {
          height: 300
        },
        legend: {
          position: 'bottom',
          offsetY: 0
        }
      }
    }]
  };

  const handleDataPointSelection = (event: any, chartContext: any, config: any) => {
    if (config.dataPointIndex !== -1) {
      const selectedCategory = chartData.categories[config.dataPointIndex];
      
      // Update global filters to show only this category
      updateFilter('category', selectedCategory);
      
      // Call optional callback
      if (onCategoryClick) {
        onCategoryClick(selectedCategory);
      }
    }
  };

  return (
    <div className="bg-white rounded-xl shadow-sm border p-6">
      <div className="flex items-center justify-between mb-6">
        <div>
          <h3 className="text-lg font-semibold text-gray-900">Expense Breakdown</h3>
          <p className="text-sm text-gray-600 mt-1">Click on any category to filter transactions</p>
        </div>
        <div className="flex items-center space-x-2">
          <div className="w-3 h-3 bg-blue-500 rounded-full animate-pulse"></div>
          <span className="text-xs text-gray-500">Interactive</span>
        </div>
      </div>
      
      <div className="relative">
        <Chart
          options={options}
          series={chartData.amounts}
          type="donut"
          height={400}
          events={{
            dataPointSelection: handleDataPointSelection
          }}
        />
      </div>
      
      {chartData.amounts.length === 0 && (
        <div className="flex flex-col items-center justify-center py-12">
          <div className="w-16 h-16 bg-gray-100 rounded-full flex items-center justify-center mb-4">
            <svg className="w-8 h-8 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 19v-6a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2a2 2 0 002-2zm0 0V9a2 2 0 012-2h2a2 2 0 012 2v10m-6 0a2 2 0 002 2h2a2 2 0 002-2m0 0V5a2 2 0 012-2h2a2 2 0 012 2v14a2 2 0 01-2 2h-2a2 2 0 01-2-2z" />
            </svg>
          </div>
          <p className="text-gray-500 text-center">No expense data available for the selected filters</p>
        </div>
      )}
    </div>
  );
};

export default InteractiveExpenseFlow;