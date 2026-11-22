#!/usr/bin/env python3
"""Two melodic background tracks, synthesized here (no recordings or samples are used):

  06-canon-in-d.mp3   our own arrangement of Pachelbel's Canon in D (composed c.1700, public domain)
  07-autumn-waltz.mp3 an ORIGINAL 3/4 waltz with a warm, nostalgic autumn mood (own melody and chords;
                      inspired only by the general feel of Korean autumn ballads, no melody is copied)

    python3 assets/bgm/generate_melodic.py
"""
import os
import subprocess
import numpy as np
from generate import SR, NOTE, reverb, lowpass, env

HERE = os.path.dirname(os.path.abspath(__file__))


FLAT = {'Bb': 'A#', 'Eb': 'D#', 'Ab': 'G#', 'Db': 'C#', 'Gb': 'F#'}


def f(note):  # 'F#5' / 'Bb4' → Hz
    name, octv = note[:-1], int(note[-1])
    name = FLAT.get(name, name)
    return 440.0 * 2 ** ((NOTE[name] + 12 * (octv + 1) - 69) / 12)


def piano(freq, dur, vel=1.0):
    """Soft electric-piano-ish tone: a few decaying harmonics with a gentle attack."""
    n = int((dur + 1.2) * SR); t = np.arange(n) / SR
    tone = np.zeros(n)
    for k, (amp, dec) in enumerate(((1.0, 1.6), (0.45, 2.4), (0.22, 3.2), (0.10, 4.5)), start=1):
        tone += amp * np.sin(2 * np.pi * freq * k * t) * np.exp(-dec * t / max(0.6, dur))
    tone *= np.minimum(1, t / 0.012)                      # attack
    rel = np.ones(n); off = int(dur * SR)
    rel[off:] = np.exp(-np.arange(n - off) / (0.25 * SR))  # release after note-off
    return tone * rel * vel * 0.35


def strings(freq, dur, vel=1.0):
    """Slow-bowed pad voice for sustained notes."""
    n = int((dur + 0.8) * SR); t = np.arange(n) / SR
    v = np.zeros(n)
    for det in (-0.08, 0.0, 0.07):
        ff = freq * 2 ** (det / 12)
        v += np.sin(2 * np.pi * ff * t) + 0.3 * np.sin(4 * np.pi * ff * t) + 0.12 * np.sin(6 * np.pi * ff * t)
    return v / 3 * env(n, min(0.35, dur * 0.4), 0.8) * vel * 0.22


def render(events, seconds, cutoff=4200, rev=0.3):
    """events: (instrument, note, start_sec, dur_sec, vel)"""
    total = int(seconds * SR); mix = np.zeros(total + 4 * SR)
    for inst, note, st, du, vel in events:
        x = inst(f(note), du, vel); s = int(st * SR)
        mix[s:s + len(x)] += x[:max(0, len(mix) - s)]
    mix = lowpass(mix, cutoff); mix = reverb(mix, rev)
    loop = mix[:total].copy(); tail = mix[total:]
    loop[:len(tail)] += tail[:len(loop)]                  # seamless loop
    loop /= np.max(np.abs(loop)) + 1e-9
    return (loop * 0.6).astype(np.float32)


def canon():
    bpm = 66; beat = 60 / bpm
    bass = ['D3', 'A2', 'B2', 'F#2', 'G2', 'D2', 'G2', 'A2']          # the famous ground bass (2 beats each)
    chords = [['D4', 'F#4', 'A4'], ['A3', 'C#4', 'E4'], ['B3', 'D4', 'F#4'], ['F#3', 'A3', 'C#4'],
              ['G3', 'B3', 'D4'], ['D4', 'F#4', 'A4'], ['G3', 'B3', 'D4'], ['A3', 'C#4', 'E4']]
    # upper-voice variations (note, beats) — Pachelbel's lines, re-voiced for a soft piano
    v1 = [(n, 2) for n in ['F#5', 'E5', 'D5', 'C#5', 'B4', 'A4', 'B4', 'C#5']]
    v2 = [(n, 2) for n in ['D5', 'C#5', 'B4', 'A4', 'G4', 'F#4', 'G4', 'E4']]
    v3 = [(n, 1) for n in ['D4', 'F#4', 'A4', 'G4', 'F#4', 'D4', 'F#4', 'E4', 'D4', 'B3', 'D4', 'A4', 'G4', 'B4', 'A4', 'G4']]
    v4 = [(n, 1) for n in ['F#4', 'D4', 'E4', 'C#5', 'D5', 'F#5', 'A5', 'A4', 'B4', 'G4', 'A4', 'F#4', 'D4', 'D5', 'D5', 'C#5']]
    v5 = [(n, 0.5) for n in ['D5', 'C#5', 'D5', 'D4', 'C#4', 'A4', 'E4', 'F#4', 'D4', 'D5', 'C#5', 'B4', 'C#5', 'F#5', 'A5', 'B5',
                             'G5', 'F#5', 'E5', 'G5', 'F#5', 'E5', 'D5', 'C#5', 'B4', 'A4', 'G4', 'F#4', 'E4', 'G4', 'F#4', 'E4']]
    plan = [None, v1, v2, v3, v4, v5, v1, v2]                            # 8 cycles of the ground
    ev = []; t = 0.0
    for cyc, voice in enumerate(plan):
        for i, b in enumerate(bass):
            st = t + i * 2 * beat
            ev.append((strings, b, st, 2 * beat, 0.9))
            for c in chords[i]:
                ev.append((strings, c, st, 2 * beat, 0.45))
        if voice:
            pos = t
            for note, beats in voice:
                ev.append((piano, note, pos, beats * beat * 0.95, 0.9)); pos += beats * beat
        t += 16 * beat
    return render(ev, t, cutoff=4600, rev=0.32)


