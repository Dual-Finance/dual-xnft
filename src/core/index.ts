import { BN, web3 } from "@project-serum/anchor";
import { WalletContextState } from "@solana/wallet-adapter-react";
import {
  Connection,
  PublicKey,
  SystemProgram,
  Transaction,
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
import { GsoBalanceParams, GsoParams } from "../types";

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

export async function unstakeGSO(
  { soName, base }: GsoBalanceParams,
  amount: number,
  connection: Connection,
  wallet: WalletContextState
) {
  if (!wallet.publicKey) {
    return;
  }
  try {
    const gso = new GSO(connection.rpcEndpoint);
    let transaction = new web3.Transaction();

    const userBaseAccount = await getAssociatedTokenAddress(
      base,
      wallet.publicKey
    );
    // Required since SDK uses getAccount() & user may have burned account
    await checkBurnedAccount(
      transaction,
      connection,
      userBaseAccount,
      base,
      wallet.publicKey
    );
    const unstakeInstruction = await gso.createUnstakeInstruction(
      amount,
      soName,
      wallet.publicKey,
      userBaseAccount
    );

    transaction.add(unstakeInstruction);

    // TODO: Enable once figured out why not all of the amount got unstaked.
    // const gsoState = await gso.state(soName);
    // const xBaseMint = await gso.xBaseMint(gsoState);
    // const userXTokenAccount = await getAssociatedTokenAddress(xBaseMint, provider.publicKey);
    // transaction.add(createCloseAccountInstruction(userXTokenAccount, provider.publicKey, provider.publicKey));

    // @ts-ignore
    const signature = await wallet.sendAndConfirm(transaction);

    return signature;
  } catch (err) {
    console.error(err);
  }
}

export async function exerciseSO(
  { gsoName, base, quote }: GsoBalanceParams,
  amount: number,
  connection: Connection,
  provider: WalletContextState,
  _swapQty?: number
) {
  if (!provider.publicKey) return;
  try {
    const so = new StakingOptions(connection.rpcEndpoint);
    const soStateObj = await so.getState(gsoName, base);
    // @ts-ignore
    const strikeState = soStateObj.strikes[0];
    const strikeAtomsPerLot = new BN(strikeState);
    const authority = provider.publicKey;
    // @ts-ignore
    const optionMint = await so.soMint(strikeAtomsPerLot, gsoName, base);
    const userSoAccount = await getAssociatedTokenAddress(
      optionMint,
      provider.publicKey
    );
    const userQuoteAccount = await getAssociatedTokenAddress(
      quote,
      provider.publicKey
    );
    const userBaseAccount = await getAssociatedTokenAddress(
      base,
      provider.publicKey
    );
    // Required since SDK uses getAccount() & user may have burned account
    const transactionExercise = new web3.Transaction();
    await checkBurnedAccount(
      transactionExercise,
      connection,
      userBaseAccount,
      base,
      provider.publicKey
    );
    const exerciseInstruction = await so.createExerciseInstruction(
      new BN(amount),
      strikeAtomsPerLot,
      gsoName,
      authority,
      userSoAccount,
      userQuoteAccount,
      userBaseAccount
    );
    transactionExercise.add(exerciseInstruction);
    // @ts-ignore
    const signature = await provider.sendAndConfirm(transactionExercise);
    return signature;
  } catch (err) {
    console.log(err);
  }
}

async function checkBurnedAccount(
  tx: Transaction,
  connection: Connection,
  userAccount: PublicKey,
  mint: PublicKey,
  publicKey: PublicKey
) {
  if (!(await connection.getAccountInfo(userAccount))) {
    const createAccnt = createAssociatedTokenAccountInstr(
      userAccount,
      mint,
      publicKey,
      publicKey
    );
    tx.add(createAccnt);
  }
}

function createAssociatedTokenAccountInstr(
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
