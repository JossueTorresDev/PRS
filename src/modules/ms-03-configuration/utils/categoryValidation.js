// Shared validation logic for category create/edit forms
export function normalizeString(str = "") {
  return String(str)
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "")
    .toLowerCase()
    .trim();
}

export function validateCategory(category = {}, allCategories = []) {
  const errores = [];
  const regexLetras = /^[A-Za-zÁÉÍÓÚáéíóúÑñ0-9\s.,-]+$/;

  if (!category.name?.toString().trim()) {
    errores.push("El nombre es obligatorio.");
  } else if (!regexLetras.test(category.name)) {
    errores.push("El nombre solo puede contener letras, espacios y algunos signos (.,-). ");
  } else if (category.name.toString().length < 3 || category.name.toString().length > 50) {
    errores.push("El nombre debe tener entre 3 y 50 caracteres.");
  }

  if (!category.description?.toString().trim()) {
    errores.push("La descripción es obligatoria.");
  } else if (!regexLetras.test(category.description)) {
    errores.push("La descripción solo puede contener letras, espacios y algunos signos (.,-). ");
  } else if (category.description.toString().length < 5 || category.description.toString().length > 200) {
    errores.push("La descripción debe tener entre 5 y 200 caracteres.");
  }

  if (category.name?.trim()) {
    const nombreNormalizado = normalizeString(category.name);
    const nombreDuplicado = allCategories.some(
      (c) => normalizeString(c.name) === nombreNormalizado
    );
    if (nombreDuplicado) {
      errores.push("Ya existe una categoría con ese nombre (activa o inactiva).");
    }
  }

  const camposNumericos = [
    { campo: "level", nombre: "Nivel", min: 1, max: null },
  ];

  for (const { campo, nombre, min, max, regex } of camposNumericos) {
    const valor = category[campo];
    if (valor === "" || valor === null || valor === undefined) {
      errores.push(`${nombre} es obligatorio.`);
      continue;
    }
    const numero = Number(valor);
    if (isNaN(numero)) {
      errores.push(`${nombre} debe ser un número.`);
      continue;
    }
    if (min !== null && numero < min) {
      errores.push(`${nombre} debe ser mayor o igual a ${min}.`);
    }
    if (max !== null && numero > max) {
      errores.push(`${nombre} no puede superar ${max}.`);
    }
    if (regex && !regex.test(String(valor))) {
      errores.push(`${nombre} tiene un formato incorrecto (debe ser exactamente 4 dígitos y no puede ser 0000).`);
    }
  }

  // comprobación: el nivel debe ser mayor que el de la categoría padre
  const parent = allCategories.find((c) => c.id === category.parentCategoryId);
  if (parent && Number(category.level) <= Number(parent.level)) {
    errores.push("El nivel debe ser mayor que el de la categoría padre.");
  }

  return {
    valid: errores.length === 0,
    errors: errores,
    errores, // keep Spanish alias for easier migration
  };
}