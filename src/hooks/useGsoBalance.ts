import { useEffect, useState } from "react";
import { Connection, PublicKey } from "@solana/web3.js";
import { useConnection, useWallet } from "@solana/wallet-adapter-react";
import { getAssociatedTokenAddress, getMint } from "@solana/spl-token";
import { GSO } from "@dual-finance/gso";
import { GSO_PROGRAM_ID, GSO_STATE_SIZE } from "../config";
import { getMultipleTokenAccounts, parseGsoState } from "../utils";
import { StakingOptions } from "@dual-finance/staking-options";
import { GsoBalanceParams, SOState } from "../types";
import { Metadata, PROGRAM_ID } from "@metaplex-foundation/mpl-token-metadata";

export default function useGsoBalance() {
  const { connection } = useConnection();
  const { publicKey } = useWallet();

  const [gso, setGso] = useState<GsoBalanceParams[]>([]);

  useEffect(() => {
    fetchGsoBalance(connection, publicKey)
      .then((data) => {
        if (data) {
          setGso(data);
        }
      })
      .catch(console.error);
  }, [connection, publicKey]);

  return { gso };
}

export async function fetchGsoBalance(
  connection: Connection,
  publicKey: PublicKey | null
) {
  if (!publicKey) {
    return;
  }
  // Fetch all program accounts for SO
  const data = await connection.getProgramAccounts(
    new PublicKey(GSO_PROGRAM_ID)
  );
  const allBalanceParams = [];

  const gsoHelper = new GSO(connection.rpcEndpoint);
  const stakingOptions = new StakingOptions(connection.rpcEndpoint);

  const allTokenAccounts: string[] = [];
  const states = data.filter((item) => {
    return item.account.data.length === GSO_STATE_SIZE;
  });
  for (const acct of states) {
    const xBaseMint: PublicKey = await gsoHelper.xBaseMint(acct.pubkey);
    const tokenAddress = await getAssociatedTokenAddress(xBaseMint, publicKey);
    allTokenAccounts.push(tokenAddress.toBase58());
  }

  const tokenAccounts = await getMultipleTokenAccounts(
    connection,
    allTokenAccounts,
    "single"
  );
  for (let i = 0; i < tokenAccounts.array.length; ++i) {
    if (!tokenAccounts.array[i]) {
      continue;
    }
    const acct = states[i];
    const { soName, baseMint, lockupPeriodEnd, strike } = parseGsoState(
      acct.account.data
    );
    const gsoName = `GSO${soName}`;
    const { lotSize, quoteMint, strikes }: SOState =
      (await stakingOptions.getState(gsoName, baseMint)) as unknown as SOState;
    const pda = await getMetadataPDA(baseMint);
    const metadata = await Metadata.fromAccountAddress(connection, pda);
    const tokenJson = await getTokenMetadata(
      metadata.data.uri.replace(/\0.*$/g, "")
    );
    const baseAtoms = (await getMint(connection, baseMint)).decimals;
    const quoteAtoms = (await getMint(connection, quoteMint)).decimals;
    const strikeInUSD =
      (strike / (10 ** quoteAtoms * lotSize)) * 10 ** baseAtoms;
    const optionMint = await stakingOptions.soMint(
      strikes[0],
      gsoName,
      baseMint
    );
    const optionPda = await getMetadataPDA(optionMint);
    const optionMetadata = await Metadata.fromAccountAddress(
      connection,
      optionPda
    );
    const optionJson = await getTokenMetadata(
      optionMetadata.data.uri.replace(/\0.*$/g, "")
    );
    const numTokens =
      tokenAccounts.array[i].data.parsed.info.tokenAmount.amount /
      10 **
        Number(tokenAccounts.array[i].data.parsed.info.tokenAmount.decimals);

    if (numTokens === 0) {
      continue;
    }

    try {
      const balanceParams: GsoBalanceParams = {
        soName,
        numTokens,
        lotSize,
        baseAtoms,
        quoteAtoms,
        expiration: new Date(lockupPeriodEnd * 1_000).toLocaleDateString(),
        expirationInt: lockupPeriodEnd,
        strike: strikeInUSD,
        // Allow for SO State to be closed
        soStatePk: acct.pubkey,
        base: baseMint,
        quote: quoteMint,
        option: optionMint,
        metadata: tokenJson,
        optionMetadata: { symbol: gsoName, ...optionJson },
      };
      allBalanceParams.push(balanceParams);
    } catch (error) {
      console.error(error);
    }
  }
  return allBalanceParams;
}

export async function fetchGsoBalanceDetails(
  connection: Connection,
  publicKey: PublicKey,
  name?: string
) {
  const balanceParams = await fetchGsoBalance(connection, publicKey);
  if (balanceParams) {
    return balanceParams.find((p) => p.soName === name);
  }
}

async function getMetadataPDA(mint: PublicKey) {
  const [publicKey] = PublicKey.findProgramAddressSync(
    [Buffer.from("metadata"), PROGRAM_ID.toBuffer(), mint.toBuffer()],
    PROGRAM_ID
  );
  return publicKey;
}

async function getTokenMetadata(uri: string) {
  const data = await fetch(uri);
  const json = await data.json();
  return json;
}
