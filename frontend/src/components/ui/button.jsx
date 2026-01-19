import React from 'react';

export const Button = ({ children, className = '', type = 'button', ...props }) => {
    return (
        <button
            type={type}
            className={`inline-flex items-center justify-center transition-colors disabled:pointer-events-none disabled:opacity-50 cursor-pointer ${className}`}
            {...props}
        >
            {children}
        </button>
    );
};
