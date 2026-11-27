import React, { useState, useEffect } from 'react';
import {
    Users,
    Download,
    RefreshCcw,
    CheckCircle,
    AlertCircle,
    Search,
    ChevronLeft,
    ChevronRight,
    Loader2,
    CheckCheck,
    SlidersHorizontal,
    X
} from 'lucide-react';
import api from '../services/api';
import { toast, confirmAction } from '../store/useUIStore';

const AdminPayrollView = ({ onOpenSlip }) => {
    const [loading, setLoading] = useState(true);
    const [generating, setGenerating] = useState(false);
    const [markingPaid, setMarkingPaid] = useState(false);
    const [payrollData, setPayrollData] = useState([]);
    const [searchTerm, setSearchTerm] = useState('');
    const [editingPay, setEditingPay] = useState(null);
    const [adjustForm, setAdjustForm] = useState({ allowances: 0, deductions: 0 });
    const [date, setDate] = useState({
        month: new Date().getMonth() + 1,
        year: new Date().getFullYear()
    });

    useEffect(() => {
        fetchAllPayroll();
    }, [date]);

    const fetchAllPayroll = async () => {
        try {
            setLoading(true);
            const { data } = await api.get(`/payroll?month=${date.month}&year=${date.year}`);
            setPayrollData(data.data);
        } catch (error) {
            console.error('Error fetching all payroll:', error);
        } finally {
            setLoading(false);
        }
    };

    const handleGenerate = async () => {
        const confirmed = await confirmAction({
            title: 'Process Payroll',
            message: `Generate payroll for all employees for ${months[date.month - 1]} ${date.year}?`,
            confirmText: 'Process Payroll',
            variant: 'primary'
        });
        if (!confirmed) return;

        try {
            setGenerating(true);
            await api.post('/payroll/generate', { month: date.month, year: date.year });
            toast.success('Payroll generated successfully');
            fetchAllPayroll();
        } catch (error) {
            toast.error(error.response?.data?.message || 'Generation failed');
        } finally {
            setGenerating(false);
        }
    };

    const handleExportAll = () => {
        if (filteredData.length === 0) {
            toast.warning('No payroll records to export');
            return;
        }
        const headers = ['Employee ID', 'Employee Name', 'Month', 'Year', 'Status', 'Basic Salary', 'Net Salary'];
        const rows = filteredData.map(pay => [
            pay.employee.employeeId,
            `${pay.employee.firstName} ${pay.employee.lastName}`,
            months[date.month - 1],
            date.year,
            pay.status,
            pay.salaryComponents.basic,
            pay.netSalary
        ]);
        const csvContent = [
            headers.join(','),
            ...rows.map(r => r.map(cell => `"${String(cell ?? '').replace(/"/g, '""')}"`).join(','))
        ].join('\n');
        const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
        const url = URL.createObjectURL(blob);
        const link = document.createElement('a');
        link.href = url;
        link.download = `payroll_${months[date.month - 1]}_${date.year}.csv`;
        document.body.appendChild(link);
        link.click();
        document.body.removeChild(link);
        URL.revokeObjectURL(url);
        toast.success('Payroll exported to CSV');
    };

    const handleMarkAllPaid = async () => {
        const confirmed = await confirmAction({
            title: 'Mark All as Paid',
            message: `Mark all processed payroll slips for ${months[date.month - 1]} ${date.year} as Paid?`,
            confirmText: 'Mark All Paid',
            variant: 'primary'
        });
        if (!confirmed) return;

        try {
            setMarkingPaid(true);
            const { data } = await api.post('/payroll/mark-paid', { month: date.month, year: date.year });
            toast.success(`Marked ${data.modifiedCount} payroll record(s) as Paid`);
            fetchAllPayroll();
        } catch (error) {
            toast.error(error.response?.data?.message || 'Failed to mark payroll as paid');
        } finally {
            setMarkingPaid(false);
        }
    };

    const handleMarkOnePaid = async (payId) => {
        try {
            await api.put(`/payroll/${payId}`, { status: 'paid' });
            toast.success('Marked as Paid');
            fetchAllPayroll();
        } catch (error) {
            toast.error(error.response?.data?.message || 'Update failed');
        }
    };

    const openAdjustModal = (pay) => {
        setEditingPay(pay);
        setAdjustForm({
            allowances: pay.salaryComponents?.allowances || 0,
            deductions: pay.salaryComponents?.deductions || 0
        });
    };

    const handleSaveAdjustment = async (e) => {
        e.preventDefault();
        if (!editingPay) return;
        try {
            await api.put(`/payroll/${editingPay._id}`, adjustForm);
            toast.success('Payroll components adjusted');
            setEditingPay(null);
            fetchAllPayroll();
        } catch (error) {
            toast.error(error.response?.data?.message || 'Failed to adjust payroll');
        }
    };

    const months = ["January", "February", "March", "April", "May", "June", "July", "August", "September", "October", "November", "December"];

    const filteredData = payrollData.filter(pay =>
        pay.employee.firstName.toLowerCase().includes(searchTerm.toLowerCase()) ||
        pay.employee.lastName.toLowerCase().includes(searchTerm.toLowerCase()) ||
        pay.employee.employeeId.toLowerCase().includes(searchTerm.toLowerCase())
    );

    const changeMonth = (offset) => {
        let newMonth = date.month + offset;
        let newYear = date.year;
        if (newMonth > 12) {
            newMonth = 1;
            newYear++;
        } else if (newMonth < 1) {
            newMonth = 12;
            newYear--;
        }
        setDate({ month: newMonth, year: newYear });
    };

    return (
        <div className="space-y-6">
            <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
                <div className="flex items-center gap-4 bg-white p-2 rounded-2xl border border-gray-100 shadow-sm">
                    <button
                        type="button"
                        onClick={() => changeMonth(-1)}
                        className="p-2 hover:bg-gray-50 rounded-xl text-gray-400 transition-colors"
                        aria-label="Previous month"
                    >
                        <ChevronLeft size={20} />
                    </button>
                    <div className="flex flex-col items-center px-4">
                        <span className="text-xs font-black text-primary-600 uppercase tracking-widest leading-none mb-1">{date.year}</span>
                        <span className="text-lg font-black text-gray-900 leading-none">{months[date.month - 1]}</span>
                    </div>
                    <button
                        type="button"
                        onClick={() => changeMonth(1)}
                        className="p-2 hover:bg-gray-50 rounded-xl text-gray-400 transition-colors"
                        aria-label="Next month"
                    >
                        <ChevronRight size={20} />
                    </button>
                </div>

                <div className="flex flex-wrap gap-2">
                    <button
                        type="button"
                        onClick={handleGenerate}
                        disabled={generating}
                        className="flex items-center gap-2 px-5 py-3 bg-primary-600 text-white rounded-2xl font-bold hover:bg-primary-700 transition-all shadow-lg shadow-primary-100 disabled:opacity-50 text-sm"
                    >
                        {generating ? <Loader2 className="animate-spin" size={18} /> : <RefreshCcw size={18} />}
                        Process Payroll
                    </button>
                    {filteredData.some(p => p.status !== 'paid') && (
                        <button
                            type="button"
                            onClick={handleMarkAllPaid}
                            disabled={markingPaid}
                            className="flex items-center gap-2 px-5 py-3 bg-emerald-600 text-white rounded-2xl font-bold hover:bg-emerald-700 transition-all shadow-sm disabled:opacity-50 text-sm"
                        >
                            {markingPaid ? <Loader2 className="animate-spin" size={18} /> : <CheckCheck size={18} />}
                            Mark All Paid
                        </button>
                    )}
                    <button
                        type="button"
                        onClick={handleExportAll}
                        className="flex items-center gap-2 px-5 py-3 bg-white border border-gray-200 text-gray-700 rounded-2xl font-bold hover:bg-gray-50 transition-all shadow-sm text-sm"
                    >
                        <Download size={18} />
                        Export All
                    </button>
                </div>
            </div>

            <div className="bg-white rounded-3xl border border-gray-100 shadow-sm overflow-hidden">
                <div className="p-6 border-b border-gray-50 flex flex-col md:flex-row justify-between items-center gap-4">
                    <h3 className="font-black text-gray-900 text-lg flex items-center gap-2">
                        <Users size={20} className="text-primary-600" />
                        Employee Payroll Status
                    </h3>
                    <div className="relative w-full md:w-64">
                        <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" size={16} />
                        <input
                            type="text"
                            placeholder="Search employee..."
                            value={searchTerm}
                            onChange={(e) => setSearchTerm(e.target.value)}
                            className="w-full pl-10 pr-4 py-2 bg-gray-50 border border-transparent rounded-xl focus:bg-white focus:border-primary-100 outline-none text-sm transition-all"
                        />
                    </div>
                </div>

                <div className="overflow-x-auto">
                    <table className="w-full text-left">
                        <thead className="bg-gray-50 text-[10px] font-black text-gray-400 uppercase tracking-[0.1em]">
                            <tr>
                                <th className="px-8 py-4">Employee</th>
                                <th className="px-8 py-4">Status</th>
                                <th className="px-8 py-4">Base Salary</th>
                                <th className="px-8 py-4">Net Amount</th>
                                <th className="px-8 py-4 text-center">Actions</th>
                            </tr>
                        </thead>
                        <tbody className="divide-y divide-gray-50">
                            {loading ? (
                                [1, 2, 3, 4, 5].map(i => (
                                    <tr key={i} className="animate-pulse">
                                        <td colSpan={5} className="px-8 py-6">
                                            <div className="h-4 bg-gray-50 rounded-lg w-full"></div>
                                        </td>
                                    </tr>
                                ))
                            ) : filteredData.length === 0 ? (
                                <tr>
                                    <td colSpan={5} className="px-8 py-20 text-center">
                                        <div className="flex flex-col items-center gap-3">
                                            <div className="p-4 bg-gray-50 rounded-3xl text-gray-200">
                                                <AlertCircle size={48} />
                                            </div>
                                            <p className="text-gray-400 font-bold">No payroll records for this period.</p>
                                            <button
                                                onClick={handleGenerate}
                                                className="text-primary-600 font-black text-sm hover:underline"
                                            >
                                                Start Processing Now
                                            </button>
                                        </div>
                                    </td>
                                </tr>
                            ) : (
                                filteredData.map((pay) => (
                                    <tr key={pay._id} className="hover:bg-gray-50/50 transition-all group">
                                        <td className="px-8 py-4">
                                            <div className="flex items-center gap-3">
                                                <div className="w-10 h-10 rounded-2xl bg-primary-50 text-primary-600 flex items-center justify-center font-bold text-sm">
                                                    {pay.employee.firstName[0]}{pay.employee.lastName[0]}
                                                </div>
                                                <div>
                                                    <p className="font-bold text-gray-900">{pay.employee.firstName} {pay.employee.lastName}</p>
                                                    <p className="text-xs text-gray-400 font-medium">ID: {pay.employee.employeeId}</p>
                                                </div>
                                            </div>
                                        </td>
                                        <td className="px-8 py-4">
                                            <div className="flex items-center gap-2">
                                                {pay.status === 'paid' ? (
                                                    <CheckCircle size={14} className="text-green-500" />
                                                ) : (
                                                    <RefreshCcw size={14} className="text-primary-500" />
                                                )}
                                                <span className={`text-[10px] font-black uppercase tracking-widest ${pay.status === 'paid' ? 'text-green-600' : 'text-primary-600'
                                                    }`}>
                                                    {pay.status}
                                                </span>
                                            </div>
                                        </td>
                                        <td className="px-8 py-4">
                                            <p className="text-sm font-bold text-gray-700">₹{pay.salaryComponents.basic.toLocaleString()}</p>
                                        </td>
                                        <td className="px-8 py-4">
                                            <p className="text-sm font-black text-gray-900 font-mono tracking-tight">₹{pay.netSalary.toLocaleString()}</p>
                                        </td>
                                        <td className="px-8 py-4 text-center">
                                            <div className="flex items-center justify-center gap-1.5">
                                                <button
                                                    type="button"
                                                    onClick={() => openAdjustModal(pay)}
                                                    className="p-2 text-slate-600 hover:bg-slate-100 rounded-xl transition-all"
                                                    title="Adjust Allowances / Deductions"
                                                    aria-label={`Adjust payroll for ${pay.employee.firstName}`}
                                                >
                                                    <SlidersHorizontal size={15} />
                                                </button>
                                                {pay.status !== 'paid' && (
                                                    <button
                                                        type="button"
                                                        onClick={() => handleMarkOnePaid(pay._id)}
                                                        className="px-3 py-1.5 text-emerald-700 bg-emerald-50 hover:bg-emerald-100 rounded-xl text-[11px] font-bold uppercase tracking-wider transition-all"
                                                    >
                                                        Mark Paid
                                                    </button>
                                                )}
                                                <button
                                                    type="button"
                                                    onClick={() => onOpenSlip(pay)}
                                                    className="px-3 py-1.5 text-primary-600 hover:bg-primary-50 rounded-xl text-[11px] font-black uppercase tracking-wider transition-all"
                                                >
                                                    View Slip
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

            {/* Adjustment Modal */}
            {editingPay && (
                <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/50 backdrop-blur-xs animate-fade-in" role="dialog" aria-modal="true">
                    <div className="bg-white rounded-3xl w-full max-w-md p-6 shadow-2xl animate-zoom-in">
                        <div className="flex justify-between items-center mb-5">
                            <div>
                                <h3 className="text-lg font-bold text-slate-900">Adjust Payroll</h3>
                                <p className="text-xs text-slate-500">{editingPay.employee.firstName} {editingPay.employee.lastName}</p>
                            </div>
                            <button type="button" onClick={() => setEditingPay(null)} className="p-1.5 hover:bg-slate-100 rounded-xl text-slate-400" aria-label="Close adjustment modal">
                                <X size={18} />
                            </button>
                        </div>
                        <form onSubmit={handleSaveAdjustment} className="space-y-4">
                            <div>
                                <label htmlFor="adj-allowances" className="block text-xs font-bold text-slate-700 uppercase mb-1.5">Allowances / Bonus (₹)</label>
                                <input
                                    id="adj-allowances"
                                    type="number"
                                    min="0"
                                    value={adjustForm.allowances}
                                    onChange={(e) => setAdjustForm(prev => ({ ...prev, allowances: e.target.value }))}
                                    className="w-full px-3.5 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-sm outline-none focus:ring-2 focus:ring-primary-500"
                                />
                            </div>
                            <div>
                                <label htmlFor="adj-deductions" className="block text-xs font-bold text-slate-700 uppercase mb-1.5">Other Deductions (₹)</label>
                                <input
                                    id="adj-deductions"
                                    type="number"
                                    min="0"
                                    value={adjustForm.deductions}
                                    onChange={(e) => setAdjustForm(prev => ({ ...prev, deductions: e.target.value }))}
                                    className="w-full px-3.5 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-sm outline-none focus:ring-2 focus:ring-primary-500"
                                />
                            </div>
                            <div className="flex justify-end gap-2 pt-2">
                                <button type="button" onClick={() => setEditingPay(null)} className="px-4 py-2 text-xs font-semibold text-slate-600 hover:bg-slate-100 rounded-xl">
                                    Cancel
                                </button>
                                <button type="submit" className="px-5 py-2 bg-primary-600 hover:bg-primary-700 text-white text-xs font-bold rounded-xl">
                                    Save &amp; Recalculate
                                </button>
                            </div>
                        </form>
                    </div>
                </div>
            )}
        </div>
    );
};

export default AdminPayrollView;
