"use client";

import * as React from "react";
import { cn } from "@/lib/utils";
import { Input } from "./input";
import { Badge } from "./badge";
import { X } from "lucide-react";

function normalize(s: string) {
  return s.trim().toLowerCase();
}

export function MultiSelect({
  label,
  placeholder,
  suggestions,
  value,
  onChange,
  allowCustom = true
}: {
  label?: string;
  placeholder?: string;
  suggestions: string[];
  value: string[];
  onChange: (next: string[]) => void;
  allowCustom?: boolean;
}) {
  const [query, setQuery] = React.useState("");
  const [open, setOpen] = React.useState(false);

  const selectedSet = React.useMemo(() => new Set(value.map(normalize)), [value]);

  const filtered = React.useMemo(() => {
    const q = normalize(query);
    const base = q ? suggestions.filter((s) => normalize(s).includes(q)) : suggestions;
    return base
      .filter((s) => !selectedSet.has(normalize(s)))
      .slice(0, 8);
  }, [query, suggestions, selectedSet]);

  const canAddCustom = allowCustom && query.trim().length > 0 && !selectedSet.has(normalize(query));

  function add(item: string) {
    const clean = item.trim();
    if (!clean) return;
    if (selectedSet.has(normalize(clean))) return;
    onChange([...value, clean]);
    setQuery("");
    setOpen(false);
  }

  function remove(item: string) {
    onChange(value.filter((x) => normalize(x) !== normalize(item)));
  }

  return (
    <div className="space-y-2">
      {label && <div className="text-sm font-medium">{label}</div>}

      <div className="flex flex-wrap gap-2">
        {value.map((item) => (
          <Badge key={item} className="gap-1">
            {item}
            <button
              type="button"
              className="ml-1 inline-flex rounded-full p-0.5 hover:bg-black/10 dark:hover:bg-white/10"
              onClick={() => remove(item)}
              aria-label={`Remove ${item}`}
            >
              <X className="h-3 w-3" />
            </button>
          </Badge>
        ))}
        {value.length === 0 && <div className="text-sm text-muted-foreground">No selections yet.</div>}
      </div>

      <div className="relative">
        <Input
          value={query}
          placeholder={placeholder}
          onChange={(e) => {
            setQuery(e.target.value);
            setOpen(true);
          }}
          onFocus={() => setOpen(true)}
          onBlur={() => {
            // let click events in the dropdown fire first
            window.setTimeout(() => setOpen(false), 120);
          }}
          onKeyDown={(e) => {
            if (e.key === "Enter") {
              e.preventDefault();
              if (filtered[0]) add(filtered[0]);
              else if (canAddCustom) add(query);
            }
          }}
        />

        {open && (filtered.length > 0 || canAddCustom) && (
          <div className={cn("absolute z-20 mt-2 w-full rounded-md border bg-popover p-1 shadow-sm")}>
            {filtered.map((s) => (
              <button
                key={s}
                type="button"
                className="flex w-full items-center rounded-md px-3 py-2 text-left text-sm hover:bg-accent"
                onMouseDown={(e) => e.preventDefault()}
                onClick={() => add(s)}
              >
                {s}
              </button>
            ))}
            {canAddCustom && (
              <button
                type="button"
                className="flex w-full items-center rounded-md px-3 py-2 text-left text-sm hover:bg-accent"
                onMouseDown={(e) => e.preventDefault()}
                onClick={() => add(query)}
              >
                Add “{query.trim()}”
              </button>
            )}
          </div>
        )}
      </div>
    </div>
  );
}

