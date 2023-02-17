import { useEffect, useState } from "react";
import { Connection, PublicKey } from "@solana/web3.js";
import {
  useConnection,
  useWallet,
  WalletContextState,
} from "@solana/wallet-adapter-react";
import { getAssociatedTokenAddress } from "@solana/spl-token";
import { GSO } from "@dual-finance/gso";
import { GSO_PROGRAM_ID, GSO_STATE_SIZE } from "../config";
import { getMultipleTokenAccounts, parseGsoState } from "../utils";

export default function useGsoBalance() {
  const { connection } = useConnection();
  const wallet = useWallet();

  const [gso, setGso] = useState<any[]>([]);

  useEffect(() => {
    fetchGsoBalance(connection, wallet)
      .then((data) => {
        if (data) {
          setGso(data);
        }
      })
      .catch(console.error);
  }, [connection, wallet]);

  return { gso };
}

export async function fetchGsoBalance(
  connection: Connection,
  provider: WalletContextState
) {
  if (!provider.publicKey) {
    return;
  }
  // Fetch all program accounts for SO
  const data = await connection.getProgramAccounts(new PublicKey(GSO_PROGRAM_ID));
  const allGsoParams = [];

  const gsoHelper = new GSO(connection.rpcEndpoint);

  const allTokenAccounts: string[] = [];
  const states = data.filter((item) => {
    return item.account.data.length === GSO_STATE_SIZE;
  });
  for (const acct of states) {
    const xBaseMint: PublicKey = await gsoHelper.xBaseMint(acct.pubkey);
    const tokenAddress = await getAssociatedTokenAddress(
      xBaseMint,
      provider.publicKey
    );
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
    const numTokens =
      tokenAccounts.array[i].data.parsed.info.tokenAmount.amount /
      10 **
        Number(tokenAccounts.array[i].data.parsed.info.tokenAmount.decimals);

    if (numTokens === 0) {
      continue;
    }

    try {
      // TODO: Rename this function as it does more than just DIPs
      const dipParams = {
        soName,
        numTokens,
        lotSize: 10 ** 6, // lotSize
        baseTokensPerAtom: 10 ** 6, // baseAtoms
        expiration: new Date(lockupPeriodEnd * 1_000).toLocaleDateString(),
        expirationInt: lockupPeriodEnd,
        strike,
        // Allow for SO State to be closed
        soStatePk: acct.pubkey,
        base: baseMint,
      };
      allGsoParams.push(dipParams);
    } catch (err) {
      console.log("Unable to create balance entry for", soName);
    }
    return allGsoParams;
  }
}
