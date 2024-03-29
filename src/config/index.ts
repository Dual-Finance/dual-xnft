export const GSO_STATE_SIZE = 1000;
export const STAKING_OPTIONS_STATE_SIZE = 1150;

export const USDC_MINT_MAINNET = "EPjFWdd5AufqSSqeM2qN1xzybapC8G4wEGGkZwyTDt1v";
export const BONK_MINT_MAINNET = "DezXAZ8z7PnrnRJjz3wXBoRgixCa6xjnB7YaB1pPB263";
export const DUAL_MINT_MAINNET = "DUALa4FC2yREwZ59PHeu1un4wis36vHRv5hWVBmzykCJ";
export const WSOL_MINT = "So11111111111111111111111111111111111111112";

export const NUM_LAMPORTS_PER_SOL = 10 ** 9;
export const NUM_SPL_ATOMS_PER_TOKEN: Record<string, number> = {
  [WSOL_MINT]: NUM_LAMPORTS_PER_SOL,
  [USDC_MINT_MAINNET]: 10 ** 6,
  [BONK_MINT_MAINNET]: 10 ** 5,
  [DUAL_MINT_MAINNET]: 10 ** 6,
};

export const PK_TO_ASSET: Record<string, string> = {
  [USDC_MINT_MAINNET]: "USDC",
  [BONK_MINT_MAINNET]: "BONK",
  [DUAL_MINT_MAINNET]: "DUAL",
  LSO: "LSO",
};

export const SO_LIQ_LIST = [
  "GSOBONK_LOYALTY_11",
  "GSOBONK_LOYALTY_10",
  "GSOBONK_LOYALTY_9",
  "MNGO Buyback 8",
];
export const DUAL_API_MAINNET = "https://api.dual.finance";
