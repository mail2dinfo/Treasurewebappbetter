import React, { useState } from 'react';
import styled from 'styled-components';
import { MdBusiness, MdLocationOn, MdVoicemail } from 'react-icons/md';
import { toast } from 'react-toastify';
import { useDeepavali } from '../../context/deepavali/DeepavaliContext';
import defaultLogo from '../../assets/logo.png';

const emptyForm = {
    company_name: '',
    phone: '',
    email: '',
    address: '',
    gst_details: '',
};

const DeepavaliCompanyCard = ({ company, allowManage = true }) => {
    const { saveCompany, loading } = useDeepavali();
    const [imageError, setImageError] = useState(false);
    const [showForm, setShowForm] = useState(false);
    const [form, setForm] = useState(emptyForm);
    const [saving, setSaving] = useState(false);

    const logo = company?.company_logo && !imageError ? company.company_logo : defaultLogo;

    const openAdd = () => {
        setForm(emptyForm);
        setShowForm(true);
    };

    const openEdit = () => {
        if (!company) return openAdd();
        setForm({
            id: company.id,
            company_name: company.company_name || '',
            phone: company.phone || '',
            email: company.email || '',
            address: company.address || '',
            gst_details: company.gst_details || '',
        });
        setShowForm(true);
    };

    const closeForm = () => {
        if (saving) return;
        setShowForm(false);
        setForm(emptyForm);
    };

    const onSubmit = async (e) => {
        e.preventDefault();
        if (!form.company_name.trim()) {
            toast.error('Company name is required');
            return;
        }
        setSaving(true);
        try {
            await saveCompany({
                ...form,
                company_name: form.company_name.trim(),
            });
            toast.success(form.id ? 'Company updated' : 'Company added');
            setShowForm(false);
            setForm(emptyForm);
        } catch (err) {
            toast.error(err.message || 'Could not save company');
        } finally {
            setSaving(false);
        }
    };

    return (
        <>
            <Wrapper>
                {!company ? (
                    <div className="welcome-guest">
                        <p className="guest-text">Hello, Welcome</p>
                        <p className="guest-subtext">Set up your Deepavali Chits company to get started</p>
                        {allowManage && (
                            <button type="button" className="start-group-button" onClick={openAdd}>
                                Start Company
                            </button>
                        )}
                    </div>
                ) : (
                    <div className="company-info">
                        <header>
                            <img
                                src={logo}
                                alt={company.company_name}
                                onError={() => setImageError(true)}
                            />
                            <div className="header-text">
                                <h4>{company.company_name}</h4>
                                <p>Deepavali Chits</p>
                            </div>
                            {allowManage && (
                                <a
                                    href="#edit-company"
                                    onClick={(e) => {
                                        e.preventDefault();
                                        openEdit();
                                    }}
                                >
                                    Edit Company
                                </a>
                            )}
                        </header>
                        <p className="bio">Welcome Managing Director</p>
                        <div className="links">
                            {company.address ? (
                                <p><MdLocationOn /> {company.address}</p>
                            ) : null}
                            {company.email ? (
                                <p><MdVoicemail /> {company.email}</p>
                            ) : null}
                            {company.phone ? (
                                <p><MdBusiness /> {company.phone}</p>
                            ) : null}
                            {company.gst_details ? (
                                <p><MdBusiness /> GST: {company.gst_details}</p>
                            ) : null}
                        </div>
                    </div>
                )}
            </Wrapper>

            {showForm && (
                <div className="fixed inset-0 z-[80] bg-black/50 flex items-center justify-center p-4" onClick={closeForm}>
                    <form
                        onSubmit={onSubmit}
                        onClick={(e) => e.stopPropagation()}
                        className="bg-white rounded-xl shadow-2xl w-full max-w-md p-6 space-y-4"
                    >
                        <div className="flex items-start justify-between gap-3">
                            <h2 className="text-lg font-bold text-gray-900">{form.id ? 'Edit Company' : 'Start Company'}</h2>
                            <button type="button" className="text-gray-400 hover:text-gray-700 text-xl leading-none px-1" onClick={closeForm} aria-label="Close">
                                ×
                            </button>
                        </div>
                        {[
                            ['company_name', 'Company name', 'text'],
                            ['phone', 'Phone', 'tel'],
                            ['email', 'Email', 'email'],
                            ['gst_details', 'GST', 'text'],
                        ].map(([name, label, type]) => (
                            <label key={name} className="block text-sm font-medium text-gray-700">
                                {label}
                                <input
                                    name={name}
                                    type={type}
                                    value={form[name] || ''}
                                    onChange={(e) => setForm((prev) => ({ ...prev, [e.target.name]: e.target.value }))}
                                    className="mt-1 w-full rounded-lg border border-gray-300 px-3 py-2 focus:ring-2 focus:ring-red-500 focus:border-transparent"
                                    autoFocus={name === 'company_name'}
                                    required={name === 'company_name'}
                                />
                            </label>
                        ))}
                        <label className="block text-sm font-medium text-gray-700">
                            Address
                            <textarea
                                name="address"
                                value={form.address || ''}
                                onChange={(e) => setForm((prev) => ({ ...prev, address: e.target.value }))}
                                rows={3}
                                className="mt-1 w-full rounded-lg border border-gray-300 px-3 py-2 focus:ring-2 focus:ring-red-500 focus:border-transparent"
                            />
                        </label>
                        <div className="flex gap-3 pt-1">
                            <button type="button" onClick={closeForm} disabled={saving} className="flex-1 px-4 py-2.5 border border-gray-300 text-gray-700 rounded-lg font-medium hover:bg-gray-50">
                                Cancel
                            </button>
                            <button type="submit" disabled={saving || loading} className="flex-1 px-4 py-2.5 bg-red-500 hover:bg-red-600 text-white rounded-lg font-medium disabled:opacity-50">
                                {saving ? 'Saving…' : form.id ? 'Update' : 'Submit'}
                            </button>
                        </div>
                    </form>
                </div>
            )}
        </>
    );
};

