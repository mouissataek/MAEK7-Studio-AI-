import React from 'react';
import { Coins } from 'lucide-react';
import { useRemainingBudget } from '../utils/api';

interface CostBadgeProps {
  lang: 'ar' | 'en';
  units: number;
}

/** Shows the relative cost of the pending generation and the budget left today. */
export const CostBadge: React.FC<CostBadgeProps> = ({ lang, units }) => {
  const isAr = lang === 'ar';
  const remaining = useRemainingBudget();
  const tooExpensive = remaining !== null && units > remaining;

  return (
    <div
      className={`flex items-center justify-between gap-2 px-3 py-2 rounded-xl border text-[11px] ${
        tooExpensive
          ? 'bg-red-950/40 border-red-500/40 text-red-300'
          : 'bg-neutral-950/60 border-neutral-800 text-neutral-400'
      }`}
      title={
        isAr
          ? 'وحدات نسبية: 1 وحدة ≈ صورة بدقة 1K. ليست عملة.'
          : 'Relative units: 1 unit ≈ one 1K image. Not currency.'
      }
    >
      <span className="flex items-center gap-1.5">
        <Coins className="w-3.5 h-3.5 text-amber-400" />
        {isAr ? `الكلفة التقديرية: ${units} وحدة` : `Estimated cost: ${units} units`}
      </span>
      {remaining !== null && (
        <span>
          {tooExpensive
            ? isAr
              ? `تتجاوز المتبقي اليوم (${remaining})`
              : `Exceeds today's remaining (${remaining})`
            : isAr
              ? `المتبقي اليوم: ${remaining}`
              : `Left today: ${remaining}`}
        </span>
      )}
    </div>
  );
};
