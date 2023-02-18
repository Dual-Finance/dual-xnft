import { web3 } from "@project-serum/anchor";
import { WalletContextState } from "@solana/wallet-adapter-react";
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
import { GsoParams } from "../types";

export async function stakeGso(
  { soName, base, gsoStatePk }: GsoParams,
  amount: number,
  connection: Connection,
  wallet: WalletContextState
) {
  const { publicKey } = wallet;
  if (!publicKey) {
    return;
  }
  try {
    const gso = new GSO(connection.rpcEndpoint);
    const so = new StakingOptions(connection.rpcEndpoint);
    const userBaseAccount = await getAssociatedTokenAddress(base, publicKey);
    const transaction = new web3.Transaction();

    // TODO: Move the init token accounts into the SDK
    const soState = await so.getState("GSO" + soName, base);
    const optionMint = await so.soMint(
      // @ts-ignore
      soState.strikes[0],
      "GSO" + soName,
      base
    );
    const userOptionAccount = await getAssociatedTokenAddress(
      optionMint,
      publicKey
    );
    if (!(await connection.getAccountInfo(userOptionAccount))) {
      transaction.add(
        createAssociatedTokenAccountInstr(
          userOptionAccount,
          optionMint,
          publicKey,
          publicKey
        )
      );
    }
    const xBaseMint = await gso.xBaseMint(gsoStatePk);
    const userXBaseMintAccount = await getAssociatedTokenAddress(
      xBaseMint,
      publicKey
    );
    if (!(await connection.getAccountInfo(userXBaseMintAccount))) {
      transaction.add(
        createAssociatedTokenAccountInstr(
          userXBaseMintAccount,
          xBaseMint,
          publicKey,
          publicKey
        )
      );
    }
    const stakeInstruction = await gso.createStakeInstruction(
      amount,
      soName,
      publicKey,
      base,
      userBaseAccount
    );
    transaction.add(stakeInstruction);
    // @ts-ignore
    const signature = await wallet.sendAndConfirm(transaction);

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
