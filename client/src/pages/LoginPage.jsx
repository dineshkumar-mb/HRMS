import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import {
    Lock,
    Mail,
    Eye,
    EyeOff,
    Loader2,
    ScanFace,
    AlertCircle,
    X,
    Send,
    Smartphone,
    ShieldCheck,
    KeyRound,
    Users,
    Code2
} from 'lucide-react';
import useAuthStore from '../store/useAuthStore';
import { toast } from '../store/useUIStore';
import api from '../services/api';
import FaceLogin from '../features/auth/FaceLogin';
import SupportModal from '../components/SupportModal';
import loginBg from '../assets/login-bg.png';

const loginSchema = z.object({
    email: z.string().email('Invalid email address'),
    password: z.string().min(6, 'Password must be at least 6 characters'),
});

const ROLE_THEMES = {
    admin: {
        id: 'admin',
        label: 'Admin',
        badge: 'System Administration',
        heading: 'Admin Sign In',
        subheading: 'Access organization-wide controls, payroll, and system settings.',
        heroTitle: 'Full-stack organization control and system governance.',
        heroDesc: 'Manage employee records, holiday calendars, payroll runs, and role-based access across the entire company.',
        highlights: ['System Governance', 'Payroll & Approvals', 'Audit & Reports'],
        icon: ShieldCheck,
        gradient: 'linear-gradient(160deg, rgba(15, 23, 42, 0.90) 0%, rgba(30, 58, 138, 0.82) 100%)',
        logoBg: 'bg-blue-600',
        pillBg: 'bg-blue-50 text-blue-700 border-blue-200',
        buttonBg: 'bg-blue-600 hover:bg-blue-700 focus:ring-blue-500/30',
        linkText: 'text-blue-600 hover:text-blue-700',
        focusRing: 'focus:ring-blue-500/20 focus:border-blue-600',
        iconFocus: 'group-focus-within:text-blue-600',
        tabActive: 'bg-blue-600 text-white shadow-xs',
        demoEmail: 'admin@hrms.com',
        demoPassword: 'password123',
    },
    hr: {
        id: 'hr',
        label: 'HR Manager',
        badge: 'People & Operations',
        heading: 'HR Portal Sign In',
        subheading: 'Manage attendance requests, leaves, holidays, and appraisals.',
        heroTitle: 'People operations, leave approvals, and performance reviews.',
        heroDesc: 'Review regularization requests, track 20-day Earned Leave streaks, post company notices, and support your teams.',
        highlights: ['Leave & Attendance', 'Performance Cycles', 'Team Notices'],
        icon: Users,
        gradient: 'linear-gradient(160deg, rgba(6, 78, 59, 0.92) 0%, rgba(15, 118, 110, 0.82) 100%)',
        logoBg: 'bg-emerald-600',
        pillBg: 'bg-emerald-50 text-emerald-700 border-emerald-200',
        buttonBg: 'bg-emerald-600 hover:bg-emerald-700 focus:ring-emerald-500/30',
        linkText: 'text-emerald-600 hover:text-emerald-700',
        focusRing: 'focus:ring-emerald-500/20 focus:border-emerald-600',
        iconFocus: 'group-focus-within:text-emerald-600',
        tabActive: 'bg-emerald-600 text-white shadow-xs',
        demoEmail: 'sarah.hr@hrms.com',
        demoPassword: 'password123',
    },
    developer: {
        id: 'developer',
        label: 'Developer',
        badge: 'Employee Workspace',
        heading: 'Developer Sign In',
        subheading: 'Clock in, view attendance logs, apply leaves, and download payslips.',
        heroTitle: 'Your daily workspace for punches, leaves, goals, and payslips.',
        heroDesc: 'Clock in with location or Face ID, track your 20-day Earned Leave progress, and download monthly salary slips.',
        highlights: ['Quick Clock-In', 'EL Streak Tracker', 'Instant Payslips'],
        icon: Code2,
        gradient: 'linear-gradient(160deg, rgba(49, 46, 129, 0.92) 0%, rgba(109, 40, 217, 0.82) 100%)',
        logoBg: 'bg-violet-600',
        pillBg: 'bg-violet-50 text-violet-700 border-violet-200',
        buttonBg: 'bg-violet-600 hover:bg-violet-700 focus:ring-violet-500/30',
        linkText: 'text-violet-600 hover:text-violet-700',
        focusRing: 'focus:ring-violet-500/20 focus:border-violet-600',
        iconFocus: 'group-focus-within:text-violet-600',
        tabActive: 'bg-violet-600 text-white shadow-xs',
        demoEmail: 'michael.dev@hrms.com',
        demoPassword: 'password123',
    },
};

