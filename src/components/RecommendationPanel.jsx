import React, { useState } from 'react';

const getDeltaColor = (delta) => {
  if (delta >= 3) return 'text-green-400 font-semibold';
  if (delta >= 1) return 'text-green-300';
  if (delta > -1) return 'text-gray-300';
  return 'text-red-400';
};

export default function RecommendationPanel({
  targetSlot,
  recommendations,
  baselineWinProbability,
  onSelectChampion,
}) {
  const [hoveredDelta, setHoveredDelta] = useState(null);

  if (!targetSlot || !recommendations || recommendations.length === 0) {
    return null;
  }

  const safeBaseline =
    typeof baselineWinProbability === "number"
      ? baselineWinProbability
      : 0;

  console.log(
    "Panel baseline:",
    baselineWinProbability
  );

  const displayWinProb =
    hoveredDelta !== null
      ? safeBaseline + hoveredDelta
      : safeBaseline;

  const handleRecommendationClick = (recommendation) => {
    if (onSelectChampion) {
      onSelectChampion(recommendation);
    }
  };

  return (
    <div className="absolute inset-0 flex items-center justify-center z-50 pointer-events-none">
      <div className="bg-[#1F2A3A] rounded-lg shadow-xl border border-blue-400/30 p-4 w-full max-w-md min-w-[340px] pointer-events-auto animate-in fade-in scale-95 duration-200">
        {/* Header */}
        <div className="mb-3 md:mb-4 pb-2 md:pb-3 border-b border-border/30">
          <h3 className="text-xs md:text-sm font-semibold text-blue-300 mb-1 md:mb-2">
            AI Recommendations
          </h3>
          <p className="text-xs text-text-gray">
            for <span className="text-white font-medium">{targetSlot.team} {targetSlot.role}</span>
          </p>
        </div>

        {/* Win Probability Display */}
        <div className="mb-4 p-3 rounded-lg bg-blue-400/5 border border-blue-400/20">
          <div className="text-xs text-text-gray mb-1">Current Win Rate</div>
          <div className="flex items-baseline gap-2">
            <span className="text-lg font-bold text-blue-300">
              {displayWinProb.toFixed(1)}%
            </span>
            {hoveredDelta !== null && (
              <span className={`text-xs font-semibold ${
                hoveredDelta > 0 ? 'text-green-400' : hoveredDelta < 0 ? 'text-red-400' : 'text-gray-400'
              }`}>
                {hoveredDelta > 0 ? '+' : ''}{hoveredDelta.toFixed(1)}%
              </span>
            )}
          </div>
        </div>

        {/* Recommendation Cards with Icons */}
        <div className="flex flex-col gap-2">
          {recommendations.map((rec) => (
            <div
              key={rec.name}
              onMouseEnter={() => setHoveredDelta(Number(rec.delta))}
              onMouseLeave={() => setHoveredDelta(null)}
            >
              <button
                type="button"
                onClick={() => handleRecommendationClick(rec)}
                className="w-full flex items-start gap-3 p-3 rounded-lg border border-border/40 bg-card-bg hover:bg-card-bg/80 hover:border-blue-400/60 hover:scale-[1.02] transition-all duration-200 cursor-pointer text-left"
              >
                {/* Champion Icon - Left Column */}
                <div className="flex-shrink-0">
                  <img
                    src={rec.image ?? `/champion/${rec.name.toLowerCase()}.png`}
                    alt={rec.name}
                    className="w-8 h-8 rounded-md border border-amber-400/30 shadow-md object-cover hover:ring-1 hover:ring-amber-400/40 transition-all"
                    onError={(e) => {
                      e.target.src = 'data:image/svg+xml,%3Csvg xmlns=%22http://www.w3.org/2000/svg%22 width=%2232%22 height=%2232%22 viewBox=%220 0 32 32%22%3E%3Crect fill=%22%231E293B%22 width=%2232%22 height=%2232%22/%3E%3C/svg%3E';
                    }}
                  />
                </div>

                {/* Content - Middle Column */}
                <div className="flex-1 min-w-0">
                  {/* Name */}
                  <div className="text-white font-semibold text-sm truncate">
                    {rec.name}
                  </div>

                  {/* Tags */}
                  {rec.tags && rec.tags.length > 0 && (
                    <div className="flex gap-1 mt-1">
                      {rec.tags.slice(0, 2).map((tag, idx) => (
                        <span
                          key={idx}
                          className="text-[10px] px-1.5 py-0.5 rounded bg-blue-400/10 text-blue-300 whitespace-nowrap"
                        >
                          {tag}
                        </span>
                      ))}
                    </div>
                  )}
                </div>

                {/* Win % and Delta - Right Column */}
                <div className="flex flex-col items-end flex-shrink-0 gap-0.5">
                  <span className="text-xs font-semibold text-blue-300 whitespace-nowrap">
                    {rec.winRate.toFixed(1)}%
                  </span>
                  <span className={`text-xs font-semibold whitespace-nowrap ${getDeltaColor(rec.delta)}`}>
                    {rec.delta > 0 ? '+' : ''}{rec.delta.toFixed(1)}%
                  </span>
                </div>
              </button>
            </div>
          ))}
        </div>

        {/* Footer Help Text */}
        <div className="mt-4 pt-3 border-t border-border/30 text-center">
          <p className="text-xs text-text-gray/60">
            Click to select a champion
          </p>
        </div>
      </div>
    </div>
  );
}
