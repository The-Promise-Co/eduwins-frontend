import React from 'react';
import Link from 'next/link';

interface ButtonProps extends React.ButtonHTMLAttributes<HTMLButtonElement> {
  isLoading?: boolean;
  loadingText?: string;
  variant?: 'primary' | 'secondary' | 'outline' | 'ghost' | 'danger';
  fullWidth?: boolean;
  href?: string;
}

const Button: React.FC<ButtonProps> = ({
  children,
  isLoading = false,
  loadingText = 'Loading...',
  variant = 'primary',
  fullWidth = true,
  className = '',
  disabled,
  href,
  ...props
}) => {
  const baseStyles = "font-semibold py-3.5 rounded-xl transition disabled:opacity-70 flex items-center justify-center gap-2 mt-2 shadow-sm focus:outline-none focus:ring-2 focus:ring-offset-2";
  
  const variants = {
    primary: "bg-primary hover:bg-primary/90 text-white focus:ring-primary",
    secondary: "bg-gray-100 hover:bg-gray-200 text-gray-900 focus:ring-gray-400",
    outline: "bg-transparent border border-gray-200 hover:bg-gray-50 text-gray-700 focus:ring-gray-300",
    ghost: "bg-transparent hover:bg-gray-50 text-gray-600 focus:ring-gray-200 shadow-none mt-0",
    danger: "bg-red-600 hover:bg-red-700 text-white focus:ring-red-500",
  };

  const widthStyle = fullWidth ? "w-full" : "px-6";
  const combinedClassName = `${baseStyles} ${variants[variant]} ${widthStyle} ${className}`;

  const content = (
    <>
      {isLoading ? (
        <>
          <svg 
            className="animate-spin h-5 w-5 text-current" 
            xmlns="http://www.w3.org/2000/svg" 
            fill="none" 
            viewBox="0 0 24 24"
          >
            <circle 
              className="opacity-25" 
              cx="12" 
              cy="12" 
              r="10" 
              stroke="currentColor" 
              strokeWidth="4" 
            />
            <path 
              className="opacity-75" 
              fill="currentColor" 
              d="M4 12a8 8 0 018-8v4a4 4 0 00-4 4H4z" 
            />
          </svg>
          {loadingText && <span>{loadingText}</span>}
        </>
      ) : (
        children
      )}
    </>
  );

  if (href) {
    return (
      <Link href={href} className={combinedClassName}>
        {content}
      </Link>
    );
  }

  return (
    <button
      disabled={isLoading || disabled}
      className={combinedClassName}
      {...props}
    >
      {content}
    </button>
  );
};

export default Button;
