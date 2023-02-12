import { useEffect, useState } from "react";
import { PublicKey } from "@solana/web3.js";
import { getMint } from "@solana/spl-token";
import { useConnection } from "@solana/wallet-adapter-react";
import { Metadata, PROGRAM_ID } from "@metaplex-foundation/mpl-token-metadata";
import { StakingOptions } from "@dual-finance/staking-options";

import { GSO_PROGRAM_ID, GSO_STATE_SIZE } from "../config";
import { SOState } from "../types";
import { msToTimeLeft, parseGsoState } from "../utils";

export default function useGso() {
  const { connection } = useConnection();
  const [gso, setGso] = useState<GsoParams[]>([]);

  useEffect(() => {
    const stakingOptions = new StakingOptions(connection.rpcEndpoint);
    if (connection) {
      connection
        .getProgramAccounts(new PublicKey(GSO_PROGRAM_ID), "confirmed")
        .then(async (data) => {
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
            const stakeTimeRemainingMs =
              subscriptionPeriodEnd * 1000 - Date.now();
            const isTesting =
              soName.toLowerCase().includes("test") ||
              soName.toLowerCase().includes("trial");
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
            const pda = await getMetadataPDA(baseMint);
            const metadata = await Metadata.fromAccountAddress(connection, pda);
            const tokenJson = await getTokenMetadata(metadata.data.uri.replace(/\0.*$/g,''));

            // TODO: Cache mint decimals to avoid load on RPC provider.
            const baseDecimals = (await getMint(connection, baseMint)).decimals;
            const quoteDecimals = (await getMint(connection, quoteMint))
              .decimals;

            const timeLeft = msToTimeLeft(stakeTimeRemainingMs);

            // Reversing this computation.
            // const strikeAtomsPerLot = strike * lotSize * 10 ** (quoteDecimals - baseDecimals);
            const strikeInUSD =
              (strike / (10 ** quoteDecimals * lotSize)) * 10 ** baseDecimals;

            const gsoParams: GsoParams = {
              soName,
              lockupRatio,
              expiration: new Date(
                optionExpiration * 1000
              ).toLocaleDateString(),
              expirationInt: optionExpiration,
              subscription: timeLeft,
              subscriptionInt: subscriptionPeriodEnd,
              base: baseMint,
              strike: strikeInUSD,
              gsoStatePk: acct.pubkey,
              soStatePk: stakingOptionsState,
              metadata: tokenJson,
            };
            allGsoParams.push(gsoParams);
          }
          setGso(allGsoParams);
        })
        .catch((error) => {
          console.log(error);
        });
    }
  }, [connection]);

  return { gso };
}

async function getMetadataPDA(mint: PublicKey) {
  const [publicKey] = PublicKey.findProgramAddressSync(
    [Buffer.from("metadata"), PROGRAM_ID.toBuffer(), mint.toBuffer()],
    PROGRAM_ID
  );
  return publicKey;
}

async function getTokenMetadata(uri: string) {
  const data = await fetch(uri)
  const json = await data.json()
  return json;
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
  metadata: any;
}
