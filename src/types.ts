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

export interface GsoBalanceParams {
  expiration: string;
  expirationInt: number;
  soStatePk: PublicKey;
  gsoStatePk: PublicKey;
  base: PublicKey;
  quote: PublicKey;
  option?: PublicKey;
  baseAtoms: number;
  quoteAtoms: number;
  soName: string;
  gsoName: string;
  strike: number;
  lotSize: number;
  numTokens: number;
  optionTokens: number;
  metadata?: any;
  optionMetadata?: any;
}
