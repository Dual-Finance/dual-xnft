import { useConnection } from "@solana/wallet-adapter-react";
import { useQuery } from "@tanstack/react-query";
import { ChangeEvent, Suspense, useCallback, useState } from "react";
import { Await, defer, useLoaderData, useParams } from "react-router-dom";
import { queryClient } from "../client";
import { Button } from "../components/Button";
import { Card } from "../components/Card";
import { Loading } from "../components/Loading";
import { TokenInput } from "../components/TokenInput";
import { fetchGsoBalanceDetails } from "../hooks/useGsoBalance";
import { useWallet } from "../hooks/useWallet";
import { unstakeGSO, getConnection } from "../core";
import { GsoBalanceParams } from "../types";
import { parseNumber } from "../utils";

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
    gsoBalanceDetails: queryClient.fetchQuery({
      queryKey: [
        "balance/gso",
        window.xnft.solana.publicKey.toBase58(),
        params.name,
      ],
      queryFn: () =>
        fetchGsoBalanceDetails(
          getConnection(),
          window.xnft.solana.publicKey,
          params.name
        ),
    }),
  });
}

export function GsoBalancePage() {
  const data = useLoaderData() as any;
  return (
    <div className="h-full">
      <Suspense fallback={<Loading />}>
        <Await resolve={data.gsoBalanceDetails}>
          <BalanceDetails />
        </Await>
      </Suspense>
    </div>
  );
}

function BalanceDetails() {
  const { name } = useParams();
  const wallet = useWallet();
  const { data: gsoBalanceDetails } = useQuery<GsoBalanceParams>({
    queryKey: ["balance/gso", wallet.publicKey.toBase58(), name],
  });
  const { connection } = useConnection();

  const [stakeValue, setStakeValue] = useState("");
  const handleStakeClick = useCallback(() => {
    if (!connection || !wallet || !gsoBalanceDetails) {
      return;
    }

    const amount = Number(
      parseFloat(stakeValue) * 10 ** gsoBalanceDetails.baseAtoms
    );
    unstakeGSO(gsoBalanceDetails, amount, connection, wallet)
      .then((signature) => {
        console.log("signature:", signature);
      })
      .catch(console.error);
  }, [gsoBalanceDetails, stakeValue, connection, wallet]);

  if (!gsoBalanceDetails) return null;

  const { symbol, image } = gsoBalanceDetails.metadata;
  const onMaxClick = () => {
    setStakeValue(gsoBalanceDetails.numTokens.toString());
  };
  return (
    <div className="flex flex-col gap-2">
      {gsoBalanceDetails && (
        <>
          <Card>
            <div className="flex items-center text-left gap-4">
              <img src={image} className="w-20 h-20" />
              <div className="flex-1 text-md border-l-gray-500 border-l-2 pl-4">
                <h2 className="text-lg font-bold">
                  {gsoBalanceDetails.soName}
                </h2>
                <p>
                  Collateral: {gsoBalanceDetails.numTokens}{" "}
                  {symbol?.toUpperCase()}
                </p>
                <p>Expires: {gsoBalanceDetails.expiration}</p>
              </div>
            </div>
          </Card>
          <Card className="flex flex-col gap-2 bg-[#05040d]">
            <TokenInput
              type="number"
              step={1 / 10 ** gsoBalanceDetails.baseAtoms}
              min={0}
              max={gsoBalanceDetails.numTokens}
              placeholder="0.0"
              token={gsoBalanceDetails.metadata}
              onChange={(event: ChangeEvent<HTMLInputElement>) => {
                const inputStr = event.target.value;
                setStakeValue(
                  parseNumber(inputStr, gsoBalanceDetails.baseAtoms)
                );
              }}
              value={stakeValue}
              onMaxClick={onMaxClick}
            />

            <Button onClick={handleStakeClick}>Withdraw</Button>
          </Card>
        </>
      )}
    </div>
  );
}
