import { CheckCircle2, AlertCircle, Info, AlertTriangle, X } from 'lucide-react';
import useUIStore from '../../store/useUIStore';

const ToastContainer = () => {
    const { toasts, removeToast } = useUIStore();

    if (toasts.length === 0) return null;

    const styles = {
        success: 'bg-emerald-50 border-emerald-200 text-emerald-800',
        error: 'bg-red-50 border-red-200 text-red-800',
        warning: 'bg-amber-50 border-amber-200 text-amber-800',
        info: 'bg-blue-50 border-blue-200 text-blue-800',
    };

    const icons = {
        success: <CheckCircle2 size={18} className="text-emerald-600 shrink-0" />,
        error: <AlertCircle size={18} className="text-red-600 shrink-0" />,
        warning: <AlertTriangle size={18} className="text-amber-600 shrink-0" />,
        info: <Info size={18} className="text-blue-600 shrink-0" />,
    };

    return (
        <div
            className="fixed bottom-4 right-4 z-[100] flex flex-col gap-2 max-w-sm w-[calc(100vw-2rem)] pointer-events-none"
            aria-live="polite"
        >
            {toasts.map((t) => (
                <div
                    key={t.id}
                    role="status"
                    className={`pointer-events-auto flex items-start gap-3 p-4 rounded-2xl border shadow-lg animate-fade-in ${styles[t.type] || styles.info}`}
                >
                    <div className="mt-0.5">{icons[t.type] || icons.info}</div>
                    <p className="text-sm font-semibold flex-1 leading-snug">{t.message}</p>
                    <button
                        type="button"
                        onClick={() => removeToast(t.id)}
                        className="p-1 rounded-lg hover:bg-black/5 transition-colors shrink-0"
                        aria-label="Dismiss notification"
                    >
                        <X size={15} />
                    </button>
                </div>
            ))}
        </div>
    );
};

export default ToastContainer;
