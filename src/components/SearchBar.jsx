import React from 'react';

export default function SearchBar({ value, onChange, placeholder = 'Search Champions...' }) {
  return (
    <div className="flex flex-row items-center gap-1.5 w-full px-3 py-2.5 rounded-search border border-border bg-bg-medium">
      <svg
        width="18"
        height="18"
        viewBox="0 0 24 24"
        fill="none"
        xmlns="http://www.w3.org/2000/svg"
        className="shrink-0 text-text-gray"
      >
        <circle cx="11" cy="11" r="7" stroke="currentColor" strokeWidth="2"/>
        <path d="M16 16l4 4" stroke="currentColor" strokeWidth="2" strokeLinecap="round"/>
      </svg>
      <input
        type="text"
        value={value}
        onChange={(e) => onChange(e.target.value)}
        placeholder={placeholder}
        className="flex-1 min-w-0 bg-transparent border-0 outline-none font-normal text-sm text-text-gray font-inter placeholder:text-text-gray"
      />
    </div>
  );
}
