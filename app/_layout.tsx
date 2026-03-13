import { Stack } from 'expo-router';

export default function Layout() {
  return (
    <Stack>
      <Stack.Screen name="index" options={{ headerShown: false }} />
      <Stack.Screen name="profile" options={{ headerShown: false }} />
      <Stack.Screen name="home" options={{ headerShown: false }} />
      <Stack.Screen
        name="checkin"
        options={{
          title: 'Check-in',
          headerStyle: { backgroundColor: '#0A0F2C' },
          headerTintColor: '#FFFFFF',
        }}
      />
      <Stack.Screen
        name="finish-class"
        options={{
          title: 'Finish Class',
          headerStyle: { backgroundColor: '#0A0F2C' },
          headerTintColor: '#FFFFFF',
        }}
      />
      <Stack.Screen
        name="records"
        options={{
          title: 'Recorded Data',
          headerStyle: { backgroundColor: '#0A0F2C' },
          headerTintColor: '#FFFFFF',
        }}
      />
    </Stack>
  );
}