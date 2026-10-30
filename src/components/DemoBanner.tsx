import React from 'react';
import { AlertTriangle } from 'lucide-react';
import type { PublicConfigDto } from '../lib/reelsApi';

export const DemoBanner: React.FC<{ config: PublicConfigDto | null }> = ({ config }) => {
  if (!config?.demoMode) return null;
  return (
    <div className="w-full bg-amber-400 text-black text-xs font-semibold px-4 py-2 flex items-center justify-center gap-2 text-center">
      <AlertTriangle className="w-4 h-4 flex-shrink-0" />
      <span>
        TRYB DEMO (DEMO_MODE=true): analiza, przymiarka, głos i wideo to atrapy — nie są wywoływane żadne prawdziwe modele AI.
        Płatności BLIK/Stripe i wystawianie na Vinted/OLX są symulowane.
      </span>
    </div>
  );
};
