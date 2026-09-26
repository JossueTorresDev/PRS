type SectionTitleProps = {
  eyebrow: string
  title: string
  subtitle?: string
}

export function SectionTitle({ eyebrow, title, subtitle }: SectionTitleProps) {
  return (
    <div style={{ marginBottom: '2rem' }}>
      <p className="section-eyebrow">{eyebrow}</p>
      <h2>{title}</h2>
      {subtitle ? <p className="section-subtitle">{subtitle}</p> : null}
    </div>
  )
}
