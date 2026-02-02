import { useState } from 'react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { X, Send, Loader2, CheckCircle2, AlertCircle, LifeBuoy } from 'lucide-react';
import api from '../services/api';
import useAuthStore from '../store/useAuthStore';

const supportSchema = z.object({
    name: z.string().min(2, 'Name is required'),
    email: z.string().email('Invalid email address'),
    subject: z.string().min(5, 'Subject must be at least 5 characters'),
    message: z.string().min(10, 'Message must be at least 10 characters'),
});

const SupportModal = ({ isOpen, onClose }) => {
    const { user } = useAuthStore();
    const [loading, setLoading] = useState(false);
    const [success, setSuccess] = useState(false);
    const [serverError, setServerError] = useState('');

    const {
        register,
        handleSubmit,
        reset,
        formState: { errors },
    } = useForm({
        resolver: zodResolver(supportSchema),
        defaultValues: {
            name: user?.firstName ? `${user.firstName} ${user.lastName}` : (user?.email?.split('@')[0] || ''),
            email: user?.email || '',
            subject: '',
            message: '',
        }
    });

    const onSubmit = async (data) => {
        setLoading(true);
        setServerError('');
        try {
            await api.post('/support/contact', data);
            setSuccess(true);
            reset();
        } catch (error) {
            setServerError(error.response?.data?.message || 'Failed to submit support request. Please try again later.');
        } finally {
            setLoading(false);
        }
    };

    if (!isOpen) return null;

    return (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/50 backdrop-blur-sm animate-in fade-in duration-300">
            <div className="bg-white rounded-3xl shadow-2xl w-full max-w-lg overflow-hidden animate-in zoom-in duration-300">
                <div className="h-2 bg-gradient-to-r from-primary-600 to-primary-400"></div>

                <div className="p-6 flex justify-between items-center border-b border-gray-50 bg-gray-50/30">
                    <div className="flex items-center gap-3">
                        <div className="w-10 h-10 bg-primary-50 rounded-xl flex items-center justify-center text-primary-600">
                            <LifeBuoy size={24} />
                        </div>
                        <div>
                            <h2 className="text-xl font-bold text-gray-900">Contact IT Support</h2>
                            <p className="text-xs text-gray-500">How can we help you today?</p>
                        </div>
                    </div>
                    <button
                        onClick={onClose}
                        className="p-2 hover:bg-gray-100 rounded-full transition-colors text-gray-400 hover:text-gray-600"
                    >
                        <X size={20} />
                    </button>
                </div>

                <div className="p-8">
                    {success ? (
                        <div className="text-center py-10">
                            <div className="w-20 h-20 bg-green-50 rounded-full flex items-center justify-center mx-auto mb-6">
                                <CheckCircle2 className="text-green-600" size={40} />
                            </div>
                            <h3 className="text-2xl font-bold text-gray-900 mb-2">Request Submitted!</h3>
                            <p className="text-gray-600 px-6">
                                Thank you for reaching out. Our IT team has received your request and will get back to you within 24 hours.
                            </p>
                            <button
                                onClick={onClose}
                                className="mt-8 px-8 py-3 bg-primary-600 text-white font-bold rounded-2xl hover:bg-primary-700 transition-all shadow-lg shadow-primary-100"
                            >
                                Close Modal
                            </button>
                        </div>
                    ) : (
                        <form onSubmit={handleSubmit(onSubmit)} className="space-y-5">
                            {serverError && (
                                <div className="p-4 bg-red-50 border border-red-100 text-red-600 rounded-2xl flex items-center gap-3">
                                    <AlertCircle size={20} className="shrink-0" />
                                    <p className="text-sm font-semibold">{serverError}</p>
                                </div>
                            )}

                            <div className="grid grid-cols-2 gap-4">
                                <div>
                                    <label className="block text-xs font-bold text-gray-700 mb-1.5 ml-1 uppercase tracking-wider">Your Name</label>
                                    <input
                                        {...register('name')}
                                        className={`block w-full px-4 py-3 border-2 rounded-2xl leading-5 bg-gray-50/50 hover:bg-white focus:bg-white placeholder-gray-400 focus:outline-none focus:ring-4 focus:ring-primary-500/10 focus:border-primary-500 transition-all sm:text-sm ${errors.name ? 'border-red-200' : 'border-gray-100'}`}
                                        placeholder="John Doe"
                                    />
                                    {errors.name && <p className="mt-1 text-[10px] font-bold text-red-500 ml-1">{errors.name.message}</p>}
                                </div>
                                <div>
                                    <label className="block text-xs font-bold text-gray-700 mb-1.5 ml-1 uppercase tracking-wider">Email Address</label>
                                    <input
                                        {...register('email')}
                                        className={`block w-full px-4 py-3 border-2 rounded-2xl leading-5 bg-gray-50/50 hover:bg-white focus:bg-white placeholder-gray-400 focus:outline-none focus:ring-4 focus:ring-primary-500/10 focus:border-primary-500 transition-all sm:text-sm ${errors.email ? 'border-red-200' : 'border-gray-100'}`}
                                        placeholder="john@example.com"
                                    />
                                    {errors.email && <p className="mt-1 text-[10px] font-bold text-red-500 ml-1">{errors.email.message}</p>}
                                </div>
                            </div>

                            <div>
                                <label className="block text-xs font-bold text-gray-700 mb-1.5 ml-1 uppercase tracking-wider">Subject</label>
                                <input
                                    {...register('subject')}
                                    className={`block w-full px-4 py-3 border-2 rounded-2xl leading-5 bg-gray-50/50 hover:bg-white focus:bg-white placeholder-gray-400 focus:outline-none focus:ring-4 focus:ring-primary-500/10 focus:border-primary-500 transition-all sm:text-sm ${errors.subject ? 'border-red-200' : 'border-gray-100'}`}
                                    placeholder="Brief summary of the issue"
                                />
                                {errors.subject && <p className="mt-1 text-[10px] font-bold text-red-500 ml-1">{errors.subject.message}</p>}
                            </div>

                            <div>
                                <label className="block text-xs font-bold text-gray-700 mb-1.5 ml-1 uppercase tracking-wider">Message</label>
                                <textarea
                                    {...register('message')}
                                    rows={4}
                                    className={`block w-full px-4 py-3 border-2 rounded-2xl leading-5 bg-gray-50/50 hover:bg-white focus:bg-white placeholder-gray-400 focus:outline-none focus:ring-4 focus:ring-primary-500/10 focus:border-primary-500 transition-all sm:text-sm resize-none ${errors.message ? 'border-red-200' : 'border-gray-100'}`}
                                    placeholder="Describe your problem in detail..."
                                ></textarea>
                                {errors.message && <p className="mt-1 text-[10px] font-bold text-red-500 ml-1">{errors.message.message}</p>}
                            </div>

                            <div className="pt-2">
                                <button
                                    type="submit"
                                    disabled={loading}
                                    className="w-full py-4 bg-primary-600 text-white font-black rounded-2xl hover:bg-primary-700 transition-all shadow-xl shadow-primary-200 flex items-center justify-center gap-3 active:scale-95 disabled:opacity-70"
                                >
                                    {loading ? <Loader2 className="animate-spin" size={20} /> : <Send size={20} />}
                                    Send Support Request
                                </button>
                            </div>
                        </form>
                    )}
                </div>
            </div>
        </div>
    );
};

export default SupportModal;
