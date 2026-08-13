import React, { useCallback, useEffect, useState } from 'react';
import { toast, ToastContainer } from 'react-toastify';
import 'react-toastify/dist/ReactToastify.css';
import {
    FiPlus,
    FiTrash2,
    FiRefreshCw,
} from 'react-icons/fi';
import { useUserContext } from '../../context/user_context';
import { API_BASE_URL } from '../../utils/apiConfig';

/** True when viewport is phone-sized (stack layout). */
function useIsPhone() {
    const [isPhone, setIsPhone] = useState(() =>
        typeof window !== 'undefined' ? window.innerWidth < 768 : true
    );

    useEffect(() => {
        const update = () => setIsPhone(window.innerWidth < 768);
        update();
        window.addEventListener('resize', update);
        return () => window.removeEventListener('resize', update);
    }, []);

    return isPhone;
}

const CategorySection = ({
    title,
    tone,
    items,
    value,
    onChange,
    onAdd,
    type,
    saving,
    onRemove,
}) => (
    <section
        style={{
            display: 'block',
            width: '100%',
            boxSizing: 'border-box',
            background: '#fff',
            borderRadius: 16,
            border: '1px solid #e5e7eb',
            overflow: 'hidden',
            marginBottom: 0,
        }}
    >
        <div
            style={{
                padding: '12px 16px',
                borderBottom: '1px solid #e5e7eb',
                background: tone === 'income' ? '#ecfdf5' : '#fff1f2',
            }}
        >
            <h2
                style={{
                    margin: 0,
                    fontSize: 16,
                    fontWeight: 600,
                    color: tone === 'income' ? '#065f46' : '#9f1239',
                }}
            >
                {title}
            </h2>
        </div>

        <div style={{ padding: 16, borderBottom: '1px solid #f3f4f6' }}>
            <input
                type="text"
                value={value}
                onChange={(e) => onChange(e.target.value)}
                onKeyDown={(e) => {
                    if (e.key === 'Enter') onAdd();
                }}
                placeholder={`Add ${type.toLowerCase()} category`}
                disabled={saving}
                style={{
                    display: 'block',
                    width: '100%',
                    boxSizing: 'border-box',
                    padding: '10px 12px',
                    marginBottom: 8,
                    borderRadius: 8,
                    border: '1px solid #d1d5db',
                    fontSize: 14,
                }}
            />
            <button
                type="button"
                onClick={onAdd}
                disabled={saving}
                style={{
                    display: 'flex',
                    width: '100%',
                    alignItems: 'center',
                    justifyContent: 'center',
                    gap: 6,
                    padding: '10px 12px',
                    borderRadius: 8,
                    border: 'none',
                    background: '#dc2626',
                    color: '#fff',
                    fontSize: 14,
                    fontWeight: 600,
                    opacity: saving ? 0.5 : 1,
                }}
            >
                <FiPlus style={{ width: 16, height: 16 }} />
                Add
            </button>
        </div>

        <ul style={{ listStyle: 'none', margin: 0, padding: 0, maxHeight: 360, overflowY: 'auto' }}>
            {items.length === 0 ? (
                <li style={{ padding: '24px 16px', textAlign: 'center', color: '#6b7280', fontSize: 14 }}>
                    No categories yet
                </li>
            ) : (
                items.map((item) => (
                    <li
                        key={item.id}
                        style={{
                            display: 'flex',
                            alignItems: 'center',
                            justifyContent: 'space-between',
                            gap: 12,
                            padding: '12px 16px',
                            borderTop: '1px solid #f3f4f6',
                        }}
                    >
                        <div style={{ minWidth: 0, flex: 1 }}>
                            <p style={{ margin: 0, fontSize: 14, fontWeight: 600, color: '#111827' }}>
                                {item.name}
                            </p>
                            <p style={{ margin: '2px 0 0', fontSize: 11, color: '#9ca3af' }}>
                                {item.is_system ? 'Default' : 'Custom'}
                            </p>
                        </div>
                        <button
                            type="button"
                            onClick={() => onRemove(item)}
                            disabled={saving}
                            aria-label={`Remove ${item.name}`}
                            style={{
                                padding: 8,
                                border: 'none',
                                borderRadius: 8,
                                background: 'transparent',
                                color: '#9ca3af',
                                cursor: 'pointer',
                            }}
                        >
                            <FiTrash2 style={{ width: 16, height: 16 }} />
                        </button>
                    </li>
                ))
            )}
        </ul>
    </section>
);

