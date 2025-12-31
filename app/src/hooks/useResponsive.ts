import { useWindowDimensions } from 'react-native';

interface ResponsiveInfo {
  width: number;
  height: number;
  isSmallMobile: boolean;  // < 375px (iPhone SE, small Android)
  isMobile: boolean;       // < 768px
  isTablet: boolean;       // 768px - 1024px
  isDesktop: boolean;      // >= 1024px
  // Helper values
  horizontalPadding: number;
  containerMaxWidth: number;
}

export function useResponsive(): ResponsiveInfo {
  const { width, height } = useWindowDimensions();

  const isSmallMobile = width < 375;
  const isMobile = width < 768;
  const isTablet = width >= 768 && width < 1024;
  const isDesktop = width >= 1024;

  return {
    width,
    height,
    isSmallMobile,
    isMobile,
    isTablet,
    isDesktop,
    horizontalPadding: isSmallMobile ? 12 : isMobile ? 16 : 24,
    containerMaxWidth: isDesktop ? 1200 : isTablet ? 800 : width,
  };
}
