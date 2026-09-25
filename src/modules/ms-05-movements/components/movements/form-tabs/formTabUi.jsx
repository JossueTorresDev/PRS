/** Paleta contenida: marca + un acento azul apagado. Sin colores saturados extra. */
export const BRAND = '#283447';
export const ACCENT = '#4a6fa5';
export const ACCENT_DEST = '#3d6b8e';
export const ACCENT_LIGHT = '#e8eef5';

export function SectionTitle({ children, accent = BRAND, badge }) {
  return (
    <div className="mb-5">
      <div className="flex items-center justify-between gap-3 pb-3 border-b border-slate-200">
        <div
          className="flex items-center gap-2 text-sm font-semibold [&_svg]:h-4 [&_svg]:w-4 [&_svg]:flex-shrink-0"
          style={{ color: accent }}
        >
          {children}
        </div>
        {badge}
      </div>
    </div>
  );
}

export function SubSectionTitle({ children, accent = ACCENT }) {
  return (
    <p
      className="text-xs font-medium mb-3 pl-0.5"
      style={{ color: accent }}
    >
      {children}
    </p>
  );
}

export function FieldLabel({ icon: Icon, children, required, accent = ACCENT }) {
  return (
    <label className="flex items-center gap-2 text-sm font-medium text-slate-700 mb-2">
      {Icon && <Icon className="h-4 w-4 flex-shrink-0" style={{ color: accent }} />}
      <span>
        {children}
        {required && <span className="text-red-500 ml-0.5">*</span>}
      </span>
    </label>
  );
}
