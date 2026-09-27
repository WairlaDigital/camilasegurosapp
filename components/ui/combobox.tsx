"use client";

import { useId, useRef, useState, type KeyboardEvent } from "react";
import { cn } from "@/lib/cn";
import { controlStyles, describedBy, FieldShell, type FieldProps } from "./field";

export type ComboboxOption = { id: number | string; name: string };

type ComboboxProps = FieldProps & {
  /** Name of the hidden input that submits the selected option id. */
  name: string;
  value: ComboboxOption | null;
  onChange: (option: ComboboxOption | null) => void;
  /** Remote search; called after `minChars` characters, debounced. */
  loadOptions: (query: string) => Promise<ComboboxOption[]>;
  minChars?: number;
  placeholder?: string;
  disabled?: boolean;
  className?: string;
};

type Status = "idle" | "loading" | "error";

/**
 * Autocomplete following the WAI-ARIA combobox pattern (list autocomplete).
 * Typing searches remotely; the value is only set when an option is picked.
 */
export function Combobox({
  label,
  error,
  hint,
  variant = "stacked",
  name,
  value,
  onChange,
  loadOptions,
  minChars = 2,
  placeholder,
  disabled,
  className,
}: ComboboxProps) {
  const id = useId();
  const inputId = `${name}-input`;
  const listboxId = `${id}-listbox`;
  const [query, setQuery] = useState(value?.name ?? "");
  const [options, setOptions] = useState<ComboboxOption[]>([]);
  const [open, setOpen] = useState(false);
  const [active, setActive] = useState(-1);
  const [status, setStatus] = useState<Status>("idle");
  const timer = useRef<ReturnType<typeof setTimeout> | undefined>(undefined);
  const lastRequest = useRef(0);

  function search(text: string) {
    clearTimeout(timer.current);
    if (text.trim().length < minChars) {
      setOptions([]);
      setOpen(false);
      return;
    }
    timer.current = setTimeout(async () => {
      const request = ++lastRequest.current;
      setStatus("loading");
      setOpen(true);
      try {
        const result = await loadOptions(text.trim());
        if (request !== lastRequest.current) return; // a newer search is running
        setOptions(result);
        setActive(result.length > 0 ? 0 : -1);
        setStatus("idle");
      } catch {
        if (request === lastRequest.current) setStatus("error");
      }
    }, 250);
  }

  function select(option: ComboboxOption) {
    onChange(option);
    setQuery(option.name);
    setOpen(false);
  }

  function handleKeyDown(event: KeyboardEvent<HTMLInputElement>) {
    if (event.key === "ArrowDown" && options.length > 0) {
      event.preventDefault();
      setOpen(true);
      setActive((index) => (index + 1) % options.length);
    } else if (event.key === "ArrowUp" && options.length > 0) {
      event.preventDefault();
      setActive((index) => (index - 1 + options.length) % options.length);
    } else if (event.key === "Enter" && open && active >= 0 && options[active]) {
      event.preventDefault();
      select(options[active]);
    } else if (event.key === "Escape" && open) {
      event.preventDefault();
      setOpen(false);
    }
  }

  const activeId = open && active >= 0 ? `${id}-option-${active}` : undefined;

  return (
    <FieldShell id={inputId} label={label} error={error} hint={hint} variant={variant} className={className}>
      <div className="relative">
        <input type="hidden" name={name} value={value?.id ?? ""} />
        <input
          id={inputId}
          type="text"
          role="combobox"
          autoComplete="off"
          aria-autocomplete="list"
          aria-expanded={open}
          aria-controls={listboxId}
          aria-activedescendant={activeId}
          aria-invalid={error ? true : undefined}
          aria-describedby={describedBy(inputId, error, hint)}
          placeholder={placeholder}
          disabled={disabled}
          value={query}
          onChange={(event) => {
            setQuery(event.target.value);
            if (value) onChange(null); // typing clears the previous choice
            search(event.target.value);
          }}
          onKeyDown={handleKeyDown}
          onBlur={() => setOpen(false)}
          className={cn(controlStyles({ variant }), "uppercase")}
        />
        {open && (
          <ul
            id={listboxId}
            role="listbox"
            aria-label={typeof label === "string" ? label : undefined}
            className="absolute inset-x-0 top-full z-20 mt-1 max-h-64 overflow-y-auto rounded-control border border-line bg-white py-1 shadow-cta"
          >
            {status === "loading" && <li className="px-5 py-3 text-small text-ink-muted">Buscando…</li>}
            {status === "error" && (
              <li className="px-5 py-3 text-small text-danger">No pudimos buscar. Intenta de nuevo.</li>
            )}
            {status === "idle" && options.length === 0 && (
              <li className="px-5 py-3 text-small text-ink-muted">Sin resultados.</li>
            )}
            {status === "idle" &&
              options.map((option, index) => (
                <li
                  key={option.id}
                  id={`${id}-option-${index}`}
                  role="option"
                  aria-selected={index === active}
                  // mousedown (not click) so the choice lands before the input's blur closes the list
                  onMouseDown={(event) => {
                    event.preventDefault();
                    select(option);
                  }}
                  onMouseEnter={() => setActive(index)}
                  className={cn(
                    "cursor-pointer px-5 py-3 text-body font-semibold text-ink",
                    index === active && "bg-brand-50 text-brand-900",
                  )}
                >
                  {option.name}
                </li>
              ))}
          </ul>
        )}
      </div>
    </FieldShell>
  );
}
