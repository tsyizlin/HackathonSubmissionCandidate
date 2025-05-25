import React from 'react';
import { Check, AlertCircle } from 'lucide-react';

interface StatusToastProps {
  message: string | null;
  type: 'success' | 'error';
}

export const StatusToast: React.FC<StatusToastProps> = ({ message, type }) => {
  if (!message) return null;

  const bgColor = type === 'success' ? 'bg-green-500/20' : 'bg-amber-600/20';
  const borderColor = type === 'success' ? 'border-green-500/30' : 'border-amber-600/30';
  const textColor = type === 'success' ? 'text-green-500' : 'text-amber-600/90';
  const Icon = type === 'success' ? Check : AlertCircle;

  return (
    <div className={`fixed bottom-4 right-4 p-3 ${bgColor} border ${borderColor} rounded-md shadow-lg z-50 max-w-md terminal-glow`}>
      <p className={`text-xs ${textColor} font-mono flex items-center gap-1`}>
        <Icon size={12} />
        {message}
      </p>
    </div>
  );
};
