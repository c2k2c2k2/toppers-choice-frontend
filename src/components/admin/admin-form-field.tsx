import type { JSX } from "react";

export function AdminFormField({
  children,
  hint,
  label,
}: Readonly<{
  children: React.ReactNode;
  hint?: string;
  label: string;
}>) {
  return (
    <label className="tc-form-field">
      <span className="tc-form-label">{label}</span>
      {children}
      {hint ? (
        <span className="text-xs leading-5 text-[color:var(--muted)]">
          {hint}
        </span>
      ) : null}
    </label>
  );
}

type SharedFieldProps = JSX.IntrinsicElements["input"] & {
  hint?: string;
  label: string;
};

export function AdminInput({
  className,
  hint,
  label,
  ...props
}: Readonly<SharedFieldProps>) {
  return (
    <AdminFormField label={label} hint={hint}>
      <input {...props} className={["tc-input", className].filter(Boolean).join(" ")} />
    </AdminFormField>
  );
}

type TextareaFieldProps = JSX.IntrinsicElements["textarea"] & {
  hint?: string;
  label: string;
};

export function AdminTextarea({
  className,
  hint,
  label,
  ...props
}: Readonly<TextareaFieldProps>) {
  return (
    <AdminFormField label={label} hint={hint}>
      <textarea
        {...props}
        className={["tc-input min-h-32 resize-y", className].filter(Boolean).join(" ")}
      />
    </AdminFormField>
  );
}

type SelectFieldProps = JSX.IntrinsicElements["select"] & {
  hint?: string;
  label: string;
};

export function AdminSelect({
  children,
  className,
  hint,
  label,
  ...props
}: Readonly<SelectFieldProps>) {
  return (
    <AdminFormField label={label} hint={hint}>
      <select
        {...props}
        className={["tc-input", className].filter(Boolean).join(" ")}
      >
        {children}
      </select>
    </AdminFormField>
  );
}
