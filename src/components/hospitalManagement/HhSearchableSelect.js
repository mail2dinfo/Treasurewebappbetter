import React, { useEffect, useMemo, useRef, useState } from 'react';

const HhSearchableSelect = ({
  label,
  placeholder = 'Search and select',
  value = '',
  options = [],
  getOptionValue = (option) => option.id,
  getOptionLabel = (option) => option.name,
  getOptionSearch,
  onChange,
  disabled = false,
  emptyText = 'No matches found',
}) => {
  const [open, setOpen] = useState(false);
  const [query, setQuery] = useState('');
  const boxRef = useRef(null);

  const selected = options.find((option) => String(getOptionValue(option)) === String(value));
  const displayLabel = selected ? getOptionLabel(selected) : '';

  useEffect(() => {
    if (!open) setQuery('');
  }, [open]);

  useEffect(() => {
    const onClickAway = (event) => {
      if (!boxRef.current?.contains(event.target)) setOpen(false);
    };
    document.addEventListener('mousedown', onClickAway);
    return () => document.removeEventListener('mousedown', onClickAway);
  }, []);

  const filtered = useMemo(() => {
    const term = query.trim().toLowerCase();
    if (!term) return options;
    return options.filter((option) => String((getOptionSearch || getOptionLabel)(option) || '').toLowerCase().includes(term));
  }, [options, query, getOptionLabel, getOptionSearch]);

  return (
    <label className="block text-sm" ref={boxRef}>
      {label && <span className="text-gray-600">{label}</span>}
      <div className={`relative ${label ? 'mt-1' : ''}`}>
        <input
          className="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm bg-white disabled:bg-gray-100"
          placeholder={placeholder}
          value={open ? query : displayLabel}
          disabled={disabled}
          onFocus={() => setOpen(true)}
          onChange={(event) => {
            setQuery(event.target.value);
            setOpen(true);
          }}
        />
        {open && !disabled && (
          <ul className="absolute z-30 mt-1 max-h-56 w-full overflow-auto rounded-lg border border-gray-200 bg-white shadow-lg">
            {filtered.length ? filtered.map((option) => {
              const optionValue = String(getOptionValue(option));
              const active = optionValue === String(value);
              return (
                <li key={optionValue}>
                  <button
                    type="button"
                    className={`w-full px-3 py-2 text-left text-sm hover:bg-cyan-50 ${active ? 'bg-cyan-50 font-semibold text-cyan-900' : 'text-gray-800'}`}
                    onClick={() => {
                      onChange(optionValue, option);
                      setOpen(false);
                    }}
                  >
                    {getOptionLabel(option)}
                  </button>
                </li>
              );
            }) : (
              <li className="px-3 py-2 text-sm text-gray-500">{emptyText}</li>
            )}
          </ul>
        )}
      </div>
    </label>
  );
};

export default HhSearchableSelect;
