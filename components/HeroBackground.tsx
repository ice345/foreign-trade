"use client";

import { motion } from "framer-motion";

export default function HeroBackground() {
  return (
    <div className="pointer-events-none absolute inset-0 -z-10 overflow-hidden rounded-[32px]">
      <video
        className="absolute inset-0 h-full w-full object-cover opacity-20"
        autoPlay
        muted
        loop
        playsInline
        poster="https://images.unsplash.com/photo-1446776811953-b23d57bd21aa"
        src="/hero.mp4"
      />
      <div className="absolute inset-0 bg-gradient-to-b from-black/30 via-black/70 to-background" />
      <div className="absolute inset-0 bg-[radial-gradient(circle_at_top,rgba(99,102,241,0.25),transparent_55%)]" />
      <motion.div
        className="hero-orb -left-24 top-10 h-64 w-64 bg-accent/30"
        animate={{ y: [0, 30, 0], x: [0, 20, 0] }}
        transition={{ duration: 12, repeat: Infinity, ease: "easeInOut" }}
      />
      <motion.div
        className="hero-orb right-0 top-20 h-72 w-72 bg-highlight/25"
        animate={{ y: [0, -20, 0], x: [0, -30, 0] }}
        transition={{ duration: 16, repeat: Infinity, ease: "easeInOut" }}
      />
      <motion.div
        className="hero-orb bottom-0 left-1/3 h-80 w-80 bg-fuchsia-500/15"
        animate={{ y: [0, 25, 0], x: [0, 15, 0] }}
        transition={{ duration: 18, repeat: Infinity, ease: "easeInOut" }}
      />
    </div>
  );
}
