"use client";

import { useState, useEffect } from "react";

class SoundManager {
  private audioCtx: AudioContext | null = null;
  private enabled = false;

  private getCtx(): AudioContext | null {
    if (!this.audioCtx) {
      try {
        this.audioCtx = new (window.AudioContext || (window as any).webkitAudioContext)();
      } catch {
        return null;
      }
    }
    return this.audioCtx;
  }

  enable() {
    this.enabled = true;
    const ctx = this.getCtx();
    if (ctx && ctx.state === "suspended") {
      ctx.resume();
    }
  }

  disable() {
    this.enabled = false;
  }

  isEnabled() {
    return this.enabled;
  }

  playShuffle() {
    if (!this.enabled) return;
    const ctx = this.getCtx();
    if (!ctx) return;
    try {
      for (let i = 0; i < 5; i++) {
        const osc = ctx.createOscillator();
        const gain = ctx.createGain();
        osc.type = "sine";
        osc.frequency.value = 100 + Math.random() * 200;
        gain.gain.value = 0.03;
        osc.connect(gain);
        gain.connect(ctx.destination);
        const t = ctx.currentTime + i * 0.1;
        osc.start(t);
        osc.stop(t + 0.08);
      }
    } catch {
      // ignore audio errors
    }
  }

  playFlip() {
    if (!this.enabled) return;
    const ctx = this.getCtx();
    if (!ctx) return;
    try {
      const osc = ctx.createOscillator();
      const gain = ctx.createGain();
      osc.type = "triangle";
      osc.frequency.value = 600;
      osc.frequency.exponentialRampToValueAtTime(200, ctx.currentTime + 0.15);
      gain.gain.value = 0.05;
      gain.gain.exponentialRampToValueAtTime(0.001, ctx.currentTime + 0.15);
      osc.connect(gain);
      gain.connect(ctx.destination);
      osc.start();
      osc.stop(ctx.currentTime + 0.15);
    } catch {
      // ignore audio errors
    }
  }

  playReveal() {
    if (!this.enabled) return;
    const ctx = this.getCtx();
    if (!ctx) return;
    try {
      const osc = ctx.createOscillator();
      const gain = ctx.createGain();
      osc.type = "sine";
      osc.frequency.value = 440;
      osc.frequency.exponentialRampToValueAtTime(880, ctx.currentTime + 0.3);
      gain.gain.value = 0.04;
      gain.gain.exponentialRampToValueAtTime(0.001, ctx.currentTime + 0.4);
      osc.connect(gain);
      gain.connect(ctx.destination);
      osc.start();
      osc.stop(ctx.currentTime + 0.4);
    } catch {
      // ignore audio errors
    }
  }

  playAmbient() {
    if (!this.enabled) return;
    const ctx = this.getCtx();
    if (!ctx) return;
    try {
      const bufferSize = ctx.sampleRate * 2;
      const buffer = ctx.createBuffer(1, bufferSize, ctx.sampleRate);
      const data = buffer.getChannelData(0);
      for (let i = 0; i < bufferSize; i++) {
        data[i] = (Math.random() * 2 - 1) * 0.005;
      }
      const source = ctx.createBufferSource();
      source.buffer = buffer;
      source.loop = true;
      const filter = ctx.createBiquadFilter();
      filter.type = "lowpass";
      filter.frequency.value = 200;
      const gain = ctx.createGain();
      gain.gain.value = 0.1;
      source.connect(filter);
      filter.connect(gain);
      gain.connect(ctx.destination);
      source.start();
      this._ambientSource = source;
    } catch {
      // ignore
    }
  }

  stopAmbient() {
    try {
      if (this._ambientSource) {
        this._ambientSource.stop();
        this._ambientSource = null;
      }
    } catch {
      // ignore
    }
  }

  private _ambientSource: AudioBufferSourceNode | null = null;
}

const soundManager = new SoundManager();

export function useSound(enabled: boolean) {
  useEffect(() => {
    if (enabled) {
      soundManager.enable();
      soundManager.playAmbient();
    } else {
      soundManager.disable();
      soundManager.stopAmbient();
    }
  }, [enabled]);

  return {
    shuffle: () => soundManager.playShuffle(),
    flip: () => soundManager.playFlip(),
    reveal: () => soundManager.playReveal(),
  };
}
