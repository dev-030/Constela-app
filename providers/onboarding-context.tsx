import React, { createContext, useContext, useState } from "react";

export type Gender = "Woman" | "Man" | "Non-binary" | "Other";

export type LookingFor =
  | "Friendship"
  | "Serious Relationship"
  | "We'll See"
  | "Going Out";

export type YesNo = "Yes" | "No";
export type Sport = "Intense" | "Moderate" | "No Sport";
export type EatingHabits =
  | "Balanced"
  | "Fast Food"
  | "Vegetarian"
  | "Vegan"
  | "Other";

export interface OnboardingData {
  // Step 1
  photos: string[];
  username: string;
  age: string;
  height: string;
  gender: Gender | null;
  genderPreference: Gender | "Everyone" | null;

  // Step 2
  maritalStatus: string;
  spokenLanguages: string[];
  city: string;
  country: string;
  weight: string;
  education: string;

  // Step 3
  qualities: string[];
  interests: string[];
  lookingFor: LookingFor[];
  hasChildren: YesNo | null;
  wantChildren: YesNo | null;

  // Step 4
  smoking: YesNo | null;
  alcohol: YesNo | null;
  pets: YesNo | null;
  sport: Sport | null;
  eatingHabits: EatingHabits[];

  // Emotional
  rechargeMethods: string[];
  exhaustTriggers: string[];
  emotionalNeeds: string[];
  humor: YesNo | null;
  soothesMethods: string[];
}

const initialData: OnboardingData = {
  photos: [],
  username: "",
  age: "",
  height: "",
  gender: null,
  genderPreference: null,
  maritalStatus: "",
  spokenLanguages: [],
  city: "",
  country: "",
  weight: "",
  education: "",
  qualities: [],
  interests: [],
  lookingFor: [],
  hasChildren: null,
  wantChildren: null,
  smoking: null,
  alcohol: null,
  pets: null,
  sport: null,
  eatingHabits: [],
  rechargeMethods: [],
  exhaustTriggers: [],
  emotionalNeeds: [],
  humor: null,
  soothesMethods: [],
};

type OnboardingContextType = {
  data: OnboardingData;
  update: <K extends keyof OnboardingData>(
    key: K,
    value: OnboardingData[K],
  ) => void;
  reset: () => void;
};

const OnboardingContext = createContext<OnboardingContextType | undefined>(
  undefined,
);

export function OnboardingProvider({
  children,
}: {
  children: React.ReactNode;
}) {
  const [data, setData] = useState<OnboardingData>(initialData);

  const update = <K extends keyof OnboardingData>(
    key: K,
    value: OnboardingData[K],
  ) => {
    setData((prev) => ({ ...prev, [key]: value }));
  };

  const reset = () => setData(initialData);

  return (
    <OnboardingContext.Provider value={{ data, update, reset }}>
      {children}
    </OnboardingContext.Provider>
  );
}

export function useOnboarding() {
  const ctx = useContext(OnboardingContext);
  if (!ctx) {
    throw new Error("useOnboarding must be used within an OnboardingProvider");
  }
  return ctx;
}
