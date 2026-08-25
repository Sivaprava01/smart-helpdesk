import React from 'react';

export default function Button({
  children,
  variant = 'primary', // 'primary', 'secondary', 'danger', 'ghost'
  size = 'md', // 'sm', 'md', 'lg'
  icon = null,
  loading = false,
  disabled = false,
  onClick,
  type = 'button',
  className = '',
  ...props
}) {
  let variantClass = 'btn-sh-primary';
  if (variant === 'secondary') variantClass = 'btn-sh-secondary';
  if (variant === 'danger') variantClass = 'btn-sh-danger';
  if (variant === 'ghost') variantClass = 'btn btn-link text-decoration-none';

  return (
    <button
      type={type}
      className={`${variantClass} ${className}`}
      disabled={disabled || loading}
      onClick={onClick}
      {...props}
    >
      {loading ? (
        <>
          <span className="spinner-border spinner-border-sm me-1" role="status" aria-hidden="true"></span>
          <span>Processing...</span>
        </>
      ) : (
        <>
          {icon && <span className="material-symbols-outlined">{icon}</span>}
          {children}
        </>
      )}
    </button>
  );
}
