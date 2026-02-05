import { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import {
    Search,
    BarChart3,
    Eye,
    ChevronLeft,
    ChevronRight,
    Loader2
} from 'lucide-react';
import api from '../services/api';
import useAuthStore from '../store/useAuthStore';
import AssessmentModal from '../components/AssessmentModal';

const SelfAssessmentPage = () => {
    const { user } = useAuthStore();
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
        } finally {
            setLoading(false);
        }
    };

    const handleAction = (assessmentId) => {
        setSelectedAssessmentId(assessmentId);
        setIsModalOpen(true);
    };

    // Filter logic
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

    // Pagination logic
    const indexOfLastEntry = currentPage * entriesPerPage;
    const indexOfFirstEntry = indexOfLastEntry - entriesPerPage;
    const currentEntries = filteredAssessments.slice(indexOfFirstEntry, indexOfLastEntry);
    const totalPages = Math.ceil(filteredAssessments.length / entriesPerPage);

    return (
        <div className="space-y-6">
            {/* Breadcrumb */}
            <div className="flex justify-end text-xs text-gray-500 mb-2">
                <Link to="/" className="text-primary-600 hover:underline">Dashboard</Link>
                <span className="mx-1">{'>'}</span>
                <span className="text-primary-600">Assessment Management</span>
                <span className="mx-1">{'>'}</span>
                <span className="font-bold text-gray-700">Self-Assessment</span>
            </div>

            <div className="bg-white rounded-none border border-gray-200 shadow-sm p-6">
                <h2 className="text-xl font-bold text-gray-700 mb-6 border-b border-gray-100 pb-4">Self-Assessment</h2>

                {/* Controls */}
                <div className="flex flex-col sm:flex-row justify-between items-center mb-6 gap-4">
                    <div className="flex items-center text-sm text-gray-600">
                        <span className="mr-2">Show</span>
                        <select
                            value={entriesPerPage}
                            onChange={(e) => {
                                setEntriesPerPage(Number(e.target.value));
                                setCurrentPage(1);
                            }}
                            className="border border-gray-300 rounded px-2 py-1 focus:outline-none focus:border-primary-500"
                        >
                            <option value={10}>10</option>
                            <option value={25}>25</option>
                            <option value={50}>50</option>
                            <option value={100}>100</option>
                        </select>
                        <span className="ml-2">entries</span>
                    </div>

                    <div className="flex items-center gap-2">
                        <span className="text-sm text-gray-600">Search:</span>
                        <input
                            type="text"
                            value={searchTerm}
                            onChange={(e) => setSearchTerm(e.target.value)}
                            className="border border-gray-300 rounded px-3 py-1 focus:outline-none focus:border-primary-500 text-sm"
                        />
                    </div>
                </div>

                {/* Table */}
                <div className="overflow-x-auto">
                    <table className="w-full text-left border-collapse">
                        <thead className="bg-[#e9ecef] text-gray-700 text-xs font-bold">
                            <tr>
                                <th className="px-4 py-3 border-b border-gray-300">EMP NAME</th>
                                <th className="px-4 py-3 border-b border-gray-300">JOINING DATE</th>
                                <th className="px-4 py-3 border-b border-gray-300">DESIGNATION</th>
                                <th className="px-4 py-3 border-b border-gray-300">DEPARTMENT</th>
                                <th className="px-4 py-3 border-b border-gray-300">REPORTING MANAGER</th>
                                <th className="px-4 py-3 border-b border-gray-300">STATUS</th>
                                <th className="px-4 py-3 border-b border-gray-300 text-center">ACTION</th>
                            </tr>
                        </thead>
                        <tbody className="text-sm text-gray-600">
                            {loading ? (
                                <tr>
                                    <td colSpan="7" className="px-4 py-8 text-center">
                                        <Loader2 className="animate-spin mx-auto text-primary-500" size={24} />
                                    </td>
                                </tr>
                            ) : filteredAssessments.length === 0 ? (
                                <tr>
                                    <td colSpan="7" className="px-4 py-8 text-center bg-gray-50 border-b border-gray-100">
                                        No data available in table
                                    </td>
                                </tr>
                            ) : (
                                currentEntries.map((item, index) => {
                                    const emp = item.employeeDetails || {};
                                    // Handle missing reporting manager logically
                                    const managerName = typeof emp.reportingManager === 'object' && emp.reportingManager
                                        ? `${emp.reportingManager.firstName || ''} ${emp.reportingManager.lastName || ''}`
                                        : 'N/A';

                                    return (
                                        <tr key={index} className="hover:bg-gray-50 transition-colors border-b border-gray-100 odd:bg-white even:bg-gray-50/30">
                                            <td className="px-4 py-3 font-medium text-gray-800">
                                                {emp.firstName} {emp.lastName}
                                            </td>
                                            <td className="px-4 py-3">
                                                {emp.dateOfJoining ? new Date(emp.dateOfJoining).toLocaleDateString() : '-'}
                                            </td>
                                            <td className="px-4 py-3">{emp.designation || '-'}</td>
                                            <td className="px-4 py-3">{emp.department || '-'}</td>
                                            <td className="px-4 py-3">{managerName}</td>
                                            <td className="px-4 py-3">
                                                <span className={`px-2 py-0.5 rounded text-xs font-bold ${item.status === 'Pending' ? 'bg-yellow-100 text-yellow-700' :
                                                    item.status === 'Reviewing' ? 'bg-blue-100 text-blue-700' :
                                                        item.status === 'Completed' ? 'bg-green-100 text-green-700' :
                                                            'bg-gray-100 text-gray-700'
                                                    }`}>
                                                    {item.status}
                                                </span>
                                            </td>
                                            <td className="px-4 py-3 text-center">
                                                <button
                                                    onClick={() => handleAction(item._id)}
                                                    className="p-1.5 bg-blue-50 text-blue-600 rounded hover:bg-blue-600 hover:text-white transition-all shadow-sm"
                                                    title="View"
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
                <div className="flex flex-col sm:flex-row justify-between items-center mt-4 text-sm text-gray-600">
                    <div>
                        Showing {filteredAssessments.length === 0 ? 0 : indexOfFirstEntry + 1} to {Math.min(indexOfLastEntry, filteredAssessments.length)} of {filteredAssessments.length} entries
                    </div>
                    <div className="flex gap-1 mt-2 sm:mt-0">
                        <button
                            onClick={() => setCurrentPage(prev => Math.max(prev - 1, 1))}
                            disabled={currentPage === 1}
                            className={`px-3 py-1 border rounded hover:bg-gray-50 ${currentPage === 1 ? 'text-gray-300 cursor-not-allowed' : 'text-gray-600'}`}
                        >
                            Previous
                        </button>
                        <button
                            className="px-3 py-1 bg-primary-600 text-white border border-primary-600 rounded"
                        >
                            {currentPage}
                        </button>
                        <button
                            onClick={() => setCurrentPage(prev => Math.min(prev + 1, totalPages))}
                            disabled={currentPage === totalPages || totalPages === 0}
                            className={`px-3 py-1 border rounded hover:bg-gray-50 ${currentPage >= totalPages ? 'text-gray-300 cursor-not-allowed' : 'text-gray-600'}`}
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
                    fetchAssessments();
                    // Optional: show a toast notification here
                }}
            />
        </div>
    );
};

export default SelfAssessmentPage;
