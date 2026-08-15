import { describe, it, expect, beforeEach } from 'vitest';
import { createHash } from 'crypto';

// Cryptographic test helpers simulating Compact persistentHash
function sha256(data: Buffer | string): Buffer {
  return createHash('sha256').update(data).digest();
}

function computeTestLeaf(secretKeyHex: string, amount: bigint): Buffer {
  const secretKeyBuf = Buffer.from(secretKeyHex.replace('0x', ''), 'hex');
  const amountBuf = Buffer.alloc(32);
  amountBuf.writeBigUInt64BE(amount, 24);
  return sha256(Buffer.concat([secretKeyBuf, amountBuf]));
}

function computeNode(left: Buffer, right: Buffer): Buffer {
  return sha256(Buffer.concat([left, right]));
}

// Mock Simulator for ZeroPay Compact Contract State
class ZeroPaySimulator {
  public vaultTotal: bigint = 0n;
  public payoutRoot: string = '0x' + '00'.repeat(32);
  public nullifierSet: Set<string> = new Set();

  depositPayroll(depositAmount: bigint, newPayoutRoot: string) {
    if (depositAmount <= 0n) {
      throw new Error('ZeroPay: Deposit amount must be greater than zero');
    }
    this.vaultTotal += depositAmount;
    this.payoutRoot = newPayoutRoot;
  }

  claimPayout(
    publicNullifier: string,
    payoutAmount: bigint,
    witness: {
      secretKey: string;
      proof: Buffer[];
      indices: boolean[];
    }
  ) {
    if (this.vaultTotal < payoutAmount) {
      throw new Error('ZeroPay: Insufficient vault funds');
    }
    if (this.nullifierSet.has(publicNullifier)) {
      throw new Error('ZeroPay: Payout has already been claimed');
    }

    const leaf = computeTestLeaf(witness.secretKey, payoutAmount);
    let currentHash = leaf;

    for (let i = 0; i < witness.proof.length; i++) {
      const sibling = witness.proof[i];
      const isRight = witness.indices[i];

      currentHash = isRight
        ? computeNode(sibling, currentHash)
        : computeNode(currentHash, sibling);
    }

    const computedRootHex = '0x' + currentHash.toString('hex');
    if (computedRootHex !== this.payoutRoot) {
      throw new Error('ZeroPay: Invalid private witness or Merkle proof');
    }

    this.nullifierSet.add(publicNullifier);
    this.vaultTotal -= payoutAmount;
  }
}

describe('ZeroPay Contract Circuit Tests', () => {
  let contract: ZeroPaySimulator;
  const aliceSecret = '0x1111111111111111111111111111111111111111111111111111111111111111';
  const bobSecret = '0x2222222222222222222222222222222222222222222222222222222222222222';
  const aliceSalary = 5000n;
  const bobSalary = 3000n;

  let aliceLeaf: Buffer;
  let bobLeaf: Buffer;
  let rootHex: string;
  let dummySibling: Buffer;

  beforeEach(() => {
    contract = new ZeroPaySimulator();
    aliceLeaf = computeTestLeaf(aliceSecret, aliceSalary);
    bobLeaf = computeTestLeaf(bobSecret, bobSalary);

    dummySibling = Buffer.alloc(32, 0xaa);
    const layer1 = computeNode(aliceLeaf, bobLeaf);
    const layer2 = computeNode(layer1, dummySibling);
    const layer3 = computeNode(layer2, dummySibling);
    const root = computeNode(layer3, dummySibling);

    rootHex = '0x' + root.toString('hex');
  });

  it('1. should deposit batch funds and set the public Merkle payout root', () => {
    const depositTotal = 10000n;
    contract.depositPayroll(depositTotal, rootHex);

    expect(contract.vaultTotal).toBe(10000n);
    expect(contract.payoutRoot).toBe(rootHex);
  });

  it('2. should verify private witness and disburse confidential payout', () => {
    contract.depositPayroll(10000n, rootHex);

    const aliceNullifier = '0x' + sha256(aliceSecret + '-batch-1').toString('hex');
    const proof = [bobLeaf, dummySibling, dummySibling, dummySibling];
    const indices = [false, false, false, false];

    contract.claimPayout(aliceNullifier, aliceSalary, {
      secretKey: aliceSecret,
      proof,
      indices,
    });

    expect(contract.vaultTotal).toBe(5000n);
    expect(contract.nullifierSet.has(aliceNullifier)).toBe(true);
  });

  it('3. should prevent double claims using public nullifier', () => {
    contract.depositPayroll(10000n, rootHex);

    const aliceNullifier = '0x' + sha256(aliceSecret + '-batch-1').toString('hex');
    const proof = [bobLeaf, dummySibling, dummySibling, dummySibling];
    const indices = [false, false, false, false];

    // First claim succeeds
    contract.claimPayout(aliceNullifier, aliceSalary, {
      secretKey: aliceSecret,
      proof,
      indices,
    });

    // Second claim with same nullifier must fail
    expect(() => {
      contract.claimPayout(aliceNullifier, aliceSalary, {
        secretKey: aliceSecret,
        proof,
        indices,
      });
    }).toThrowError('ZeroPay: Payout has already been claimed');
  });

  it('4. should reject unauthorized secret key with invalid witness proof', () => {
    contract.depositPayroll(10000n, rootHex);

    const attackerSecret = '0x9999999999999999999999999999999999999999999999999999999999999999';
    const attackerNullifier = '0x' + sha256(attackerSecret + '-batch-1').toString('hex');
    const proof = [bobLeaf, dummySibling, dummySibling, dummySibling];
    const indices = [false, false, false, false];

    expect(() => {
      contract.claimPayout(attackerNullifier, aliceSalary, {
        secretKey: attackerSecret,
        proof,
        indices,
      });
    }).toThrowError('ZeroPay: Invalid private witness or Merkle proof');
  });
});
