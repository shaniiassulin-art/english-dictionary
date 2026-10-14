"""Generate the recorded English audio the app plays.

    python3 tools/gen_audio.py w   # words      -> audio/w/<fnv(english)>.mp3
    python3 tools/gen_audio.py s   # sentences  -> audio/s/<fnv(sentence)>.mp3

Only missing files are created, so re-run after adding words or sentences.
Needs: pip install kokoro-onnx soundfile; ffmpeg; and in $KOKORO_DIR the files
kokoro-v1.0.onnx and voices-v1.0.bin from
https://github.com/thewh1teagle/kokoro-onnx/releases/tag/model-files-v1.0
"""
import sys, json, os, subprocess, time
sys.path.insert(0, os.path.dirname(os.path.abspath(__file__)))
from audio_util import fnv, spoken_word
from kokoro_onnx import Kokoro
import soundfile as sf

ROOT = os.path.dirname(os.path.dirname(os.path.abspath(__file__)))
MODEL = os.environ.get('KOKORO_DIR', '/tmp/claude-0/tts')
kind = sys.argv[1]
OUT = f'{ROOT}/audio/{kind}'
os.makedirs(OUT, exist_ok=True)

jobs = {}
for r in json.load(open(f'{ROOT}/src/words.json')):
    if kind == 'w':
        jobs[fnv(r[0])] = spoken_word(r[0])
    else:
        for s in (r[3] if isinstance(r[3], list) else [r[3]]):
            jobs[fnv(s)] = s

k = Kokoro(f'{MODEL}/kokoro-v1.0.onnx', f'{MODEL}/voices-v1.0.bin')
tmp = f'{MODEL}/tmp_{kind}.wav'
trim = ('silenceremove=start_periods=1:start_threshold=-50dB,areverse,'
        'silenceremove=start_periods=1:start_threshold=-50dB,areverse,apad=pad_dur=0.15')
n, t = 0, time.time()
for h, text in jobs.items():
    f = f'{OUT}/{h}.mp3'
    if os.path.exists(f):
        continue
    samples, sr = k.create(text, voice='af_heart', speed=0.9 if kind == 'w' else 0.95, lang='en-us')
    sf.write(tmp, samples, sr)
    subprocess.run(['ffmpeg', '-y', '-loglevel', 'error', '-i', tmp, '-af', trim,
                    '-ac', '1', '-ar', '22050', '-b:a', '24k', f + '.part.mp3'], check=True)
    os.replace(f + '.part.mp3', f)
    n += 1
    if n % 100 == 0:
        print(n, len(jobs), round(time.time() - t), flush=True)
print('done', n, len(jobs), flush=True)
