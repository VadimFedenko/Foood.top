import { useState, useEffect, useRef } from 'react';
import { Map as MapIcon, X, Loader2 } from 'lucide-react';
import { ECONOMIC_ZONES, calculateDishCost } from '../lib/RankingEngine';
import { getPriceColor } from './dishCardUtils';
import EconomicZonesSvgMap from './EconomicZonesSvgMap';
import ZoneIcon from './ZoneIcon';

export default function IndexMapSlide({ dish, ingredientIndex, isMobile, priceUnit, defaultSelectedZone }) {
  const [hoveredZone, setHoveredZone] = useState(null);
  const [selectedZone, setSelectedZone] = useState(defaultSelectedZone || null);
  const [zonePrices, setZonePrices] = useState({});
  const [zoneBreakdowns, setZoneBreakdowns] = useState({});
  const [isCalculating, setIsCalculating] = useState(true);
  const calculationRef = useRef({ dishId: null, ingredientIndex: null });

  const priceUnitLabel = priceUnit === 'per1kg' ? 'per kg' : priceUnit === 'per1000kcal' ? 'per 1000kcal' : 'per serving';

  // Вычисляем цены только при открытии слайда или изменении dish/ingredientIndex
  useEffect(() => {
    const currentDishId = dish?.originalDish?.id || dish?.id;
    const currentIngredientIndex = ingredientIndex;

    // Проверяем, нужно ли пересчитывать
    if (!dish?.originalDish || !ingredientIndex) {
      setZonePrices({});
      setZoneBreakdowns({});
      setIsCalculating(false);
      return;
    }

    // Если данные уже вычислены для этого блюда, не пересчитываем
    if (
      calculationRef.current.dishId === currentDishId && 
      calculationRef.current.ingredientIndex === currentIngredientIndex
    ) {
      // Данные уже вычислены, просто убеждаемся, что состояние загрузки снято
      setIsCalculating(prev => prev ? false : prev);
      return;
    }

    // Сбрасываем состояние при изменении блюда
    setZonePrices({});
    setZoneBreakdowns({});
    setIsCalculating(true);
    calculationRef.current = { dishId: currentDishId, ingredientIndex: currentIngredientIndex };

    // Используем setTimeout чтобы отложить вычисления на следующий тик event loop
    // Это позволит UI сначала отрисоваться
    const timeoutId = setTimeout(() => {
      // Проверяем, что компонент еще монтирован и данные не изменились
      if (
        calculationRef.current.dishId !== currentDishId ||
        calculationRef.current.ingredientIndex !== currentIngredientIndex
      ) {
        return; // Данные изменились, прекращаем вычисления
      }

      const prices = {};
      const breakdowns = {};

      // Вычисляем цены для всех 11 зон
      for (const zoneId of Object.keys(ECONOMIC_ZONES)) {
        const result = calculateDishCost(dish.originalDish, zoneId, ingredientIndex);
        if (result.unavailableIngredients?.length > 0) {
          prices[zoneId] = null;
          breakdowns[zoneId] = null;
        } else {
          prices[zoneId] = result.totalCost;
          breakdowns[zoneId] = result.breakdown;
        }
      }

      // Проверяем еще раз перед обновлением состояния
      if (
        calculationRef.current.dishId === currentDishId &&
        calculationRef.current.ingredientIndex === currentIngredientIndex
      ) {
        setZonePrices(prices);
        setZoneBreakdowns(breakdowns);
        setIsCalculating(false);
      }
    }, 0);

    // Cleanup: отменяем таймаут при изменении зависимостей
    // Данные автоматически сбрасываются при размонтировании компонента
    return () => {
      clearTimeout(timeoutId);
      // При размонтировании компонента (выход из слайда) все состояния теряются
      // При следующем открытии слайда данные будут вычислены заново
      calculationRef.current = { dishId: null, ingredientIndex: null };
    };
  }, [dish?.originalDish, dish?.id, ingredientIndex]);

  const available = Object.values(zonePrices).filter(p => p !== null && p > 0);
  const { minPrice, maxPrice, avgPrice } = available.length === 0 
    ? { minPrice: 0, maxPrice: 0, avgPrice: 0 }
    : {
        minPrice: Math.min(...available),
        maxPrice: Math.max(...available),
        avgPrice: available.reduce((a, b) => a + b, 0) / available.length,
      };

  const priceSpread = maxPrice > 0 && minPrice > 0 ? (((maxPrice - minPrice) / minPrice) * 100).toFixed(0) : 0;

  const getZoneFill = (zoneId) => {
    if (isCalculating || zonePrices[zoneId] === undefined) {
      return 'rgba(148, 163, 184, 0.3)'; // Серый цвет для загрузки
    }
    return getPriceColor(zonePrices[zoneId], minPrice, maxPrice).fill;
  };
  
  const getZoneOpacity = (zoneId, sel, hov) => (hov || sel === zoneId) ? 1 : 0.85;
  const getZoneStroke = (zoneId, hov, sel) => (hov || sel) ? 'rgba(255,255,255,0.6)' : 'rgba(255,255,255,0.15)';
  const getZoneStrokeWidth = (zoneId, hov, sel) => (hov || sel) ? 1.5 : 0.5;
  
  const getTooltipContent = (zoneId, zoneData) => {
    const price = isCalculating ? undefined : zonePrices[zoneId];
    return {
      ...zoneData,
      price,
      priceColor: price === null || price === undefined 
        ? 'text-surface-500' 
        : getPriceColor(price, minPrice, maxPrice).text,
    };
  };

  const activeZone = selectedZone || hoveredZone;
  const currentZone = activeZone ? ECONOMIC_ZONES[activeZone] : null;
  const currentPrice = activeZone ? zonePrices[activeZone] : null;
  const currentBreakdown = activeZone ? zoneBreakdowns[activeZone] : null;

  const sortedBreakdown = currentBreakdown 
    ? [...currentBreakdown].filter(i => i.cost > 0).sort((a, b) => b.cost - a.cost)
    : [];

  const totalCost = sortedBreakdown.reduce((s, i) => s + i.cost, 0);

  return (
    <div className="space-y-2">
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-2">
          <MapIcon size={14} className="text-food-500" />
          <span className="text-sm font-semibold text-surface-700 dark:text-surface-200">
            {dish?.name} Price Index
          </span>
        </div>
        {priceSpread > 0 && (
          <span className="px-1.5 py-0.5 rounded text-[10px] font-bold bg-amber-500/15 text-amber-600 dark:text-amber-400">
            {priceSpread}% spread
          </span>
        )}
      </div>

      <p className="text-[10px] text-surface-500">Prices shown {priceUnitLabel}</p>

      {isCalculating && Object.keys(zonePrices).length === 0 ? (
        <div className="flex items-center justify-center py-12">
          <div className="flex flex-col items-center gap-3 text-surface-500">
            <Loader2 size={24} className="animate-spin text-food-500" />
            <span className="text-sm">Calculating prices for all zones...</span>
          </div>
        </div>
      ) : (
        <>
          {isMobile ? (
        // Mobile: vertical layout (map on top, data below)
        <>
          <div className="rounded-lg overflow-hidden bg-surface-800/50">
            <EconomicZonesSvgMap
              selectedZone={selectedZone}
              onZoneSelect={(z) => setSelectedZone(selectedZone === z ? null : z)}
              hoveredZone={hoveredZone}
              onHoveredZoneChange={setHoveredZone}
              zoom={1.25}
              className="w-full"
              svgStyle={{ height: '180px' }}
              getZoneFill={getZoneFill}
              getZoneOpacity={getZoneOpacity}
              getZoneStroke={getZoneStroke}
              getZoneStrokeWidth={getZoneStrokeWidth}
              getTooltipContent={getTooltipContent}
              transformOffset="245 25"
              backgroundFill="rgba(15, 23, 42, 0.5)"
              showTooltip={true}
            />
          </div>

          <div className="flex items-center justify-between text-[9px] text-surface-500 px-0.5">
            <span className="flex items-center gap-1"><div className="w-2 h-2 rounded" style={{ background: 'rgb(34, 197, 94)' }} />Cheap</span>
            <div className="flex-1 h-1 mx-2 rounded-full" style={{ background: 'linear-gradient(to right, rgb(34, 197, 94), rgb(250, 204, 21), rgb(249, 115, 22), rgb(239, 68, 68))' }} />
            <span className="flex items-center gap-1">Expensive<div className="w-2 h-2 rounded" style={{ background: 'rgb(239, 68, 68)' }} /></span>
          </div>

          {activeZone && currentZone && currentBreakdown && (
            <div className="bg-surface-100/80 dark:bg-surface-800/80 rounded-lg p-2.5">
              <div className="flex items-center justify-between mb-1.5">
                <div className="flex items-center gap-1.5">
                  <ZoneIcon zoneId={activeZone} size={16} />
                  <span className="text-xs font-semibold text-surface-700 dark:text-surface-200">{currentZone.name}</span>
                </div>
                <div className="flex items-center gap-1.5">
                  <span className={`text-sm font-bold font-mono ${getPriceColor(currentPrice, minPrice, maxPrice).text}`}>
                    ${currentPrice?.toFixed(2) ?? 'N/A'}
                  </span>
                  {selectedZone && <button onClick={() => setSelectedZone(null)} className="p-0.5 rounded text-surface-400 hover:text-surface-600"><X size={12} /></button>}
                </div>
              </div>
              <div className="space-y-0.5">
                {sortedBreakdown.slice(0, 5).map((item) => (
                  <div key={item.name} className="flex items-center gap-1.5 text-[11px]">
                    <span className="flex-1 truncate text-surface-600 dark:text-surface-300">{item.name}</span>
                    <span className="text-surface-500 font-mono">{totalCost > 0 ? ((item.cost / totalCost) * 100).toFixed(0) : 0}%</span>
                    <span className="font-bold font-mono text-surface-700 dark:text-surface-200 w-10 text-right">${item.cost.toFixed(2)}</span>
                  </div>
                ))}
              </div>
            </div>
          )}

          <p className="text-[9px] text-surface-500 text-center">Tap a region to see ingredient breakdown</p>
        </>
      ) : (
        // Desktop: horizontal layout (map on left, data on right)
        <div className="flex gap-4">
          <div className="flex-shrink-0 w-[55%] space-y-2">
            <div className="rounded-lg overflow-hidden bg-surface-800/50">
              <EconomicZonesSvgMap
                selectedZone={selectedZone}
                onZoneSelect={(z) => setSelectedZone(selectedZone === z ? null : z)}
                hoveredZone={hoveredZone}
                onHoveredZoneChange={setHoveredZone}
                zoom={1.25}
                className="w-full"
                svgStyle={{ height: '220px' }}
                getZoneFill={getZoneFill}
                getZoneOpacity={getZoneOpacity}
                getZoneStroke={getZoneStroke}
                getZoneStrokeWidth={getZoneStrokeWidth}
                getTooltipContent={getTooltipContent}
                transformOffset="245 25"
                backgroundFill="rgba(15, 23, 42, 0.5)"
                showTooltip={true}
              />
            </div>

            <div className="flex items-center justify-between text-[9px] text-surface-500 px-0.5">
              <span className="flex items-center gap-1"><div className="w-2 h-2 rounded" style={{ background: 'rgb(34, 197, 94)' }} />Cheap</span>
              <div className="flex-1 h-1 mx-2 rounded-full" style={{ background: 'linear-gradient(to right, rgb(34, 197, 94), rgb(250, 204, 21), rgb(249, 115, 22), rgb(239, 68, 68))' }} />
              <span className="flex items-center gap-1">Expensive<div className="w-2 h-2 rounded" style={{ background: 'rgb(239, 68, 68)' }} /></span>
            </div>

            <p className="text-[9px] text-surface-500 text-center">Click a region to see ingredient breakdown</p>
          </div>

          <div className="flex-1 min-w-0 h-[220px] flex flex-col">
            {activeZone && currentZone && currentBreakdown && (
              <div className="bg-surface-100/80 dark:bg-surface-800/80 rounded-lg p-2.5 h-full flex flex-col">
                <div className="flex items-center justify-between mb-1.5 flex-shrink-0">
                  <div className="flex items-center gap-1.5">
                    <ZoneIcon zoneId={activeZone} size={16} />
                    <span className="text-xs font-semibold text-surface-700 dark:text-surface-200">{currentZone.name}</span>
                  </div>
                  <div className="flex items-center gap-1.5">
                    <span className={`text-sm font-bold font-mono ${getPriceColor(currentPrice, minPrice, maxPrice).text}`}>
                      ${currentPrice?.toFixed(2) ?? 'N/A'}
                    </span>
                    {selectedZone && <button onClick={() => setSelectedZone(null)} className="p-0.5 rounded text-surface-400 hover:text-surface-600"><X size={12} /></button>}
                  </div>
                </div>
                <div className="space-y-0.5 flex-1 overflow-y-auto">
                  {sortedBreakdown.slice(0, 5).map((item) => (
                    <div key={item.name} className="flex items-center gap-1.5 text-[11px]">
                      <span className="flex-1 truncate text-surface-600 dark:text-surface-300">{item.name}</span>
                      <span className="text-surface-500 font-mono">{totalCost > 0 ? ((item.cost / totalCost) * 100).toFixed(0) : 0}%</span>
                      <span className="font-bold font-mono text-surface-700 dark:text-surface-200 w-10 text-right">${item.cost.toFixed(2)}</span>
                    </div>
                  ))}
                </div>
              </div>
            )}
          </div>
        </div>
        )}
        </>
      )}
    </div>
  );
}

