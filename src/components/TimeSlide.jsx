import { motion } from 'framer-motion';
import { Timer, Zap, ArrowDown } from 'lucide-react';
import { getPassiveTimePenalty } from '../lib/RankingEngine';

export default function TimeSlide({ dish, isOptimized }) {
  const dishName = dish?.name || 'This dish';
  const prepTimeNormal = dish?.prepTimeNormal ?? 0;
  const cookTimeNormal = dish?.cookTimeNormal ?? 0;
  const totalTimeNormal = prepTimeNormal + cookTimeNormal;
  const prepTimeOptimized = dish?.prepTimeOptimized ?? prepTimeNormal;
  const cookTimeOptimized = dish?.cookTimeOptimized ?? cookTimeNormal;
  const passiveTimeHours = dish?.passiveTimeHours ?? 0;
  const passivePenalty = getPassiveTimePenalty(passiveTimeHours);
  const speedScoreBeforePenalty = dish?.speedScoreBeforePenalty ?? 5;
  const speedPercentile = dish?.speedPercentile ?? 50;
  const finalSpeedScore = dish?.normalizedBase?.speed ?? 5;
  const prepChanged = prepTimeNormal !== prepTimeOptimized;
  const cookChanged = cookTimeNormal !== cookTimeOptimized;
  const timeReduction = totalTimeNormal - (prepTimeOptimized + cookTimeOptimized);
  const percentReduction = totalTimeNormal > 0 ? Math.round((timeReduction / totalTimeNormal) * 100) : 0;
  const optimizedComment = dish?.optimizedComment || '';

  const hasUserTimeOverride = !!dish?.hasOverrides?.time;

  const formatPassiveTime = (h) => h < 1 ? `${Math.round(h * 60)} min` : h === 1 ? '1 hour' : `${h} hours`;

  return (
    <div className="space-y-3">
      <div className="bg-surface-100/80 dark:bg-surface-800/80 rounded-lg p-3">
        <div className="flex items-center justify-between mb-2">
          <div className="flex items-center gap-2">
            <Timer size={14} className="text-cyan-500" />
            <span className="text-xs font-semibold text-surface-700 dark:text-surface-200 uppercase tracking-wide">Standard Cooking</span>
          </div>
          <div className="px-2 py-0.5 rounded text-xs font-bold bg-cyan-500/15 text-cyan-600 dark:text-cyan-400">
            {finalSpeedScore.toFixed(1)}/10
          </div>
        </div>

        <p className="text-xs text-surface-600 dark:text-surface-300 leading-relaxed mb-2">
          <span className="font-semibold text-surface-800 dark:text-surface-100">{dishName}</span> requires{' '}
          <span className="font-mono font-semibold text-cyan-600 dark:text-cyan-400">{prepTimeNormal} min</span> of preparation
          {cookTimeNormal > 0 ? (
            <> and <span className="font-mono font-semibold text-cyan-600 dark:text-cyan-400">{cookTimeNormal} min</span> of cooking</>
          ) : null}.
        </p>

        <div className="bg-surface-200/50 dark:bg-surface-700/50 rounded-lg p-2 mb-2">
          <div className="flex items-center justify-between text-[9px] text-surface-500 mb-1">
            <span>Slowest</span>
            <span>Speed Percentile</span>
            <span>Fastest</span>
          </div>
          <div className="relative h-1.5 bg-surface-300 dark:bg-surface-600 rounded-full overflow-hidden">
            <motion.div
              className="absolute top-0 left-0 h-full bg-gradient-to-r from-cyan-500 to-emerald-500 rounded-full"
              initial={{ width: 0 }}
              animate={{ width: `${speedPercentile}%` }}
              transition={{ duration: 0.5 }}
            />
          </div>
          <p className="text-[10px] text-center text-cyan-600 dark:text-cyan-400 mt-1">
            Faster than {speedPercentile}% of dishes
          </p>
        </div>

        {/* Speed score explanation */}
        {hasUserTimeOverride ? (
          <p className="text-xs text-amber-600 dark:text-amber-400 font-medium">
            You changed the cooking time for this dish. Speed score is now <span className="font-mono">{finalSpeedScore.toFixed(1)}/10</span>
          </p>
        ) : (
          <p className="text-xs text-surface-600 dark:text-surface-300">
            Based on this, the dish receives an active speed score of{' '}
            <span className="font-mono font-semibold text-cyan-600 dark:text-cyan-400">≈{speedScoreBeforePenalty.toFixed(1)}/10</span>.
          </p>
        )}

        {passiveTimeHours > 0 && (
          <div className="mt-2 pt-2 border-t border-surface-200 dark:border-surface-700">
            <p className="text-xs text-surface-600 dark:text-surface-300">
              <span className="text-amber-600 dark:text-amber-400 font-semibold">+{formatPassiveTime(passiveTimeHours)}</span> passive time applies a{' '}
              <span className="text-rose-500 font-semibold">{passivePenalty} point</span> penalty.
              Final speed score: <span className="font-mono font-bold text-cyan-600">{finalSpeedScore.toFixed(1)}/10</span>
            </p>
          </div>
        )}
      </div>

      {(prepChanged || cookChanged) && (
        <div className="bg-emerald-500/10 border border-emerald-500/20 rounded-lg p-3">
          <div className="flex items-center justify-between mb-2">
            <div className="flex items-center gap-2">
              <Zap size={14} className="text-emerald-500" />
              <span className="text-xs font-semibold text-emerald-700 dark:text-emerald-300 uppercase">Time-Optimized</span>
            </div>
            <span className="text-xs font-bold text-emerald-600 dark:text-emerald-400">-{percentReduction}%</span>
          </div>

          <div className="grid grid-cols-2 gap-3 mb-2">
            <div>
              <div className="text-[10px] text-surface-500">Prep</div>
              <div className="flex items-center gap-1.5">
                <span className="font-semibold text-surface-700 dark:text-surface-200">{prepTimeOptimized} min</span>
                {prepChanged && <span className="flex items-center text-emerald-500 text-[10px]"><ArrowDown size={10} />{prepTimeNormal - prepTimeOptimized}</span>}
              </div>
            </div>
            <div>
              <div className="text-[10px] text-surface-500">Cook</div>
              <div className="flex items-center gap-1.5">
                <span className="font-semibold text-surface-700 dark:text-surface-200">{cookTimeOptimized} min</span>
                {cookChanged && <span className="flex items-center text-emerald-500 text-[10px]"><ArrowDown size={10} />{cookTimeNormal - cookTimeOptimized}</span>}
              </div>
            </div>
          </div>

          {optimizedComment && (
            <div className="bg-white/50 dark:bg-surface-800/50 rounded p-2 border-l-2 border-emerald-500">
              <p className="text-[11px] text-surface-600 dark:text-surface-300 italic">"{optimizedComment}"</p>
            </div>
          )}
        </div>
      )}
    </div>
  );
}

