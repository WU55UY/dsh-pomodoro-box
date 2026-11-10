#!/usr/bin/env python3
"""Render the README preview GIF from the plugin's real source.

Nothing here is hand-drawn. The page loads this repository's client.js,
executes its real factory with a tiny React/DOM shim, and renders the real
PomodoroDock, PomodoroBox and CollectionGrid components with the real CSS,
real locale strings, real SVG icons and the real Harness theme tokens
extracted from app.asar (body[data-ds-light-theme]).

The GIF is a three-shot cut, all from those components:

  1. the composer dock counting down (real ring progress + clock),
  2. two blind boxes opening, epic then legendary, with the shipped
     shake / lid / item / spark keyframes frozen frame by frame,
  3. the real collection gallery lighting up the two items just found.

Only presentation-layer wrappers are added (canvas size, a container for
the gallery, scale/position); no component CSS or product code is changed.

Usage: python3 tools/render-preview.py [--out docs/preview.gif]
Requires: macOS + Microsoft Edge + Pillow (pip install Pillow).
"""
from __future__ import annotations

import argparse
import concurrent.futures
import os
import pathlib
import subprocess
import sys
import tempfile
import threading

ROOT = pathlib.Path(__file__).resolve().parent.parent
BUILD = ROOT / "build" / "preview-frames"
EDGE = "/Applications/Microsoft Edge.app/Contents/MacOS/Microsoft Edge"
WIDTH, HEIGHT = 680, 560

# Static palette + both alias tables, copied verbatim from the host app.asar.
THEME_CSS = """
:root{
  --dsw-static-neutral-bluish-00:#fff;
  --dsw-static-neutral-bluish-50:#f9fafb;
  --dsw-static-neutral-bluish-150:#e9ecf2;
  --dsw-static-neutral-bluish-300:#cfd3d6;
  --dsw-static-neutral-bluish-700:#61666b;
  --dsw-static-neutral-bluish-850:#2c2c2e;
  --dsw-static-neutral-bluish-875:#232324;
  --dsw-static-neutral-bluish-950:#151517;
  --dsw-static-neutral-bluish-1000:#0f1115;
  --dsw-static-green-500:#22c55e;
}
body[data-ds-light-theme]{
  --dsw-alias-bg-base:var(--dsw-static-neutral-bluish-00);
  --dsw-alias-bg-overlay:var(--dsw-static-neutral-bluish-150);
  --dsw-alias-bg-layer-1:var(--dsw-static-neutral-bluish-00);
  --dsw-alias-bg-layer-2:var(--dsw-static-neutral-bluish-00);
  --dsw-alias-label-primary:var(--dsw-static-neutral-bluish-1000);
  --dsw-alias-label-secondary:var(--dsw-static-neutral-bluish-700);
  --dsw-alias-border-l1:#0000000a;
  --dsw-alias-border-l2:#0000001a;
  --dsw-alias-brand-primary:var(--dsw-static-neutral-bluish-1000);
  --dsw-alias-state-success-primary:var(--dsw-static-green-500);
}
body[data-ds-dark-theme]{
  --dsw-alias-bg-base:var(--dsw-static-neutral-bluish-950);
  --dsw-alias-bg-overlay:var(--dsw-static-neutral-bluish-700);
  --dsw-alias-bg-layer-1:var(--dsw-static-neutral-bluish-875);
  --dsw-alias-bg-layer-2:var(--dsw-static-neutral-bluish-850);
  --dsw-alias-label-primary:var(--dsw-static-neutral-bluish-50);
  --dsw-alias-label-secondary:var(--dsw-static-neutral-bluish-300);
  --dsw-alias-border-l1:#ffffff0f;
  --dsw-alias-border-l2:#ffffff1f;
  --dsw-alias-brand-primary:var(--dsw-static-neutral-bluish-50);
  --dsw-alias-state-success-primary:var(--dsw-static-green-500);
}
html,body{margin:0;padding:0;height:100%;overflow:hidden;}
body{
  background:var(--dsw-alias-bg-base);
  color:var(--dsw-alias-label-primary);
  font-family:-apple-system,BlinkMacSystemFont,"PingFang SC","Microsoft YaHei","Segoe UI",sans-serif;
  -webkit-font-smoothing:antialiased;
}
/* Presentation wrappers only: the plugin components inside are untouched. */
#dockHost{position:absolute;left:0;right:0;bottom:30px;display:flex;justify-content:center;z-index:1;}
#dockHost .dshPomo_dock{
  background:var(--dsw-alias-bg-overlay);
  border:1px solid var(--dsw-alias-border-l1);
  border-radius:12px;padding:5px 9px;
  box-shadow:0 10px 30px rgba(0,0,0,.16);
}
body.scene-dock #dockHost{top:50%;bottom:auto;transform:translateY(-50%) scale(1.55);}
body.scene-box #dockHost{z-index:90;opacity:.6;}
#galleryHost{display:none;}
body.scene-gallery #galleryHost{
  display:block;position:absolute;left:50%;top:44%;transform:translate(-50%,-50%);
  width:380px;box-sizing:border-box;padding:14px 16px;border-radius:16px;
  background:var(--dsw-alias-bg-overlay);
  border:1px solid var(--dsw-alias-border-l1);
  box-shadow:0 20px 60px rgba(0,0,0,.20);
}
body.scene-gallery #dockHost{bottom:26px;}
body.scene-dockshot #dockHost{bottom:26px;}
"""

