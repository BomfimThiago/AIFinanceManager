import React from 'react';
import { AlertTriangle, Trash2, X } from 'lucide-react';

import { useCurrency } from '../../contexts/CurrencyContext';
import { Goal } from '../../types';

interface ConfirmDeleteGoalModalProps {
  isOpen: boolean;
  onClose: () => void;
  onConfirm: () => void;
  goal: Goal | null;
  isDeleting?: boolean;
}

const ConfirmDeleteGoalModal: React.FC<ConfirmDeleteGoalModalProps> = ({
  isOpen,
  onClose,
  onConfirm,
  goal,
  isDeleting = false,
}) => {
  const { formatAmount } = useCurrency();

  if (!isOpen || !goal) return null;

  const getGoalTypeLabel = (type: string) => {
    switch (type) {
      case 'spending': return 'Spending Budget';
      case 'saving': return 'Savings Goal';
      case 'debt': return 'Debt Payoff Goal';
      default: return 'Goal';
    }
  };

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4 z-50">
      <div className="bg-white rounded-xl w-full max-w-md">
        {/* Header */}
        <div className="flex items-center justify-between p-6 border-b">
          <div className="flex items-center space-x-3">
            <div className="p-2 rounded-lg bg-red-100">
              <AlertTriangle className="h-5 w-5 text-red-600" />
            </div>
            <h2 className="text-lg font-semibold text-gray-900">Delete Goal</h2>
          </div>
          <button 
            onClick={onClose} 
            className="text-gray-400 hover:text-gray-600"
            disabled={isDeleting}
          >
            <X className="h-5 w-5" />
          </button>
        </div>

        <div className="p-6">
          <p className="text-gray-600 mb-4">
            Are you sure you want to delete this goal? This action cannot be undone.
          </p>

          {/* Goal Details */}
          <div className="bg-gray-50 p-4 rounded-lg mb-6">
            <div className="font-medium text-gray-900 mb-1">{goal.title}</div>
            <div className="text-sm text-gray-600 mb-2">
              {getGoalTypeLabel(goal.goal_type)}
              {goal.category && ` • ${goal.category}`}
            </div>
            <div className="text-sm text-gray-600">
              <div className="flex justify-between">
                <span>Target:</span>
                <span className="font-medium">{formatAmount(goal.target_amount)}</span>
              </div>
              <div className="flex justify-between">
                <span>Progress:</span>
                <span className="font-medium">{formatAmount(goal.current_amount)}</span>
              </div>
              <div className="flex justify-between">
                <span>Completion:</span>
                <span className="font-medium">{goal.progress_percentage.toFixed(1)}%</span>
              </div>
            </div>
          </div>

          <div className="bg-red-50 border border-red-200 rounded-lg p-3 mb-6">
            <div className="flex items-start space-x-2">
              <AlertTriangle className="h-4 w-4 text-red-600 mt-0.5 flex-shrink-0" />
              <div className="text-sm text-red-700">
                <strong>Warning:</strong> Deleting this goal will permanently remove all associated data, 
                including progress history and any linked transactions.
              </div>
            </div>
          </div>
        </div>

        {/* Footer */}
        <div className="flex justify-end space-x-3 p-6 border-t bg-gray-50">
          <button
            onClick={onClose}
            className="px-4 py-2 text-gray-700 border border-gray-300 rounded-lg hover:bg-gray-50"
            disabled={isDeleting}
          >
            Cancel
          </button>
          <button
            onClick={onConfirm}
            disabled={isDeleting}
            className="px-4 py-2 bg-red-600 text-white rounded-lg hover:bg-red-700 disabled:opacity-50 flex items-center space-x-2"
          >
            {isDeleting ? (
              <>
                <div className="animate-spin h-4 w-4 border-2 border-white border-t-transparent rounded-full" />
                <span>Deleting...</span>
              </>
            ) : (
              <>
                <Trash2 className="h-4 w-4" />
                <span>Delete Goal</span>
              </>
            )}
          </button>
        </div>
      </div>
    </div>
  );
};

export default ConfirmDeleteGoalModal;