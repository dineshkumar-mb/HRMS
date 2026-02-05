import React, { useRef } from 'react';
import html2canvas from 'html2canvas';
import { jsPDF } from 'jspdf';
import {
    X,
    Download,
    Building2,
    CreditCard,
    ReceiptIndianRupee,
    TrendingDown,
    TrendingUp,
    Shield,
    Loader2
} from 'lucide-react';

const PayrollModal = ({ isOpen, onClose, payroll }) => {
    const slipRef = useRef();
    const [downloading, setDownloading] = React.useState(false);

    if (!isOpen || !payroll) return null;

    const months = [
        "January", "February", "March", "April", "May", "June",
        "July", "August", "September", "October", "November", "December"
    ];

    const { salaryComponents, netSalary, month, year, status, employee } = payroll;

    const handleDownload = async () => {
        try {
            setDownloading(true);
            const element = slipRef.current;
            const canvas = await html2canvas(element, {
                scale: 2,
                useCORS: true,
                logging: false,
                backgroundColor: '#ffffff'
            });

            const imgData = canvas.toDataURL('image/png');
            const pdf = new jsPDF({
                orientation: 'portrait',
                unit: 'mm',
                format: 'a4'
            });

            const imgProps = pdf.getImageProperties(imgData);
            const pdfWidth = pdf.internal.pageSize.getWidth();
            const pdfHeight = (imgProps.height * pdfWidth) / imgProps.width;

            pdf.addImage(imgData, 'PNG', 0, 0, pdfWidth, pdfHeight);
            pdf.save(`Payslip_${months[month - 1]}_${year}.pdf`);
        } catch (error) {
            console.error('PDF Generation Error:', error);
            alert('Failed to generate PDF. Please try again.');
        } finally {
            setDownloading(false);
        }
    };

    return (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/50 backdrop-blur-sm">
            <div ref={slipRef} className="bg-white rounded-3xl w-full max-w-2xl overflow-hidden shadow-2xl animate-in zoom-in-95 duration-200">
                {/* Header */}
                <div className="bg-gradient-to-r from-primary-600 to-indigo-600 p-8 text-white relative">
                    <button
                        onClick={onClose}
                        className="absolute top-6 right-6 p-2 rounded-full hover:bg-white/20 transition-colors"
                        data-html2canvas-ignore
                    >
                        <X size={20} />
                    </button>
                    <div className="flex items-center gap-4 mb-2">
                        <div className="bg-white/20 p-3 rounded-2xl backdrop-blur-md">
                            <ReceiptIndianRupee size={24} />
                        </div>
                        <div>
                            <h2 className="text-2xl font-bold">Salary Slip</h2>
                            <p className="text-primary-100 text-sm">{months[month - 1]} {year}</p>
                        </div>
                    </div>
                </div>

                <div className="p-8 space-y-8 max-h-[70vh] overflow-y-auto">
                    {/* Status Badge */}
                    <div className="flex justify-between items-center">
                        <div className="flex items-center gap-2 text-gray-500">
                            <Shield size={16} />
                            <span className="text-sm font-medium uppercase tracking-wider">Payroll Status</span>
                        </div>
                        <span className={`px-4 py-1.5 rounded-full text-xs font-bold uppercase ${status === 'paid' ? 'bg-green-100 text-green-700' : 'bg-primary-100 text-primary-700'
                            }`}>
                            {status}
                        </span>
                    </div>

                    <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
                        {/* Earnings */}
                        <div className="space-y-4">
                            <div className="flex items-center gap-2 text-green-600 mb-2">
                                <TrendingUp size={18} />
                                <h3 className="font-bold uppercase text-xs tracking-widest">Earnings</h3>
                            </div>
                            <div className="space-y-3">
                                <DetailRow label="Basic Salary" value={salaryComponents.basic} />
                                <DetailRow label="HRA" value={salaryComponents.hra} />
                                <DetailRow label="Allowances" value={salaryComponents.allowances} />
                                <div className="pt-3 border-t border-gray-100">
                                    <DetailRow
                                        label="Gross Earnings"
                                        value={salaryComponents.basic + salaryComponents.hra + salaryComponents.allowances}
                                        isBold
                                    />
                                </div>
                            </div>
                        </div>

                        {/* Deductions */}
                        <div className="space-y-4">
                            <div className="flex items-center gap-2 text-red-600 mb-2">
                                <TrendingDown size={18} />
                                <h3 className="font-bold uppercase text-xs tracking-widest">Deductions</h3>
                            </div>
                            <div className="space-y-3">
                                <DetailRow label="PF (Provident Fund)" value={salaryComponents.pf} isNegative />
                                <DetailRow label="TDS (Income Tax)" value={salaryComponents.tds} isNegative />
                                <DetailRow label="Other Deductions" value={salaryComponents.deductions} isNegative />
                                <div className="pt-3 border-t border-gray-100">
                                    <DetailRow
                                        label="Total Deductions"
                                        value={salaryComponents.pf + salaryComponents.tds + salaryComponents.deductions}
                                        isBold
                                        isNegative
                                    />
                                </div>
                            </div>
                        </div>
                    </div>

                    {/* Net Salary Footer */}
                    <div className="bg-gray-50 rounded-3xl p-8 flex flex-col md:flex-row justify-between items-center gap-6 border border-gray-100">
                        <div className="flex items-center gap-4">
                            <div className="bg-primary-600 p-4 rounded-2xl text-white shadow-lg shadow-primary-200">
                                <CreditCard size={28} />
                            </div>
                            <div>
                                <p className="text-gray-500 text-sm font-medium">Net Take Home Salary</p>
                                <h4 className="text-2xl font-bold text-gray-900">₹{netSalary.toLocaleString()}</h4>
                            </div>
                        </div>
                        <button
                            onClick={handleDownload}
                            disabled={downloading}
                            className="w-full md:w-auto flex items-center justify-center gap-2 px-8 py-4 bg-white border-2 border-primary-600 text-primary-600 font-bold rounded-2xl hover:bg-primary-600 hover:text-white transition-all shadow-sm disabled:opacity-50"
                            data-html2canvas-ignore
                        >
                            {downloading ? <Loader2 size={20} className="animate-spin" /> : <Download size={20} />}
                            {downloading ? 'Generating...' : 'Download PDF'}
                        </button>
                    </div>
                </div>
            </div>
        </div>
    );
};

const DetailRow = ({ label, value, isBold = false, isNegative = false }) => (
    <div className="flex justify-between items-center py-1">
        <span className={`text-sm ${isBold ? 'font-bold text-gray-900' : 'text-gray-500'}`}>{label}</span>
        <span className={`text-sm font-mono ${isBold ? 'font-black' : 'font-medium'} ${isNegative ? 'text-red-500' : 'text-gray-900'}`}>
            {isNegative ? '-' : ''}₹{value?.toLocaleString() || '0'}
        </span>
    </div>
);

export default PayrollModal;
