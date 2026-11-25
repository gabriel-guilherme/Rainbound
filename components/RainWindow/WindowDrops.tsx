"use client";

import { motion } from "motion/react";
import NoSsr from "../common/NoSsr";

const drops = Array.from({ length: 25 }, (_, i) => ({
  id: i,
  left: Math.random() * 100,
  top: Math.random() * 80,
  size: 2 + Math.random() * 4,
  delay: Math.random() * 5,
  distance: 30 + Math.random() * 100,
  duration: 2 + Math.random() * 3,
}));

export default function WindowDrops({ isPaused }: { isPaused: boolean }) {
  return (
    <NoSsr>
      {!isPaused && (
        <div className="pointer-events-none absolute inset-0 overflow-hidden">
          {drops.map((drop) => (
            <motion.div
              key={drop.id}
              className="absolute rounded-full bg-gradient-to-br from-white/[1] shadow-lg backdrop-filter backdrop-blur-md"
              style={{
                left: `${drop.left}%`,
                top: `${drop.top}%`,
                width: drop.size,
                height: drop.size * 1.5,
              }}
              animate={{
                y: [0, 0, drop.distance],
                scale: [0, 1, 1.1],
                opacity: [0, 0.4, 0],
              }}
              transition={{
                duration: drop.duration,
                delay: drop.delay,
                repeat: Infinity,
                ease: "easeIn",
              }}
            />
          ))}
        </div>
      )}
    </NoSsr>
  );
}
