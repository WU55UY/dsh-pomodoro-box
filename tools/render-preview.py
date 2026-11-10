#!/usr/bin/env python3
"""Render the README preview GIF from the plugin's real source.

Nothing in the artwork is hand-drawn: the page loads this repository's
client.js, executes its real factory with a tiny React/DOM shim, and renders
the real PomodoroBox component with the real CSS, real locale strings, real
SVG icons and the real Harness theme tokens extracted from app.asar.
Every frame is a headless-browser screenshot of that DOM at a frozen
animation time, so the shake / lid / item / spark keyframes are the shipped
ones.

Usage: python3 tools/render-preview.py [--frames N] [--out docs/preview.gif]
Requires: macOS + Microsoft Edge + Pillow (pip install Pillow).
"""
from __future__ import annotations

import argparse
import concurrent.futures
import os
import pathlib
import shutil
import subprocess
import sys

ROOT = pathlib.Path(__file__).resolve().parent.parent
BUILD = ROOT / "build" / "preview-frames"
EDGE = "/Applications/Microsoft Edge.app/Contents/MacOS/Microsoft Edge"

# Real values from DeepSeek Harness app.asar (light theme token table).
THEME_CSS = """
:root{
  --dsw-static-neutral-bluish-00:#fff;
  --dsw-static-neutral-bluish-150:#e9ecf2;
  --dsw-static-neutral-bluish-700:#61666b;
  --dsw-static-neutral-bluish-1000:#0f1115;
  --dsw-static-green-500:#22c55e;
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
html,body{margin:0;padding:0;height:100%;}
body{
  background:var(--dsw-alias-bg-base);
  color:var(--dsw-alias-label-primary);
  font-family:-apple-system,BlinkMacSystemFont,"PingFang SC","Microsoft YaHei","Segoe UI",sans-serif;
  -webkit-font-smoothing:antialiased;
}
#dockHost{position:absolute;left:0;right:0;bottom:26px;display:flex;justify-content:center;}
#dockHost .dshPomo_dock{background:var(--dsw-alias-bg-overlay);border:1px solid var(--dsw-alias-border-l1);border-radius:12px;padding:4px 8px;}
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

  const ReactMock = {
    createElement(type, props) {
      const kids = flat(Array.prototype.slice.call(arguments, 2));
      if (typeof type === 'function') {
        return type(Object.assign({}, props || {}, { children: kids }));
      }
      return { type: type, props: props || {}, children: kids };
    },
    useState(initial) { return [initial, function () {}]; },
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

  window.__dshRender = function (T, revealed, showDock, showBox) {
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

    // Real store shape, frozen at the instant one focus session just finished.
    const settings = { focus:25, shortBreak:5, longBreak:15, focusMs:1500000, shortBreakMs:300000, longBreakMs:900000 };
    const dockSnapshot = {
      phase: 'focus', status: 'idle', hidden: false, remaining: 1500000,
      settings: settings,
      stats: { total: 1, boxes: 1, owned: ['star'] },
      pending: { id: 1, itemId: 'star', tier: 'legendary', newItem: true, openedAt: 0 },
    };
    const dockProps = {
      t: t,
      usePomodoro: function (selector) { return selector(dockSnapshot); },
      togglePomodoro: noop, pausePomodoro: noop, resumePomodoro: noop,
      skipPomodoro: noop, resetPomodoro: noop, setDuration: noop,
      showPomodoro: noop, hidePomodoro: noop,
    };
    if (showDock) build(Dock(dockProps), document.getElementById('dockHost'), false);

    const boxSnapshot = {
      stats: { total: 1, boxes: 1, owned: ['star'] },
      pending: dockSnapshot.pending,
    };
    const boxProps = {
      t: t,
      usePomodoro: function (selector) { return selector(boxSnapshot); },
      devRevealed: revealed,
      takePomodoro: noop, hidePomodoro: noop,
    };
    if (showBox) build(Box(boxProps), document.body, false);

    // Freeze every *shipped* CSS animation at the requested time.
    document.body.offsetHeight;
    const globalNames = ['dshPomoFade', 'dshPomoCard', 'dshPomoHalo', 'dshPomoBurst'];
    const local = revealed ? T - 680 : T;
    document.getAnimations().forEach(function (anim) {
      anim.pause();
      const name = anim.animationName || '';
      anim.currentTime = Math.max(0, globalNames.indexOf(name) >= 0 ? T : local);
    });
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
</head><body><div id="dockHost"></div>
<script>
(function () {
  const params = new URLSearchParams(location.hash.slice(1));
  const T = Math.max(0, Number(params.get('t') || 0));
  try {
    window.__dshRender(T, T >= 680, params.get('dock') === '1', params.get('box') !== '0');
  } catch (error) {
    const pre = document.createElement('pre');
    pre.style.cssText = 'color:#c00;font:12px monospace;white-space:pre-wrap;padding:8px';
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
    # A literal </script> inside an inline script would end the element early.
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
    profile = out_dir / ("edge_%03d" % index)
    cmd = [
        EDGE, "--headless=new", "--no-sandbox", "--disable-gpu",
        "--disable-dev-shm-usage", "--disable-software-rasterizer",
        "--no-first-run",
        "--no-default-browser-check", "--disable-extensions",
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


def main() -> int:
    ap = argparse.ArgumentParser()
    ap.add_argument("--frames", type=int, default=27)
    ap.add_argument("--step", type=int, default=100, help="ms between frames")
    ap.add_argument("--start", type=int, default=60, help="ms of the first frame")
    ap.add_argument("--scale", type=float, default=0.9)
    ap.add_argument("--out", default=str(ROOT / "docs" / "preview.gif"))
    ap.add_argument("--dock-out", default=str(ROOT / "docs" / "dock.png"))
    ap.add_argument("--workers", type=int, default=6)
    args = ap.parse_args()

    if not os.path.exists(EDGE):
        print("Microsoft Edge not found at " + EDGE, file=sys.stderr)
        return 2
    from PIL import Image

    frame_path = build_html()
    out_dir = BUILD / "png"
    if out_dir.exists():
        shutil.rmtree(out_dir)
    out_dir.mkdir(parents=True)
    times = [args.start + i * args.step for i in range(args.frames)]
    jobs = [(i, "t=%d" % t, frame_path, out_dir, 460, 500) for i, t in enumerate(times)]
    jobs.append((999, "t=0&dock=1&box=0", frame_path, out_dir, 460, 500))
    with concurrent.futures.ThreadPoolExecutor(max_workers=args.workers) as pool:
        list(pool.map(shoot, jobs))

    frames = []
    for i in range(args.frames):
        im = Image.open(out_dir / ("f_%03d.png" % i)).convert("RGB")
        im = im.crop((46, 30, 414, 478))
        if args.scale != 1.0:
            im = im.resize((round(im.width * args.scale), round(im.height * args.scale)), Image.LANCZOS)
        frames.append(im)

    dock = Image.open(out_dir / "f_999.png").convert("RGB")
    dock = crop_to_content(dock)
    dock_path = pathlib.Path(args.dock_out)
    dock_path.parent.mkdir(parents=True, exist_ok=True)
    dock.save(dock_path)
    print("wrote %s (%dx%d)" % (dock_path, dock.width, dock.height))

    # One shared palette keeps the GIF small and avoids colour flicker.
    palette_source = frames[len(frames) // 2].copy()
    palette = palette_source.quantize(colors=128, method=Image.Quantize.MEDIANCUT)
    quant = [f.quantize(palette=palette, dither=Image.Dither.NONE) for f in frames]

    durations = [args.step] * len(quant)
    durations[-1] = 900
    out = pathlib.Path(args.out)
    out.parent.mkdir(parents=True, exist_ok=True)
    quant[0].save(
        out, save_all=True, append_images=quant[1:],
        duration=durations, loop=0, optimize=True, disposal=2,
    )
    # Edge creates a user-data-dir per frame; keep only the PNGs locally.
    for profile in out_dir.glob("edge_*"):
        if profile.is_dir():
            shutil.rmtree(profile, ignore_errors=True)

    print("wrote %s (%d frames, %dx%d, %d bytes)" % (
        out, len(quant), quant[0].width, quant[0].height, out.stat().st_size))
    return 0


if __name__ == "__main__":
    raise SystemExit(main())
