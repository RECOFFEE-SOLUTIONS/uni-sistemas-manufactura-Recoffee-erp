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
  Tag,
  MapPin,
  FileText,
} from "lucide-react";
import apiClient from "@/lib/api";
import { Warehouse } from "@/types";
import { useToast } from "@/context/ToastContext";
import Modal from "@/components/Modal";
import ActionTooltipButton from "@/components/ActionTooltip";

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
    location: "",
    description: "",
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
      showToast("Error al cargar los almacenes desde el servidor", "error");
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
      location: "",
      description: "",
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
      location: w.location || "",
      description: w.description || "",
      isActive: w.isActive,
    });
    setModalError(null);
    setIsModalOpen(true);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsSubmitting(true);
    setModalError(null);

    try {
      if (editingWarehouse) {
        await apiClient.put(`/api/warehouses/${editingWarehouse.id}`, formData);
        showToast(`Almacén ${formData.code} actualizado correctamente`, "success");
      } else {
        await apiClient.post("/api/warehouses", formData);
        showToast(`Almacén ${formData.code} creado exitosamente`, "success");
      }
      setIsModalOpen(false);
      fetchWarehouses();
    } catch (err: unknown) {
      const errorMsg =
        (err as { response?: { data?: { message?: string } } }).response?.data?.message ||
        "Error al procesar la solicitud del almacén.";
      setModalError(errorMsg);
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleDelete = async (w: Warehouse) => {
    if (!confirm(`¿Está seguro de eliminar o desactivar el almacén ${w.code} - ${w.name}?`)) {
      return;
    }
    try {
      await apiClient.delete(`/api/warehouses/${w.id}`);
      showToast(`Almacén ${w.code} procesado correctamente`, "success");
      fetchWarehouses();
    } catch {
      showToast("No se pudo eliminar el almacén (puede tener stock asociado)", "error");
    }
  };

  return (
    <div className="space-y-6">
      {/* Encabezado */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <div className="flex items-center gap-2">
            <span className="px-2.5 py-0.5 rounded-full text-xs font-semibold bg-amber-500/10 text-amber-600 dark:text-amber-400 border border-amber-500/20">
              Datos Maestros • M1
            </span>
            <span className="text-xs text-slate-400 font-mono">
              Total: {filteredWarehouses.length} almacenes
            </span>
          </div>
          <h1 className="text-2xl font-bold tracking-tight text-slate-900 dark:text-white mt-1">
            Gestión de Almacenes (ALM)
          </h1>
          <p className="text-xs text-slate-500 dark:text-slate-400">
            Centros de almacenamiento: Materias Primas (ALM-001), Proceso WIP (ALM-002), Terminado (ALM-003) e Insumos (ALM-004).
          </p>
        </div>

        <div className="flex items-center gap-2">
          <button
            onClick={fetchWarehouses}
            disabled={loading}
            title="Recargar almacenes"
            className="p-2.5 rounded-xl border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 text-slate-600 dark:text-slate-300 hover:bg-slate-100 dark:hover:bg-slate-700 transition-colors cursor-pointer"
          >
            <RefreshCw className={`w-4 h-4 ${loading ? "animate-spin text-amber-500" : ""}`} />
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

      {/* Buscador y Filtros */}
      <div className="flex flex-col sm:flex-row items-center justify-between gap-4 p-4 rounded-2xl bg-white dark:bg-[#161821] border border-slate-200/80 dark:border-slate-800/80 shadow-xs">
        <div className="relative w-full sm:w-80">
          <Search className="absolute left-3 top-2.5 w-4 h-4 text-slate-400" />
          <input
            type="text"
            placeholder="Buscar por código, nombre o ubicación..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="w-full pl-9 pr-3 py-2 text-xs bg-slate-100 dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-xl text-slate-900 dark:text-white placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-amber-500"
          />
        </div>

        <div
          onClick={() => setActiveOnly(!activeOnly)}
          className="flex items-center gap-2 text-xs text-slate-600 dark:text-slate-300 cursor-pointer select-none"
        >
          <input
            type="checkbox"
            checked={activeOnly}
            onChange={(e) => setActiveOnly(e.target.checked)}
            className="rounded border-slate-300 dark:border-slate-700 text-amber-500 focus:ring-amber-500/20 bg-slate-100 dark:bg-slate-900"
          />
          <span>Mostrar únicamente almacenes activos</span>
        </div>
      </div>

      {/* Tabla DataGrid */}
      <div className="rounded-2xl border border-slate-200/80 dark:border-slate-800/80 bg-white dark:bg-[#161821] overflow-hidden shadow-xs">
        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs">
            <thead className="bg-slate-50 dark:bg-[#11131a] text-slate-500 dark:text-slate-400 font-semibold uppercase tracking-wider border-b border-slate-200 dark:border-slate-800">
              <tr>
                <th className="px-4 py-3.5">Código</th>
                <th className="px-4 py-3.5">Nombre del Almacén</th>
                <th className="px-4 py-3.5">Ubicación</th>
                <th className="px-4 py-3.5">Descripción</th>
                <th className="px-4 py-3.5">Estado</th>
                <th className="px-4 py-3.5 text-right">Acciones</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100 dark:divide-slate-800/60 text-slate-700 dark:text-slate-300">
              {loading ? (
                <tr>
                  <td colSpan={6} className="px-4 py-12 text-center text-slate-400">
                    <Loader2 className="w-6 h-6 animate-spin mx-auto text-amber-500 mb-2" />
                    <span>Cargando almacenes...</span>
                  </td>
                </tr>
              ) : filteredWarehouses.length === 0 ? (
                <tr>
                  <td colSpan={6} className="px-4 py-12 text-center text-slate-400">
                    <Database className="w-8 h-8 mx-auto text-slate-400 mb-2" />
                    <span>No se encontraron almacenes registrados.</span>
                  </td>
                </tr>
              ) : (
                filteredWarehouses.map((w) => (
                  <tr key={w.id} className="hover:bg-slate-50 dark:hover:bg-slate-800/40 transition-colors">
                    <td className="px-4 py-3 font-mono font-bold text-amber-600 dark:text-amber-400">
                      <span className="px-2 py-0.5 rounded-md bg-amber-500/10 border border-amber-500/20">
                        {w.code}
                      </span>
                    </td>
                    <td className="px-4 py-3 font-medium text-slate-900 dark:text-white">{w.name}</td>
                    <td className="px-4 py-3 text-slate-500 dark:text-slate-400">{w.location || "—"}</td>
                    <td className="px-4 py-3 text-slate-500 dark:text-slate-400 max-w-xs truncate">
                      {w.description || "—"}
                    </td>
                    <td className="px-4 py-3">
                      {w.isActive ? (
                        <span className="inline-flex items-center gap-1 px-2 py-0.5 text-[11px] font-medium rounded-full bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 border border-emerald-500/20">
                          <CheckCircle2 className="w-3 h-3" /> Activo
                        </span>
                      ) : (
                        <span className="inline-flex items-center gap-1 px-2 py-0.5 text-[11px] font-medium rounded-full bg-slate-500/10 text-slate-500 dark:text-slate-400 border border-slate-500/20">
                          <XCircle className="w-3 h-3" /> Inactivo
                        </span>
                      )}
                    </td>
                    <td className="px-4 py-3 text-right">
                      <div className="flex items-center justify-end gap-1">
                        <ActionTooltipButton
                          icon={Edit2}
                          tooltip="Editar Almacén"
                          onClick={() => handleOpenEdit(w)}
                          variant="warning"
                        />
                        <ActionTooltipButton
                          icon={Trash2}
                          tooltip="Eliminar / Desactivar Almacén"
                          onClick={() => handleDelete(w)}
                          variant="danger"
                        />
                      </div>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </div>

      {/* Modal Formulario: Sin etiquetas <label> */}
      <Modal
        isOpen={isModalOpen}
        onClose={() => setIsModalOpen(false)}
        title={editingWarehouse ? `Editar Almacén (${editingWarehouse.code})` : "Nuevo Almacén"}
        description="Complete la información del almacén. El código debe ser único."
      >
        <form onSubmit={handleSubmit} className="space-y-4">
          {modalError && (
            <div className="flex items-center gap-2 p-3 text-xs rounded-xl bg-rose-500/10 border border-rose-500/30 text-rose-500 dark:text-rose-400">
              <AlertCircle className="w-4 h-4 shrink-0" />
              <span>{modalError}</span>
            </div>
          )}

          <div className="relative">
            <Tag className="absolute left-3 top-2.5 w-4 h-4 text-slate-400" />
            <input
              type="text"
              required
              placeholder="Código de Almacén (ej. ALM-001) *"
              value={formData.code}
              onChange={(e) => setFormData({ ...formData, code: e.target.value })}
              className="w-full pl-9 pr-3 py-2 text-xs bg-slate-100 dark:bg-slate-900 border border-slate-200 dark:border-slate-700 rounded-xl text-slate-900 dark:text-white font-mono uppercase focus:outline-none focus:ring-2 focus:ring-amber-500"
            />
          </div>

          <div className="relative">
            <Database className="absolute left-3 top-2.5 w-4 h-4 text-slate-400" />
            <input
              type="text"
              required
              placeholder="Nombre del Almacén (ej. Almacén de Materia Prima) *"
              value={formData.name}
              onChange={(e) => setFormData({ ...formData, name: e.target.value })}
              className="w-full pl-9 pr-3 py-2 text-xs bg-slate-100 dark:bg-slate-900 border border-slate-200 dark:border-slate-700 rounded-xl text-slate-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-amber-500"
            />
          </div>

          <div className="relative">
            <MapPin className="absolute left-3 top-2.5 w-4 h-4 text-slate-400" />
            <input
              type="text"
              placeholder="Ubicación Física (ej. Nave Industrial A - Zona Norte)"
              value={formData.location}
              onChange={(e) => setFormData({ ...formData, location: e.target.value })}
              className="w-full pl-9 pr-3 py-2 text-xs bg-slate-100 dark:bg-slate-900 border border-slate-200 dark:border-slate-700 rounded-xl text-slate-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-amber-500"
            />
          </div>

          <div className="relative">
            <FileText className="absolute left-3 top-3 w-4 h-4 text-slate-400" />
            <textarea
              rows={3}
              placeholder="Descripción y notas operacionales sobre el almacén..."
              value={formData.description}
              onChange={(e) => setFormData({ ...formData, description: e.target.value })}
              className="w-full pl-9 pr-3 py-2 text-xs bg-slate-100 dark:bg-slate-900 border border-slate-200 dark:border-slate-700 rounded-xl text-slate-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-amber-500"
            />
          </div>

          <div
            onClick={() => setFormData({ ...formData, isActive: !formData.isActive })}
            className="flex items-center gap-2 text-xs text-slate-600 dark:text-slate-300 cursor-pointer pt-1 select-none"
          >
            <input
              type="checkbox"
              checked={formData.isActive}
              onChange={(e) => setFormData({ ...formData, isActive: e.target.checked })}
              className="rounded border-slate-300 dark:border-slate-700 text-amber-500 focus:ring-amber-500/20 bg-slate-100 dark:bg-slate-900"
            />
            <span>Almacén habilitado y activo para inventario</span>
          </div>

          <div className="flex items-center justify-end gap-2 pt-4 border-t border-slate-200 dark:border-slate-800">
            <button
              type="button"
              onClick={() => setIsModalOpen(false)}
              className="px-4 py-2 text-xs rounded-xl border border-slate-200 dark:border-slate-700 text-slate-600 dark:text-slate-300 hover:bg-slate-100 dark:hover:bg-slate-800 transition-colors cursor-pointer"
            >
              Cancelar
            </button>
            <button
              type="submit"
              disabled={isSubmitting}
              className="flex items-center gap-1.5 px-4 py-2 text-xs font-semibold rounded-xl text-white bg-gradient-to-r from-amber-600 to-amber-500 hover:from-amber-500 hover:to-amber-400 shadow-md shadow-amber-600/30 transition-all disabled:opacity-50 cursor-pointer"
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
