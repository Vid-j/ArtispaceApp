"use client";

import { useState } from "react";
import { TEXTURE_PRESETS, type TextureSettings } from "@/lib/live-painting";

const STORE = "artispace-texture";

const CONTROLS: { key: keyof TextureSettings; label: string; max: number; step: number }[] = [
  { key: "speckle", label: "Bristle streaks", max: 0.6, step: 0.01 },
  { key: "sharpen", label: "Sharpen", max: 1.2, step: 0.05 },
  { key: "soften", label: "Soften", max: 6, step: 0.1 },
  { key: "edge", label: "Crisp edges", max: 1, step: 0.05 },
  { key: "relief", label: "Relief", max: 8, step: 0.1 },
  { key: "gloss", label: "Gloss", max: 2, step: 0.05 },
  { key: "weave", label: "Linen weave", max: 2, step: 0.05 },
  { key: "grain", label: "Grain", max: 0.25, step: 0.005 },
  { key: "misreg", label: "Riso offset", max: 8, step: 0.1 },
  { key: "calm", label: "Calm flow", max: 1, step: 0.05 }
];

export function loadTexture(): TextureSettings {
  try {
    const saved = localStorage.getItem(STORE);
    if (saved) return { ...TEXTURE_PRESETS.artispace, ...JSON.parse(saved) };
  } catch {}
  return { ...TEXTURE_PRESETS.artispace };
}

// Dev-only panel: edits the live texture object the painting reads every frame.
export function TextureLab({ texture }: { texture: TextureSettings }) {
  const [open, setOpen] = useState(() => window.innerWidth > 640);
  const [, rerender] = useState(0);
  const [copied, setCopied] = useState(false);

  function apply(next: Partial<TextureSettings>) {
    Object.assign(texture, next);
    try {
      localStorage.setItem(STORE, JSON.stringify(texture));
    } catch {}
    rerender((n) => n + 1);
  }

  const active = Object.entries(TEXTURE_PRESETS).find(([, p]) =>
    (Object.keys(p) as (keyof TextureSettings)[]).every((k) => Math.abs(p[k] - texture[k]) < 1e-6)
  )?.[0];

  return (
    <aside className="lab" aria-label="Texture lab">
      <button className="lab-toggle" type="button" onClick={() => setOpen(!open)} aria-expanded={open}>
        Texture lab {open ? "–" : "+"}
      </button>
      {open && (
        <>
          <div className="lab-presets">
            {Object.keys(TEXTURE_PRESETS).map((name) => (
              <button
                key={name}
                type="button"
                className={name === active ? "on" : undefined}
                onClick={() => apply(TEXTURE_PRESETS[name])}
              >
                {name}
              </button>
            ))}
          </div>
          {CONTROLS.map((c) => (
            <label key={c.key} className="lab-row">
              <span>{c.label}</span>
              <input
                type="range"
                min={0}
                max={c.max}
                step={c.step}
                value={texture[c.key]}
                onChange={(e) => apply({ [c.key]: Number(e.target.value) })}
              />
              <output>{texture[c.key].toFixed(2)}</output>
            </label>
          ))}
          <button
            type="button"
            className="lab-copy"
            onClick={() => {
              navigator.clipboard?.writeText(JSON.stringify(texture));
              setCopied(true);
              setTimeout(() => setCopied(false), 1200);
            }}
          >
            {copied ? "Copied" : "Copy settings"}
          </button>
          <p className="lab-note">Streaks and calm flow repaint over ~15s; the rest is instant.</p>
        </>
      )}
    </aside>
  );
}
