import { useState, useEffect } from 'react';
import {
    Wallet,
    Download,
    FileText,
    TrendingUp,
    AlertCircle,
    Loader2,
    Calendar
} from 'lucide-react';
import PayrollModal from '../components/PayrollModal';
import AdminPayrollView from '../components/AdminPayrollView';
import useAuthStore from '../store/useAuthStore';
import api from '../services/api';

const PayrollPage = () => {
    const { user } = useAuthStore();
    const [history, setHistory] = useState([]);
    const [loading, setLoading] = useState(true);
    const [selectedPayroll, setSelectedPayroll] = useState(null);
    const [activeTab, setActiveTab] = useState('personal');

    const isAdmin = ['admin', 'hr'].includes(user?.role);

    useEffect(() => {
        fetchHistory();
    }, []);

    const fetchHistory = async () => {
        try {
            const { data } = await api.get('/payroll/me');
            setHistory(data.data);
        } catch (error) {
            console.error('Error fetching payroll:', error);
        } finally {
            setLoading(false);
        }
    };

    const months = ["January", "February", "March", "April", "May", "June", "July", "August", "September", "October", "November", "December"];

    if (loading) return <div className="p-8 flex justify-center"><Loader2 className="animate-spin text-primary-600" /></div>;

    return (
        <div className="space-y-8 animate-in fade-in slide-in-from-bottom-4 duration-500">
            <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
                <div>
                    <h1 className="text-3xl font-black text-gray-900 tracking-tight">Financial Hub</h1>
                    <p className="text-gray-500 text-sm mt-1 font-medium">Manage earnings, tax records and organizational payroll.</p>
                </div>
                {isAdmin && (
                    <div className="bg-white p-1 rounded-2xl border border-gray-100 flex shadow-sm">
                        <button
                            onClick={() => setActiveTab('personal')}
                            className={`px-6 py-2 rounded-xl text-xs font-black uppercase tracking-widest transition-all ${activeTab === 'personal' ? 'bg-primary-600 text-white shadow-lg shadow-primary-100' : 'text-gray-400 hover:text-gray-600'
                                }`}
                        >
                            Personal
                        </button>
                        <button
                            onClick={() => setActiveTab('org')}
                            className={`px-6 py-2 rounded-xl text-xs font-black uppercase tracking-widest transition-all ${activeTab === 'org' ? 'bg-primary-600 text-white shadow-lg shadow-primary-100' : 'text-gray-400 hover:text-gray-600'
                                }`}
                        >
                            Organization
                        </button>
                    </div>
                )}
            </div>

            {activeTab === 'org' && isAdmin ? (
                <AdminPayrollView onOpenSlip={setSelectedPayroll} />
            ) : (
                <>
                    <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
                        {/* Summary Card */}
                        <div className="lg:col-span-1 bg-gradient-to-br from-primary-600 to-primary-800 rounded-2xl p-6 text-white shadow-xl shadow-primary-100">
                            <div className="flex justify-between items-start mb-10">
                                <div className="bg-white/20 p-3 rounded-xl backdrop-blur-md">
                                    <Wallet size={24} />
                                </div>
                                <TrendingUp size={24} className="text-green-300" />
                            </div>
                            <p className="text-primary-100 text-sm font-medium">Last Paid Salary</p>
                            <h2 className="text-3xl font-bold mt-1">
                                {history[0] ? `₹${history[0].netSalary.toLocaleString()}` : '₹0.00'}
                            </h2>
                            <div className="mt-8 pt-6 border-t border-white/10 flex justify-between text-sm">
                                <span>Status: <span className="text-green-300 font-bold">Paid</span></span>
                                <span>Date: {history[0] ? `${months[history[0].month - 1]} ${history[0].year}` : 'N/A'}</span>
                            </div>
                        </div>

                        {/* Breakdown Card */}
                        <div className="lg:col-span-2 bg-white rounded-2xl border border-gray-100 p-6 shadow-sm">
                            <h3 className="font-bold text-gray-900 mb-6">Latest Salary Breakdown</h3>
                            {history[0] ? (
                                <div className="grid grid-cols-2 md:grid-cols-4 gap-6">
                                    <div>
                                        <p className="text-xs text-gray-400 uppercase font-bold tracking-wider">Basic Pay</p>
                                        <p className="text-lg font-bold text-gray-800">₹{history[0].salaryComponents.basic.toLocaleString()}</p>
                                    </div>
                                    <div>
                                        <p className="text-xs text-gray-400 uppercase font-bold tracking-wider">HRA</p>
                                        <p className="text-lg font-bold text-gray-800">₹{history[0].salaryComponents.hra.toLocaleString()}</p>
                                    </div>
                                    <div>
                                        <p className="text-xs text-gray-400 uppercase font-bold tracking-wider">Deductions</p>
                                        <p className="text-lg font-bold text-red-600">-₹{history[0].salaryComponents.deductions.toLocaleString()}</p>
                                    </div>
                                    <div>
                                        <p className="text-xs text-gray-400 uppercase font-bold tracking-wider">Net Amount</p>
                                        <p className="text-lg font-bold text-primary-700">₹{history[0].netSalary.toLocaleString()}</p>
                                    </div>
                                </div>
                            ) : (
                                <div className="h-24 flex items-center justify-center text-gray-400 italic">
                                    No recent payroll data available.
                                </div>
                            )}
                        </div>
                    </div>

                    {/* History Table */}
                    <div className="bg-white rounded-2xl border border-gray-100 shadow-sm overflow-hidden">
                        <div className="p-6 border-b border-gray-50 flex justify-between items-center">
                            <h3 className="font-bold text-gray-900">Payment History</h3>
                            <div className="flex gap-2">
                                <button className="p-2 border border-gray-100 rounded-lg text-gray-400 hover:text-gray-600">
                                    <Calendar size={18} />
                                </button>
                            </div>
                        </div>
                        <div className="overflow-x-auto">
                            <table className="w-full text-left">
                                <thead className="bg-gray-50 text-gray-500 text-xs font-bold uppercase tracking-wider">
                                    <tr>
                                        <th className="px-6 py-4">Month / Year</th>
                                        <th className="px-6 py-4">Status</th>
                                        <th className="px-6 py-4 text-right">Net Amount</th>
                                        <th className="px-6 py-4 text-center">Action</th>
                                    </tr>
                                </thead>
                                <tbody className="divide-y divide-gray-50">
                                    {history.length === 0 ? (
                                        <tr>
                                            <td colSpan={4} className="px-6 py-12 text-center text-gray-400">
                                                <AlertCircle className="mx-auto mb-2 opacity-20" size={48} />
                                                No payroll records found for your account.
                                            </td>
                                        </tr>
                                    ) : (
                                        history.map((pay) => (
                                            <tr key={pay._id} className="hover:bg-gray-50 transition-all text-sm group">
                                                <td className="px-6 py-4">
                                                    <div className="flex items-center gap-3">
                                                        <div className="p-2 bg-gray-100 rounded-lg text-gray-500 group-hover:bg-primary-50 group-hover:text-primary-600">
                                                            <FileText size={18} />
                                                        </div>
                                                        <span className="font-bold text-gray-900">{months[pay.month - 1]} {pay.year}</span>
                                                    </div>
                                                </td>
                                                <td className="px-6 py-4">
                                                    <span className={`px-2.5 py-1 rounded-lg text-xs font-bold uppercase ${pay.status === 'paid' ? 'bg-green-50 text-green-700' : 'bg-primary-50 text-primary-700'
                                                        }`}>
                                                        {pay.status}
                                                    </span>
                                                </td>
                                                <td className="px-6 py-4 text-right font-mono font-bold text-gray-700">
                                                    ₹{pay.netSalary.toLocaleString()}
                                                </td>
                                                <td className="px-6 py-4 text-center">
                                                    <div className="flex justify-center gap-2">
                                                        <button
                                                            onClick={() => setSelectedPayroll(pay)}
                                                            className="inline-flex items-center gap-2 px-3 py-1.5 text-primary-600 hover:bg-primary-50 rounded-lg font-semibold transition-all"
                                                        >
                                                            <Download size={16} />
                                                            View
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
                </>
            )}

            <PayrollModal
                isOpen={!!selectedPayroll}
                onClose={() => setSelectedPayroll(null)}
                payroll={selectedPayroll}
            />
        </div>
    );
};

export default PayrollPage;
