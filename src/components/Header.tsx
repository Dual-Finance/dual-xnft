import { WalletMultiButton } from "@solana/wallet-adapter-react-ui";
import { useMemo } from "react";
import { FaChevronLeft } from "react-icons/fa";
import { useLocation } from "react-router-dom";

export function Header() {
  const location = useLocation();
  const title = useMemo(() => {
    if (location.pathname !== '/') {
      return location.pathname.split('/')[1];
    }
    return 'Home';
  }, [location]);
  return (
    <header className="w-full h-fit bg-black">
      <div className="flex justify-between items-center gap-1 p-2">
        <div className="flex items-center ml-2 gap-2">
          {title !== 'Home' && <FaChevronLeft onClick={() => window.history.back()}/>}
          <h1 className="text-left text-xl capitalize inline">{title}</h1>
        </div>
        <div className="flex-1 flex justify-end">
          <WalletMultiButton />
        </div>
      </div>
    </header>
  );
}
