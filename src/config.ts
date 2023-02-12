export const GSO_PROGRAM_ID = "DuALd6fooWzVDkaTsQzDAxPGYCnLrnWamdNNTNxicdX8";
export const GSO_STATE_SIZE = 1000;

export const USDC_MINT_MAINNET = "EPjFWdd5AufqSSqeM2qN1xzybapC8G4wEGGkZwyTDt1v";
export const BONK_MINT_MAINNET = "DezXAZ8z7PnrnRJjz3wXBoRgixCa6xjnB7YaB1pPB263";
export const WSOL_MINT = "So11111111111111111111111111111111111111112";

export const NUM_LAMPORTS_PER_SOL = 10 ** 9;
export const NUM_SPL_ATOMS_PER_TOKEN: Record<string, number> = {
  [WSOL_MINT]: NUM_LAMPORTS_PER_SOL,
  [USDC_MINT_MAINNET]: 10 ** 6,
  [BONK_MINT_MAINNET]: 10 ** 5,
};
export const NUM_DECIMALS_PER_TOKEN: Record<string, number> = {
  [WSOL_MINT]: 9,
  [USDC_MINT_MAINNET]: 6,
  [BONK_MINT_MAINNET]: 5,
};
