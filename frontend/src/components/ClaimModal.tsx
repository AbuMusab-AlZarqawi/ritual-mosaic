"use client";
import React, { useState, useRef } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { X, Upload, Loader2, CheckCircle, Twitter } from "lucide-react";
import { useAccount } from "wagmi";
import { ConnectButton } from "@rainbow-me/rainbowkit";
import { uploadToPinata } from "@/lib/pinata";
import { useClaimSlot } from "@/hooks/useContract";

interface Props {
  slotId: number | null;
  onClose: () => void;
  onSuccess: () => void;
}

type Step = "form" | "uploading" | "confirm" | "mining" | "done";
type PhotoMode = "x" | "custom";

export function ClaimModal({ slotId, onClose, onSuccess }: Props) {
  const { isConnected } = useAccount();
  const [step, setStep] = useState<Step>("form");
  const [photoMode, setPhotoMode] = useState<PhotoMode>("x");
  const [xHandle, setXHandle] = useState("");
  const [pfpFile, setPfpFile] = useState<File | null>(null);
  const [pfpPreview, setPfpPreview] = useState<string | null>(null);
  const [displayName, setDisplayName] = useState("");
  const [error, setError] = useState("");
  const fileRef = useRef<HTMLInputElement>(null);
  const { claimSlot, isPending, isConfirming, isSuccess, reset } = useClaimSlot();

  const cleanHandle = xHandle
    .replace(/https?:\/\/(www\.)?(x|twitter)\.com\//gi, "")
    .replace(/^@/, "").replace(/\s/g, "").trim();
  const xProfileUrl = cleanHandle ? `https://x.com/${cleanHandle}` : "";
  const xAvatarUrl = cleanHandle ? `https://unavatar.io/x/${cleanHandle}` : "";

  React.useEffect(() => { if (isSuccess) { setStep("done"); onSuccess(); } }, [isSuccess]);
  React.useEffect(() => { if (isPending || isConfirming) setStep("mining"); }, [isPending, isConfirming]);

  const handleFile = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    if (!file.type.startsWith("image/")) { setError("Please select an image file"); return; }
    if (file.size > 5 * 1024 * 1024) { setError("Image must be under 5MB"); return; }
    setPfpFile(file);
    setPfpPreview(URL.createObjectURL(file));
    setError("");
    e.target.value = "";
  };

  const handleSubmit = async () => {
    if (!displayName.trim()) { setError("Please enter your name"); return; }
    if (photoMode === "x" && !cleanHandle) { setError("Please enter your X handle"); return; }
    if (photoMode === "custom" && !pfpFile) { setError("Please upload a photo"); return; }
    setError("");

    try {
      if (photoMode === "x") {
        setStep("confirm");
        claimSlot(slotId!, "", xProfileUrl, displayName.trim());
      } else {
        setStep("uploading");
        const ipfsHash = await uploadToPinata(pfpFile!);
        setStep("confirm");
        claimSlot(slotId!, ipfsHash, "", displayName.trim());
      }
    } catch (err: any) {
      setError(err.message || "Something went wrong");
      setStep("form");
    }
  };

  if (slotId === null) return null;
  const isSubmitting = step === "uploading" || step === "confirm";

  return (
    <AnimatePresence>
      <motion.div
        initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
        className="fixed inset-0 z-50 flex items-center justify-center bg-black/70 backdrop-blur-sm px-4"
        onClick={e => e.target === e.currentTarget && step === "form" && onClose()}
      >
        <motion.div
          initial={{ scale: 0.92, opacity: 0, y: 20 }}
          animate={{ scale: 1, opacity: 1, y: 0 }}
          exit={{ scale: 0.92, opacity: 0 }}
          className="bg-[#043D2C] border border-white/10 rounded-2xl w-full max-w-md overflow-hidden shadow-2xl"
        >
          {/* Header */}
          <div className="flex items-center justify-between px-6 py-5 border-b border-white/10">
            <div>
              <h2 className="text-white font-display text-xl">Claim Slot #{slotId + 1}</h2>
              <p className="text-white/40 text-xs font-mono mt-0.5">free to claim · only pay gas · permanent onchain</p>
            </div>
            {step === "form" && (
              <button onClick={onClose} className="text-white/30 hover:text-white transition-colors">
                <X size={20} />
              </button>
            )}
          </div>

          <div className="px-6 py-6">
            {/* FORM */}
            {(step === "form" || isSubmitting) && (
              <div className="space-y-5">
                {/* Photo mode toggle */}
                <div>
                  <label className="text-white/70 text-sm font-body block mb-2">Profile Photo *</label>
                  <div className="flex rounded-xl overflow-hidden border border-white/10 mb-3">
                    <button
                      onClick={() => setPhotoMode("x")}
                      className={`flex-1 flex items-center justify-center gap-2 py-2.5 text-sm font-body transition-colors ${
                        photoMode === "x" ? "bg-white text-[#06503A] font-semibold" : "text-white/50 hover:text-white"
                      }`}
                    >
                      <Twitter size={14} /> Use X Photo
                    </button>
                    <button
                      onClick={() => setPhotoMode("custom")}
                      className={`flex-1 flex items-center justify-center gap-2 py-2.5 text-sm font-body transition-colors ${
                        photoMode === "custom" ? "bg-white text-[#06503A] font-semibold" : "text-white/50 hover:text-white"
                      }`}
                    >
                      <Upload size={14} /> Upload Custom
                    </button>
                  </div>

                  {/* X handle input */}
                  {photoMode === "x" && (
                    <div className="space-y-3">
                      <div className="flex items-center bg-white/5 border border-white/10 rounded-xl overflow-hidden focus-within:border-white/30 transition-colors">
                        <span className="text-white/40 pl-4 text-lg font-mono select-none">@</span>
                        <input
                          type="text"
                          value={xHandle}
                          onChange={e => setXHandle(e.target.value.replace(/^@/, ""))}
                          placeholder="yourhandle"
                          className="flex-1 bg-transparent px-3 py-3 text-white font-mono placeholder-white/20 focus:outline-none"
                        />
                      </div>
                      {cleanHandle && (
                        <motion.div
                          initial={{ opacity: 0, y: -5 }} animate={{ opacity: 1, y: 0 }}
                          className="flex items-center gap-3 bg-white/5 rounded-xl px-3 py-2.5"
                        >
                          <img src={xAvatarUrl} alt="X avatar"
                            className="w-10 h-10 rounded-full object-cover bg-white/10 flex-shrink-0"
                            onError={e => { (e.target as HTMLImageElement).src = "data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' width='40' height='40'%3E%3Crect width='40' height='40' fill='%23134d38'/%3E%3Ctext x='20' y='26' text-anchor='middle' fill='white' font-size='16'%3E?%3C/text%3E%3C/svg%3E"; }}
                          />
                          <div className="min-w-0 flex-1">
                            <p className="text-white text-sm truncate">@{cleanHandle}</p>
                            <p className="text-white/40 text-xs font-mono truncate">{xProfileUrl}</p>
                          </div>
                          <span className="text-emerald-400 text-xs shrink-0">⚡ instant</span>
                        </motion.div>
                      )}
                    </div>
                  )}

                  {/* Custom upload */}
                  {photoMode === "custom" && (
                    <div
                      onClick={() => fileRef.current?.click()}
                      className="relative border-2 border-dashed border-white/20 hover:border-white/40 rounded-xl h-28 flex items-center justify-center cursor-pointer transition-colors overflow-hidden"
                    >
                      {pfpPreview ? (
                        <>
                          <img src={pfpPreview} alt="Preview" className="w-full h-full object-cover" />
                          <div className="absolute inset-0 bg-black/40 flex items-center justify-center opacity-0 hover:opacity-100 transition-opacity">
                            <span className="text-white text-sm">Change photo</span>
                          </div>
                        </>
                      ) : (
                        <div className="flex flex-col items-center gap-2 text-white/30">
                          <Upload size={22} />
                          <span className="text-sm font-body">Click to upload</span>
                          <span className="text-xs">JPG, PNG, GIF · max 5MB</span>
                        </div>
                      )}
                    </div>
                  )}
                  <input ref={fileRef} type="file" accept="image/*" className="hidden" onChange={handleFile} />
                </div>

                {/* Name */}
                <div>
                  <label className="text-white/70 text-sm font-body block mb-2">Your Name *</label>
                  <input
                    type="text" value={displayName}
                    onChange={e => setDisplayName(e.target.value)}
                    placeholder="e.g. Alice" maxLength={30}
                    className="w-full bg-white/5 border border-white/10 rounded-xl px-4 py-3 text-white font-body placeholder-white/20 focus:outline-none focus:border-white/30 transition-colors"
                  />
                  <p className="text-white/30 text-xs mt-1">Appears in the background name collage</p>
                </div>

                {error && <p className="text-red-400 text-sm bg-red-400/10 rounded-lg px-3 py-2">{error}</p>}

                {!isConnected ? (
                  <div className="flex flex-col items-center gap-3 pt-2">
                    <p className="text-white/50 text-sm text-center">Connect wallet to claim — it's free!</p>
                    <ConnectButton />
                  </div>
                ) : (
                  <button
                    onClick={handleSubmit}
                    disabled={isSubmitting}
                    className="w-full py-3.5 bg-white text-[#06503A] font-bold rounded-xl hover:bg-white/90 transition-colors disabled:opacity-50 disabled:cursor-not-allowed font-body tracking-wide"
                  >
                    {step === "uploading" ? (
                      <span className="flex items-center justify-center gap-2"><Loader2 size={16} className="animate-spin" /> Uploading to IPFS...</span>
                    ) : step === "confirm" ? (
                      <span className="flex items-center justify-center gap-2"><Loader2 size={16} className="animate-spin" /> Waiting for wallet...</span>
                    ) : (
                      "Claim Your Spot — Free ✦"
                    )}
                  </button>
                )}
              </div>
            )}

            {/* MINING */}
            {step === "mining" && (
              <div className="flex flex-col items-center py-8 gap-4">
                <motion.div animate={{ rotate: 360 }} transition={{ duration: 1.5, repeat: Infinity, ease: "linear" }}
                  className="w-14 h-14 border-2 border-white/20 border-t-white rounded-full" />
                <p className="text-white font-display text-lg">{isPending ? "Confirm in wallet..." : "Recording onchain..."}</p>
                <p className="text-white/40 text-sm text-center font-body">Just the gas fee — your spot is free to claim!</p>
              </div>
            )}

            {/* DONE */}
            {step === "done" && (
              <div className="flex flex-col items-center py-8 gap-4">
                <motion.div initial={{ scale: 0 }} animate={{ scale: 1 }} transition={{ type: "spring", bounce: 0.5 }}>
                  <CheckCircle size={56} className="text-emerald-400" />
                </motion.div>
                <p className="text-white font-display text-xl">You're in the Mosaic!</p>
                <p className="text-white/50 text-sm text-center font-body">
                  Your slot is permanently claimed on Ritual Chain. Your circle is now orbiting the mosaic!
                </p>
                <div className="w-16 h-16 rounded-full overflow-hidden border-2 border-white/20 bg-white/5">
                  {photoMode === "x" && cleanHandle ? (
                    <img src={xAvatarUrl} alt="Your avatar" className="w-full h-full object-cover" />
                  ) : pfpPreview ? (
                    <img src={pfpPreview} alt="Your PFP" className="w-full h-full object-cover" />
                  ) : null}
                </div>
                <button onClick={onClose}
                  className="mt-2 px-8 py-3 bg-white text-[#06503A] font-bold rounded-xl hover:bg-white/90 transition-colors font-body">
                  View in Mosaic
                </button>
              </div>
            )}
          </div>
        </motion.div>
      </motion.div>
    </AnimatePresence>
  );
}
