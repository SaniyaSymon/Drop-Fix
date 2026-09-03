import React from "react";
import { Stack } from "expo-router";
import { LogBox, StatusBar } from "react-native";
import { SafeAreaProvider } from "react-native-safe-area-context";
import { KeyboardProvider } from "react-native-keyboard-controller";
import { LanguageProvider } from "../src/context/LanguageContext";
import { AuthProvider } from "../src/context/AuthContext";
import { IncidentProvider } from "../src/context/IncidentContext";

LogBox.ignoreAllLogs(true);

export default function RootLayout() {
  return (
    <SafeAreaProvider>
      <KeyboardProvider>
        <LanguageProvider>
          <AuthProvider>
            <IncidentProvider>
              <StatusBar barStyle="dark-content" backgroundColor="#FFFFFF" />
              <Stack screenOptions={{ headerShown: false }}>
                <Stack.Screen name="index" options={{ headerShown: false }} />
              </Stack>
            </IncidentProvider>
          </AuthProvider>
        </LanguageProvider>
      </KeyboardProvider>
    </SafeAreaProvider>
  );
}