const Wrapper = styled.article`
  background: #fff;
  padding: 1.8rem 2rem;
  border-radius: 1rem;
  position: relative;
  box-shadow: 0 4px 15px rgba(0,0,0,0.08);
  height: 100%;
  border-top: 5px solid #d62828;

  header {
    display: flex;
    align-items: center;
    column-gap: 1rem;
    margin-bottom: 1rem;
    flex-wrap: wrap;

    img {
      width: 80px;
      height: 80px;
      border-radius: 50%;
      border: 2px solid #d62828;
      object-fit: cover;
    }

    .header-text h4 {
      margin-bottom: 0.25rem;
      font-size: 1.2rem;
      font-weight: 600;
      color: #333;
    }

    .header-text p {
      margin-bottom: 0;
      color: #888;
      font-size: 0.9rem;
    }

    a {
      margin-left: auto;
      color: #d62828;
      border: 1px solid #d62828;
      padding: 0.25rem 0.75rem;
      border-radius: 1rem;
      text-transform: capitalize;
      font-size: 0.85rem;
      cursor: pointer;
    }

    a:hover {
      background: #d62828;
      color: #fff;
    }
  }

  .bio {
    color: #555;
    margin-bottom: 1rem;
    font-size: 0.95rem;
  }

  .links p {
    margin-bottom: 0.4rem;
    display: flex;
    align-items: center;
    color: #444;
    font-size: 0.9rem;
    word-break: break-word;

    svg {
      margin-right: 0.5rem;
      font-size: 1.2rem;
      color: #d62828;
      flex-shrink: 0;
    }
  }

  .welcome-guest {
    text-align: center;
    padding: 1rem;
  }

  .guest-text {
    font-size: 1.1rem;
    margin-bottom: 0.4rem;
    color: #444;
    font-weight: 600;
  }

  .guest-subtext {
    font-size: 0.9rem;
    color: #6b7280;
    margin-bottom: 0.8rem;
  }

  .start-group-button {
    background-color: #d62828;
    color: #fff;
    border: none;
    border-radius: 8px;
    padding: 10px 40px;
    font-size: 0.95rem;
    font-weight: 500;
    cursor: pointer;
  }

  .start-group-button:hover {
    background-color: #b81f1f;
  }
`;

export default DeepavaliCompanyCard;
