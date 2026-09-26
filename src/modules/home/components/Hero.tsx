import { ArrowRight, MapPin, Rocket, ServerCog } from 'lucide-react'
import { profile } from '../../../shared/data/profile'

export function Hero() {
  return (
    <header className="hero">
      <div className="hero-content">
        <p className="eyebrow">{profile.title}</p>
        <h1>{profile.name}</h1>

        <div className="hero-meta">
          <span>
            <MapPin size={12} />
            {profile.location}
          </span>
          <span>
            <Rocket size={12} />
            Disponible para proyectos
          </span>
        </div>

        <p className="hero-summary">{profile.summary}</p>

        <div className="hero-actions">
          <a href="#projects" className="primary-btn">
            Ver proyectos
            <ArrowRight size={18} />
          </a>
          <a href="#contact" className="secondary-btn">
            Contacto
          </a>
        </div>

        <ul className="skill-list">
          {profile.strengths.map((skill) => (
            <li key={skill}>{skill}</li>
          ))}
        </ul>
      </div>

      <div className="hero-card">
        <div className="status-row">
          <span className="status-dot" />
          <span>Disponible para colaborar</span>
        </div>

        <div className="hero-card-panel">
          <small>Proyecto destacado</small>
          <strong>SIPREB</strong>
          <p>Sistema de gestión patrimonial multi-tenant para entidades públicas.</p>
        </div>

        <div className="hero-card-grid">
          <div>
            <span>Stack</span>
            <strong>Java 17</strong>
          </div>
          <div>
            <span>Arquitectura</span>
            <strong>Microservicios</strong>
          </div>
        </div>

        <div className="hero-badge-row">
          <div className="floating-stat">
            <ServerCog size={14} />
            <span>Backend</span>
          </div>
          <div className="floating-stat">
            <Rocket size={14} />
            <span>Escalable</span>
          </div>
        </div>
      </div>
    </header>
  )
}
