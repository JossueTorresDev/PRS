export const profile = {
  name: 'Jheferson Jossue Torres Humareda',
  title: 'Backend Developer | Java 17 | Spring Boot | Microservicios | Docker | PostgreSQL',
  location: 'San Luis, Cañete, Lima, Perú',
  phone: '+51 917 851 658',
  email: 'jheferson.torres.h@vallegrande.edu.pe',
  github: 'https://github.com/JossueTorresDev',
  linkedin: 'https://linkedin.com/in/jheferson-jossue-torres-humareda-b85662291',
  summary:
    'Desarrollador Backend Java 17 con experiencia en arquitectura de microservicios multi-tenant para el sector público. Participé en el desarrollo de soluciones con Spring Boot, seguridad con Spring Security, JWT y OAuth 2.0, además de pipelines CI/CD con Docker, Jenkins y SonarQube.',
  strengths: [
    'Java 17',
    'Spring Boot',
    'Microservicios',
    'Spring Security',
    'JWT / OAuth 2.0',
    'PostgreSQL',
    'Docker',
    'CI/CD',
    'Multi-tenancy',
    'Clean Code',
    'Arquitectura hexagonal',
  ],
  skills: [
    {
      category: 'Backend',
      items: ['Java 17', 'Spring Boot', 'Spring Security', 'WebFlux', 'Microservicios'],
    },
    {
      category: 'Datos',
      items: ['PostgreSQL', 'MySQL', 'Oracle SQL', 'SQL Server', 'MongoDB', 'MinIO'],
    },
    {
      category: 'Seguridad & APIs',
      items: ['JWT', 'OAuth 2.0', 'Spring Cloud Gateway', 'Swagger/OpenAPI', 'API Gateway'],
    },
    {
      category: 'DevOps & Calidad',
      items: ['Docker', 'Docker Compose', 'Jenkins', 'SonarQube', 'GitLab CI', 'GitHub Actions', 'Kubernetes'],
    },
  ],
  certifications: [
    {
      title: 'Sistema de Control Patrimonial (SIPREB)',
      detail: 'Proyecto principal desarrollado en prácticas pre-profesionales para la Municipalidad Distrital de San Luis.',
    },
    {
      title: 'Microservicios con Spring Boot y WebFlux',
      detail: 'Implementación de 3 microservicios con principios SOLID, Clean Code y arquitectura hexagonal.',
    },
    {
      title: 'Integración de seguridad y CI/CD',
      detail: 'Configuración de Spring Security, JWT, OAuth 2.0 y pipelines con Jenkins, SonarQube y Docker.',
    },
  ],
} as const

export const experience = [
  {
    period: '2023 - 2026',
    role: 'Desarrollador Backend',
    company: 'I.E.S. Valle Grande — Prácticas Pre-Profesionales',
    description:
      'Proyecto principal: Sistema de Control Patrimonial (SIPREB) para la Municipalidad Distrital de San Luis. Desarrollé microservicios con Java 17, Spring Boot y WebFlux, bajo principios SOLID, Clean Code, DDD y Arquitectura Hexagonal.',
  },
  {
    period: '2024 - 2025',
    role: 'Desarrollador Backend',
    company: 'Sistema de Inventario y Venta — Estudio Fotográfico',
    description:
      'Desarrollé el backend en Jakarta EE y Spring Boot para un sistema de inventario y venta, consumido por un frontend en Angular, con base de datos Oracle SQL y SQL Server.',
  },
  {
    period: '2023 - 2024',
    role: 'Desarrollador Web',
    company: 'Landing Page I.E.I. María Goretti',
    description:
      'Desarrollé una landing page institucional con API REST en Node.js y Express, almacenamiento en MySQL y despliegue en AWS y Ubuntu Server.',
  },
] as const
