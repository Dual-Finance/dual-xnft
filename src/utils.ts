import { Connection, PublicKey } from "@solana/web3.js";

export function parseNumber(str: string, precision: number) {
  const inputStr = str;
  if (
    !Number.isNaN(parseFloat(inputStr)) ||
    inputStr === "." ||
    inputStr === ""
  ) {
    return str;
  }
  if (parseFloat(inputStr) < 0) {
    return "0"
  }
  const numberSegments = inputStr.split(".");
  if (numberSegments.length !== 2) {
    return;
  }
  const maxTokenDecimals = precision.toString().length - 1;
  const inputDecimals = numberSegments[1].length;
  const decimals = Math.min(inputDecimals, maxTokenDecimals);
  const sanitizedValue = Number(
    Math.floor(parseFloat(inputStr) * 10 ** decimals) / 10 ** decimals
  ).toFixed(decimals);
  return sanitizedValue;
}

export const prettyFormatPrice = (price: number, decimals = 4): string => {
  return `$${(price >= 0.1 ? price.toFixed(2) : price.toFixed(decimals)).replace(/\d(?=(\d{3})+\.)/g, '$&,')}`;
};

export function getConnection() {
  return new Connection(import.meta.env.VITE_RPC_URL_MAINNET, "confirmed");
}

export function msToTimeLeft(duration: number) {
  const minutes = Math.floor((duration / (1000 * 60)) % 60);
  const hours = Math.floor((duration / (1000 * 60 * 60)) % 24);
  const days = Math.floor(duration / (1000 * 60 * 60 * 24));
  return `${days}d ${hours}h ${minutes}m`;
}

export function readBigUInt64LE(buffer: Buffer, offset = 0) {
  const first = buffer[offset];
  const last = buffer[offset + 7];
  if (first === undefined || last === undefined) {
    throw new Error();
  }
  const lo =
    first +
    buffer[++offset] * 2 ** 8 +
    buffer[++offset] * 2 ** 16 +
    buffer[++offset] * 2 ** 24;
  const hi =
    buffer[++offset] +
    buffer[++offset] * 2 ** 8 +
    buffer[++offset] * 2 ** 16 +
    last * 2 ** 24;
  return BigInt(lo) + (BigInt(hi) << BigInt(32));
}

export function parseGsoState(buf: Buffer) {
  const periodNum = Number(readBigUInt64LE(buf, 8));
  const subscriptionPeriodEnd = Number(readBigUInt64LE(buf, 16));
  const lockupRatioTokensPerMillion = Number(readBigUInt64LE(buf, 24));
  const gsoStateBump = Number(buf.readUInt8(32));
  const soAuthorityBump = Number(buf.readUInt8(33));
  const xBaseMintBump = Number(buf.readUInt8(34));
  const baseVaultBump = Number(buf.readUInt8(35));
  const strike = Number(readBigUInt64LE(buf, 36));
  const soNameLengthBytes = Number(buf.readUInt8(44));
  const soName = String.fromCharCode.apply(
    String,
    // @ts-ignore
    buf.slice(48, 48 + soNameLengthBytes)
  );
  const soStateOffset = 48 + soNameLengthBytes;
  const stakingOptionsState = new PublicKey(
    buf.slice(soStateOffset, soStateOffset + 32)
  );
  const authority = new PublicKey(
    buf.slice(soStateOffset + 32, soStateOffset + 32 + 32)
  );
  const baseMint = new PublicKey(
    buf.slice(soStateOffset + 64, soStateOffset + 64 + 32)
  );
  // if (baseMint.toBase58() === '11111111111111111111111111111111') {
  //   // Backwards compatibility hack.
  //   baseMint = bonkMintPk;
  // }
  let lockupPeriodEnd = Number(
    readBigUInt64LE(buf.slice(soStateOffset + 96, soStateOffset + 96 + 32))
  );
  if (lockupPeriodEnd === 0) {
    // Backwards compatibility hack for subscription period
    lockupPeriodEnd = subscriptionPeriodEnd;
  }
  return {
    periodNum,
    subscriptionPeriodEnd,
    lockupRatioTokensPerMillion,
    gsoStateBump,
    soAuthorityBump,
    xBaseMintBump,
    baseVaultBump,
    strike,
    soNameLengthBytes,
    soName,
    stakingOptionsState,
    authority,
    baseMint,
    lockupPeriodEnd,
  };
}
