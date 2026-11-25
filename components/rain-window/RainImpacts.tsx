"use client";

import { motion } from "motion/react";
import NoSsr from "../common/NoSsr";

const impacts = Array.from({ length: 40 }, (_, i) => ({
  id: i,
  left: Math.random() * 100,
  top: Math.random() * 100,
  delay: Math.random() * 4,
  size: 1 + Math.random() * 5,
  repeatDelay: 2 + Math.random() * 3,
}));

export default function RainImpacts({ isPaused }: { isPaused: boolean }) {
  return (
    <NoSsr>
      {!isPaused && (
        <div className="pointer-events-none absolute inset-0 overflow-hidden">
          {impacts.map((impact) => (
            <motion.div
              key={impact.id}
              className="absolute rounded-full bg-gradient-to-br from-white/[1] shadow-lg backdrop-filter backdrop-blur-md"
              style={{
                left: `${impact.left}%`,
                top: `${impact.top}%`,
                width: impact.size,
                height: impact.size,
              }}
              animate={{
                scale: [0, 1.5, 0],
                opacity: [0, 0.5, 0],
              }}
              transition={{
                duration: 0.35,
                delay: impact.delay,
                repeat: Infinity,
                repeatDelay: impact.repeatDelay,
                ease: "easeOut",
              }}
            />
          ))}
        </div>
      )}
    </NoSsr>
  );
}
