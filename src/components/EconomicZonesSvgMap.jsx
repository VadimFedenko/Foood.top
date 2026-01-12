import { useState } from 'react';
import { ECONOMIC_ZONES } from '../lib/RankingEngine';
import { useSvgMap } from '../lib/useSvgMap';
import { centeredScaleTransform } from '../lib/svgMapUtils';
import ZoneIcon from './ZoneIcon';

function getZoneFillDefault(zoneId, selectedZone, isHovered) {
  // On hover - show lighter zone color
  if (isHovered) {
    const baseColor = ECONOMIC_ZONES[zoneId]?.color || '#6b7280';
    // Lighten the color by adding white
    return lightenColor(baseColor, 0.4);
  }
  // If zone is selected - show its color, otherwise gray
  if (selectedZone && selectedZone === zoneId) {
    return ECONOMIC_ZONES[zoneId]?.color || '#6b7280';
  }
  return '#6b7280'; // Gray for all unselected zones
}

// Function to lighten a color
function lightenColor(hex, amount) {
  // Remove # if present
  hex = hex.replace('#', '');
  // Convert to RGB
  const r = parseInt(hex.substring(0, 2), 16);
  const g = parseInt(hex.substring(2, 4), 16);
  const b = parseInt(hex.substring(4, 6), 16);
  // Lighten by mixing with white
  const newR = Math.round(r + (255 - r) * amount);
  const newG = Math.round(g + (255 - g) * amount);
  const newB = Math.round(b + (255 - b) * amount);
  // Return in hex format
  return `#${newR.toString(16).padStart(2, '0')}${newG.toString(16).padStart(2, '0')}${newB.toString(16).padStart(2, '0')}`;
}

function getZoneOpacityDefault(zoneId, selectedZone) {
  if (!selectedZone) return 1;
  return selectedZone === zoneId ? 1 : 0.25;
}

/**
 * Ultra-light economic zones map:
 * - Pure SVG, 11 <path> elements (one per zone)
 * - No country borders, no topojson in runtime
 * - Supports custom coloring, tooltips, and zone selection
 */
export default function EconomicZonesSvgMap({
  selectedZone,
  onZoneSelect,
  hoveredZone: externalHoveredZone,
  onHoveredZoneChange,
  zoom = 1.25,
  className = '',
  ariaLabel = 'Economic zones map',
  // Custom styling functions
  getZoneFill,
  getZoneOpacity,
  getZoneStroke,
  getZoneStrokeWidth,
  // Tooltip customization
  showTooltip = true,
  getTooltipContent,
  // Transform offset
  transformOffset = '245 25',
  // Background customization
  backgroundFill = 'rgba(15, 23, 42, 0.35)',
  // Container props for tooltip positioning
  containerClassName = '',
  svgStyle = {},
}) {
  const { viewBox, paths, isLoading } = useSvgMap();
  const zoneEntries = Object.entries(ECONOMIC_ZONES);
  const [internalHoveredZone, setInternalHoveredZone] = useState(null);
  
  // Use external hoveredZone if provided, otherwise use internal state
  const hoveredZone = externalHoveredZone !== undefined ? externalHoveredZone : internalHoveredZone;
  
  const handleMouseEnter = (zoneId) => {
    if (externalHoveredZone === undefined) {
      setInternalHoveredZone(zoneId);
    }
    onHoveredZoneChange?.(zoneId);
  };
  
  const handleMouseLeave = () => {
    if (externalHoveredZone === undefined) {
      setInternalHoveredZone(null);
    }
    onHoveredZoneChange?.(null);
  };

  // Get hovered zone data for tooltip
  const hoveredZoneData = hoveredZone ? ECONOMIC_ZONES[hoveredZone] : null;
  const tooltipContent = hoveredZoneData && getTooltipContent 
    ? getTooltipContent(hoveredZone, hoveredZoneData)
    : hoveredZoneData;

  if (isLoading) {
    return (
      <div className={className} style={{ width: '100%', height: '100%', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
        <div className="text-surface-400">Loading map...</div>
      </div>
    );
  }

  return (
    <div className={`relative ${containerClassName}`} style={{ width: '100%', height: '100%' }}>
      <svg
        viewBox={viewBox}
        role="img"
        aria-label={ariaLabel}
        className={className}
        style={{ width: '100%', height: '100%', display: 'block', ...svgStyle }}
        preserveAspectRatio="xMidYMid meet"
      >
        {/* Zones */}
        <g transform={`${centeredScaleTransform(viewBox, zoom)} translate(${transformOffset})`}>
          {zoneEntries.map(([zoneId]) => {
            const d = paths?.[zoneId];
            if (!d) return null;

            const isHovered = hoveredZone === zoneId;
            const isSelected = selectedZone === zoneId;
            const isActive = isHovered || isSelected;

            // Use custom functions or defaults
            const fill = getZoneFill ? getZoneFill(zoneId, isHovered, isSelected) : getZoneFillDefault(zoneId, selectedZone, isHovered);
            const opacity = getZoneOpacity 
              ? getZoneOpacity(zoneId, selectedZone, isHovered)
              : getZoneOpacityDefault(zoneId, selectedZone);
            const stroke = getZoneStroke 
              ? getZoneStroke(zoneId, isHovered, isSelected)
              : (isActive ? 'rgba(255,255,255,0.42)' : 'rgba(255,255,255,0)');
            const strokeWidth = getZoneStrokeWidth
              ? getZoneStrokeWidth(zoneId, isHovered, isSelected)
              : (isActive ? 1.1 : 0);

            return (
              <path
                key={zoneId}
                d={d}
                fill={fill}
                opacity={opacity}
                stroke={stroke}
                strokeWidth={strokeWidth}
                vectorEffect="non-scaling-stroke"
                style={{
                  cursor: onZoneSelect ? 'pointer' : 'default',
                  transition: 'opacity 140ms ease, filter 140ms ease, stroke 140ms ease, fill 140ms ease',
                  filter: isActive ? 'brightness(1.2) drop-shadow(0 2px 10px rgba(0,0,0,0.25))' : 'none',
                }}
                onMouseEnter={() => handleMouseEnter(zoneId)}
                onMouseLeave={handleMouseLeave}
                onClick={() => onZoneSelect?.(zoneId)}
              />
            );
          })}
        </g>
      </svg>
      
      {/* Hover tooltip */}
      {showTooltip && tooltipContent && (
        <div className="absolute top-1.5 left-1.5 bg-surface-800 rounded-md px-2 py-1.5 border border-surface-600/50 shadow-lg z-10">
          <div className="flex items-center gap-1.5">
            <ZoneIcon zoneId={hoveredZone} size={14} className="text-surface-100" />
            <span className="text-xs font-medium text-surface-100">{tooltipContent.name}</span>
          </div>
          {tooltipContent.price !== undefined && (
            <div className={`text-sm font-bold mt-0.5 ${
              tooltipContent.price === null 
                ? 'text-surface-500' 
                : tooltipContent.priceColor || 'text-surface-200'
            }`}>
              {tooltipContent.price === null ? 'Unavailable' : `$${tooltipContent.price.toFixed(2)}`}
            </div>
          )}
        </div>
      )}
    </div>
  );
}


