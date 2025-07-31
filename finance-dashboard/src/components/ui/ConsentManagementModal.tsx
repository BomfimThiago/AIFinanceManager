import React, { useState } from 'react';

import { AlertCircle, Building, ExternalLink, Shield, User, X } from 'lucide-react';

import { useNotificationContext } from '../../contexts/NotificationContext';
import { useConsentManagement } from '../../hooks/useConsentManagement';

interface ConsentManagementModalProps {
  isOpen: boolean;
  onClose: () => void;
  mode?: 'management' | 'renewal';
  renewalData?: {
    link_id: string;
    consent_id: string;
    institution: string;
    institution_display_name: string;
    institution_icon_logo?: string;
  };
}

export const ConsentManagementModal: React.FC<ConsentManagementModalProps> = ({
  isOpen,
  onClose,
  mode = 'management',
  renewalData,
}) => {
  const [formData, setFormData] = useState({
    cpf: '',
    full_name: '',
    cnpj: '',
    user_type: 'individual' as 'individual' | 'business',
  });

  const { openConsentManagement, openConsentRenewal, isLoading, error } = useConsentManagement();
  const { showError, showSuccess } = useNotificationContext();

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!formData.cpf || !formData.full_name) {
      showError('Validation Error', 'Please fill in all required fields');
      return;
    }

    try {
      let success = false;

      if (mode === 'management') {
        success = await openConsentManagement({
          cpf: formData.cpf,
          full_name: formData.full_name,
          cnpj: formData.user_type === 'business' ? formData.cnpj : undefined,
          terms_and_conditions_url: window.location.origin + '/terms',
        });
      } else if (mode === 'renewal' && renewalData) {
        success = await openConsentRenewal({
          cpf: formData.cpf,
          full_name: formData.full_name,
          cnpj: formData.user_type === 'business' ? formData.cnpj : undefined,
          terms_and_conditions_url: window.location.origin + '/terms',
          ...renewalData,
        });
      }

      if (success) {
        showSuccess(
          'Success',
          mode === 'management'
            ? 'Consent management portal opened in new window'
            : 'Consent renewal portal opened in new window'
        );
        onClose();
      }
    } catch (err) {
      showError('Error', 'Failed to open consent portal');
    }
  };

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement>) => {
    const { name, value } = e.target;
    setFormData(prev => ({ ...prev, [name]: value }));
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black bg-opacity-50">
      <div className="bg-white dark:bg-gray-800 rounded-lg shadow-xl w-full max-w-md mx-4">
        {/* Header */}
        <div className="flex items-center justify-between p-6 border-b border-gray-200 dark:border-gray-700">
          <div className="flex items-center space-x-3">
            <Shield className="h-6 w-6 text-blue-600" />
            <h3 className="text-lg font-semibold text-gray-900 dark:text-white">
              {mode === 'management' ? 'Manage Consents' : 'Renew Consent'}
            </h3>
          </div>
          <button
            onClick={onClose}
            className="text-gray-400 hover:text-gray-600 dark:hover:text-gray-300"
          >
            <X className="h-6 w-6" />
          </button>
        </div>

        {/* Content */}
        <form onSubmit={handleSubmit} className="p-6 space-y-4">
          {mode === 'renewal' && renewalData && (
            <div className="bg-yellow-50 dark:bg-yellow-900/20 border border-yellow-200 dark:border-yellow-800 rounded-lg p-4 mb-4">
              <div className="flex items-start space-x-3">
                <AlertCircle className="h-5 w-5 text-yellow-600 dark:text-yellow-400 mt-0.5" />
                <div>
                  <h4 className="text-sm font-medium text-yellow-800 dark:text-yellow-200">
                    Consent Expired
                  </h4>
                  <p className="text-sm text-yellow-700 dark:text-yellow-300 mt-1">
                    Your consent for <strong>{renewalData.institution_display_name}</strong> has
                    expired and needs to be renewed.
                  </p>
                </div>
              </div>
            </div>
          )}

          <div className="bg-blue-50 dark:bg-blue-900/20 border border-blue-200 dark:border-blue-800 rounded-lg p-4">
            <div className="flex items-start space-x-3">
              <ExternalLink className="h-5 w-5 text-blue-600 dark:text-blue-400 mt-0.5" />
              <div>
                <h4 className="text-sm font-medium text-blue-800 dark:text-blue-200">
                  External Portal
                </h4>
                <p className="text-sm text-blue-700 dark:text-blue-300 mt-1">
                  This will open Belvo's secure consent management portal in a new window where you
                  can manage your bank connection consents.
                </p>
              </div>
            </div>
          </div>

          {/* User Type Selection */}
          <div>
            <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
              User Type
            </label>
            <div className="grid grid-cols-2 gap-2">
              <label className="flex items-center space-x-2 p-3 border border-gray-300 dark:border-gray-600 rounded-lg cursor-pointer hover:bg-gray-50 dark:hover:bg-gray-700">
                <input
                  type="radio"
                  name="user_type"
                  value="individual"
                  checked={formData.user_type === 'individual'}
                  onChange={handleInputChange}
                  className="text-blue-600"
                />
                <User className="h-4 w-4 text-gray-500" />
                <span className="text-sm text-gray-700 dark:text-gray-300">Individual</span>
              </label>
              <label className="flex items-center space-x-2 p-3 border border-gray-300 dark:border-gray-600 rounded-lg cursor-pointer hover:bg-gray-50 dark:hover:bg-gray-700">
                <input
                  type="radio"
                  name="user_type"
                  value="business"
                  checked={formData.user_type === 'business'}
                  onChange={handleInputChange}
                  className="text-blue-600"
                />
                <Building className="h-4 w-4 text-gray-500" />
                <span className="text-sm text-gray-700 dark:text-gray-300">Business</span>
              </label>
            </div>
          </div>

          {/* CPF Field */}
          <div>
            <label
              htmlFor="cpf"
              className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1"
            >
              CPF <span className="text-red-500">*</span>
            </label>
            <input
              type="text"
              id="cpf"
              name="cpf"
              value={formData.cpf}
              onChange={handleInputChange}
              placeholder="000.000.000-00"
              className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg focus:ring-blue-500 focus:border-blue-500 dark:bg-gray-700 dark:text-white"
              required
            />
          </div>

          {/* Full Name Field */}
          <div>
            <label
              htmlFor="full_name"
              className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1"
            >
              Full Name <span className="text-red-500">*</span>
            </label>
            <input
              type="text"
              id="full_name"
              name="full_name"
              value={formData.full_name}
              onChange={handleInputChange}
              placeholder="Enter your full name"
              className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg focus:ring-blue-500 focus:border-blue-500 dark:bg-gray-700 dark:text-white"
              required
            />
          </div>

          {/* CNPJ Field (for business users) */}
          {formData.user_type === 'business' && (
            <div>
              <label
                htmlFor="cnpj"
                className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1"
              >
                CNPJ <span className="text-red-500">*</span>
              </label>
              <input
                type="text"
                id="cnpj"
                name="cnpj"
                value={formData.cnpj}
                onChange={handleInputChange}
                placeholder="00.000.000/0000-00"
                className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg focus:ring-blue-500 focus:border-blue-500 dark:bg-gray-700 dark:text-white"
                required
              />
            </div>
          )}

          {/* Error Display */}
          {error && (
            <div className="bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-800 rounded-lg p-3">
              <p className="text-sm text-red-700 dark:text-red-300">{error}</p>
            </div>
          )}

          {/* Actions */}
          <div className="flex space-x-3 pt-4">
            <button
              type="button"
              onClick={onClose}
              className="flex-1 px-4 py-2 text-gray-700 dark:text-gray-300 border border-gray-300 dark:border-gray-600 rounded-lg hover:bg-gray-50 dark:hover:bg-gray-700"
            >
              Cancel
            </button>
            <button
              type="submit"
              disabled={isLoading}
              className="flex-1 px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center space-x-2"
            >
              {isLoading ? (
                <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white"></div>
              ) : (
                <>
                  <ExternalLink className="h-4 w-4" />
                  <span>{mode === 'management' ? 'Open Consent Portal' : 'Renew Consent'}</span>
                </>
              )}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};
