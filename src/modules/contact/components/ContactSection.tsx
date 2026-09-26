import { ArrowUpRight, Globe, Mail, Phone } from 'lucide-react'
import { SectionTitle } from '../../../shared/components/SectionTitle'
import { profile } from '../../../shared/data/profile'

export function ContactSection() {
  const phoneNumber = profile.phone.replace(/\D/g, '')
  const links = [
    { href: `mailto:${profile.email}`, label: profile.email, icon: Mail },
    { href: `https://wa.me/${phoneNumber}?text=Hola%20Jossue%2C%20me%20gustar%C3%ADa%20hablar%20contigo.`, label: profile.phone, icon: Phone, external: true },
    { href: profile.github, label: 'GitHub', icon: Globe, external: true },
    { href: profile.linkedin, label: 'LinkedIn', icon: ArrowUpRight, external: true },
  ]

  return (
    <section id="contact" className="section-block contact-section">
      <SectionTitle
        eyebrow="Contacto"
        title="Hablemos de tu próximo proyecto backend."
        subtitle="Busco oportunidades backend en Lima, tanto presencial, híbrido o remoto, para aportar valor con Java, Spring Boot y microservicios."
      />

      <div className="contact-grid">
        {links.map(({ href, label, icon: Icon, external }) => (
          <a
            key={label}
            href={href}
            target={external ? '_blank' : undefined}
            rel={external ? 'noreferrer' : undefined}
            className="contact-card"
          >
            <span className="contact-icon">
              <Icon size={16} />
            </span>
            <span>{label}</span>
          </a>
        ))}
      </div>
    </section>
  )
}
