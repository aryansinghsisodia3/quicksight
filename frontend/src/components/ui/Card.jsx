import React from 'react';

export default function Card({ children, className = '' }) {
  return (
    <div
      className={`rounded-2xl border border-gray-200 bg-white p-6 shadow-lg transition-all duration-300 dark:border-white/10 dark:bg-gray-900 dark:shadow-black/40 ${className}`}
    >
      {children}
    </div>
  );
}
