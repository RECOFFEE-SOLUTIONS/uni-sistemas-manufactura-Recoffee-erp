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
} from "lucide-react";
import apiClient from "@/lib/api";
import { Item } from "@/types";
import { useToast } from "@/context/ToastContext";
import Modal from "@/components/Modal";

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
    if (!formData.code.trim() || !formData.name.trim() || !formData.category.trim()) {
      setModalError("El código, nombre y categoría son obligatorios.");
      return;
    }

    if (formData.cost < 0 || formData.standardCost < 0) {
      setModalError("Los costos no pueden ser negativos.");
      return;
    }

    setIsSubmitting(true);
    setModalError(null);

    const payload = {
      code: formData.code.trim().toUpperCase(),
      name: formData.name.trim(),
      description: formData.description.trim() || null,
      category: formData.category.trim().toUpperCase(),
      unitOfMeasure: formData.unitOfMeasure.trim(),
      cost: Number(formData.cost),
      standardCost: Number(formData.standardCost),
      isActive: formData.isActive,
    };

    try {
      if (editingItem) {
        await apiClient.put(`/api/items/${editingItem.id}`, {
          ...editingItem,
          ...payload,
        });
        showToast(`Artículo ${payload.code} actualizado exitosamente`, "success");
      } else {
        await apiClient.post("/api/items", payload);
        showToast(`Artículo ${payload.code} creado exitosamente`, "success");
      }
      setIsModalOpen(false);
      fetchItems();
    } catch (err: unknown) {
      if (err && typeof err === "object" && "response" in err) {
        const axErr = err as { response?: { status?: number; data?: { message?: string } } };
        const msg = axErr.response?.data?.message || "Ocurrió un error al procesar el artículo.";
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

  const handleDelete = async (item: Item) => {
    if (!confirm(`¿Está seguro de eliminar o desactivar el artículo "${item.code} - ${item.name}"?`)) {
      return;
    }

    try {
      const res = await apiClient.delete(`/api/items/${item.id}`);
      showToast(res.data?.message || `Artículo ${item.code} procesado`, "success");
      fetchItems();
    } catch {
      showToast("Error al intentar eliminar el artículo", "error");
    }
  };

  const getCategoryBadge = (cat: string) => {
    switch (cat.toUpperCase()) {
      case "MP":
        return "bg-amber-500/10 text-amber-400 border-amber-500/30";
      case "EMP":
        return "bg-cyan-500/10 text-cyan-400 border-cyan-500/30";
      case "SEM":
        return "bg-purple-500/10 text-purple-400 border-purple-500/30";
      case "PT":
        return "bg-emerald-500/10 text-emerald-400 border-emerald-500/30";
      default:
        return "bg-slate-500/10 text-slate-400 border-slate-500/30";
    }
  };

  const getCategoryName = (cat: string) => {
    switch (cat.toUpperCase()) {
      case "MP":
        return "Materia Prima (MP)";
      case "EMP":
        return "Empaque (EMP)";
      case "SEM":
        return "Semielaborado (SEM)";
      case "PT":
        return "Producto Terminado (PT)";
      default:
        return cat;
    }
  };

  return (
    <div className="space-y-6 max-w-7xl mx-auto">
      {/* Cabecera */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 p-5 rounded-2xl bg-slate-900 border border-slate-800">
        <div className="flex items-center gap-3">
          <div className="flex items-center justify-center w-12 h-12 rounded-xl bg-amber-500/10 border border-amber-500/30 text-amber-400">
            <Boxes className="w-6 h-6" />
          </div>
          <div>
            <h1 className="text-xl font-bold text-white tracking-tight">
              Catálogo de Artículos y Productos
            </h1>
            <p className="text-xs text-slate-400">
              Gestión de Materias Primas (MP), Empaques (EMP), Semielaborados (SEM) y Producto Terminado (PT)
            </p>
          </div>
        </div>

        <div className="flex items-center gap-2">
          <button
            onClick={fetchItems}
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
            <span>Nuevo Artículo</span>
          </button>
        </div>
      </div>

      {/* Pestañas de Categoría y Filtros */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-3 p-4 rounded-xl bg-slate-900/60 border border-slate-800">
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
              className={`px-3 py-1.5 rounded-lg text-xs font-semibold transition-colors cursor-pointer ${
                selectedCategory === cat.id
                  ? "bg-amber-600 text-white shadow-sm"
                  : "bg-slate-800/80 text-slate-300 hover:bg-slate-700 hover:text-white"
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
              placeholder="Buscar artículo..."
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
            <span>Activos</span>
          </label>
        </div>
      </div>

      {/* Tabla DataGrid */}
      <div className="rounded-xl border border-slate-800 bg-slate-900/60 overflow-hidden shadow-lg">
        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs">
            <thead className="bg-slate-950/80 text-slate-400 font-semibold uppercase tracking-wider border-b border-slate-800">
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
            <tbody className="divide-y divide-slate-800/60 text-slate-300">
              {loading ? (
                <tr>
                  <td colSpan={8} className="px-4 py-12 text-center text-slate-400">
                    <Loader2 className="w-6 h-6 animate-spin mx-auto text-amber-400 mb-2" />
                    <span>Cargando artículos...</span>
                  </td>
                </tr>
              ) : filteredItems.length === 0 ? (
                <tr>
                  <td colSpan={8} className="px-4 py-12 text-center text-slate-400">
                    <Boxes className="w-8 h-8 mx-auto text-slate-600 mb-2" />
                    <span>No se encontraron artículos con los filtros aplicados.</span>
                  </td>
                </tr>
              ) : (
                filteredItems.map((i) => (
                  <tr key={i.id} className="hover:bg-slate-800/40 transition-colors">
                    <td className="px-4 py-3 font-mono font-bold text-amber-400">
                      <span className="px-2 py-0.5 rounded bg-slate-950 border border-slate-800">
                        {i.code}
                      </span>
                    </td>
                    <td className="px-4 py-3 font-medium text-white">{i.name}</td>
                    <td className="px-4 py-3">
                      <span
                        className={`inline-block px-2 py-0.5 rounded text-[11px] font-semibold border ${getCategoryBadge(
                          i.category
                        )}`}
                      >
                        {i.category}
                      </span>
                    </td>
                    <td className="px-4 py-3 text-slate-300 font-mono">{i.unitOfMeasure}</td>
                    <td className="px-4 py-3 font-mono text-emerald-400 font-medium">
                      C$ {Number(i.cost).toFixed(2)}
                    </td>
                    <td className="px-4 py-3 font-mono text-slate-400">
                      C$ {Number(i.standardCost).toFixed(2)}
                    </td>
                    <td className="px-4 py-3">
                      {i.isActive ? (
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
                          onClick={() => handleOpenEdit(i)}
                          title="Editar artículo"
                          className="p-1.5 rounded-lg text-slate-400 hover:text-amber-400 hover:bg-slate-800 transition-colors"
                        >
                          <Edit2 className="w-4 h-4" />
                        </button>
                        <button
                          onClick={() => handleDelete(i)}
                          title="Eliminar o desactivar artículo"
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
        title={editingItem ? `Editar Artículo (${editingItem.code})` : "Nuevo Artículo"}
        description="Configure las propiedades, categoría y costos en Córdobas (C$)."
      >
        <form onSubmit={handleSubmit} className="space-y-4">
          {modalError && (
            <div className="flex items-center gap-2 p-3 text-xs rounded-lg bg-rose-500/10 border border-rose-500/30 text-rose-300">
              <AlertCircle className="w-4 h-4 flex-shrink-0" />
              <span>{modalError}</span>
            </div>
          )}

          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="block text-xs font-medium text-slate-300 mb-1">
                Código <span className="text-amber-400">*</span>
              </label>
              <input
                type="text"
                required
                placeholder="ej. PT-001 o MP-001"
                value={formData.code}
                onChange={(e) => setFormData({ ...formData, code: e.target.value })}
                className="w-full px-3 py-2 text-xs bg-slate-950 border border-slate-700 rounded-lg text-white font-mono uppercase focus:outline-none focus:border-amber-500"
              />
            </div>

            <div>
              <label className="block text-xs font-medium text-slate-300 mb-1">
                Categoría <span className="text-amber-400">*</span>
              </label>
              <select
                value={formData.category}
                onChange={(e) => setFormData({ ...formData, category: e.target.value })}
                className="w-full px-3 py-2 text-xs bg-slate-950 border border-slate-700 rounded-lg text-white focus:outline-none focus:border-amber-500"
              >
                <option value="MP">Materia Prima (MP)</option>
                <option value="EMP">Empaque (EMP)</option>
                <option value="SEM">Semielaborado (SEM)</option>
                <option value="PT">Producto Terminado (PT)</option>
              </select>
            </div>
          </div>

          <div>
            <label className="block text-xs font-medium text-slate-300 mb-1">
              Nombre del Artículo <span className="text-amber-400">*</span>
            </label>
            <input
              type="text"
              required
              placeholder="ej. Harina de Café ReCoffee 500g"
              value={formData.name}
              onChange={(e) => setFormData({ ...formData, name: e.target.value })}
              className="w-full px-3 py-2 text-xs bg-slate-950 border border-slate-700 rounded-lg text-white focus:outline-none focus:border-amber-500"
            />
          </div>

          <div className="grid grid-cols-3 gap-3">
            <div>
              <label className="block text-xs font-medium text-slate-300 mb-1">
                Unidad Medida <span className="text-amber-400">*</span>
              </label>
              <input
                type="text"
                required
                placeholder="kg, bolsa, unidad"
                value={formData.unitOfMeasure}
                onChange={(e) => setFormData({ ...formData, unitOfMeasure: e.target.value })}
                className="w-full px-3 py-2 text-xs bg-slate-950 border border-slate-700 rounded-lg text-white focus:outline-none focus:border-amber-500"
              />
            </div>

            <div>
              <label className="block text-xs font-medium text-slate-300 mb-1">
                Costo Unit. (C$)
              </label>
              <input
                type="number"
                step="0.01"
                min="0"
                value={formData.cost}
                onChange={(e) => setFormData({ ...formData, cost: parseFloat(e.target.value) || 0 })}
                className="w-full px-3 py-2 text-xs bg-slate-950 border border-slate-700 rounded-lg text-white font-mono focus:outline-none focus:border-amber-500"
              />
            </div>

            <div>
              <label className="block text-xs font-medium text-slate-300 mb-1">
                Costo Estándar (C$)
              </label>
              <input
                type="number"
                step="0.01"
                min="0"
                value={formData.standardCost}
                onChange={(e) =>
                  setFormData({ ...formData, standardCost: parseFloat(e.target.value) || 0 })
                }
                className="w-full px-3 py-2 text-xs bg-slate-950 border border-slate-700 rounded-lg text-white font-mono focus:outline-none focus:border-amber-500"
              />
            </div>
          </div>

          <div>
            <label className="block text-xs font-medium text-slate-300 mb-1">
              Descripción / Especificaciones
            </label>
            <textarea
              rows={2}
              placeholder="Detalles sobre el material, especificaciones técnicas..."
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
            <span>Artículo disponible y activo</span>
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
              <span>{editingItem ? "Guardar Cambios" : "Crear Artículo"}</span>
            </button>
          </div>
        </form>
      </Modal>
    </div>
  );
}
