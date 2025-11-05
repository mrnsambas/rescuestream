import React, { useEffect } from 'react';

export function Alerts({ trigger }: { trigger: number }) {
  useEffect(() => {
    if (!trigger) return;
    try {
      const ctx = new (window.AudioContext || (window as any).webkitAudioContext)();
      const o = ctx.createOscillator();
      const g = ctx.createGain();
      o.type = 'sine';
      o.frequency.value = 880; // A5
      o.connect(g);
      g.connect(ctx.destination);
      g.gain.setValueAtTime(0.2, ctx.currentTime);
      o.start();
      o.stop(ctx.currentTime + 0.15);
    } catch {}
  }, [trigger]);
  return null;
}


