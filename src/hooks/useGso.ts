import { useEffect, useState } from "react";
import { Connection } from "@solana/web3.js";
import { useConnection } from "@solana/wallet-adapter-react";
import { StakingOptions } from "@dual-finance/staking-options";
import { GSO } from "@dual-finance/gso";

import { GsoParams } from "../types";
import { fetchMint, fetchTokenMetadata } from "../core";
import { convertUnixTimestamp, msToTimeLeft } from "../utils";
import { PK_TO_ASSET } from "../config";

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
  const gsoClient = new GSO(connection.rpcEndpoint);
  const stakingOptions = new StakingOptions(connection.rpcEndpoint);
  const gsos = await gsoClient.getGsos();
  const params: GsoParams[] = await Promise.all(
    gsos
      .filter(({ projectName }) => {
        const isTesting = projectName === "DUAL-Lockup-1";
        return !isTesting;
      })
      .map(async (gsoParam) => {
        const {
          projectName,
          lockupRatioTokensPerMillion,
          subscriptionPeriodEnd,
          optionExpiration,
          baseMint,
          quoteMint,
          strike,
          lotSize,
        } = gsoParam;
        const lockupRatio = lockupRatioTokensPerMillion / 1000000;
        const stakeTimeRemainingMs = subscriptionPeriodEnd * 1000 - Date.now();
        const timeLeft = msToTimeLeft(stakeTimeRemainingMs);

        const [tokenJson, baseToken, quoteToken, optionMint] =
          await Promise.all([
            fetchTokenMetadata(connection, baseMint),
            fetchMint(connection, baseMint),
            fetchMint(connection, quoteMint),
            stakingOptions.soMint(strike, "GSO" + projectName, baseMint),
          ]);

        const strikeInUSD =
          (strike / (10 ** quoteToken.decimals * lotSize)) *
          10 ** baseToken.decimals;
        return {
          lockupRatio,
          lotSize: gsoParam.lotSize,
          soName: projectName,
          subscription: timeLeft,
          subscriptionInt: subscriptionPeriodEnd,
          expiration: convertUnixTimestamp(optionExpiration),
          expirationInt: optionExpiration,
          strike: strikeInUSD,
          base: baseMint,
          baseAtoms: baseToken.decimals,
          option: optionMint,
          gsoStatePk: gsoParam.gsoStatePk,
          soStatePk: gsoParam.stakingOptionsState,
          metadata: {
            image: "",
            symbol: PK_TO_ASSET[baseMint.toString()],
            ...tokenJson,
          },
        };
      })
  );
  return params;
}

export async function fetchGsoDetails(connection: Connection, name?: string) {
  if (!name) return;
  const gsos = await fetchGso(connection);
  const gso = gsos.find((gso) => gso.soName === name);
  return gso;
}
