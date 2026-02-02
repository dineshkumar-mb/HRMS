import { useState } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import {
    Calendar,
    FileSpreadsheet,
    Clock,
    AlertCircle,
    ChevronRight,
    MapPin,
    CalendarClock
} from 'lucide-react';
import useAuthStore from '../store/useAuthStore';
import RegularizationModal from '../components/attendance/RegularizationModal';

const AttendancePage = () => {
    const navigate = useNavigate();
    const [showRegularizationModal, setShowRegularizationModal] = useState(false);

    const tools = [
        {
            title: 'Attendance Calendar',
            description: 'View your daily in/out times and total work hours in a monthly grid.',
            icon: Calendar,
            path: '/attendance-management/calendar',
            color: 'bg-blue-500'
        },

        {
            title: 'Detailed Punch Log',
            description: 'View every check-in and check-out timestamp with location verification.',
            icon: Clock,
            path: '/attendance-management/log',
            color: 'bg-indigo-500'
        },
        {
            title: 'Manage Requests',
            description: 'Approve or reject employee attendance correction requests.',
            icon: CalendarClock,
            path: '/attendance-management/manage-requests',
            color: 'bg-red-500',
            roles: ['admin', 'hr']
        },
        {
            title: 'Regularization Request',
            description: 'Raise a query if your attendance status is incorrect.',
            icon: AlertCircle,
            onClick: () => setShowRegularizationModal(true),
            color: 'bg-orange-500'
        }
    ];

    const { user } = useAuthStore();
    const filteredTools = tools.filter(tool => !tool.roles || tool.roles.includes(user.role));

    return (
        <div className="space-y-6">
            <div className="flex justify-between items-center text-xs text-[#5bc0de]">
                <h1 className="text-xl font-bold text-gray-800">Attendance Management</h1>
                <div className="flex items-center gap-1">
                    <Clock size={12} />
                    <span>Home &gt; Attendance Management</span>
                </div>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                {filteredTools.map((tool) => (
                    tool.path ? (
                        <Link
                            key={tool.title}
                            to={tool.path}
                            className="bg-white p-6 rounded-sm border border-gray-200 shadow-sm hover:shadow-md transition-all group"
                        >
                            <div className={`${tool.color} w-12 h-12 rounded-lg flex items-center justify-center text-white mb-4 shadow-lg group-hover:scale-110 transition-transform`}>
                                <tool.icon size={24} />
                            </div>
                            <h3 className="text-lg font-bold text-gray-800 mb-2">{tool.title}</h3>
                            <p className="text-sm text-gray-500 mb-4">{tool.description}</p>
                            <div className="flex items-center text-[#5bc0de] font-bold text-sm">
                                Open Tool <ChevronRight size={16} />
                            </div>
                        </Link>
                    ) : (
                        <button
                            key={tool.title}
                            onClick={tool.onClick}
                            className="bg-white p-6 rounded-sm border border-gray-200 shadow-sm hover:shadow-md transition-all group text-left w-full"
                        >
                            <div className={`${tool.color} w-12 h-12 rounded-lg flex items-center justify-center text-white mb-4 shadow-lg group-hover:scale-110 transition-transform`}>
                                <tool.icon size={24} />
                            </div>
                            <h3 className="text-lg font-bold text-gray-800 mb-2">{tool.title}</h3>
                            <p className="text-sm text-gray-500 mb-4">{tool.description}</p>
                            <div className="flex items-center text-[#5bc0de] font-bold text-sm">
                                Open Tool <ChevronRight size={16} />
                            </div>
                        </button>
                    )
                ))}
            </div>

            <RegularizationModal
                isOpen={showRegularizationModal}
                onClose={() => setShowRegularizationModal(false)}
                onSuccess={() => alert('Regularization request submitted successfully')}
            />

            <div className="bg-white rounded-sm border border-gray-200 shadow-sm overflow-hidden mt-8">
                <div className="bg-[#5bc0de] text-white px-4 py-2 font-bold text-sm">
                    Policy Information
                </div>
                <div className="p-6 space-y-4 text-sm text-gray-600">
                    <div className="flex items-start gap-3">
                        <MapPin className="text-[#5bc0de] mt-1" size={18} />
                        <div>
                            <p className="font-bold">Shift Timing</p>
                            <p>Regular Shift: 09:00 AM - 06:00 PM</p>
                            <p>Grace Period: 15 minutes (Up to 09:15 AM)</p>
                        </div>
                    </div>
                    <div className="flex items-start gap-3 border-t border-gray-100 pt-4">
                        <AlertCircle className="text-orange-500 mt-1" size={18} />
                        <div>
                            <p className="font-bold">Late Arrival Policy</p>
                            <p>Attendance marked after 9:15 AM will automatically be considered as "Half Day" (P/2).</p>
                        </div>
                    </div>
                </div>
            </div>
        </div>
    );
};

export default AttendancePage;
