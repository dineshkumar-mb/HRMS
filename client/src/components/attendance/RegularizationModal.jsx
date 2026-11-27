import React, { useState, useEffect } from 'react';
import { X, Loader2 } from 'lucide-react';
import api from '../../services/api';
import { toast } from '../../store/useUIStore';

const RegularizationModal = ({ isOpen, onClose, onSuccess }) => {
    const [loading, setLoading] = useState(false);

    useEffect(() => {
        if (!isOpen) return;
        const onKeyDown = (e) => {
            if (e.key === 'Escape') onClose();
        };
        window.addEventListener('keydown', onKeyDown);
        return () => window.removeEventListener('keydown', onKeyDown);
    }, [isOpen, onClose]);

    const handleSubmit = async (e) => {
        e.preventDefault();
        setLoading(true);
        const formData = new FormData(e.target);
        try {
            await api.post('/regularization', {
                attendanceDate: formData.get('date'),
                type: formData.get('type'),
                reason: formData.get('reason'),
                startTime: formData.get('startTime'),
                endTime: formData.get('endTime')
            });
            onSuccess();
            onClose();
        } catch (error) {
            toast.error(error.response?.data?.message || 'Regularization request failed');
        } finally {
            setLoading(false);
        }
    };

    if (!isOpen) return null;

    return (
        <div
            className="fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-4 bg-black/50 backdrop-blur-xs animate-fade-in overflow-y-auto"
            role="dialog"
            aria-modal="true"
            aria-labelledby="reg-modal-title"
        >
            <div className="bg-white rounded-3xl w-full max-w-md p-5 sm:p-8 shadow-2xl animate-zoom-in max-h-[90vh] overflow-y-auto my-auto">
                <div className="flex justify-between items-center mb-6">
                    <div>
                        <h3 id="reg-modal-title" className="text-xl sm:text-2xl font-bold text-gray-900">Regularization Request</h3>
                        <p className="text-xs sm:text-sm text-gray-500 mt-1">Found an error in your logs? Raise it here.</p>
                    </div>
                    <button
                        type="button"
                        onClick={onClose}
                        className="p-2 hover:bg-gray-100 rounded-xl transition-colors"
                        aria-label="Close regularization modal"
                    >
                        <X size={20} />
                    </button>
                </div>

                <form onSubmit={handleSubmit} className="space-y-4 sm:space-y-5">
                    <div>
                        <label className="block text-xs font-black text-gray-400 uppercase tracking-widest mb-1.5 ml-1">Attendance Date</label>
                        <div className="relative">
                            <input
                                name="date"
                                type="date"
                                required
                                className="w-full px-4 py-2.5 sm:py-3 bg-gray-50 border border-gray-100 rounded-2xl outline-none focus:ring-4 focus:ring-primary-500/10 focus:border-primary-500 transition-all text-sm"
                            />
                        </div>
                    </div>
                    <div>
                        <label className="block text-xs font-black text-gray-400 uppercase tracking-widest mb-1.5 ml-1">Request Type</label>
                        <select
                            name="type"
                            required
                            className="w-full px-4 py-2.5 sm:py-3 bg-gray-50 border border-gray-100 rounded-2xl outline-none focus:ring-4 focus:ring-primary-500/10 focus:border-primary-500 transition-all font-bold text-gray-700 text-sm"
                        >
                            <option value="mis-punch">Mis-punch (Forgot In/Out)</option>
                            <option value="late-entry">Late Entry</option>
                            <option value="early-exit">Early Exit</option>
                            <option value="other">Incorrect Status</option>
                        </select>
                    </div>
                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 sm:gap-4">
                        <div>
                            <label className="block text-xs font-black text-gray-400 uppercase tracking-widest mb-1.5 ml-1">Correct Start</label>
                            <input name="startTime" type="time" className="w-full px-4 py-2.5 sm:py-3 bg-gray-50 border border-gray-100 rounded-2xl outline-none focus:ring-4 focus:ring-primary-500/10 focus:border-primary-500 transition-all text-sm" />
                        </div>
                        <div>
                            <label className="block text-xs font-black text-gray-400 uppercase tracking-widest mb-1.5 ml-1">Correct End</label>
                            <input name="endTime" type="time" className="w-full px-4 py-2.5 sm:py-3 bg-gray-50 border border-gray-100 rounded-2xl outline-none focus:ring-4 focus:ring-primary-500/10 focus:border-primary-500 transition-all text-sm" />
                        </div>
                    </div>
                    <div>
                        <label className="block text-xs font-black text-gray-400 uppercase tracking-widest mb-1.5 ml-1">Reason / Explanation</label>
                        <textarea
                            name="reason"
                            required
                            rows={3}
                            placeholder="Please explain the discrepancy..."
                            className="w-full px-4 py-3 bg-gray-50 border border-gray-100 rounded-2xl outline-none focus:ring-4 focus:ring-primary-500/10 focus:border-primary-500 transition-all resize-none"
                        />
                    </div>
                    <div className="pt-2">
                        <button
                            type="submit"
                            disabled={loading}
                            className="w-full py-4 bg-primary-600 text-white font-black rounded-2xl hover:bg-primary-700 transition-all shadow-xl shadow-primary-100 disabled:opacity-50 active:scale-[0.98] flex items-center justify-center gap-2"
                        >
                            {loading ? <Loader2 className="animate-spin" size={20} /> : 'Submit Request'}
                        </button>
                    </div>
                </form>
            </div>
        </div>
    );
};

export default RegularizationModal;
