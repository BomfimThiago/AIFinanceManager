import { Stack } from 'expo-router';
import { useColorMode } from '../../providers/GluestackUIProvider';

export default function ReceiptLayout() {
  const { isDark } = useColorMode();

  const colors = {
    background: isDark ? '#1f2937' : '#ffffff',
    text: isDark ? '#f9fafb' : '#1f2937',
    border: isDark ? '#374151' : '#e5e7eb',
  };

  return (
    <Stack>
      <Stack.Screen
        name="[id]"
        options={{
          headerShown: true,
          title: 'Detalle del Recibo',
          headerBackTitle: 'Volver',
          headerStyle: {
            backgroundColor: colors.background,
          },
          headerTitleStyle: {
            color: colors.text,
            fontWeight: '600',
          },
          headerTintColor: '#7c3aed',
          headerShadowVisible: false,
        }}
      />
    </Stack>
  );
}