MOCK_JS = r"""
(function () {
  const SVGNS = 'http://www.w3.org/2000/svg';
  const SVG_TAGS = new Set(['svg','circle','path','rect','line','g','defs','linearGradient','stop','ellipse','polygon','polyline']);
  const SVG_ATTRS = { viewBox:'viewBox', preserveAspectRatio:'preserveAspectRatio', gradientUnits:'gradientUnits' };

  function flat(list) {
    const out = [];
    for (const item of list) {
      if (Array.isArray(item)) out.push.apply(out, flat(item));
      else out.push(item);
    }
    return out;
  }

  window.__hookIndex = 0;
  window.__stateOverrides = [];

  const ReactMock = {
    createElement(type, props) {
      const kids = flat(Array.prototype.slice.call(arguments, 2));
      if (typeof type === 'function') {
        return type(Object.assign({}, props || {}, { children: kids }));
      }
      return { type: type, props: props || {}, children: kids };
    },
    useState(initial) {
      const i = window.__hookIndex++;
      const o = window.__stateOverrides;
      return [i < o.length && o[i] !== undefined ? o[i] : initial, function () {}];
    },
    useRef(initial) { return { current: initial }; },
    useEffect() { return undefined; },
  };

  window.__ModuleLoader__ = { load(spec) { window.__dshSpec = spec; } };
  window.__dshRequire = function (name) {
    if (name === 'react') return ReactMock;
    return {};
  };

  function build(v, parent, inSvg) {
    if (v === null || v === undefined || typeof v === 'boolean') return;
    if (Array.isArray(v)) { v.forEach(function (x) { build(x, parent, inSvg); }); return; }
    if (typeof v === 'string' || typeof v === 'number') {
      parent.appendChild(document.createTextNode(String(v)));
      return;
    }
    const tag = v.type;
    const svg = inSvg || SVG_TAGS.has(tag);
    const el = svg ? document.createElementNS(SVGNS, tag) : document.createElement(tag);
    const p = v.props || {};
    Object.keys(p).forEach(function (key) {
      const value = p[key];
      if (value === null || value === undefined || value === false) return;
      if (key === 'children' || key === 'key' || key === 'ref') return;
      if (typeof value === 'function' || key.slice(0, 2) === 'on') return;
      if (key === 'className') { el.setAttribute('class', value); return; }
      if (key === 'style') {
        if (typeof value === 'string') el.setAttribute('style', value);
        else Object.keys(value).forEach(function (sk) {
          if (sk.slice(0, 2) === '--') el.style.setProperty(sk, String(value[sk]));
          else el.style[sk] = String(value[sk]);
        });
        return;
      }
      let attr = SVG_ATTRS[key] || key;
      if (!SVG_ATTRS[key] && key.slice(0, 5) !== 'aria-' && key.slice(0, 5) !== 'data-') {
        attr = key.replace(/[A-Z]/g, function (m) { return '-' + m.toLowerCase(); });
      }
      el.setAttribute(attr, value === true ? 'true' : String(value));
    });
    v.children.forEach(function (child) { build(child, el, svg); });
    parent.appendChild(el);
  }

  // Pull a real sub-tree out of the real component tree (no re-creation).
  function findClass(v, name) {
    if (v === null || v === undefined || typeof v !== 'object') return null;
    if (Array.isArray(v)) {
      for (const item of v) { const hit = findClass(item, name); if (hit) return hit; }
      return null;
    }
    if (!v.props) return null;
    if (String(v.props.className || '').split(' ').indexOf(name) >= 0) return v;
    for (const child of v.children || []) {
      const hit = findClass(child, name);
      if (hit) return hit;
    }
    return null;
  }

  window.__dshRender = function (opts) {
    const plugin = window.__dshSpec.factory(window.__dshRequire);
    const captured = {};
    const ctx = {
      effect() {},
      locale: { register() {} },
      slots: {
        inject(name, fn) { captured[name] = fn(); },
        register(config, component) { return { config: config, component: component }; },
      },
    };
    plugin.apply(ctx);
    const Dock = captured['conversation.composer.dock'].component;
    const Box = captured['shell.overlay'].component;

    const ZH = window.__dshLocale;
    function t(key, vars) {
      let s = ZH[key] === undefined ? key : ZH[key];
      if (vars) Object.keys(vars).forEach(function (k) {
        s = s.split('{' + k + '}').join(String(vars[k]));
      });
      return s;
    }
    const noop = function () {};
    const settings = { focus:25, shortBreak:5, longBreak:15, focusMs:1500000, shortBreakMs:300000, longBreakMs:900000 };

    function snapshot(withPending) {
      return {
        phase: 'focus', status: opts.running ? 'running' : 'idle', hidden: false,
        remaining: opts.remaining, settings: settings,
        stats: { total: opts.total, boxes: opts.boxes, owned: opts.owned },
        pending: withPending ? {
          id: opts.boxes, itemId: opts.item, tier: opts.tier,
          newItem: true, openedAt: 0,
        } : null,
      };
    }
    function dockProps(snap) {
      return {
        t: t, usePomodoro: function (selector) { return selector(snap); },
        togglePomodoro: noop, pausePomodoro: noop, resumePomodoro: noop,
        skipPomodoro: noop, resetPomodoro: noop, setDuration: noop,
        showPomodoro: noop, hidePomodoro: noop,
      };
    }

    const dockHost = document.getElementById('dockHost');
    if (opts.scene === 'gallery') {
      // Open the real settings panel, then place its real gallery sub-tree.
      window.__hookIndex = 0;
      window.__stateOverrides = [true, opts.selected || null];
      const panelTree = Dock(dockProps(snapshot(false)));
      build(findClass(panelTree, 'dshPomo_gallery'), document.getElementById('galleryHost'), false);
      window.__hookIndex = 0;
      window.__stateOverrides = [false, null];
      build(Dock(dockProps(snapshot(false))), dockHost, false);
    } else {
      window.__hookIndex = 0;
      window.__stateOverrides = [false, null];
      // While a box is open, the real dock shows its pending "!" badge.
      build(Dock(dockProps(snapshot(opts.scene === 'box'))), dockHost, false);
    }

    if (opts.scene === 'box') {
      window.__hookIndex = 0;
      window.__stateOverrides = [];
      const boxSnap = snapshot(true);
      build(Box({
        t: t,
        usePomodoro: function (selector) { return selector(boxSnap); },
        devRevealed: opts.t >= 680,
        takePomodoro: noop, hidePomodoro: noop,
      }), document.body, false);

      // Freeze every shipped animation at the requested time. Scrim / card /
      // halo / burst / shake start when the card mounts; lid / vanish / item
      // / sparks start at the 680ms stage switch, as in the real component.
      document.body.offsetHeight;
      const globalNames = ['dshPomoFade', 'dshPomoCard', 'dshPomoHalo',
                           'dshPomoBurst', 'dshPomoShake'];
      const local = opts.t >= 680 ? opts.t - 680 : opts.t;
      document.getAnimations().forEach(function (anim) {
        anim.pause();
        const name = anim.animationName || '';
        anim.currentTime = Math.max(0, globalNames.indexOf(name) >= 0 ? opts.t : local);
      });
    }
    document.documentElement.setAttribute('data-ready', '1');
  };
})();
"""

