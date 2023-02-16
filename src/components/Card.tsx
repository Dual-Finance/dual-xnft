import { PropsWithChildren } from "react";

export function Card({ children }: PropsWithChildren) {
  return (
    <div className="w-full p-4 rounded bg-black border-2 border-gray-500">
      {children}
    </div>
  );
}
