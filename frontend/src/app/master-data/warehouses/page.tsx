"use client";

import React, { useEffect, useState, useMemo } from "react";
import {
  Database,
  Plus,
  Search,
  Edit2,
  Trash2,
  Loader2,
  CheckCircle2,
  XCircle,
  AlertCircle,
  RefreshCw,
} from "lucide-react";
import apiClient from "@/lib/api";
import { Warehouse } from "@/types";
import { useToast } from "@/context/ToastContext";
import Modal from "@/components/Modal";

export default function WarehousesPage() {
  const { showToast } = useToast();
  const [warehouses, setWarehouses] = useState<Warehouse[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState("");
  const [activeOnly, setActiveOnly] = useState(false);

  // Modal State
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editingWarehouse, setEditingWarehouse] = useState<Warehouse | null>(null);
  const [formData, setFormData] = useState({
    code: "",
    name: "",
    description: "",
    location: "",
    isActive: true,
  });
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [modalError, setModalError] = useState<string | null>(null);

  const fetchWarehouses = async () => {
    setLoading(true);
    try {
      const res = await apiClient.get<Warehouse[]>("/api/warehouses", {
        params: { activeOnly: activeOnly ? true : undefined },
      });
      setWarehouses(res.data);
    } catch {
      showToast("Error al cargar almacenes desde la API", "error");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchWarehouses();
  }, [activeOnly]);

  const filteredWarehouses = useMemo(() => {
    return warehouses.filter(
      (w) =>
        w.code.toLowerCase().includes(searchTerm.toLowerCase()) ||
        w.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
        (w.location && w.location.toLowerCase().includes(searchTerm.toLowerCase()))
    );
  }, [warehouses, searchTerm]);

  const handleOpenCreate = () => {
    setEditingWarehouse(null);
    setFormData({
      code: "",
      name: "",
      description: "",
      location: "",
      isActive: true,
    });
    setModalError(null);
    setIsModalOpen(true);
  };

  const handleOpenEdit = (w: Warehouse) => {
    setEditingWarehouse(w);
    setFormData({
      code: w.code,
      name: w.name,
      description: w.description || "",
      location: w.location || "",
      isActive: w.isActive,
    });
    setModalError(null);
    setIsModalOpen(true);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!formData.code.trim() || !formData.name.trim()) {
      setModalError("El código y el nombre del almacén son obligatorios.");
      return;
    }

    setIsSubmitting(true);
    setModalError(null);

    try {
      if (editingWarehouse) {
        await apiClient.put(`/api/warehouses/${editingWarehouse.id}`, {
          ...editingWarehouse,
          code: formData.code.trim().toUpperCase(),
          name: formData.name.trim(),
          description: formData.description.trim() || null,
          location: formData.location.trim() || null,
          isActive: formData.isActive,
        });
        showToast(`Almacén ${formData.code.toUpperCase()} actualizado exitosamente`, "success");
      } else {
        await apiClient.post("/api/warehouses", {
          code: formData.code.trim().toUpperCase(),
          name: formData.name.trim(),
          description: formData.description.trim() || null,
          location: formData.location.trim() || null,
          isActive: formData.isActive,
        });
        showToast(`Almacén ${formData.code.toUpperCase()} creado exitosamente`, "success");
      }
      setIsModalOpen(false);
      fetchWarehouses();
    } catch (err: unknown) {
      if (err && typeof err === "object" && "response" in err) {
        const axErr = err as { response?: { status?: number; data?: { message?: string } } };
        const msg = axErr.response?.data?.message || "Ocurrió un error al procesar el almacén.";
        setModalError(msg);
        showToast(msg, "error");
      } else {
        setModalError("No se pudo conectar con el servidor.");
        showToast("Error de conexión con el backend", "error");
      }
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleDelete = async (w: Warehouse) => {
    if (!confirm(`¿Está seguro de eliminar o desactivar el almacén "${w.code} - ${w.name}"?`)) {
      return;
    }

    try {
      const res = await apiClient.delete(`/api/warehouses/${w.id}`);
      showToast(res.data?.message || `Almacén ${w.code} procesado`, "success");
      fetchWarehouses();
    } catch {
      showToast("Error al intentar eliminar el almacén", "error");
    }
  };

  return (
    <div className="space-y-6 max-w-7xl mx-auto">
      {/* Cabecera */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 p-5 rounded-2xl bg-slate-900 border border-slate-800">
        <div className="flex items-center gap-3">
          <div className="flex items-center justify-center w-12 h-12 rounded-xl bg-amber-500/10 border border-amber-500/30 text-amber-400">
            <Database className="w-6 h-6" />
          </div>
          <div>
            <h1 className="text-xl font-bold text-white tracking-tight">
              Catálogo de Almacenes (ALM)
            </h1>
            <p className="text-xs text-slate-400">
              Gestión de ubicaciones físicas (ALM-001 Materia Prima hasta ALM-004 Cuarentena)
            </p>
          </div>
        </div>

        <div className="flex items-center gap-2">
          <button
            onClick={fetchWarehouses}
            disabled={loading}
            className="p-2.5 rounded-xl border border-slate-700 bg-slate-800 text-slate-300 hover:text-white hover:bg-slate-700 transition-colors"
            title="Recargar datos"
          >
            <RefreshCw className={`w-4 h-4 ${loading ? "animate-spin text-amber-400" : ""}`} />
          </button>
          <button
            onClick={handleOpenCreate}
            className="flex items-center gap-2 px-4 py-2.5 rounded-xl text-xs font-semibold text-white bg-gradient-to-r from-amber-600 to-amber-500 hover:from-amber-500 hover:to-amber-400 shadow-md shadow-amber-600/30 transition-all cursor-pointer"
          >
            <Plus className="w-4 h-4" />
            <span>Nuevo Almacén</span>
          </button>
        </div>
      </div>

      {/* Filtros de búsqueda */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 p-4 rounded-xl bg-slate-900/60 border border-slate-800">
        <div className="relative flex-1 max-w-md">
          <Search className="absolute left-3 top-2.5 w-4 h-4 text-slate-400" />
          <input
            type="text"
            placeholder="Buscar por código, nombre o ubicación..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="w-full pl-9 pr-3 py-2 text-xs bg-slate-950 border border-slate-800 rounded-lg text-white placeholder-slate-500 focus:outline-none focus:border-amber-500"
          />
        </div>

        <label className="flex items-center gap-2 text-xs text-slate-300 cursor-pointer select-none">
          <input
            type="checkbox"
            checked={activeOnly}
            onChange={(e) => setActiveOnly(e.target.checked)}
            className="rounded border-slate-700 text-amber-500 focus:ring-amber-500/20 bg-slate-950"
          />
          <span>Mostrar únicamente almacenes activos</span>
        </label>
      </div>

      {/* Tabla DataGrid */}
      <div className="rounded-xl border border-slate-800 bg-slate-900/60 overflow-hidden shadow-lg">
        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs">
            <thead className="bg-slate-950/80 text-slate-400 font-semibold uppercase tracking-wider border-b border-slate-800">
              <tr>
                <th className="px-4 py-3.5">Código</th>
                <th className="px-4 py-3.5">Nombre del Almacén</th>
                <th className="px-4 py-3.5">Ubicación</th>
                <th className="px-4 py-3.5">Descripción</th>
                <th className="px-4 py-3.5">Estado</th>
                <th className="px-4 py-3.5 text-right">Acciones</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-800/60 text-slate-300">
              {loading ? (
                <tr>
                  <td colSpan={6} className="px-4 py-12 text-center text-slate-400">
                    <Loader2 className="w-6 h-6 animate-spin mx-auto text-amber-400 mb-2" />
                    <span>Cargando almacenes...</span>
                  </td>
                </tr>
              ) : filteredWarehouses.length === 0 ? (
                <tr>
                  <td colSpan={6} className="px-4 py-12 text-center text-slate-400">
                    <Database className="w-8 h-8 mx-auto text-slate-600 mb-2" />
                    <span>No se encontraron almacenes registrados.</span>
                  </td>
                </tr>
              ) : (
                filteredWarehouses.map((w) => (
                  <tr key={w.id} className="hover:bg-slate-800/40 transition-colors">
                    <td className="px-4 py-3 font-mono font-bold text-amber-400">
                      <span className="px-2 py-0.5 rounded bg-amber-500/10 border border-amber-500/20">
                        {w.code}
                      </span>
                    </td>
                    <td className="px-4 py-3 font-medium text-white">{w.name}</td>
                    <td className="px-4 py-3 text-slate-400">{w.location || "—"}</td>
                    <td className="px-4 py-3 text-slate-400 max-w-xs truncate">
                      {w.description || "—"}
                    </td>
                    <td className="px-4 py-3">
                      {w.isActive ? (
                        <span className="inline-flex items-center gap-1 px-2 py-0.5 text-[11px] font-medium rounded-full bg-emerald-500/10 text-emerald-400 border border-emerald-500/20">
                          <CheckCircle2 className="w-3 h-3" /> Activo
                        </span>
                      ) : (
                        <span className="inline-flex items-center gap-1 px-2 py-0.5 text-[11px] font-medium rounded-full bg-slate-500/10 text-slate-400 border border-slate-500/20">
                          <XCircle className="w-3 h-3" /> Inactivo
                        </span>
                      )}
                    </td>
                    <td className="px-4 py-3 text-right">
                      <div className="flex items-center justify-end gap-1">
                        <button
                          onClick={() => handleOpenEdit(w)}
                          title="Editar almacén"
                          className="p-1.5 rounded-lg text-slate-400 hover:text-amber-400 hover:bg-slate-800 transition-colors"
                        >
                          <Edit2 className="w-4 h-4" />
                        </button>
                        <button
                          onClick={() => handleDelete(w)}
                          title="Eliminar o desactivar almacén"
                          className="p-1.5 rounded-lg text-slate-400 hover:text-rose-400 hover:bg-slate-800 transition-colors"
                        >
                          <Trash2 className="w-4 h-4" />
                        </button>
                      </div>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </div>

      {/* Modal Formulario */}
      <Modal
        isOpen={isModalOpen}
        onClose={() => setIsModalOpen(false)}
        title={editingWarehouse ? `Editar Almacén (${editingWarehouse.code})` : "Nuevo Almacén"}
        description="Complete la información del almacén. El código debe ser único."
      >
        <form onSubmit={handleSubmit} className="space-y-4">
          {modalError && (
            <div className="flex items-center gap-2 p-3 text-xs rounded-lg bg-rose-500/10 border border-rose-500/30 text-rose-300">
              <AlertCircle className="w-4 h-4 flex-shrink-0" />
              <span>{modalError}</span>
            </div>
          )}

          <div>
            <label className="block text-xs font-medium text-slate-300 mb-1">
              Código de Almacén <span className="text-amber-400">*</span>
            </label>
            <input
              type="text"
              required
              placeholder="ej. ALM-001"
              value={formData.code}
              onChange={(e) => setFormData({ ...formData, code: e.target.value })}
              className="w-full px-3 py-2 text-xs bg-slate-950 border border-slate-700 rounded-lg text-white font-mono uppercase focus:outline-none focus:border-amber-500"
            />
          </div>

          <div>
            <label className="block text-xs font-medium text-slate-300 mb-1">
              Nombre del Almacén <span className="text-amber-400">*</span>
            </label>
            <input
              type="text"
              required
              placeholder="ej. Almacén de Materia Prima"
              value={formData.name}
              onChange={(e) => setFormData({ ...formData, name: e.target.value })}
              className="w-full px-3 py-2 text-xs bg-slate-950 border border-slate-700 rounded-lg text-white focus:outline-none focus:border-amber-500"
            />
          </div>

          <div>
            <label className="block text-xs font-medium text-slate-300 mb-1">
              Ubicación Física
            </label>
            <input
              type="text"
              placeholder="ej. Nave Industrial A - Zona Norte"
              value={formData.location}
              onChange={(e) => setFormData({ ...formData, location: e.target.value })}
              className="w-full px-3 py-2 text-xs bg-slate-950 border border-slate-700 rounded-lg text-white focus:outline-none focus:border-amber-500"
            />
          </div>

          <div>
            <label className="block text-xs font-medium text-slate-300 mb-1">
              Descripción
            </label>
            <textarea
              rows={3}
              placeholder="Notas u observaciones sobre el almacén..."
              value={formData.description}
              onChange={(e) => setFormData({ ...formData, description: e.target.value })}
              className="w-full px-3 py-2 text-xs bg-slate-950 border border-slate-700 rounded-lg text-white focus:outline-none focus:border-amber-500"
            />
          </div>

          <label className="flex items-center gap-2 text-xs text-slate-300 cursor-pointer pt-1">
            <input
              type="checkbox"
              checked={formData.isActive}
              onChange={(e) => setFormData({ ...formData, isActive: e.target.checked })}
              className="rounded border-slate-700 text-amber-500 focus:ring-amber-500/20 bg-slate-950"
            />
            <span>Almacén habilitado y activo</span>
          </label>

          <div className="flex items-center justify-end gap-2 pt-4 border-t border-slate-800">
            <button
              type="button"
              onClick={() => setIsModalOpen(false)}
              className="px-4 py-2 text-xs rounded-lg border border-slate-700 text-slate-300 hover:bg-slate-800 transition-colors"
            >
              Cancelar
            </button>
            <button
              type="submit"
              disabled={isSubmitting}
              className="flex items-center gap-1.5 px-4 py-2 text-xs font-semibold rounded-lg text-white bg-gradient-to-r from-amber-600 to-amber-500 hover:from-amber-500 hover:to-amber-400 shadow-md shadow-amber-600/30 transition-all disabled:opacity-50 cursor-pointer"
            >
              {isSubmitting && <Loader2 className="w-3.5 h-3.5 animate-spin" />}
              <span>{editingWarehouse ? "Guardar Cambios" : "Crear Almacén"}</span>
            </button>
          </div>
        </form>
      </Modal>
    </div>
  );
}
