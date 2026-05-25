"use client";
import React, { useRef, useState, useCallback, useEffect } from "react";
import { motion, AnimatePresence } from "framer-motion";

const SVG_SIZE = 1000;
const CX = 500;
const CY = 500;
const GREEN = "#043D2C";
const TOTAL_SLOTS = 334;

// Ring definitions — radius, slot count, circle size, rotation speed (deg/sec)
const RINGS = [
  { radius: 0,   count: 1,  r: 42, speed: 0    },
  { radius: 105, count: 8,  r: 36, speed: 4     },
  { radius: 200, count: 15, r: 30, speed: -3    },
  { radius: 290, count: 22, r: 25, speed: 2.5   },
  { radius: 375, count: 29, r: 21, speed: -2    },
  { radius: 455, count: 36, r: 18, speed: 1.5   },
  { radius: 490, count: 43, r: 16, speed: -1.2  },
  { radius: 490, count: 50, r: 14, speed: 1     },
];

// Pre-compute base slot positions
function buildSlots() {
  const slots: Array<{ id: number; ringIdx: number; baseAngle: number; radius: number; r: number; speed: number }> = [];
  let id = 0;
  RINGS.forEach((ring, ringIdx) => {
    for (let i = 0; i < ring.count; i++) {
      const baseAngle = ring.count === 1 ? 0 : (2 * Math.PI * i) / ring.count - Math.PI / 2;
      slots.push({ id, ringIdx, baseAngle, radius: ring.radius, r: ring.r, speed: ring.speed });
      id++;
      if (id >= TOTAL_SLOTS) break;
    }
    return id < TOTAL_SLOTS;
  });
  return slots;
}

const BASE_SLOTS = buildSlots();

interface SlotData {
  claimed: boolean;
  ipfsHash: string;
  xHandle: string;
  displayName: string;
  claimer: string;
}

interface Props {
  slots: SlotData[];
  onSlotClick: (id: number) => void;
  names: string[];
}

