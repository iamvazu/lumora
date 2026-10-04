import { CurrencyCode, LedgerOwnerType } from './types.js';

export class LedgerAccountManager {
  /**
   * Generates a deterministic system account name or identifier key
   */
  static getSystemAccountKey(ownerType: LedgerOwnerType, ownerId: string | null, currency: CurrencyCode): string {
    if (ownerId) {
      return `${ownerType}:${ownerId}:${currency}`;
    }
    return `${ownerType}:${currency}`;
  }

  static isPlatformAccount(ownerType: LedgerOwnerType): boolean {
    return ownerType === 'platform' || ownerType === 'tax' || ownerType === 'reserve' || ownerType === 'processor';
  }
}
