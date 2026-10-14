"""Shared helpers for the pre-recorded audio files (audio/w, audio/s).
File name = FNV-1a 32-bit hash (hex) of the exact text shown in the app; the app computes the same hash."""
import re

def fnv(s):
    h = 0x811c9dc5
    for ch in s:
        h ^= ord(ch)
        h = (h * 0x01000193) & 0xffffffff
    return format(h, '08x')

def spoken_word(e):
    e = e.replace('…', '...')
    m = re.match(r'^(\d+\w*) - (\w+)$', e) or re.match(r'^(\w+) - \d+\w*$', e)
    if m:
        return m.group(2) if e[0].isdigit() else m.group(1)
    special = {'i.e.': 'I.E.', 'e.g.': 'E.G.', 'begin/an/un': 'begin, began, begun'}
    if e in special:
        return special[e]
    e = re.sub(r'\s*\((\w+)\)', r', \1', e)          # die (dice) -> die, dice
    e = e.replace('...', ',').replace(' ,', ',')
    return e.strip(' ,')
