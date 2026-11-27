import { useState, useEffect, useRef } from 'react';
import { CalendarDays, Plus, Edit2, Trash2, Loader2, Sparkles } from 'lucide-react';
import api from '../services/api';
import useAuthStore from '../store/useAuthStore';
import { toast, confirmAction } from '../store/useUIStore';

const HolidaysPage = () => {
    const { user } = useAuthStore();
    const canManage = ['admin', 'hr'].includes(user?.role);

    const [holidays, setHolidays] = useState([]);
    const [loading, setLoading] = useState(true);
    const [saving, setSaving] = useState(false);

    const [name, setName] = useState('');
    const [date, setDate] = useState('');
    const [type, setType] = useState('national');
    const [editingId, setEditingId] = useState(null);
    const formRef = useRef(null);
    const nameInputRef = useRef(null);

    const fetchHolidays = async () => {
        try {
            setLoading(true);
            const { data } = await api.get('/holidays');
            const sorted = [...(data.data || [])].sort((a, b) => new Date(a.date) - new Date(b.date));
            setHolidays(sorted);
        } catch (error) {
            console.error('Error fetching holidays:', error);
            toast.error('Failed to load holidays');
        } finally {
            setLoading(false);
        }
    };

    useEffect(() => {
        fetchHolidays();
    }, []);

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
            fetchHolidays();
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
        formRef.current?.scrollIntoView({ behavior: 'smooth', block: 'center' });
        setTimeout(() => nameInputRef.current?.focus(), 150);
    };

    const handleDelete = async (holiday) => {
        const confirmed = await confirmAction({
            title: 'Delete Holiday',
            message: `Remove "${holiday.name}" from the holiday list? It will no longer appear in Upcoming Holidays.`,
            confirmText: 'Delete',
            variant: 'danger'
        });
        if (!confirmed) return;

        setSaving(true);
        try {
            await api.delete(`/holidays/${holiday._id}`);
            toast.success('Holiday removed');
            if (editingId === holiday._id) resetForm();
            fetchHolidays();
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
            fetchHolidays();
        } catch (error) {
            toast.error(error.response?.data?.message || 'Failed to load defaults');
        } finally {
            setSaving(false);
        }
    };

    return (
        <div className="space-y-6">
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
                <div>
                    <h1 className="text-2xl font-bold text-slate-900 tracking-tight">Holiday Manager</h1>
                    <p className="text-sm text-slate-500 mt-0.5">
                        {canManage
                            ? 'Add, update, or remove company holidays. Changes sync with Upcoming Holidays on the Dashboard.'
                            : 'View the official company holiday schedule.'}
                    </p>
                </div>
                {canManage && holidays.length === 0 && (
                    <button
                        type="button"
                        onClick={handleSeedDefaults}
                        disabled={saving}
                        className="inline-flex items-center gap-2 px-4 py-2.5 bg-emerald-600 hover:bg-emerald-700 text-white text-xs font-bold rounded-xl shadow-sm transition-all disabled:opacity-50"
                    >
                        <Sparkles size={15} />
                        Load 2026–2027 Defaults
                    </button>
                )}
            </div>

            {canManage && (
                <form ref={formRef} onSubmit={handleSubmit} className="bg-white rounded-2xl border border-slate-200/80 shadow-sm p-5 sm:p-6">
                    <h2 className="text-sm font-bold text-slate-900 mb-4">
                        {editingId ? 'Edit Holiday' : 'Add New Holiday'}
                    </h2>
                    <div className="grid grid-cols-1 sm:grid-cols-12 gap-4 items-end">
                        <div className="sm:col-span-5">
                            <label htmlFor="page-holiday-name" className="block text-xs font-bold text-slate-600 uppercase mb-1.5">Holiday Name</label>
                            <input
                                ref={nameInputRef}
                                id="page-holiday-name"
                                type="text"
                                required
                                value={name}
                                onChange={(e) => setName(e.target.value)}
                                placeholder="e.g. Republic Day"
                                className="w-full px-3.5 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-sm outline-none focus:ring-2 focus:ring-primary-500 focus:bg-white"
                            />
                        </div>
                        <div className="sm:col-span-3">
                            <label htmlFor="page-holiday-date" className="block text-xs font-bold text-slate-600 uppercase mb-1.5">Date</label>
                            <input
                                id="page-holiday-date"
                                type="date"
                                required
                                value={date}
                                onChange={(e) => setDate(e.target.value)}
                                className="w-full px-3.5 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-sm outline-none focus:ring-2 focus:ring-primary-500 focus:bg-white"
                            />
                        </div>
                        <div className="sm:col-span-2">
                            <label htmlFor="page-holiday-type" className="block text-xs font-bold text-slate-600 uppercase mb-1.5">Type</label>
                            <select
                                id="page-holiday-type"
                                value={type}
                                onChange={(e) => setType(e.target.value)}
                                className="w-full px-3.5 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-sm outline-none focus:ring-2 focus:ring-primary-500 focus:bg-white"
                            >
                                <option value="national">National</option>
                                <option value="regional">Regional</option>
                                <option value="company">Company</option>
                            </select>
                        </div>
                        <div className="sm:col-span-2 flex gap-2">
                            <button
                                type="submit"
                                disabled={saving}
                                className="flex-1 inline-flex items-center justify-center gap-1.5 px-4 py-2.5 bg-primary-600 hover:bg-primary-700 text-white text-xs font-bold rounded-xl shadow-sm transition-all disabled:opacity-50"
                            >
                                {saving ? <Loader2 className="animate-spin" size={15} /> : <Plus size={15} />}
                                {editingId ? 'Update' : 'Add'}
                            </button>
                            {editingId && (
                                <button
                                    type="button"
                                    onClick={resetForm}
                                    className="px-3 py-2.5 text-xs font-semibold text-slate-600 bg-slate-100 hover:bg-slate-200 rounded-xl transition-colors"
                                >
                                    Cancel
                                </button>
                            )}
                        </div>
                    </div>
                </form>
            )}

            <div className="bg-white rounded-2xl border border-slate-200/80 shadow-sm overflow-hidden">
                <div className="px-6 py-4 border-b border-slate-100 flex items-center justify-between bg-slate-50/70">
                    <div className="flex items-center gap-2 font-bold text-slate-900 text-sm">
                        <CalendarDays size={17} className="text-emerald-600" />
                        Configured Holidays
                    </div>
                    <span className="text-xs font-semibold text-slate-500">{holidays.length} total</span>
                </div>

                {loading ? (
                    <div className="py-16 flex justify-center">
                        <Loader2 className="animate-spin text-primary-600" size={32} />
                    </div>
                ) : holidays.length === 0 ? (
                    <div className="py-14 text-center space-y-3">
                        <p className="text-sm text-slate-500">No holidays found in the database.</p>
                        {canManage && (
                            <button
                                type="button"
                                onClick={handleSeedDefaults}
                                disabled={saving}
                                className="inline-flex items-center gap-1.5 px-4 py-2 bg-emerald-50 text-emerald-700 border border-emerald-200 rounded-xl text-xs font-bold hover:bg-emerald-100 transition-colors"
                            >
                                <Sparkles size={14} />
                                Load Default 2026–2027 Holidays
                            </button>
                        )}
                    </div>
                ) : (
                    <div className="overflow-x-auto">
                        <table className="w-full text-left">
                            <thead className="bg-slate-50 text-slate-500 text-xs font-bold uppercase tracking-wider border-b border-slate-100">
                                <tr>
                                    <th className="px-6 py-3.5">Holiday</th>
                                    <th className="px-6 py-3.5">Date</th>
                                    <th className="px-6 py-3.5">Type</th>
                                    {canManage && <th className="px-6 py-3.5 text-center">Actions</th>}
                                </tr>
                            </thead>
                            <tbody className="divide-y divide-slate-100 text-sm">
                                {holidays.map((h) => (
                                    <tr key={h._id} className="hover:bg-slate-50/70 transition-colors">
                                        <td className="px-6 py-3.5 font-bold text-slate-900">{h.name}</td>
                                        <td className="px-6 py-3.5 text-slate-600">
                                            {new Date(h.date).toLocaleDateString('en-US', {
                                                weekday: 'short',
                                                month: 'short',
                                                day: 'numeric',
                                                year: 'numeric'
                                            })}
                                        </td>
                                        <td className="px-6 py-3.5">
                                            <span className="px-2.5 py-1 rounded-lg bg-emerald-50 text-emerald-700 border border-emerald-100 text-xs font-bold uppercase">
                                                {h.type || 'national'}
                                            </span>
                                        </td>
                                        {canManage && (
                                            <td className="px-6 py-3.5">
                                                <div className="flex items-center justify-center gap-2">
                                                    <button
                                                        type="button"
                                                        onClick={() => handleEdit(h)}
                                                        className="p-2 text-blue-600 hover:bg-blue-50 rounded-lg transition-colors"
                                                        aria-label={`Edit ${h.name}`}
                                                    >
                                                        <Edit2 size={16} />
                                                    </button>
                                                    <button
                                                        type="button"
                                                        onClick={() => handleDelete(h)}
                                                        className="p-2 text-red-600 hover:bg-red-50 rounded-lg transition-colors"
                                                        aria-label={`Delete ${h.name}`}
                                                    >
                                                        <Trash2 size={16} />
                                                    </button>
                                                </div>
                                            </td>
                                        )}
                                    </tr>
                                ))}
                            </tbody>
                        </table>
                    </div>
                )}
            </div>
        </div>
    );
};

export default HolidaysPage;
