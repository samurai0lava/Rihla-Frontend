import { useEffect, useRef, useState } from "react";
import { Search, MapPin } from "lucide-react";
import "./GlassSearchBar.css";
import { resolveGatewayUrl } from "@/lib/api";

const AI_PLACES_URL = resolveGatewayUrl(
  import.meta.env.VITE_AI_PLACES_URL as string | undefined,
);

interface GlassSearchBarProps {
  placeholder?: string;
  value?: string;
  onChange?: (value: string) => void;
  /** Called when the user submits freetext (no autocomplete pick) */
  onSearch?: (value: string) => void;
  /** Called when the user picks a city from the autocomplete dropdown */
  onSelect?: (city: string) => void;
  /** No inner form and no search button — for use inside another form (e.g. trip planner bar). */
  embedded?: boolean;
  wrapperClassName?: string;
  inputClassName?: string;
}

function GlassSearchBar({
  placeholder = "Search By Places or By Activities",
  value: controlledValue,
  onChange,
  onSearch,
  onSelect,
  embedded = false,
  wrapperClassName = "",
  inputClassName = "",
}: GlassSearchBarProps) {
  const [internalValue, setInternalValue] = useState("");
  const value = controlledValue ?? internalValue;

  const [staticSuggestions, setStaticSuggestions] = useState<string[]>([]);
  const [showDropdown, setShowDropdown] = useState(false);
  const [selectedIndex, setSelectedIndex] = useState(-1);

  const allSuggestions = staticSuggestions;

  const wrapperRef = useRef<HTMLDivElement>(null);

  // Debounced fetch: backend handles static + Google fallback in one route.
  useEffect(() => {
    const q = value.trim();

    if (q.length < 1) {
      setStaticSuggestions([]);
      setShowDropdown(false);
      return;
    }

    const timer = setTimeout(async () => {
      try {
        const res = await fetch(
          `${AI_PLACES_URL}/autocomplete?q=${encodeURIComponent(q)}`,
        );
        if (!res.ok) throw new Error(`HTTP ${res.status}`);
        const data = await res.json();
        const list: string[] = data.suggestions ?? [];
        setStaticSuggestions(list);
        setShowDropdown(list.length > 0);
        setSelectedIndex(-1);
      } catch {
        setStaticSuggestions([]);
        setShowDropdown(false);
      }
    }, 250);

    return () => {
      clearTimeout(timer);
    };
  }, [value]);

  // Close dropdown on outside click
  useEffect(() => {
    const handleClickOutside = (e: MouseEvent) => {
      if (wrapperRef.current && !wrapperRef.current.contains(e.target as Node)) {
        setShowDropdown(false);
        setSelectedIndex(-1);
      }
    };
    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, []);

  const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const newValue = e.target.value;
    setInternalValue(newValue);
    onChange?.(newValue);
  };

  const handleSelect = (city: string) => {
    setInternalValue(city);
    onChange?.(city);
    setStaticSuggestions([]);
    setShowDropdown(false);
    setSelectedIndex(-1);
    if (onSelect) onSelect(city);
    else onSearch?.(city);
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (selectedIndex >= 0 && allSuggestions[selectedIndex]) {
      handleSelect(allSuggestions[selectedIndex]);
    } else {
      setShowDropdown(false);
      onSearch?.(value);
    }
  };

  const handleKeyDown = (e: React.KeyboardEvent<HTMLInputElement>) => {
    if (e.key === "Enter") {
      if (showDropdown && selectedIndex >= 0 && allSuggestions[selectedIndex]) {
        e.preventDefault();
        handleSelect(allSuggestions[selectedIndex]);
      }
      return;
    }
    if (!showDropdown) return;

    if (e.key === "ArrowDown") {
      e.preventDefault();
      setSelectedIndex(i => Math.min(i + 1, allSuggestions.length - 1));
    } else if (e.key === "ArrowUp") {
      e.preventDefault();
      setSelectedIndex(i => Math.max(i - 1, -1));
    } else if (e.key === "Escape") {
      setShowDropdown(false);
      setSelectedIndex(-1);
    }
  };

  const inputClass =
    inputClassName.trim() ||
    (embedded ? "glass-search-input glass-search-input--embedded" : "glass-search-input");

  const inputEl = (
    <input
      type="text"
      className={inputClass}
      placeholder={placeholder}
      value={value}
      onChange={handleChange}
      onKeyDown={handleKeyDown}
      autoComplete="off"
    />
  );

  return (
    <div
      className={`glass-search-wrapper${embedded ? " glass-search-wrapper--embedded" : ""}${wrapperClassName ? ` ${wrapperClassName}` : ""}`.trim()}
      ref={wrapperRef}
    >
      {embedded ? (
        <div className="glass-search-embed-inner">{inputEl}</div>
      ) : (
        <form className="glass-search-bar" onSubmit={handleSubmit}>
          {inputEl}
          <button type="submit" className="glass-search-button" aria-label="Search">
            <Search size={16} />
            <span>Search</span>
          </button>
        </form>
      )}

      {showDropdown && allSuggestions.length > 0 && (
        <ul className="glass-suggestions" role="listbox">
          {staticSuggestions.map((city, i) => (
            <li
              key={`static-${city}`}
              role="option"
              aria-selected={i === selectedIndex}
              className={`glass-suggestion-item${i === selectedIndex ? " active" : ""}`}
              onMouseDown={() => handleSelect(city)}
            >
              <MapPin size={13} className="glass-suggestion-icon" />
              {city}
            </li>
          ))}
        </ul>
      )}
    </div>
  );
}

export default GlassSearchBar;
