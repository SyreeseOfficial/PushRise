import Purchases, {LOG_LEVEL} from 'react-native-purchases';
import type {CustomerInfo} from 'react-native-purchases';

export const ENTITLEMENT_ID = 'PushRise Pro';
const API_KEY = 'test_kEucPufvOJTuKoxTclrABZFTNiT';

export function initializePurchases() {
  if (__DEV__) Purchases.setLogLevel(LOG_LEVEL.DEBUG);
  Purchases.configure({apiKey: API_KEY});
}

export function isPro(customerInfo: CustomerInfo): boolean {
  return typeof customerInfo.entitlements.active[ENTITLEMENT_ID] !== 'undefined';
}

export async function getIsSubscribed(): Promise<boolean> {
  try {
    const info = await Purchases.getCustomerInfo();
    return isPro(info);
  } catch {
    return false;
  }
}

export async function restorePurchases(): Promise<boolean> {
  try {
    const info = await Purchases.restorePurchases();
    return isPro(info);
  } catch {
    return false;
  }
}
