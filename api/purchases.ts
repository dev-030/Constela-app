import Purchases, {
  PurchasesOffering,
  PurchasesOfferings,
  CustomerInfo,
  PurchasesPackage,
} from "react-native-purchases";
import { NativeModules } from "react-native";

const RC_KEY = process.env.EXPO_PUBLIC_REVENUECAT_KEY ?? "";

let initialized = false;

// Check if the native RevenueCat module is actually compiled in (fails on Expo Go)
export function isNativeModuleAvailable(): boolean {
  try {
    return !!NativeModules.RNPurchases;
  } catch (e) {
    return false;
  }
}

export function initializePurchases(userId: string) {
  if (!RC_KEY) {
    console.warn("[Purchases] EXPO_PUBLIC_REVENUECAT_KEY is not set. RevenueCat disabled.");
    return;
  }
  if (!isNativeModuleAvailable()) {
    console.warn("[Purchases] Native RevenueCat module is not available (running in Expo Go?). Custom sandbox mock flow will be used.");
    return;
  }
  if (initialized) return;
  try {
    Purchases.configure({ apiKey: RC_KEY, appUserID: userId });
    initialized = true;
    console.log("[Purchases] RevenueCat initialized for user:", userId);
  } catch (e) {
    console.error("[Purchases] Failed to configure Purchases:", e);
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
    const offerings: PurchasesOfferings = await Purchases.getOfferings();
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

export async function purchasePackage(pkg: PurchasesPackage): Promise<CustomerInfo | null> {
  if (!RC_KEY || !isNativeModuleAvailable()) {
    console.warn("[Purchases] RevenueCat not available — skipping purchase.");
    return null;
  }
  try {
    const { customerInfo } = await Purchases.purchasePackage(pkg);
    return customerInfo;
  } catch (e: any) {
    if (!e.userCancelled) {
      console.error("[Purchases] Purchase failed:", e);
    }
    return null;
  }
}

export async function getCustomerInfo(): Promise<CustomerInfo | null> {
  if (!RC_KEY || !isNativeModuleAvailable()) return null;
  try {
    return await Purchases.getCustomerInfo();
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
