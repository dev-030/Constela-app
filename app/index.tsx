import { useAuthStore } from "@/store/authStore";
import { Redirect } from "expo-router";
import React from "react";

export default function IndexScreen() {
  const isAuthenticated = useAuthStore((state) => state.isAuthenticated);
  const isRestoring = useAuthStore((state) => state.isRestoring);

  if (isRestoring) {
    return null; // or a splash screen
  }

  if (!isAuthenticated) {
    return <Redirect href={"/(auth)/login"} />;
  }
  return <Redirect href={"/(tabs)/home"} />;
}
