import { PublicKey } from "@solana/web3.js";

export interface SOState {
  soName: string;
  authority: PublicKey;
  optionsAvailable: number;
  optionExpiration: number;
  subscriptionPeriodEnd: number;
  baseDecimals: number;
  quoteDecimals: number;
  baseMint: PublicKey;
  quoteMint: PublicKey;
  quoteAccount: PublicKey;
  lotSize: number;
  stateBump: number;
  vaultBump: number;
  strikes: number[];
}

export interface GsoParams {
  expiration: string;
  expirationInt: number;
  subscription: string;
  subscriptionInt: number;
  gsoStatePk: PublicKey;
  soStatePk: PublicKey;
  base: PublicKey;
  soName: string;
  strike: number;
  lockupRatio: number;
  lotSize: number;
  metadata: any;
}
