import { Stack } from 'expo-router';
import { StatusBar } from 'expo-status-bar';
import { SafeAreaProvider } from 'react-native-safe-area-context';
import { AuthProvider } from '@/providers/AuthProvider';
import { colors } from '@/theme/colors';

export default function RootLayout() {
  return (
    <SafeAreaProvider>
      <AuthProvider>
        <StatusBar style="light" />
        <Stack
          screenOptions={{
            headerStyle: { backgroundColor: colors.primary },
            headerTintColor: colors.white,
            headerTitleStyle: { fontWeight: '600' },
            contentStyle: { backgroundColor: colors.bgLight },
          }}
        >
          <Stack.Screen name="index" options={{ title: 'AnestheQuest' }} />
          <Stack.Screen name="sign-in" options={{ title: 'Entrar' }} />
        </Stack>
      </AuthProvider>
    </SafeAreaProvider>
  );
}
