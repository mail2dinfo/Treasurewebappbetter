import React from "react";
import "../style/FilterBar.css";

const FilterBar = ({ filters, setFilters, categories = [] }) => {
  const handleChange = (e) => {
    const { name, value } = e.target;
    setFilters((prev) => ({ ...prev, [name]: value }));
  };

  const clearFilters = () => {
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
        <label htmlFor="startDate">St Date:</label>
        <input
          id="startDate"
          name="startDate"
          type="date"
          value={filters.startDate}
          onChange={handleChange}
        />
      </div>

      <div className="filter-item">
        <label htmlFor="endDate">Ed Date:</label>
        <input
          id="endDate"
          name="endDate"
          type="date"
          value={filters.endDate}
          onChange={handleChange}
        />
      </div>

      <div className="filter-item">
        <label htmlFor="category">Category:</label>
        {categories.length > 0 ? (
          <select
            id="category"
            name="category"
            value={filters.category}
            onChange={handleChange}
          >
            <option value="">All</option>
            {categories.map((item) => (
              <option key={item.id || item.category_name} value={item.category_name}>
                {item.category_name}
              </option>
            ))}
          </select>
        ) : (
          <input
            id="category"
            name="category"
            type="text"
            placeholder="Category"
            value={filters.category}
            onChange={handleChange}
          />
        )}
      </div>

      <div className="filter-item">
        <label htmlFor="entryType">Type:</label>
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
        + Clear Filters
      </button>
    </div>
  );
};

export default FilterBar;
