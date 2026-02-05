import React, { useState, useEffect } from 'react';
import { X, Save, Loader2, Star } from 'lucide-react';
import api from '../services/api';
import useAuthStore from '../store/useAuthStore';

const AssessmentModal = ({ isOpen, onClose, assessmentId, onSaveSuccess }) => {
    const { user } = useAuthStore();
    const [loading, setLoading] = useState(true);
    const [saving, setSaving] = useState(false);
    const [data, setData] = useState(null);
    const [formData, setFormData] = useState({
        selfRating: 0,
        selfComments: '',
        managerRating: 0,
        managerComments: '',
        status: ''
    });

    useEffect(() => {
        if (isOpen && assessmentId) {
            fetchDetails();
        }
    }, [isOpen, assessmentId]);

    const fetchDetails = async () => {
        setLoading(true);
        try {
            const res = await api.get(`/assessments/${assessmentId}`);
            const assessment = res.data.data;
            setData(assessment);
            setFormData({
                selfRating: assessment.selfRating || 0,
                selfComments: assessment.selfComments || '',
                managerRating: assessment.managerRating || 0,
                managerComments: assessment.managerComments || '',
                status: assessment.status || 'Pending'
            });
        } catch (error) {
            console.error('Error fetching assessment details:', error);
        } finally {
            setLoading(false);
        }
    };

    const handleSave = async () => {
        setSaving(true);
        try {
            const payload = {
                employeeId: data.employee?._id || data.employeeId,
                period: data.period,
                ...formData
            };

            // If it's a placeholder, we create. If not, POST handles update too.
            await api.post('/assessments', payload);
            onSaveSuccess();
            onClose();
        } catch (error) {
            console.error('Error saving assessment:', error);
        } finally {
            setSaving(false);
        }
    };

    if (!isOpen) return null;

    const isEmployee = user.role === 'employee';
    const isAdminOrHR = user.role === 'admin' || user.role === 'hr';
    const isManager = user.role === 'manager';

    return (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 backdrop-blur-sm p-4">
            <div className="bg-white w-full max-w-2xl rounded-lg shadow-xl overflow-hidden flex flex-col max-h-[90vh]">
                <div className="px-6 py-4 bg-[#5bc0de] text-white flex justify-between items-center">
                    <h3 className="text-lg font-bold">Assessment Details - {data?.period}</h3>
                    <button onClick={onClose} className="hover:bg-white/20 p-1 rounded transition-colors">
                        <X size={20} />
                    </button>
                </div>

                <div className="flex-1 overflow-y-auto p-6 space-y-6">
                    {loading ? (
                        <div className="flex justify-center py-20">
                            <Loader2 className="animate-spin text-[#5bc0de]" size={40} />
                        </div>
                    ) : (
                        <>
                            {/* Employee Info Header */}
                            <div className="grid grid-cols-2 gap-4 pb-6 border-b border-gray-100">
                                <div>
                                    <p className="text-xs text-gray-500 uppercase font-bold">Employee Name</p>
                                    <p className="font-medium">{data?.employee?.firstName} {data?.employee?.lastName}</p>
                                </div>
                                <div>
                                    <p className="text-xs text-gray-500 uppercase font-bold">Designation</p>
                                    <p className="font-medium">{data?.employee?.designation}</p>
                                </div>
                            </div>

                            {/* Self Assessment Section */}
                            <div className={isEmployee ? "p-4 bg-blue-50/50 rounded-lg border border-blue-100" : ""}>
                                <h4 className="text-sm font-bold text-gray-700 mb-4 flex items-center gap-2">
                                    <span className="w-2 h-2 rounded-full bg-blue-500"></span>
                                    SELF ASSESSMENT
                                </h4>
                                <div className="space-y-4">
                                    <div>
                                        <label className="block text-xs font-bold text-gray-500 uppercase mb-1">Self Rating (1-5)</label>
                                        <div className="flex gap-2">
                                            {[1, 2, 3, 4, 5].map(star => (
                                                <button
                                                    key={star}
                                                    disabled={!isEmployee}
                                                    onClick={() => setFormData(prev => ({ ...prev, selfRating: star }))}
                                                    className={`transition-colors ${star <= formData.selfRating ? 'text-yellow-500' : 'text-gray-300'} ${isEmployee ? 'hover:scale-110' : ''}`}
                                                >
                                                    <Star size={24} fill={star <= formData.selfRating ? 'currentColor' : 'none'} />
                                                </button>
                                            ))}
                                        </div>
                                    </div>
                                    <div>
                                        <label className="block text-xs font-bold text-gray-500 uppercase mb-1">Self Comments</label>
                                        <textarea
                                            disabled={!isEmployee}
                                            value={formData.selfComments}
                                            onChange={(e) => setFormData(prev => ({ ...prev, selfComments: e.target.value }))}
                                            className="w-full border border-gray-300 rounded-md px-3 py-2 text-sm min-h-[80px] focus:outline-none focus:ring-1 focus:ring-[#5bc0de] disabled:bg-gray-50"
                                            placeholder="Enter your achievements and goals..."
                                        />
                                    </div>
                                </div>
                            </div>

                            {/* Manager Assessment Section */}
                            <div className={(isAdminOrHR || isManager) ? "p-4 bg-green-50/50 rounded-lg border border-green-100" : ""}>
                                <h4 className="text-sm font-bold text-gray-700 mb-4 flex items-center gap-2">
                                    <span className="w-2 h-2 rounded-full bg-green-500"></span>
                                    MANAGER REVIEW
                                </h4>
                                <div className="space-y-4">
                                    <div>
                                        <label className="block text-xs font-bold text-gray-500 uppercase mb-1">Manager Rating (1-5)</label>
                                        <div className="flex gap-2">
                                            {[1, 2, 3, 4, 5].map(star => (
                                                <button
                                                    key={star}
                                                    disabled={isEmployee}
                                                    onClick={() => setFormData(prev => ({ ...prev, managerRating: star }))}
                                                    className={`transition-colors ${star <= formData.managerRating ? 'text-yellow-500' : 'text-gray-300'} ${!isEmployee ? 'hover:scale-110' : ''}`}
                                                >
                                                    <Star size={24} fill={star <= formData.managerRating ? 'currentColor' : 'none'} />
                                                </button>
                                            ))}
                                        </div>
                                    </div>
                                    <div>
                                        <label className="block text-xs font-bold text-gray-500 uppercase mb-1">Manager Comments</label>
                                        <textarea
                                            disabled={isEmployee}
                                            value={formData.managerComments}
                                            onChange={(e) => setFormData(prev => ({ ...prev, managerComments: e.target.value }))}
                                            className="w-full border border-gray-300 rounded-md px-3 py-2 text-sm min-h-[80px] focus:outline-none focus:ring-1 focus:ring-[#5bc0de] disabled:bg-gray-50"
                                            placeholder="Provide feedback on performance..."
                                        />
                                    </div>
                                </div>
                            </div>

                            {/* Status Selection (Admin/Manager Only) */}
                            {!isEmployee && (
                                <div className="pt-4 border-t border-gray-100">
                                    <label className="block text-xs font-bold text-gray-500 uppercase mb-1">Assessment Status</label>
                                    <select
                                        value={formData.status}
                                        onChange={(e) => setFormData(prev => ({ ...prev, status: e.target.value }))}
                                        className="w-full border border-gray-300 rounded-md px-3 py-2 text-sm focus:outline-none focus:ring-1 focus:ring-[#5bc0de]"
                                    >
                                        <option value="Pending">Pending</option>
                                        <option value="In Progress">In Progress</option>
                                        <option value="Submitted">Submitted (Employee Final)</option>
                                        <option value="Reviewed">Reviewed (Manager Final)</option>
                                    </select>
                                </div>
                            )}

                            {isEmployee && (
                                <div className="p-3 bg-amber-50 rounded border border-amber-100 text-amber-700 text-xs">
                                    Note: Once you set status to "Submitted", you will not be able to edit your comments.
                                </div>
                            )}
                        </>
                    )}
                </div>

                <div className="px-6 py-4 bg-gray-50 border-t border-gray-200 flex justify-end gap-3">
                    <button
                        onClick={onClose}
                        className="px-4 py-2 text-sm font-medium text-gray-600 hover:text-gray-800 transition-colors"
                    >
                        Cancel
                    </button>
                    <button
                        onClick={handleSave}
                        disabled={saving || loading}
                        className="flex items-center gap-2 bg-[#5bc0de] hover:bg-[#46b8da] text-white px-4 py-2 rounded-md text-sm font-bold shadow-sm transition-all disabled:opacity-50"
                    >
                        {saving ? <Loader2 className="animate-spin" size={16} /> : <Save size={16} />}
                        Save Changes
                    </button>
                </div>
            </div>
        </div>
    );
};

export default AssessmentModal;
