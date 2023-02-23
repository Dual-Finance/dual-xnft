import { useEffect, useState } from "react";
import { Connection } from "@solana/web3.js";
import { useConnection } from "@solana/wallet-adapter-react";
import { StakingOptions } from "@dual-finance/staking-options";
import { GSO_PK } from "@dual-finance/gso";

import { GSO_STATE_SIZE } from "../config";
import { GsoParams, SOState } from "../types";
import {
  fetchMint,
  fetchProgramAccounts,
  fetchTokenMetadata,
  parseGsoState,
} from "../core";
import { msToTimeLeft } from "../utils";

export default function useGso() {
  const { connection } = useConnection();
  const [gso, setGso] = useState<GsoParams[]>([]);

  useEffect(() => {
    if (connection) {
      fetchGso(connection)
        .then((data) => {
          setGso(data);
        })
        .catch(console.error);
    }
  }, [connection]);

  return gso;
}

export async function fetchGso(connection: Connection) {
  const stakingOptions = new StakingOptions(connection.rpcEndpoint);
  const data = await fetchProgramAccounts(connection, GSO_PK);
  const allGsoParams = [];
  for (const acct of data) {
    if (acct.account.data.length !== GSO_STATE_SIZE) {
      continue;
    }
    const {
      soName,
      stakingOptionsState,
      subscriptionPeriodEnd,
      strike,
      lockupRatioTokensPerMillion,
      baseMint,
    } = parseGsoState(acct.account.data);
    const lockupRatio = lockupRatioTokensPerMillion / 1000000;
    const stakeTimeRemainingMs = subscriptionPeriodEnd * 1000 - Date.now();
    const isTesting =
      soName.toLowerCase().includes("trial") ||
      soName.toLowerCase().includes("test");

    if (
      stakeTimeRemainingMs <= 0 ||
      lockupRatio <= 0 ||
      strike <= 0 ||
      isTesting
    ) {
      continue;
    }

    // TODO: Unroll these and cache the fetches to improve page load.
    const soState: SOState = (await stakingOptions.getState(
      `GSO${soName}`,
      baseMint
    )) as unknown as SOState;
    const { lotSize, quoteMint, optionExpiration } = soState;
    const tokenJson = await fetchTokenMetadata(connection, baseMint);

    // TODO: Cache mint decimals to avoid load on RPC provider.
    const baseDecimals = (await fetchMint(connection, baseMint)).decimals;
    const quoteDecimals = (await fetchMint(connection, quoteMint)).decimals;

    const timeLeft = msToTimeLeft(stakeTimeRemainingMs);

    // Reversing this computation.
    // const strikeAtomsPerLot = strike * lotSize * 10 ** (quoteDecimals - baseDecimals);
    const strikeInUSD =
      (strike / (10 ** quoteDecimals * lotSize)) * 10 ** baseDecimals;

    const gsoParams: GsoParams = {
      soName,
      lockupRatio,
      lotSize,
      expiration: new Date(optionExpiration * 1000).toLocaleDateString(),
      expirationInt: optionExpiration,
      subscription: timeLeft,
      subscriptionInt: subscriptionPeriodEnd,
      base: baseMint,
      baseAtoms: baseDecimals,
      strike: strikeInUSD,
      gsoStatePk: acct.pubkey,
      soStatePk: stakingOptionsState,
      metadata: tokenJson,
    };
    allGsoParams.push(gsoParams);
  }
  return allGsoParams;
}

export async function fetchGsoDetails(connection: Connection, name?: string) {
  if (!name) return;
  const stakingOptions = new StakingOptions(connection.rpcEndpoint);
  const data = await fetchProgramAccounts(connection, GSO_PK);
  for (const acct of data) {
    if (acct.account.data.length !== GSO_STATE_SIZE) {
      continue;
    }
    const {
      soName,
      stakingOptionsState,
      subscriptionPeriodEnd,
      strike,
      lockupRatioTokensPerMillion,
      baseMint,
    } = parseGsoState(acct.account.data);
    if (soName !== name) {
      continue;
    }
    const lockupRatio = lockupRatioTokensPerMillion / 1000000;
    const stakeTimeRemainingMs = subscriptionPeriodEnd * 1000 - Date.now();

    // TODO: Unroll these and cache the fetches to improve page load.
    const soState: SOState = (await stakingOptions.getState(
      `GSO${soName}`,
      baseMint
    )) as unknown as SOState;
    const { lotSize, quoteMint, optionExpiration } = soState;
    const tokenJson = await fetchTokenMetadata(connection, baseMint);

    // TODO: Cache mint decimals to avoid load on RPC provider.
    const baseDecimals = (await fetchMint(connection, baseMint)).decimals;
    const quoteDecimals = (await fetchMint(connection, quoteMint)).decimals;

    const timeLeft = msToTimeLeft(stakeTimeRemainingMs);

    // Reversing this computation.
    // const strikeAtomsPerLot = strike * lotSize * 10 ** (quoteDecimals - baseDecimals);
    const strikeInUSD =
      (strike / (10 ** quoteDecimals * lotSize)) * 10 ** baseDecimals;

    const gsoParams: GsoParams = {
      soName,
      lockupRatio,
      lotSize,
      expiration: new Date(optionExpiration * 1000).toLocaleDateString(),
      expirationInt: optionExpiration,
      subscription: timeLeft,
      subscriptionInt: subscriptionPeriodEnd,
      base: baseMint,
      baseAtoms: baseDecimals,
      strike: strikeInUSD,
      gsoStatePk: acct.pubkey,
      soStatePk: stakingOptionsState,
      metadata: tokenJson,
    };
    return gsoParams;
  }
}