def autumn_waltz():
    bpm = 132; beat = 60 / bpm                                          # 3/4, ~44 bars/min
    # original progression in B-flat major (2 bars per chord)
    prog = [('Bb', ['D4', 'F4', 'A4']), ('Gm', ['D4', 'G4', 'Bb4']), ('Eb', ['Eb4', 'G4', 'Bb4']), ('F', ['C4', 'F4', 'A4']),
            ('Dm', ['D4', 'F4', 'A4']), ('Gm', ['D4', 'G4', 'Bb4']), ('Cm', ['C4', 'Eb4', 'G4']), ('F', ['C4', 'Eb4', 'A4'])]
    roots = {'Bb': 'Bb2', 'Gm': 'G2', 'Eb': 'Eb2', 'F': 'F2', 'Dm': 'D3', 'Cm': 'C3'}
    # original melody: (note, beats); each line = 2 bars (6 beats) over one chord
    mel_a = [[('F5', 3), ('D5', 2), ('C5', 1)], [('D5', 2), ('Bb4', 1), ('G4', 3)], [('G4', 2), ('Bb4', 1), ('Eb5', 3)],
             [('D5', 2), ('C5', 1), ('A4', 3)], [('A4', 2), ('D5', 1), ('F5', 3)], [('G5', 2), ('F5', 1), ('D5', 3)],
             [('Eb5', 2), ('D5', 1), ('C5', 2), ('Bb4', 1)], [('A4', 3), ('C5', 3)]]
    mel_b = [[('D5', 2), ('F5', 1), ('Bb5', 3)], [('A5', 2), ('G5', 1), ('D5', 3)], [('Eb5', 2), ('G5', 1), ('Bb5', 2), ('G5', 1)],
             [('F5', 3), ('Eb5', 2), ('C5', 1)], [('D5', 2), ('F5', 1), ('A5', 3)], [('Bb5', 2), ('A5', 1), ('G5', 3)],
             [('G5', 2), ('Eb5', 1), ('C5', 2), ('Eb5', 1)], [('D5', 4), ('C5', 2)]]
    ev = []; t = 0.0
    for section in (None, mel_a, mel_b, mel_a, None):                   # intro, A, B, A, outro
        for i, (name, ch) in enumerate(prog):
            for bar in range(2):
                b0 = t + (i * 2 + bar) * 3 * beat
                ev.append((piano, roots[name], b0, 2.6 * beat, 0.8))     # oom
                for k in (1, 2):                                        # pah pah
                    for c in ch:
                        ev.append((piano, c, b0 + k * beat, 0.8 * beat, 0.32))
            if section:
                pos = t + i * 6 * beat
                for note, beats in section[i]:
                    ev.append((piano, note, pos, beats * beat * 0.95, 0.85))
                    ev.append((strings, note, pos, beats * beat, 0.35))  # soft string doubling
                    pos += beats * beat
        t += len(prog) * 6 * beat
    return render(ev, t, cutoff=4000, rev=0.34)


def save(x, name):
    stereo = np.stack([x, np.roll(x, int(0.012 * SR))], axis=1)
    raw = (np.clip(stereo, -1, 1) * 32767).astype('<i2').tobytes()
    out = os.path.join(HERE, f'{name}.mp3')
    subprocess.run(['ffmpeg', '-y', '-loglevel', 'error', '-f', 's16le', '-ar', str(SR), '-ac', '2', '-i', '-',
                    '-af', 'loudnorm=I=-20:TP=-2', '-c:a', 'libmp3lame', '-b:a', '160k', out], input=raw, check=True)
    print('wrote', out)


if __name__ == '__main__':
    save(canon(), '06-canon-in-d')
    save(autumn_waltz(), '07-autumn-waltz')
