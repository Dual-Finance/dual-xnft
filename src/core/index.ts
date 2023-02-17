import { web3 } from "@project-serum/anchor";
import {
  Connection,
  PublicKey,
  SystemProgram,
  TransactionInstruction,
  SYSVAR_RENT_PUBKEY,
} from "@solana/web3.js";
import {
  getAssociatedTokenAddress,
  ASSOCIATED_TOKEN_PROGRAM_ID,
  TOKEN_PROGRAM_ID,
} from "@solana/spl-token";
import { StakingOptions } from "@dual-finance/staking-options";
import { GSO } from "@dual-finance/gso";
import { WalletContextState } from "@solana/wallet-adapter-react";
import { GsoParams } from "../types";

export async function stakeGso(
  { soName, base, gsoStatePk }: GsoParams,
  amount: number,
  connection: Connection,
  provider: WalletContextState
) {
  if (!provider.publicKey) {
    return;
  }
  console.log(soName, base.toBase58());
  try {
    const gso = new GSO(connection.rpcEndpoint);
    const so = new StakingOptions(connection.rpcEndpoint);
    const userBaseAccount = await getAssociatedTokenAddress(
      base,
      provider.publicKey
    );
    const transaction = new web3.Transaction();

    // TODO: Move the init token accounts into the SDK
    const soState = await so.getState("GSO" + soName, base);
    console.log(soState);
    const optionMint = await so.soMint(
      // @ts-ignore
      soState.strikes[0],
      "GSO" + soName,
      base
    );
    const userOptionAccount = await getAssociatedTokenAddress(
      optionMint,
      provider.publicKey
    );
    if (!(await connection.getAccountInfo(userOptionAccount))) {
      transaction.add(
        createAssociatedTokenAccountInstr(
          userOptionAccount,
          optionMint,
          provider.publicKey,
          provider.publicKey
        )
      );
    }
    const xBaseMint = await gso.xBaseMint(gsoStatePk);
    const userXBaseMintAccount = await getAssociatedTokenAddress(
      xBaseMint,
      provider.publicKey
    );
    if (!(await connection.getAccountInfo(userXBaseMintAccount))) {
      transaction.add(
        createAssociatedTokenAccountInstr(
          userXBaseMintAccount,
          xBaseMint,
          provider.publicKey,
          provider.publicKey
        )
      );
    }
    const stakeInstruction = await gso.createStakeInstruction(
      amount,
      soName,
      provider.publicKey,
      base,
      userBaseAccount
    );
    transaction.add(stakeInstruction);
    const {
      context: { slot: minContextSlot },
      value: { blockhash, lastValidBlockHeight },
    } = await connection.getLatestBlockhashAndContext();
    console.log(minContextSlot, blockhash, lastValidBlockHeight);
    console.log(transaction);
    const signature = await provider.sendTransaction(transaction, connection, {
      minContextSlot,
    });
    await connection.confirmTransaction({
      blockhash,
      lastValidBlockHeight,
      signature,
    });
    return signature;
  } catch (err) {
    console.error(err);
  }
}

export function createAssociatedTokenAccountInstr(
  pubKey: PublicKey,
  mint: PublicKey,
  owner: PublicKey,
  payer: PublicKey
) {
  const data = Buffer.alloc(0);
  const keys = [
    {
      pubkey: payer,
      isSigner: true,
      isWritable: true,
    },
    {
      pubkey: pubKey,
      isSigner: false,
      isWritable: true,
    },
    {
      pubkey: owner,
      isSigner: false,
      isWritable: false,
    },
    {
      pubkey: mint,
      isSigner: false,
      isWritable: false,
    },
    {
      pubkey: SystemProgram.programId,
      isSigner: false,
      isWritable: false,
    },
    {
      pubkey: TOKEN_PROGRAM_ID,
      isSigner: false,
      isWritable: false,
    },
    {
      pubkey: SYSVAR_RENT_PUBKEY,
      isSigner: false,
      isWritable: false,
    },
  ];
  const instr = new TransactionInstruction({
    keys,
    programId: ASSOCIATED_TOKEN_PROGRAM_ID,
    data,
  });
  return instr;
}
