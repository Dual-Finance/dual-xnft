import { useEffect, useState } from "react";
import { Connection, PublicKey } from "@solana/web3.js";
import { useConnection } from "@solana/wallet-adapter-react";
import { getAssociatedTokenAddress } from "@solana/spl-token";
import { Address, Idl, Program } from "@project-serum/anchor";
import {
  StakingOptions,
  STAKING_OPTIONS_PK,
} from "@dual-finance/staking-options";
import stakingOptionsIdl from "@dual-finance/staking-options/lib/staking_options_idl.json";
import { useWallet } from "./useWallet";
import { GsoBalanceParams, SOState } from "../types";
import { STAKING_OPTIONS_STATE_SIZE } from "../config";
import { getMultipleTokenAccounts } from "../utils";

function tokenAccountAmount(tokenAccount: any): number {
  const { amount } = tokenAccount.data.parsed.info.tokenAmount;
  const { decimals } = tokenAccount.data.parsed.info.tokenAmount;
  return amount / 10 ** decimals;
}

export default function useStakingOptionsBalance() {
  const { connection } = useConnection();
  const { publicKey } = useWallet();

  const [stakingOptions, setStakingOptions] = useState<GsoBalanceParams[]>([]);

  useEffect(() => {
    fetchStakingOptionsBalance(connection, publicKey).then((data) => {
      if (data) {
        setStakingOptions(data);
      }
    });
  }, [connection, publicKey]);

  return { stakingOptions };
}

export async function fetchStakingOptionsBalance(
  connection: Connection,
  publicKey: PublicKey | null
) {
  if (!publicKey) {
    return;
  }

  try {
    // Fetch all program accounts for SO.
    const data = await connection.getProgramAccounts(STAKING_OPTIONS_PK);
    const allStakingOptionParams = [];

    const stateAddresses: Address[] = [];
    // Check all possible DIP.
    // eslint-disable-next-line no-restricted-syntax
    for (const programAccount of data) {
      if (programAccount.account.data.length !== STAKING_OPTIONS_STATE_SIZE) {
        continue;
      }
      stateAddresses.push(programAccount.pubkey.toBase58());
    }
    const program = new Program(stakingOptionsIdl as Idl, STAKING_OPTIONS_PK, window.xnft.solana);
    const states = await program.account.state.fetchMultiple(stateAddresses);

    const stakingOptionsHelper = new StakingOptions(connection.rpcEndpoint);
    const tokenAccountAddresses: string[] = [];
    // For each, check the option mint and look into the ATA
    // eslint-disable-next-line no-restricted-syntax
    for (const state of states) {
      const { strikes, soName, baseMint } = state as SOState;
      // TODO: Do this for multiple strikes. Will be easier once switched to balance API.
      const soMint = await stakingOptionsHelper.soMint(
        strikes[0],
        soName,
        baseMint
      );
      const ataAddress = await getAssociatedTokenAddress(soMint, publicKey);
      tokenAccountAddresses.push(ataAddress.toBase58());
    }
    // TODO: Fetch all balances once in helius API and store it similar to pricing.
    const tokenAccounts = (
      await getMultipleTokenAccounts(
        connection,
        tokenAccountAddresses,
        "confirmed"
      )
    ).array;

    for (let i = 0; i < states.length; ++i) {
      if (!tokenAccounts[i]) {
        continue;
      }
      const {
        strikes,
        soName,
        baseMint,
        optionExpiration,
        quoteMint,
        lotSize,
        baseDecimals,
        quoteDecimals,
      } = states[i] as unknown as SOState;

      if (optionExpiration < Math.floor(Date.now() / 1_000)) {
        continue;
      }

      if (tokenAccountAmount(tokenAccounts[i]) === 0) {
        continue;
      }

      const soMint = await stakingOptionsHelper.soMint(
        strikes[0],
        soName,
        baseMint
      );
      const soParams: GsoBalanceParams = {
        soName,
        gsoName: soName,
        lotSize,
        numTokens: tokenAccountAmount(tokenAccounts[i]),
        optionTokens: tokenAccountAmount(tokenAccounts[i]),
        expiration: new Date(optionExpiration * 1_000).toLocaleDateString(),
        expirationInt: optionExpiration,
        strike: (strikes[0] / lotSize) * 10 ** baseDecimals,
        gsoStatePk: new PublicKey(stateAddresses[i]),
        soStatePk: new PublicKey(stateAddresses[i]),
        base: baseMint,
        quote: quoteMint,
        option: soMint,
        baseAtoms: baseDecimals,
        quoteAtoms: quoteDecimals,
      };
      allStakingOptionParams.push(soParams);
    }
    return allStakingOptionParams;
  } catch (err) {
    console.error(err);
  }
}
