/// <reference types="vite/client" />

interface ImportMetaEnv {
  readonly VITE_RPC_URL_MAINNET: string;
  // more env variables...
}

interface ImportMeta {
  readonly env: ImportMetaEnv;
}

declare module "tw-elements" {}
