"use client";

import { useEffect, useRef, useState } from "react";
import { initLivePainting, type TextureSettings } from "@/lib/live-painting";
import Link from "next/link";
import { TextureLab, loadTexture } from "./texture-lab";
import { SiteHeader } from "./site-header";

const SHOW_LAB = process.env.NODE_ENV === "development";

export default function HomePage() {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const fallbackRef = useRef<HTMLDivElement>(null);
  const pauseRef = useRef<HTMLButtonElement>(null);
  const [texture, setTexture] = useState<TextureSettings | null>(null);

  useEffect(() => {
    const canvas = canvasRef.current;
    const fallback = fallbackRef.current;
    const pause = pauseRef.current;
    if (!canvas || !fallback || !pause) return;
    const t = SHOW_LAB ? loadTexture() : undefined;
    if (t) setTexture(t);
    return initLivePainting(canvas, fallback, pause, t);
  }, []);

  return (
    <>
      <canvas ref={canvasRef} aria-hidden="true" />
      <div className="scrim" />
      <div className="page">
        <SiteHeader />
        <div />
        <div className="bottom">
          <main className="hero">
            <h1>The digital home for professional artists.</h1>
            <p className="lede">
              A portfolio you shape yourself, and a network that connects you
              with galleries and curators by context, not popularity.
            </p>
            <div className="actions">
              <Link className="btn btn-primary" href="/coming-soon#portfolios">
                Create your portfolio
              </Link>
              <Link className="btn btn-secondary" href="/coming-soon#discover">
                Find artists
              </Link>
            </div>
          </main>
          <figure className="label">
            <p className="label-title">Untitled, painting now</p>
            <p className="label-meta">
              Pigment carried by a live current and remembered by the surface.
              It began when you arrived and has never looked like this before.
            </p>
            <button className="pause" ref={pauseRef} type="button">
              Pause the painting
            </button>
          </figure>
        </div>
      </div>
      {texture && <TextureLab texture={texture} />}
      <div className="fallback" ref={fallbackRef} />
    </>
  );
}
