import { experience } from '../../../shared/data/profile'
import { SectionTitle } from '../../../shared/components/SectionTitle'

export function ExperienceTimeline() {
  return (
    <section id="experience" className="section-block">
      <SectionTitle
        eyebrow="Experiencia"
        title="Trabajos y entregas orientadas a soluciones reales."
      />

      <div className="timeline">
        {experience.map((item) => (
          <div key={item.period} className="timeline-item">
            <div className="timeline-date">{item.period}</div>
            <div className="timeline-content">
              <h3>{item.role}</h3>
              <p className="timeline-company">{item.company}</p>
              <p>{item.description}</p>
            </div>
          </div>
        ))}
      </div>
    </section>
  )
}
