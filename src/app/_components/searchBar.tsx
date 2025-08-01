import { cn } from "@/utils";
import { useEffect, useState } from "react";

const SearchBar = ({
  value,
  onChange,
}: {
  value: string;
  onChange: (value: string) => void;
}) => {
  const [search, setSearch] = useState(value);

  const [debouncedSearch, setDebouncedSearch] = useState(search);

  useEffect(() => {
    setSearch(value);
  }, [value]);

  useEffect(() => {
    const timer = setTimeout(() => {
      setDebouncedSearch(search);
    }, 500);

    return () => clearTimeout(timer);
  }, [search]);

  useEffect(() => {
    console.log("searchihng for", debouncedSearch);
    onChange(debouncedSearch);
    history.pushState(null, "", `?search=${debouncedSearch}`);
  }, [debouncedSearch, onChange]);

  return (
    <div className={cn("flex flex-row gap-2")}>
      <input
        value={search}
        onChange={(e) => setSearch(e.target.value)}
        placeholder="waku waku"
        className={cn(
          "w-full rounded-md border border-blue-500 bg-white p-2 dark:border-blue-400 dark:bg-slate-700",
        )}
      />
    </div>
  );
};

export default SearchBar;