FRAME_TEMPLATE = """<!doctype html>
<html lang="zh-CN"><head><meta charset="utf-8">
<title>dsh-pomodoro-box real preview</title>
<style>__THEME__</style>
<script>window.__dshLocale = __LOCALE__;</script>
<script>__MOCK__</script>
<script>__CLIENT__</script>
</head><body><div id="galleryHost"></div><div id="dockHost"></div>
<script>
(function () {
  const p = new URLSearchParams(location.hash.slice(1));
  const opts = {
    scene: p.get('scene') || 'box',
    theme: p.get('theme') || 'light',
    t: Number(p.get('t') || 0),
    item: p.get('item') || 'star',
    tier: p.get('tier') || 'legendary',
    owned: (p.get('owned') || '').split(',').filter(Boolean),
    selected: p.get('selected') || null,
    remaining: Number(p.get('remaining') || 1500000),
    boxes: Number(p.get('boxes') || 1),
    total: Number(p.get('total') || 1),
    running: p.get('running') === '1',
  };
  document.body.className = 'scene-' + opts.scene;
  document.body.setAttribute(opts.theme === 'light' ? 'data-ds-light-theme' : 'data-ds-dark-theme', '');
  try {
    window.__dshRender(opts);
  } catch (error) {
    const pre = document.createElement('pre');
    pre.style.cssText = 'color:#ff8080;font:12px monospace;white-space:pre-wrap;padding:8px;position:absolute;z-index:999';
    pre.textContent = (error && error.stack) || String(error);
    document.body.appendChild(pre);
  }
})();
</script>
</body></html>
"""


