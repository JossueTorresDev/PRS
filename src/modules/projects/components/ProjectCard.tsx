import type { Project } from '../data/projects'

type ProjectCardProps = {
  project: Project
}

export function ProjectCard({ project }: ProjectCardProps) {
  return (
    <article className="project-card">
      <span className="project-category">{project.category}</span>
      <h3>{project.title}</h3>
      <p>{project.description}</p>

      <div className="tag-list">
        {project.stack.map((item) => (
          <span key={item}>{item}</span>
        ))}
      </div>

      <strong>{project.impact}</strong>
    </article>
  )
}
