import { useQuery } from "@tanstack/react-query";
import { Suspense } from "react";
import { Await, defer, useLoaderData, useParams } from "react-router-dom";
import { queryClient } from "../client";
import { Card } from "../components/Card";
import { Loading } from "../components/Loading";
import { fetchGsoDetails, GsoParams } from "../hooks/useGso";
import { getConnection, prettyFormatPrice } from "../utils";

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
      queryFn: () => fetchGsoDetails(getConnection(), params.name || ''),
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
  const { name } = useParams();
  const { data: gsoDetails } = useQuery<GsoParams>({
    queryKey: ["gso", name],
  });
  return (
    <Card>
      {gsoDetails && (
        <div className="flex items-center text-left gap-2">
          <div>
            <img src={gsoDetails.metadata.image} className="w-20 h-20" />
          </div>
          <div className="flex-1 text-md border-l-gray-500 border-l-2 pl-2">
            <h2 className="text-lg">{gsoDetails.soName}</h2>
            <p>Stake: {gsoDetails.metadata.symbol.toUpperCase()}</p>
            <p>Strike: {prettyFormatPrice(gsoDetails.strike, 8)}</p>
            <p>Expires: {gsoDetails.expiration}</p>
            <p>Lockup Ratio: {1 / gsoDetails.lockupRatio}:1</p>
          </div>
        </div>
      )}
    </Card>
  );
}
