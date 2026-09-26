import './App.css'
import {
  BriefcaseBusiness,
  Code2,
  Database,
  Layers3,
  Menu,
  ShieldCheck,
  Sparkles,
  X,
  Zap,
} from 'lucide-react'
import { useState } from 'react'
import { AboutSection } from './modules/about/components/AboutSection'
import { ContactSection } from './modules/contact/components/ContactSection'
import { ExperienceTimeline } from './modules/experience/components/ExperienceTimeline'
import { Hero } from './modules/home/components/Hero'
import { ProjectCard } from './modules/projects/components/ProjectCard'
import { projects } from './modules/projects/data/projects'
import { SectionTitle } from './shared/components/SectionTitle'
import { profile } from './shared/data/profile'

const stats = [
  { label: 'Stack principal', value: 'Java 17 + Spring Boot', icon: Code2 },
  { label: 'Arquitectura', value: 'Microservicios + APIs', icon: Layers3 },
  { label: 'Seguridad', value: 'JWT / OAuth 2.0', icon: ShieldCheck },
  { label: 'Operación', value: 'Docker + CI/CD', icon: Zap },
]

function App() {
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false)

  const handleNavClick = () => setMobileMenuOpen(false)

  return (
    <div className="portfolio-shell">
      <nav className="topbar">
        <div className="brand-block">
          <div className="brand-mark">
            <Code2 size={15} />
          </div>

          <div className="brand-copy">
            <div className="brand-line">
              <div className="brand">Backend</div>
              <span className="brand-role">Developer</span>

              <div className="brand-tech" aria-label="Stack principal">
                <span title="Java"><Code2 size={13} /></span>
                <span title="Spring Boot"><Layers3 size={13} /></span>
                <span title="Microservicios"><ShieldCheck size={13} /></span>
                <span title="Base de datos"><Database size={13} /></span>
              </div>
            </div>
          </div>
        </div>

        <button
          type="button"
          className="nav-toggle"
          aria-label={mobileMenuOpen ? 'Cerrar menú' : 'Abrir menú'}
          aria-expanded={mobileMenuOpen}
          onClick={() => setMobileMenuOpen((open) => !open)}
        >
          {mobileMenuOpen ? <X size={18} /> : <Menu size={18} />}
        </button>

        <div className={`nav-links ${mobileMenuOpen ? 'open' : ''}`}>
          <a href="#about" onClick={handleNavClick}>Sobre mí</a>
          <a href="#skills" onClick={handleNavClick}>Skills</a>
          <a href="#projects" onClick={handleNavClick}>Proyectos</a>
          <a href="#experience" onClick={handleNavClick}>Experiencia</a>
          <a href="#contact" onClick={handleNavClick}>Contacto</a>
        </div>
      </nav>

      <main>
        <Hero />

        <section className="stats-strip" aria-label="Resumen profesional">
          {stats.map(({ label, value, icon: Icon }) => (
            <div key={label} className="stats-card reveal-card">
              <div className="stats-icon-wrap">
                <Icon size={16} />
              </div>
              <span>{label}</span>
              <strong>{value}</strong>
            </div>
          ))}
        </section>

        <AboutSection />

        <section id="skills" className="section-block">
          <SectionTitle
            eyebrow="Skills"
            title="Habilidades y capacidades para construir productos reales."
          />

          <div className="skills-grid">
            {profile.skills.map((group, index) => (
              <div key={group.category} className="skill-card reveal-card" style={{ animationDelay: `${index * 120}ms` }}>
                <div className="card-header-row">
                  <div className="mini-icon">
                    {group.category === 'Backend' ? <Code2 size={14} /> : group.category === 'Datos' ? <Database size={14} /> : group.category === 'Seguridad & APIs' ? <ShieldCheck size={14} /> : <BriefcaseBusiness size={14} />}
                  </div>
                  <h3>{group.category}</h3>
                </div>
                <ul>
                  {group.items.map((item) => (
                    <li key={item}>{item}</li>
                  ))}
                </ul>
              </div>
            ))}
          </div>
        </section>

        <ExperienceTimeline />

        <section id="projects" className="section-block">
          <SectionTitle
            eyebrow="Proyectos"
            title="Soluciones web con foco en negocio, reutilización y claridad."
          />

          <div className="project-grid">
            {projects.map((project) => (
              <ProjectCard key={project.title} project={project} />
            ))}
          </div>
        </section>

        <section id="certifications" className="section-block">
          <SectionTitle
            eyebrow="Certificaciones"
            title="Formación y constancias que respaldan mi perfil."
          />

          <div className="cert-grid">
            {profile.certifications.map((item, index) => (
              <div key={item.title} className="cert-card reveal-card" style={{ animationDelay: `${index * 120}ms` }}>
                <span className="cert-badge">
                  <Sparkles size={12} />
                  Constancia
                </span>
                <h3>{item.title}</h3>
                <p>{item.detail}</p>
              </div>
            ))}
          </div>
        </section>

        <ContactSection />
      </main>
    </div>
  )
}

export default App
