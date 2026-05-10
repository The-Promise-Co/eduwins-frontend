import React from 'react';
import Link from 'next/link';
import { ArrowLeft } from 'lucide-react';

interface PageHeaderProps {
  title: string;
  subtitle?: string;
  backHref?: string;
  rightElement?: React.ReactNode;
}

export default function PageHeader({ title, subtitle, backHref, rightElement }: PageHeaderProps) {
  return (
    <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
      <div className="flex items-center gap-4">
        {backHref && (
          <Link
            href={backHref}
            className="w-10 h-10 rounded-xl border border-gray-200 bg-white flex items-center justify-center hover:bg-gray-50 transition shrink-0 shadow-sm"
          >
            <ArrowLeft size={18} className="text-gray-600" />
          </Link>
        )}
        <div>
          <h1 className="text-2xl font-black text-gray-900">{title}</h1>
          {subtitle && <p className="text-sm text-gray-500 mt-0.5">{subtitle}</p>}
        </div>
      </div>
      {rightElement && <div className="shrink-0">{rightElement}</div>}
    </div>
  );
}
