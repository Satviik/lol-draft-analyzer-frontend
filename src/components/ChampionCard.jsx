import React from 'react';
import { useDraggable } from '@dnd-kit/core';
import { getChampionImageUrl } from '../data/champions';

export default function ChampionCard({ champion, onClick, isAssigned, isRecommendationOpen = false }) {
  const { attributes, listeners, setNodeRef, transform, isDragging } = useDraggable({
    id: `champion-${champion.name}`,
    data: { type: 'champion', champion },
    disabled: isRecommendationOpen, // Disable drag when recommendation panel is open
  });

  const imageUrl = champion.image || getChampionImageUrl(champion.name);

  const style = {
    transform: transform ? `translate3d(${transform.x}px, ${transform.y}px, 0)` : 'translate3d(0, 0, 0)',
    opacity: isDragging ? 0.5 : 1,
    willChange: isDragging ? 'transform' : 'auto',
  };

  const handleClick = () => {
    // Grid clicks should never do anything
    // Recommendation panel has its own handler
    // This prevents auto-fill of locked slots from grid
    return;
  };

  return (
    <button
      ref={setNodeRef}
      type="button"
      onClick={handleClick}
      {...listeners}
      {...attributes}
      style={style}
      className={`flex flex-col justify-center items-center gap-1 p-1 w-24 h-[120px] rounded-champ border bg-card-bg font-inter transition-all hover:border-opacity-80 cursor-grab active:cursor-grabbing touch-none ${
        isDragging ? 'opacity-50 scale-105 shadow-lg' : ''
      } ${isRecommendationOpen ? 'border-blue-400 border-2 shadow-blue-glow' : 'border-[rgba(51,65,85,0.4)]'} ${
        isAssigned ? 'opacity-60' : ''
      } ${isRecommendationOpen && !isAssigned ? 'hover:scale-105 hover:shadow-lg' : ''}`}
    >
      <div className="rounded-champ-img overflow-hidden w-16 h-16 shrink-0 bg-bg-medium flex items-center justify-center">
        <img
          src={imageUrl}
          alt={champion.name}
          className="w-full h-full object-cover"
          onError={(e) => {
            e.target.onerror = null;
            e.target.src = 'data:image/svg+xml,<svg xmlns="http://www.w3.org/2000/svg" width="64" height="64" viewBox="0 0 64 64"><rect fill="%231E293B" width="64" height="64"/><text x="50%" y="50%" dominant-baseline="middle" text-anchor="middle" fill="%2394A3B8" font-size="10">?</text></svg>';
          }}
        />
      </div>
      <span className="font-normal text-[15px] leading-tight text-text-gray text-center truncate w-full line-clamp-2">
        {champion.name}
      </span>
    </button>
  );
}
