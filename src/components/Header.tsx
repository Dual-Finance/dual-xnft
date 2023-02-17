import { WalletMultiButton } from "@solana/wallet-adapter-react-ui";
import { useMemo } from "react";
import { FaChevronLeft } from "react-icons/fa";
import { Link, useLocation } from "react-router-dom";

const basePaths = ["/", "/balance"];
export function Header() {
  const { pathname } = useLocation();
  const title = useMemo(() => {
    if (pathname !== "/") {
      return pathname.split("/")[1];
    }
    return "Home";
  }, [pathname]);
  return (
    <header className="w-full h-fit bg-black">
      <div className="flex justify-between items-center gap-1 p-2">
        <div className="flex items-center ml-2 gap-2">
          {!basePaths.some((base) => pathname === base) && (
            <Link to="..">
              <FaChevronLeft />
            </Link>
          )}
          <h1 className="text-left text-xl capitalize inline">{title}</h1>
        </div>
        <div className="flex-1 flex justify-end">
          <WalletMultiButton />
        </div>
      </div>
    </header>
  );
}
