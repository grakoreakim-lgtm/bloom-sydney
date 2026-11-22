#!/usr/bin/env python3
"""Generate original, license-free background tracks for the tutorials (no samples, no third-party music).

    python3 assets/bgm/generate.py      # writes 01-*.mp3 … 05-*.mp3 next to this file

Each track: soft pad chords + gentle plucked arpeggio + round sine bass, light reverb, built to loop
seamlessly (the reverb tail is wrapped back onto the start). Mixed quietly; mux.js ducks it under the voice.
"""
import os
import subprocess
import numpy as np

SR = 44100
HERE = os.path.dirname(os.path.abspath(__file__))
rng = np.random.default_rng(7)

NOTE = {n: i for i, n in enumerate(['C', 'C#', 'D', 'D#', 'E', 'F', 'F#', 'G', 'G#', 'A', 'A#', 'B'])}


def hz(name, octave):
    return 440.0 * 2 ** ((NOTE[name] + 12 * (octave + 1) - 69) / 12)


def chord(root, quality, octave=3):
    steps = {'maj7': [0, 4, 7, 11], 'm7': [0, 3, 7, 10], 'add9': [0, 4, 7, 14], 'm9': [0, 3, 7, 14], 'sus2': [0, 2, 7, 12], 'maj': [0, 4, 7, 12]}[quality]
    base = NOTE[root] + 12 * (octave + 1)
    return [440.0 * 2 ** ((base + s - 69) / 12) for s in steps]


def env(n, a, r):
    e = np.ones(n)
    ai, ri = int(a * SR), int(r * SR)
    if ai: e[:ai] = np.linspace(0, 1, ai)
    if ri: e[-ri:] *= np.linspace(1, 0, ri)
    return e


def lowpass(x, cutoff):
    a = np.exp(-2 * np.pi * cutoff / SR)
    y = np.empty_like(x); acc = 0.0
    for i in range(len(x)):  # simple one-pole, fine for a few minutes of audio
        acc = (1 - a) * x[i] + a * acc; y[i] = acc
    return y


def pad(freqs, dur):
    n = int(dur * SR); t = np.arange(n) / SR; out = np.zeros(n)
    for f in freqs:
        for det in (-0.12, 0.0, 0.11):  # slightly detuned for warmth
            ph = rng.uniform(0, 2 * np.pi)
            ff = f * 2 ** (det / 12)
            out += np.sin(2 * np.pi * ff * t + ph) + 0.25 * np.sin(4 * np.pi * ff * t + ph)
    return out / (len(freqs) * 3) * env(n, dur * 0.35, dur * 0.35)


def pluck(f, dur):
    n = int(dur * SR); period = max(2, int(SR / f))
    buf = rng.uniform(-1, 1, period); out = np.empty(n)
    for i in range(n):  # Karplus-Strong
        out[i] = buf[i % period]
        buf[i % period] = 0.5 * (buf[i % period] + buf[(i + 1) % period]) * 0.996
    return out * env(n, 0.005, min(0.3, dur * 0.5))


def bass(f, dur):
    n = int(dur * SR); t = np.arange(n) / SR
    return np.sin(2 * np.pi * f * t) * env(n, 0.02, dur * 0.6)


def reverb(x, mix=0.28):
    y = np.zeros(len(x))
    for d, g in ((0.0297, 0.78), (0.0371, 0.76), (0.0411, 0.74), (0.0437, 0.72)):
        k = int(d * SR); buf = np.zeros(len(x))
        for i in range(k, len(x)):
            buf[i] = x[i - k] + g * buf[i - k]
        y += buf
    return (1 - mix) * x + mix * y / 4


def track(prog, bpm, bars_per_chord, arp_pattern, cutoff, seconds=96):
    beat = 60 / bpm; bar = 4 * beat
    total = int(seconds * SR)
    mix = np.zeros(total + int(4 * SR))
    pos = 0.0; ci = 0
    while pos < seconds:
        root, q = prog[ci % len(prog)]
        dur = bars_per_chord * bar
        s = int(pos * SR)
        fr = chord(root, q)
        p = pad(fr, dur + 1.0) * 0.55
        mix[s:s + len(p)] += p[:len(mix) - s]
        b = bass(hz(root, 2), dur * 0.95) * 0.35
        mix[s:s + len(b)] += b[:len(mix) - s]
        arp = [fr[i % len(fr)] * 2 for i in arp_pattern]
        step = beat / 2
        for k in range(int(dur / step)):
            if arp[k % len(arp)] is None: continue
            pl = pluck(arp[k % len(arp)], step * 3) * 0.22
            o = s + int(k * step * SR)
            mix[o:o + len(pl)] += pl[:max(0, len(mix) - o)]
        pos += dur; ci += 1
    mix = lowpass(mix, cutoff)
    mix = reverb(mix)
    loop = mix[:total].copy()
    tail = mix[total:]
    loop[:len(tail)] += tail[:len(loop)]  # wrap the tail onto the start → seamless loop
    loop /= np.max(np.abs(loop)) + 1e-9
    return (loop * 0.6).astype(np.float32)


TRACKS = [
    ('01-morning-gate', [('C', 'maj7'), ('A', 'm7'), ('F', 'maj7'), ('G', 'add9')], 76, 1, [0, 1, 2, 3, 2, 1, 2, 3], 3200),
    ('02-window-seat', [('D', 'm9'), ('G', 'add9'), ('C', 'maj7'), ('A', 'm7')], 72, 1, [0, 2, 1, 3, 0, 2, 1, 3], 2800),
    ('03-quiet-terminal', [('F', 'maj7'), ('E', 'm7'), ('D', 'm7'), ('C', 'add9')], 68, 2, [0, 1, 2, 3, 3, 2, 1, 2], 2600),
    ('04-boarding-soon', [('G', 'maj7'), ('E', 'm9'), ('C', 'maj7'), ('D', 'sus2')], 84, 1, [0, 2, 3, 2, 1, 2, 3, 2], 3600),
    ('05-easy-checkin', [('A', 'm9'), ('F', 'maj7'), ('C', 'add9'), ('G', 'maj')], 80, 1, [0, 1, 2, 1, 3, 1, 2, 1], 3000),
]

if __name__ == '__main__':
    for name, prog, bpm, bpc, arp, cutoff in TRACKS:
        x = track(prog, bpm, bpc, arp, cutoff)
        stereo = np.stack([x, np.roll(x, int(0.012 * SR))], axis=1)  # tiny Haas widening
        raw = (np.clip(stereo, -1, 1) * 32767).astype('<i2').tobytes()
        out = os.path.join(HERE, f'{name}.mp3')
        subprocess.run(['ffmpeg', '-y', '-loglevel', 'error', '-f', 's16le', '-ar', str(SR), '-ac', '2', '-i', '-',
                        '-af', 'loudnorm=I=-20:TP=-2', '-c:a', 'libmp3lame', '-b:a', '160k', out], input=raw, check=True)
        print('wrote', out)
