import { useMemo } from "react";
import { FaChevronLeft } from "react-icons/fa";
import { useLocation, useNavigate } from "react-router-dom";

const basePaths = ["/", "/balance"];
export function Header() {
  const { pathname } = useLocation();
  const navigate = useNavigate();
  const title = useMemo(() => {
    if (pathname !== "/") {
      const segments = pathname.split("/");
      return pathname.split("/")[segments.length - 1];
    }
    return "Home";
  }, [pathname]);
  return (
    <header className="w-full h-fit bg-black">
      <div className="h-16 flex justify-between items-center gap-1 p-2">
        <div className="flex items-baseline ml-2 gap-2">
          {!basePaths.some((base) => pathname === base) && (
            <button onClick={() => navigate(-1)}>
              <FaChevronLeft />
            </button>
          )}
          <h1 className="text-left text-xl capitalize inline text-white">{title}</h1>
        </div>
      </div>
    </header>
  );
}
