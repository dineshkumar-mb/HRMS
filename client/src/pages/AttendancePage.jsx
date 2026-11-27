import { useState } from 'react';
import { Link } from 'react-router-dom';
import {
    Calendar,
    Clock,
    AlertCircle,
    ChevronRight,
    MapPin,
    CalendarClock,
    FileSpreadsheet
} from 'lucide-react';
import useAuthStore from '../store/useAuthStore';
import { toast } from '../store/useUIStore';
import RegularizationModal from '../components/attendance/RegularizationModal';

const AttendancePage = () => {
    const [showRegularizationModal, setShowRegularizationModal] = useState(false);

    const tools = [
        {
            title: 'Attendance Calendar',
            description: 'View your daily in/out times and total work hours in a monthly grid.',
            icon: Calendar,
            path: '/attendance-management/calendar',
            color: 'bg-primary-600'
        },
        {
            title: 'Detailed Punch Log',
            description: 'View every check-in and check-out timestamp with location verification.',
            icon: Clock,
            path: '/attendance-management/log',
            color: 'bg-indigo-600'
        },
        {
            title: 'Manage Requests',
            description: 'Approve or reject employee attendance correction requests.',
            icon: CalendarClock,
            path: '/attendance-management/manage-requests',
            color: 'bg-rose-600',
            roles: ['admin', 'hr']
        },
        {
            title: 'Attendance Report',
            description: 'View the monthly organization-wide attendance matrix.',
            icon: FileSpreadsheet,
            path: '/attendance-management/report',
            color: 'bg-emerald-600',
            roles: ['admin', 'hr']
        },
        {
            title: 'Regularization Request',
            description: 'Raise a query if your attendance status is incorrect.',
            icon: AlertCircle,
            onClick: () => setShowRegularizationModal(true),
            color: 'bg-amber-600'
        }
    ];

    const { user } = useAuthStore();
    const filteredTools = tools.filter(tool => !tool.roles || tool.roles.includes(user.role));

    return (
        <div className="space-y-6">
            <div>
                <h1 className="text-2xl font-bold text-slate-900 tracking-tight">Attendance Management</h1>
                <p className="text-sm text-slate-500 mt-0.5">Track daily attendance, view logs, and manage correction requests.</p>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-5">
                {filteredTools.map((tool) => {
                    const cardContent = (
                        <>
                            <div className={`${tool.color} w-12 h-12 rounded-xl flex items-center justify-center text-white mb-4 shadow-md group-hover:scale-105 transition-transform`}>
                                <tool.icon size={22} />
                            </div>
                            <h3 className="text-base font-bold text-slate-900 mb-1.5">{tool.title}</h3>
                            <p className="text-sm text-slate-500 mb-4 leading-relaxed">{tool.description}</p>
                            <div className="flex items-center gap-1 text-primary-600 font-semibold text-sm">
                                Open Tool <ChevronRight size={16} />
                            </div>
                        </>
                    );

                    return tool.path ? (
                        <Link
                            key={tool.title}
                            to={tool.path}
                            className="bg-white p-6 rounded-2xl border border-slate-200/80 shadow-sm hover:shadow-md hover:border-slate-300 transition-all group block"
                        >
                            {cardContent}
                        </Link>
                    ) : (
                        <button
                            type="button"
                            key={tool.title}
                            onClick={tool.onClick}
                            className="bg-white p-6 rounded-2xl border border-slate-200/80 shadow-sm hover:shadow-md hover:border-slate-300 transition-all group text-left w-full"
                        >
                            {cardContent}
                        </button>
                    );
                })}
            </div>

            <RegularizationModal
                isOpen={showRegularizationModal}
                onClose={() => setShowRegularizationModal(false)}
                onSuccess={() => toast.success('Regularization request submitted successfully')}
            />

            <div className="bg-white rounded-2xl border border-slate-200/80 shadow-sm overflow-hidden">
                <div className="bg-slate-50 border-b border-slate-100 px-6 py-4 font-bold text-sm text-slate-900">
                    Policy Information
                </div>
                <div className="p-6 space-y-4 text-sm text-slate-600">
                    <div className="flex items-start gap-3">
                        <MapPin className="text-primary-600 mt-0.5 shrink-0" size={18} />
                        <div>
                            <p className="font-bold text-slate-900">Shift Timing</p>
                            <p>Regular Shift: 09:00 AM - 06:00 PM</p>
                            <p>Grace Period: 15 minutes (Up to 09:15 AM)</p>
                        </div>
                    </div>
                    <div className="flex items-start gap-3 border-t border-slate-100 pt-4">
                        <AlertCircle className="text-amber-600 mt-0.5 shrink-0" size={18} />
                        <div>
                            <p className="font-bold text-slate-900">Late Arrival Policy</p>
                            <p>Attendance marked after 9:15 AM will automatically be considered as &ldquo;Half Day&rdquo; (P/2).</p>
                        </div>
                    </div>
                </div>
            </div>
        </div>
    );
};

export default AttendancePage;
