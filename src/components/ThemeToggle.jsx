import { Sun, Moon } from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';

/**
 * Theme toggle button with smooth sun/moon animation
 */
export default function ThemeToggle({ isDark, onToggle }) {
  return (
    <motion.button
      onClick={onToggle}
      className={`
        relative w-10 h-10 rounded-xl flex items-center justify-center
        transition-all duration-300 overflow-hidden
        ${isDark 
          ? 'bg-surface-700/80 hover:bg-surface-600/80 border border-surface-600/50' 
          : 'bg-amber-100/80 hover:bg-amber-200/80 border border-amber-200/50'
        }
      `}
      whileHover={{ scale: 1.05 }}
      whileTap={{ scale: 0.95 }}
      aria-label={isDark ? 'Switch to light mode' : 'Switch to dark mode'}
    >
      <AnimatePresence mode="wait" initial={false}>
        {isDark ? (
          <motion.div
            key="moon"
            initial={{ y: -30, opacity: 0, rotate: -90 }}
            animate={{ y: 0, opacity: 1, rotate: 0 }}
            exit={{ y: 30, opacity: 0, rotate: 90 }}
            transition={{ 
              duration: 0.3, 
              ease: [0.68, -0.55, 0.265, 1.55] 
            }}
          >
            <Moon 
              size={20} 
              className="text-indigo-300"
              strokeWidth={2}
            />
          </motion.div>
        ) : (
          <motion.div
            key="sun"
            initial={{ y: 30, opacity: 0, rotate: 90 }}
            animate={{ y: 0, opacity: 1, rotate: 0 }}
            exit={{ y: -30, opacity: 0, rotate: -90 }}
            transition={{ 
              duration: 0.3, 
              ease: [0.68, -0.55, 0.265, 1.55] 
            }}
          >
            <Sun 
              size={20} 
              className="text-amber-600"
              strokeWidth={2}
            />
          </motion.div>
        )}
      </AnimatePresence>
      
      {/* Subtle glow effect */}
      <motion.div
        className={`
          absolute inset-0 rounded-xl opacity-0 pointer-events-none
          ${isDark 
            ? 'bg-indigo-500/20' 
            : 'bg-amber-400/30'
          }
        `}
        animate={{ 
          opacity: [0, 0.5, 0],
          scale: [0.8, 1.2, 0.8]
        }}
        transition={{
          duration: 2,
          repeat: Infinity,
          ease: "easeInOut"
        }}
      />
    </motion.button>
  );
}



