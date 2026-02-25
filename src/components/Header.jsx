import { useState } from 'react';
import SettingsButton from './SettingsButton';
import SettingsSheet from './SettingsSheet';
import ThemeToggle from './ThemeToggle';
import ViewModeToggle from './ViewModeToggle';
import PresetSelector from './PresetSelector';
import { PRESETS } from '../data/presets';
import { usePrefs, prefsActions } from '../store/prefsStore';
import { useUserPresets } from '../store/userPresetsStore';

/**
 * Main application header
 * Contains logo, preset selector, settings, and theme toggle
 */
export default function Header() {
  const isDark = usePrefs((s) => s.prefs.theme) !== 'light';
  const viewMode = usePrefs((s) => s.prefs.viewMode);
  const currentPresetId = usePrefs((s) => s.prefs.currentPresetId);
  const userPresets = useUserPresets();

  const [isSettingsOpen, setIsSettingsOpen] = useState(false);
  const defaultUserPresetDescription = 'Personal Food Leaderboard.';
  const presets = [
    ...(userPresets || []).map((p) => ({ ...p, description: defaultUserPresetDescription })),
    ...PRESETS,
  ];
  
  const handleViewModeToggle = () => {
    prefsActions.setPref({ viewMode: viewMode === 'list' ? 'grid' : 'list' });
  };
  
  const handlePresetSelect = (preset) => {
    prefsActions.applyPreset(preset);
  };
  
  // Find current preset object
  const currentPreset = presets.find((p) => p.id === currentPresetId) || presets[0] || null;

  return (
    <header
      className={`
        bg-white dark:bg-surface-800 border-b border-surface-700/50 dark:border-surface-700/50
        ${''}
      `}
    >
      <div className="px-4 py-3 flex items-center justify-between">
        {/* Logo and Preset Selector */}
        <div className="flex items-center gap-3 min-w-0 flex-1">
          <img src="/foood_logo.svg" alt="Best Food Ever" className="w-10 h-10 rounded-xl object-contain max-[440px]:hidden" />
          <PresetSelector
            presets={presets}
            currentPreset={currentPreset}
            onSelectPreset={handlePresetSelect}
          />
        </div>

        {/* Controls */}
        <div className="flex items-center gap-2">
          <ViewModeToggle viewMode={viewMode} onToggle={handleViewModeToggle} />
          <SettingsButton onClick={() => setIsSettingsOpen(true)} />
          <ThemeToggle 
            isDark={isDark} 
            onToggle={() => prefsActions.setPref({ theme: isDark ? 'light' : 'dark' })} 
          />
        </div>
      </div>

      <SettingsSheet open={isSettingsOpen} onClose={() => setIsSettingsOpen(false)} />
    </header>
  );
}
