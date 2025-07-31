import { useState } from 'react';

const API_BASE_URL = import.meta.env.VITE_API_BASE_URL || 'http://localhost:8001';

// Generic API request function
async function apiRequest<T>(endpoint: string, options: RequestInit = {}): Promise<T> {
  const url = `${API_BASE_URL}${endpoint}`;

  const headers = new Headers(options.headers);

  // Add authorization header
  const authToken = localStorage.getItem('authToken');
  if (authToken) {
    headers.set('Authorization', `Bearer ${authToken}`);
  }

  // Set Content-Type for JSON requests
  if (options.body && !(options.body instanceof FormData)) {
    if (!headers.has('Content-Type')) {
      headers.set('Content-Type', 'application/json');
    }
  }

  const response = await fetch(url, {
    ...options,
    headers,
  });

  if (!response.ok) {
    let errorMessage = `API request failed: ${response.status} ${response.statusText}`;
    try {
      const errorData = await response.json();
      if (errorData.detail) {
        errorMessage = errorData.detail;
      } else if (errorData.message) {
        errorMessage = errorData.message;
      }
    } catch {
      const errorText = await response.text();
      if (errorText) {
        errorMessage = errorText;
      }
    }
    throw new Error(errorMessage);
  }

  const responseText = await response.text();
  if (!responseText) {
    return {} as T;
  }

  return JSON.parse(responseText);
}

interface ConsentManagementRequest {
  cpf: string;
  full_name: string;
  cnpj?: string;
  terms_and_conditions_url?: string;
}

interface ConsentManagementResponse {
  consent_management_url: string;
  access_token: string;
  expires_in: number;
}

interface ConsentRenewalRequest {
  cpf: string;
  full_name: string;
  link_id: string;
  consent_id: string;
  institution: string;
  institution_display_name: string;
  institution_icon_logo?: string;
  cnpj?: string;
  terms_and_conditions_url?: string;
}

interface ConsentRenewalResponse {
  consent_renewal_url: string;
  access_token: string;
  expires_in: number;
}

export const useConsentManagement = () => {
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const generateConsentManagementUrl = async (
    request: ConsentManagementRequest
  ): Promise<ConsentManagementResponse | null> => {
    setIsLoading(true);
    setError(null);

    try {
      const response = await apiRequest<ConsentManagementResponse>(
        '/api/integrations/belvo/consent-management',
        {
          method: 'POST',
          body: JSON.stringify(request),
        }
      );

      return response;
    } catch (err) {
      const errorMessage =
        err instanceof Error ? err.message : 'Failed to generate consent management URL';
      setError(errorMessage);
      return null;
    } finally {
      setIsLoading(false);
    }
  };

  const generateConsentRenewalUrl = async (
    request: ConsentRenewalRequest
  ): Promise<ConsentRenewalResponse | null> => {
    setIsLoading(true);
    setError(null);

    try {
      const response = await apiRequest<ConsentRenewalResponse>(
        '/api/integrations/belvo/consent-renewal',
        {
          method: 'POST',
          body: JSON.stringify(request),
        }
      );

      return response;
    } catch (err) {
      const errorMessage =
        err instanceof Error ? err.message : 'Failed to generate consent renewal URL';
      setError(errorMessage);
      return null;
    } finally {
      setIsLoading(false);
    }
  };

  const openConsentManagement = async (request: ConsentManagementRequest) => {
    const result = await generateConsentManagementUrl(request);

    if (result) {
      // Open the consent management portal in a new window
      window.open(result.consent_management_url, '_blank', 'noopener,noreferrer');
      return true;
    }

    return false;
  };

  const openConsentRenewal = async (request: ConsentRenewalRequest) => {
    const result = await generateConsentRenewalUrl(request);

    if (result) {
      // Open the consent renewal portal in a new window
      window.open(result.consent_renewal_url, '_blank', 'noopener,noreferrer');
      return true;
    }

    return false;
  };

  return {
    isLoading,
    error,
    generateConsentManagementUrl,
    generateConsentRenewalUrl,
    openConsentManagement,
    openConsentRenewal,
  };
};
