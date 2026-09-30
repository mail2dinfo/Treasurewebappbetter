import React, { useState } from 'react';
import { toast } from 'react-toastify';
import { useDeepavali } from '../../context/deepavali/DeepavaliContext';
import { DP_ROLE_RESPONSIBILITIES } from '../../components/deepavaliChits/deepavaliMenuItems';

const emptyForm = {
    employee_name: '',
    phone: '',
    employee_code: '',
    login_username: '',
    role_id: '',
    joining_date: '',
    address: '',
    status: 'ACTIVE',
};

const DeepavaliEmployeesPage = ({ embedded = false }) => {
    const { employees, roles, saveEmployee, disableEmployee, saveRole, loading } = useDeepavali();
    const [form, setForm] = useState(emptyForm);
    const [saving, setSaving] = useState(false);
    const [showForm, setShowForm] = useState(false);
    const [roleForm, setRoleForm] = useState({ role_name: 'Collector', description: 'Field collection', menus: ['subscribers', 'collections'] });
    const [editingRoleId, setEditingRoleId] = useState(null);
    const [savingRole, setSavingRole] = useState(false);

    const onChange = (e) => setForm((prev) => ({ ...prev, [e.target.name]: e.target.value }));

    const editRow = (row) => {
        setForm({
            id: row.id,
            employee_name: row.employee_name || '',
            phone: row.phone || '',
            employee_code: row.employee_code || '',
            login_username: row.login_username || '',
            role_id: row.role_id || '',
            joining_date: row.joining_date || '',
            address: row.address || '',
            status: row.status || 'ACTIVE',
        });
        setShowForm(true);
    };

    const onSubmit = async (e) => {
        e.preventDefault();
        if (!form.employee_name.trim()) {
            toast.error('Employee name is required');
            return;
        }
        setSaving(true);
        try {
            await saveEmployee(form);
            toast.success('Employee saved');
            setForm(emptyForm);
            setShowForm(false);
        } catch (err) {
            toast.error(err.message || 'Could not save employee');
        } finally {
            setSaving(false);
        }
    };

    const onDisable = async (id) => {
        try {
            await disableEmployee(id);
            toast.success('Employee disabled');
        } catch (err) {
            toast.error(err.message || 'Could not disable employee');
        }
    };

    const editRole = (row) => {
        setEditingRoleId(row.id);
        setRoleForm({
            role_name: row.role_name || '',
            description: row.description || '',
            menus: row.permissions?.menus || [],
        });
    };

    const toggleMenu = (id) => {
        setRoleForm((prev) => ({
            ...prev,
            menus: prev.menus.includes(id) ? prev.menus.filter((item) => item !== id) : [...prev.menus, id],
        }));
    };

    const onSaveRole = async (e) => {
        e.preventDefault();
        if (!roleForm.role_name.trim()) {
            toast.error('Role name is required');
            return;
        }
        if (!roleForm.menus.length) {
            toast.error('Tick at least one responsibility');
            return;
        }
        setSavingRole(true);
        try {
            await saveRole({
                id: editingRoleId || undefined,
                role_name: roleForm.role_name,
                description: roleForm.description,
                permissions: { menus: roleForm.menus },
            });
            toast.success('Role and responsibilities saved');
            setEditingRoleId(null);
            setRoleForm({ role_name: 'Collector', description: 'Field collection', menus: ['subscribers', 'collections'] });
        } catch (err) {
            toast.error(err.message || 'Could not save role');
        } finally {
            setSavingRole(false);
        }
    };

    return (
        <div className={embedded ? 'px-4 py-5 space-y-6' : 'max-w-5xl mx-auto px-4 py-6 space-y-6'}>
            {!embedded && (
            <div>
                <h1 className="text-xl font-semibold text-gray-900">Staff & roles</h1>
                <p className="text-sm text-gray-600 mt-1">Create a Collector role, tick what they may do, then add the person and assign that role. Treasure COLLECTOR login follows the Collector role menus.</p>
            </div>
            )}

            <section className="rounded-2xl border border-orange-100 bg-white p-4 shadow-sm space-y-3">
                <h2 className="font-medium text-gray-900">Roles & responsibilities</h2>
                <form onSubmit={onSaveRole} className="space-y-3">
                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                        <input
                            placeholder="Role name (e.g. Collector)"
                            value={roleForm.role_name}
                            onChange={(e) => setRoleForm((p) => ({ ...p, role_name: e.target.value }))}
                            className="rounded-lg border border-gray-200 px-3 py-2"
                        />
                        <input
                            placeholder="Description"
                            value={roleForm.description}
                            onChange={(e) => setRoleForm((p) => ({ ...p, description: e.target.value }))}
                            className="rounded-lg border border-gray-200 px-3 py-2"
                        />
                    </div>
                    <p className="text-xs text-gray-500">Responsibilities</p>
                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
                        {DP_ROLE_RESPONSIBILITIES.map((item) => (
                            <label key={item.id} className="flex items-center gap-2 text-sm text-gray-700">
                                <input type="checkbox" checked={roleForm.menus.includes(item.id)} onChange={() => toggleMenu(item.id)} />
                                {item.label}
                            </label>
                        ))}
                    </div>
                    <button type="submit" disabled={savingRole || loading} className="rounded-lg bg-orange-700 text-white px-3 py-2 text-sm">
                        {savingRole ? 'Saving…' : editingRoleId ? 'Update role' : 'Create role'}
                    </button>
                    {editingRoleId && (
                        <button
                            type="button"
                            className="ml-2 text-sm text-gray-600"
                            onClick={() => {
                                setEditingRoleId(null);
                                setRoleForm({ role_name: 'Collector', description: 'Field collection', menus: ['subscribers', 'collections'] });
                            }}
                        >
                            Cancel
                        </button>
                    )}
                </form>
                <div className="space-y-2">
                    {roles.map((row) => (
                        <div key={row.id} className="flex justify-between gap-2 text-sm rounded-lg border border-gray-100 px-3 py-2">
                            <div>
                                <p className="font-medium">{row.role_name}</p>
                                <p className="text-xs text-gray-500">
                                    {(row.permissions?.menus || []).join(', ') || 'No responsibilities set'}
                                </p>
                            </div>
                            <button type="button" className="text-orange-700" onClick={() => editRole(row)}>Edit</button>
                        </div>
                    ))}
                </div>
            </section>

            <div className="flex items-center justify-between gap-3">
                <h2 className="font-medium text-gray-900">Employees</h2>
                <button
                    type="button"
                    onClick={() => { setForm(emptyForm); setShowForm((v) => !v); }}
                    className="rounded-lg bg-orange-700 text-white px-3 py-2 text-sm"
                >
                    {showForm ? 'Close' : 'Add employee'}
                </button>
            </div>

            {showForm && (
                <form onSubmit={onSubmit} className="rounded-2xl border border-orange-100 bg-white p-4 grid grid-cols-1 sm:grid-cols-2 gap-3 shadow-sm">
                    <label className="text-sm sm:col-span-2">
                        Name
                        <input name="employee_name" value={form.employee_name} onChange={onChange} className="mt-1 w-full rounded-lg border border-gray-200 px-3 py-2" />
                    </label>
                    <label className="text-sm">
                        Phone
                        <input name="phone" value={form.phone} onChange={onChange} className="mt-1 w-full rounded-lg border border-gray-200 px-3 py-2" />
                    </label>
                    <label className="text-sm">
                        Code
                        <input name="employee_code" value={form.employee_code} onChange={onChange} className="mt-1 w-full rounded-lg border border-gray-200 px-3 py-2" />
                    </label>
                    <label className="text-sm">
                        Login username
                        <input name="login_username" value={form.login_username} onChange={onChange} className="mt-1 w-full rounded-lg border border-gray-200 px-3 py-2" />
                    </label>
                    <label className="text-sm">
                        Role
                        <select name="role_id" value={form.role_id} onChange={onChange} className="mt-1 w-full rounded-lg border border-gray-200 px-3 py-2">
                            <option value="">Select role</option>
                            {roles.map((role) => (
                                <option key={role.id} value={role.id}>{role.role_name}</option>
                            ))}
                        </select>
                    </label>
                    <label className="text-sm">
                        Joining date
                        <input type="date" name="joining_date" value={form.joining_date} onChange={onChange} className="mt-1 w-full rounded-lg border border-gray-200 px-3 py-2" />
                    </label>
                    <label className="text-sm sm:col-span-2">
                        Address
                        <input name="address" value={form.address} onChange={onChange} className="mt-1 w-full rounded-lg border border-gray-200 px-3 py-2" />
                    </label>
                    <button type="submit" disabled={saving || loading} className="sm:col-span-2 rounded-lg bg-orange-700 text-white py-2.5 font-medium disabled:opacity-60">
                        {saving ? 'Saving…' : 'Save employee'}
                    </button>
                </form>
            )}

            <div className="space-y-2 lg:hidden">
                {employees.map((row) => (
                    <div key={row.id} className="rounded-2xl border border-orange-100 bg-white p-4 shadow-sm">
                        <div className="flex justify-between gap-2">
                            <div>
                                <p className="font-semibold text-gray-900">{row.employee_name}</p>
                                <p className="text-xs text-gray-500">{row.role?.role_name || 'No role'} · {row.phone || '—'}</p>
                            </div>
                            <span className={`text-xs px-2 py-1 rounded-full h-fit ${row.status === 'ACTIVE' ? 'bg-green-50 text-green-700' : 'bg-gray-100 text-gray-600'}`}>
                                {row.status}
                            </span>
                        </div>
                        <div className="mt-3 flex gap-2">
                            <button type="button" onClick={() => editRow(row)} className="flex-1 rounded-lg border border-gray-200 py-2 text-sm">Edit</button>
                            {row.status === 'ACTIVE' && (
                                <button type="button" onClick={() => onDisable(row.id)} className="flex-1 rounded-lg border border-red-200 text-red-700 py-2 text-sm">Disable</button>
                            )}
                        </div>
                    </div>
                ))}
                {!employees.length && !loading && <p className="text-sm text-gray-500">No employees yet.</p>}
            </div>

            <div className="hidden lg:block overflow-x-auto rounded-2xl border border-orange-100 bg-white">
                <table className="min-w-full text-sm">
                    <thead className="bg-orange-50 text-left text-gray-600">
                        <tr>
                            <th className="px-3 py-2">Name</th>
                            <th className="px-3 py-2">Role</th>
                            <th className="px-3 py-2">Phone</th>
                            <th className="px-3 py-2">Status</th>
                            <th className="px-3 py-2">Actions</th>
                        </tr>
                    </thead>
                    <tbody>
                        {employees.map((row) => (
                            <tr key={row.id} className="border-t border-gray-100">
                                <td className="px-3 py-2 font-medium">{row.employee_name}</td>
                                <td className="px-3 py-2">{row.role?.role_name || '—'}</td>
                                <td className="px-3 py-2">{row.phone || '—'}</td>
                                <td className="px-3 py-2">{row.status}</td>
                                <td className="px-3 py-2 space-x-2">
                                    <button type="button" onClick={() => editRow(row)} className="text-orange-700">Edit</button>
                                    {row.status === 'ACTIVE' && (
                                        <button type="button" onClick={() => onDisable(row.id)} className="text-red-600">Disable</button>
                                    )}
                                </td>
                            </tr>
                        ))}
                    </tbody>
                </table>
            </div>
        </div>
    );
};

export default DeepavaliEmployeesPage;
