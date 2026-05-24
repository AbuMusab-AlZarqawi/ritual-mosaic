"use client";
import React, { useRef, useState, useCallback } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { SLOT_COORDS, SLOT_HALF } from "@/lib/slotCoords";

const SVG_SIZE = 1000;
const GREEN = "#06503A";
const WHITE = "#F5F5F5";

interface SlotData {
  claimed: boolean;
  ipfsHash: string;
  xHandle: string;   // stored as full URL e.g. https://x.com/alice
  displayName: string;
  claimer: string;
}

interface MosaicCanvasProps {
  slots: SlotData[];
  onSlotClick: (slotId: number) => void;
  names: string[];
}

// Derive image URL: prefer unavatar for X slots, IPFS for custom uploads
function getImageUrl(slot: SlotData): string | null {
  if (!slot.claimed) return null;
  if (slot.xHandle) {
    // Extract handle from stored URL e.g. "https://x.com/alice" → "alice"
    const handle = slot.xHandle.replace(/https?:\/\/(www\.)?(x|twitter)\.com\//i, "").replace(/^@/, "").trim();
    if (handle) return `https://unavatar.io/x/${handle}`;
  }
  if (slot.ipfsHash) {
    return `https://gateway.pinata.cloud/ipfs/${slot.ipfsHash}`;
  }
  return null;
}

export function MosaicCanvas({ slots, onSlotClick, names }: MosaicCanvasProps) {
  const containerRef = useRef<HTMLDivElement>(null);
  const [zoom, setZoom] = useState(1);
  const [pan, setPan] = useState({ x: 0, y: 0 });
  const [isDragging, setIsDragging] = useState(false);
  const [dragStart, setDragStart] = useState({ x: 0, y: 0 });
  const [hoveredSlot, setHoveredSlot] = useState<number | null>(null);

  const handleWheel = useCallback((e: React.WheelEvent) => {
    e.preventDefault();
    const delta = e.deltaY > 0 ? 0.9 : 1.1;
    setZoom(z => Math.min(Math.max(z * delta, 0.4), 10));
  }, []);

  const handleMouseDown = (e: React.MouseEvent) => {
    if (e.button === 0) {
      setIsDragging(true);
      setDragStart({ x: e.clientX - pan.x, y: e.clientY - pan.y });
    }
  };

  const handleMouseMove = (e: React.MouseEvent) => {
    if (isDragging) setPan({ x: e.clientX - dragStart.x, y: e.clientY - dragStart.y });
  };

  const handleMouseUp = () => setIsDragging(false);

  const resetView = () => { setZoom(1); setPan({ x: 0, y: 0 }); };

  // Cursive name collage elements
  const nameElements = names.flatMap((name, i) => {
    const colors = ["#0a6b4a", "#085c3f", "#0d7a55", "#094f37", "#0f8060", "#073d2d", "#116644"];
    const count = Math.max(2, Math.ceil(900 / (name.length * 11 + 20)));
    return Array.from({ length: count }, (_, j) => ({
      key: `${i}-${j}`,
      x: (j * (name.length * 11 + 28) + (i % 5) * 18) % 1020 - 20,
      y: 50 + ((i * 53 + j * 7) % 900),
      color: colors[(i + j) % colors.length],
      name,
      opacity: 0.28 + (i % 5) * 0.08,
      fontSize: 13 + (i % 4) * 3,
      rotate: -10 + (i % 7) * 3,
    }));
  });

  const claimedCount = slots.filter(s => s.claimed).length;

  return (
    <div
      ref={containerRef}
      className="relative w-full h-full overflow-hidden bg-[#06503A] select-none"
      style={{ cursor: isDragging ? "grabbing" : "grab" }}
      onWheel={handleWheel}
      onMouseDown={handleMouseDown}
      onMouseMove={handleMouseMove}
      onMouseUp={handleMouseUp}
      onMouseLeave={handleMouseUp}
    >
      {/* Top-left stats */}
      <div className="absolute top-4 left-4 z-20 bg-black/30 backdrop-blur-sm rounded-xl px-4 py-3 border border-white/10">
        <p className="text-white/50 text-xs font-mono uppercase tracking-widest">Claimed</p>
        <p className="text-white font-bold text-2xl leading-none mt-0.5">
          {claimedCount}
          <span className="text-white/40 text-sm font-normal"> / 133</span>
        </p>
        <div className="w-24 h-1 bg-white/10 rounded-full mt-2 overflow-hidden">
          <div className="h-full bg-white rounded-full transition-all duration-1000" style={{ width: `${(claimedCount / 133) * 100}%` }} />
        </div>
      </div>

      {/* Zoom controls */}
      <div className="absolute top-4 right-4 z-20 flex flex-col gap-1.5">
        {[
          { label: "+", action: () => setZoom(z => Math.min(z * 1.3, 10)) },
          { label: "⊙", action: resetView },
          { label: "−", action: () => setZoom(z => Math.max(z * 0.77, 0.4)) },
        ].map(btn => (
          <button
            key={btn.label}
            onClick={btn.action}
            className="w-9 h-9 bg-black/30 hover:bg-black/50 text-white rounded-lg flex items-center justify-center backdrop-blur-sm border border-white/10 transition-colors font-mono text-base"
          >
            {btn.label}
          </button>
        ))}
      </div>

      {/* Scrollable canvas */}
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
          width="min(90vw, 86vh)"
          height="min(90vw, 86vh)"
          style={{ display: "block", overflow: "visible" }}
        >
          <defs>
            {SLOT_COORDS.map(slot => (
              <clipPath key={`clip-${slot.id}`} id={`clip-${slot.id}`}>
                <polygon points={`${slot.cx},${slot.cy - SLOT_HALF} ${slot.cx + SLOT_HALF},${slot.cy} ${slot.cx},${slot.cy + SLOT_HALF} ${slot.cx - SLOT_HALF},${slot.cy}`} />
              </clipPath>
            ))}
          </defs>

          {/* Background */}
          <rect width={SVG_SIZE} height={SVG_SIZE} fill={GREEN} />

          {/* Cursive name collage */}
          <g style={{ fontFamily: "'Dancing Script', cursive, Georgia, serif" }}>
            {nameElements.map(el => (
              <text
                key={el.key}
                x={el.x} y={el.y}
                fill={el.color}
                fontSize={el.fontSize}
                opacity={el.opacity}
                transform={`rotate(${el.rotate},${el.x + 30},${el.y})`}
                style={{ userSelect: "none", pointerEvents: "none" }}
              >
                {el.name}
              </text>
            ))}
          </g>

          {/* ─── Ritual Knot SVG ─── */}
          {/* Reconstructed mathematically from pixel measurements of the 1254x1254 logo */}
          {/* Band width ≈ 72 units, gap ≈ 30 units, in 1000x1000 SVG space */}
          <g id="ritual-knot" fillRule="evenodd">

            {/* Full white shape first — entire knot area */}
            <g fill={WHITE}>
              {/* Top isolated diamond */}
              <polygon points="500,63 576,139 500,215 424,139" />

              {/* Top-left C-bracket arm */}
              <polygon points="246,246 318,174 462,318 390,390" />
              <polygon points="174,318 246,246 318,318 246,390" />
              <polygon points="246,390 318,318 462,462 390,534" />

              {/* Top-right C-bracket arm */}
              <polygon points="754,246 682,174 538,318 610,390" />
              <polygon points="826,318 754,246 682,318 754,390" />
              <polygon points="754,390 682,318 538,462 610,534" />

              {/* Left outer arm */}
              <polygon points="100,428 172,356 244,428 172,500" />
              <polygon points="172,356 244,284 316,356 244,428" />
              <polygon points="172,500 244,428 316,500 244,572" />
              <polygon points="100,572 172,500 244,572 172,644" />
              <polygon points="172,644 244,572 316,644 244,716" />

              {/* Right outer arm */}
              <polygon points="900,428 828,356 756,428 828,500" />
              <polygon points="828,356 756,284 684,356 756,428" />
              <polygon points="828,500 756,428 684,500 756,572" />
              <polygon points="900,572 828,500 756,572 828,644" />
              <polygon points="828,644 756,572 684,644 756,716" />

              {/* Bottom-left C-bracket arm */}
              <polygon points="246,754 318,682 462,682 390,754" />
              <polygon points="174,682 246,610 318,682 246,754" />
              <polygon points="246,610 318,538 462,538 390,610" />

              {/* Bottom-right C-bracket arm */}
              <polygon points="754,754 682,682 538,682 610,754" />
              <polygon points="826,682 754,610 682,682 754,754" />
              <polygon points="754,610 682,538 538,538 610,610" />

              {/* Bottom isolated diamond */}
              <polygon points="500,785 576,861 500,937 424,861" />

              {/* Vertical central band */}
              <rect x="464" y="139" width="72" height="722" />

              {/* Horizontal central band */}
              <rect x="139" y="464" width="722" height="72" />

              {/* Diagonal NW→SE band */}
              <polygon points="174,318 246,246 826,826 754,898" />

              {/* Diagonal NE→SW band */}
              <polygon points="826,318 754,246 174,826 246,898" />
            </g>

            {/* Green cutouts — create the over-under weave illusion */}
            <g fill={GREEN}>
              {/* Top gap — vertical band passes UNDER horizontal here */}
              <rect x="464" y="139" width="72" height="72" />
              {/* Bottom gap */}
              <rect x="464" y="789" width="72" height="72" />
              {/* Left gap */}
              <rect x="139" y="464" width="72" height="72" />
              {/* Right gap */}
              <rect x="789" y="464" width="72" height="72" />

              {/* Inner weave cuts — NW quadrant */}
              <polygon points="318,318 390,246 462,318 390,390" fill={GREEN} />
              <polygon points="390,390 462,318 534,390 462,462" fill={GREEN} />

              {/* Inner weave cuts — NE quadrant */}
              <polygon points="682,318 610,246 538,318 610,390" fill={GREEN} />
              <polygon points="610,390 538,318 466,390 538,462" fill={GREEN} />

              {/* Inner weave cuts — SW quadrant */}
              <polygon points="318,682 390,754 462,682 390,610" fill={GREEN} />
              <polygon points="390,610 462,682 534,610 462,538" fill={GREEN} />

              {/* Inner weave cuts — SE quadrant */}
              <polygon points="682,682 610,754 538,682 610,610" fill={GREEN} />
              <polygon points="610,610 538,682 466,610 538,538" fill={GREEN} />

              {/* Central green holes — heart of the knot */}
              <polygon points="464,392 500,356 536,392 500,428" fill={GREEN} />
              <polygon points="464,572 500,536 536,572 500,608" fill={GREEN} />
              <polygon points="356,464 392,500 356,536 320,500" fill={GREEN} />
              <polygon points="644,464 680,500 644,536 608,500" fill={GREEN} />
            </g>
          </g>

          {/* ─── PFP Slots ─── */}
          {SLOT_COORDS.map(slot => {
            const slotData = slots[slot.id];
            const isClaimed = slotData?.claimed;
            const isHovered = hoveredSlot === slot.id;
            const imgUrl = getImageUrl(slotData);

            const pts = `${slot.cx},${slot.cy - SLOT_HALF} ${slot.cx + SLOT_HALF},${slot.cy} ${slot.cx},${slot.cy + SLOT_HALF} ${slot.cx - SLOT_HALF},${slot.cy}`;

            return (
              <g key={slot.id}>
                {isClaimed && imgUrl ? (
                  <>
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
                    {/* Subtle diamond border on claimed slots */}
                    <polygon points={pts} fill="none" stroke="rgba(255,255,255,0.15)" strokeWidth="0.5" style={{ pointerEvents: "none" }} />
                  </>
                ) : isClaimed ? (
                  // Claimed but image not loaded yet
                  <polygon points={pts} fill="rgba(255,255,255,0.15)" />
                ) : (
                  // Empty — claimable
                  <polygon
                    points={pts}
                    fill={isHovered ? "rgba(255,255,255,0.22)" : "rgba(255,255,255,0.06)"}
                    stroke={isHovered ? "rgba(255,255,255,0.5)" : "rgba(255,255,255,0.18)"}
                    strokeWidth={isHovered ? "1" : "0.4"}
                    style={{ cursor: "pointer", transition: "fill 0.15s, stroke 0.15s" }}
                    onClick={() => onSlotClick(slot.id)}
                    onMouseEnter={() => setHoveredSlot(slot.id)}
                    onMouseLeave={() => setHoveredSlot(null)}
                  />
                )}

                {/* Slot number on hover (empty only) */}
                {isHovered && !isClaimed && (
                  <text
                    x={slot.cx} y={slot.cy + 4}
                    textAnchor="middle"
                    fill="rgba(255,255,255,0.7)"
                    fontSize="7"
                    fontFamily="monospace"
                    style={{ pointerEvents: "none" }}
                  >
                    #{slot.id + 1}
                  </text>
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
            transition={{ duration: 0.15 }}
            className="absolute bottom-8 left-1/2 -translate-x-1/2 bg-black/80 backdrop-blur-md rounded-xl px-4 py-3 border border-white/10 pointer-events-none flex items-center gap-3 shadow-xl"
          >
            {getImageUrl(slots[hoveredSlot]) && (
              <img
                src={getImageUrl(slots[hoveredSlot])!}
                alt=""
                className="w-8 h-8 rounded-full object-cover bg-white/10"
              />
            )}
            <div>
              <p className="text-white font-body text-sm font-medium leading-none">{slots[hoveredSlot].displayName}</p>
              {slots[hoveredSlot].xHandle && (
                <p className="text-white/40 text-xs font-mono mt-1">
                  @{slots[hoveredSlot].xHandle.replace(/https?:\/\/(www\.)?(x|twitter)\.com\//i, "")}
                </p>
              )}
            </div>
            {slots[hoveredSlot].xHandle && (
              <span className="text-white/30 text-xs font-mono">click to visit ↗</span>
            )}
          </motion.div>
        )}
      </AnimatePresence>

      {/* Hint */}
      <motion.p
        initial={{ opacity: 0.8 }}
        animate={{ opacity: 0 }}
        transition={{ delay: 5, duration: 2 }}
        className="absolute bottom-4 right-4 text-white/25 text-xs font-mono pointer-events-none"
      >
        scroll to zoom · drag to pan · click slot to claim
      </motion.p>
    </div>
  );
}
