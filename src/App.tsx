import buffer from "buffer";
globalThis.Buffer = buffer.Buffer;

import {
  ConnectionProvider,
  WalletProvider,
} from "@solana/wallet-adapter-react";
import { WalletModalProvider } from "@solana/wallet-adapter-react-ui";
import { QueryClientProvider } from "@tanstack/react-query";
import { RouterProvider, createBrowserRouter } from "react-router-dom";
import { Layout } from "./Layout";
import { HomePage, loader as homeLoader } from "./pages/HomePage";
import { GsoPage, loader as gsoLoader } from "./pages/GsoPage";
import ErrorPage from "./ErrorPage";
import { queryClient } from "./client";
import "./App.css";
import "@solana/wallet-adapter-react-ui/styles.css";

const router = createBrowserRouter([
  {
    path: "/",
    element: <Layout />,
    errorElement: <ErrorPage />,
    children: [
      { index: true, element: <HomePage />, loader: homeLoader },
      { path: "gso/:name", element: <GsoPage />, loader: gsoLoader },
      {
        path: "balance",
        element: <div>Balances</div>,
      },
    ],
  },
]);

function App() {
  return (
    <ConnectionProvider endpoint={import.meta.env.VITE_RPC_URL_MAINNET}>
      <WalletProvider wallets={[]} autoConnect>
        <WalletModalProvider>
          <QueryClientProvider client={queryClient}>
            <RouterProvider router={router} />
          </QueryClientProvider>
        </WalletModalProvider>
      </WalletProvider>
    </ConnectionProvider>
  );
}

export default App;
