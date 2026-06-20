import { Globe } from 'lucide-react';
import { useLanguage } from '../../lib/i18n';

/**
 * Floating language toggle. Click to flip between English and Romanian.
 * Persists in localStorage and updates `<html lang>`.
 */
export function LanguageToggle({ className = '' }: { className?: string }) {
  const { lang, toggle, t } = useLanguage();
  return (
    <button
      onClick={toggle}
      title={t('lang.toggle.tooltip')}
      aria-label={t('lang.toggle.tooltip')}
      className={`flex items-center gap-1.5 px-3 h-10 rounded-full bg-white/90 backdrop-blur-md shadow-md border border-gray-200 hover:shadow-lg active:scale-95 transition-all ${className}`}
    >
      <Globe className="w-4 h-4 text-gray-700" />
      <span className="text-sm font-semibold text-gray-800 tracking-wide uppercase">
        {lang}
      </span>
    </button>
  );
}
