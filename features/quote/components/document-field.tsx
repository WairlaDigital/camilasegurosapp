import Image from "next/image";
import { describedBy, FieldShell } from "@/components/ui/field";
import { DOCUMENT_TYPE_KEYS, DOCUMENT_TYPES, documentRule, type DocumentType } from "../lib/vehicle-rules";

type DocumentFieldProps = {
  documentType: DocumentType;
  onDocumentTypeChange: (type: DocumentType) => void;
  onBlur: (field: "documentNumber") => void;
  error?: string;
};

// Figma: document type selector and number joined in one 55px box with a divider.
export function DocumentField({ documentType, onDocumentTypeChange, onBlur, error }: DocumentFieldProps) {
  const id = "documentNumber";
  const numeric = documentRule(documentType).numeric;
  return (
    <FieldShell id={id} label="Número de documento:" error={error}>
      {/* The focus ring wraps the whole group, not each inner control. */}
      <div className="flex h-14 rounded-control border border-line bg-white focus-within:border-brand-500 focus-within:outline-2 focus-within:outline-offset-2 focus-within:outline-brand-500 has-aria-invalid:border-danger">
        <div className="relative w-37.5 shrink-0 border-r border-line">
          <select
            name="documentType"
            aria-label="Tipo de documento"
            value={documentType}
            onChange={(event) => {
              const type = DOCUMENT_TYPE_KEYS.find((key) => key === event.target.value);
              if (type) onDocumentTypeChange(type);
            }}
            className="h-full w-full cursor-pointer appearance-none rounded-l-control bg-transparent pr-10 pl-7.5 text-body font-bold text-ink focus-visible:outline-none"
          >
            {DOCUMENT_TYPE_KEYS.map((type) => (
              <option key={type} value={type}>
                {DOCUMENT_TYPES[type].label}
              </option>
            ))}
          </select>
          <Image
            src="/icons/chevron-down.svg"
            alt=""
            width={15.5}
            height={8.5}
            className="pointer-events-none absolute top-1/2 right-5 -translate-y-1/2"
          />
        </div>
        <input
          id={id}
          name={id}
          inputMode={numeric ? "numeric" : "text"}
          autoComplete="off"
          maxLength={documentType === "RUC" ? 11 : 12}
          aria-invalid={error ? true : undefined}
          aria-describedby={describedBy(id, error)}
          onBlur={() => onBlur(id)}
          className="h-full min-w-0 flex-1 rounded-r-control bg-transparent px-5 text-body font-semibold text-ink uppercase placeholder:text-placeholder focus-visible:outline-none"
        />
      </div>
    </FieldShell>
  );
}
