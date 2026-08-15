/**
 * ZeroPay Compact Circuit Type Definitions
 */

export interface PrivateWitness {
  secretKey: string;
  proof: string[];
  indices: boolean[];
}

export interface ZeroPayLedgerState {
  vaultTotal: bigint;
  payoutRoot: string;
  nullifierSet: Set<string>;
}

export interface ClaimPayoutParams {
  publicNullifier: string;
  payoutAmount: bigint;
  witness: PrivateWitness;
}

export interface DepositPayrollParams {
  depositAmount: bigint;
  newPayoutRoot: string;
}
