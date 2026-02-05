import { useState, useEffect } from 'react';
import { useForm } from 'react-hook-form';
import { useNavigate, Link } from 'react-router-dom';
import {
    Plus,
    Search,
    MoreVertical,
    Mail,
    Phone,
    Filter,
    Download,
    Edit,
    Trash2,
    X,
    Loader2,
    User as UserIcon
} from 'lucide-react';
import api from '../services/api';
import useAuthStore from '../store/useAuthStore';

const EmployeesPage = () => {
    const { user } = useAuthStore();
    const [employees, setEmployees] = useState([]);
    const [loading, setLoading] = useState(true);
    const [searchTerm, setSearchTerm] = useState('');
    const [showModal, setShowModal] = useState(false);
    const [editingEmployee, setEditingEmployee] = useState(null);
    const [actionLoading, setActionLoading] = useState(false);
    const [showFilterDropdown, setShowFilterDropdown] = useState(false);
    const [filters, setFilters] = useState({
        department: 'all',
        designation: 'all',
        status: 'all'
    });

    const { register, handleSubmit, reset, setValue, formState: { errors } } = useForm();

    const canManage = user?.role === 'admin' || user?.role === 'hr';

    useEffect(() => {
        fetchEmployees();
    }, []);

    const fetchEmployees = async () => {
        try {
            const { data } = await api.get('/employees');
            setEmployees(data.data);
        } catch (error) {
            console.error('Error fetching employees:', error);
        } finally {
            setLoading(false);
        }
    };

    const onSubmit = async (data) => {
        setActionLoading(true);
        try {
            if (editingEmployee) {
                await api.put(`/employees/${editingEmployee._id}`, data);
            } else {
                await api.post('/employees', data);
            }
            setShowModal(false);
            setEditingEmployee(null);
            reset();
            fetchEmployees();
        } catch (error) {
            alert(error.response?.data?.message || 'Operation failed');
        } finally {
            setActionLoading(false);
        }
    };

    const handleEdit = (employee) => {
        setEditingEmployee(employee);
        setValue('firstName', employee.firstName);
        setValue('lastName', employee.lastName);
        setValue('email', employee.email);
        setValue('employeeId', employee.employeeId);
        setValue('department', employee.department);
        setValue('designation', employee.designation);
        setValue('status', employee.status);
        setValue('role', employee.role || 'employee');
        setValue('dob', employee.dob ? new Date(employee.dob).toISOString().split('T')[0] : '');
        setValue('dateOfJoining', employee.dateOfJoining ? new Date(employee.dateOfJoining).toISOString().split('T')[0] : '');
        setValue('gender', employee.gender || 'male');
        setValue('phoneNumber', employee.phoneNumber || '');
        setValue('address', employee.address || '');
        setValue('reportingManager', employee.reportingManager?._id || '');

        // Salary fields
        setValue('salary.basic', employee.salary?.basic || 0);
        setValue('salary.hra', employee.salary?.hra || 0);
        setValue('salary.allowances', employee.salary?.allowances || 0);
        setValue('salary.deductions', employee.salary?.deductions || 0);

        setShowModal(true);
    };

    const handleDelete = async (id) => {
        if (!window.confirm('Are you sure you want to delete this employee?')) return;

        setActionLoading(true);
        try {
            await api.delete(`/employees/${id}`);
            fetchEmployees();
        } catch (error) {
            alert(error.response?.data?.message || 'Delete failed');
        } finally {
            setActionLoading(false);
        }
    };

    const handleCloseModal = () => {
        setShowModal(false);
        setEditingEmployee(null);
        reset();
    };

    const handleFilterChange = (filterType, value) => {
        setFilters(prev => ({ ...prev, [filterType]: value }));
    };

    const clearFilters = () => {
        setFilters({
            department: 'all',
            designation: 'all',
            status: 'all'
        });
    };

    const exportToCSV = () => {
        if (filteredEmployees.length === 0) {
            alert('No employees to export');
            return;
        }

        const headers = ['Employee ID', 'First Name', 'Last Name', 'Department', 'Designation', 'Status'];
        const csvData = filteredEmployees.map(emp => [
            emp.employeeId,
            emp.firstName,
            emp.lastName,
            emp.department,
            emp.designation,
            emp.status
        ]);

        const csvContent = [
            headers.join(','),
            ...csvData.map(row => row.map(cell => {
                // Escape commas and quotes
                if (typeof cell === 'string' && (cell.includes(',') || cell.includes('"'))) {
                    return `"${cell.replace(/"/g, '""')}"`;
                }
                return cell;
            }).join(','))
        ].join('\n');

        const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
        const link = document.createElement('a');
        const url = URL.createObjectURL(blob);
        link.setAttribute('href', url);
        link.setAttribute('download', `employees_${new Date().toISOString().split('T')[0]}.csv`);
        link.style.visibility = 'hidden';
        document.body.appendChild(link);
        link.click();
        document.body.removeChild(link);
    };

    // Get unique values for filters
    const departments = ['all', ...new Set(employees.map(e => e.department))];
    const designations = ['all', ...new Set(employees.map(e => e.designation))];
    const statuses = ['all', 'active', 'inactive', 'terminated'];

    const filteredEmployees = employees.filter(emp => {
        const matchesSearch = `${emp.firstName} ${emp.lastName}`.toLowerCase().includes(searchTerm.toLowerCase()) ||
            emp.employeeId.toLowerCase().includes(searchTerm.toLowerCase()) ||
            emp.department.toLowerCase().includes(searchTerm.toLowerCase());

        const matchesDepartment = filters.department === 'all' || emp.department === filters.department;
        const matchesDesignation = filters.designation === 'all' || emp.designation === filters.designation;
        const matchesStatus = filters.status === 'all' || emp.status === filters.status;

        return matchesSearch && matchesDepartment && matchesDesignation && matchesStatus;
    });

    const activeFilterCount = Object.values(filters).filter(v => v !== 'all').length;

    return (
        <div className="space-y-6">
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
                <div>
                    <h1 className="text-2xl font-bold text-gray-900">Personnel Directory</h1>
                    <p className="text-gray-500 text-sm mt-1">
                        Manage and view all employee details.
                        {!loading && (
                            <span className="ml-1 font-semibold text-primary-600">
                                {filteredEmployees.length} of {employees.length} employees
                            </span>
                        )}
                    </p>
                </div>
                <div className="flex items-center gap-3">
                    <button
                        onClick={exportToCSV}
                        className="flex items-center gap-2 px-4 py-2 border border-gray-200 rounded-xl text-gray-600 hover:bg-gray-50 font-medium transition-all text-sm"
                    >
                        <Download size={18} />
                        Export
                    </button>
                    {canManage && (
                        <button
                            onClick={() => setShowModal(true)}
                            className="flex items-center gap-2 px-4 py-2 bg-primary-600 text-white rounded-xl hover:bg-primary-700 font-bold transition-all text-sm shadow-md shadow-primary-100"
                        >
                            <Plus size={18} />
                            Add Employee
                        </button>
                    )}
                </div>
            </div>

            <div className="bg-white rounded-2xl border border-gray-100 shadow-sm overflow-hidden">
                {/* Toolbar */}
                <div className="p-4 border-b border-gray-100 flex flex-col md:flex-row gap-4 justify-between">
                    <div className="relative max-w-sm w-full">
                        <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" size={18} />
                        <input
                            type="text"
                            placeholder="Search by name, ID or department..."
                            value={searchTerm}
                            onChange={(e) => setSearchTerm(e.target.value)}
                            className="w-full pl-10 pr-4 py-2.5 bg-gray-50 border border-gray-100 rounded-xl focus:outline-none focus:ring-2 focus:ring-primary-500 focus:bg-white transition-all text-sm"
                        />
                    </div>
                    <div className="relative">
                        <button
                            onClick={() => setShowFilterDropdown(!showFilterDropdown)}
                            className="flex items-center gap-2 px-4 py-2 border border-gray-100 rounded-xl text-gray-500 hover:bg-gray-50 text-sm font-medium transition-all relative"
                        >
                            <Filter size={18} />
                            Filter
                            {activeFilterCount > 0 && (
                                <span className="absolute -top-1 -right-1 w-5 h-5 bg-primary-600 text-white text-xs font-bold rounded-full flex items-center justify-center">
                                    {activeFilterCount}
                                </span>
                            )}
                        </button>

                        {showFilterDropdown && (
                            <div className="absolute right-0 mt-2 w-72 bg-white rounded-xl shadow-lg border border-gray-100 p-4 z-10">
                                <div className="flex justify-between items-center mb-4">
                                    <h3 className="font-bold text-gray-900">Filters</h3>
                                    {activeFilterCount > 0 && (
                                        <button
                                            onClick={clearFilters}
                                            className="text-xs text-primary-600 hover:text-primary-700 font-medium"
                                        >
                                            Clear all
                                        </button>
                                    )}
                                </div>

                                <div className="space-y-4">
                                    <div>
                                        <label className="block text-xs font-semibold text-gray-700 mb-2">Department</label>
                                        <select
                                            value={filters.department}
                                            onChange={(e) => handleFilterChange('department', e.target.value)}
                                            className="w-full px-3 py-2 bg-gray-50 border border-gray-200 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-primary-500"
                                        >
                                            {departments.map(dept => (
                                                <option key={dept} value={dept} className="capitalize">
                                                    {dept === 'all' ? 'All Departments' : dept}
                                                </option>
                                            ))}
                                        </select>
                                    </div>

                                    <div>
                                        <label className="block text-xs font-semibold text-gray-700 mb-2">Designation</label>
                                        <select
                                            value={filters.designation}
                                            onChange={(e) => handleFilterChange('designation', e.target.value)}
                                            className="w-full px-3 py-2 bg-gray-50 border border-gray-200 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-primary-500"
                                        >
                                            {designations.map(desig => (
                                                <option key={desig} value={desig} className="capitalize">
                                                    {desig === 'all' ? 'All Designations' : desig}
                                                </option>
                                            ))}
                                        </select>
                                    </div>

                                    <div>
                                        <label className="block text-xs font-semibold text-gray-700 mb-2">Status</label>
                                        <select
                                            value={filters.status}
                                            onChange={(e) => handleFilterChange('status', e.target.value)}
                                            className="w-full px-3 py-2 bg-gray-50 border border-gray-200 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-primary-500"
                                        >
                                            {statuses.map(status => (
                                                <option key={status} value={status} className="capitalize">
                                                    {status === 'all' ? 'All Statuses' : status}
                                                </option>
                                            ))}
                                        </select>
                                    </div>
                                </div>
                            </div>
                        )}
                    </div>
                </div>

                {/* Table */}
                <div className="overflow-x-auto">
                    <table className="w-full text-left">
                        <thead className="bg-gray-50 text-gray-500 text-xs font-bold uppercase tracking-wider">
                            <tr>
                                <th className="px-6 py-4">Employee</th>
                                <th className="px-6 py-4">Employee ID</th>
                                <th className="px-6 py-4">Department</th>
                                <th className="px-6 py-4">Designation</th>
                                <th className="px-6 py-4">Status</th>
                                {canManage && <th className="px-6 py-4">Actions</th>}
                            </tr>
                        </thead>
                        <tbody className="divide-y divide-gray-50">
                            {loading ? (
                                [1, 2, 3, 4, 5].map(i => (
                                    <tr key={i} className="animate-pulse">
                                        <td colSpan={canManage ? 6 : 5} className="px-6 py-8">
                                            <div className="h-4 bg-gray-100 rounded w-full"></div>
                                        </td>
                                    </tr>
                                ))
                            ) : filteredEmployees.length === 0 ? (
                                <tr>
                                    <td colSpan={canManage ? 6 : 5} className="px-6 py-12 text-center text-gray-500">
                                        No employees found matching your search.
                                    </td>
                                </tr>
                            ) : (
                                filteredEmployees.map((emp) => (
                                    <tr key={emp._id} className="hover:bg-gray-50 transition-all group">
                                        <td className="px-6 py-4">
                                            <div className="flex items-center gap-3">
                                                <div className="w-10 h-10 rounded-full bg-primary-50 text-primary-600 flex items-center justify-center font-bold text-sm">
                                                    {emp.firstName[0]}{emp.lastName[0]}
                                                </div>
                                                <div>
                                                    <p className="font-semibold text-gray-900 group-hover:text-primary-700">{emp.firstName} {emp.lastName}</p>
                                                    <p className="text-xs text-gray-500">{emp.email}</p>
                                                </div>
                                            </div>
                                        </td>
                                        <td className="px-6 py-4 font-mono text-sm text-gray-600">{emp.employeeId}</td>
                                        <td className="px-6 py-4 text-sm text-gray-700">{emp.department}</td>
                                        <td className="px-6 py-4 text-sm text-gray-700">{emp.designation}</td>
                                        <td className="px-6 py-4">
                                            <span className={`px-2.5 py-1 rounded-lg text-xs font-bold capitalize ${emp.status === 'active' ? 'bg-green-50 text-green-700' : 'bg-red-50 text-red-700'
                                                }`}>
                                                {emp.status}
                                            </span>
                                        </td>
                                        {canManage && (
                                            <td className="px-6 py-4">
                                                <div className="flex items-center gap-2">
                                                    <Link
                                                        to={`/profile/${emp._id}`}
                                                        className="p-2 text-primary-600 hover:bg-primary-50 rounded-lg transition-colors"
                                                        title="View Profile"
                                                    >
                                                        <UserIcon size={16} />
                                                    </Link>
                                                    <button
                                                        onClick={() => handleEdit(emp)}
                                                        className="p-2 text-blue-600 hover:bg-blue-50 rounded-lg transition-colors"
                                                        title="Quick Edit"
                                                    >
                                                        <Edit size={16} />
                                                    </button>
                                                    <button
                                                        onClick={() => handleDelete(emp._id)}
                                                        className="p-2 text-red-600 hover:bg-red-50 rounded-lg transition-colors"
                                                        title="Delete"
                                                    >
                                                        <Trash2 size={16} />
                                                    </button>
                                                </div>
                                            </td>
                                        )}
                                    </tr>
                                ))
                            )}
                        </tbody>
                    </table>
                </div>
            </div>

            {/* Add/Edit Modal */}
            {showModal && canManage && (
                <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/50 backdrop-blur-sm">
                    <div className="bg-white rounded-2xl w-full max-w-2xl p-8 shadow-2xl scale-in max-h-[90vh] overflow-y-auto">
                        <div className="flex justify-between items-center mb-6">
                            <h3 className="text-xl font-bold text-gray-900">
                                {editingEmployee ? 'Edit Employee' : 'Add New Employee'}
                            </h3>
                            <button onClick={handleCloseModal} className="p-2 hover:bg-gray-100 rounded-lg transition-colors">
                                <X size={20} />
                            </button>
                        </div>

                        <form onSubmit={handleSubmit(onSubmit)} className="space-y-5">
                            <div className="grid grid-cols-2 gap-4">
                                <div>
                                    <label className="block text-sm font-semibold text-gray-700 mb-1">First Name</label>
                                    <input
                                        {...register('firstName', { required: true })}
                                        className="w-full px-4 py-2 bg-gray-50 border border-gray-200 rounded-xl outline-none focus:ring-2 focus:ring-primary-500"
                                        placeholder="John"
                                    />
                                </div>
                                <div>
                                    <label className="block text-sm font-semibold text-gray-700 mb-1">Last Name</label>
                                    <input
                                        {...register('lastName', { required: true })}
                                        className="w-full px-4 py-2 bg-gray-50 border border-gray-200 rounded-xl outline-none focus:ring-2 focus:ring-primary-500"
                                        placeholder="Doe"
                                    />
                                </div>
                            </div>

                            <div>
                                <label className="block text-sm font-semibold text-gray-700 mb-1">Work Email</label>
                                <input
                                    {...register('email', {
                                        required: true,
                                        pattern: /^\w+([\.-]?\w+)*@\w+([\.-]?\w+)*(\.\w{2,3})+$/
                                    })}
                                    className="w-full px-4 py-2 bg-gray-50 border border-gray-200 rounded-xl outline-none focus:ring-2 focus:ring-primary-500"
                                    placeholder="john.doe@company.com"
                                />
                                {errors.email && <span className="text-xs text-red-500 ml-1">Please enter a valid work email</span>}
                            </div>

                            <div className="grid grid-cols-2 gap-4">
                                <div>
                                    <label className="block text-sm font-semibold text-gray-700 mb-1">Gender</label>
                                    <select
                                        {...register('gender')}
                                        className="w-full px-4 py-2 bg-gray-50 border border-gray-200 rounded-xl outline-none focus:ring-2 focus:ring-primary-500"
                                    >
                                        <option value="male">Male</option>
                                        <option value="female">Female</option>
                                        <option value="other">Other</option>
                                    </select>
                                </div>
                                <div>
                                    <label className="block text-sm font-semibold text-gray-700 mb-1">Phone Number</label>
                                    <input
                                        {...register('phoneNumber')}
                                        className="w-full px-4 py-2 bg-gray-50 border border-gray-200 rounded-xl outline-none focus:ring-2 focus:ring-primary-500"
                                        placeholder="+1 234 567 890"
                                    />
                                </div>
                            </div>

                            <div>
                                <label className="block text-sm font-semibold text-gray-700 mb-1">Address</label>
                                <textarea
                                    {...register('address')}
                                    rows="2"
                                    className="w-full px-4 py-2 bg-gray-50 border border-gray-200 rounded-xl outline-none focus:ring-2 focus:ring-primary-500 resize-none"
                                    placeholder="123 Street, City, Country"
                                ></textarea>
                            </div>

                            <div className="grid grid-cols-2 gap-4">
                                <div>
                                    <label className="block text-sm font-semibold text-gray-700 mb-1">Employee ID</label>
                                    <input
                                        {...register('employeeId', { required: true })}
                                        className="w-full px-4 py-2 bg-gray-50 border border-gray-200 rounded-xl outline-none focus:ring-2 focus:ring-primary-500"
                                        placeholder="EMP008"
                                    />
                                </div>
                                <div>
                                    <label className="block text-sm font-semibold text-gray-700 mb-1">Department</label>
                                    <input
                                        {...register('department', { required: true })}
                                        className="w-full px-4 py-2 bg-gray-50 border border-gray-200 rounded-xl outline-none focus:ring-2 focus:ring-primary-500"
                                        placeholder="Engineering"
                                    />
                                </div>
                            </div>

                            <div className="grid grid-cols-2 gap-4">
                                <div>
                                    <label className="block text-sm font-semibold text-gray-700 mb-1">Designation</label>
                                    <input
                                        {...register('designation', { required: true })}
                                        className="w-full px-4 py-2 bg-gray-50 border border-gray-200 rounded-xl outline-none focus:ring-2 focus:ring-primary-500"
                                        placeholder="Software Engineer"
                                    />
                                </div>
                                <div>
                                    <label className="block text-sm font-semibold text-gray-700 mb-1">Account Role</label>
                                    <select
                                        {...register('role', { required: true })}
                                        defaultValue="employee"
                                        className="w-full px-4 py-2 bg-gray-50 border border-gray-200 rounded-xl outline-none focus:ring-2 focus:ring-primary-500"
                                    >
                                        <option value="employee">Employee</option>
                                        <option value="manager">Manager</option>
                                        <option value="hr">HR Manager</option>
                                        <option value="admin">System Admin</option>
                                    </select>
                                </div>
                            </div>

                            <div>
                                <label className="block text-sm font-semibold text-gray-700 mb-1">Reporting Manager</label>
                                <select
                                    {...register('reportingManager')}
                                    className="w-full px-4 py-2 bg-gray-50 border border-gray-200 rounded-xl outline-none focus:ring-2 focus:ring-primary-500"
                                >
                                    <option value="">No Manager</option>
                                    {employees
                                        .filter(emp => emp._id !== editingEmployee?._id)
                                        .map(emp => (
                                            <option key={emp._id} value={emp._id}>
                                                {emp.firstName} {emp.lastName} ({emp.designation})
                                            </option>
                                        ))
                                    }
                                </select>
                            </div>

                            <div className="grid grid-cols-2 gap-4">
                                <div>
                                    <label className="block text-sm font-semibold text-gray-700 mb-1">Date of Birth</label>
                                    <input
                                        type="date"
                                        {...register('dob')}
                                        className="w-full px-4 py-2 bg-gray-50 border border-gray-200 rounded-xl outline-none focus:ring-2 focus:ring-primary-500"
                                    />
                                </div>
                                <div>
                                    <label className="block text-sm font-semibold text-gray-700 mb-1">Date of Joining</label>
                                    <input
                                        type="date"
                                        {...register('dateOfJoining', { required: true })}
                                        className="w-full px-4 py-2 bg-gray-50 border border-gray-200 rounded-xl outline-none focus:ring-2 focus:ring-primary-500"
                                    />
                                </div>
                            </div>

                            <div>
                                <label className="block text-sm font-semibold text-gray-700 mb-1">Account Status</label>
                                <select
                                    {...register('status', { required: true })}
                                    className="w-full px-4 py-2 bg-gray-50 border border-gray-200 rounded-xl outline-none focus:ring-2 focus:ring-primary-500"
                                >
                                    <option value="active">Active</option>
                                    <option value="inactive">Inactive</option>
                                    <option value="terminated">Terminated</option>
                                </select>
                            </div>

                            <div className="pt-4 border-t border-gray-100">
                                <h4 className="text-sm font-bold text-gray-900 mb-4">Salary Details (Monthly)</h4>
                                <div className="grid grid-cols-2 gap-4">
                                    <div>
                                        <label className="block text-xs font-semibold text-gray-500 mb-1">Basic Salary</label>
                                        <input
                                            type="number"
                                            {...register('salary.basic', { required: true })}
                                            className="w-full px-4 py-2 bg-gray-50 border border-gray-200 rounded-xl outline-none focus:ring-2 focus:ring-primary-500"
                                            placeholder="50000"
                                        />
                                    </div>
                                    <div>
                                        <label className="block text-xs font-semibold text-gray-500 mb-1">HRA</label>
                                        <input
                                            type="number"
                                            {...register('salary.hra')}
                                            className="w-full px-4 py-2 bg-gray-50 border border-gray-200 rounded-xl outline-none focus:ring-2 focus:ring-primary-500"
                                            placeholder="20000"
                                        />
                                    </div>
                                    <div>
                                        <label className="block text-xs font-semibold text-gray-500 mb-1">Allowances</label>
                                        <input
                                            type="number"
                                            {...register('salary.allowances')}
                                            className="w-full px-4 py-2 bg-gray-50 border border-gray-200 rounded-xl outline-none focus:ring-2 focus:ring-primary-500"
                                            placeholder="10000"
                                        />
                                    </div>
                                    <div>
                                        <label className="block text-xs font-semibold text-gray-500 mb-1">Deductions</label>
                                        <input
                                            type="number"
                                            {...register('salary.deductions')}
                                            className="w-full px-4 py-2 bg-gray-50 border border-gray-200 rounded-xl outline-none focus:ring-2 focus:ring-primary-500"
                                            placeholder="5000"
                                        />
                                    </div>
                                </div>
                            </div>

                            <div className="flex gap-3 pt-4 border-t border-gray-100">
                                <button
                                    type="button"
                                    onClick={handleCloseModal}
                                    className="flex-1 py-2.5 text-gray-500 font-semibold hover:bg-gray-50 rounded-xl transition-all"
                                >
                                    Cancel
                                </button>
                                <button
                                    disabled={actionLoading}
                                    type="submit"
                                    className="flex-1 py-2.5 bg-primary-600 text-white font-bold rounded-xl hover:bg-primary-700 transition-all shadow-lg shadow-primary-100 disabled:opacity-50"
                                >
                                    {actionLoading ? <Loader2 className="animate-spin mx-auto" size={20} /> : (editingEmployee ? 'Update Employee' : 'Add Employee')}
                                </button>
                            </div>
                        </form>
                    </div>
                </div>
            )}
        </div>
    );
};

export default EmployeesPage;
