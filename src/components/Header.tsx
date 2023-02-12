import { WalletMultiButton } from "@solana/wallet-adapter-react-ui";
import { Logo } from "./Logo";

export function Header() {
  return (
    <header className="w-full">
      <div className="flex">
        <div className="flex-1">
          <a className="w-fit h-fit" href="/">
            <Logo />
          </a>
        </div>
        <div className="flex-1">
          <WalletMultiButton />
        </div>
      </div>
    </header>
  );
}
