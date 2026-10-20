"use client";

import React, { useEffect, useState, useMemo } from "react";
import {
  Boxes,
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
  Layers,
  FileText,
  DollarSign,
  Coins,
  Scale,
  Check,
} from "lucide-react";
import apiClient from "@/lib/api";
import { Item } from "@/types";
import { useToast } from "@/context/ToastContext";
import Modal from "@/components/Modal";
import ActionTooltipButton from "@/components/ActionTooltip";

export default function ItemsPage() {
  const { showToast } = useToast();
  const [items, setItems] = useState<Item[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState("");
  const [selectedCategory, setSelectedCategory] = useState<string>("ALL");
  const [activeOnly, setActiveOnly] = useState(false);

  // Modal State
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editingItem, setEditingItem] = useState<Item | null>(null);
  const [formData, setFormData] = useState({
    code: "",
    name: "",
    description: "",
    category: "MP",
    unitOfMeasure: "kg",
    cost: 0,
    standardCost: 0,
    isActive: true,
  });
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [modalError, setModalError] = useState<string | null>(null);

  const fetchItems = async () => {
    setLoading(true);
    try {
      const res = await apiClient.get<Item[]>("/api/items", {
        params: {
          category: selectedCategory === "ALL" ? undefined : selectedCategory,
          activeOnly: activeOnly ? true : undefined,
        },
      });
      setItems(res.data);
    } catch {
      showToast("Error al cargar el catálogo de artículos desde la API", "error");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchItems();
  }, [selectedCategory, activeOnly]);

  const filteredItems = useMemo(() => {
    return items.filter(
      (i) =>
        i.code.toLowerCase().includes(searchTerm.toLowerCase()) ||
        i.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
        i.category.toLowerCase().includes(searchTerm.toLowerCase())
    );
  }, [items, searchTerm]);

  const handleOpenCreate = () => {
    setEditingItem(null);
    setFormData({
      code: "",
      name: "",
      description: "",
      category: "MP",
      unitOfMeasure: "kg",
      cost: 0,
      standardCost: 0,
      isActive: true,
    });
    setModalError(null);
    setIsModalOpen(true);
  };

  const handleOpenEdit = (i: Item) => {
    setEditingItem(i);
    setFormData({
      code: i.code,
      name: i.name,
      description: i.description || "",
      category: i.category,
      unitOfMeasure: i.unitOfMeasure,
      cost: i.cost,
      standardCost: i.standardCost,
      isActive: i.isActive,
    });
    setModalError(null);
    setIsModalOpen(true);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsSubmitting(true);
    setModalError(null);

    try {
      if (editingItem) {
        await apiClient.put(`/api/items/${editingItem.id}`, formData);
        showToast(`Artículo ${formData.code} actualizado correctamente`, "success");
      } else {
        await apiClient.post("/api/items", formData);
        showToast(`Artículo ${formData.code} creado exitosamente`, "success");
      }
      setIsModalOpen(false);
      fetchItems();
    } catch (err: unknown) {
      const errorMsg =
        (err as { response?: { data?: { message?: string } } }).response?.data?.message ||
        "Error al procesar la solicitud en el catálogo.";
      setModalError(errorMsg);
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleDelete = async (i: Item) => {
    if (!confirm(`¿Está seguro de eliminar o desactivar el artículo ${i.code} - ${i.name}?`)) {
      return;
    }
    try {
      await apiClient.delete(`/api/items/${i.id}`);
      showToast(`Artículo ${i.code} eliminado correctamente`, "success");
      fetchItems();
    } catch {
      showToast("No se pudo eliminar el artículo (puede tener transacciones asociadas)", "error");
    }
  };

  const getCategoryBadge = (cat: string) => {
    switch (cat) {
      case "MP":
        return "bg-emerald-500/10 text-emerald-500 dark:text-emerald-400 border-emerald-500/20";
      case "EMP":
        return "bg-blue-500/10 text-blue-500 dark:text-blue-400 border-blue-500/20";
      case "SEM":
        return "bg-amber-500/10 text-amber-500 dark:text-amber-400 border-amber-500/20";
      case "PT":
        return "bg-purple-500/10 text-purple-500 dark:text-purple-400 border-purple-500/20";
      default:
        return "bg-slate-500/10 text-slate-500 dark:text-slate-400 border-slate-500/20";
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
              Total: {filteredItems.length} artículos
            </span>
          </div>
          <h1 className="text-2xl font-bold tracking-tight text-slate-900 dark:text-white mt-1">
            Catálogo Maestro de Artículos
          </h1>
          <p className="text-xs text-slate-500 dark:text-slate-400">
            Administración de Materias Primas (MP), Empaques (EMP), Semielaborados (SEM) y Producto Terminado (PT).
          </p>
        </div>

        <div className="flex items-center gap-2">
          <button
            onClick={fetchItems}
            disabled={loading}
            title="Recargar catálogo"
            className="p-2.5 rounded-xl border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 text-slate-600 dark:text-slate-300 hover:bg-slate-100 dark:hover:bg-slate-700 transition-colors cursor-pointer"
          >
            <RefreshCw className={`w-4 h-4 ${loading ? "animate-spin text-amber-500" : ""}`} />
          </button>
          <button
            onClick={handleOpenCreate}
            className="flex items-center gap-2 px-4 py-2.5 rounded-xl text-xs font-semibold text-white bg-gradient-to-r from-amber-600 to-amber-500 hover:from-amber-500 hover:to-amber-400 shadow-md shadow-amber-600/30 transition-all cursor-pointer"
          >
            <Plus className="w-4 h-4" />
            <span>Nuevo Artículo</span>
          </button>
        </div>
      </div>

      {/* Pestañas de Categoría y Filtros */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-3 p-4 rounded-2xl bg-white dark:bg-[#161821] border border-slate-200/80 dark:border-slate-800/80 shadow-xs">
        <div className="flex flex-wrap items-center gap-1.5">
          {[
            { id: "ALL", label: "Todos" },
            { id: "MP", label: "Materia Prima (MP)" },
            { id: "EMP", label: "Empaque (EMP)" },
            { id: "SEM", label: "Semielaborado (SEM)" },
            { id: "PT", label: "Terminado (PT)" },
          ].map((cat) => (
            <button
              key={cat.id}
              onClick={() => setSelectedCategory(cat.id)}
              className={`px-3 py-1.5 rounded-xl text-xs font-semibold transition-colors cursor-pointer ${
                selectedCategory === cat.id
                  ? "bg-amber-500 text-white shadow-xs"
                  : "bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-300 hover:bg-slate-200 dark:hover:bg-slate-700"
              }`}
            >
              {cat.label}
            </button>
          ))}
        </div>

        <div className="flex items-center gap-3">
          <div className="relative flex-1 md:w-64">
            <Search className="absolute left-3 top-2.5 w-4 h-4 text-slate-400" />
            <input
              type="text"
              placeholder="Buscar por código o nombre..."
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
            <span>Activos</span>
          </div>
        </div>
      </div>

      {/* Tabla DataGrid */}
      <div className="rounded-2xl border border-slate-200/80 dark:border-slate-800/80 bg-white dark:bg-[#161821] overflow-hidden shadow-xs">
        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs">
            <thead className="bg-slate-50 dark:bg-[#11131a] text-slate-500 dark:text-slate-400 font-semibold uppercase tracking-wider border-b border-slate-200 dark:border-slate-800">
              <tr>
                <th className="px-4 py-3.5">Código</th>
                <th className="px-4 py-3.5">Nombre</th>
                <th className="px-4 py-3.5">Categoría</th>
                <th className="px-4 py-3.5">U.M.</th>
                <th className="px-4 py-3.5">Costo Unitario (C$)</th>
                <th className="px-4 py-3.5">Costo Estándar (C$)</th>
                <th className="px-4 py-3.5">Estado</th>
                <th className="px-4 py-3.5 text-right">Acciones</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100 dark:divide-slate-800/60 text-slate-700 dark:text-slate-300">
              {loading ? (
                <tr>
                  <td colSpan={8} className="px-4 py-12 text-center text-slate-400">
                    <Loader2 className="w-6 h-6 animate-spin mx-auto text-amber-500 mb-2" />
                    <span>Cargando artículos...</span>
                  </td>
                </tr>
              ) : filteredItems.length === 0 ? (
                <tr>
                  <td colSpan={8} className="px-4 py-12 text-center text-slate-400">
                    <Boxes className="w-8 h-8 mx-auto text-slate-400 mb-2" />
                    <span>No se encontraron artículos con los filtros aplicados.</span>
                  </td>
                </tr>
              ) : (
                filteredItems.map((i) => (
                  <tr key={i.id} className="hover:bg-slate-50 dark:hover:bg-slate-800/40 transition-colors">
                    <td className="px-4 py-3 font-mono font-bold text-amber-600 dark:text-amber-400">
                      <span className="px-2 py-0.5 rounded-md bg-slate-100 dark:bg-slate-900 border border-slate-200 dark:border-slate-800">
                        {i.code}
                      </span>
                    </td>
                    <td className="px-4 py-3 font-medium text-slate-900 dark:text-white">{i.name}</td>
                    <td className="px-4 py-3">
                      <span
                        className={`inline-block px-2 py-0.5 rounded-md text-[11px] font-semibold border ${getCategoryBadge(
                          i.category
                        )}`}
                      >
                        {i.category}
                      </span>
                    </td>
                    <td className="px-4 py-3 text-slate-600 dark:text-slate-300 font-mono">{i.unitOfMeasure}</td>
                    <td className="px-4 py-3 font-mono text-emerald-600 dark:text-emerald-400 font-medium">
                      C$ {Number(i.cost).toFixed(2)}
                    </td>
                    <td className="px-4 py-3 font-mono text-slate-500 dark:text-slate-400">
                      C$ {Number(i.standardCost).toFixed(2)}
                    </td>
                    <td className="px-4 py-3">
                      {i.isActive ? (
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
                          tooltip="Editar Artículo"
                          onClick={() => handleOpenEdit(i)}
                          variant="warning"
                        />
                        <ActionTooltipButton
                          icon={Trash2}
                          tooltip="Eliminar / Desactivar Artículo"
                          onClick={() => handleDelete(i)}
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
        title={editingItem ? `Editar Artículo (${editingItem.code})` : "Nuevo Artículo"}
        description="Configure las propiedades, categoría y costos en Córdobas (C$)."
      >
        <form onSubmit={handleSubmit} className="space-y-4">
          {modalError && (
            <div className="flex items-center gap-2 p-3 text-xs rounded-xl bg-rose-500/10 border border-rose-500/30 text-rose-500 dark:text-rose-400">
              <AlertCircle className="w-4 h-4 shrink-0" />
              <span>{modalError}</span>
            </div>
          )}

          <div className="grid grid-cols-2 gap-3">
            <div className="relative">
              <Tag className="absolute left-3 top-2.5 w-4 h-4 text-slate-400" />
              <input
                type="text"
                required
                placeholder="Código del Artículo (ej. PT-001) *"
                value={formData.code}
                onChange={(e) => setFormData({ ...formData, code: e.target.value })}
                className="w-full pl-9 pr-3 py-2 text-xs bg-slate-100 dark:bg-slate-900 border border-slate-200 dark:border-slate-700 rounded-xl text-slate-900 dark:text-white font-mono uppercase focus:outline-none focus:ring-2 focus:ring-amber-500"
              />
            </div>

            <div className="relative">
              <Layers className="absolute left-3 top-2.5 w-4 h-4 text-slate-400" />
              <select
                value={formData.category}
                onChange={(e) => setFormData({ ...formData, category: e.target.value })}
                className="w-full pl-9 pr-3 py-2 text-xs bg-slate-100 dark:bg-slate-900 border border-slate-200 dark:border-slate-700 rounded-xl text-slate-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-amber-500"
              >
                <option value="MP">Materia Prima (MP)</option>
                <option value="EMP">Empaque (EMP)</option>
                <option value="SEM">Semielaborado (SEM)</option>
                <option value="PT">Producto Terminado (PT)</option>
              </select>
            </div>
          </div>

          <div className="relative">
            <Boxes className="absolute left-3 top-2.5 w-4 h-4 text-slate-400" />
            <input
              type="text"
              required
              placeholder="Nombre comercial / técnico del artículo *"
              value={formData.name}
              onChange={(e) => setFormData({ ...formData, name: e.target.value })}
              className="w-full pl-9 pr-3 py-2 text-xs bg-slate-100 dark:bg-slate-900 border border-slate-200 dark:border-slate-700 rounded-xl text-slate-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-amber-500"
            />
          </div>

          <div className="grid grid-cols-3 gap-3">
            <div className="relative">
              <Scale className="absolute left-3 top-2.5 w-4 h-4 text-slate-400" />
              <input
                type="text"
                required
                placeholder="U.M. (kg, bolsa, und) *"
                value={formData.unitOfMeasure}
                onChange={(e) => setFormData({ ...formData, unitOfMeasure: e.target.value })}
                className="w-full pl-9 pr-3 py-2 text-xs bg-slate-100 dark:bg-slate-900 border border-slate-200 dark:border-slate-700 rounded-xl text-slate-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-amber-500"
              />
            </div>

            <div className="relative">
              <DollarSign className="absolute left-3 top-2.5 w-4 h-4 text-slate-400" />
              <input
                type="number"
                step="0.01"
                min="0"
                placeholder="Costo Unit. (C$)"
                value={formData.cost}
                onChange={(e) => setFormData({ ...formData, cost: parseFloat(e.target.value) || 0 })}
                className="w-full pl-9 pr-3 py-2 text-xs bg-slate-100 dark:bg-slate-900 border border-slate-200 dark:border-slate-700 rounded-xl text-slate-900 dark:text-white font-mono focus:outline-none focus:ring-2 focus:ring-amber-500"
              />
            </div>

            <div className="relative">
              <Coins className="absolute left-3 top-2.5 w-4 h-4 text-slate-400" />
              <input
                type="number"
                step="0.01"
                min="0"
                placeholder="Costo Estándar (C$)"
                value={formData.standardCost}
                onChange={(e) =>
                  setFormData({ ...formData, standardCost: parseFloat(e.target.value) || 0 })
                }
                className="w-full pl-9 pr-3 py-2 text-xs bg-slate-100 dark:bg-slate-900 border border-slate-200 dark:border-slate-700 rounded-xl text-slate-900 dark:text-white font-mono focus:outline-none focus:ring-2 focus:ring-amber-500"
              />
            </div>
          </div>

          <div className="relative">
            <FileText className="absolute left-3 top-3 w-4 h-4 text-slate-400" />
            <textarea
              rows={2}
              placeholder="Descripción y especificaciones técnicas del artículo..."
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
            <span>Artículo disponible y activo para operaciones</span>
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
              <span>{editingItem ? "Guardar Cambios" : "Crear Artículo"}</span>
            </button>
          </div>
        </form>
      </Modal>
    </div>
  );
}
