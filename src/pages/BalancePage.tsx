import { Transition } from "@headlessui/react";
import { useQuery } from "@tanstack/react-query";
import { Suspense } from "react";
import { FaChevronRight } from "react-icons/fa";
import { Await, defer, Link, useLoaderData } from "react-router-dom";
import { queryClient } from "../client";
import { Card } from "../components/Card";
import { Loading } from "../components/Loading";
import { fetchGsoBalance } from "../hooks/useGsoBalance";
import { useWallet } from "../hooks/useWallet";
import { GsoBalanceParams } from "../types";
import { getConnection, prettyFormatPrice } from "../utils";

export async function loader() {
  return defer({
    gsoBalances: queryClient.fetchQuery({
      queryKey: ["balance", window.xnft.solana.publicKey.toBase58()],
      queryFn: () =>
        fetchGsoBalance(getConnection(), window.xnft.solana.publicKey),
    }),
  });
}

export function BalancePage() {
  const data = useLoaderData() as any;
  return (
    <div className="h-full">
      <Suspense fallback={<Loading />}>
        <Await resolve={data.gsoBalances}>
          <Balances />
        </Await>
      </Suspense>
    </div>
  );
}

function Balances() {
  const { publicKey } = useWallet();
  const { data: gsoBalances } = useQuery<GsoBalanceParams[]>({
    queryKey: ["balance", publicKey.toBase58()],
  });
  const now = new Date();
  return (
    <Transition
      appear
      show={!!gsoBalances}
      enter="transition ease-out duration-200"
      enterFrom="opacity-0 translate-y-1"
      enterTo="opacity-100 translate-y-0"
    >
      <div role="list">
        {gsoBalances &&
          gsoBalances.map((g) => {
            const { symbol, image } = g.metadata;
            const { symbol: optionSymbol, image: optionImage } =
              g.optionMetadata;
            const isExercisable = g.expirationInt < now.valueOf();
            return (
              <Link to={`/balance/${g.soName}`} key={g.soName}>
                <Card>
                  <div
                    role="listitem"
                    className="flex gap-4 items-center text-white"
                  >
                    <div className="relative">
                      <img
                        src={isExercisable ? optionImage : image}
                        alt={`${isExercisable ? optionSymbol : symbol} icon`}
                        className="w-10 h-10 rounded-full"
                      />
                      {isExercisable && (
                        <img
                          src={image}
                          alt={`${symbol} icon`}
                          className="absolute w-5 h-5 -top-2 -right-2 rounded-full"
                        />
                      )}
                    </div>
                    <div className="flex-1 text-left">
                      <div className="text-lg">
                        {isExercisable
                          ? `${g.optionTokens} Options`
                          : `${g.numTokens} ${symbol?.toUpperCase()}`}
                      </div>
                      <p className="text-sm">
                        Strike: {prettyFormatPrice(g.strike, 8)}
                      </p>
                      <p className="text-sm">Expires: {g.expiration}</p>
                    </div>
                    <FaChevronRight />
                  </div>
                </Card>
              </Link>
            );
          })}
      </div>
    </Transition>
  );
}
