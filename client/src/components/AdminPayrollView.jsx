import React, { useState, useEffect } from 'react';
import {
    Users,
    Calendar,
    Download,
    RefreshCcw,
    CheckCircle,
    AlertCircle,
    Search,
    ChevronLeft,
    ChevronRight,
    Loader2
} from 'lucide-react';
import api from '../services/api';

const AdminPayrollView = ({ onOpenSlip }) => {
    const [loading, setLoading] = useState(true);
    const [generating, setGenerating] = useState(false);
    const [payrollData, setPayrollData] = useState([]);
    const [searchTerm, setSearchTerm] = useState('');
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
        if (!window.confirm(`Generate payroll for all employees for ${months[date.month - 1]} ${date.year}?`)) return;

        try {
            setGenerating(true);
            await api.post('/payroll/generate', { month: date.month, year: date.year });
            alert('Payroll generated successfully!');
            fetchAllPayroll();
        } catch (error) {
            alert(error.response?.data?.message || 'Generation failed');
        } finally {
            setGenerating(false);
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
                        onClick={() => changeMonth(-1)}
                        className="p-2 hover:bg-gray-50 rounded-xl text-gray-400 transition-colors"
                    >
                        <ChevronLeft size={20} />
                    </button>
                    <div className="flex flex-col items-center px-4">
                        <span className="text-xs font-black text-primary-600 uppercase tracking-widest leading-none mb-1">{date.year}</span>
                        <span className="text-lg font-black text-gray-900 leading-none">{months[date.month - 1]}</span>
                    </div>
                    <button
                        onClick={() => changeMonth(1)}
                        className="p-2 hover:bg-gray-50 rounded-xl text-gray-400 transition-colors"
                    >
                        <ChevronRight size={20} />
                    </button>
                </div>

                <div className="flex gap-2">
                    <button
                        onClick={handleGenerate}
                        disabled={generating}
                        className="flex items-center gap-2 px-6 py-3 bg-primary-600 text-white rounded-2xl font-bold hover:bg-primary-700 transition-all shadow-lg shadow-primary-100 disabled:opacity-50"
                    >
                        {generating ? <Loader2 className="animate-spin" size={18} /> : <RefreshCcw size={18} />}
                        Process Payroll
                    </button>
                    <button className="flex items-center gap-2 px-6 py-3 bg-white border border-gray-100 text-gray-600 rounded-2xl font-bold hover:bg-gray-50 transition-all shadow-sm">
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
                                            <button
                                                onClick={() => onOpenSlip(pay)}
                                                className="px-4 py-2 text-primary-600 hover:bg-primary-50 rounded-xl text-xs font-black uppercase tracking-wider transition-all"
                                            >
                                                View Details
                                            </button>
                                        </td>
                                    </tr>
                                ))
                            )}
                        </tbody>
                    </table>
                </div>
            </div>
        </div>
    );
};

export default AdminPayrollView;
