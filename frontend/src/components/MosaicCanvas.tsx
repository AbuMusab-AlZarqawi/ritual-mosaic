"use client";
import React, { useRef, useState, useCallback, useEffect } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { SLOT_COORDS, SLOT_HALF, TOTAL_SLOTS } from "@/lib/slotCoords";

const SVG_SIZE = 1000;
const GREEN = "#06503A";

interface SlotData {
  claimed: boolean;
  ipfsHash: string;
  xHandle: string;
  displayName: string;
  claimer: string;
}

interface MosaicCanvasProps {
  slots: SlotData[];
  onSlotClick: (slotId: number) => void;
  names: string[];
}

function getImageUrl(slot: SlotData): string | null {
  if (!slot.claimed) return null;
  if (slot.xHandle) {
    const handle = slot.xHandle
      .replace(/https?:\/\/(www\.)?(x|twitter)\.com\//i, "")
      .replace(/^@/, "")
      .trim();
    if (handle) return `https://unavatar.io/x/${handle}`;
  }
  if (slot.ipfsHash) return `https://gateway.pinata.cloud/ipfs/${slot.ipfsHash}`;
  return null;
}

export function MosaicCanvas({ slots, onSlotClick, names }: MosaicCanvasProps) {
  const containerRef = useRef<HTMLDivElement>(null);
  const [zoom, setZoom] = useState(1);
  const [pan, setPan] = useState({ x: 0, y: 0 });
  const [isDragging, setIsDragging] = useState(false);
  const [dragStart, setDragStart] = useState({ x: 0, y: 0 });
  const [hoveredSlot, setHoveredSlot] = useState<number | null>(null);
  const [loadedImages, setLoadedImages] = useState<Record<number, string>>({});

  // Preload claimed slot images
  useEffect(() => {
    slots.forEach((slot, idx) => {
      if (slot.claimed && !loadedImages[idx]) {
        const url = getImageUrl(slot);
        if (url) setLoadedImages(prev => ({ ...prev, [idx]: url }));
      }
    });
  }, [slots]);

  const handleWheel = useCallback((e: React.WheelEvent) => {
    e.preventDefault();
    const factor = e.deltaY > 0 ? 0.9 : 1.1;
    setZoom(z => Math.min(Math.max(z * factor, 0.4), 12));
  }, []);

  const handleMouseDown = (e: React.MouseEvent) => {
    setIsDragging(true);
    setDragStart({ x: e.clientX - pan.x, y: e.clientY - pan.y });
  };

  const handleMouseMove = (e: React.MouseEvent) => {
    if (isDragging) setPan({ x: e.clientX - dragStart.x, y: e.clientY - dragStart.y });
  };

  const handleMouseUp = () => setIsDragging(false);
  const resetView = () => { setZoom(1); setPan({ x: 0, y: 0 }); };

  const claimedCount = slots.filter(s => s.claimed).length;

  // Cursive background names
  const nameElements = names.flatMap((name, i) => {
    const colors = ["#0a6b4a","#085c3f","#0d7a55","#094f37","#0f8060","#073d2d","#116644"];
    const count = Math.max(2, Math.ceil(950 / (name.length * 10 + 20)));
    return Array.from({ length: count }, (_, j) => ({
      key: `${i}-${j}`,
      x: (j * (name.length * 10 + 25) + i * 17) % 1020 - 20,
      y: 45 + ((i * 57 + j * 11) % 910),
      color: colors[(i + j) % colors.length],
      name,
      opacity: 0.25 + (i % 5) * 0.07,
      fontSize: 12 + (i % 4) * 3,
      rotate: -10 + (i % 7) * 3,
    }));
  });

  return (
    <div
      ref={containerRef}
      className="relative w-full h-full overflow-hidden select-none"
      style={{ background: GREEN, cursor: isDragging ? "grabbing" : "grab" }}
      onWheel={handleWheel}
      onMouseDown={handleMouseDown}
      onMouseMove={handleMouseMove}
      onMouseUp={handleMouseUp}
      onMouseLeave={handleMouseUp}
    >
      {/* Stats — top left */}
      <div className="absolute top-4 left-4 z-20 bg-black/30 backdrop-blur-sm rounded-xl px-4 py-3 border border-white/10">
        <p className="text-white/50 text-xs font-mono uppercase tracking-widest">Claimed</p>
        <p className="text-white font-bold text-2xl leading-none mt-0.5">
          {claimedCount}
          <span className="text-white/40 text-sm font-normal"> / {TOTAL_SLOTS}</span>
        </p>
        <div className="w-24 h-1 bg-white/10 rounded-full mt-2 overflow-hidden">
          <div
            className="h-full bg-white rounded-full transition-all duration-1000"
            style={{ width: `${(claimedCount / TOTAL_SLOTS) * 100}%` }}
          />
        </div>
      </div>

      {/* Zoom controls — top right */}
      <div className="absolute top-4 right-4 z-20 flex flex-col gap-1.5">
        {[
          { label: "+", fn: () => setZoom(z => Math.min(z * 1.3, 12)) },
          { label: "⊙", fn: resetView },
          { label: "−", fn: () => setZoom(z => Math.max(z * 0.77, 0.4)) },
        ].map(btn => (
          <button
            key={btn.label}
            onClick={btn.fn}
            className="w-9 h-9 bg-black/30 hover:bg-black/50 text-white rounded-lg flex items-center justify-center backdrop-blur-sm border border-white/10 transition-colors font-mono"
          >
            {btn.label}
          </button>
        ))}
      </div>

      {/* Pannable / zoomable SVG canvas */}
      <div
        style={{
          transform: `translate(${pan.x}px, ${pan.y}px) scale(${zoom})`,
          transformOrigin: "center center",
          transition: isDragging ? "none" : "transform 0.08s ease-out",
          width: "100%",
          height: "100%",
          display: "flex",
          alignItems: "center",
          justifyContent: "center",
          willChange: "transform",
        }}
      >
        <svg
          viewBox={`0 0 ${SVG_SIZE} ${SVG_SIZE}`}
          width="min(92vw, 88vh)"
          height="min(92vw, 88vh)"
          style={{ display: "block", overflow: "visible" }}
        >
          <defs>
            {/* Diamond clip path for each slot */}
            {SLOT_COORDS.map(slot => (
              <clipPath key={`clip-${slot.id}`} id={`clip-${slot.id}`}>
                <polygon
                  points={`
                    ${slot.cx},${slot.cy - SLOT_HALF}
                    ${slot.cx + SLOT_HALF},${slot.cy}
                    ${slot.cx},${slot.cy + SLOT_HALF}
                    ${slot.cx - SLOT_HALF},${slot.cy}
                  `}
                />
              </clipPath>
            ))}
          </defs>

          {/* Green background */}
          <rect width={SVG_SIZE} height={SVG_SIZE} fill={GREEN} />

          {/* Cursive name collage */}
          <g style={{ fontFamily: "'Dancing Script', cursive, Georgia, serif", pointerEvents: "none" }}>
            {nameElements.map(el => (
              <text
                key={el.key}
                x={el.x} y={el.y}
                fill={el.color}
                fontSize={el.fontSize}
                opacity={el.opacity}
                transform={`rotate(${el.rotate},${el.x + 30},${el.y})`}
              >
                {el.name}
              </text>
            ))}
          </g>

          {/* ── Ritual Logo as background image ── */}
          {/* The real logo PNG sits underneath all slots */}
          <image
            href="/ritual-logo.png"
            x="0" y="0"
            width={SVG_SIZE}
            height={SVG_SIZE}
            preserveAspectRatio="xMidYMid meet"
            style={{ pointerEvents: "none" }}
          />

          {/* ── 334 Diamond Slots ── */}
          {SLOT_COORDS.map(slot => {
            const slotData = slots[slot.id] ?? { claimed: false, ipfsHash: "", xHandle: "", displayName: "", claimer: "" };
            const isClaimed = slotData.claimed;
            const isHovered = hoveredSlot === slot.id;
            const imgUrl = loadedImages[slot.id] ?? null;

            const pts = `${slot.cx},${slot.cy - SLOT_HALF} ${slot.cx + SLOT_HALF},${slot.cy} ${slot.cx},${slot.cy + SLOT_HALF} ${slot.cx - SLOT_HALF},${slot.cy}`;

            return (
              <g key={slot.id}>
                {isClaimed && imgUrl ? (
                  <>
                    {/* PFP image clipped to diamond */}
                    <image
                      href={imgUrl}
                      x={slot.cx - SLOT_HALF}
                      y={slot.cy - SLOT_HALF}
                      width={SLOT_HALF * 2}
                      height={SLOT_HALF * 2}
                      clipPath={`url(#clip-${slot.id})`}
                      preserveAspectRatio="xMidYMid slice"
                      style={{ cursor: slotData.xHandle ? "pointer" : "default" }}
                      onClick={() => slotData.xHandle && window.open(slotData.xHandle, "_blank")}
                      onMouseEnter={() => setHoveredSlot(slot.id)}
                      onMouseLeave={() => setHoveredSlot(null)}
                    />
                    {/* Thin border on claimed slot */}
                    <polygon
                      points={pts}
                      fill="none"
                      stroke="rgba(255,255,255,0.2)"
                      strokeWidth="0.3"
                      style={{ pointerEvents: "none" }}
                    />
                  </>
                ) : isClaimed ? (
                  /* Claimed but image still loading */
                  <polygon points={pts} fill="rgba(255,255,255,0.2)" />
                ) : (
                  /* Empty — claimable slot */
                  <>
                    <polygon
                      points={pts}
                      fill={isHovered ? "rgba(255,255,255,0.0)" : "rgba(255,255,255,0.0)"}
                      stroke={isHovered ? "rgba(255,255,255,0.85)" : "rgba(255,255,255,0.35)"}
                      strokeWidth={isHovered ? "0.8" : "0.4"}
                      style={{ cursor: "pointer", transition: "stroke 0.12s, stroke-width 0.12s" }}
                      onClick={() => onSlotClick(slot.id)}
                      onMouseEnter={() => setHoveredSlot(slot.id)}
                      onMouseLeave={() => setHoveredSlot(null)}
                    />
                    {/* Slot number on hover */}
                    {isHovered && (
                      <text
                        x={slot.cx} y={slot.cy + 2.5}
                        textAnchor="middle"
                        fill="white"
                        fontSize="4"
                        fontFamily="monospace"
                        style={{ pointerEvents: "none" }}
                      >
                        #{slot.id + 1}
                      </text>
                    )}
                  </>
                )}
              </g>
            );
          })}
        </svg>
      </div>

      {/* Tooltip for hovered claimed slot */}
      <AnimatePresence>
        {hoveredSlot !== null && slots[hoveredSlot]?.claimed && (
          <motion.div
            initial={{ opacity: 0, y: 6 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: 6 }}
            transition={{ duration: 0.12 }}
            className="absolute bottom-8 left-1/2 -translate-x-1/2 bg-black/80 backdrop-blur-md rounded-xl px-4 py-3 border border-white/10 pointer-events-none flex items-center gap-3 shadow-xl"
          >
            {loadedImages[hoveredSlot] && (
              <img src={loadedImages[hoveredSlot]} alt="" className="w-8 h-8 rounded-full object-cover bg-white/10 flex-shrink-0" />
            )}
            <div className="min-w-0">
              <p className="text-white font-body text-sm font-medium leading-none truncate">
                {slots[hoveredSlot].displayName}
              </p>
              {slots[hoveredSlot].xHandle && (
                <p className="text-white/40 text-xs font-mono mt-1 truncate">
                  @{slots[hoveredSlot].xHandle.replace(/https?:\/\/(www\.)?(x|twitter)\.com\//i, "")}
                </p>
              )}
            </div>
            {slots[hoveredSlot].xHandle && (
              <span className="text-white/30 text-xs font-mono flex-shrink-0">click ↗</span>
            )}
          </motion.div>
        )}
      </AnimatePresence>

      {/* Fade-out hint */}
      <motion.p
        initial={{ opacity: 0.7 }}
        animate={{ opacity: 0 }}
        transition={{ delay: 5, duration: 2 }}
        className="absolute bottom-4 right-4 text-white/30 text-xs font-mono pointer-events-none"
      >
        scroll to zoom · drag to pan · click any slot to claim
      </motion.p>
    </div>
  );
}
