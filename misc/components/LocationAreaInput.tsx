'use client';

import { useState, useRef, useEffect } from 'react';
import { MapPin, ChevronDown, X } from 'lucide-react';

interface LocationAreaInputProps {
  value: string;
  onChange: (value: string) => void;
  state: string;
  lga: string;
  className?: string;
}

export default function LocationAreaInput({ value, onChange, state, lga, className = '' }: LocationAreaInputProps) {
  const [inputValue, setInputValue] = useState(value || '');
  const [suggestions, setSuggestions] = useState<string[]>([]);
  const [showSuggestions, setShowSuggestions] = useState(false);
  const [loading, setLoading] = useState(false);
  const inputRef = useRef<HTMLInputElement>(null);
  const wrapperRef = useRef<HTMLDivElement>(null);
  const debounceRef = useRef<NodeJS.Timeout | null>(null);

  useEffect(() => {
    setInputValue(value || '');
  }, [value]);

  useEffect(() => {
    const handleClickOutside = (e: MouseEvent) => {
      if (wrapperRef.current && !wrapperRef.current.contains(e.target as Node)) {
        setShowSuggestions(false);
      }
    };
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  const fetchSuggestions = (query: string) => {
    if (debounceRef.current) clearTimeout(debounceRef.current);

    if (!state || !lga || query.length < 1) {
      setSuggestions([]);
      return;
    }

    debounceRef.current = setTimeout(async () => {
      setLoading(true);
      try {
        const res = await fetch(
          `${process.env.NEXT_PUBLIC_API_URL || ''}/teachers/areas?state=${encodeURIComponent(state)}&lga=${encodeURIComponent(lga)}&q=${encodeURIComponent(query)}`,
          {
            headers: {
              Authorization: `Bearer ${typeof window !== 'undefined' ? localStorage.getItem('token') || '' : ''}`,
            },
          }
        );
        if (res.ok) {
          const data = await res.json();
          setSuggestions((data.areas || []).filter((a: string) => a !== query));
        }
      } catch {
        // silent
      } finally {
        setLoading(false);
      }
    }, 300);
  };

  const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const val = e.target.value;
    setInputValue(val);
    onChange(val);
    if (val.length >= 1 && state && lga) {
      fetchSuggestions(val);
      setShowSuggestions(true);
    } else {
      setSuggestions([]);
      setShowSuggestions(false);
    }
  };

  const handleSelect = (suggestion: string) => {
    setInputValue(suggestion);
    onChange(suggestion);
    setShowSuggestions(false);
    setSuggestions([]);
  };

  const handleClear = () => {
    setInputValue('');
    onChange('');
    setSuggestions([]);
    setShowSuggestions(false);
    inputRef.current?.focus();
  };

  const disabled = !state || !lga;

  return (
    <div ref={wrapperRef} className={`relative ${className}`}>
      <div className="relative">
        <MapPin size={14} className="absolute left-3.5 top-3.5 text-gray-400" />
        <input
          ref={inputRef}
          type="text"
          value={inputValue}
          onChange={handleChange}
          onFocus={() => {
            if (suggestions.length > 0) setShowSuggestions(true);
          }}
          disabled={disabled}
          placeholder={disabled ? 'Select state & LGA first' : 'Area (e.g. Lekki, Ikeja GRA)'}
          className="w-full border border-gray-200 rounded-xl pl-10 pr-9 py-3 text-sm focus:outline-none focus:ring-2 focus:ring-[#001A72]/20 focus:border-[#001A72] transition font-medium text-gray-700 bg-white placeholder-gray-400 disabled:bg-gray-50 disabled:cursor-not-allowed"
        />
        {inputValue && !disabled && (
          <button type="button" onClick={handleClear} className="absolute right-3 top-3.5 text-gray-300 hover:text-gray-500">
            <X size={14} />
          </button>
        )}
      </div>

      {showSuggestions && suggestions.length > 0 && (
        <div className="absolute z-20 mt-1 w-full bg-white border border-gray-100 rounded-xl shadow-lg max-h-48 overflow-y-auto">
          {suggestions.map((suggestion) => (
            <button
              key={suggestion}
              type="button"
              onClick={() => handleSelect(suggestion)}
              className="w-full text-left px-4 py-2.5 text-sm text-gray-700 hover:bg-[#001A72]/5 transition flex items-center gap-2"
            >
              <MapPin size={12} className="text-gray-300 shrink-0" />
              {suggestion}
            </button>
          ))}
        </div>
      )}

      {disabled && (
        <p className="text-[10px] text-gray-400 mt-1">Select a state and LGA to enable area suggestions</p>
      )}
    </div>
  );
}
