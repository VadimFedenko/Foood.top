import { useState, useEffect, useRef } from 'react';
import { createPortal } from 'react-dom';
import { UtensilsCrossed, ChevronDown } from 'lucide-react';
import OptimizedToggle from './OptimizedToggle';
import ThemeToggle from './ThemeToggle';
import { ECONOMIC_ZONES } from '../lib/RankingEngine';

/**
 * Main application header
 * Contains logo, zone selector, optimized toggle, and theme toggle
 */
export default function Header({ 
  isOptimized, 
  onOptimizedToggle,
  isDark,
  onThemeToggle,
  isWorstMode,
  onWorstModeToggle,
  selectedZone,
  onZoneChange
}) {
  const [isZoneDropdownOpen, setIsZoneDropdownOpen] = useState(false);
  const [dropdownPosition, setDropdownPosition] = useState(null);
  const zoneButtonRef = useRef(null);
  const zoneDropdownRef = useRef(null);

  const handleZoneButtonClick = (event) => {
    const buttonElement = event.currentTarget;
    zoneButtonRef.current = buttonElement;

    if (buttonElement) {
      const rect = buttonElement.getBoundingClientRect();
      const dropdownWidth = 280;
      const screenWidth = window.innerWidth;
      const isNarrowScreen = screenWidth < 640;
      
      // На узких экранах выравниваем по правому краю экрана с отступом
      // На широких экранах - по левому краю кнопки
      let left;
      if (isNarrowScreen) {
        // Выравниваем по правому краю экрана с отступом 16px
        left = screenWidth - dropdownWidth - 16;
        // Не позволяем меню уходить слишком далеко влево (минимум 16px от левого края)
        left = Math.max(16, left);
      } else {
        // На широких экранах - по левому краю кнопки
        left = rect.left;
      }
      
      setDropdownPosition({
        top: rect.bottom + 4,
        left: left,
        width: rect.width,
      });
    }

    setIsZoneDropdownOpen(prev => !prev);
  };

  const closeDropdown = () => {
    setIsZoneDropdownOpen(false);
    setDropdownPosition(null);
    zoneButtonRef.current = null;
  };

  useEffect(() => {
    if (!isZoneDropdownOpen) return;

    const buttonRef = zoneButtonRef.current;
    
    const handleClickOutside = (event) => {
      if (
        buttonRef && !buttonRef.contains(event.target) &&
        zoneDropdownRef.current && !zoneDropdownRef.current.contains(event.target)
      ) {
        closeDropdown();
      }
    };

    const handleScroll = (event) => {
      let element = event.target;
      while (element && element !== document.body) {
        if (element === zoneDropdownRef.current) {
          return;
        }
        element = element.parentElement;
      }
      closeDropdown();
    };

    document.addEventListener('mousedown', handleClickOutside);
    document.addEventListener('touchstart', handleClickOutside);
    window.addEventListener('scroll', handleScroll, true);

    return () => {
      document.removeEventListener('mousedown', handleClickOutside);
      document.removeEventListener('touchstart', handleClickOutside);
      window.removeEventListener('scroll', handleScroll, true);
    };
  }, [isZoneDropdownOpen]);

  return (
    <header className="bg-white dark:bg-surface-800 border-b border-surface-700/50 dark:border-surface-700/50">
      <div className="px-4 py-3 flex items-center justify-between">
        {/* Logo */}
        <div className="flex items-center gap-3 min-w-0 flex-1">
          <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-food-400 to-food-600 
                          flex items-center justify-center shadow-lg glow-orange">
            <UtensilsCrossed size={22} className="text-white" />
          </div>
          <button
            onClick={onWorstModeToggle}
            className="text-left hover:opacity-80 transition-opacity cursor-pointer min-w-0 flex-1"
            title={isWorstMode ? "Click to switch back to Best Food Ever" : "Click to switch to Worst Food Ever"}
          >
            <h1 className="font-display font-bold text-lg text-surface-900 dark:text-surface-100 truncate">
              {isWorstMode ? 'Worst Food Ever' : 'Best Food Ever'}
            </h1>
            <p className="text-[10px] text-surface-500 dark:text-surface-400 uppercase tracking-wider truncate">
              Personal Food Leaderboard
            </p>
          </button>
        </div>

        {/* Controls */}
        <div className="flex items-center gap-2">
          {/* Zone selector - показываем только на узких экранах (<640px) */}
          {selectedZone && onZoneChange && (
            <button
              ref={zoneButtonRef}
              onClick={handleZoneButtonClick}
              className="sm:hidden w-10 h-10 rounded-xl bg-blue-500/20 dark:bg-blue-500/30 border border-blue-500/40 dark:border-blue-500/50 flex items-center justify-center hover:bg-blue-500/30 dark:hover:bg-blue-500/40 transition-colors"
              aria-label="Select economic zone"
              title={ECONOMIC_ZONES[selectedZone]?.name}
            >
              <span className="text-lg">{ECONOMIC_ZONES[selectedZone]?.emoji}</span>
            </button>
          )}
          <OptimizedToggle 
            isOptimized={isOptimized} 
            onToggle={onOptimizedToggle} 
          />
          <ThemeToggle 
            isDark={isDark} 
            onToggle={onThemeToggle} 
          />
        </div>
      </div>

      {/* Zone dropdown portal - показываем только на узких экранах */}
      {isZoneDropdownOpen && dropdownPosition && selectedZone && onZoneChange && createPortal(
        <div 
          ref={zoneDropdownRef}
          className="fixed bg-white dark:bg-surface-800 rounded-lg border border-surface-300 dark:border-surface-700 shadow-lg z-[100] max-h-64 overflow-y-auto min-w-[240px]"
          style={{
            top: `${dropdownPosition.top}px`,
            left: `${dropdownPosition.left}px`,
            width: '280px',
          }}
        >
          {Object.entries(ECONOMIC_ZONES).map(([zoneId, zone]) => (
            <button
              key={zoneId}
              onClick={() => {
                onZoneChange(zoneId);
                closeDropdown();
              }}
              className={`
                w-full px-3 py-2 text-left text-sm flex items-center gap-2
                transition-colors
                ${selectedZone === zoneId
                  ? 'bg-blue-500/20 text-blue-600 dark:text-blue-400'
                  : 'text-surface-700 dark:text-surface-200 hover:bg-surface-200 dark:hover:bg-surface-700'
                }
              `}
            >
              <span className="text-lg">{zone.emoji}</span>
              <span className="flex-1">{zone.name}</span>
              {selectedZone === zoneId && (
                <span className="text-blue-500">✓</span>
              )}
            </button>
          ))}
        </div>,
        document.body
      )}
    </header>
  );
}






