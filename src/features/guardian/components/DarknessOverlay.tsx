/**
 * DarknessOverlay — purple fog + floating particles over the Dashboard hero,
 * with intensity driven by the darkness level (0-100). Pure CSS layers; the
 * desaturation filter on the hero itself is applied by the parent (Dashboard)
 * so the Three.js scene stays untouched.
 */

interface DarknessOverlayProps {
  darkness: number;
}

const MAX_PARTICLES = 8;

/** Deterministic particle placement/animation per index (no re-render jitter). */
function particleStyle(index: number, darkness: number): React.CSSProperties {
  return {
    left: `${(index * 37 + 13) % 90 + 5}%`,
    bottom: `${(index * 23 + 10) % 40 + 8}%`,
    opacity: 0.25 + 0.5 * (darkness / 100),
    animation: `guardian-float ${6 + (index % 4)}s ease-in-out ${index * 0.9}s infinite`,
  };
}

export function DarknessOverlay({ darkness }: DarknessOverlayProps): JSX.Element | null {
  if (darkness <= 0) return null;

  const intensity = darkness / 100;
  const particles = Math.min(Math.round(darkness / 12), MAX_PARTICLES);

  return (
    <div className="absolute inset-0 pointer-events-none" aria-hidden="true">
      {/* Purple fog rising from the ground */}
      <div
        className="absolute inset-0 transition-opacity duration-700"
        style={{
          background: `linear-gradient(to top, hsl(270 60% 25% / ${0.55 * intensity}), transparent 60%), radial-gradient(80% 60% at 50% 80%, hsl(280 70% 35% / ${0.4 * intensity}), transparent)`,
        }}
      />
      {/* Floating darkness motes */}
      {Array.from({ length: particles }, (_, i) => (
        <span
          key={i}
          className="guardian-particle absolute w-2 h-2 rounded-full bg-purple-400/40 blur-[2px]"
          style={particleStyle(i, darkness)}
        />
      ))}
    </div>
  );
}
