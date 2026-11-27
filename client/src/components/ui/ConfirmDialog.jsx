import { useEffect } from 'react';
import { AlertTriangle, X } from 'lucide-react';
import useUIStore from '../../store/useUIStore';

const ConfirmDialog = () => {
    const { confirmState, closeConfirm } = useUIStore();

    useEffect(() => {
        if (!confirmState) return;
        const onKeyDown = (e) => {
            if (e.key === 'Escape') closeConfirm(false);
        };
        window.addEventListener('keydown', onKeyDown);
        return () => window.removeEventListener('keydown', onKeyDown);
    }, [confirmState, closeConfirm]);

    if (!confirmState) return null;

    const { title, message, confirmText, cancelText, variant } = confirmState;

    const confirmBtnClass =
        variant === 'danger'
            ? 'bg-red-600 hover:bg-red-700 text-white shadow-red-100'
            : 'bg-primary-600 hover:bg-primary-700 text-white shadow-primary-100';

    return (
        <div
            className="fixed inset-0 z-[90] flex items-center justify-center p-4 bg-black/50 backdrop-blur-xs animate-fade-in"
            role="dialog"
            aria-modal="true"
            aria-labelledby="confirm-dialog-title"
        >
            <div className="bg-white rounded-3xl w-full max-w-md p-6 shadow-2xl border border-gray-100 animate-zoom-in">
                <div className="flex items-start justify-between gap-4 mb-4">
                    <div className="flex items-center gap-3">
                        <div className={`w-10 h-10 rounded-xl flex items-center justify-center shrink-0 ${variant === 'danger' ? 'bg-red-50 text-red-600' : 'bg-primary-50 text-primary-600'}`}>
                            <AlertTriangle size={20} />
                        </div>
                        <h3 id="confirm-dialog-title" className="text-lg font-bold text-gray-900">
                            {title}
                        </h3>
                    </div>
                    <button
                        type="button"
                        onClick={() => closeConfirm(false)}
                        className="p-1.5 rounded-lg text-gray-400 hover:text-gray-600 hover:bg-gray-100 transition-colors"
                        aria-label="Close confirmation dialog"
                    >
                        <X size={18} />
                    </button>
                </div>

                <p className="text-sm text-gray-600 leading-relaxed mb-6">{message}</p>

                <div className="flex items-center justify-end gap-3">
                    <button
                        type="button"
                        onClick={() => closeConfirm(false)}
                        className="px-4 py-2.5 rounded-xl text-sm font-semibold text-gray-600 hover:bg-gray-100 transition-colors"
                    >
                        {cancelText}
                    </button>
                    <button
                        type="button"
                        onClick={() => closeConfirm(true)}
                        autoFocus
                        className={`px-5 py-2.5 rounded-xl text-sm font-bold shadow-lg transition-all active:scale-[0.98] ${confirmBtnClass}`}
                    >
                        {confirmText}
                    </button>
                </div>
            </div>
        </div>
    );
};

export default ConfirmDialog;
