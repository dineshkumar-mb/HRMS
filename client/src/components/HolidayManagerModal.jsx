import { useState, useEffect, useRef } from 'react';
import { X, Plus, Edit2, Trash2, CalendarDays, Loader2, Sparkles } from 'lucide-react';
import api from '../services/api';
import { toast, confirmAction } from '../store/useUIStore';

const HolidayManagerModal = ({ isOpen, onClose, holidays, onHolidaysUpdated }) => {
    const [name, setName] = useState('');
    const [date, setDate] = useState('');
    const [type, setType] = useState('national');
    const [editingId, setEditingId] = useState(null);
    const [saving, setSaving] = useState(false);
    const nameInputRef = useRef(null);

    useEffect(() => {
        if (!isOpen) return;
        const onKeyDown = (e) => {
            if (e.key === 'Escape') onClose();
        };
        window.addEventListener('keydown', onKeyDown);
        return () => window.removeEventListener('keydown', onKeyDown);
    }, [isOpen, onClose]);

    if (!isOpen) return null;

    const resetForm = () => {
        setName('');
        setDate('');
        setType('national');
        setEditingId(null);
    };

    const handleSubmit = async (e) => {
        e.preventDefault();
        setSaving(true);
        try {
            if (editingId) {
                await api.put(`/holidays/${editingId}`, { name, date, type });
                toast.success('Holiday updated');
            } else {
                await api.post('/holidays', { name, date, type });
                toast.success('Holiday added');
            }
            resetForm();
            onHolidaysUpdated();
        } catch (error) {
            toast.error(error.response?.data?.message || 'Failed to save holiday');
        } finally {
            setSaving(false);
        }
    };

    const handleEdit = (holiday) => {
        setEditingId(holiday._id);
        setName(holiday.name);
        setDate(new Date(holiday.date).toISOString().slice(0, 10));
        setType(holiday.type || 'national');
        setTimeout(() => nameInputRef.current?.focus(), 50);
    };

    const handleDelete = async (holiday) => {
        const confirmed = await confirmAction({
            title: 'Delete Holiday',
            message: `Remove "${holiday.name}" from the holiday list? It will immediately disappear from Upcoming Holidays.`,
            confirmText: 'Delete',
            variant: 'danger'
        });
        if (!confirmed) return;

        setSaving(true);
        try {
            await api.delete(`/holidays/${holiday._id}`);
            toast.success('Holiday removed');
            if (editingId === holiday._id) resetForm();
            onHolidaysUpdated();
        } catch (error) {
            toast.error(error.response?.data?.message || 'Failed to delete holiday');
        } finally {
            setSaving(false);
        }
    };

    const handleSeedDefaults = async () => {
        setSaving(true);
        try {
            await api.post('/holidays/seed-defaults');
            toast.success('Default 2026–2027 holidays loaded');
            onHolidaysUpdated();
        } catch (error) {
            toast.error(error.response?.data?.message || 'Failed to load defaults');
        } finally {
            setSaving(false);
        }
    };

    return (
        <div
            className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/50 backdrop-blur-xs animate-fade-in"
            role="dialog"
            aria-modal="true"
            aria-labelledby="holiday-manager-title"
        >
            <div className="bg-white rounded-3xl w-full max-w-2xl p-6 shadow-2xl animate-zoom-in max-h-[90vh] flex flex-col">
                <div className="flex justify-between items-start mb-5">
                    <div className="flex items-center gap-3">
                        <div className="w-10 h-10 rounded-xl bg-emerald-50 text-emerald-600 flex items-center justify-center">
                            <CalendarDays size={20} />
                        </div>
                        <div>
                            <h3 id="holiday-manager-title" className="text-lg font-bold text-slate-900">Manage Company Holidays</h3>
                            <p className="text-xs text-slate-500">Add, edit, or remove holidays. Changes sync with Upcoming Holidays.</p>
                        </div>
                    </div>
                    <button
                        type="button"
                        onClick={onClose}
                        className="p-1.5 hover:bg-slate-100 rounded-xl text-slate-400 hover:text-slate-600 transition-colors"
                        aria-label="Close holiday manager"
                    >
                        <X size={18} />
                    </button>
                </div>

                {/* Add / Edit Form */}
                <form onSubmit={handleSubmit} className="grid grid-cols-1 sm:grid-cols-12 gap-3 p-4 bg-slate-50 rounded-2xl border border-slate-100 mb-5">
                    <div className="sm:col-span-5">
                        <label htmlFor="holiday-name" className="block text-[11px] font-bold text-slate-600 uppercase mb-1">Holiday Name</label>
                        <input
                            ref={nameInputRef}
                            id="holiday-name"
                            type="text"
                            required
                            value={name}
                            onChange={(e) => setName(e.target.value)}
                            placeholder="e.g. Diwali"
                            className="w-full px-3 py-2 bg-white border border-slate-200 rounded-xl text-sm outline-none focus:ring-2 focus:ring-primary-500"
                        />
                    </div>
                    <div className="sm:col-span-4">
                        <label htmlFor="holiday-date" className="block text-[11px] font-bold text-slate-600 uppercase mb-1">Date</label>
                        <input
                            id="holiday-date"
                            type="date"
                            required
                            value={date}
                            onChange={(e) => setDate(e.target.value)}
                            className="w-full px-3 py-2 bg-white border border-slate-200 rounded-xl text-sm outline-none focus:ring-2 focus:ring-primary-500"
                        />
                    </div>
                    <div className="sm:col-span-3">
                        <label htmlFor="holiday-type" className="block text-[11px] font-bold text-slate-600 uppercase mb-1">Type</label>
                        <select
                            id="holiday-type"
                            value={type}
                            onChange={(e) => setType(e.target.value)}
                            className="w-full px-3 py-2 bg-white border border-slate-200 rounded-xl text-sm outline-none focus:ring-2 focus:ring-primary-500"
                        >
                            <option value="national">National</option>
                            <option value="regional">Regional</option>
                            <option value="company">Company</option>
                        </select>
                    </div>
                    <div className="sm:col-span-12 flex justify-end gap-2 pt-1">
                        {editingId && (
                            <button
                                type="button"
                                onClick={resetForm}
                                className="px-3.5 py-2 text-xs font-semibold text-slate-600 hover:bg-slate-200 rounded-xl transition-colors"
                            >
                                Cancel Edit
                            </button>
                        )}
                        <button
                            type="submit"
                            disabled={saving}
                            className="inline-flex items-center gap-1.5 px-4 py-2 bg-primary-600 hover:bg-primary-700 text-white text-xs font-bold rounded-xl transition-all disabled:opacity-50"
                        >
                            {saving ? <Loader2 className="animate-spin" size={14} /> : <Plus size={14} />}
                            {editingId ? 'Update Holiday' : 'Add Holiday'}
                        </button>
                    </div>
                </form>

                {/* Holiday List */}
                <div className="flex-1 overflow-y-auto space-y-2 pr-1">
                    {holidays.length === 0 ? (
                        <div className="text-center py-10 space-y-3">
                            <p className="text-sm text-slate-500">No holidays configured yet.</p>
                            <button
                                type="button"
                                onClick={handleSeedDefaults}
                                disabled={saving}
                                className="inline-flex items-center gap-1.5 px-4 py-2 bg-emerald-50 text-emerald-700 border border-emerald-200 rounded-xl text-xs font-bold hover:bg-emerald-100 transition-colors"
                            >
                                <Sparkles size={14} />
                                Load Default 2026–2027 Holidays
                            </button>
                        </div>
                    ) : (
                        holidays.map((h) => (
                            <div key={h._id} className="flex items-center justify-between gap-3 p-3 rounded-xl border border-slate-100 hover:bg-slate-50 transition-colors">
                                <div className="flex items-center gap-3 min-w-0">
                                    <div className="w-10 h-10 rounded-xl bg-emerald-50 text-emerald-700 flex flex-col items-center justify-center shrink-0 font-bold leading-none">
                                        <span className="text-[9px] uppercase">{new Date(h.date).toLocaleDateString('en-US', { month: 'short' })}</span>
                                        <span className="text-sm">{new Date(h.date).getDate()}</span>
                                    </div>
                                    <div className="min-w-0">
                                        <p className="text-sm font-bold text-slate-900 truncate">{h.name}</p>
                                        <p className="text-xs text-slate-500">
                                            {new Date(h.date).toLocaleDateString('en-US', { weekday: 'short', month: 'short', day: 'numeric', year: 'numeric' })}
                                            {h.type && <span className="ml-2 uppercase text-[10px] font-bold text-slate-400">• {h.type}</span>}
                                        </p>
                                    </div>
                                </div>
                                <div className="flex items-center gap-1.5 shrink-0">
                                    <button
                                        type="button"
                                        onClick={() => handleEdit(h)}
                                        className="p-2 text-blue-600 hover:bg-blue-50 rounded-lg transition-colors"
                                        aria-label={`Edit ${h.name}`}
                                    >
                                        <Edit2 size={15} />
                                    </button>
                                    <button
                                        type="button"
                                        onClick={() => handleDelete(h)}
                                        className="p-2 text-red-600 hover:bg-red-50 rounded-lg transition-colors"
                                        aria-label={`Delete ${h.name}`}
                                    >
                                        <Trash2 size={15} />
                                    </button>
                                </div>
                            </div>
                        ))
                    )}
                </div>
            </div>
        </div>
    );
};

export default HolidayManagerModal;