def build_html() -> pathlib.Path:
    client = (ROOT / "client.js").read_text(encoding="utf-8")
    locale = (ROOT / "locale" / "zh.json").read_text(encoding="utf-8")
    safe_client = client.replace("</script", "<\\/script")
    doc = (FRAME_TEMPLATE
           .replace("__THEME__", THEME_CSS)
           .replace("__LOCALE__", locale)
           .replace("__MOCK__", MOCK_JS)
           .replace("__CLIENT__", safe_client))
    BUILD.mkdir(parents=True, exist_ok=True)
    path = BUILD / "frame.html"
    path.write_text(doc, encoding="utf-8")
    return path


def shoot(args) -> pathlib.Path:
    index, query, frame_path, out_dir, width, height = args
    out = out_dir / ("f_%03d.png" % index)
    # One profile per worker thread, reused across runs: a thread never runs
    # two Edge processes at once, so there is no lock contention and no
    # per-frame profile junk left in the repository.
    profile = pathlib.Path(tempfile.gettempdir()) / (
        "dsh_pomo_edge_" + threading.current_thread().name.replace(" ", "_"))
    cmd = [
        EDGE, "--headless=new", "--no-sandbox", "--disable-gpu",
        "--disable-dev-shm-usage", "--disable-software-rasterizer",
        "--no-first-run", "--no-default-browser-check", "--disable-extensions",
        "--hide-scrollbars", "--force-device-scale-factor=1",
        "--window-size=%d,%d" % (width, height), "--virtual-time-budget=1200",
        "--user-data-dir=" + str(profile),
        "--screenshot=" + str(out),
        frame_path.as_uri() + "#" + query,
    ]
    proc = subprocess.run(cmd, capture_output=True, text=True, timeout=90)
    if not out.exists():
        raise RuntimeError("screenshot %d failed: %s" % (index, proc.stderr[-400:]))
    return out


def crop_to_content(im, background=(255, 255, 255), padding=14):
    from PIL import Image, ImageChops
    bg = Image.new("RGB", im.size, background)
    diff = ImageChops.difference(im, bg).convert("L")
    box = diff.point(lambda p: 255 if p > 6 else 0).getbbox()
    if box is None:
        return im
    return im.crop((max(0, box[0] - padding), max(0, box[1] - padding),
                    min(im.width, box[2] + padding), min(im.height, box[3] + padding)))


def q(**kwargs) -> str:
    return "&".join("%s=%s" % (key, value) for key, value in kwargs.items())


