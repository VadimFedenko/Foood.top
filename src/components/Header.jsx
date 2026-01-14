import { useState, useEffect } from 'react';
import { UtensilsCrossed } from 'lucide-react';
import SettingsButton from './SettingsButton';
import SettingsSheet from './SettingsSheet';
import ThemeToggle from './ThemeToggle';
import ViewModeToggle from './ViewModeToggle';
import PresetSelector from './PresetSelector';
import { usePrefs, prefsActions } from '../store/prefsStore';

/**
 * Main application header
 * Contains logo, preset selector, settings, and theme toggle
 */
export default function Header() {
  const isDark = usePrefs((s) => s.prefs.theme) !== 'light';
  const viewMode = usePrefs((s) => s.prefs.viewMode);
  const currentPresetId = usePrefs((s) => s.prefs.currentPresetId);

  const [isSettingsOpen, setIsSettingsOpen] = useState(false);
  const [presets, setPresets] = useState([]);
  
  // Load presets from JSON file
  useEffect(() => {
    fetch('/presets.json')
      .then((res) => res.json())
      .then((data) => {
        if (data.presets && Array.isArray(data.presets)) {
          setPresets(data.presets);
        }
      })
      .catch((err) => {
        console.error('Failed to load presets:', err);
      });
  }, []);
  
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
          <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-food-400 to-food-600 
                          flex items-center justify-center shadow-lg glow-orange max-[440px]:hidden">
            <UtensilsCrossed size={22} className="text-white" />
          </div>
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
