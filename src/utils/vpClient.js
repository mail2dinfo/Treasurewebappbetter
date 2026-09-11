import { API_BASE_URL } from './apiConfig';

export async function vpRequest(token, path, { method = 'GET', body, params, formData } = {}) {
    const query = params
        ? `?${new URLSearchParams(Object.entries(params).filter(([, v]) => v != null && v !== '')).toString()}`
        : '';
    const res = await fetch(`${API_BASE_URL}${path}${query}`, {
        method,
        headers: {
            Authorization: `Bearer ${token}`,
            ...(formData || !body ? {} : { 'Content-Type': 'application/json' }),
        },
        body: formData || (body ? JSON.stringify(body) : undefined),
    });
    const data = await res.json().catch(() => ({}));
    if (!res.ok || data.error) {
        throw new Error(data.message || 'Request failed');
    }
    return data.results;
}

export const formatWhen = (value) => {
    if (!value) return '—';
    const d = new Date(value);
    if (Number.isNaN(d.getTime())) return String(value);
    return d.toLocaleString('en-IN', {
        day: '2-digit',
        month: 'short',
        year: 'numeric',
        hour: '2-digit',
        minute: '2-digit',
    });
};

export const money = (value) => `₹${Number(value || 0).toLocaleString('en-IN', { maximumFractionDigits: 2 })}`;

export const vpPaymentAccounts = (bootOrAccounts) => {
    const list = Array.isArray(bootOrAccounts)
        ? bootOrAccounts
        : ((bootOrAccounts?.payment_accounts || []).length
            ? bootOrAccounts.payment_accounts
            : (bootOrAccounts?.ledger_accounts || []));
    return (list || []).filter((row) => {
        if (!row || String(row.status || 'ACTIVE').toUpperCase() === 'INACTIVE') return false;
        const type = String(row.account_type || 'ASSET').toUpperCase();
        if (type && type !== 'ASSET') return false;
        return String(row.account_name || '').trim().toUpperCase() !== 'PARKING INCOME';
    });
};

export const isUpiStyleAccount = (account) => {
    const name = String(account?.account_name || '').toUpperCase();
    return /PAYTM|GPAY|G PAY|GOOGLE PAY|PHONEPE|PHONE PE|UPI|BHIM/.test(name);
};

export function compressImageFile(file, { maxWidth = 1280, quality = 0.72 } = {}) {
    return new Promise((resolve, reject) => {
        if (!file) {
            resolve('');
            return;
        }
        const reader = new FileReader();
        reader.onload = () => {
            const img = new Image();
            img.onload = () => {
                const scale = Math.min(1, maxWidth / Math.max(img.width, 1));
                const canvas = document.createElement('canvas');
                canvas.width = Math.max(1, Math.round(img.width * scale));
                canvas.height = Math.max(1, Math.round(img.height * scale));
                const ctx = canvas.getContext('2d');
                ctx.drawImage(img, 0, 0, canvas.width, canvas.height);
                resolve(canvas.toDataURL('image/jpeg', quality));
            };
            img.onerror = () => reject(new Error('Could not read that photo'));
            img.src = reader.result;
        };
        reader.onerror = () => reject(new Error('Could not read that photo'));
        reader.readAsDataURL(file);
    });
}

export const printHtml = (title, inner) => {
    const win = window.open('', '_blank', 'width=420,height=640');
    if (!win) return;
    win.document.write(`<!doctype html><html><head><title>${title}</title>
      <style>
        body { font-family: Arial, sans-serif; padding: 16px; color: #111; }
        h1 { font-size: 16px; text-align: center; margin: 0 0 12px; }
        p { margin: 4px 0; font-size: 13px; }
        .muted { color: #555; font-size: 12px; }
        hr { border: none; border-top: 1px dashed #999; margin: 10px 0; }
        .center { text-align: center; }
      </style></head><body>${inner}</body></html>`);
    win.document.close();
    win.focus();
    win.print();
};

export const shareWhatsApp = (mobile, text) => {
    const digits = String(mobile || '').replace(/\D/g, '');
    const phone = digits.length === 10 ? `91${digits}` : digits;
    window.open(`https://wa.me/${phone}?text=${encodeURIComponent(text)}`, '_blank');
};

export const shareSms = (mobile, text) => {
    window.open(`sms:${mobile}?body=${encodeURIComponent(text)}`, '_self');
};

export const slipText = (ticket, companyName) => [
    companyName || 'VEHICLE PARKING',
    'VEHICLE TOKEN — show this to recover your vehicle',
    `Ticket No: ${ticket.ticket_no}`,
    `Vehicle: ${ticket.vehicle_type_name || ''} ${ticket.vehicle_number}`,
    ticket.customer_name ? `Name: ${ticket.customer_name}` : null,
    `Mobile: ${ticket.customer_mobile}`,
    `Check-In: ${formatWhen(ticket.check_in_at)}`,
    `Slot: ${ticket.slot_number}`,
    ticket.location_name ? `Facility: ${ticket.location_name}` : null,
    ticket.payment_status === 'PASS' && ticket.pass
        ? `Pass: ${ticket.pass.plan} until ${ticket.pass.valid_to}`
        : Number(ticket.paid_amount) > 0 ? `Paid: ${money(ticket.paid_amount)}${ticket.payment_status === 'PREPAID' ? ' (at check-in)' : ''}` : 'Payment: at check-out',
    'Keep this token until check-out.',
].filter(Boolean).join('\n');

export const receiptText = (ticket) => [
    'PARKING RECEIPT',
    `Receipt No: ${ticket.receipt?.receipt_no || ''}`,
    `Ticket No: ${ticket.ticket_no}`,
    `Vehicle: ${ticket.vehicle_type_name || ''} ${ticket.vehicle_number}`,
    `Check-In: ${formatWhen(ticket.check_in_at)}`,
    `Check-Out: ${formatWhen(ticket.check_out_at)}`,
    `Duration: ${ticket.duration_label || ''}`,
    `Parking: ${money(ticket.parking_charge)}`,
    `TOTAL: ${money(ticket.paid_amount || ticket.parking_charge)}`,
    `Payment: ${ticket.payment?.payment_mode || ''}`,
    `Status: ${ticket.payment_status || 'PAID'}`,
].join('\n');
