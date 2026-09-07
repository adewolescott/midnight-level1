import type * as __compactRuntime from '@midnight-ntwrk/compact-runtime';

export type Witnesses<PS> = {
  getSecretKey(context: __compactRuntime.WitnessContext<Ledger, PS>): [PS, Uint8Array];
}

export type ImpureCircuits<PS> = {
  depositPayroll(context: __compactRuntime.CircuitContext<PS>,
                 depositAmount_0: bigint,
                 newPayoutRoot_0: Uint8Array): __compactRuntime.CircuitResults<PS, []>;
  claimPayout(context: __compactRuntime.CircuitContext<PS>,
              publicNullifier_0: Uint8Array,
              payoutAmount_0: bigint): __compactRuntime.CircuitResults<PS, []>;
}

export type ProvableCircuits<PS> = {
  depositPayroll(context: __compactRuntime.CircuitContext<PS>,
                 depositAmount_0: bigint,
                 newPayoutRoot_0: Uint8Array): __compactRuntime.CircuitResults<PS, []>;
  claimPayout(context: __compactRuntime.CircuitContext<PS>,
              publicNullifier_0: Uint8Array,
              payoutAmount_0: bigint): __compactRuntime.CircuitResults<PS, []>;
}

export type PureCircuits = {
}

export type Circuits<PS> = {
  depositPayroll(context: __compactRuntime.CircuitContext<PS>,
                 depositAmount_0: bigint,
                 newPayoutRoot_0: Uint8Array): __compactRuntime.CircuitResults<PS, []>;
  claimPayout(context: __compactRuntime.CircuitContext<PS>,
              publicNullifier_0: Uint8Array,
              payoutAmount_0: bigint): __compactRuntime.CircuitResults<PS, []>;
}

export type Ledger = {
  readonly vaultTotal: bigint;
  readonly payoutRoot: Uint8Array;
  nullifierSet: {
    isEmpty(): boolean;
    size(): bigint;
    member(key_0: Uint8Array): boolean;
    lookup(key_0: Uint8Array): boolean;
    [Symbol.iterator](): Iterator<[Uint8Array, boolean]>
  };
}

export type ContractReferenceLocations = any;

export declare const contractReferenceLocations : ContractReferenceLocations;

export declare class Contract<PS = any, W extends Witnesses<PS> = Witnesses<PS>> {
  witnesses: W;
  circuits: Circuits<PS>;
  impureCircuits: ImpureCircuits<PS>;
  provableCircuits: ProvableCircuits<PS>;
  constructor(witnesses: W);
  initialState(context: __compactRuntime.ConstructorContext<PS>): __compactRuntime.ConstructorResult<PS>;
}

export declare function ledger(state: __compactRuntime.StateValue | __compactRuntime.ChargedState): Ledger;
export declare const pureCircuits: PureCircuits;