const LoginPage = () => {
    const [selectedRole, setSelectedRole] = useState('admin');
    const [showPassword, setShowPassword] = useState(false);
    const [loginMode, setLoginMode] = useState('password'); // 'password' | 'face'
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

    const theme = ROLE_THEMES[selectedRole];
    const RoleIcon = theme.icon;

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
        } catch (err) {
            console.error('Error submitting forgot password form:', err);
            toast.error(err.response?.data?.message || 'Failed to send reset link. Please try again.');
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

    const fillDemoCredentials = (roleKey) => {
        const roleCfg = ROLE_THEMES[roleKey];
        setSelectedRole(roleKey);
        setValue('email', roleCfg.demoEmail, { shouldValidate: true });
        setValue('password', roleCfg.demoPassword, { shouldValidate: true });
        clearError();
        toast.info(`Filled ${roleCfg.label} demo credentials`);
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
        <div className="min-h-screen bg-slate-50 grid grid-cols-1 lg:grid-cols-12">
            {/* Left Dynamic Role Brand Panel (Desktop) */}
            <div
                className="hidden lg:flex lg:col-span-5 xl:col-span-6 relative bg-slate-900 bg-cover bg-center flex-col justify-between p-10 xl:p-14 text-white overflow-hidden transition-all duration-500"
                style={{
                    backgroundImage: `${theme.gradient}, url(${loginBg})`
                }}
            >
                <div className="flex items-center justify-between gap-4">
                    <div className="flex items-center gap-3">
                        <div className={`w-10 h-10 ${theme.logoBg} rounded-xl flex items-center justify-center text-white font-black text-xl shadow-lg transition-colors duration-300`}>
                            H
                        </div>
                        <span className="text-lg font-extrabold tracking-tight">HRMS Portal</span>
                    </div>
                    <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-white/15 backdrop-blur-xs text-xs font-bold text-white border border-white/20">
                        <RoleIcon size={14} />
                        {theme.badge}
                    </span>
                </div>

                <div className="max-w-md space-y-5 animate-fade-in" key={selectedRole}>
                    <div className="w-12 h-12 rounded-2xl bg-white/15 border border-white/20 flex items-center justify-center">
                        <RoleIcon size={24} className="text-white" />
                    </div>
                    <h2 className="text-3xl xl:text-4xl font-extrabold tracking-tight leading-tight">
                        {theme.heroTitle}
                    </h2>
                    <p className="text-slate-200 text-sm xl:text-base leading-relaxed">
                        {theme.heroDesc}
                    </p>
                    <div className="flex flex-wrap gap-2 pt-2">
                        {theme.highlights.map((item) => (
                            <span
                                key={item}
                                className="px-3 py-1 rounded-lg bg-white/10 border border-white/15 text-xs font-semibold text-white/90"
                            >
                                {item}
                            </span>
                        ))}
                    </div>
                </div>

                <div className="flex items-center gap-6 text-xs text-slate-200/80">
                    <span className="flex items-center gap-2">
                        <ShieldCheck size={16} />
                        2FA &amp; Biometric Ready
                    </span>
                    <span>•</span>
                    <span>Role-Tailored Workspace</span>
                </div>
            </div>

            {/* Right Auth Panel */}
            <div className="lg:col-span-7 xl:col-span-6 flex flex-col justify-center items-center p-4 sm:p-8 lg:p-12">
                <div className="w-full max-w-md space-y-5">
                    {/* Mobile Brand Header */}
                    <div className="flex items-center justify-center gap-3 lg:hidden">
                        <div className={`w-10 h-10 ${theme.logoBg} rounded-xl flex items-center justify-center text-white font-black text-xl shadow-md transition-colors duration-300`}>
                            H
                        </div>
                        <span className="text-xl font-extrabold text-slate-900 tracking-tight">HRMS Portal</span>
                    </div>

                    <div className="bg-white rounded-2xl border border-slate-200/80 shadow-sm p-6 sm:p-8 space-y-5">
                        {/* Role Switcher */}
                        {!requires2FA && (
                            <div className="space-y-1.5">
                                <span className="block text-[11px] font-bold text-slate-400 uppercase tracking-wider">Select Portal Role</span>
                                <div className="grid grid-cols-3 gap-1.5 p-1 bg-slate-100 rounded-xl">
                                    {Object.values(ROLE_THEMES).map((r) => {
                                        const Icon = r.icon;
                                        const isActive = selectedRole === r.id;
                                        return (
                                            <button
                                                key={r.id}
                                                type="button"
                                                onClick={() => setSelectedRole(r.id)}
                                                className={`flex items-center justify-center gap-1.5 py-2 px-2 rounded-lg text-xs font-bold transition-all ${isActive
                                                    ? r.tabActive
                                                    : 'text-slate-600 hover:text-slate-900 hover:bg-white/60'
                                                    }`}
                                            >
                                                <Icon size={14} />
                                                <span className="truncate">{r.label}</span>
                                            </button>
                                        );
                                    })}
                                </div>
                            </div>
                        )}

                        {/* Header */}
                        <div className="space-y-1">
                            <div className="flex items-center justify-between gap-2">
                                <h1 className="text-2xl font-extrabold text-slate-900 tracking-tight">
                                    {requires2FA
                                        ? 'Two-Factor Verification'
                                        : loginMode === 'face'
                                            ? 'Face Recognition'
                                            : theme.heading}
                                </h1>
                                {!requires2FA && (
                                    <span className={`px-2.5 py-0.5 rounded-full text-[11px] font-bold border lg:hidden ${theme.pillBg}`}>
                                        {theme.label}
                                    </span>
                                )}
                            </div>
                            <p className="text-sm text-slate-500">
                                {requires2FA
                                    ? 'Enter the 6-digit code from your authenticator app.'
                                    : loginMode === 'face'
                                        ? 'Look into your camera to verify your identity.'
                                        : theme.subheading}
                            </p>
                        </div>

                        {/* Mode Switcher */}
                        {!requires2FA && (
                            <div className="grid grid-cols-2 gap-1.5 p-1 bg-slate-100 rounded-xl">
                                <button
                                    type="button"
                                    onClick={() => setLoginMode('password')}
                                    className={`flex items-center justify-center gap-2 py-2 rounded-lg text-xs font-bold transition-all ${loginMode === 'password'
                                        ? 'bg-white text-slate-900 shadow-xs'
                                        : 'text-slate-500 hover:text-slate-800'
                                        }`}
                                >
                                    <KeyRound size={15} />
                                    Password
                                </button>
                                <button
                                    type="button"
                                    onClick={() => setLoginMode('face')}
                                    className={`flex items-center justify-center gap-2 py-2 rounded-lg text-xs font-bold transition-all ${loginMode === 'face'
                                        ? 'bg-white text-slate-900 shadow-xs'
                                        : 'text-slate-500 hover:text-slate-800'
                                        }`}
                                >
                                    <ScanFace size={15} />
                                    Face ID
                                </button>
                            </div>
                        )}

                        {error && (
                            <div className="p-3.5 bg-red-50 border border-red-200 text-red-700 rounded-xl text-xs font-semibold flex items-center justify-between gap-2 animate-fade-in">
                                <div className="flex items-center gap-2">
                                    <AlertCircle size={16} className="shrink-0" />
                                    <span>{error}</span>
                                </div>
                                <button
                                    type="button"
                                    onClick={clearError}
                                    className="hover:bg-red-100 p-1 rounded-lg transition-colors"
                                    aria-label="Dismiss error"
                                >
                                    <X size={15} />
                                </button>
                            </div>
                        )}

                        {loginMode === 'password' && !requires2FA ? (
                            <form onSubmit={handleSubmit(onSubmit)} className="space-y-4">
                                <div>
                                    <label htmlFor="login-email" className="block text-xs font-bold text-slate-700 mb-1.5">
                                        Work Email
                                    </label>
                                    <div className="relative group">
                                        <div className={`absolute inset-y-0 left-0 pl-3.5 flex items-center pointer-events-none text-slate-400 transition-colors ${theme.iconFocus}`}>
                                            <Mail size={17} />
                                        </div>
                                        <input
                                            id="login-email"
                                            {...register('email')}
                                            type="email"
                                            autoComplete="email"
                                            className={`block w-full pl-10 pr-4 py-2.5 border rounded-xl bg-slate-50/70 hover:bg-white focus:bg-white text-slate-900 placeholder-slate-400 focus:outline-none focus:ring-2 transition-all text-sm ${theme.focusRing} ${errors.email ? 'border-red-300' : 'border-slate-200'
                                                }`}
                                            placeholder={theme.demoEmail}
                                        />
                                    </div>
                                    {errors.email && <p className="mt-1.5 text-xs font-medium text-red-600">{errors.email.message}</p>}
                                </div>

                                <div>
                                    <div className="flex items-center justify-between mb-1.5">
                                        <label htmlFor="login-password" className="block text-xs font-bold text-slate-700">
                                            Password
                                        </label>
                                        <button
                                            type="button"
                                            onClick={() => setShowForgotModal(true)}
                                            className={`text-xs font-semibold hover:underline underline-offset-4 ${theme.linkText}`}
                                        >
                                            Forgot password?
                                        </button>
                                    </div>
                                    <div className="relative group">
                                        <div className={`absolute inset-y-0 left-0 pl-3.5 flex items-center pointer-events-none text-slate-400 transition-colors ${theme.iconFocus}`}>
                                            <Lock size={17} />
                                        </div>
                                        <input
                                            id="login-password"
                                            {...register('password')}
                                            type={showPassword ? 'text' : 'password'}
                                            autoComplete="current-password"
                                            className={`block w-full pl-10 pr-11 py-2.5 border rounded-xl bg-slate-50/70 hover:bg-white focus:bg-white text-slate-900 placeholder-slate-400 focus:outline-none focus:ring-2 transition-all text-sm ${theme.focusRing} ${errors.password ? 'border-red-300' : 'border-slate-200'
                                                }`}
                                            placeholder="••••••••"
                                        />
                                        <button
                                            type="button"
                                            onClick={() => setShowPassword(!showPassword)}
                                            className="absolute inset-y-0 right-0 pr-3.5 flex items-center text-slate-400 hover:text-slate-600 transition-colors"
                                            aria-label={showPassword ? 'Hide password' : 'Show password'}
                                        >
                                            {showPassword ? <EyeOff size={17} /> : <Eye size={17} />}
                                        </button>
                                    </div>
                                    {errors.password && <p className="mt-1.5 text-xs font-medium text-red-600">{errors.password.message}</p>}
                                </div>

                                <button
                                    type="submit"
                                    disabled={loading}
                                    className={`w-full flex justify-center items-center py-3 px-4 rounded-xl shadow-sm text-sm font-bold text-white focus:outline-none focus:ring-2 transition-all active:scale-[0.99] disabled:opacity-70 mt-2 ${theme.buttonBg}`}
                                >
                                    {loading ? <Loader2 className="animate-spin text-white" size={19} /> : `Sign In as ${theme.label}`}
                                </button>
                            </form>
                        ) : requires2FA ? (
                            <form onSubmit={handle2FALogin} className="space-y-5">
                                <div className={`w-12 h-12 rounded-xl flex items-center justify-center mx-auto border ${theme.pillBg}`}>
                                    <Smartphone size={24} />
                                </div>

                                {twoFactorError && (
                                    <div className="p-3 bg-red-50 border border-red-200 text-red-700 rounded-xl text-xs font-semibold flex items-center gap-2">
                                        <AlertCircle size={15} className="shrink-0" />
                                        <span>{twoFactorError}</span>
                                    </div>
                                )}

                                <input
                                    type="text"
                                    maxLength="6"
                                    aria-label="6-digit authentication code"
                                    className={`w-full text-center text-2xl font-mono font-bold tracking-[0.45em] py-3 bg-slate-50 border border-slate-200 rounded-xl outline-none focus:ring-2 transition-all ${theme.focusRing}`}
                                    placeholder="000000"
                                    value={twoFactorCode}
                                    onChange={e => setTwoFactorCode(e.target.value.replace(/[^0-9]/g, ''))}
                                    autoFocus
                                />

                                <div className="space-y-2">
                                    <button
                                        type="submit"
                                        disabled={twoFactorLoading || twoFactorCode.length !== 6}
                                        className={`w-full flex justify-center py-3 px-4 rounded-xl shadow-sm text-sm font-bold text-white transition-all disabled:opacity-60 ${theme.buttonBg}`}
                                    >
                                        {twoFactorLoading ? <Loader2 className="animate-spin text-white" size={19} /> : 'Verify Code'}
                                    </button>
                                    <button
                                        type="button"
                                        onClick={() => {
                                            setRequires2FA(false);
                                            setTwoFactorCode('');
                                            setTwoFactorError('');
                                        }}
                                        className="w-full py-2.5 text-slate-600 font-semibold hover:text-slate-900 transition-colors text-xs"
                                    >
                                        Back to Sign In
                                    </button>
                                </div>
                            </form>
                        ) : (
                            <div className="flex flex-col items-center">
                                <FaceLogin
                                    onBack={() => setLoginMode('password')}
                                    onSuccess={handleFaceSuccess}
                                />
                            </div>
                        )}

                        {/* Compact Demo Quick-Fill */}
                        {loginMode === 'password' && !requires2FA && (
                            <div className="pt-4 border-t border-slate-100">
                                <div className="flex items-center justify-between mb-2.5">
                                    <span className="text-xs font-semibold text-slate-500">Quick demo fill</span>
                                    <span className="text-[11px] text-slate-400">Switches role &amp; fills credentials</span>
                                </div>
                                <div className="grid grid-cols-3 gap-2">
                                    {Object.values(ROLE_THEMES).map((r) => (
                                        <button
                                            key={r.id}
                                            type="button"
                                            onClick={() => fillDemoCredentials(r.id)}
                                            className={`px-2.5 py-2 rounded-xl border text-xs font-semibold transition-all text-center truncate ${selectedRole === r.id
                                                ? r.pillBg
                                                : 'border-slate-200 bg-slate-50/70 text-slate-700 hover:bg-slate-100'
                                                }`}
                                            title={`${r.demoEmail} / ${r.demoPassword}`}
                                        >
                                            {r.label}
                                        </button>
                                    ))}
                                </div>
                            </div>
                        )}
                    </div>

                    <p className="text-center text-xs text-slate-500">
                        Need an account or having trouble signing in?{' '}
                        <button
                            type="button"
                            onClick={() => setShowContactModal(true)}
                            className={`font-semibold hover:underline underline-offset-4 ${theme.linkText}`}
                        >
                            Contact IT Support
                        </button>
                    </p>
                </div>
            </div>

            {/* Forgot Password Modal */}
            {showForgotModal && (
                <div
                    className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/50 backdrop-blur-xs animate-fade-in"
                    role="dialog"
                    aria-modal="true"
                    aria-labelledby="forgot-modal-title"
                >
                    <div className="bg-white rounded-3xl w-full max-w-md p-6 sm:p-8 shadow-2xl animate-zoom-in">
                        <div className="flex justify-between items-start mb-6">
                            <div>
                                <h3 id="forgot-modal-title" className="text-xl font-bold text-slate-900">Forgot Password</h3>
                                <p className="text-xs text-slate-500 mt-1">We&apos;ll send you a recovery link</p>
                            </div>
                            <button
                                type="button"
                                onClick={closeForgotModal}
                                className="p-1.5 hover:bg-slate-100 rounded-xl text-slate-400 hover:text-slate-600 transition-colors"
                                aria-label="Close forgot password modal"
                            >
                                <X size={18} />
                            </button>
                        </div>

                        {forgotSuccess ? (
                            <div className="text-center py-6 animate-zoom-in">
                                <div className="w-14 h-14 bg-emerald-100 rounded-full flex items-center justify-center mx-auto mb-4">
                                    <Send className="text-emerald-600" size={26} />
                                </div>
                                <h4 className="text-lg font-bold text-slate-900 mb-1.5">Check Your Email</h4>
                                <p className="text-sm text-slate-600">
                                    We&apos;ve sent a password reset link to <br />
                                    <strong className="text-slate-900">{forgotEmail}</strong>
                                </p>
                                <button
                                    type="button"
                                    onClick={closeForgotModal}
                                    className="mt-6 w-full py-3 bg-primary-600 text-white font-bold rounded-xl hover:bg-primary-700 transition-all text-sm"
                                >
                                    Done
                                </button>
                            </div>
                        ) : (
                            <form onSubmit={handleForgotSubmit} className="space-y-4">
                                <div>
                                    <label htmlFor="forgot-email" className="block text-xs font-bold text-slate-700 mb-1.5">
                                        Work Email
                                    </label>
                                    <div className="relative">
                                        <div className="absolute inset-y-0 left-0 pl-3.5 flex items-center pointer-events-none text-slate-400">
                                            <Mail size={17} />
                                        </div>
                                        <input
                                            id="forgot-email"
                                            type="email"
                                            value={forgotEmail}
                                            onChange={(e) => setForgotEmail(e.target.value)}
                                            required
                                            className="block w-full pl-10 pr-4 py-2.5 border border-slate-200 rounded-xl bg-slate-50/70 focus:bg-white placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-primary-500/20 focus:border-primary-600 transition-all text-sm"
                                            placeholder="name@company.com"
                                        />
                                    </div>
                                </div>

                                <button
                                    type="submit"
                                    disabled={forgotLoading}
                                    className="w-full flex justify-center py-3 px-4 rounded-xl text-sm font-bold text-white bg-primary-600 hover:bg-primary-700 transition-all disabled:opacity-70"
                                >
                                    {forgotLoading ? <Loader2 className="animate-spin text-white" size={19} /> : 'Send Reset Link'}
                                </button>
                                <button
                                    type="button"
                                    onClick={closeForgotModal}
                                    className="w-full py-2.5 text-slate-500 font-semibold hover:text-slate-700 transition-colors text-xs"
                                >
                                    Back to Sign In
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
