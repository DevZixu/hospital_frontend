"use client";

import { useEffect, useRef, useState } from "react";
import { Loader2, Search } from "lucide-react";
import { cn } from "@/lib/cn";
import { useDebouncedValue } from "@/lib/hooks";
import { Input } from "./input";

export interface SelectOptionItem {
  value: string;
  label: string;
  description?: string;
}

export interface SearchSelectProps {
  value: string;
  onChange: (value: string, option: SelectOptionItem | null) => void;
  loadOptions: (query: string) => Promise<SelectOptionItem[]>;
  placeholder?: string;
  disabled?: boolean;
  initialLabel?: string;
  invalid?: boolean;
  emptyText?: string;
}

export function SearchSelect({
  value,
  onChange,
  loadOptions,
  placeholder = "Search…",
  disabled,
  initialLabel,
  invalid,
  emptyText = "No matches found",
}: SearchSelectProps) {
  const [query, setQuery] = useState(initialLabel ?? "");
  const [open, setOpen] = useState(false);
  const [options, setOptions] = useState<SelectOptionItem[]>([]);
  const [loading, setLoading] = useState(false);
  const [touched, setTouched] = useState(false);
  const debounced = useDebouncedValue(query);
  const containerRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const onClick = (event: MouseEvent) => {
      if (containerRef.current && !containerRef.current.contains(event.target as Node)) {
        setOpen(false);
      }
    };
    document.addEventListener("mousedown", onClick);
    return () => document.removeEventListener("mousedown", onClick);
  }, []);

  useEffect(() => {
    if (disabled || !open) return;
    let active = true;
    // eslint-disable-next-line react-hooks/set-state-in-effect
    setLoading(true);
    loadOptions(debounced)
      .then((results) => {
        if (active) setOptions(results);
      })
      .catch(() => {
        if (active) setOptions([]);
      })
      .finally(() => {
        if (active) setLoading(false);
      });
    return () => {
      active = false;
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [debounced, open, disabled]);

  return (
    <div className="relative" ref={containerRef}>
      <Search className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-ink-faint" />
      <Input
        value={query}
        disabled={disabled}
        invalid={invalid}
        placeholder={placeholder}
        className="pl-9"
        onFocus={() => setOpen(true)}
        onChange={(event) => {
          setQuery(event.target.value);
          setOpen(true);
          setTouched(true);
          if (value) onChange("", null);
        }}
      />
      {open && !disabled ? (
        <div className="absolute z-20 mt-1 max-h-64 w-full overflow-y-auto rounded-xl border border-line bg-surface py-1 shadow-raised">
          {loading ? (
            <div className="flex items-center gap-2 px-3 py-2 text-sm text-ink-faint">
              <Loader2 className="h-4 w-4 animate-spin" />
              Searching…
            </div>
          ) : options.length > 0 ? (
            options.map((option) => (
              <button
                key={option.value}
                type="button"
                onClick={() => {
                  onChange(option.value, option);
                  setQuery(option.label);
                  setOpen(false);
                }}
                className={cn(
                  "flex w-full flex-col px-3 py-2 text-left transition hover:bg-slate-50",
                  option.value === value && "bg-brand-50",
                )}
              >
                <span className="text-sm font-medium text-ink">{option.label}</span>
                {option.description ? (
                  <span className="text-xs text-ink-faint">{option.description}</span>
                ) : null}
              </button>
            ))
          ) : (
            <div className="px-3 py-2 text-sm text-ink-faint">
              {touched ? emptyText : "Start typing to search…"}
            </div>
          )}
        </div>
      ) : null}
    </div>
  );
}
