import React, { useState, useEffect } from 'react';

import { useNavigate } from "react-router-dom";
import {
  getDepreciationHistoryByAsset,
  generateAndFetchDepreciations,
} from "../../services/depreciationService";

/**
 * Modal para mostrar el historial de depreciación de un bien
 */
export default function DepreciationHistoryModal({ asset, onClose }) {
  const [data, setData] = useState([]);
  const [loading, setLoading] = useState(true);
  const navigate = useNavigate();

  useEffect(() => {
    if (!asset || !asset.id) return;

    const loadDepreciation = async () => {
      try {
        setLoading(true);

        // 🔹 Traer historial existente
        let info = await getDepreciationHistoryByAsset(asset.id);

        // 🔹 Si no hay historial, generar y traer actualizado
        if (!info || info.length === 0) {
          const params = {
            initialValue: asset.acquisitionValue || 0,
            residualValue: asset.residualValue || 0,
            usefulLifeMonths: (asset.usefulLife || 0) * 12,
            // Formatear acquisitionDate a YYYY-MM-DDTHH:mm:ss (hora local)
            acquisitionDate: (() => {
              const d = asset.acquisitionDate || new Date().toISOString();
              // Si viene en formato 'YYYY-MM-DD', convertir a fecha local a las 00:00:00
              const simpleDateMatch = /^\d{4}-\d{2}-\d{2}$/.test(d);
              let dateObj;
              if (simpleDateMatch) {
                const [y, m, day] = d.split('-').map(Number);
                dateObj = new Date(y, m - 1, day, 0, 0, 0);
              } else {
                dateObj = new Date(d);
              }
              if (isNaN(dateObj.getTime())) return null;
              const pad = (n) => String(n).padStart(2, '0');
              return `${dateObj.getFullYear()}-${pad(dateObj.getMonth() + 1)}-${pad(dateObj.getDate())}T${pad(dateObj.getHours())}:${pad(dateObj.getMinutes())}:${pad(dateObj.getSeconds())}`;
            })(),
          };
          info = await generateAndFetchDepreciations(asset.id, params);
        }

        setData(info || []);
      } catch (error) {
        console.error("Error al cargar depreciación:", error);
        setData([]);
      } finally {
        setLoading(false);
      }
    };

    loadDepreciation();
  }, [asset]);

  if (!asset || !asset.id) return null;

  const formatNumber = (num) =>
    typeof num === "number" ? num.toLocaleString("es-PE", { minimumFractionDigits: 2 }) : "0.00";

  const first = data[0] || {};
  const last = data[data.length - 1] || {};

  return (
    <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50">
      <div className="bg-white rounded-2xl shadow-2xl w-11/12 max-w-lg p-6 relative">
        <button
          onClick={onClose}
          className="absolute top-3 right-3 text-gray-500 hover:text-gray-800 text-xl"
        >
          ✖
        </button>

        <h2 className="text-xl font-semibold text-gray-800 mb-4">
          Depreciación del Bien
        </h2>

        {loading ? (
          <p className="text-gray-500">Cargando información...</p>
        ) : data.length === 0 ? (
          <div className="text-center text-gray-600 py-4 bg-gray-50 rounded-xl">
            Aún no se han generado depreciaciones.
          </div>
        ) : (
          <>
            {/* 🔹 Resumen rápido */}
            <div className="bg-indigo-50 p-4 rounded-xl mb-4">
              <p className="text-sm text-gray-600">
                Valor inicial: <strong>S/ {formatNumber(first.initialValue)}</strong>
              </p>
              <p className="text-sm text-gray-600">
                Depreciación acumulada: <strong>S/ {formatNumber(last.currentAccumulatedDepreciation)}</strong>
              </p>
              <p className="text-sm text-gray-600">
                Valor neto actual: <strong>S/ {formatNumber(last.currentBookValue)}</strong>
              </p>
            </div>

            <div className="flex justify-end mt-4">
              <button
                onClick={() => navigate(`/historial/${asset.id}`)}
                className="bg-indigo-600 hover:bg-indigo-700 text-white px-4 py-2 rounded-lg shadow transition"
              >
                Ver historial completo →
              </button>
            </div>
          </>
        )}
      </div>
    </div>
  );
}
