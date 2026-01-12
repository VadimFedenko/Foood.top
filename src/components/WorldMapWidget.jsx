import EconomicZonesSvgMap from './EconomicZonesSvgMap';

/**
 * Ultra-light map widget (pure SVG)
 * - 11 clickable zones
 * - No country geometry in runtime
 */
export default function WorldMapWidget({ selectedZone, onZoneSelect, variant = 'wide' }) {
  const zoom = variant === 'square' ? 1.5 : 1.3;

  return (
    <div className="relative w-full h-full min-h-[150px] rounded-lg overflow-hidden">
      <EconomicZonesSvgMap
        selectedZone={selectedZone}
        onZoneSelect={onZoneSelect}
        zoom={zoom}
        className="w-full h-full"
        ariaLabel="Economic zones"
        showTooltip={true}
        containerClassName="w-full h-full"
      />
    </div>
  );
}
