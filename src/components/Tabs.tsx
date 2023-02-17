import { NavLink } from "react-router-dom";
import { FaHome, FaDollarSign } from "react-icons/fa";

const tabs = [
  { name: "Home", path: "/", icon: FaHome },
  { name: "Balance", path: "balance", icon: FaDollarSign },
];

export function Tabs() {
  return (
    <nav className="w-full h-fit bg-black">
      <div role="tablist" className="flex flex-row justify-center">
        {tabs.map((tab) => {
          return (
            <NavLink
              key={tab.path}
              to={tab.path}
              className={({ isActive }) =>
                `flex-1 p-3 ${isActive ? "text-gray-100" : "text-gray-500"}`
              }
            >
              <div role="tab" className="flex flex-col items-center">
                <tab.icon />
                <span>{tab.name}</span>
              </div>
            </NavLink>
          );
        })}
      </div>
    </nav>
  );
}
