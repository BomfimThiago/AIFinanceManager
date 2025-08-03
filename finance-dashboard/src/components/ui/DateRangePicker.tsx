/**
 * Date Range Picker Component
 * Allows users to select start and end dates for filtering
 */
import React, { useState } from 'react';

import { Calendar, X } from 'lucide-react';

interface DateRangePickerProps {
  startDate?: string;
  endDate?: string;
  onDateRangeChange: (startDate: string | undefined, endDate: string | undefined) => void;
  onApply: () => void;
  onClear: () => void;
  className?: string;
}

export const DateRangePicker: React.FC<DateRangePickerProps> = ({
  startDate,
  endDate,
  onDateRangeChange,
  onApply,
  onClear,
  className = '',
}) => {
  const [localStartDate, setLocalStartDate] = useState(startDate || '');
  const [localEndDate, setLocalEndDate] = useState(endDate || '');

  const handleStartDateChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const value = e.target.value;
    setLocalStartDate(value);
    onDateRangeChange(value || undefined, localEndDate || undefined);
  };

  const handleEndDateChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const value = e.target.value;
    setLocalEndDate(value);
    onDateRangeChange(localStartDate || undefined, value || undefined);
  };

  const handleClear = () => {
    setLocalStartDate('');
    setLocalEndDate('');
    onDateRangeChange(undefined, undefined);
    onClear();
  };

  const isDateRangeValid = () => {
    if (!localStartDate || !localEndDate) return true; // Allow partial dates
    return new Date(localStartDate) <= new Date(localEndDate);
  };

  const hasDateRange = localStartDate || localEndDate;

  return (
    <div className={`bg-white rounded-lg border border-gray-200 p-4 ${className}`}>
      <div className="flex items-center space-x-2 mb-3">
        <Calendar className="h-4 w-4 text-gray-500" />
        <span className="text-sm font-medium text-gray-700">Date Range Filter</span>
        {hasDateRange && (
          <button
            onClick={handleClear}
            className="ml-auto p-1 hover:bg-gray-100 rounded-full transition-colors"
            title="Clear date range"
          >
            <X className="h-3 w-3 text-gray-400" />
          </button>
        )}
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 mb-3">
        <div>
          <label className="block text-xs font-medium text-gray-600 mb-1">Start Date</label>
          <input
            type="date"
            value={localStartDate}
            onChange={handleStartDateChange}
            className="w-full px-3 py-2 border border-gray-300 rounded-md text-sm focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
          />
        </div>
        <div>
          <label className="block text-xs font-medium text-gray-600 mb-1">End Date</label>
          <input
            type="date"
            value={localEndDate}
            onChange={handleEndDateChange}
            min={localStartDate}
            className="w-full px-3 py-2 border border-gray-300 rounded-md text-sm focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
          />
        </div>
      </div>

      {!isDateRangeValid() && (
        <div className="text-xs text-red-600 mb-3">End date must be after start date</div>
      )}

      <div className="flex space-x-2">
        <button
          onClick={onApply}
          disabled={!hasDateRange || !isDateRangeValid()}
          className="flex-1 bg-blue-600 text-white py-2 px-4 rounded-md text-sm font-medium hover:bg-blue-700 disabled:bg-gray-300 disabled:cursor-not-allowed transition-colors"
        >
          Apply Filter
        </button>
        <button
          onClick={handleClear}
          className="px-4 py-2 border border-gray-300 rounded-md text-sm font-medium text-gray-700 hover:bg-gray-50 transition-colors"
        >
          Clear
        </button>
      </div>

      {hasDateRange && isDateRangeValid() && (
        <div className="mt-2 text-xs text-gray-500">
          {localStartDate && localEndDate ? (
            <>
              Filtering from {localStartDate} to {localEndDate}
            </>
          ) : localStartDate ? (
            <>Filtering from {localStartDate} onwards</>
          ) : localEndDate ? (
            <>Filtering up to {localEndDate}</>
          ) : null}
        </div>
      )}
    </div>
  );
};