def make_shots():
    shots = []
    # Shot 1: the composer dock counting down (clock + ring both change).
    for i in range(6):
        shots.append(q(scene="dock", theme="light", running=1,
                       remaining=1500000 - i * 150000, owned="", boxes=0, total=0))
    # Shot 2: two blind boxes, epic then legendary.
    for item, tier, owned, boxes in [("crystal", "epic", "crystal", 1),
                                     ("star", "legendary", "crystal,star", 2)]:
        for i in range(12):
            shots.append(q(scene="box", theme="light", t=200 + i * 170,
                           item=item, tier=tier, owned=owned, boxes=boxes, total=boxes))
    # Shot 3: the real gallery lighting up the two finds.
    steps = ["", "crystal", "crystal,star", "crystal,star",
             "crystal,star", "crystal,star", "crystal,star", "crystal,star"]
    for owned in steps:
        selected = "star" if "star" in owned else ("crystal" if owned else "")
        shots.append(q(scene="gallery", theme="light", owned=owned,
                       selected=selected, boxes=2, total=2))
    return shots


def main() -> int:
    ap = argparse.ArgumentParser()
    ap.add_argument("--step", type=int, default=100, help="ms between frames")
    ap.add_argument("--scale", type=float, default=0.8)
    ap.add_argument("--out", default=str(ROOT / "docs" / "preview.gif"))
    ap.add_argument("--dock-out", default=str(ROOT / "docs" / "dock.png"))
    ap.add_argument("--workers", type=int, default=6)
    ap.add_argument("--reassemble", action="store_true",
                    help="reuse existing PNG frames; only redo GIF quantisation")
    args = ap.parse_args()

    if not os.path.exists(EDGE):
        print("Microsoft Edge not found at " + EDGE, file=sys.stderr)
        return 2
    from PIL import Image

    frame_path = build_html()
    out_dir = BUILD / "png"
    out_dir.mkdir(parents=True, exist_ok=True)
    if not args.reassemble:
        for stale in out_dir.glob("f_*.png"):
            stale.unlink()

    shots = make_shots()
    missing = [i for i in range(len(shots))
               if not (out_dir / ("f_%03d.png" % i)).exists()]
    if args.reassemble and (missing or not (out_dir / "f_999.png").exists()):
        print("reassemble needs all frames, missing: %s" % missing, file=sys.stderr)
        return 2
    if not args.reassemble:
        jobs = [(i, query, frame_path, out_dir, WIDTH, HEIGHT) for i, query in enumerate(shots)]
        # The static dock.png uses the same light theme as the GIF.
        dock_query = q(scene="dockshot", theme="light", running=0, remaining=1500000,
                       owned="", boxes=0, total=0)
        jobs.append((999, dock_query, frame_path, out_dir, 460, 500))
        with concurrent.futures.ThreadPoolExecutor(max_workers=args.workers) as pool:
            list(pool.map(shoot, jobs))

    frames = []
    for i in range(len(shots)):
        im = Image.open(out_dir / ("f_%03d.png" % i)).convert("RGB")
        if args.scale != 1.0:
            im = im.resize((round(im.width * args.scale), round(im.height * args.scale)), Image.LANCZOS)
        frames.append(im)

    dock = crop_to_content(Image.open(out_dir / "f_999.png").convert("RGB"))
    dock_path = pathlib.Path(args.dock_out)
    dock_path.parent.mkdir(parents=True, exist_ok=True)
    dock.save(dock_path)
    print("wrote %s (%dx%d)" % (dock_path, dock.width, dock.height))

    # One shared palette avoids colour flicker, but sampling it from a single
    # frame at 128 colours dropped rare accents: the blue gem went grey while
    # the gold star survived. Sample a montage of every frame at 256 colours.
    thumb_w, thumb_h, cols = 128, 105, 6
    rows = (len(frames) + cols - 1) // cols
    montage = Image.new("RGB", (thumb_w * cols, thumb_h * rows))
    for k, frame in enumerate(frames):
        montage.paste(frame.resize((thumb_w, thumb_h), Image.LANCZOS),
                      ((k % cols) * thumb_w, (k // cols) * thumb_h))
    palette = montage.quantize(colors=256, method=Image.Quantize.MEDIANCUT)
    quant = [f.quantize(palette=palette, dither=Image.Dither.NONE) for f in frames]
    durations = [args.step] * len(quant)
    durations[-1] = 1000
    out = pathlib.Path(args.out)
    out.parent.mkdir(parents=True, exist_ok=True)
    quant[0].save(out, save_all=True, append_images=quant[1:],
                  duration=durations, loop=0, optimize=True, disposal=2)

    print("wrote %s (%d frames, %dx%d, %d bytes)" % (
        out, len(quant), quant[0].width, quant[0].height, out.stat().st_size))
    return 0


if __name__ == "__main__":
    raise SystemExit(main())
