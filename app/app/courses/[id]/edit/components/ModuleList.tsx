'use client';

import { useState } from 'react';
import { Layout, ChevronRight, Plus } from 'lucide-react';

interface ModuleListProps {
  modules: any[];
  selectedModuleId: string | null;
  onSelectModule: (id: string) => void;
  onCloseForm: () => void;
  onAddModule: (title: string) => Promise<void>;
  isAddingModulePending: boolean;
}

export default function ModuleList({
  modules = [],
  selectedModuleId,
  onSelectModule,
  onCloseForm,
  onAddModule,
  isAddingModulePending,
}: ModuleListProps) {
  const [addingModule, setAddingModule] = useState(false);
  const [newModuleTitle, setNewModuleTitle] = useState('');

  const handleAddSubmit = async () => {
    if (!newModuleTitle.trim()) return;
    try {
      await onAddModule(newModuleTitle);
      setNewModuleTitle('');
      setAddingModule(false);
    } catch (err) {
      // Error handled by parent toast
    }
  };

  return (
    <div className="bg-white border border-gray-100 rounded-2xl shadow-sm overflow-hidden">
      <div className="px-5 py-4 border-b border-gray-100 flex items-center justify-between">
        <div className="flex items-center gap-2 text-[#001A72]">
          <Layout size={16} />
          <span className="text-sm font-black uppercase tracking-widest">Modules</span>
        </div>
        <span className="text-[10px] font-bold text-gray-400">{modules.length || 0} total</span>
      </div>

      <div className="divide-y divide-gray-50">
        {modules.map((mod: any, idx: number) => {
          const isSelected = selectedModuleId === mod.id;
          return (
            <button
              key={mod.id}
              onClick={() => {
                onSelectModule(mod.id);
                onCloseForm();
              }}
              className={`w-full flex items-center gap-3 px-5 py-4 text-left transition group ${isSelected
                ? 'bg-[#001A72]/5 border-l-4 border-l-[#001A72]'
                : 'hover:bg-gray-50 border-l-4 border-l-transparent'
                }`}
            >
              <div className={`w-7 h-7 rounded-lg flex items-center justify-center text-xs font-black shrink-0 transition ${isSelected ? 'bg-[#001A72] text-white' : 'bg-gray-100 text-gray-500'
                }`}>
                {idx + 1}
              </div>
              <div className="flex-1 min-w-0">
                <p className={`text-sm font-bold truncate ${isSelected ? 'text-[#001A72]' : 'text-gray-700'}`}>
                  {mod.title}
                </p>
                <p className="text-[10px] text-gray-400 font-bold mt-0.5">
                  {mod.lessons?.length || 0} lesson{mod.lessons?.length !== 1 ? 's' : ''}
                </p>
              </div>
              <ChevronRight size={14} className={`shrink-0 transition ${isSelected ? 'text-[#001A72]' : 'text-gray-300'}`} />
            </button>
          );
        })}
      </div>

      <div className="p-4 border-t border-gray-100">
        {addingModule ? (
          <div className="space-y-3">
            <input
              autoFocus
              value={newModuleTitle}
              onChange={e => setNewModuleTitle(e.target.value)}
              onKeyDown={e => {
                if (e.key === 'Enter') handleAddSubmit();
                if (e.key === 'Escape') setAddingModule(false);
              }}
              placeholder="Module title…"
              className="w-full border border-[#001A72]/30 rounded-xl px-3 py-2.5 text-sm font-bold focus:ring-2 focus:ring-[#001A72]/10 focus:border-[#001A72] outline-none"
            />
            <div className="flex gap-2">
              <button
                onClick={handleAddSubmit}
                disabled={isAddingModulePending || !newModuleTitle.trim()}
                className="flex-1 py-2 bg-[#001A72] text-white text-xs font-bold rounded-xl hover:bg-[#001A72]/90 transition disabled:opacity-50"
              >
                {isAddingModulePending ? 'Adding…' : 'Add'}
              </button>
              <button
                onClick={() => {
                  setAddingModule(false);
                  setNewModuleTitle('');
                }}
                className="px-3 py-2 text-xs font-bold text-gray-500 hover:text-gray-700 transition"
              >
                Cancel
              </button>
            </div>
          </div>
        ) : (
          <button
            onClick={() => setAddingModule(true)}
            className="w-full py-3 border-2 border-dashed border-gray-200 rounded-xl text-xs font-black text-gray-400 uppercase tracking-widest hover:border-[#001A72] hover:text-[#001A72] hover:bg-[#001A72]/5 transition flex items-center justify-center gap-2"
          >
            <Plus size={14} /> Add Module
          </button>
        )}
      </div>
    </div>
  );
}
