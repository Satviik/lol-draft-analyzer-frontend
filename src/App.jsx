import React, { useMemo, useState, useEffect } from 'react';
import { fetchRecommendations as fetchRecommendationsAPI } from './api/recommendationApi';
import {
  DndContext,
  DragOverlay,
  closestCenter,
  useSensors,
  useSensor,
  PointerSensor,
} from '@dnd-kit/core';
import TeamCard from './components/TeamCard';
import SearchBar from './components/SearchBar';
import ChampionCard from './components/ChampionCard';
import RecommendationPanel from './components/RecommendationPanel';
import RoleFilter from './components/RoleFilter';
import { getChampions, normalizeChampionName, getDisplayNameFromDataDragonId } from './data/champions';
import championRoles from './data/champion_roles.json';

const INITIAL_SLOTS = {
  'blue-top': null,
  'blue-jungle': null,
  'blue-mid': null,
  'blue-adc': null,
  'blue-support': null,
  'red-top': null,
  'red-jungle': null,
  'red-mid': null,
  'red-adc': null,
  'red-support': null,
};

export default function App() {
  const allChampions = useMemo(() => getChampions(), []);
  const [search, setSearch] = useState('');
  const [activeRole, setActiveRole] = useState(null);
  const [assignedSlots, setAssignedSlots] = useState(INITIAL_SLOTS);
  const [activeId, setActiveId] = useState(null);
  const [draggedChampion, setDraggedChampion] = useState(null);

  // New state structure: locked role vs recommendation panel
  const [lockedRole, setLockedRole] = useState(null); // { team, role }
  const [isRecommendationOpen, setIsRecommendationOpen] = useState(false);
  const [recommendations, setRecommendations] = useState([]);
  const [baselineWinProbability, setBaselineWinProbability] = useState(0);

  // Configure sensors for better drag performance
  const sensors = useSensors(
    useSensor(PointerSensor, {
      activationConstraint: {
        distance: 8,
      },
    })
  );

  const filteredChampions = useMemo(() => {
    let filtered = allChampions;

    // Apply search filter
    if (search.trim()) {
      const q = search.trim().toLowerCase();
      filtered = filtered.filter((c) => c.name.toLowerCase().includes(q));
    }

    // Apply role filter
    if (activeRole) {
      filtered = filtered.filter((champion) => {
        const normalizedName = normalizeChampionName(champion.name);
        const champRoles = championRoles[normalizedName] || [];
        return champRoles.includes(activeRole);
      });
    }

    return filtered;
  }, [allChampions, search, activeRole]);

  const countFilledSlots = () => {
    return Object.values(assignedSlots).filter((champ) => champ !== null).length;
  };

  const filledSlots = useMemo(() => {

  return Object.values(assignedSlots)
    .filter(champ => champ !== null).length;

}, [assignedSlots]);
const canRecommend = useMemo(() => {

  if (!lockedRole) return false;

  return filledSlots === 9;

}, [lockedRole, filledSlots]);





  /**
   * Handle champion click from grid
   * Grid clicks should NEVER fill locked slots
   * Only recommendation panel fills are allowed for locked slots
   */
  const handleChampionClick = (champion) => {
    // Ignore all grid clicks when recommendation panel is open
    // The recommendation panel has its own handler
    if (isRecommendationOpen) {
      return;
    }

    // Normal grid champion clicks do nothing
    // No auto-fill behavior
    return;
  };

  /**
   * Lock or unlock a role for recommendations
   */
  const handleLockRole = (team, role) => {
    setLockedRole((prev) =>
      prev?.team === team && prev?.role === role ? null : { team, role }
    );
  };

  /**
   * Fill the currently locked slot with a champion
   */
  const fillLockedSlot = (champion) => {
    if (!lockedRole) return;

    const newAssignedSlots = { ...assignedSlots };
    
    // Remove champion from any existing slot
    Object.keys(newAssignedSlots).forEach((key) => {
      if (newAssignedSlots[key]?.name === champion.name) {
        newAssignedSlots[key] = null;
      }
    });

    // Assign to locked slot
    const slotKey = `${lockedRole.team}-${lockedRole.role.toLowerCase()}`;
    newAssignedSlots[slotKey] = champion;
    setAssignedSlots(newAssignedSlots);
  };

  /**
   * Close recommendation panel and unlock role
   */
  const closeRecommendationPanel = () => {
    setLockedRole(null);
    setIsRecommendationOpen(false);
    setRecommendations([]);
    setBaselineWinProbability(0);
  };
  const handleRecommend = async () => {
    if (!lockedRole) return;
    if (filledSlots !== 9) return;

    try {
      const blueTeam = [];
      const redTeam = [];

      // STEP 1: Normalize display names to canonical format BEFORE sending to backend
      Object.entries(assignedSlots).forEach(([slot, champ]) => {
        if (!champ) return;
        const canonicalName = normalizeChampionName(champ.name);
        if (slot.startsWith("blue")) blueTeam.push(canonicalName);
        if (slot.startsWith("red")) redTeam.push(canonicalName);
      });

      // Call API with canonical champion names
      const response = await fetchRecommendationsAPI({
        blueTeam,
        redTeam,
        role: lockedRole.role,
        side: lockedRole.team
      });

      console.log("Backend Raw Response", response);

      if (!response || !response.recommendations || response.recommendations.length === 0) {
        console.warn('No recommendations in response');
        return;
      }

      // STEP 2: Map backend response - convert DataDragon IDs back to display names
      const enriched = response.recommendations.map(r => {
        // Backend returns DataDragon ID like "Chogath"
        // Convert back to display name like "Cho'Gath"
        const displayName = getDisplayNameFromDataDragonId(r.champion);
        const champ = allChampions.find(c => c.name === displayName);
        
        console.log(`Enriching recommendation for ${r.champion} -> ${displayName}:`, {
          backendChampion: r.champion,
          displayName: displayName,
          new_win_prob: r.new_win_prob,
          delta: r.delta
        });
        return {
          name: displayName,
          winRate: Number(r.new_win_prob) * 100,
          delta: Number(r.delta) * 100,
          image: champ?.image ?? `/champion/${r.champion.toLowerCase()}.png`,
          tags: champ?.tags ?? []
        };
      });

      setRecommendations(enriched);
      setBaselineWinProbability(Number(response.baseline_win_probability) * 100);
      setIsRecommendationOpen(true);
    } catch (e) {
      console.error("Recommendation failed", e);
      alert('Error loading recommendations: ' + (e.message || 'Unknown error'));
    }
  };

  const handleToggleRole = (role) => {
    // Click same role again removes filter
    setActiveRole((prev) => (prev === role ? null : role));
  };

  const handleReset = () => {
    setAssignedSlots(INITIAL_SLOTS);
    setLockedRole(null);
    setIsRecommendationOpen(false);
    setRecommendations([]);
    setBaselineWinProbability(0);
    setSearch('');
    setActiveRole(null);
  };

  const clearSlot = (slotId) => {
    const newAssignedSlots = { ...assignedSlots };
    newAssignedSlots[slotId] = null;
    setAssignedSlots(newAssignedSlots);
  };

  /**
   * Handle selecting a recommendation
   * Only called from RecommendationPanel when user clicks a recommendation
   */
  const handleSelectRecommendation = (recommendation) => {
    if (!lockedRole) return;

    // Find the champion object from allChampions
    const championObj = allChampions.find((c) => c.name === recommendation.name);
    if (!championObj) return;

    // Fill the locked slot
    fillLockedSlot(championObj);
    
    // Close the recommendation panel
    closeRecommendationPanel();
  };

  // Get slot contents from assignedSlots
  const getSlotContents = (team, role) => {
    const slotKey = `${team}-${role.toLowerCase()}`;
    return assignedSlots[slotKey];
  };

  // Find which slot a champion is assigned to
  const getChampionAssignedSlot = (championName) => {
    return Object.entries(assignedSlots).find(([, champ]) => champ?.name === championName)?.[0];
  };

  const handleDragStart = (event) => {
    setActiveId(event.active.id);
    const data = event.active.data.current;

    // Prevent dragging champions when recommendation panel is open
    if (data?.type === 'champion' && isRecommendationOpen) {
      setActiveId(null);
      return;
    }

    if (data?.type === 'champion') {
      setDraggedChampion(data.champion);
    }
  };

  const handleDragEnd = (event) => {
    const { active, over } = event;
    setActiveId(null);
    setDraggedChampion(null);

    if (!over) return;

    const activeData = active.data.current;
    const overData = over.data.current;

    // Validate drop target
    if (!overData || overData.type !== 'slot') {
      return;
    }

    // Only handle champion to slot drops
    if (activeData?.type === 'champion' && overData?.type === 'slot') {
      const champion = activeData.champion;
      const targetSlotId = overData.slotId;

      // If a role is locked, prevent dropping into that slot 
      // (must use recommendation panel instead)
      if (lockedRole) {
        const isLockedSlot = 
          overData.team === lockedRole.team && 
          overData.role === lockedRole.role;
        
        if (isLockedSlot) {
          return; // Block drops into locked slot - use recommendation panel
        }
      }

      // Remove champion from any existing slot
      const newAssignedSlots = { ...assignedSlots };
      Object.keys(newAssignedSlots).forEach((key) => {
        if (newAssignedSlots[key]?.name === champion.name) {
          newAssignedSlots[key] = null;
        }
      });

      // Assign to new slot
      newAssignedSlots[targetSlotId] = champion;
      setAssignedSlots(newAssignedSlots);
    }
  };

  return (
    <>
      <style>{`
        .hide-scrollbar::-webkit-scrollbar {
          display: none;
        }
        .hide-scrollbar {
          scrollbar-width: none;
        }
      `}</style>
      <DndContext
        sensors={sensors}
        collisionDetection={closestCenter}
        onDragStart={handleDragStart}
        onDragEnd={handleDragEnd}
      >
        <div className="min-h-screen bg-bg-dark flex flex-col py-4 sm:py-6 px-4 sm:px-6 gap-4 w-full">
          <header className="shrink-0 w-full flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 px-4 sm:px-5 py-4 rounded-card border border-border bg-bg-medium">
            <div className="flex flex-col gap-0.5">
              <h1 className="font-bold text-xl sm:text-3xl text-gold font-inter tracking-tight">
                League Draft Analyzer
              </h1>
              <p className="text-white/90 text-xs sm:text-sm font-inter">
                Drag & drop champions to analyze team compositions
              </p>
              <p className="text-text-gray text-xs mt-0.5 font-inter">
                by Satvik
              </p>
            </div>
            <div className="flex gap-2 items-center w-full sm:w-auto">
              <button
                type="button"
                onClick={handleRecommend}
                disabled={!canRecommend}
                className="shrink-0 flex items-center justify-center gap-2 px-4 py-2.5 rounded-xl bg-white text-[#1E293B] font-semibold text-sm font-inter hover:bg-gray-100 transition-colors w-full sm:w-auto disabled:bg-gray-300 disabled:text-gray-500 disabled:cursor-not-allowed disabled:hover:bg-gray-300"
              >
                Recommend
              </button>
              <button
                type="button"
                onClick={handleReset}
                className="shrink-0 flex items-center justify-center gap-1 sm:gap-2 px-2 sm:px-4 py-1.5 sm:py-2.5 rounded-lg sm:rounded-xl bg-white text-[#1E293B] font-semibold text-xs sm:text-sm font-inter hover:bg-gray-100 transition-colors w-full sm:w-auto"
              >
                <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                  <path d="M3 12a9 9 0 1 0 9-9 9.75 9.75 0 0 0-6.74 2.74L3 8" />
                  <path d="M3 3v5h5" />
                </svg>
                Reset
              </button>
            </div>
          </header>
          <main className="flex flex-col lg:flex-row lg:items-stretch gap-4 lg:gap-2 p-2 w-full flex-1 min-h-0 min-w-0">
            {/* Left: scroll container (no padding) → inner wrapper (padding) */}
            <div className="min-h-0 min-w-0 overflow-y-auto overflow-x-hidden lg:flex-none lg:w-[389px] lg:max-h-[calc(100vh-10rem)] hide-scrollbar [scrollbar-gutter:stable]">
              <div className="p-2">
                <TeamCard
                  side="blue"
                  assignedSlots={assignedSlots}
                  lockedRole={lockedRole}
                  onLockRole={(role) => handleLockRole('blue', role)}
                  onClearSlot={clearSlot}
                />
              </div>
            </div>

            {/* Middle: single scroll container, fills available flex space */}
            <div className="flex-1 min-w-0 overflow-y-auto overflow-x-hidden max-h-[calc(100vh-10rem)] hide-scrollbar [scrollbar-gutter:stable] relative">
              <div className="px-2 pt-2 pb-2 flex flex-row items-center gap-3 justify-between">
                <div className="shrink-0">
                  <RoleFilter activeRole={activeRole} onToggleRole={handleToggleRole} />
                </div>
                <div className="flex-1 min-w-0">
                  <SearchBar value={search} onChange={setSearch} placeholder="Search Champions..." />
                </div>
              </div>
              <div className="min-w-0 px-2 pb-2 flex flex-row flex-wrap gap-3 sm:gap-4">
                {filteredChampions.map((champ) => {
                  const assignedSlotKey = Object.entries(assignedSlots).find(
                    ([, champion]) => champion?.name === champ.name
                  )?.[0];
                  return (
                    <ChampionCard
                      key={champ.name}
                      champion={champ}
                      isAssigned={!!assignedSlotKey}
                      isRecommendationOpen={isRecommendationOpen}
                      onClick={handleChampionClick}
                    />
                  );
                })}
              </div>
              {/* Floating Recommendation Panel */}
              {isRecommendationOpen && lockedRole && (
                <RecommendationPanel
                  targetSlot={lockedRole}
                  recommendations={recommendations}
                  baselineWinProbability={baselineWinProbability}
                  onSelectChampion={handleSelectRecommendation}
                />
              )}
            </div>

            {/* Right: scroll container (no padding) → inner wrapper (padding) */}
            <div className="min-h-0 min-w-0 overflow-y-auto overflow-x-hidden lg:flex-none lg:w-[389px] lg:max-h-[calc(100vh-10rem)] hide-scrollbar [scrollbar-gutter:stable]">
              <div className="p-2">
                <TeamCard
                  side="red"
                  assignedSlots={assignedSlots}
                  lockedRole={lockedRole}
                  onLockRole={(role) => handleLockRole('red', role)}
                  onClearSlot={clearSlot}
                />
              </div>
            </div>
          </main>
        </div>

        <DragOverlay
          dropAnimation={{
            duration: 200,
            easing: 'cubic-bezier(0.25, 0.46, 0.45, 0.94)',
          }}
          style={{ zIndex: 9999, position: 'fixed' }}
        >
          {draggedChampion && (
            <div
              style={{
                willChange: 'transform',
              }}
              className="flex flex-col justify-center items-center gap-1.5 p-2 w-24 h-[120px] rounded-champ border bg-card-bg font-inter shrink-0 scale-105 shadow-2xl opacity-100 pointer-events-none"
            >
              <div className="rounded-champ-img overflow-hidden w-16 h-16 shrink-0 bg-bg-medium flex items-center justify-center">
                <img
                  src={draggedChampion.image}
                  alt={draggedChampion.name}
                  className="w-full h-full object-cover"
                />
              </div>
              <span className="font-normal text-[15px] leading-tight text-text-gray text-center truncate w-full">
                {draggedChampion.name}
              </span>
            </div>
          )}
        </DragOverlay>
      </DndContext>
    </>
  );
}
