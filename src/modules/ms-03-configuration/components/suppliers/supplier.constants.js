export const COMPANY_TYPES = [
  { value: 'S.A.', label: 'Sociedad Anónima (S.A.)' },
  { value: 'S.A.C.', label: 'Sociedad Anónima Cerrada (S.A.C.)' },
  { value: 'S.R.L.', label: 'Sociedad de Responsabilidad Limitada (S.R.L.)' },
  { value: 'E.I.R.L.', label: 'Empresa Individual de Responsabilidad Limitada (E.I.R.L.)' },
  { value: 'S.A.A.', label: 'Sociedad Anónima Abierta (S.A.A.)' },
  { value: 'PERSONA NATURAL', label: 'Persona Natural' },
  { value: 'ASOCIACION', label: 'Asociación' },
  { value: 'FUNDACION', label: 'Fundación' },
  { value: 'ONG', label: 'ONG' }
];
export const CLASSIFICATIONS = [
  { value: 'MICROEMPRESA', label: 'Microempresa', description: 'Hasta 150 UIT' },
  { value: 'PEQUEÑA EMPRESA', label: 'Pequeña Empresa', description: '150 - 1,700 UIT' },
  { value: 'MEDIANA EMPRESA', label: 'Mediana Empresa', description: '1,700 - 2,300 UIT' },
  { value: 'GRAN EMPRESA', label: 'Gran Empresa', description: 'Más de 2,300 UIT' }
];
export const getCompanyTypeLabel = (value) => {
  const type = COMPANY_TYPES.find(t => t.value === value);
  return type ? type.label : value;
};
export const getClassificationLabel = (value) => {
  const classification = CLASSIFICATIONS.find(c => c.value === value);
  return classification ? classification.label : value;
};
export const getClassificationBadge = (classification) => {
  switch (classification) {
    case 'MICROEMPRESA':
      return 'bg-blue-100 text-blue-800';
    case 'PEQUEÑA EMPRESA':
      return 'bg-green-100 text-green-800';
    case 'MEDIANA EMPRESA':
      return 'bg-yellow-100 text-yellow-800';
    case 'GRAN EMPRESA':
      return 'bg-purple-100 text-purple-800';
    default:
      return 'bg-gray-100 text-gray-800';
  }
};
