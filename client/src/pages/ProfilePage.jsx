import React, { useEffect, useState } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import {
    User as UserIcon,
    Mail,
    Phone,
    MapPin,
    Briefcase,
    Calendar,
    Gift,
    Shield,
    Lock,
    FileText,
    Loader2,
    Camera,
    ScanFace,
    Edit3,
    Save,
    X,
    Trash2,
    Smartphone
} from 'lucide-react';
import api from '../services/api';
import useAuthStore from '../store/useAuthStore';
import FaceEnrollment from '../features/auth/FaceEnrollment';

const ProfilePage = () => {
    const { id } = useParams();
    const navigate = useNavigate();
    const { user: authUser } = useAuthStore();
    const [profile, setProfile] = useState(null);
    const [loading, setLoading] = useState(true);
    const [isEditing, setIsEditing] = useState(false);
    const [formData, setFormData] = useState({});
    const [saving, setSaving] = useState(false);
    const [showPasswordModal, setShowPasswordModal] = useState(false);
    const [showFaceModal, setShowFaceModal] = useState(false);
    const [passwordData, setPasswordData] = useState({ currentPassword: '', newPassword: '', confirmPassword: '' });
    const [passwordLoading, setPasswordLoading] = useState(false);

    // 2FA State
    const [showTwoFactorModal, setShowTwoFactorModal] = useState(false);
    const [qrCode, setQrCode] = useState('');
    const [twoFactorCode, setTwoFactorCode] = useState('');
    const [twoFactorSecret, setTwoFactorSecret] = useState('');
    const [twoFactorLoading, setTwoFactorLoading] = useState(false);
    const [isTwoFactorEnabled, setIsTwoFactorEnabled] = useState(false);

    const isAdmin = ['admin', 'hr'].includes(authUser?.role);
    const isOwnProfile = !id || id === authUser?.employee;

    useEffect(() => {
        fetchProfile();
    }, [id]);

    const fetchProfile = async () => {
        try {
            setLoading(true);
            const endpoint = id ? `/employees/${id}` : '/auth/profile';
            const { data } = await api.get(endpoint);

            // Format data based on endpoint response
            const profileData = id ? { employee: data.data, role: 'N/A', email: data.data.email } : data;
            setProfile(profileData);

            if (profileData.isTwoFactorEnabled) {
                setIsTwoFactorEnabled(true);
            } else {
                setIsTwoFactorEnabled(false);
            }

            // Initialize form data
            if (profileData.employee) {
                setFormData({
                    firstName: profileData.employee.firstName,
                    lastName: profileData.employee.lastName,
                    email: profileData.email,
                    phoneNumber: profileData.employee.phoneNumber,
                    address: profileData.employee.address,
                    department: profileData.employee.department,
                    designation: profileData.employee.designation,
                    employeeId: profileData.employee.employeeId,
                    dob: profileData.employee.dob ? profileData.employee.dob.split('T')[0] : '',
                    dateOfJoining: profileData.employee.dateOfJoining ? profileData.employee.dateOfJoining.split('T')[0] : '',
                    status: profileData.employee.status
                });
            }
        } catch (error) {
            console.error('Error fetching profile:', error);
            alert('Failed to load profile');
        } finally {
            setLoading(false);
        }
    };

    const handleEnable2FA = async () => {
        try {
            setTwoFactorLoading(true);
            const { data } = await api.post('/auth/2fa/generate');
            setQrCode(data.qrCode);
            setTwoFactorSecret(data.secret);
            setShowTwoFactorModal(true);
        } catch (err) {
            alert('Failed to generate 2FA secret');
        } finally {
            setTwoFactorLoading(false);
        }
    };

    const handleVerify2FA = async () => {
        try {
            setTwoFactorLoading(true);
            await api.post('/auth/2fa/verify', { token: twoFactorCode });
            setIsTwoFactorEnabled(true);
            setShowTwoFactorModal(false);
            setTwoFactorCode('');
            alert('Two-Factor Authentication Enabled Successfully!');
            fetchProfile(); // Refresh profile to sync state
        } catch (err) {
            alert(err.response?.data?.message || 'Invalid Code');
        } finally {
            setTwoFactorLoading(false);
        }
    };

    const handleDisable2FA = async () => {
        if (window.confirm('Are you sure you want to disable 2FA? This will make your account less secure.')) {
            try {
                setTwoFactorLoading(true);
                await api.post('/auth/2fa/disable');
                setIsTwoFactorEnabled(false);
                alert('Two-Factor Authentication Disabled');
                fetchProfile();
            } catch (err) {
                alert('Failed to disable 2FA');
            } finally {
                setTwoFactorLoading(false);
            }
        }
    };

    const handleSave = async () => {
        try {
            setSaving(true);
            const employeeId = profile.employee._id;
            await api.put(`/employees/${employeeId}`, formData);
            await fetchProfile();
            setIsEditing(false);
            alert('Profile updated successfully');
        } catch (error) {
            console.error('Error updating profile:', error);
            alert(error.response?.data?.message || 'Update failed');
        } finally {
            setSaving(false);
        }
    };

    const handleDelete = async () => {
        if (!window.confirm('Are you sure you want to delete this employee? This action cannot be undone.')) return;
        try {
            await api.delete(`/employees/${profile.employee._id}`);
            alert('Employee deleted');
            navigate('/employees');
        } catch (error) {
            alert('Delete failed');
        }
    };

    const handlePasswordChange = async (e) => {
        e.preventDefault();
        if (passwordData.newPassword !== passwordData.confirmPassword) {
            return alert('New passwords do not match');
        }
        try {
            setPasswordLoading(true);
            await api.put('/auth/change-password', {
                currentPassword: passwordData.currentPassword,
                newPassword: passwordData.newPassword
            });
            alert('Password changed successfully');
            setShowPasswordModal(false);
            setPasswordData({ currentPassword: '', newPassword: '', confirmPassword: '' });
        } catch (error) {
            alert(error.response?.data?.message || 'Failed to change password');
        } finally {
            setPasswordLoading(false);
        }
    };

    if (loading) return <div className="p-8 flex justify-center"><Loader2 className="animate-spin text-primary-600" size={40} /></div>;

    const employee = profile?.employee;

    return (
        <div className="space-y-8 animate-in fade-in slide-in-from-bottom-4 duration-500 max-w-6xl mx-auto">
            <div className="flex flex-col md:flex-row items-start md:items-center justify-between gap-4">
                <div>
                    <h1 className="text-3xl font-black text-gray-900 tracking-tight">
                        {isOwnProfile ? 'Personal Workspace' : 'Employee Profile'}
                    </h1>
                    <p className="text-gray-500 text-sm mt-1">
                        {isEditing ? 'Currently editing professional identity.' : 'View and manage professional identity.'}
                    </p>
                </div>
                <div className="flex gap-2">
                    {isAdmin && !isEditing && (
                        <>
                            <button
                                onClick={() => setIsEditing(true)}
                                className="flex items-center gap-2 px-5 py-2.5 bg-primary-600 text-white rounded-2xl font-bold hover:bg-primary-700 transition-all shadow-md active:scale-95"
                            >
                                <Edit3 size={18} />
                                Edit Profile
                            </button>
                            {authUser.role === 'admin' && !isOwnProfile && (
                                <button
                                    onClick={handleDelete}
                                    className="flex items-center gap-2 px-5 py-2.5 bg-red-50 text-red-600 border border-red-100 rounded-2xl font-bold hover:bg-red-100 transition-all active:scale-95"
                                >
                                    <Trash2 size={18} />
                                </button>
                            )}
                        </>
                    )}
                    {isEditing && (
                        <>
                            <button
                                onClick={handleSave}
                                disabled={saving}
                                className="flex items-center gap-2 px-5 py-2.5 bg-green-600 text-white rounded-2xl font-bold hover:bg-green-700 transition-all shadow-md active:scale-95 disabled:opacity-50"
                            >
                                <Save size={18} />
                                {saving ? 'Saving...' : 'Save Changes'}
                            </button>
                            <button
                                onClick={() => setIsEditing(false)}
                                className="flex items-center gap-2 px-5 py-2.5 bg-gray-100 text-gray-600 rounded-2xl font-bold hover:bg-gray-200 transition-all active:scale-95"
                            >
                                <X size={18} />
                                Cancel
                            </button>
                        </>
                    )}
                </div>
            </div>

            <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
                {/* Left Column: Basic Info Card */}
                <div className="lg:col-span-1 border border-gray-100 shadow-xl rounded-[32px] p-8 flex flex-col items-center bg-white relative overflow-hidden">
                    <div className="absolute top-0 left-0 w-full h-32 bg-gradient-to-br from-primary-600 to-primary-400"></div>

                    <div className="relative mt-12 mb-6">
                        <div className="w-32 h-32 rounded-[40px] bg-white p-2 shadow-2xl overflow-hidden ring-4 ring-white">
                            {employee?.profilePhoto ? (
                                <img src={employee.profilePhoto} alt="Profile" className="w-full h-full object-cover rounded-[32px]" />
                            ) : (
                                <div className="w-full h-full bg-primary-50 flex items-center justify-center text-primary-600 rounded-[32px]">
                                    <UserIcon size={56} />
                                </div>
                            )}
                        </div>
                        <button className="absolute bottom-0 right-0 p-2.5 bg-primary-600 text-white rounded-2xl shadow-lg border-4 border-white hover:bg-primary-700 transition-all transform hover:scale-110 active:scale-95">
                            <Camera size={18} />
                        </button>
                    </div>

                    <div className="text-center w-full space-y-4">
                        {isEditing ? (
                            <div className="grid grid-cols-2 gap-2">
                                <input
                                    className="bg-gray-50 border border-gray-200 p-2 rounded-xl text-center font-bold outline-none ring-2 ring-transparent focus:ring-primary-500"
                                    value={formData.firstName}
                                    onChange={e => setFormData({ ...formData, firstName: e.target.value })}
                                    placeholder="First Name"
                                />
                                <input
                                    className="bg-gray-50 border border-gray-200 p-2 rounded-xl text-center font-bold outline-none ring-2 ring-transparent focus:ring-primary-500"
                                    value={formData.lastName}
                                    onChange={e => setFormData({ ...formData, lastName: e.target.value })}
                                    placeholder="Last Name"
                                />
                            </div>
                        ) : (
                            <h2 className="text-2xl font-black text-gray-900 tracking-tight">{employee?.firstName} {employee?.lastName}</h2>
                        )}

                        {isEditing ? (
                            <input
                                className="w-full bg-gray-50 border border-gray-200 p-2 rounded-xl text-center text-primary-600 font-bold outline-none ring-2 ring-transparent focus:ring-primary-500"
                                value={formData.designation}
                                onChange={e => setFormData({ ...formData, designation: e.target.value })}
                                placeholder="Designation"
                            />
                        ) : (
                            <p className="text-primary-600 font-bold text-sm tracking-wide uppercase mt-1">{employee?.designation}</p>
                        )}

                        <div className="mt-6 flex flex-wrap justify-center gap-2">
                            {isEditing ? (
                                <select
                                    className="px-4 py-1.5 bg-green-50 text-green-700 rounded-full text-xs font-black uppercase tracking-wider border border-green-100 outline-none"
                                    value={formData.status}
                                    onChange={e => setFormData({ ...formData, status: e.target.value })}
                                >
                                    <option value="active">Active</option>
                                    <option value="inactive">Inactive</option>
                                    <option value="terminated">Terminated</option>
                                </select>
                            ) : (
                                <span className="px-4 py-1.5 bg-green-50 text-green-700 rounded-full text-xs font-black uppercase tracking-wider border border-green-100">{employee?.status}</span>
                            )}
                            <span className="px-4 py-1.5 bg-primary-50 text-primary-700 rounded-full text-xs font-black uppercase tracking-wider border border-primary-100">{profile?.role}</span>
                        </div>
                    </div>

                    <div className="w-full mt-10 space-y-4 pt-10 border-t border-gray-50">
                        <div className="flex items-center gap-4 group">
                            <div className="p-3 bg-gray-50 rounded-2xl text-gray-400 group-hover:bg-primary-50 group-hover:text-primary-600 transition-colors">
                                <Mail size={18} />
                            </div>
                            <div className="text-left flex-1">
                                <p className="text-[10px] font-black text-gray-400 uppercase tracking-widest">Email Address</p>
                                {isEditing ? (
                                    <input
                                        className="w-full bg-gray-50 border-none p-0 text-sm font-bold text-gray-700 outline-none"
                                        value={formData.email}
                                        onChange={e => setFormData({ ...formData, email: e.target.value })}
                                    />
                                ) : (
                                    <p className="text-sm font-bold text-gray-700">{profile?.email}</p>
                                )}
                            </div>
                        </div>
                        <div className="flex items-center gap-4 group">
                            <div className="p-3 bg-gray-50 rounded-2xl text-gray-400 group-hover:bg-primary-50 group-hover:text-primary-600 transition-colors">
                                <Phone size={18} />
                            </div>
                            <div className="text-left flex-1">
                                <p className="text-[10px] font-black text-gray-400 uppercase tracking-widest">Phone Number</p>
                                {isEditing ? (
                                    <input
                                        className="w-full bg-gray-50 border-none p-0 text-sm font-bold text-gray-700 outline-none"
                                        value={formData.phoneNumber}
                                        onChange={e => setFormData({ ...formData, phoneNumber: e.target.value })}
                                    />
                                ) : (
                                    <p className="text-sm font-bold text-gray-700">{employee?.phoneNumber || 'Not provided'}</p>
                                )}
                            </div>
                        </div>
                        <div className="flex items-center gap-4 group">
                            <div className="p-3 bg-gray-50 rounded-2xl text-gray-400 group-hover:bg-primary-50 group-hover:text-primary-600 transition-colors">
                                <MapPin size={18} />
                            </div>
                            <div className="text-left flex-1">
                                <p className="text-[10px] font-black text-gray-400 uppercase tracking-widest">Office Location</p>
                                {isEditing ? (
                                    <input
                                        className="w-full bg-gray-50 border-none p-0 text-sm font-bold text-gray-700 outline-none"
                                        value={formData.address}
                                        onChange={e => setFormData({ ...formData, address: e.target.value })}
                                    />
                                ) : (
                                    <p className="text-sm font-bold text-gray-700">{employee?.address || 'HRMS Headquarters'}</p>
                                )}
                            </div>
                        </div>
                    </div>
                </div>

                {/* Right Column: Detailed Tabs/Info */}
                <div className="lg:col-span-2 space-y-8">
                    <div className="bg-white border border-gray-100 shadow-xl rounded-[32px] overflow-hidden">
                        <div className="p-8 border-b border-gray-50 flex justify-between items-center">
                            <h3 className="text-xl font-black text-gray-900 flex items-center gap-3">
                                <Briefcase size={22} className="text-primary-600" />
                                Professional Details
                            </h3>
                            <Shield size={22} className="text-primary-200" />
                        </div>
                        <div className="p-8 grid grid-cols-1 md:grid-cols-2 gap-x-12 gap-y-10">
                            <div>
                                <p className="text-xs font-black text-gray-400 uppercase tracking-widest mb-2">Employee ID</p>
                                {isEditing ? (
                                    <input
                                        className="w-full text-base font-bold text-gray-800 bg-gray-50 py-2.5 px-4 rounded-xl border border-gray-100 font-mono tracking-wider outline-none"
                                        value={formData.employeeId}
                                        onChange={e => setFormData({ ...formData, employeeId: e.target.value })}
                                    />
                                ) : (
                                    <p className="text-base font-bold text-gray-800 bg-gray-50 py-2.5 px-4 rounded-xl border border-gray-100 font-mono tracking-wider">{employee?.employeeId}</p>
                                )}
                            </div>
                            <div>
                                <p className="text-xs font-black text-gray-400 uppercase tracking-widest mb-2">Department</p>
                                {isEditing ? (
                                    <input
                                        className="w-full text-base font-bold text-gray-800 bg-gray-50 py-2.5 px-4 rounded-xl border border-gray-100 outline-none"
                                        value={formData.department}
                                        onChange={e => setFormData({ ...formData, department: e.target.value })}
                                    />
                                ) : (
                                    <p className="text-base font-bold text-gray-800 bg-gray-50 py-2.5 px-4 rounded-xl border border-gray-100">{employee?.department || 'Unassigned'}</p>
                                )}
                            </div>
                            <div>
                                <p className="text-xs font-black text-gray-400 uppercase tracking-widest mb-2">Join Date</p>
                                <div className="flex items-center gap-3 py-2.5 px-4 bg-gray-50 rounded-xl border border-gray-100">
                                    <Calendar size={18} className="text-primary-500" />
                                    {isEditing ? (
                                        <input
                                            type="date"
                                            className="bg-transparent border-none text-base font-bold text-gray-800 outline-none flex-1"
                                            value={formData.dateOfJoining}
                                            onChange={e => setFormData({ ...formData, dateOfJoining: e.target.value })}
                                        />
                                    ) : (
                                        <p className="text-base font-bold text-gray-800">{new Date(employee?.dateOfJoining).toLocaleDateString('en-US', { year: 'numeric', month: 'long', day: 'numeric' })}</p>
                                    )}
                                </div>
                            </div>
                            <div>
                                <p className="text-xs font-black text-gray-400 uppercase tracking-widest mb-2">Birthday</p>
                                <div className="flex items-center gap-3 py-2.5 px-4 bg-gray-50 rounded-xl border border-gray-100">
                                    <Gift size={18} className="text-orange-500" />
                                    {isEditing ? (
                                        <input
                                            type="date"
                                            className="bg-transparent border-none text-base font-bold text-gray-800 outline-none flex-1"
                                            value={formData.dob}
                                            onChange={e => setFormData({ ...formData, dob: e.target.value })}
                                        />
                                    ) : (
                                        <p className="text-base font-bold text-gray-800">
                                            {employee?.dob
                                                ? new Date(employee.dob).toLocaleDateString('en-US', { month: 'long', day: 'numeric' })
                                                : 'Not set'}
                                        </p>
                                    )}
                                </div>
                            </div>
                            <div>
                                <p className="text-xs font-black text-gray-400 uppercase tracking-widest mb-2">Reporting Manager</p>
                                <p className="text-base font-bold text-gray-800 bg-gray-50 py-2.5 px-4 rounded-xl border border-gray-100">{employee?.reportingManager ? employee.reportingManager.fullName : 'Directly to management'}</p>
                            </div>
                        </div>
                    </div>

                    <div className="bg-white border border-gray-100 shadow-xl rounded-[32px] overflow-hidden">
                        <div className="p-8 border-b border-gray-50">
                            <h3 className="text-xl font-black text-gray-900 flex items-center gap-3">
                                <Shield size={22} className="text-primary-600" />
                                Security & Account
                            </h3>
                        </div>
                        <div className="p-8 space-y-6">
                            <div className="flex items-center justify-between p-4 bg-primary-50/50 rounded-2xl border border-primary-100">
                                <div className="flex items-center gap-3">
                                    <div className="w-10 h-10 bg-primary-600 rounded-xl flex items-center justify-center text-white">
                                        <ScanFace size={20} />
                                    </div>
                                    <div>
                                        <p className="text-sm font-black text-gray-900">Face Recognition Login</p>
                                        <p className="text-xs text-gray-500 font-medium">{profile?.faceDescriptor ? 'Biometric identity registered.' : 'Enable face recognition for secure login.'}</p>
                                    </div>
                                </div>
                                <button
                                    onClick={() => {
                                        console.log('Enroll Face button clicked');
                                        setShowFaceModal(true);
                                    }}
                                    className={`px-4 py-2 rounded-xl text-xs font-black uppercase tracking-wider transition-all ${profile?.faceDescriptor
                                        ? 'bg-green-50 text-green-700 border border-green-100'
                                        : 'bg-primary-600 text-white shadow-lg shadow-primary-100 hover:bg-primary-700'
                                        }`}
                                >
                                    {profile?.faceDescriptor ? 'Update Face' : 'Enroll Face'}
                                </button>
                            </div>

                            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                                <button
                                    onClick={() => setShowPasswordModal(true)}
                                    className="flex items-center justify-center gap-2 py-3 px-4 bg-gray-50 text-gray-700 font-bold rounded-2xl border border-gray-100 hover:bg-gray-100 transition-all"
                                >
                                    Change Password
                                </button>
                                <button
                                    onClick={isTwoFactorEnabled ? handleDisable2FA : handleEnable2FA}
                                    disabled={twoFactorLoading}
                                    className={`flex items-center justify-center gap-2 py-3 px-4 font-bold rounded-2xl border transition-all ${isTwoFactorEnabled
                                        ? 'bg-purple-50 text-purple-700 border-purple-100 hover:bg-purple-100'
                                        : 'bg-gray-50 text-gray-700 border-gray-100 hover:bg-gray-100'
                                        }`}
                                >
                                    {twoFactorLoading ? <Loader2 className="animate-spin" size={18} /> : <Lock size={18} />}
                                    {isTwoFactorEnabled ? 'Disable 2FA' : 'Enable 2FA'}
                                </button>
                            </div>
                        </div>
                    </div>
                </div>
            </div>
            {/* Change Password Modal */}
            {showPasswordModal && (
                <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/50 backdrop-blur-sm animate-in fade-in duration-200">
                    <div className="bg-white rounded-3xl w-full max-w-md p-8 shadow-2xl animate-in zoom-in slide-in-from-bottom-4 duration-300">
                        <div className="flex justify-between items-center mb-6">
                            <h3 className="text-2xl font-bold text-gray-900">Change Password</h3>
                            <button onClick={() => setShowPasswordModal(false)} className="p-2 hover:bg-gray-100 rounded-xl transition-colors">
                                <X size={20} />
                            </button>
                        </div>
                        <form onSubmit={handlePasswordChange} className="space-y-4">
                            <div>
                                <label className="block text-xs font-black text-gray-400 uppercase tracking-widest mb-2">Current Password</label>
                                <input
                                    type="password"
                                    required
                                    className="w-full px-4 py-3 bg-gray-50 border border-gray-100 rounded-2xl outline-none focus:ring-2 focus:ring-primary-500"
                                    value={passwordData.currentPassword}
                                    onChange={e => setPasswordData({ ...passwordData, currentPassword: e.target.value })}
                                />
                            </div>
                            <div>
                                <label className="block text-xs font-black text-gray-400 uppercase tracking-widest mb-2">New Password</label>
                                <input
                                    type="password"
                                    required
                                    className="w-full px-4 py-3 bg-gray-50 border border-gray-100 rounded-2xl outline-none focus:ring-2 focus:ring-primary-500"
                                    value={passwordData.newPassword}
                                    onChange={e => setPasswordData({ ...passwordData, newPassword: e.target.value })}
                                />
                            </div>
                            <div>
                                <label className="block text-xs font-black text-gray-400 uppercase tracking-widest mb-2">Confirm New Password</label>
                                <input
                                    type="password"
                                    required
                                    className="w-full px-4 py-3 bg-gray-50 border border-gray-100 rounded-2xl outline-none focus:ring-2 focus:ring-primary-500"
                                    value={passwordData.confirmPassword}
                                    onChange={e => setPasswordData({ ...passwordData, confirmPassword: e.target.value })}
                                />
                            </div>
                            <div className="pt-4">
                                <button
                                    type="submit"
                                    disabled={passwordLoading}
                                    className="w-full py-4 bg-primary-600 text-white font-black rounded-2xl hover:bg-primary-700 transition-all shadow-lg active:scale-[0.98] disabled:opacity-70 flex items-center justify-center gap-2"
                                >
                                    {passwordLoading ? <Loader2 className="animate-spin" size={20} /> : 'Update Password'}
                                </button>
                            </div>
                        </form>
                    </div>
                </div>
            )}
            {/* Face Enrollment Modal */}
            {showFaceModal && (
                <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/50 backdrop-blur-sm animate-in fade-in duration-200">
                    <FaceEnrollment
                        onComplete={() => {
                            setShowFaceModal(false);
                            fetchProfile();
                        }}
                        onCancel={() => setShowFaceModal(false)}
                    />
                </div>
            )}

            {/* 2FA Setup Modal */}
            {showTwoFactorModal && (
                <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/50 backdrop-blur-sm animate-in fade-in duration-200">
                    <div className="bg-white rounded-3xl w-full max-w-md p-8 shadow-2xl animate-in zoom-in slide-in-from-bottom-4 duration-300">
                        <div className="flex justify-between items-center mb-6">
                            <h3 className="text-2xl font-bold text-gray-900 flex items-center gap-2">
                                <Shield className="text-purple-600" />
                                Setup 2FA
                            </h3>
                            <button onClick={() => setShowTwoFactorModal(false)} className="p-2 hover:bg-gray-100 rounded-xl transition-colors">
                                <X size={20} />
                            </button>
                        </div>

                        <div className="space-y-6">
                            <div className="flex flex-col items-center justify-center space-y-4">
                                <div className="p-4 bg-white rounded-2xl shadow-lg border-2 border-primary-100">
                                    {qrCode ? (
                                        <img src={qrCode} alt="2FA QR Code" className="w-48 h-48" />
                                    ) : (
                                        <div className="w-48 h-48 flex items-center justify-center">
                                            <Loader2 className="animate-spin text-primary-600" size={32} />
                                        </div>
                                    )}
                                </div>
                                <div className="text-center space-y-2">
                                    <p className="font-bold text-gray-900">Scan this QR Code</p>
                                    <p className="text-xs text-gray-500 max-w-xs mx-auto">
                                        Open Google Authenticator or Authy on your phone and scan the code above.
                                    </p>
                                </div>
                            </div>

                            <div className="pt-4 border-t border-gray-100">
                                <label className="block text-xs font-black text-gray-400 uppercase tracking-widest mb-2 text-center">Enter 6-Digit Code</label>
                                <div className="flex gap-2">
                                    <input
                                        type="text"
                                        maxLength="6"
                                        className="w-full text-center text-2xl font-mono font-bold tracking-[0.5em] py-3 bg-gray-50 border border-gray-200 rounded-2xl outline-none focus:ring-2 focus:ring-primary-500 focus:border-transparent transition-all"
                                        placeholder="000000"
                                        value={twoFactorCode}
                                        onChange={e => setTwoFactorCode(e.target.value.replace(/[^0-9]/g, ''))}
                                    />
                                </div>
                            </div>

                            <button
                                onClick={handleVerify2FA}
                                disabled={twoFactorCode.length !== 6 || twoFactorLoading}
                                className="w-full py-4 bg-purple-600 text-white font-black rounded-2xl hover:bg-purple-700 transition-all shadow-lg active:scale-[0.98] disabled:opacity-70 flex items-center justify-center gap-2"
                            >
                                {twoFactorLoading ? <Loader2 className="animate-spin" size={20} /> : <Smartphone size={20} />}
                                Verify & Enable 2FA
                            </button>
                        </div>
                    </div>
                </div>
            )}
        </div>
    );
};

export default ProfilePage;
