import { useConnection } from "@solana/wallet-adapter-react";
import { useQuery } from "@tanstack/react-query";
import { ChangeEvent, Suspense, useCallback, useState } from "react";
import { Await, defer, useLoaderData, useParams } from "react-router-dom";
import { queryClient } from "../client";
import { Button } from "../components/Button";
import { Card } from "../components/Card";
import { Loading } from "../components/Loading";
import { TokenInput } from "../components/TokenInput";
import { fetchStakingOptionBalanceDetails } from "../hooks/useStakingOptionsBalance";
import { useWallet } from "../hooks/useWallet";
import { SoBalanceParams } from "../types";
import { exerciseSO, getConnection } from "../core";
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
    soBalanceDetails: queryClient.fetchQuery({
      queryKey: [
        "balance/so",
        window.xnft.solana.publicKey.toBase58(),
        params.name,
      ],
      queryFn: () =>
        fetchStakingOptionBalanceDetails(
          getConnection(),
          window.xnft.solana.publicKey,
          params.name
        ),
    }),
  });
}

export function StakingOptionBalancePage() {
  const data = useLoaderData() as any;
  return (
    <div className="h-full">
      <Suspense fallback={<Loading />}>
        <Await resolve={data.soBalanceDetails}>
          <BalanceDetails />
        </Await>
      </Suspense>
    </div>
  );
}

function BalanceDetails() {
  const { name } = useParams();
  const wallet = useWallet();
  const { data: soBalanceDetails } = useQuery<SoBalanceParams>({
    queryKey: ["balance/so", wallet.publicKey.toBase58(), name],
  });
  const { connection } = useConnection();

  const [stakeValue, setStakeValue] = useState("");
  const handleStakeClick = useCallback(() => {
    if (!connection || !wallet || !soBalanceDetails) {
      return;
    }

    const amount = Number(parseFloat(stakeValue));
    exerciseSO(soBalanceDetails, amount, connection, wallet)
      .then((signature) => {
        console.log("signature:", signature);
      })
      .catch(console.error);
  }, [soBalanceDetails, stakeValue, connection, wallet]);

  if (!soBalanceDetails) return null;

  const { symbol, image } = soBalanceDetails.metadata;
  const onMaxClick = () => {
    setStakeValue(soBalanceDetails.numTokens.toString());
  };
  return (
    <div className="flex flex-col gap-2">
      {soBalanceDetails && (
        <>
          <Card>
            <div className="flex items-center text-left gap-4">
              <img src={image} alt={`${symbol} icon`} className="w-20 h-20" />
              <div className="flex-1 text-md border-l-gray-500 border-l-2 pl-4">
                <h2 className="text-lg font-bold">{soBalanceDetails.soName}</h2>
                <p>Options: {soBalanceDetails.numTokens}</p>
                <p>Strike: {prettyFormatPrice(soBalanceDetails.strike, 8)}</p>
                <p>Expires: {soBalanceDetails.expiration}</p>
              </div>
            </div>
          </Card>
          <Card className="flex flex-col gap-2 bg-[#05040d]">
            <TokenInput
              type="number"
              step={1 / 10 ** soBalanceDetails.baseAtoms}
              min={0}
              max={soBalanceDetails.numTokens}
              placeholder="0.0"
              token={soBalanceDetails.optionMetadata}
              onChange={(event: ChangeEvent<HTMLInputElement>) => {
                const inputStr = event.target.value;
                setStakeValue(
                  parseNumber(inputStr, soBalanceDetails.baseAtoms)
                );
              }}
              value={stakeValue}
              onMaxClick={onMaxClick}
            />

            <Button onClick={handleStakeClick}>Exercise</Button>
          </Card>
        </>
      )}
    </div>
  );
}
