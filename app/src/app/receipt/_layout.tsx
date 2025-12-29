import { Stack } from 'expo-router';

export default function ReceiptLayout() {
  return (
    <Stack>
      <Stack.Screen
        name="[id]"
        options={{
          headerShown: true,
          title: 'Receipt Details',
          headerBackTitle: 'Back',
        }}
      />
    </Stack>
  );
}
