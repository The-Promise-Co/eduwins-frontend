'use client';

import { useEffect, useMemo, useRef, useState } from 'react';
import { createPortal } from 'react-dom';
import { ChevronDown, Loader2, Search } from 'lucide-react';

export interface SearchableSelectOption {
  value: string;
  label: string;
}

interface SearchableSelectProps {
  options: SearchableSelectOption[];
  value: string;
  onChange: (value: string) => void;
  placeholder?: string;
  loading?: boolean;
  className?: string;
}

interface DropdownRect {
  top: number;
  left: number;
  width: number;
  maxHeight: number;
}

export default function SearchableSelect({
  options,
  value,
  onChange,
  placeholder = 'Select…',
  loading = false,
  className = '',
}: SearchableSelectProps) {
  const [open, setOpen] = useState(false);
  const [query, setQuery] = useState('');
  const [rect, setRect] = useState<DropdownRect | null>(null);
  const wrapperRef = useRef<HTMLDivElement>(null);
  const buttonRef = useRef<HTMLButtonElement>(null);
  const dropdownRef = useRef<HTMLDivElement>(null);

  const selected = options.find((o) => o.value === value);

  const filtered = useMemo(() => {
    const q = query.trim().toLowerCase().replace(/\s+/g, ' ');
    if (!q) return options;

    const scored = options
      .map((o) => {
        const label = o.label.toLowerCase();
        const val = o.value.toLowerCase();
        let score = -1;
        if (label === q) score = 0;
        else if (label.startsWith(q)) score = 1;
        else if (label.includes(q)) score = 2;
        else if (val === q) score = 3;
        else if (val.startsWith(q)) score = 4;
        else if (val.includes(q)) score = 5;
        return { o, score };
      })
      .filter((x) => x.score >= 0)
      .sort((a, b) => a.score - b.score || a.o.label.localeCompare(b.o.label))
      .map((x) => x.o);

    return scored;
  }, [options, query]);

  const toggle = () => {
    if (!open && buttonRef.current) {
      const r = buttonRef.current.getBoundingClientRect();
      const maxHeight = Math.min(280, window.innerHeight - 24);
      const spaceBelow = window.innerHeight - r.bottom - 12;
      const spaceAbove = r.top - 12;
      const openAbove = spaceBelow < maxHeight && spaceAbove > spaceBelow;
      setRect({
        top: openAbove ? Math.max(12, r.top - Math.min(maxHeight, spaceAbove) - 4) : r.bottom + 4,
        left: r.left,
        width: r.width,
        maxHeight: Math.min(maxHeight, openAbove ? spaceAbove : spaceBelow),
      });
    }
    if (open) {
      setQuery('');
      setRect(null);
    }
    setOpen((v) => !v);
  };

  useEffect(() => {
    if (!open) return;

    const handleClickOutside = (e: MouseEvent) => {
      const target = e.target as Node;
      const inWrapper = wrapperRef.current?.contains(target);
      const inDropdown = dropdownRef.current?.contains(target);
      if (!inWrapper && !inDropdown) {
        setOpen(false);
        setQuery('');
        setRect(null);
      }
    };

    const handleScroll = (event: Event) => {
      const target = event.target;
      if (target instanceof Node && dropdownRef.current?.contains(target)) return;

      setOpen(false);
      setQuery('');
      setRect(null);
    };

    const handleResize = () => {
      setOpen(false);
      setQuery('');
      setRect(null);
    };

    document.addEventListener('mousedown', handleClickOutside);
    window.addEventListener('scroll', handleScroll, true);
    window.addEventListener('resize', handleResize);
    return () => {
      document.removeEventListener('mousedown', handleClickOutside);
      window.removeEventListener('scroll', handleScroll, true);
      window.removeEventListener('resize', handleResize);
    };
  }, [open]);

  const dropdown = open && rect && (
    <div
      ref={dropdownRef}
      className="fixed z-[9999] bg-white border border-gray-100 rounded-xl shadow-2xl overflow-hidden"
      style={{ top: rect.top, left: rect.left, width: rect.width, maxHeight: rect.maxHeight }}
    >
      <div className="relative border-b border-gray-100">
        <Search size={14} className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" />
        <input
          autoFocus
          type="text"
          value={query}
          onChange={(e) => setQuery(e.target.value)}
          placeholder="Search…"
          className="w-full pl-9 pr-4 py-2.5 text-sm focus:outline-none bg-transparent placeholder-gray-400"
        />
      </div>
      <div className="overflow-y-auto overscroll-contain touch-pan-y" style={{ maxHeight: Math.max(0, rect.maxHeight - 44) }}>
        {loading ? (
          <div className="px-4 py-6 flex items-center justify-center gap-2 text-xs text-gray-400">
            <Loader2 size={14} className="animate-spin" /> Loading…
          </div>
        ) : filtered.length === 0 ? (
          <p className="px-4 py-6 text-xs text-gray-400 text-center">No options found</p>
        ) : (
          filtered.map((opt) => (
            <button
              key={opt.value}
              type="button"
              onClick={() => {
                onChange(opt.value);
                setOpen(false);
                setQuery('');
                setRect(null);
              }}
              className={`w-full text-left px-4 py-2.5 text-sm transition ${
                opt.value === value
                  ? 'bg-[#001A72]/5 text-[#001A72] font-bold'
                  : 'text-gray-700 hover:bg-gray-50'
              }`}
            >
              <span className="flex items-center justify-between gap-3">
                <span>{opt.label}</span>
                <span className="text-[10px] font-medium text-gray-400 shrink-0">{opt.value}</span>
              </span>
            </button>
          ))
        )}
      </div>
    </div>
  );

  return (
    <div ref={wrapperRef} className={`relative ${className}`}>
      <button
        ref={buttonRef}
        type="button"
        onClick={toggle}
        className="w-full flex items-center justify-between gap-2 px-4 py-3 rounded-xl border border-gray-200 text-sm focus:outline-none focus:border-[#FFB81C] transition bg-white"
      >
        <span className={selected ? 'text-gray-800 font-medium' : 'text-gray-400'}>
          {selected ? selected.label : placeholder}
        </span>
        {loading ? (
          <Loader2 size={16} className="text-gray-400 animate-spin shrink-0" />
        ) : (
          <ChevronDown size={16} className="text-gray-400 shrink-0" />
        )}
      </button>

      {open && typeof document !== 'undefined' && createPortal(dropdown, document.body)}
    </div>
  );
}
