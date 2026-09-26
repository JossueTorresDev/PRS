export type Project = {
  title: string
  category: string
  description: string
  stack: string[]
  impact: string
}

export const projects: Project[] = [
  {
    title: 'SIPREB',
    category: 'Sistema de Control Patrimonial',
    description:
      'Desarrollé 3 microservicios con Java 17, Spring Boot y WebFlux para la Municipalidad Distrital de San Luis, con seguridad JWT/OAuth 2.0, multi-tenancy y documentación con Swagger/OpenAPI.',
    stack: ['Java 17', 'Spring Boot', 'WebFlux', 'PostgreSQL', 'Docker', 'SonarQube'],
    impact: 'Se logró 100% de progreso del proyecto y 0% deuda técnica, mejorando la trazabilidad y aprobación de procesos patrimoniales.',
  },
  {
    title: 'Sistema de Inventario y Venta',
    category: 'Backend empresarial',
    description:
      'Backend para gestión de inventario, compras a proveedores, ventas y modelado de datos en Oracle SQL y SQL Server, consumido por un frontend Angular.',
    stack: ['Jakarta EE', 'Spring Boot', 'Angular', 'Oracle SQL', 'SQL Server', 'API REST'],
    impact: 'Impulsó la operación del negocio con estructuras de datos organizadas y procesos más controlados.',
  },
  {
    title: 'Landing Page institucional',
    category: 'API + despliegue web',
    description:
      'Desarrollé una landing page con formulario interactivo, almacenamiento en MySQL y API REST con Node.js y Express, desplegada en servidor AWS/Ubuntu.',
    stack: ['Node.js', 'Express', 'MySQL', 'AWS', 'Ubuntu Server', 'GitHub'],
    impact: 'Permitió digitalizar la interacción institucional con un flujo funcional de contacto y gestión de datos.',
  },
  {
    title: 'dApp de pagos y transferencias',
    category: 'Proyecto personal',
    description:
      'dApp desarrollada con Svelte y smart contracts en Solidity, integrando PaliWallet y desplegando en redes de prueba Ethereum Sepolia y Hoodi.',
    stack: ['Svelte', 'Solidity', 'PaliWallet', 'Ethereum', 'JavaScript'],
    impact: 'Exploré blockchain y pagos digitales con integración de wallet y contratos inteligentes.',
  },
]
