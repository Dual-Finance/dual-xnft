import buffer from 'buffer';
globalThis.Buffer = buffer.Buffer;

import {
  ConnectionProvider,
  WalletProvider,
} from "@solana/wallet-adapter-react";
import { WalletModalProvider } from "@solana/wallet-adapter-react-ui";
import { Header } from "./components/Header";
import { HomePage } from "./pages/HomePage";
import "./App.css";
import "@solana/wallet-adapter-react-ui/styles.css";

function App() {
  return (
    <ConnectionProvider endpoint={import.meta.env.VITE_RPC_URL_MAINNET}>
      <WalletProvider wallets={[]} autoConnect>
        <WalletModalProvider>
          <Header />
          <HomePage />
        </WalletModalProvider>
      </WalletProvider>
    </ConnectionProvider>
  );
}

export default App;
