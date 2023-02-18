import { Outlet } from "react-router-dom";
import { Header } from "./Header";
import { Tabs } from "./Tabs";

export function Layout() {
  return (
    <div className="h-screen w-screen max-w-[425px] flex flex-col">
      <Header />
      <main className="flex-1 p-2 bg-[#d6f4fe]">
        <Outlet />
      </main>
      <Tabs />
    </div>
  );
}
