import Purchases, {
  PurchasesOffering,
  PurchasesOfferings,
  CustomerInfo,
  PurchasesPackage,
  UpgradeInfo,
} from "react-native-purchases";
import { NativeModules } from "react-native";
import { useProfileStore } from "@/store/profileStore";
import { useAuthStore } from "@/store/authStore";
import { apiClient } from "./client";
import type { UserProfile } from "./profile";

const RC_KEY = process.env.EXPO_PUBLIC_REVENUECAT_KEY ?? "";

let initialized = false;
let identityQueue: Promise<void> = Promise.resolve();
let purchaseInProgress = false;

// Check if the native RevenueCat module is actually compiled in (fails on Expo Go)
export function isNativeModuleAvailable(): boolean {
  try {
    return !!NativeModules.RNPurchases;
  } catch (e) {
    return false;
  }
}

export function initializePurchases(userId: string): Promise<void> {
  const run = identityQueue.catch(() => {}).then(async () => {
    if (!RC_KEY || !isNativeModuleAvailable()) throw new Error("Store purchases are unavailable in this build.");
    if (!useAuthStore.getState().isAuthenticated || useProfileStore.getState().profile?.id !== userId) {
      throw new Error("Your account changed. Please try again.");
    }
    if (!initialized) {
      Purchases.configure({ apiKey: RC_KEY, appUserID: userId });
      initialized = true;
    } else if (await Purchases.getAppUserID() !== userId) {
      if (purchaseInProgress) throw new Error("A purchase is still in progress.");
      await Purchases.logIn(userId);
    }
  });
  identityQueue = run;
  return run;
}

async function ensureIdentity() {
  const id = useProfileStore.getState().profile?.id;
  if (!id) throw new Error("Please sign in before making a purchase.");
  await initializePurchases(id);
  return id;
}

export async function syncSubscription(): Promise<UserProfile> {
  const id = useProfileStore.getState().profile?.id;
  if (!id || !useAuthStore.getState().isAuthenticated) throw new Error("Please sign in.");
  const { data } = await apiClient.post<UserProfile>('/api/subscription/sync/');
  if (!useAuthStore.getState().isAuthenticated || useProfileStore.getState().profile?.id !== id || data.id !== id) {
    throw new Error("Your account changed. Please try again.");
  }
  useProfileStore.getState().setProfile(data);
  return data;
}

export async function restorePurchases(): Promise<CustomerInfo> {
  const id = await ensureIdentity();
  if (purchaseInProgress) throw new Error("A purchase is still in progress.");
  purchaseInProgress = true;
  try {
    const info = await Purchases.restorePurchases();
    if (useProfileStore.getState().profile?.id !== id || !useAuthStore.getState().isAuthenticated) throw new Error("Your account changed.");
    return info;
  } finally {
    purchaseInProgress = false;
  }
}

/**
 * Returns every offering configured in RevenueCat as an array, with the
 * "current" offering first. The caller should flatten availablePackages
 * across all of them — many apps configure products across multiple
 * offerings (e.g. one per tier or per locale) and lookups by identifier
 * shouldn't depend on which one is currently flagged as default.
 */
export async function getOfferings(): Promise<PurchasesOffering[] | null> {
  if (!RC_KEY || !isNativeModuleAvailable()) return null;
  try {
    const id = await ensureIdentity();
    const offerings: PurchasesOfferings = await Purchases.getOfferings();
    if (useProfileStore.getState().profile?.id !== id || !useAuthStore.getState().isAuthenticated) return null;
    const currentId = offerings.current?.identifier;
    const all = Object.values(offerings.all ?? {});
    if (!currentId) return all;
    // Put the current offering first so its packages win dedup ties.
    return [...all.filter((o) => o.identifier === currentId), ...all.filter((o) => o.identifier !== currentId)];
  } catch (e) {
    console.error("[Purchases] Failed to fetch offerings:", e);
    return null;
  }
}

export async function purchasePackage(
  pkg: PurchasesPackage,
  upgradeInfo?: UpgradeInfo | null
): Promise<CustomerInfo | null> {
  if (!RC_KEY || !isNativeModuleAvailable()) {
    console.warn("[Purchases] RevenueCat not available — skipping purchase.");
    return null;
  }
  const id = await ensureIdentity();
  if (purchaseInProgress) throw new Error("A purchase is still in progress.");
  purchaseInProgress = true;
  try {
    const { customerInfo } = await Purchases.purchasePackage(pkg, upgradeInfo);
    if (useProfileStore.getState().profile?.id !== id || !useAuthStore.getState().isAuthenticated) throw new Error("Your account changed.");
    return customerInfo;
  } catch (e: any) {
    if (!e.userCancelled) {
      throw e;
    }
    return null;
  } finally {
    purchaseInProgress = false;
  }
}

export async function getCustomerInfo(): Promise<CustomerInfo | null> {
  if (!RC_KEY || !isNativeModuleAvailable()) return null;
  try {
    const id = await ensureIdentity();
    const info = await Purchases.getCustomerInfo();
    if (useProfileStore.getState().profile?.id !== id || !useAuthStore.getState().isAuthenticated) return null;
    return info;
  } catch (e) {
    console.error("[Purchases] Failed to get customer info:", e);
    return null;
  }
}

export function hasEntitlement(customerInfo: CustomerInfo, entitlementId: string): boolean {
  try {
    return entitlementId in (customerInfo?.entitlements?.active ?? {});
  } catch (e) {
    return false;
  }
}
