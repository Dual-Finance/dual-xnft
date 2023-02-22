import { useConnection } from "@solana/wallet-adapter-react";
import { useQuery } from "@tanstack/react-query";
import { Suspense, useCallback, useMemo, useState } from "react";
import {
  Await,
  defer,
  useLoaderData,
  useNavigate,
  useParams,
} from "react-router-dom";
import { queryClient } from "../client";
import { Button } from "../components/Button";
import { Card } from "../components/Card";
import { CardLight } from "../components/CardLight";
import { Loading } from "../components/Loading";
import { TokenInput } from "../components/TokenInput";
import { fetchGsoDetails } from "../hooks/useGso";
import useTokenBalance from "../hooks/useTokenBalance";
import { useWallet } from "../hooks/useWallet";
import { GsoParams } from "../types";
import { stakeGso, getConnection } from "../core";
import { parseNumber, prettyFormatPrice } from "../utils";

type LoaderParams = {
  params: {
    name?: string;
  };
};

export async function loader({ params }: LoaderParams) {
  if (!params.name) {
    throw new Response("Bad Request", { status: 400 });
  }
  return defer({
    gsoDetails: queryClient.fetchQuery({
      queryKey: ["gso", params.name],
      queryFn: () => fetchGsoDetails(getConnection(), params.name),
    }),
  });
}

export function GsoPage() {
  const data = useLoaderData() as any;
  return (
    <div className="h-full">
      <Suspense fallback={<Loading />}>
        <Await resolve={data.gsoDetails}>
          <GsoDetails />
        </Await>
      </Suspense>
    </div>
  );
}

function GsoDetails() {
  const navigate = useNavigate();
  const { name } = useParams();
  const { connection } = useConnection();
  const { data: gsoDetails } = useQuery<GsoParams>({
    queryKey: ["gso", name],
  });

  const [stakeValue, setStakeValue] = useState("");
  const wallet = useWallet();
  const handleStakeClick = useCallback(async () => {
    if (!connection || !gsoDetails || !wallet) {
      return;
    }

    const amount = Number(stakeValue) * 10 ** gsoDetails.baseAtoms;
    try {
      const signature = await stakeGso(gsoDetails, amount, connection, wallet);
      console.info("signature:", signature);
      await queryClient.invalidateQueries(["balance/so", wallet.publicKey]);
      navigate("/balance");
    } catch (err) {
      console.error(err);
    }
  }, [gsoDetails, stakeValue, connection, wallet, name]);

  const tokenBalance = useTokenBalance(gsoDetails?.base.toBase58());
  const handleMaxClick = useCallback(() => {
    if (tokenBalance) {
      setStakeValue(Math.floor(tokenBalance).toString());
    }
  }, [tokenBalance]);
  const gsoAmount = useMemo(() => {
    if (stakeValue && gsoDetails) {
      return Number(
        Math.floor(parseFloat(stakeValue) * gsoDetails.lockupRatio)
      );
    }
    return 0;
  }, [stakeValue, gsoDetails]);
  const isDisabled = useMemo(() => {
    const value = parseFloat(stakeValue);
    if (!tokenBalance || !value || value > tokenBalance) {
      return true;
    }
    return false;
  }, [stakeValue, tokenBalance]);
  const { symbol, image } = gsoDetails?.metadata;
  // const stakedToken = symbol.toUpperCase();
  // const startDate = gsoDetails?.expirationInt
  //   ? new Date(gsoDetails.expirationInt * 1000).toISOString().slice(0, 10)
  //   : "<expiration>";
  // const tokenName = `${stakedToken || "<token>"}-${startDate}@${
  //   gsoDetails?.strike
  // }`;
  return (
    <div className="flex flex-col gap-2">
      {gsoDetails && (
        <>
          <Card>
            <div className="flex items-center text-left gap-4">
              <img src={image} className="w-20 h-20" />
              <div className="flex-1 text-md border-l-gray-500 border-l-2 pl-4">
                <h2 className="text-lg font-bold">{gsoDetails.soName}</h2>
                <p>Stake: {symbol.toUpperCase()}</p>
                <p>Strike: {prettyFormatPrice(gsoDetails.strike, 8)}</p>
                <p>Expires: {gsoDetails.expiration}</p>
                <p>Lockup Ratio: {1 / gsoDetails.lockupRatio}:1</p>
              </div>
            </div>
          </Card>
          <Card className="flex flex-col gap-2 bg-[#05040d]">
            <TokenInput
              placeholder="0.0"
              step={1 / 10 ** gsoDetails.baseAtoms}
              min={0}
              max={tokenBalance}
              token={{ symbol, image }}
              onChange={(event) => {
                setStakeValue(
                  parseNumber(event.target.value, gsoDetails.baseAtoms)
                );
              }}
              value={stakeValue}
              onMaxClick={handleMaxClick}
            />
            <CardLight>
              <div className="flex justify-center">
                <span className="text-[#44ea99] text-lg">
                  Earn:{" "}
                  <span className="text-white">
                    {gsoAmount} Staking Options
                  </span>
                </span>
              </div>
            </CardLight>

            <Button onClick={handleStakeClick} disabled={isDisabled}>
              Stake {symbol.toUpperCase()}
            </Button>
          </Card>
        </>
      )}
    </div>
  );
}
