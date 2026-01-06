import { UtensilsCrossed } from 'lucide-react';
import OptimizedToggle from './OptimizedToggle';
import ThemeToggle from './ThemeToggle';

/**
 * Main application header
 * Contains logo, zone selector, optimized toggle, and theme toggle
 */
export default function Header({ 
  isOptimized, 
  onOptimizedToggle,
  isDark,
  onThemeToggle
}) {
  return (
    <header className="glass border-b border-surface-700/50 dark:border-surface-700/50">
      <div className="px-4 py-3 flex items-center justify-between">
        {/* Logo */}
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-food-400 to-food-600 
                          flex items-center justify-center shadow-lg glow-orange">
            <UtensilsCrossed size={22} className="text-white" />
          </div>
          <div>
            <h1 className="font-display font-bold text-lg text-surface-900 dark:text-surface-100">
              Best Food Ever
            </h1>
            <p className="text-[10px] text-surface-500 dark:text-surface-400 uppercase tracking-wider">
              Personal Food Leaderboard
            </p>
          </div>
        </div>

        {/* Controls */}
        <div className="flex items-center gap-2">
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
    </header>
  );
}






