import { useAuthStore } from "@/store/authStore";
import { Redirect } from "expo-router";
import React from "react";

export default function IndexScreen() {
  const isAuthenticated = useAuthStore((state) => state.isAuthenticated);

  if (!isAuthenticated) {
    return <Redirect href={"/(auth)/login"} />;
  }
  return <Redirect href={"/(tabs)/home"} />;
}