function getImageUrl(slot: SlotData): string | null {
  if (!slot?.claimed) return null;
  if (slot.xHandle) {
    const handle = slot.xHandle.replace(/https?:\/\/(www\.)?(x|twitter)\.com\//i, "").replace(/^@/, "").trim();
    if (handle) return `https://unavatar.io/x/${handle}`;
  }
  if (slot.ipfsHash) return `https://gateway.pinata.cloud/ipfs/${slot.ipfsHash}`;
  return null;
}

export function MosaicCanvas({ slots, onSlotClick, names }: Props) {
  const [rotationDeg, setRotationDeg] = useState(0);
  const [zoom, setZoom] = useState(1);
  const [pan, setPan] = useState({ x: 0, y: 0 });
  const [isDragging, setIsDragging] = useState(false);
  const [dragStart, setDragStart] = useState({ x: 0, y: 0 });
  const [hoveredSlot, setHoveredSlot] = useState<number | null>(null);
  const [tick, setTick] = useState(0);
  const animRef = useRef<number>();
  const lastTimeRef = useRef<number>(0);

  // Animation loop
  useEffect(() => {
    const animate = (time: number) => {
      if (lastTimeRef.current) {
        const delta = (time - lastTimeRef.current) / 1000;
        setTick(t => t + delta);
      }
      lastTimeRef.current = time;
      animRef.current = requestAnimationFrame(animate);
    };
    animRef.current = requestAnimationFrame(animate);
    return () => { if (animRef.current) cancelAnimationFrame(animRef.current); };
  }, []);

  const handleWheel = useCallback((e: React.WheelEvent) => {
    e.preventDefault();
    setZoom(z => Math.min(Math.max(z * (e.deltaY > 0 ? 0.92 : 1.08), 0.4), 10));
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

  const claimedCount = slots.filter(s => s?.claimed).length;

  // Name collage
  const nameEls = names.flatMap((name, i) => {
    const colors = ["#0a6b4a","#085c3f","#0d7a55","#094f37","#0f8060","#073d2d"];
    const count = Math.max(2, Math.ceil(950 / (name.length * 10 + 20)));
    return Array.from({ length: count }, (_, j) => ({
      key: `${i}-${j}`,
      x: (j * (name.length * 10 + 25) + i * 17) % 1020 - 20,
      y: 45 + ((i * 57 + j * 11) % 910),
      color: colors[(i + j) % colors.length],
      name,
      opacity: 0.22 + (i % 5) * 0.06,
      fontSize: 12 + (i % 4) * 3,
      rotate: -10 + (i % 7) * 3,
    }));
  });

  return (
    <div
      className="relative w-full h-full overflow-hidden select-none"
      style={{ background: "#032b1e", cursor: isDragging ? "grabbing" : "grab" }}
      onWheel={handleWheel}
      onMouseDown={handleMouseDown}
      onMouseMove={handleMouseMove}
      onMouseUp={handleMouseUp}
      onMouseLeave={handleMouseUp}
    >
      {/* Stats */}
      <div className="absolute top-4 left-4 z-20 bg-black/30 backdrop-blur-sm rounded-xl px-4 py-3 border border-white/10">
        <p className="text-white/50 text-xs font-mono uppercase tracking-widest">Claimed</p>
        <p className="text-white font-bold text-2xl leading-none mt-0.5">
          {claimedCount}<span className="text-white/40 text-sm font-normal"> / {TOTAL_SLOTS}</span>
        </p>
        <div className="w-24 h-1 bg-white/10 rounded-full mt-2 overflow-hidden">
          <div className="h-full bg-emerald-400 rounded-full transition-all duration-1000"
            style={{ width: `${(claimedCount / TOTAL_SLOTS) * 100}%` }} />
        </div>
      </div>

      {/* Zoom controls */}
      <div className="absolute top-4 right-4 z-20 flex flex-col gap-1.5">
        {[
          { l: "+", f: () => setZoom(z => Math.min(z * 1.25, 10)) },
          { l: "⊙", f: resetView },
          { l: "−", f: () => setZoom(z => Math.max(z * 0.8, 0.4)) },
        ].map(b => (
          <button key={b.l} onClick={b.f}
            className="w-9 h-9 bg-black/30 hover:bg-black/50 text-white rounded-lg flex items-center justify-center backdrop-blur-sm border border-white/10 transition-colors font-mono text-base">
            {b.l}
          </button>
        ))}
      </div>

      {/* Canvas */}
      <div style={{
        transform: `translate(${pan.x}px, ${pan.y}px) scale(${zoom})`,
        transformOrigin: "center center",
        transition: isDragging ? "none" : "transform 0.06s ease-out",
        width: "100%", height: "100%",
        display: "flex", alignItems: "center", justifyContent: "center",
        willChange: "transform",
      }}>
        <svg
          viewBox={`0 0 ${SVG_SIZE} ${SVG_SIZE}`}
          width="min(94vw, 90vh)"
          height="min(94vw, 90vh)"
          style={{ display: "block", overflow: "visible" }}
        >
          <defs>
            {/* Radial gradient for depth */}
            <radialGradient id="bgGrad" cx="50%" cy="50%" r="50%">
              <stop offset="0%" stopColor="#065c42" />
              <stop offset="100%" stopColor="#021a11" />
            </radialGradient>
            {/* Glow filter */}
            <filter id="glow">
              <feGaussianBlur stdDeviation="3" result="blur" />
              <feMerge><feMergeNode in="blur" /><feMergeNode in="SourceGraphic" /></feMerge>
            </filter>
            {/* Soft glow for claimed */}
            <filter id="softglow">
              <feGaussianBlur stdDeviation="2" result="blur" />
              <feMerge><feMergeNode in="blur" /><feMergeNode in="SourceGraphic" /></feMerge>
            </filter>
            {/* Clip paths for circular PFPs */}
            {BASE_SLOTS.map(s => (
              <clipPath key={`c${s.id}`} id={`c${s.id}`}>
                <circle cx="0" cy="0" r={s.r} />
              </clipPath>
            ))}
          </defs>

          {/* Background */}
          <rect width={SVG_SIZE} height={SVG_SIZE} fill="url(#bgGrad)" />

          {/* Cursive name collage */}
          <g style={{ fontFamily: "'Dancing Script', cursive", pointerEvents: "none" }}>
            {nameEls.map(el => (
              <text key={el.key} x={el.x} y={el.y} fill={el.color}
                fontSize={el.fontSize} opacity={el.opacity}
                transform={`rotate(${el.rotate},${el.x+30},${el.y})`}>
                {el.name}
              </text>
            ))}
          </g>

          {/* Ritual logo — faint watermark */}
          <image
            href="/ritual-logo.png"
            x="100" y="100" width="800" height="800"
            opacity="0.07"
            style={{ pointerEvents: "none" }}
            preserveAspectRatio="xMidYMid meet"
          />

          {/* Subtle ring guide circles */}
          {RINGS.filter(r => r.radius > 0).map((ring, i) => (
            <circle key={i} cx={CX} cy={CY} r={ring.radius}
              fill="none" stroke="rgba(255,255,255,0.04)" strokeWidth="1" />
          ))}

          {/* Center glow */}
          <circle cx={CX} cy={CY} r="180" fill="radial-gradient" opacity="0.15"
            style={{ filter: "blur(40px)" }} />
          <circle cx={CX} cy={CY} r="60" fill="rgba(255,255,255,0.03)" />

          {/* Slots */}
          {BASE_SLOTS.map(slot => {
            const slotData = slots[slot.id];
            const isClaimed = slotData?.claimed;
            const isHovered = hoveredSlot === slot.id;
            const imgUrl = getImageUrl(slotData);

            // Current angle with rotation applied per ring
            const currentAngle = slot.baseAngle + (slot.speed * tick * Math.PI / 180);
            const px = slot.radius === 0 ? CX : CX + slot.radius * Math.cos(currentAngle);
            const py = slot.radius === 0 ? CY : CY + slot.radius * Math.sin(currentAngle);
            const r = slot.r;

            return (
              <g key={slot.id}
                transform={`translate(${px},${py})`}
                style={{ cursor: isClaimed ? (slotData.xHandle ? "pointer" : "default") : "pointer" }}
                onClick={() => {
                  if (isClaimed && slotData.xHandle) window.open(slotData.xHandle, "_blank");
                  else if (!isClaimed) onSlotClick(slot.id);
                }}
                onMouseEnter={() => setHoveredSlot(slot.id)}
                onMouseLeave={() => setHoveredSlot(null)}
              >
                {isClaimed && imgUrl ? (
                  <>
                    {/* Glow ring behind claimed */}
                    <circle r={r + 3} fill="none" stroke="rgba(100,255,180,0.25)" strokeWidth="2" />
                    {/* PFP image */}
                    <image
                      href={imgUrl}
                      x={-r} y={-r}
                      width={r * 2} height={r * 2}
                      clipPath={`url(#c${slot.id})`}
                      preserveAspectRatio="xMidYMid slice"
                    />
                    {/* White border */}
                    <circle r={r} fill="none"
                      stroke={isHovered ? "rgba(255,255,255,0.95)" : "rgba(255,255,255,0.4)"}
                      strokeWidth={isHovered ? "2.5" : "1.5"} />
                  </>
                ) : isClaimed ? (
                  // Claimed but loading
                  <>
                    <circle r={r} fill="rgba(100,200,150,0.3)" />
                    <circle r={r} fill="none" stroke="rgba(255,255,255,0.3)" strokeWidth="1.5" />
                  </>
                ) : (
                  // Empty slot
                  <>
                    <circle r={r} fill={isHovered ? "rgba(255,255,255,0.12)" : "rgba(255,255,255,0.04)"} />
                    <circle r={r} fill="none"
                      stroke={isHovered ? "rgba(255,255,255,0.8)" : "rgba(255,255,255,0.2)"}
                      strokeWidth={isHovered ? "1.5" : "0.8"}
                      strokeDasharray={isHovered ? "none" : `${r * 0.4} ${r * 0.3}`}
                    />
                    {isHovered && (
                      <text textAnchor="middle" dy="4" fontSize={r * 0.45}
                        fill="rgba(255,255,255,0.6)" fontFamily="monospace">
                        +
                      </text>
                    )}
                  </>
                )}
              </g>
            );
          })}
        </svg>
      </div>

      {/* Hover tooltip */}
      <AnimatePresence>
        {hoveredSlot !== null && slots[hoveredSlot]?.claimed && (
          <motion.div
            initial={{ opacity: 0, y: 6 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: 6 }}
            transition={{ duration: 0.12 }}
            className="absolute bottom-8 left-1/2 -translate-x-1/2 bg-black/80 backdrop-blur-md rounded-xl px-4 py-3 border border-white/10 pointer-events-none flex items-center gap-3 shadow-xl"
          >
            {getImageUrl(slots[hoveredSlot]) && (
              <img src={getImageUrl(slots[hoveredSlot])!} alt=""
                className="w-8 h-8 rounded-full object-cover bg-white/10 flex-shrink-0" />
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

      {/* Hint */}
      <motion.p
        initial={{ opacity: 0.7 }} animate={{ opacity: 0 }}
        transition={{ delay: 5, duration: 2 }}
        className="absolute bottom-4 right-4 text-white/25 text-xs font-mono pointer-events-none"
      >
        scroll to zoom · drag to pan · click any slot to claim
      </motion.p>
    </div>
  );
}
