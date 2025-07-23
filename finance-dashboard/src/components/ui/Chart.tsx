import React from 'react';
import { LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer, PieChart as RechartsPieChart, Pie, Cell } from 'recharts';
import { MonthlyData, CategoryData } from '../../utils/calculations';
import { useCurrency } from '../../contexts/CurrencyContext';

interface LineChartComponentProps {
  data: MonthlyData[];
  hideAmounts?: boolean;
}

interface PieChartComponentProps {
  data: CategoryData[];
  hideAmounts?: boolean;
}

export const LineChartComponent: React.FC<LineChartComponentProps> = ({ data, hideAmounts = false }) => {
  const { formatAmount: formatCurrencyAmount } = useCurrency();
  
  return (
    <div className="bg-white p-6 rounded-xl shadow-sm border">
      <h3 className="text-lg font-semibold text-gray-900 mb-4">Income vs Expenses</h3>
      <ResponsiveContainer width="100%" height={300}>
        <LineChart data={data}>
          <CartesianGrid strokeDasharray="3 3" />
          <XAxis dataKey="month" />
          <YAxis />
          <Tooltip formatter={(value) => hideAmounts ? '***' : formatCurrencyAmount(value as number)} />
          <Legend />
          <Line type="monotone" dataKey="income" stroke="#10B981" strokeWidth={3} />
          <Line type="monotone" dataKey="expenses" stroke="#EF4444" strokeWidth={3} />
        </LineChart>
      </ResponsiveContainer>
    </div>
  );
};

export const PieChartComponent: React.FC<PieChartComponentProps> = ({ data, hideAmounts = false }) => {
  const { formatAmount: formatCurrencyAmount } = useCurrency();
  
  return (
    <div className="bg-white p-6 rounded-xl shadow-sm border">
      <h3 className="text-lg font-semibold text-gray-900 mb-4">Spending by Category</h3>
      <ResponsiveContainer width="100%" height={300}>
        <RechartsPieChart>
          <Pie
            data={data}
            cx="50%"
            cy="50%"
            outerRadius={100}
            fill="#8884d8"
            dataKey="value"
            label={(entry: any) => `${entry.name}: ${hideAmounts ? '***' : formatCurrencyAmount(entry.value)}`}
          >
            {data.map((entry, index) => (
              <Cell key={`cell-${index}`} fill={entry.color} />
            ))}
          </Pie>
          <Tooltip formatter={(value) => hideAmounts ? '***' : formatCurrencyAmount(value as number)} />
        </RechartsPieChart>
      </ResponsiveContainer>
    </div>
  );
};