const PersonalFinanceCategoriesPage = () => {
    const { user } = useUserContext();
    const token = user?.results?.token;
    const membershipId = user?.results?.userAccounts?.[0]?.parent_membership_id
        || user?.results?.userAccounts?.[0]?.membershipId;
    const isPhone = useIsPhone();

    const [income, setIncome] = useState([]);
    const [expense, setExpense] = useState([]);
    const [loading, setLoading] = useState(true);
    const [saving, setSaving] = useState(false);
    const [newIncome, setNewIncome] = useState('');
    const [newExpense, setNewExpense] = useState('');

    const fetchCategories = useCallback(async () => {
        if (!token) return;
        setLoading(true);
        try {
            const qs = membershipId ? `?parent_membership_id=${membershipId}` : '';
            const res = await fetch(`${API_BASE_URL}/pf/categories${qs}`, {
                headers: { Authorization: `Bearer ${token}` },
            });
            const data = await res.json();
            if (!res.ok || data.error) {
                throw new Error(data.message || 'Failed to load categories');
            }
            setIncome(data.results?.income || []);
            setExpense(data.results?.expense || []);
        } catch (error) {
            toast.error(error.message || 'Failed to load categories');
        } finally {
            setLoading(false);
        }
    }, [token, membershipId]);

    useEffect(() => {
        fetchCategories();
    }, [fetchCategories]);

    const addCategory = async (categoryType, name, clearFn) => {
        const trimmed = String(name || '').trim();
        if (!trimmed) {
            toast.error('Enter a category name');
            return;
        }
        setSaving(true);
        try {
            const res = await fetch(`${API_BASE_URL}/pf/categories`, {
                method: 'POST',
                headers: {
                    Authorization: `Bearer ${token}`,
                    'Content-Type': 'application/json',
                },
                body: JSON.stringify({
                    category_type: categoryType,
                    name: trimmed,
                    membershipId,
                }),
            });
            const data = await res.json();
            if (!res.ok || data.error) {
                throw new Error(data.message || 'Failed to add category');
            }
            toast.success(data.message || 'Category added');
            clearFn('');
            await fetchCategories();
        } catch (error) {
            toast.error(error.message || 'Failed to add category');
        } finally {
            setSaving(false);
        }
    };

    const removeCategory = async (category) => {
        if (!window.confirm(`Remove "${category.name}" from your list?`)) return;
        setSaving(true);
        try {
            const qs = membershipId ? `?parent_membership_id=${membershipId}` : '';
            const res = await fetch(`${API_BASE_URL}/pf/categories/${category.id}${qs}`, {
                method: 'DELETE',
                headers: { Authorization: `Bearer ${token}` },
            });
            const data = await res.json();
            if (!res.ok || data.error) {
                throw new Error(data.message || 'Failed to remove category');
            }
            toast.success(data.message || 'Category removed');
            await fetchCategories();
        } catch (error) {
            toast.error(error.message || 'Failed to remove category');
        } finally {
            setSaving(false);
        }
    };

    const incomeSection = (
        <CategorySection
            title="Income"
            tone="income"
            type="INCOME"
            items={income}
            value={newIncome}
            onChange={setNewIncome}
            onAdd={() => addCategory('INCOME', newIncome, setNewIncome)}
            saving={saving}
            onRemove={removeCategory}
        />
    );

    const expenseSection = (
        <CategorySection
            title="Expense"
            tone="expense"
            type="EXPENSE"
            items={expense}
            value={newExpense}
            onChange={setNewExpense}
            onAdd={() => addCategory('EXPENSE', newExpense, setNewExpense)}
            saving={saving}
            onRemove={removeCategory}
        />
    );

    return (
        <div style={{ display: 'block', width: '100%' }}>
            <main
                style={{
                    display: 'block',
                    width: '100%',
                    maxWidth: isPhone ? '100%' : 1280,
                    margin: '0 auto',
                    padding: isPhone ? '16px 16px 96px' : '32px 32px 96px',
                    boxSizing: 'border-box',
                }}
            >
                <header style={{ display: 'block', width: '100%', marginBottom: 20 }}>
                    <h1 style={{ margin: 0, fontSize: 24, fontWeight: 700, color: '#111827' }}>
                        Categories
                    </h1>
                    <p style={{ margin: '8px 0 0', fontSize: 14, color: '#4b5563' }}>
                        Every user starts with standard income &amp; expense categories. Customise yours anytime.
                    </p>
                    <button
                        type="button"
                        onClick={fetchCategories}
                        disabled={loading || saving}
                        style={{
                            marginTop: 12,
                            display: 'inline-flex',
                            alignItems: 'center',
                            gap: 8,
                            padding: '8px 12px',
                            borderRadius: 8,
                            border: '1px solid #d1d5db',
                            background: '#fff',
                            fontSize: 14,
                            color: '#374151',
                        }}
                    >
                        <FiRefreshCw style={{ width: 16, height: 16 }} />
                        Refresh
                    </button>
                </header>

                {loading ? (
                    <div style={{ textAlign: 'center', padding: 48 }}>Loading…</div>
                ) : isPhone ? (
                    /* Phone: heading → Income → Expense (one column) */
                    <div style={{ display: 'block', width: '100%' }}>
                        <div style={{ marginBottom: 16 }}>{incomeSection}</div>
                        <div>{expenseSection}</div>
                    </div>
                ) : (
                    /* Desktop: heading, then Income | Expense */
                    <div
                        style={{
                            display: 'grid',
                            gridTemplateColumns: '1fr 1fr',
                            gap: 24,
                            width: '100%',
                        }}
                    >
                        {incomeSection}
                        {expenseSection}
                    </div>
                )}
            </main>
            <ToastContainer position="top-right" autoClose={3000} />
        </div>
    );
};

export default PersonalFinanceCategoriesPage;
