import { Badge } from './ui/badge';
import type { TriageStatus } from '../../lib/types';

const TRIAGE_META: Record<TriageStatus, { label: string; className: string }> = {
  GOOD: { label: 'Good', className: 'bg-[#E8F5E9] text-[#2E7D32]' },
  INTERMEDIATE: { label: 'Intermediate', className: 'bg-[#FFF3E0] text-[#E65100]' },
  CRITICAL: { label: 'Critical', className: 'bg-[#FFEBEE] text-[#C62828]' },
};

/**
 * Read-only triage-state pill. Renders nothing for an untriaged patient.
 * Visible only on staff-facing screens (doctor/nurse/admin).
 */
export function TriageBadge({ status, className = '' }: { status?: TriageStatus | null; className?: string }) {
  if (!status) return null;
  const meta = TRIAGE_META[status];
  return (
    <Badge className={`${meta.className} border-0 text-xs ${className}`}>
      <span className="w-1.5 h-1.5 rounded-full bg-current mr-1.5 inline-block" />
      {meta.label}
    </Badge>
  );
}
