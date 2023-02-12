import useGso from "../hooks/useGso";

export function HomePage() {
  const { gso } = useGso();
  return (
    <div>
      <div role="list" className="list-none">
        {gso.map((g) => {
          return (
            <div
              key={g.soName}
              role="listitem"
              className="w-full p-4 rounded bg-black border-2 border-gray-500"
            >
              <div className="flex justify-between items-center">
                <img src={g.metadata.image} className="w-8 h-8" />
                <span>{g.soName}</span>
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
}
