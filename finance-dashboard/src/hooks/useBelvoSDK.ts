import { useEffect, useState } from 'react';

interface BelvoWidgetConfig {
  callback: (link: string, institution: any) => void;
  onExit?: (data: any) => void;
  onEvent?: (data: any) => void;
}

declare global {
  interface Window {
    belvoSDK: {
      createWidget: (
        accessToken: string,
        config: BelvoWidgetConfig
      ) => {
        build: () => void;
      };
    };
  }
}

export const useBelvoSDK = () => {
  const [isSDKLoaded, setIsSDKLoaded] = useState(false);
  const [isLoading, setIsLoading] = useState(false);

  useEffect(() => {
    // Check if Belvo SDK is already loaded
    if (window.belvoSDK) {
      setIsSDKLoaded(true);
      return;
    }

    // Load Belvo SDK script
    const script = document.createElement('script');
    script.src = 'https://cdn.belvo.io/belvo-widget-1-stable.js';
    script.type = 'text/javascript';
    script.async = true;

    script.onload = () => {
      setIsSDKLoaded(true);
    };

    script.onerror = () => {
      console.error('Failed to load Belvo SDK');
      setIsSDKLoaded(false);
    };

    document.head.appendChild(script);

    return () => {
      // Cleanup script on unmount
      if (document.head.contains(script)) {
        document.head.removeChild(script);
      }
    };
  }, []);

  const getAccessToken = async (): Promise<string> => {
    const response = await fetch('/api/integrations/belvo/widget-token', {
      method: 'POST',
      headers: {
        Authorization: `Bearer ${localStorage.getItem('authToken')}`,
        'Content-Type': 'application/json',
      },
    });

    if (!response.ok) {
      const errorData = await response.json();
      throw new Error(errorData.detail || 'Failed to get widget token');
    }

    const data = await response.json();
    return data.access_token;
  };

  const openBelvoWidget = async (config: BelvoWidgetConfig) => {
    if (!isSDKLoaded) {
      throw new Error('Belvo SDK is not loaded yet');
    }

    // Ensure the Belvo container exists
    let belvoContainer = document.getElementById('belvo');
    if (!belvoContainer) {
      belvoContainer = document.createElement('div');
      belvoContainer.id = 'belvo';
      document.body.appendChild(belvoContainer);
    }

    // Make the container visible when widget opens
    belvoContainer.style.display = 'block';
    belvoContainer.style.position = 'fixed';
    belvoContainer.style.top = '0';
    belvoContainer.style.left = '0';
    belvoContainer.style.width = '100%';
    belvoContainer.style.height = '100%';
    belvoContainer.style.zIndex = '9999';
    belvoContainer.style.backgroundColor = 'rgba(0, 0, 0, 0.5)';

    setIsLoading(true);

    try {
      const accessToken = await getAccessToken();

      // Enhanced config with exit handler to hide container
      const enhancedConfig = {
        ...config,
        onExit: (data: any) => {
          // Hide the container when widget exits
          if (belvoContainer) {
            belvoContainer.style.display = 'none';
          }
          // Call original onExit if provided
          if (config.onExit) {
            config.onExit(data);
          }
        },
      };

      window.belvoSDK.createWidget(accessToken, enhancedConfig).build();
    } catch (error) {
      // Hide container on error
      if (belvoContainer) {
        belvoContainer.style.display = 'none';
      }
      console.error('Failed to open Belvo widget:', error);
      throw error;
    } finally {
      setIsLoading(false);
    }
  };

  return {
    isSDKLoaded,
    isLoading,
    openBelvoWidget,
  };
};
