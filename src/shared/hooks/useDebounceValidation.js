import { useState, useEffect, useCallback } from 'react';

/**
 * Hook para manejar la validación de campos con debounce
 * @param {Function} validationFn Función que realiza la validación (ej. llamar a la API)
 * @param {number} delay Tiempo de espera en ms (default 500ms)
 * @returns {Object} Objeto con estado de validación y manejadores
 */
export const useDebounceValidation = (validationFn, delay = 500) => {
  const [value, setValue] = useState('');
  const [isValidating, setIsValidating] = useState(false);
  const [error, setError] = useState(null);
  const [isValid, setIsValid] = useState(true);

  useEffect(() => {
    if (!value || value.trim() === '') {
      setIsValid(true);
      setError(null);
      setIsValidating(false);
      return;
    }

    setIsValidating(true);
    const handler = setTimeout(async () => {
      try {
        const result = await validationFn(value);
        // La lógica de qué es "válido" depende de la función de validación
        // Por ejemplo, para existsByUsername, result === true significa que YA EXISTE (inválido)
        if (result === true) {
          setIsValid(false);
          setError('Este valor ya está en uso');
        } else {
          setIsValid(true);
          setError(null);
        }
      } catch (err) {
        setError('Error al validar');
        setIsValid(false);
      } finally {
        setIsValidating(false);
      }
    }, delay);

    return () => clearTimeout(handler);
  }, [value, validationFn, delay]);

  const reset = useCallback(() => {
    setValue('');
    setError(null);
    setIsValid(true);
    setIsValidating(false);
  }, []);

  return {
    value,
    setValue,
    isValidating,
    error,
    isValid,
    reset
  };
};
