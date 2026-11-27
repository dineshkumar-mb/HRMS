import { useState, useEffect } from 'react';
import {
    Search,
    Eye,
    Loader2
} from 'lucide-react';
import api from '../services/api';
import { toast } from '../store/useUIStore';
import AssessmentModal from '../components/AssessmentModal';

const SelfAssessmentPage = () => {
    const [assessments, setAssessments] = useState([]);
    const [loading, setLoading] = useState(true);
    const [searchTerm, setSearchTerm] = useState('');
    const [entriesPerPage, setEntriesPerPage] = useState(10);
    const [currentPage, setCurrentPage] = useState(1);
    const [isModalOpen, setIsModalOpen] = useState(false);
    const [selectedAssessmentId, setSelectedAssessmentId] = useState(null);

    useEffect(() => {
        fetchAssessments();
    }, []);

    const fetchAssessments = async () => {
        try {
            const { data } = await api.get('/assessments');
            setAssessments(data.data);
        } catch (error) {
            console.error('Error fetching assessments:', error);
            toast.error('Failed to load assessments');
        } finally {
            setLoading(false);
        }
    };

    const handleAction = (assessmentId) => {
        setSelectedAssessmentId(assessmentId);
        setIsModalOpen(true);
    };

    const filteredAssessments = assessments.filter(item => {
        const emp = item.employeeDetails || {};
        const term = searchTerm.toLowerCase();
        return (
            (emp.firstName && emp.firstName.toLowerCase().includes(term)) ||
            (emp.lastName && emp.lastName.toLowerCase().includes(term)) ||
            (emp.designation && emp.designation.toLowerCase().includes(term)) ||
            (emp.department && emp.department.toLowerCase().includes(term))
        );
    });

    const indexOfLastEntry = currentPage * entriesPerPage;
    const indexOfFirstEntry = indexOfLastEntry - entriesPerPage;
    const currentEntries = filteredAssessments.slice(indexOfFirstEntry, indexOfLastEntry);
    const totalPages = Math.ceil(filteredAssessments.length / entriesPerPage);

    const getStatusBadge = (status) => {
        switch (status) {
            case 'Pending':
                return 'bg-amber-50 text-amber-700 border-amber-100';
            case 'In Progress':
            case 'Reviewing':
                return 'bg-blue-50 text-blue-700 border-blue-100';
            case 'Submitted':
                return 'bg-indigo-50 text-indigo-700 border-indigo-100';
            case 'Reviewed':
            case 'Completed':
                return 'bg-emerald-50 text-emerald-700 border-emerald-100';
            default:
                return 'bg-slate-100 text-slate-700 border-slate-200';
        }
    };

    return (
        <div className="space-y-6">
            <div>
                <h1 className="text-2xl font-bold text-slate-900 tracking-tight">Self-Assessment</h1>
                <p className="text-sm text-slate-500 mt-0.5">Complete your performance self-reviews and track manager feedback.</p>
            </div>

            <div className="bg-white rounded-2xl border border-slate-200/80 shadow-sm overflow-hidden">
                {/* Controls */}
                <div className="p-4 sm:p-6 border-b border-slate-100 flex flex-col sm:flex-row justify-between items-stretch sm:items-center gap-4">
                    <div className="flex items-center text-sm text-slate-600">
                        <label htmlFor="entries-per-page" className="mr-2">Show</label>
                        <select
                            id="entries-per-page"
                            value={entriesPerPage}
                            onChange={(e) => {
                                setEntriesPerPage(Number(e.target.value));
                                setCurrentPage(1);
                            }}
                            className="border border-slate-200 bg-slate-50 rounded-xl px-2.5 py-1.5 focus:outline-none focus:ring-2 focus:ring-primary-500"
                        >
                            <option value={10}>10</option>
                            <option value={25}>25</option>
                            <option value={50}>50</option>
                            <option value={100}>100</option>
                        </select>
                        <span className="ml-2">entries</span>
                    </div>

                    <div className="relative w-full sm:w-72">
                        <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" size={16} />
                        <input
                            type="text"
                            placeholder="Search by name, role, or dept..."
                            aria-label="Search assessments"
                            value={searchTerm}
                            onChange={(e) => {
                                setSearchTerm(e.target.value);
                                setCurrentPage(1);
                            }}
                            className="w-full pl-10 pr-4 py-2 bg-slate-50 border border-slate-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-primary-500 focus:bg-white text-sm transition-all"
                        />
                    </div>
                </div>

                {/* Table */}
                <div className="overflow-x-auto">
                    <table className="w-full text-left border-collapse">
                        <thead className="bg-slate-50 text-slate-500 text-xs font-bold uppercase tracking-wider border-b border-slate-100">
                            <tr>
                                <th className="px-6 py-3.5">Employee</th>
                                <th className="px-6 py-3.5">Joining Date</th>
                                <th className="px-6 py-3.5">Designation</th>
                                <th className="px-6 py-3.5">Department</th>
                                <th className="px-6 py-3.5">Reporting Manager</th>
                                <th className="px-6 py-3.5">Status</th>
                                <th className="px-6 py-3.5 text-center">Action</th>
                            </tr>
                        </thead>
                        <tbody className="text-sm text-slate-600 divide-y divide-slate-100">
                            {loading ? (
                                <tr>
                                    <td colSpan="7" className="px-6 py-12 text-center">
                                        <Loader2 className="animate-spin mx-auto text-primary-600" size={28} />
                                    </td>
                                </tr>
                            ) : filteredAssessments.length === 0 ? (
                                <tr>
                                    <td colSpan="7" className="px-6 py-12 text-center text-slate-400">
                                        No assessments found.
                                    </td>
                                </tr>
                            ) : (
                                currentEntries.map((item, index) => {
                                    const emp = item.employeeDetails || {};
                                    const managerName = typeof emp.reportingManager === 'object' && emp.reportingManager
                                        ? `${emp.reportingManager.firstName || ''} ${emp.reportingManager.lastName || ''}`.trim()
                                        : 'N/A';

                                    return (
                                        <tr key={item._id || index} className="hover:bg-slate-50/70 transition-colors">
                                            <td className="px-6 py-4 font-semibold text-slate-900">
                                                {emp.firstName} {emp.lastName}
                                            </td>
                                            <td className="px-6 py-4">
                                                {emp.dateOfJoining ? new Date(emp.dateOfJoining).toLocaleDateString() : '-'}
                                            </td>
                                            <td className="px-6 py-4">{emp.designation || '-'}</td>
                                            <td className="px-6 py-4">{emp.department || '-'}</td>
                                            <td className="px-6 py-4">{managerName}</td>
                                            <td className="px-6 py-4">
                                                <span className={`px-2.5 py-1 rounded-lg text-xs font-bold border ${getStatusBadge(item.status)}`}>
                                                    {item.status}
                                                </span>
                                            </td>
                                            <td className="px-6 py-4 text-center">
                                                <button
                                                    type="button"
                                                    onClick={() => handleAction(item._id)}
                                                    className="p-2 bg-primary-50 text-primary-600 rounded-xl hover:bg-primary-600 hover:text-white transition-all shadow-xs"
                                                    title="View / Edit Assessment"
                                                    aria-label={`View assessment for ${emp.firstName || 'employee'}`}
                                                >
                                                    <Eye size={16} />
                                                </button>
                                            </td>
                                        </tr>
                                    );
                                })
                            )}
                        </tbody>
                    </table>
                </div>

                {/* Footer / Pagination */}
                <div className="p-4 sm:px-6 border-t border-slate-100 flex flex-col sm:flex-row justify-between items-center gap-3 text-xs text-slate-500">
                    <div>
                        Showing {filteredAssessments.length === 0 ? 0 : indexOfFirstEntry + 1} to {Math.min(indexOfLastEntry, filteredAssessments.length)} of {filteredAssessments.length} entries
                    </div>
                    <div className="flex gap-1.5">
                        <button
                            type="button"
                            onClick={() => setCurrentPage(prev => Math.max(prev - 1, 1))}
                            disabled={currentPage === 1}
                            className="px-3 py-1.5 border border-slate-200 rounded-lg hover:bg-slate-50 disabled:opacity-40 disabled:cursor-not-allowed font-medium"
                        >
                            Previous
                        </button>
                        <span className="px-3 py-1.5 bg-primary-600 text-white rounded-lg font-bold">
                            {currentPage}
                        </span>
                        <button
                            type="button"
                            onClick={() => setCurrentPage(prev => Math.min(prev + 1, totalPages))}
                            disabled={currentPage >= totalPages || totalPages === 0}
                            className="px-3 py-1.5 border border-slate-200 rounded-lg hover:bg-slate-50 disabled:opacity-40 disabled:cursor-not-allowed font-medium"
                        >
                            Next
                        </button>
                    </div>
                </div>
            </div>

            <AssessmentModal
                isOpen={isModalOpen}
                onClose={() => setIsModalOpen(false)}
                assessmentId={selectedAssessmentId}
                onSaveSuccess={() => {
                    toast.success('Assessment saved successfully');
                    fetchAssessments();
                }}
            />
        </div>
    );
};

export default SelfAssessmentPage;
