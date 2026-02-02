import { useState } from 'react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { Lock, Eye, EyeOff, Loader2, CheckCircle, ShieldCheck, AlertCircle } from 'lucide-react';
import api from '../services/api';
import SupportModal from '../components/SupportModal';

const changePasswordSchema = z.object({
    currentPassword: z.string().min(1, 'Current password is required'),
    newPassword: z.string().min(6, 'New password must be at least 6 characters'),
    confirmPassword: z.string().min(1, 'Please confirm your new password'),
}).refine((data) => data.newPassword === data.confirmPassword, {
    message: "Passwords don't match",
    path: ["confirmPassword"],
});

const ChangePasswordPage = () => {
    const [showPasswords, setShowPasswords] = useState({ current: false, new: false, confirm: false });
    const [loading, setLoading] = useState(false);
    const [success, setSuccess] = useState(false);
    const [serverError, setServerError] = useState('');
    const [isSupportModalOpen, setIsSupportModalOpen] = useState(false);

    const {
        register,
        handleSubmit,
        reset,
        formState: { errors },
    } = useForm({
        resolver: zodResolver(changePasswordSchema),
    });

    const togglePasswordVisibility = (field) => {
        setShowPasswords(prev => ({ ...prev, [field]: !prev[field] }));
    };

    const onSubmit = async (data) => {
        setLoading(true);
        setServerError('');
        try {
            await api.put('/auth/change-password', {
                currentPassword: data.currentPassword,
                newPassword: data.newPassword,
            });
            setSuccess(true);
            reset();
            // Reset success message after 5 seconds
            setTimeout(() => setSuccess(false), 5000);
        } catch (error) {
            setServerError(error.response?.data?.message || 'Failed to change password. Please verify your current password.');
        } finally {
            setLoading(false);
        }
    };

    return (
        <div className="max-w-xl mx-auto py-8 px-4">
            <div className="bg-white rounded-3xl shadow-xl border border-gray-100 overflow-hidden">
                <div className="h-2 bg-gradient-to-r from-primary-600 to-primary-400"></div>

                <div className="p-8">
                    <div className="flex items-center gap-4 mb-8">
                        <div className="w-12 h-12 bg-primary-50 rounded-2xl flex items-center justify-center text-primary-600">
                            <ShieldCheck size={28} />
                        </div>
                        <div>
                            <h1 className="text-2xl font-bold text-gray-900">Security Settings</h1>
                            <p className="text-gray-500 text-sm">Update your account password regularly to stay secure.</p>
                        </div>
                    </div>

                    {success && (
                        <div className="mb-6 p-4 bg-green-50 border border-green-100 text-green-700 rounded-2xl flex items-center gap-3 animate-in fade-in zoom-in duration-300">
                            <CheckCircle size={20} className="shrink-0" />
                            <p className="text-sm font-semibold">Your password has been changed successfully!</p>
                        </div>
                    )}

                    {serverError && (
                        <div className="mb-6 p-4 bg-red-50 border border-red-100 text-red-600 rounded-2xl flex items-center gap-3 animate-in fade-in zoom-in duration-300">
                            <AlertCircle size={20} className="shrink-0" />
                            <p className="text-sm font-semibold">{serverError}</p>
                        </div>
                    )}

                    <form onSubmit={handleSubmit(onSubmit)} className="space-y-6">
                        <div>
                            <label className="block text-sm font-bold text-gray-700 mb-2 ml-1">Current Password</label>
                            <div className="relative group">
                                <div className="absolute inset-y-0 left-0 pl-4 flex items-center pointer-events-none text-gray-400 group-focus-within:text-primary-500 transition-colors">
                                    <Lock size={18} />
                                </div>
                                <input
                                    {...register('currentPassword')}
                                    type={showPasswords.current ? 'text' : 'password'}
                                    className={`block w-full pl-11 pr-12 py-3.5 border-2 rounded-2xl leading-5 bg-gray-50/50 hover:bg-white focus:bg-white placeholder-gray-400 focus:outline-none focus:ring-4 focus:ring-primary-500/10 focus:border-primary-500 transition-all sm:text-sm ${errors.currentPassword ? 'border-red-200' : 'border-gray-100'}`}
                                    placeholder="Enter current password"
                                />
                                <button
                                    type="button"
                                    onClick={() => togglePasswordVisibility('current')}
                                    className="absolute inset-y-0 right-0 pr-4 flex items-center text-gray-400 hover:text-gray-600 transition-colors"
                                >
                                    {showPasswords.current ? <EyeOff size={18} /> : <Eye size={18} />}
                                </button>
                            </div>
                            {errors.currentPassword && <p className="mt-2 text-xs font-semibold text-red-500 ml-1">{errors.currentPassword.message}</p>}
                        </div>

                        <div className="h-px bg-gray-100 my-2"></div>

                        <div>
                            <label className="block text-sm font-bold text-gray-700 mb-2 ml-1">New Password</label>
                            <div className="relative group">
                                <div className="absolute inset-y-0 left-0 pl-4 flex items-center pointer-events-none text-gray-400 group-focus-within:text-primary-500 transition-colors">
                                    <Lock size={18} />
                                </div>
                                <input
                                    {...register('newPassword')}
                                    type={showPasswords.new ? 'text' : 'password'}
                                    className={`block w-full pl-11 pr-12 py-3.5 border-2 rounded-2xl leading-5 bg-gray-50/50 hover:bg-white focus:bg-white placeholder-gray-400 focus:outline-none focus:ring-4 focus:ring-primary-500/10 focus:border-primary-500 transition-all sm:text-sm ${errors.newPassword ? 'border-red-200' : 'border-gray-100'}`}
                                    placeholder="Create new password"
                                />
                                <button
                                    type="button"
                                    onClick={() => togglePasswordVisibility('new')}
                                    className="absolute inset-y-0 right-0 pr-4 flex items-center text-gray-400 hover:text-gray-600 transition-colors"
                                >
                                    {showPasswords.new ? <EyeOff size={18} /> : <Eye size={18} />}
                                </button>
                            </div>
                            {errors.newPassword && <p className="mt-2 text-xs font-semibold text-red-500 ml-1">{errors.newPassword.message}</p>}
                            <p className="mt-2 text-[10px] text-gray-400 font-medium px-1">At least 6 characters including letters and numbers.</p>
                        </div>

                        <div>
                            <label className="block text-sm font-bold text-gray-700 mb-2 ml-1">Confirm New Password</label>
                            <div className="relative group">
                                <div className="absolute inset-y-0 left-0 pl-4 flex items-center pointer-events-none text-gray-400 group-focus-within:text-primary-500 transition-colors">
                                    <Lock size={18} />
                                </div>
                                <input
                                    {...register('confirmPassword')}
                                    type={showPasswords.confirm ? 'text' : 'password'}
                                    className={`block w-full pl-11 pr-12 py-3.5 border-2 rounded-2xl leading-5 bg-gray-50/50 hover:bg-white focus:bg-white placeholder-gray-400 focus:outline-none focus:ring-4 focus:ring-primary-500/10 focus:border-primary-500 transition-all sm:text-sm ${errors.confirmPassword ? 'border-red-200' : 'border-gray-100'}`}
                                    placeholder="Confirm new password"
                                />
                                <button
                                    type="button"
                                    onClick={() => togglePasswordVisibility('confirm')}
                                    className="absolute inset-y-0 right-0 pr-4 flex items-center text-gray-400 hover:text-gray-600 transition-colors"
                                >
                                    {showPasswords.confirm ? <EyeOff size={18} /> : <Eye size={18} />}
                                </button>
                            </div>
                            {errors.confirmPassword && <p className="mt-2 text-xs font-semibold text-red-500 ml-1">{errors.confirmPassword.message}</p>}
                        </div>

                        <div className="pt-4">
                            <button
                                type="submit"
                                disabled={loading}
                                className="w-full py-4 bg-primary-600 text-white font-black rounded-2xl hover:bg-primary-700 transition-all shadow-xl shadow-primary-200 flex items-center justify-center gap-3 active:scale-95 disabled:opacity-70"
                            >
                                {loading ? <Loader2 className="animate-spin" size={20} /> : <ShieldCheck size={20} />}
                                Update Password
                            </button>
                        </div>
                    </form>
                </div>
            </div>

            <div className="mt-8 text-center">
                <p className="text-gray-400 text-xs">
                    Having trouble? <button
                        onClick={() => setIsSupportModalOpen(true)}
                        className="text-primary-600 font-bold hover:underline"
                    >
                        Contact Support
                    </button>
                </p>
            </div>

            <SupportModal
                isOpen={isSupportModalOpen}
                onClose={() => setIsSupportModalOpen(false)}
            />
        </div>
    );
};

export default ChangePasswordPage;
