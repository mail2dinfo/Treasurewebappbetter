import React, { useEffect, useMemo, useRef, useState } from "react";
import "../style/FilterBar.css";

const OTHERS_VALUE = "__others__";

const FilterBar = ({ filters, setFilters, categories = [] }) => {
  const [showOthersPopup, setShowOthersPopup] = useState(false);
  const [searchText, setSearchText] = useState("");
  const searchInputRef = useRef(null);

  const namedCategories = useMemo(
    () =>
      (categories || [])
        .map((item) => item?.category_name)
        .filter(Boolean),
    [categories]
  );

  const isCustomCategory =
    Boolean(filters.category) && !namedCategories.includes(filters.category);

  const selectValue = isCustomCategory ? OTHERS_VALUE : (filters.category || "");

  useEffect(() => {
    if (showOthersPopup && searchInputRef.current) {
      searchInputRef.current.focus();
    }
  }, [showOthersPopup]);

  const handleChange = (e) => {
    const { name, value } = e.target;
    if (name === "category" && value === OTHERS_VALUE) {
      setSearchText(isCustomCategory ? filters.category : "");
      setShowOthersPopup(true);
      return;
    }
    setShowOthersPopup(false);
    setFilters((prev) => ({ ...prev, [name]: value }));
  };

  const applyCategory = () => {
    const value = searchText.trim();
    if (!value) return;
    setFilters((prev) => ({ ...prev, category: value }));
    setShowOthersPopup(false);
  };

  const clearFilters = () => {
    setShowOthersPopup(false);
    setSearchText("");
    setFilters({
      startDate: "",
      endDate: "",
      category: "",
      entryType: "",
    });
  };

  return (
    <div className="filter-bar">
      <div className="filter-item">
        <label htmlFor="startDate">Start date</label>
        <input
          id="startDate"
          name="startDate"
          type="date"
          value={filters.startDate}
          onChange={handleChange}
        />
      </div>

      <div className="filter-item">
        <label htmlFor="endDate">End date</label>
        <input
          id="endDate"
          name="endDate"
          type="date"
          value={filters.endDate}
          onChange={handleChange}
        />
      </div>

      <div className="filter-item filter-item-category">
        <label htmlFor="category">Category</label>
        <select
          id="category"
          name="category"
          value={selectValue}
          onChange={handleChange}
        >
          <option value="">All</option>
          {namedCategories.map((name) => (
            <option key={name} value={name}>
              {name}
            </option>
          ))}
          <option value={OTHERS_VALUE}>Others</option>
        </select>
        {isCustomCategory ? (
          <button
            type="button"
            className="filter-category-hint"
            title={filters.category}
            onClick={() => {
              setSearchText(filters.category || "");
              setShowOthersPopup(true);
            }}
          >
            Matching: {filters.category}
          </button>
        ) : null}

        {showOthersPopup && (
          <div className="filter-others-overlay" onClick={() => setShowOthersPopup(false)}>
            <div
              className="filter-others-popup"
              onClick={(e) => e.stopPropagation()}
              role="dialog"
              aria-label="Search category"
            >
              <input
                ref={searchInputRef}
                type="text"
                value={searchText}
                onChange={(e) => setSearchText(e.target.value)}
                placeholder="Type to search category"
                onKeyDown={(e) => {
                  if (e.key === "Enter") {
                    e.preventDefault();
                    applyCategory();
                  }
                  if (e.key === "Escape") setShowOthersPopup(false);
                }}
              />
              <div className="filter-others-actions">
                <button type="button" className="filter-others-cancel" onClick={() => setShowOthersPopup(false)}>
                  Cancel
                </button>
                <button
                  type="button"
                  className="filter-others-apply"
                  onClick={applyCategory}
                  disabled={!searchText.trim()}
                >
                  Apply
                </button>
              </div>
            </div>
          </div>
        )}
      </div>

      <div className="filter-item">
        <label htmlFor="entryType">Type</label>
        <select
          id="entryType"
          name="entryType"
          value={filters.entryType}
          onChange={handleChange}
        >
          <option value="">All</option>
          <option value="CREDIT">CREDIT</option>
          <option value="DEBIT">DEBIT</option>
        </select>
      </div>

      <button className="clear-button" onClick={clearFilters}>
        Clear filters
      </button>
    </div>
  );
};

export default FilterBar;
