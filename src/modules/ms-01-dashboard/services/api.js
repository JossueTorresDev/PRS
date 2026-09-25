export async function fetchDashboard() {
  return Promise.resolve({ widgets: [
    { title: 'Bienes Activos', value: 314 },
    { title: 'Bienes en Baja', value: 173 },
  ]})
}
