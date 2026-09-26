import { SectionTitle } from '../../../shared/components/SectionTitle'
import { profile } from '../../../shared/data/profile'

export function AboutSection() {
  return (
    <section id="about" className="section-block">
      <SectionTitle
        eyebrow="Sobre mí"
        title="Construyo servicios que soportan decisiones, procesos y usuarios reales."
        subtitle="Me enfoco en crear APIs, reglas de negocio y sistemas seguros que conecten datos, permisos y flujo de operación de manera confiable."
      />

      <div className="about-grid">
        <div className="about-card">
          <h3>Mi contribución</h3>
          <p>
            Participé en el desarrollo de un sistema colaborativo orientado a la gestión patrimonial
            municipal, aportando en la definición de reglas de negocio, acceso por roles, flujo de
            información y servicios que apoyan operaciones reales del negocio.
          </p>
        </div>

        <div className="about-card">
          <h3>Enfoque</h3>
          <p>
            Desarrollo lógica robusta, validaciones, control de permisos y procesos backend con sólidos
            fundamentos de mantenibilidad, escalabilidad y seguridad para sistemas complejos.
          </p>
        </div>

        <div className="about-card highlight">
          <h3>Perfil profesional</h3>
          <ul>
            {profile.strengths.map((item) => (
              <li key={item}>{item}</li>
            ))}
          </ul>
        </div>
      </div>

      <div className="certifications-box">
        <h3>Constancias y formación</h3>
        <ul>
          {profile.certifications.map((item) => (
            <li key={item.title}>{item.title}</li>
          ))}
        </ul>
      </div>
    </section>
  )
}
