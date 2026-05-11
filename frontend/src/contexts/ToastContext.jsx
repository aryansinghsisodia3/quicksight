import React, { createContext, useContext, useState, useCallback } from 'react';
import { CheckCircle, AlertCircle, Info, X } from 'lucide-react';

const ToastContext = createContext();

export function ToastProvider({ children }) {
  const [toasts, setToasts] = useState([]);

  const addToast = useCallback((message, type = 'info') => {
    const id = Date.now();
    setToasts(prev => [...prev, { id, message, type }]);
    setTimeout(() => {
      setToasts(prev => prev.filter(t => t.id !== id));
    }, 5000);
  }, []);

  return (
    <ToastContext.Provider value={{ addToast }}>
      {children}
      <div className="fixed bottom-6 right-6 z-50 flex flex-col gap-3">
        {toasts.map(toast => (
          <div key={toast.id} className={`flex items-center gap-3 p-4 rounded-xl shadow-2xl backdrop-blur-md animate-in slide-in-from-right-8 duration-300 border ${
            toast.type === 'success' ? 'bg-emerald-100 dark:bg-emerald-950/80 border-emerald-500/30 text-emerald-900 dark:text-emerald-100' :
            toast.type === 'error' ? 'bg-rose-100 dark:bg-rose-950/80 border-rose-500/30 text-rose-900 dark:text-rose-100' :
            'bg-blue-100 dark:bg-slate-800/90 border-blue-500/30 text-blue-900 dark:text-slate-100'
          }`}>
            {toast.type === 'success' && <CheckCircle size={20} className="text-emerald-500 dark:text-emerald-400" />}
            {toast.type === 'error' && <AlertCircle size={20} className="text-rose-500 dark:text-rose-400" />}
            {toast.type === 'info' && <Info size={20} className="text-blue-500 dark:text-blue-400" />}
            <span className="font-semibold text-sm mr-4">{toast.message}</span>
            <button onClick={() => setToasts(t => t.filter(x => x.id !== toast.id))} className="opacity-50 hover:opacity-100 transition-opacity">
              <X size={16}/>
            </button>
          </div>
        ))}
      </div>
    </ToastContext.Provider>
  );
}

export const useToast = () => useContext(ToastContext);
