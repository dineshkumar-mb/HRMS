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
import useAuthStore from '../store/useAuthStore';

const PayrollModal = ({ isOpen, onClose, payroll }) => {
    const slipRef = useRef();
    const [downloading, setDownloading] = React.useState(false);
    const { user } = useAuthStore();

    if (!isOpen || !payroll) return null;

    const months = [
        "January", "February", "March", "April", "May", "June",
        "July", "August", "September", "October", "November", "December"
    ];

    const { salaryComponents, netSalary, month, year, status } = payroll;

    // Fallback logic for employee details
    let empDetails = payroll.employee;

    // If employee is just an ID string or missing name, use logged-in user (if allowed)
    // Note: This fallback is mainly for the "Personal" view where user == employee
    if (!empDetails || typeof empDetails === 'string' || !empDetails.firstName) {
        if (user && (user.employee === empDetails || user._id === empDetails || !empDetails)) {
            empDetails = {
                firstName: user.firstName,
                lastName: user.lastName,
                designation: user.designation,
                department: user.department,
                dateOfJoining: user.dateOfJoining,
                ...((typeof empDetails === 'object') ? empDetails : {})
            };
        }
    }

    const handleDownload = async () => {
        setDownloading(true);
        // Clean layout container
        const container = document.createElement('div');

        try {
            // Strategy: Generate a clean, printer-friendly payslip from scratch
            // This avoids all Tailwind v4 oklab/oklch issues and guarantees a professional output.
            // We use inline styles and standard fonts to ensure perfect rendering without external CSS.

            // 1. Build the Template Logic
            const styles = {
                container: "font-family: Arial, sans-serif; padding: 40px; background: white; width: 800px; color: #333;",
                header: "text-align: center; margin-bottom: 20px;",
                title: "font-size: 24px; font-weight: bold; margin: 0; color: #000;",
                subtitle: "font-size: 16px; margin: 5px 0;",
                row: "display: flex; justify-content: space-between; margin-bottom: 10px;",
                section: "margin-top: 20px; border: 1px solid #000;", // Black border for the table look
                tableHeader: "background: #f0f0f0; border-bottom: 1px solid #000; padding: 8px; font-weight: bold; display: flex;",
                tableRow: "border-bottom: 1px solid #ddd; padding: 8px; display: flex;",
                col: "flex: 1;",
                colRight: "flex: 1; text-align: right;",
                totalRow: "padding: 10px; font-weight: bold; border-top: 2px solid #000; margin-top: 10px; display: flex; justify-content: space-between;",
                footer: "margin-top: 40px; text-align: center; font-size: 12px; color: #666;"
            };

            const htmlContent = `
                <div style="${styles.container}">
                    <div style="${styles.header}">
                        <h1 style="${styles.title}">Payslip</h1>
                        <p style="${styles.subtitle}">Zoonodle Inc</p>
                        <p style="${styles.subtitle}">21023 Pearson Point Road, Gateway Avenue</p>
                    </div>

                    <div style="margin: 20px 0; display: grid; grid-template-columns: 1fr 1fr; gap: 20px;">
                        <div>
                            <p><strong>Employee Name:</strong> ${empDetails?.firstName || ''} ${empDetails?.lastName || ''}</p>
                            <p><strong>Designation:</strong> ${empDetails?.designation || 'N/A'}</p>
                            <p><strong>Department:</strong> ${empDetails?.department || 'N/A'}</p>
                        </div>
                        <div style="text-align: right;">
                            <p><strong>Pay Period:</strong> ${months[month - 1]} ${year}</p>
                            <p><strong>Worked Days:</strong> ${payroll?.workedDays || 'Standard Month'}</p>
                            <p><strong>Date of Joining:</strong> ${empDetails?.dateOfJoining ? new Date(empDetails.dateOfJoining).toLocaleDateString() : 'N/A'}</p>
                        </div>
                    </div>

                    <div style="${styles.section}">
                        <div style="${styles.tableHeader}">
                            <div style="${styles.col}">Earnings</div>
                            <div style="${styles.colRight}">Amount</div>
                            <div style="${styles.col}">Deductions</div>
                            <div style="${styles.colRight}">Amount</div>
                        </div>
                        
                        <div style="display: flex;">
                             <div style="flex: 1; border-right: 1px solid #000;">
                                 <!-- Earnings List -->
                                 <div style="${styles.tableRow}"><div style="${styles.col}">Basic Salary</div><div style="${styles.colRight}">₹${salaryComponents.basic.toLocaleString()}</div></div>
                                 <div style="${styles.tableRow}"><div style="${styles.col}">HRA</div><div style="${styles.colRight}">₹${salaryComponents.hra.toLocaleString()}</div></div>
                                 <div style="${styles.tableRow}"><div style="${styles.col}">Allowances</div><div style="${styles.colRight}">₹${salaryComponents.allowances.toLocaleString()}</div></div>
                                 <div style="${styles.tableRow}"><div style="${styles.col}"><strong>Gross Earnings</strong></div><div style="${styles.colRight}"><strong>₹${(salaryComponents.basic + salaryComponents.hra + salaryComponents.allowances).toLocaleString()}</strong></div></div>
                             </div>
                             <div style="flex: 1;">
                                 <!-- Deductions List -->
                                 <div style="${styles.tableRow}"><div style="${styles.col}">Provident Fund</div><div style="${styles.colRight}">₹${salaryComponents.pf.toLocaleString()}</div></div>
                                 <div style="${styles.tableRow}"><div style="${styles.col}">Income Tax</div><div style="${styles.colRight}">₹${salaryComponents.tds.toLocaleString()}</div></div>
                                 <div style="${styles.tableRow}"><div style="${styles.col}">Other Deductions</div><div style="${styles.colRight}">₹${salaryComponents.deductions.toLocaleString()}</div></div>
                                 <div style="${styles.tableRow}"><div style="${styles.col}"><strong>Total Deductions</strong></div><div style="${styles.colRight}"><strong>₹${(salaryComponents.pf + salaryComponents.tds + salaryComponents.deductions).toLocaleString()}</strong></div></div>
                             </div>
                        </div>
                    </div>

                    <div style="${styles.totalRow}">
                        <span>Net Pay</span>
                        <span>₹${netSalary.toLocaleString()}</span>
                    </div>
                    <div style="text-align: center; margin-top: 10px; font-weight: bold;">
                        ${toWords(netSalary)} Only
                    </div>

                    <div style="display: flex; justify-content: space-between; margin-top: 80px;">
                        <div style="text-align: center; width: 200px; border-top: 1px solid #000; padding-top: 10px;">Employer Signature</div>
                        <div style="text-align: center; width: 200px; border-top: 1px solid #000; padding-top: 10px;">Employee Signature</div>
                    </div>
                    
                    <div style="${styles.footer}">
                        This is a system generated payslip.
                    </div>
                </div>
            `;

            container.innerHTML = htmlContent;

            // Position off-screen
            container.style.position = 'fixed';
            container.style.top = '-9999px';
            container.style.left = '-9999px';
            document.body.appendChild(container);

            // 2. Generate PDF
            // CRITICAl: ignoreElements function is key here to avoid parsing app stylesheets
            const canvas = await html2canvas(container, {
                scale: 2,
                logging: false,
                useCORS: true,
                backgroundColor: '#ffffff',
                ignoreElements: (element) => {
                    // Ignore ALL styles and links. We rely 100% on inline styles.
                    const tag = element.tagName.toLowerCase();
                    return tag === 'style' || tag === 'link';
                }
            });

            const imgData = canvas.toDataURL('image/jpeg', 1.0);
            const pdf = new jsPDF({
                orientation: 'portrait',
                unit: 'mm',
                format: 'a4',
                compress: true
            });

            const pdfWidth = pdf.internal.pageSize.getWidth();
            const pdfHeight = (canvas.height * pdfWidth) / canvas.width;

            pdf.addImage(imgData, 'JPEG', 0, 0, pdfWidth, pdfHeight, undefined, 'FAST');
            pdf.save(`Payslip_${months[month - 1]}_${year}.pdf`);

        } catch (error) {
            console.error('Detailed PDF Generation Error:', error);
            alert(`Failed to generate PDF: ${error.message || 'Unknown error'}. Please try again.`);
        } finally {
            if (document.body.contains(container)) {
                document.body.removeChild(container);
            }
            setDownloading(false);
        }
    };

    // Helper for number to words (simple implementation)
    const toWords = (num) => {
        // Very basic placeholder. In production, use a library like number-to-words
        return `Rupees ${num}`;
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
                            <h2 className="text-2xl font-bold">Salary Slip for {empDetails?.firstName || ''} {empDetails?.lastName || ''}</h2>
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
