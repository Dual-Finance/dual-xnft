import { useQuery } from "@tanstack/react-query";
import { Suspense } from "react";
import { FaChevronRight } from "react-icons/fa";
import { Await, Link, useLoaderData, defer } from "react-router-dom";
import { queryClient } from "../client";
import { Background } from "../components/Background";
import { Card } from "../components/Card";
import { Loading } from "../components/Loading";
import { Logo } from "../components/Logo";
import { fetchGso } from "../hooks/useGso";
import { GsoParams } from "../types";
import { getConnection, prettyFormatPrice } from "../utils";

export async function loader() {
  return defer({
    gso: queryClient.fetchQuery({
      queryKey: ["gso"],
      queryFn: () => fetchGso(getConnection()),
    }),
  });
}

export function HomePage() {
  const data = useLoaderData() as any;
  return (
    <div>
      <Background role="banner" className="-mt-2 -mx-2 mb-2 p-2">
        <Logo className="max-w-[200px] mx-auto" />
        <h2 className="text-lg text-white">
          Presents Staking Options
        </h2>
      </Background>
      <Suspense fallback={<Loading />}>
        <Await resolve={data.gso}>
          <GsoList />
        </Await>
      </Suspense>
    </div>
  );
}

function GsoList() {
  const { data: gso } = useQuery<GsoParams[]>({ queryKey: ["gso"] });
  return (
    <div role="list">
      {gso &&
        gso.map((g) => {
          const { symbol, image } = g.metadata;
          return (
            <Link to={`/gso/${g.soName}`} key={g.soName}>
              <Card>
                <div
                  role="listitem"
                  className="flex gap-2 items-center text-white"
                >
                  <img
                    src={image}
                    alt={`${symbol} icon`}
                    className="w-10 h-10 rounded-full"
                  />
                  <div className="flex-1 text-left">
                    <p className="text-lg">{symbol.toUpperCase()}</p>
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
  );
}
