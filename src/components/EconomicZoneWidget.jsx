import { ChevronDown } from 'lucide-react';
import WorldMapWidget from './WorldMapWidget';
import { ECONOMIC_ZONES } from '../lib/RankingEngine';
import ZoneIcon from './ZoneIcon';

/**
 * Economic zone widget content
 */
export default function EconomicZoneWidget({ 
  selectedZone, 
  onZoneChange, 
  handleZoneButtonClick, 
  isZoneDropdownOpen 
}) {
  return (
    <div className="hidden sm:block sm:w-[260px] bg-white dark:bg-surface-800 rounded-xl p-2 sm:p-3 border border-surface-300/50 dark:border-surface-700/50 flex flex-col">
      <div className="w-full relative flex-shrink-0 flex-1" style={{ height: '140px' }}>
        <WorldMapWidget
          variant="square"
          selectedZone={selectedZone}
          onZoneSelect={onZoneChange}
        />
        <div className="absolute -bottom-1 left-1 text-[9px] text-surface-500 dark:text-surface-400 leading-snug pointer-events-none z-10 whitespace-nowrap">
          Select an economic zone to calculate local prices
        </div>
      </div>

      <div className="mt-auto pt-3 relative flex-shrink-0">
        <button
          onClick={handleZoneButtonClick}
          className="flex items-center gap-2 text-sm font-medium text-surface-700 dark:text-surface-200 w-full text-left"
        >
          <ZoneIcon zoneId={selectedZone} size={18} />
          <span className="truncate flex-1">{ECONOMIC_ZONES[selectedZone]?.name}</span>
          <ChevronDown 
            size={16} 
            className={`text-surface-500 dark:text-surface-400 transition-transform ${isZoneDropdownOpen ? 'rotate-180' : ''}`}
          />
        </button>
      </div>
    </div>
  );
}

