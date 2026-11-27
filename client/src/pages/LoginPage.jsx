import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { Lock, Mail, Eye, EyeOff, Loader2, ScanFace, AlertCircle, X, Send, Smartphone } from 'lucide-react';
import useAuthStore from '../store/useAuthStore';
import { toast } from '../store/useUIStore';
import api from '../services/api';
import FaceLogin from '../features/auth/FaceLogin';
import SupportModal from '../components/SupportModal';

const loginSchema = z.object({
    email: z.string().email('Invalid email address'),
    password: z.string().min(6, 'Password must be at least 6 characters'),
});

import loginBg from '../assets/login-bg.png';

const LoginPage = () => {
    const [showPassword, setShowPassword] = useState(false);
    const [loginMode, setLoginMode] = useState('password'); // 'password' or 'face'
    const [showContactModal, setShowContactModal] = useState(false);
    const [showForgotModal, setShowForgotModal] = useState(false);
    const [forgotEmail, setForgotEmail] = useState('');
    const [forgotLoading, setForgotLoading] = useState(false);
    const [forgotSuccess, setForgotSuccess] = useState(false);

    const { login, setAuth, loading, error, clearError } = useAuthStore();
    const navigate = useNavigate();

    // 2FA State
    const [requires2FA, setRequires2FA] = useState(false);
    const [twoFactorCode, setTwoFactorCode] = useState('');
    const [twoFactorError, setTwoFactorError] = useState('');
    const [tempEmail, setTempEmail] = useState('');
    const [twoFactorLoading, setTwoFactorLoading] = useState(false);

    useEffect(() => {
        if (!showForgotModal) return;
        const onKeyDown = (e) => {
            if (e.key === 'Escape') closeForgotModal();
        };
        window.addEventListener('keydown', onKeyDown);
        return () => window.removeEventListener('keydown', onKeyDown);
    }, [showForgotModal]);

    const closeForgotModal = () => {
        setShowForgotModal(false);
        setForgotSuccess(false);
        setForgotEmail('');
    };

    const handleForgotSubmit = async (e) => {
        e.preventDefault();
        setForgotLoading(true);

        try {
            await api.post('/auth/forgot-password', { email: forgotEmail });
            setForgotSuccess(true);
            toast.success('Password reset link sent to your email.');
        } catch (error) {
            console.error('Error submitting forgot password form:', error);
            toast.error(error.response?.data?.message || 'Failed to send reset link. Please try again.');
        } finally {
            setForgotLoading(false);
        }
    };

    const {
        register,
        handleSubmit,
        setValue,
        formState: { errors },
    } = useForm({
        resolver: zodResolver(loginSchema),
    });

    const fillDemoCredentials = (email, password, roleLabel) => {
        setValue('email', email, { shouldValidate: true });
        setValue('password', password, { shouldValidate: true });
        clearError();
        toast.info(`Filled ${roleLabel} demo credentials`);
    };

    const onSubmit = async (data) => {
        try {
            const response = await login(data.email, data.password);
            if (response.requires2FA) {
                setRequires2FA(true);
                setTempEmail(response.email);
            } else {
                navigate('/');
            }
        } catch {
            // Error handled by store
        }
    };

    const handle2FALogin = async (e) => {
        e.preventDefault();
        setTwoFactorLoading(true);
        setTwoFactorError('');
        try {
            const response = await api.post('/auth/2fa/validate', {
                email: tempEmail,
                token: twoFactorCode
            });

            setAuth(response.data);
            navigate('/');
        } catch (err) {
            setTwoFactorError(err.response?.data?.message || 'Invalid 2FA Code');
        } finally {
            setTwoFactorLoading(false);
        }
    };

    const handleFaceSuccess = () => {
        navigate('/');
    };

    return (
        <div
            className="min-h-screen bg-cover bg-center bg-no-repeat flex items-center justify-center p-4 sm:p-6 md:p-8"
            style={{ backgroundImage: `linear-gradient(rgba(0, 0, 0, 0.4), rgba(0, 0, 0, 0.4)), url(${loginBg})` }}
        >
            <div className="max-w-lg w-full animate-in fade-in zoom-in duration-500 perspective-1000">
                <div className="bg-white/95 backdrop-blur-xl rounded-[2.5rem] shadow-2xl p-6 sm:p-10 border border-white/20 overflow-hidden relative transition-all duration-500 hover:shadow-primary-500/10">

                    <div className="absolute top-0 left-0 w-full h-2 bg-gradient-to-r from-primary-600 to-primary-400"></div>

                    <div className="text-center mb-10 mt-4">
                        <div className="w-16 h-16 bg-primary-600 rounded-2xl flex items-center justify-center text-white text-3xl font-bold mx-auto mb-4 shadow-xl shadow-primary-200">
                            H
                        </div>
                        <h1 className="text-2xl font-black text-gray-900 tracking-tight">HRMS Portal</h1>
                        <p className="text-gray-500 mt-2 text-sm">Secure employee access and management</p>
                    </div>

                    {error && (
                        <div className="mb-6 p-4 bg-red-50 border border-red-100 text-red-600 rounded-2xl text-sm flex items-center justify-between animate-fade-in">
                            <div className="flex items-center gap-2">
                                <AlertCircle size={16} className="shrink-0" />
                                <span>{error}</span>
                            </div>
                            <button
                                type="button"
                                onClick={clearError}
                                className="hover:bg-red-100 p-1 rounded-full transition-colors font-bold"
                                aria-label="Dismiss error"
                            >
                                <X size={16} />
                            </button>
                        </div>
                    )}

                    {loginMode === 'password' && !requires2FA ? (
                        <div className="space-y-6">
                            <form onSubmit={handleSubmit(onSubmit)} className="space-y-5">
                                <div>
                                    <label htmlFor="login-email" className="block text-sm font-bold text-gray-700 mb-2 ml-1">Work Email</label>
                                    <div className="relative group">
                                        <div className="absolute inset-y-0 left-0 pl-4 flex items-center pointer-events-none text-gray-400 group-focus-within:text-primary-500 transition-colors">
                                            <Mail size={18} />
                                        </div>
                                        <input
                                            id="login-email"
                                            {...register('email')}
                                            type="email"
                                            className={`block w-full pl-11 pr-4 py-3.5 border-2 rounded-2xl leading-5 bg-gray-50/50 hover:bg-white focus:bg-white placeholder-gray-400 focus:outline-none focus:ring-4 focus:ring-primary-500/10 focus:border-primary-500 transition-all sm:text-sm ${errors.email ? 'border-red-200' : 'border-gray-100'
                                                }`}
                                            placeholder="name@company.com"
                                        />
                                    </div>
                                    {errors.email && <p className="mt-2 text-xs font-semibold text-red-500 ml-1">{errors.email.message}</p>}
                                </div>

                                <div>
                                    <div className="flex items-center justify-between mb-2 ml-1">
                                        <label htmlFor="login-password" className="block text-sm font-bold text-gray-700">Password</label>
                                        <button
                                            type="button"
                                            onClick={() => setShowForgotModal(true)}
                                            className="text-xs font-bold text-primary-600 hover:text-primary-700 hover:underline transition-all underline-offset-4"
                                        >
                                            Forgot Password?
                                        </button>
                                    </div>
                                    <div className="relative group">
                                        <div className="absolute inset-y-0 left-0 pl-4 flex items-center pointer-events-none text-gray-400 group-focus-within:text-primary-500 transition-colors">
                                            <Lock size={18} />
                                        </div>
                                        <input
                                            id="login-password"
                                            {...register('password')}
                                            type={showPassword ? 'text' : 'password'}
                                            className={`block w-full pl-11 pr-12 py-3.5 border-2 rounded-2xl leading-5 bg-gray-50/50 hover:bg-white focus:bg-white placeholder-gray-400 focus:outline-none focus:ring-4 focus:ring-primary-500/10 focus:border-primary-500 transition-all sm:text-sm ${errors.password ? 'border-red-200' : 'border-gray-100'
                                                }`}
                                            placeholder="••••••••"
                                        />
                                        <button
                                            type="button"
                                            onClick={() => setShowPassword(!showPassword)}
                                            className="absolute inset-y-0 right-0 pr-4 flex items-center text-gray-400 hover:text-gray-600 transition-colors"
                                            aria-label={showPassword ? 'Hide password' : 'Show password'}
                                        >
                                            {showPassword ? <EyeOff size={18} /> : <Eye size={18} />}
                                        </button>
                                    </div>
                                    {errors.password && <p className="mt-2 text-xs font-semibold text-red-500 ml-1">{errors.password.message}</p>}
                                </div>

                                <button
                                    type="submit"
                                    disabled={loading}
                                    className="w-full flex justify-center py-4 px-4 border border-transparent rounded-2xl shadow-xl text-sm font-black text-white bg-primary-600 hover:bg-primary-700 focus:outline-none focus:ring-4 focus:ring-primary-500/20 transition-all transform active:scale-[0.98] disabled:opacity-70"
                                >
                                    {loading ? <Loader2 className="animate-spin text-white" size={20} /> : 'Sign In'}
                                </button>
                            </form>

                            <div className="relative my-8">
                                <div className="absolute inset-0 flex items-center">
                                    <div className="w-full border-t-2 border-gray-100"></div>
                                </div>
                                <div className="relative flex justify-center text-xs uppercase">
                                    <span className="bg-white px-4 font-black text-gray-400 tracking-widest">Or Secure Login via</span>
                                </div>
                            </div>

                            <button
                                onClick={() => setLoginMode('face')}
                                className="w-full flex justify-center items-center gap-3 py-4 px-4 border-2 border-primary-100 rounded-2xl text-sm font-bold text-primary-700 bg-primary-50 hover:bg-primary-100 hover:border-primary-200 focus:outline-none transition-all"
                            >
                                <ScanFace size={22} className="text-primary-600" />
                                Face Recognition Login
                            </button>
                        </div>
                    ) : requires2FA ? (
                        <div className="space-y-6 animate-in slide-in-from-right-4 duration-300">
                            <div className="text-center space-y-2">
                                <div className="w-16 h-16 bg-primary-50 rounded-full flex items-center justify-center mx-auto mb-4">
                                    <Smartphone className="text-primary-600" size={32} />
                                </div>
                                <h2 className="text-xl font-bold text-gray-900">Two-Factor Authentication</h2>
                                <p className="text-sm text-gray-500">Enter the 6-digit code from your authenticator app.</p>
                            </div>

                            <form onSubmit={handle2FALogin} className="space-y-6">
                                {twoFactorError && (
                                    <div className="p-3 bg-red-50 border border-red-100 text-red-600 rounded-xl text-xs font-semibold flex items-center gap-2">
                                        <AlertCircle size={15} className="shrink-0" />
                                        <span>{twoFactorError}</span>
                                    </div>
                                )}
                                <div>
                                    <div className="flex justify-center gap-2">
                                        <input
                                            type="text"
                                            maxLength="6"
                                            aria-label="6-digit authentication code"
                                            className="w-full text-center text-3xl font-mono font-bold tracking-[0.5em] py-4 bg-gray-50 border-2 border-gray-200 rounded-2xl outline-none focus:ring-4 focus:ring-primary-500/10 focus:border-primary-500 transition-all"
                                            placeholder="000000"
                                            value={twoFactorCode}
                                            onChange={e => setTwoFactorCode(e.target.value.replace(/[^0-9]/g, ''))}
                                            autoFocus
                                        />
                                    </div>
                                </div>

                                <button
                                    type="submit"
                                    disabled={twoFactorLoading || twoFactorCode.length !== 6}
                                    className="w-full flex justify-center py-4 px-4 border border-transparent rounded-2xl shadow-xl text-sm font-black text-white bg-primary-600 hover:bg-primary-700 focus:outline-none focus:ring-4 focus:ring-primary-500/20 transition-all transform active:scale-[0.98] disabled:opacity-70"
                                >
                                    {twoFactorLoading ? <Loader2 className="animate-spin text-white" size={20} /> : 'Verify Code'}
                                </button>
                                <button
                                    type="button"
                                    onClick={() => setRequires2FA(false)}
                                    className="w-full py-4 text-gray-500 font-bold hover:text-gray-700 transition-all text-sm"
                                >
                                    Back to Login
                                </button>
                            </form>
                        </div>
                    ) : (
                        <div className="flex flex-col items-center animate-in slide-in-from-right-4 duration-300">
                            {/* ... Face Login ... */}
                            <FaceLogin
                                onBack={() => setLoginMode('password')}
                                onSuccess={handleFaceSuccess}
                            />
                        </div>
                    )}
                </div>

                {/* Demo Credentials */}
                <div className="mt-8 p-6 bg-gradient-to-br from-gray-50 to-gray-100 rounded-2xl border-2 border-dashed border-gray-200">
                    <div className="flex items-center justify-between gap-2 mb-4">
                        <div className="flex items-center gap-2">
                            <div className="w-2 h-2 bg-green-500 rounded-full animate-pulse"></div>
                            <h3 className="text-xs font-black text-gray-600 uppercase tracking-widest">Demo Credentials</h3>
                        </div>
                        <span className="text-[11px] font-medium text-gray-400">Click to fill</span>
                    </div>
                    <div className="space-y-2 text-xs">
                        <button
                            type="button"
                            onClick={() => fillDemoCredentials('admin@hrms.com', 'password123', 'Admin')}
                            className="w-full flex justify-between items-center p-2.5 bg-white rounded-lg hover:bg-primary-50 transition-colors group text-left"
                        >
                            <span className="font-semibold text-gray-700 group-hover:text-primary-700">Admin</span>
                            <code className="text-gray-500 font-mono text-[10px]">admin@hrms.com / password123</code>
                        </button>
                        <button
                            type="button"
                            onClick={() => fillDemoCredentials('sarah.hr@hrms.com', 'password123', 'HR Manager')}
                            className="w-full flex justify-between items-center p-2.5 bg-white rounded-lg hover:bg-primary-50 transition-colors group text-left"
                        >
                            <span className="font-semibold text-gray-700 group-hover:text-primary-700">HR Manager</span>
                            <code className="text-gray-500 font-mono text-[10px]">sarah.hr@hrms.com / password123</code>
                        </button>
                        <button
                            type="button"
                            onClick={() => fillDemoCredentials('michael.dev@hrms.com', 'password123', 'Developer')}
                            className="w-full flex justify-between items-center p-2.5 bg-white rounded-lg hover:bg-primary-50 transition-colors group text-left"
                        >
                            <span className="font-semibold text-gray-700 group-hover:text-primary-700">Developer</span>
                            <code className="text-gray-500 font-mono text-[10px]">michael.dev@hrms.com / password123</code>
                        </button>
                    </div>
                </div>

                <p className="mt-6 text-center text-sm text-gray-200 font-medium">
                    Need an account? <button type="button" onClick={() => setShowContactModal(true)} className="font-bold text-white hover:underline underline-offset-4">Contact IT Department</button>
                </p>
            </div>

            {/* Forgot Password Modal */}
            {showForgotModal && (
                <div
                    className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/50 backdrop-blur-sm animate-fade-in"
                    role="dialog"
                    aria-modal="true"
                    aria-labelledby="forgot-modal-title"
                >
                    <div className="bg-white rounded-3xl w-full max-w-md p-8 shadow-2xl animate-zoom-in">
                        <div className="flex justify-between items-center mb-6">
                            <div>
                                <h3 id="forgot-modal-title" className="text-2xl font-bold text-gray-900">Forgot Password</h3>
                                <p className="text-sm text-gray-500 mt-1">We'll send you a recovery link</p>
                            </div>
                            <button
                                type="button"
                                onClick={closeForgotModal}
                                className="p-2 hover:bg-gray-100 rounded-xl transition-colors"
                                aria-label="Close forgot password modal"
                            >
                                <X size={20} />
                            </button>
                        </div>

                        {forgotSuccess ? (
                            <div className="text-center py-8 animate-zoom-in">
                                <div className="w-16 h-16 bg-green-100 rounded-full flex items-center justify-center mx-auto mb-4">
                                    <Send className="text-green-600" size={32} />
                                </div>
                                <h4 className="text-xl font-bold text-gray-900 mb-2">Check Your Email</h4>
                                <p className="text-gray-600">We've sent a password reset link to <br /><strong>{forgotEmail}</strong></p>
                                <button
                                    type="button"
                                    onClick={closeForgotModal}
                                    className="mt-8 w-full py-4 bg-primary-600 text-white font-bold rounded-2xl hover:bg-primary-700 transition-all shadow-lg shadow-primary-100"
                                >
                                    Got it, thanks!
                                </button>
                            </div>
                        ) : (
                            <form onSubmit={handleForgotSubmit} className="space-y-6">
                                <div>
                                    <label htmlFor="forgot-email" className="block text-sm font-bold text-gray-700 mb-2 ml-1">Work Email</label>
                                    <div className="relative group">
                                        <div className="absolute inset-y-0 left-0 pl-4 flex items-center pointer-events-none text-gray-400 group-focus-within:text-primary-500 transition-colors">
                                            <Mail size={18} />
                                        </div>
                                        <input
                                            id="forgot-email"
                                            type="email"
                                            value={forgotEmail}
                                            onChange={(e) => setForgotEmail(e.target.value)}
                                            required
                                            className="block w-full pl-11 pr-4 py-3.5 border-2 border-gray-100 rounded-2xl leading-5 bg-gray-50/50 hover:bg-white focus:bg-white placeholder-gray-400 focus:outline-none focus:ring-4 focus:ring-primary-500/10 focus:border-primary-500 transition-all sm:text-sm"
                                            placeholder="name@company.com"
                                        />
                                    </div>
                                </div>

                                <button
                                    type="submit"
                                    disabled={forgotLoading}
                                    className="w-full flex justify-center py-4 px-4 border border-transparent rounded-2xl shadow-xl text-sm font-black text-white bg-primary-600 hover:bg-primary-700 focus:outline-none focus:ring-4 focus:ring-primary-500/20 transition-all transform active:scale-[0.98] disabled:opacity-70"
                                >
                                    {forgotLoading ? <Loader2 className="animate-spin text-white" size={20} /> : 'Send Reset Link'}
                                </button>
                                <button
                                    type="button"
                                    onClick={closeForgotModal}
                                    className="w-full py-4 text-gray-500 font-bold hover:text-gray-700 transition-all text-sm"
                                >
                                    Back to Login
                                </button>
                            </form>
                        )}
                    </div>
                </div>
            )}

            <SupportModal
                isOpen={showContactModal}
                onClose={() => setShowContactModal(false)}
            />
        </div>
    );
};

export default LoginPage;
