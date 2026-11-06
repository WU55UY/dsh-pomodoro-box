/*
 * Pomodoro-blind-box client half.
 *
 * This is an installed Client module: the Host turns the package's dsh.client
 * declaration into a served bundle, and the page executes this file as a lazy
 * factory. So the body calls window.__ModuleLoader__.load() with the package
 * name as its id, and React comes from the shared module table. No JSX, no
 * TypeScript, no module imports.
 */

window.__ModuleLoader__.load({
  id: '@local/dsh-pomodoro-box',
  factory(require) {
    'use strict';

    const React = require('react');
    const h = React.createElement;
    const { useEffect, useRef, useState } = React;

    const NS = 'pomodoro';
    const STORAGE_KEY = 'dsh.pomodoro-box.v1';
    /*
     * Bumped once to 2 to discard the boxes opened while the 1-minute debug
     * length existed; older records are ignored instead of migrated.
     */
    const SCHEMA_VERSION = 2;
    const LONG_BREAK_EVERY = 4;
    const TICK_MS = 250;
    const FOCUS_CHOICES = [15, 25, 45, 60];
    const BREAK_CHOICES = [3, 5, 10, 15];

    /** Keep this in sync with locale/*.json, which the Host reads for display metadata. */
    const EN = {
      title: 'Pomodoro',
      'phase.focus': 'Focus',
      'phase.shortBreak': 'Short break',
      'phase.longBreak': 'Long break',
      'phase.done': 'Done',
      'action.start': 'Start',
      'action.pause': 'Pause',
      'action.resume': 'Resume',
      'action.skip': 'Skip',
      'action.reset': 'Reset',
      'action.settings': 'Timer lengths',
      'action.collect': 'Collect',
      'action.archive': 'Put the box away',
      'settings.focus': 'Focus',
      'settings.shortBreak': 'Short break',
      'settings.longBreak': 'Long break',
      'settings.minutes': '{value} min',
      'settings.hint': 'Every 4th focus session earns a long break. Each finished focus session opens one blind box.',
      'gallery.title': 'Collection',
      'gallery.progress': '{owned}/{total} found',
      'gallery.complete': 'Complete',
      'gallery.locked': 'Not found yet',
      'gallery.lockedHint': 'Finish a focus session and open a box for a chance to find it.',
      'gallery.hint': 'Tap a slot for details.',
      'gallery.ariaOwned': '{name}, {tier}, collected',
      'gallery.ariaLocked': '{tier} item, not found yet',
      'caption.completed': '{count} pomodoros done',
      'caption.boxes': '{count} boxes opened',
      'caption.pending': 'A blind box is waiting',
      'pill.tipIdle': 'Start a {minutes} minute focus session',
      'pill.tipRunning': '{phase} · {time} left · click to pause',
      'pill.tipPaused': 'Paused · {phase} · click to keep going',
      'pill.tipDone': 'Focus session complete',
      'box.title': 'Pomodoro complete',
      'box.subtitle': 'One focus session finished — the box is yours.',
      'box.waiting': 'The box is opening…',
      'box.new': 'New discovery',
      'box.duplicate': 'Already owned',
      'box.collected': '{owned}/{total} collected',
      'box.count': 'Box #{count}',
      'box.complete': 'Collection complete',
      'tier.common': 'Common',
      'tier.rare': 'Rare',
      'tier.epic': 'Epic',
      'tier.legendary': 'Legendary',
      'item.coffee.name': 'Coffee cup of calm',
      'item.coffee.description': 'Warm, bitter, and on your side.',
      'item.sticky.name': 'Sticky-note army',
      'item.sticky.description': 'A bright square for every suspicion.',
      'item.duck.name': 'Rubber duck',
      'item.duck.description': 'It cannot code, but it listens.',
      'item.sprout.name': 'Lucky sprout',
      'item.sprout.description': 'A tiny green vote for slow growth.',
      'item.tea.name': 'Jasmine tea',
      'item.tea.description': 'Steam curling up like a progress bar.',
      'item.tomato.name': 'Cherry tomato',
      'item.tomato.description': 'The original pomodoro, now with fewer typos.',
      'item.headphones.name': 'Noise-free headphones',
      'item.headphones.description': 'The world now has a mute button.',
      'item.keyboard.name': 'Mechanical keyboard',
      'item.keyboard.description': 'Every keystroke sounds like progress.',
      'item.cat.name': 'Napping desk cat',
      'item.cat.description': 'A supervisor that never asks for a status report.',
      'item.hourglass.name': 'Hourglass of momentum',
      'item.hourglass.description': 'Sand that falls in an encouraging direction.',
      'item.crystal.name': 'Time crystal',
      'item.crystal.description': 'A shard of a perfectly spent 25 minutes.',
      'item.trophy.name': 'Golden tomato trophy',
      'item.trophy.description': 'Proof that the hard part was starting.',
      'item.throne.name': 'Flow throne',
      'item.throne.description': 'Reserved for the hours you disappeared into the work.',
      'item.comet.name': 'Pocket comet',
      'item.comet.description': 'A little tail of light for the next session.',
      'item.star.name': 'Lucky tomato star',
      'item.star.description': 'It only appears when the timer really rings.',
    };

    const ZH = {
      title: '番茄钟',
      'phase.focus': '专注',
      'phase.shortBreak': '短休息',
      'phase.longBreak': '长休息',
      'phase.done': '完成',
      'action.start': '开始',
      'action.pause': '暂停',
      'action.resume': '继续',
      'action.skip': '跳过',
      'action.reset': '重置',
      'action.settings': '时长设置',
      'action.collect': '收下',
      'action.archive': '先收起来',
      'settings.focus': '专注',
      'settings.shortBreak': '短休息',
      'settings.longBreak': '长休息',
      'settings.minutes': '{value} 分钟',
      'settings.hint': '每 4 个番茄钟进入一次长休息；每完成 1 个专注番茄钟，开启 1 个盲盒。',
      'gallery.title': '图鉴',
      'gallery.progress': '{owned}/{total} 已收集',
      'gallery.complete': '已集齐',
      'gallery.locked': '尚未发现',
      'gallery.lockedHint': '完成一个专注番茄钟，开盲盒有机会发现它。',
      'gallery.hint': '点击格子查看详情。',
      'gallery.ariaOwned': '{name}，{tier}，已收集',
      'gallery.ariaLocked': '{tier}藏品，尚未发现',
      'caption.completed': '已完成 {count} 个番茄钟',
      'caption.boxes': '已开出 {count} 个盲盒',
      'caption.pending': '有一个盲盒等待开启',
      'pill.tipIdle': '开始 {minutes} 分钟专注',
      'pill.tipRunning': '{phase} · 还剩 {time} · 点击暂停',
      'pill.tipPaused': '已暂停 · {phase} · 点击继续',
      'pill.tipDone': '专注完成',
      'box.title': '番茄钟完成',
      'box.subtitle': '一个专注番茄钟结束，盲盒归你了。',
      'box.waiting': '盲盒正在打开…',
      'box.new': '新发现',
      'box.duplicate': '已拥有',
      'box.collected': '收集进度 {owned}/{total}',
      'box.count': '第 {count} 个盲盒',
      'box.complete': '图鉴已集齐',
      'tier.common': '普通',
      'tier.rare': '稀有',
      'tier.epic': '史诗',
      'tier.legendary': '传说',
      'item.coffee.name': '平静咖啡杯',
      'item.coffee.description': '微苦，温热，永远站在你这边。',
      'item.sticky.name': '便利贴军团',
      'item.sticky.description': '每一条待办都有了一张亮色小方块。',
      'item.duck.name': '橡皮小黄鸭',
      'item.duck.description': '不会写代码，但很会听你讲。',
      'item.sprout.name': '幸运小芽',
      'item.sprout.description': '为慢慢长出来的东西投的一小票。',
      'item.tea.name': '茉莉花茶',
      'item.tea.description': '蒸汽上升的样子像一根进度条。',
      'item.tomato.name': '樱桃番茄',
      'item.tomato.description': '最原始的番茄钟，少一点错别字。',
      'item.headphones.name': '降噪耳机',
      'item.headphones.description': '世界突然有了静音键。',
      'item.keyboard.name': '机械键盘',
      'item.keyboard.description': '每一次敲击都像在推进度。',
      'item.cat.name': '打盹的桌面猫',
      'item.cat.description': '一位从不要进度汇报的主管。',
      'item.hourglass.name': '动量沙漏',
      'item.hourglass.description': '沙子只朝有进展的方向漏。',
      'item.crystal.name': '时间晶体',
      'item.crystal.description': '一块被完整用掉的 25 分钟的碎片。',
      'item.trophy.name': '金番茄奖杯',
      'item.trophy.description': '证明最难的那一步其实只是开始。',
      'item.throne.name': '心流王座',
      'item.throne.description': '留给那些你忘了刷手机的钟头。',
      'item.comet.name': '口袋彗星',
      'item.comet.description': '为下一段专注准备的一条小尾巴。',
      'item.star.name': '幸运番茄星',
      'item.star.description': '只在计时器真的响过之后出现。',
    };

    /* ── blind box catalogue ─────────────────────────────────────────── */

    const TIERS = [
      { id: 'common', weight: 60 },
      { id: 'rare', weight: 25 },
      { id: 'epic', weight: 12 },
      { id: 'legendary', weight: 3 },
    ];

    const ITEMS = [
      { id: 'coffee', tier: 'common', emoji: '☕' },
      { id: 'sticky', tier: 'common', emoji: '🗒️' },
      { id: 'duck', tier: 'common', emoji: '🐤' },
      { id: 'sprout', tier: 'common', emoji: '🌱' },
      { id: 'tea', tier: 'common', emoji: '🍵' },
      { id: 'tomato', tier: 'common', emoji: '🍅' },
      { id: 'headphones', tier: 'rare', emoji: '🎧' },
      { id: 'keyboard', tier: 'rare', emoji: '⌨️' },
      { id: 'cat', tier: 'rare', emoji: '🐱' },
      { id: 'hourglass', tier: 'rare', emoji: '⏳' },
      { id: 'crystal', tier: 'epic', emoji: '💎' },
      { id: 'trophy', tier: 'epic', emoji: '🏆' },
      { id: 'throne', tier: 'epic', emoji: '🪑' },
      { id: 'comet', tier: 'legendary', emoji: '☄️' },
      { id: 'star', tier: 'legendary', emoji: '🌟' },
    ];

    const ITEMS_BY_ID = new Map(ITEMS.map((item) => [item.id, item]));
    const TIER_BY_ID = new Map(TIERS.map((tier) => [tier.id, tier]));
    const TOTAL_ITEMS = ITEMS.length;

    const TIER_COLORS = {
      common: '#8a8f98',
      rare: '#2f86d8',
      epic: '#9b5cf6',
      legendary: '#e59500',
    };

    const SPARKS = ['✨', '✦', '✧', '★', '✨', '✦'];

    /** All plugin styling rides the host theme tokens; literals are artwork only. */
    const CSS = [
      '.dshPomo_dock{display:inline-flex;align-items:center;gap:6px;min-height:28px;',
      'padding:2px 4px;border-radius:10px;}',
      '.dshPomo_group{display:inline-flex;align-items:center;gap:2px;}',
      '.dshPomo_chip{display:inline-flex;align-items:center;gap:6px;height:26px;padding:0 8px;',
      'font:inherit;font-size:12px;',
      'color:color-mix(in srgb,var(--dsw-alias-label-secondary) 70%,transparent);background:transparent;border:none;',
      'border-radius:8px;cursor:pointer;white-space:nowrap;',
      'font-variant-numeric:tabular-nums;transition:background-color .1s,color .1s;}',
      '.dshPomo_chip:hover{background:color-mix(in srgb,var(--dsw-alias-label-primary) 8%,transparent);color:var(--dsw-alias-label-secondary);}',
      '.dshPomo_chip[aria-pressed=true],.dshPomo_chip[aria-expanded=true]{',
      'background:color-mix(in srgb,var(--dsw-alias-label-primary) 8%,transparent);color:var(--dsw-alias-label-secondary);}',
      '.dshPomo_chip:focus-visible{outline:2px solid var(--dsw-alias-brand-primary);outline-offset:1px;}',
      '.dshPomo_icon{display:grid;place-items:center;flex:none;width:16px;height:16px;}',
      '.dshPomo_icon svg{width:15px;height:15px;}',
      '.dshPomo_label{overflow:hidden;text-overflow:ellipsis;max-width:16em;}',
      '.dshPomo_ring{flex:none;width:14px;height:14px;border-radius:50%;',
      'background:conic-gradient(var(--dsh-pomo-accent) var(--dsh-pomo-progress),rgba(0,0,0,0) 0);',
      'display:grid;place-items:center;}',
      '.dshPomo_ring::after{content:"";width:9px;height:9px;border-radius:50%;background:var(--dsw-alias-bg-layer-1);}',
      '.dshPomo_badge{display:inline-flex;align-items:center;justify-content:center;min-width:16px;height:16px;',
      'padding:0 4px;border-radius:999px;font-size:10px;font-weight:600;line-height:1;',
      'color:var(--dsw-alias-bg-base);background:var(--dsw-alias-brand-primary);}',
      '.dshPomo_panel{position:absolute;bottom:calc(100% + 8px);left:50%;transform:translateX(-50%);',
      'width:min(336px,86vw);max-height:min(74vh,560px);overflow-y:auto;box-sizing:border-box;padding:12px;border-radius:14px;',
      'background:var(--dsw-alias-bg-overlay);color:var(--dsw-alias-label-primary);',
      'border:1px solid var(--dsw-alias-border-l1);box-shadow:0 12px 32px rgba(0,0,0,.18);z-index:40;}',
      '.dshPomo_panelTitle{font-size:12px;font-weight:600;color:var(--dsw-alias-label-secondary);margin:0 0 8px;}',
      '.dshPomo_row{display:flex;align-items:center;justify-content:space-between;gap:8px;margin:6px 0;}',
      '.dshPomo_rowLabel{font-size:12px;color:var(--dsw-alias-label-secondary);}',
      '.dshPomo_choices{display:inline-flex;gap:4px;}',
      '.dshPomo_choice{height:24px;min-width:34px;padding:0 7px;font:inherit;font-size:12px;',
      'border-radius:999px;border:1px solid var(--dsw-alias-border-l1);background:transparent;',
      'color:var(--dsw-alias-label-secondary);cursor:pointer;font-variant-numeric:tabular-nums;}',
      '.dshPomo_choice:hover{border-color:var(--dsw-alias-border-l2);color:var(--dsw-alias-label-primary);}',
      '.dshPomo_choice[aria-pressed=true]{background:var(--dsw-alias-brand-primary);border-color:transparent;',
      'color:var(--dsw-alias-bg-base);font-weight:600;}',
      '.dshPomo_choice:focus-visible{outline:2px solid var(--dsw-alias-brand-primary);outline-offset:1px;}',
      '.dshPomo_hint{margin:10px 0 0;font-size:11px;line-height:16px;color:color-mix(in srgb,var(--dsw-alias-label-secondary) 70%,transparent);}',
      '.dshPomo_summary{display:flex;justify-content:space-between;gap:8px;margin-top:10px;padding-top:10px;',
      'border-top:1px solid var(--dsw-alias-border-l1);font-size:11px;color:color-mix(in srgb,var(--dsw-alias-label-secondary) 70%,transparent);}',
      '.dshPomo_gallery{margin-top:10px;padding-top:10px;border-top:1px solid var(--dsw-alias-border-l1);}',
      '.dshPomo_galleryHead{display:flex;align-items:center;justify-content:space-between;gap:8px;margin:0 0 8px;}',
      '.dshPomo_galleryTitle{font-size:12px;font-weight:600;color:var(--dsw-alias-label-secondary);}',
      '.dshPomo_galleryCount{font-size:11px;font-variant-numeric:tabular-nums;',
      'color:color-mix(in srgb,var(--dsw-alias-label-secondary) 70%,transparent);}',
      '.dshPomo_galleryDone{font-weight:700;color:var(--dsw-alias-state-success-primary);}',
      '.dshPomo_grid{display:grid;grid-template-columns:repeat(5,minmax(0,1fr));gap:6px;}',
      '.dshPomo_slot{position:relative;display:grid;place-items:center;aspect-ratio:1/1;padding:0;margin:0;',
      'font:inherit;font-size:13px;font-weight:700;color:color-mix(in srgb,var(--dsw-alias-label-secondary) 40%,transparent);',
      'border:1px dashed var(--dsw-alias-border-l1);border-radius:10px;background:var(--dsw-alias-bg-layer-2);',
      'cursor:pointer;box-sizing:border-box;transition:transform .12s,box-shadow .12s,border-color .12s;}',
      '.dshPomo_slot:hover{transform:translateY(-1px);border-color:var(--dsw-alias-border-l2);}',
      '.dshPomo_slot:focus-visible{outline:2px solid var(--dsw-alias-brand-primary);outline-offset:1px;}',
      '.dshPomo_slotLocked::before{content:"?";font-size:14px;line-height:1;opacity:.75;}',
      '.dshPomo_slotOwned{border-style:solid;font-size:19px;font-weight:400;',
      'border-color:color-mix(in srgb,var(--dsh-pomo-slot) 46%,transparent);',
      'background:color-mix(in srgb,var(--dsh-pomo-slot) 10%,transparent);}',
      '.dshPomo_slotOwned::after{content:"";position:absolute;left:5px;right:5px;bottom:4px;height:2px;',
      'border-radius:2px;background:var(--dsh-pomo-slot);opacity:.55;}',
      '.dshPomo_slotSelected{box-shadow:0 0 0 2px var(--dsw-alias-brand-primary);}',
      '.dshPomo_detail{display:flex;align-items:flex-start;gap:8px;box-sizing:border-box;min-height:54px;',
      'margin:8px 0 0;padding:8px 10px;border-radius:10px;background:var(--dsw-alias-bg-layer-2);}',
      '.dshPomo_detailEmoji{flex:none;font-size:18px;line-height:22px;}',
      '.dshPomo_detailMain{min-width:0;}',
      '.dshPomo_detailName{display:flex;flex-wrap:wrap;align-items:center;gap:6px;font-size:12px;font-weight:600;line-height:18px;}',
      '.dshPomo_detailTier{font-size:10px;font-weight:700;line-height:14px;padding:1px 6px;border-radius:999px;',
      'color:var(--dsh-pomo-slot);background:color-mix(in srgb,var(--dsh-pomo-slot) 14%,transparent);}',
      '.dshPomo_detailBody{margin:2px 0 0;font-size:11px;line-height:16px;',
      'color:color-mix(in srgb,var(--dsw-alias-label-secondary) 78%,transparent);}',
      '.dshPomo_detailHint{margin:0;align-self:center;}',
      '.dshPomo_overlayLayer{position:fixed;inset:0;display:grid;place-items:start center;',
      'padding:9vh 16px 16px;pointer-events:none;z-index:80;}',
      '.dshPomo_scrim{position:absolute;inset:0;pointer-events:auto;background:rgba(0,0,0,.16);',
      'animation:dshPomoFade .2s ease both;}',
      '.dshPomo_card{position:relative;pointer-events:auto;box-sizing:border-box;width:min(360px,92vw);',
      'padding:22px 20px 18px;border-radius:20px;text-align:center;',
      'background:var(--dsw-alias-bg-overlay);color:var(--dsw-alias-label-primary);',
      'border:1px solid var(--dsw-alias-border-l1);box-shadow:0 24px 64px rgba(0,0,0,.24);',
      'animation:dshPomoCard .35s cubic-bezier(.2,.9,.3,1.2) both;}',
      '.dshPomo_card::before{content:"";position:absolute;left:50%;top:-1px;transform:translateX(-50%);',
      'width:68%;height:1.5px;border-radius:2px;background:var(--dsh-pomo-accent);opacity:.9;}',
      '.dshPomo_eyebrow{display:flex;align-items:center;justify-content:center;gap:6px;margin:0 0 12px;',
      'font-size:11px;font-weight:700;letter-spacing:.12em;text-transform:uppercase;color:var(--dsh-pomo-accent);}',
      '.dshPomo_stage{position:relative;display:grid;place-items:center;height:158px;margin:2px 0 4px;}',
      '.dshPomo_halo{position:absolute;width:150px;height:150px;border-radius:50%;',
      'background:radial-gradient(circle,color-mix(in srgb,var(--dsh-pomo-accent) 34%,transparent) 0%,',
      'color-mix(in srgb,var(--dsh-pomo-accent) 10%,transparent) 45%,transparent 70%);',
      'opacity:0;animation:dshPomoHalo 1.4s ease-out .55s both;}',
      '.dshPomo_box{position:relative;width:92px;height:92px;animation:dshPomoShake .58s ease-in-out both;}',
      '.dshPomo_boxOpened .dshPomo_box{animation:dshPomoShake .58s ease-in-out both,',
      'dshPomoVanish .22s ease-in .58s both;}',
      '.dshPomo_lid{position:absolute;left:50%;top:6px;width:84px;height:24px;margin-left:-42px;',
      'border-radius:9px 9px 5px 5px;background:var(--dsh-pomo-accent);',
      'box-shadow:inset 0 -3px 0 rgba(0,0,0,.16),inset 0 2px 0 rgba(255,255,255,.28);}',
      '.dshPomo_lid::after{content:"";position:absolute;left:50%;top:-8px;width:22px;height:14px;',
      'margin-left:-11px;border-radius:999px;border:4px solid var(--dsh-pomo-accent);',
      'background:var(--dsw-alias-bg-overlay);}',
      '.dshPomo_base{position:absolute;left:50%;top:30px;width:76px;height:56px;margin-left:-38px;',
      'border-radius:5px 5px 12px 12px;background:var(--dsh-pomo-accent);',
      'box-shadow:inset 0 -4px 0 rgba(0,0,0,.16),inset 3px 0 0 rgba(255,255,255,.16);}',
      '.dshPomo_base::before{content:"";position:absolute;left:50%;top:0;bottom:0;width:12px;',
      'margin-left:-6px;background:rgba(255,255,255,.42);}',
      '.dshPomo_base::after{content:"";position:absolute;left:6px;right:6px;top:22px;height:12px;',
      'border-radius:4px;background:rgba(255,255,255,.42);}',
      '.dshPomo_boxOpened .dshPomo_lid{animation:dshPomoLid .44s cubic-bezier(.25,.9,.35,1.15) .58s both;}',
      '.dshPomo_emoji{position:absolute;font-size:54px;line-height:1;opacity:0;',
      'filter:drop-shadow(0 8px 14px rgba(0,0,0,.2));',
      'animation:dshPomoItem .56s cubic-bezier(.2,.9,.3,1.5) .68s both;}',
      '.dshPomo_spark{position:absolute;left:50%;top:50%;font-size:18px;line-height:1;opacity:0;',
      'animation:dshPomoSpark 1s ease-out var(--dsh-pomo-delay,0s) both;}',
      '.dshPomo_spark:nth-child(2n){font-size:13px;}',
      '.dshPomo_burst{position:absolute;left:50%;top:50%;width:10px;height:10px;margin:-5px 0 0 -5px;',
      'border-radius:50%;background:var(--dsh-pomo-accent);opacity:0;',
      'animation:dshPomoBurst .5s ease-out .6s both;}',
      '.dshPomo_tier{display:inline-flex;align-items:center;gap:6px;padding:3px 10px;border-radius:999px;',
      'font-size:11px;font-weight:700;letter-spacing:.04em;color:var(--dsh-pomo-accent);',
      'background:color-mix(in srgb,var(--dsh-pomo-accent) 13%,transparent);',
      'border:1px solid color-mix(in srgb,var(--dsh-pomo-accent) 34%,transparent);}',
      '.dshPomo_name{margin:10px 0 0;font-size:19px;font-weight:700;line-height:26px;}',
      '.dshPomo_desc{margin:5px 0 0;font-size:13px;line-height:19px;color:var(--dsw-alias-label-secondary);}',
      '.dshPomo_meta{display:flex;flex-wrap:wrap;align-items:center;justify-content:center;gap:6px;margin:12px 0 0;}',
      '.dshPomo_tag{padding:2px 8px;border-radius:999px;font-size:11px;font-weight:600;',
      'color:var(--dsw-alias-label-secondary);background:var(--dsw-alias-bg-layer-2);}',
      '.dshPomo_tagNew{color:var(--dsw-alias-state-success-primary);',
      'background:color-mix(in srgb,var(--dsw-alias-state-success-primary) 14%,transparent);}',
      '.dshPomo_actions{display:flex;align-items:center;justify-content:center;gap:8px;margin:16px 0 0;}',
      '.dshPomo_primary{height:32px;padding:0 18px;border-radius:999px;border:none;cursor:pointer;',
      'font:inherit;font-size:13px;font-weight:600;color:var(--dsw-alias-bg-base);',
      'background:var(--dsh-pomo-accent);}',
      '.dshPomo_primary:hover{filter:brightness(1.06);}',
      '.dshPomo_primary:focus-visible{outline:2px solid var(--dsw-alias-brand-primary);outline-offset:2px;}',
      '.dshPomo_ghost{height:32px;padding:0 12px;border-radius:999px;background:transparent;cursor:pointer;',
      'font:inherit;font-size:12px;color:color-mix(in srgb,var(--dsw-alias-label-secondary) 70%,transparent);',
      'border:1px solid var(--dsw-alias-border-l1);}',
      '.dshPomo_ghost:hover{color:var(--dsw-alias-label-secondary);border-color:var(--dsw-alias-border-l2);}',
      '.dshPomo_foot{margin:10px 0 0;font-size:11px;color:color-mix(in srgb,var(--dsw-alias-label-secondary) 70%,transparent);}',
      '@keyframes dshPomoFade{from{opacity:0}to{opacity:1}}',
      '@keyframes dshPomoCard{from{opacity:0;transform:translateY(-10px) scale(.96)}',
      'to{opacity:1;transform:none}}',
      '@keyframes dshPomoShake{0%,100%{transform:rotate(0) translateY(0)}',
      '12%{transform:rotate(-7deg) translateY(-2px)}24%{transform:rotate(6deg)}',
      '36%{transform:rotate(-5deg) translateY(-3px)}48%{transform:rotate(4deg)}',
      '62%{transform:rotate(-2deg) translateY(-4px)}78%{transform:rotate(1deg)}}',
      '@keyframes dshPomoVanish{to{opacity:0;transform:scale(.9)}}',
      '@keyframes dshPomoLid{to{transform:translateY(-34px) rotate(-16deg);opacity:0}}',
      '@keyframes dshPomoItem{0%{opacity:0;transform:translateY(22px) scale(.3) rotate(-12deg)}',
      '60%{opacity:1;transform:translateY(-10px) scale(1.08) rotate(3deg)}',
      '100%{opacity:1;transform:translateY(-6px) scale(1) rotate(0)}}',
      '@keyframes dshPomoHalo{0%{opacity:0;transform:scale(.6)}',
      '40%{opacity:1;transform:scale(1)}100%{opacity:.45;transform:scale(1.08)}}',
      '@keyframes dshPomoBurst{0%{opacity:.9;transform:scale(.4)}100%{opacity:0;transform:scale(9)}}',
      '@keyframes dshPomoSpark{0%{opacity:0;transform:translate(-50%,-50%) scale(.4)}',
      '25%{opacity:1}100%{opacity:0;transform:translate(var(--dsh-pomo-x,0),var(--dsh-pomo-y,-58px)) scale(1.05)}}',
      '@media (prefers-reduced-motion:reduce){.dshPomo_box,.dshPomo_boxOpened .dshPomo_box,',
      '.dshPomo_boxOpened .dshPomo_lid,.dshPomo_emoji,.dshPomo_halo,.dshPomo_burst,.dshPomo_spark,',
      '.dshPomo_card,.dshPomo_scrim{animation-duration:1ms!important;animation-delay:0ms!important;}}',
    ].join('');

    function PomodoroStyles() {
      return h('style', { 'data-dsh-pomodoro-css': '' }, CSS);
    }

    function pickFrom(list) {
      return list[Math.floor(Math.random() * list.length)];
    }

    /** Weighted tier roll, then a uniform pick inside that tier. */
    function rollReward(owned) {
      const total = TIERS.reduce((sum, tier) => sum + tier.weight, 0);
      let roll = Math.random() * total;
      let tier = TIERS[TIERS.length - 1];
      for (const candidate of TIERS) {
        roll -= candidate.weight;
        if (roll < 0) {
          tier = candidate;
          break;
        }
      }
      const item = pickFrom(ITEMS.filter((entry) => entry.tier === tier.id));
      return {
        itemId: item.id,
        tier: tier.id,
        newItem: !owned.includes(item.id),
      };
    }

    /* ── persistence ─────────────────────────────────────────────────── */

    let storageChecked = false;
    let backing = null;

    function storage() {
      if (storageChecked) return backing;
      storageChecked = true;
      try {
        const candidate = window.localStorage;
        const probe = '__dsh_pomodoro_probe__';
        candidate.setItem(probe, '1');
        candidate.removeItem(probe);
        backing = candidate;
      } catch (error) {
        backing = null;
      }
      return backing;
    }

    function loadSaved() {
      const saved = { settings: {}, stats: {}, pending: null };
      const store = storage();
      if (store === null) return saved;
      try {
        const raw = store.getItem(STORAGE_KEY);
        if (raw === null) return saved;
        const parsed = JSON.parse(raw);
        if (parsed !== null && typeof parsed === 'object' && parsed.version === SCHEMA_VERSION) {
          if (parsed.settings !== null && typeof parsed.settings === 'object') saved.settings = parsed.settings;
          if (parsed.stats !== null && typeof parsed.stats === 'object') saved.stats = parsed.stats;
          if (parsed.pending !== null && typeof parsed.pending === 'object') saved.pending = parsed.pending;
        }
      } catch (error) {
        /* A corrupt or foreign value simply starts a fresh record. */
      }
      return saved;
    }

    function clampMinutes(value, allowed, fallback) {
      const number = Number(value);
      return allowed.includes(number) ? number : fallback;
    }

    /* ── derived state ───────────────────────────────────────────────── */

    function phaseSeconds(phase, settings) {
      if (phase === 'focus') return settings.focusMs;
      if (phase === 'longBreak') return settings.longBreakMs;
      return settings.shortBreakMs;
    }

    function phaseLabelKey(phase) {
      if (phase === 'focus') return 'phase.focus';
      if (phase === 'longBreak') return 'phase.longBreak';
      return 'phase.shortBreak';
    }

    function formatClock(msLeft) {
      const total = Math.max(0, Math.ceil(msLeft / 1000));
      const minutes = Math.floor(total / 60);
      const seconds = total % 60;
      return String(minutes).padStart(2, '0') + ':' + String(seconds).padStart(2, '0');
    }

    /* ── store ───────────────────────────────────────────────────────── */

    function createStore() {
      const saved = loadSaved();
      const focus = clampMinutes(saved.settings.focus, FOCUS_CHOICES, 25);
      const shortBreak = clampMinutes(saved.settings.shortBreak, BREAK_CHOICES, 5);
      const longBreak = clampMinutes(saved.settings.longBreak, BREAK_CHOICES, 15);
      const settings = {
        focus: focus,
        shortBreak: shortBreak,
        longBreak: longBreak,
        focusMs: focus * 60_000,
        shortBreakMs: shortBreak * 60_000,
        longBreakMs: longBreak * 60_000,
      };
      const stats = {
        total: Number.isFinite(saved.stats.total) ? Math.max(0, saved.stats.total) : 0,
        boxes: Number.isFinite(saved.stats.boxes) ? Math.max(0, saved.stats.boxes) : 0,
        owned: Array.isArray(saved.stats.owned)
          ? Array.from(new Set(saved.stats.owned.filter((id) => ITEMS_BY_ID.has(id))))
          : [],
      };

      let pending = null;
      if (saved.pending !== null && ITEMS_BY_ID.has(saved.pending.itemId)) {
        const item = ITEMS_BY_ID.get(saved.pending.itemId);
        pending = {
          id: Number.isFinite(saved.pending.id) ? saved.pending.id : Math.max(1, stats.boxes),
          itemId: item.id,
          tier: TIER_BY_ID.has(saved.pending.tier) ? saved.pending.tier : item.tier,
          newItem: saved.pending.newItem === true,
          openedAt: Number.isFinite(saved.pending.openedAt) ? saved.pending.openedAt : Date.now(),
        };
      }

      let state = {
        phase: 'focus',
        status: 'idle',
        endTime: null,
        remaining: settings.focusMs,
        cycle: 0,
        hidden: false,
        settings: settings,
        stats: stats,
        pending: pending,
      };

      const listeners = new Set();

      function emit() {
        for (const listener of Array.from(listeners)) listener();
      }

      function persist() {
        const store = storage();
        if (store === null) return;
        try {
          store.setItem(STORAGE_KEY, JSON.stringify({
            version: SCHEMA_VERSION,
            settings: {
              focus: state.settings.focus,
              shortBreak: state.settings.shortBreak,
              longBreak: state.settings.longBreak,
            },
            stats: state.stats,
            pending: state.pending,
          }));
        } catch (error) {
          /* Quota or privacy mode: the timer keeps working in memory. */
        }
      }

      function set(patch, save) {
        state = Object.assign({}, state, patch);
        emit();
        if (save === true) persist();
      }

      function begin(phase) {
        const duration = phaseSeconds(phase, state.settings);
        set({
          phase: phase,
          status: 'running',
          endTime: Date.now() + duration,
          remaining: duration,
          hidden: phase !== 'focus' ? state.hidden : false,
        }, true);
      }

      function complete(phase) {
        if (phase === 'focus') {
          const box = rollReward(state.stats.owned);
          const stats = {
            total: state.stats.total + 1,
            boxes: state.stats.boxes + 1,
            owned: box.newItem ? state.stats.owned.concat(box.itemId) : state.stats.owned,
          };
          const cycle = state.cycle + 1;
          const nextPhase = cycle % LONG_BREAK_EVERY === 0 ? 'longBreak' : 'shortBreak';
          set({
            phase: nextPhase,
            status: 'idle',
            endTime: null,
            remaining: phaseSeconds(nextPhase, state.settings),
            cycle: cycle,
            stats: stats,
            pending: {
              id: stats.boxes,
              itemId: box.itemId,
              tier: box.tier,
              newItem: box.newItem,
              openedAt: Date.now(),
            },
          }, true);
        } else {
          begin('focus');
        }
      }

      function tick() {
        if (state.status !== 'running' || state.endTime === null) return;
        const left = state.endTime - Date.now();
        if (left <= 0) {
          complete(state.phase);
          return;
        }
        if (Math.ceil(left / 1000) !== Math.ceil(state.remaining / 1000)) {
          state = Object.assign({}, state, { remaining: left });
          emit();
        } else {
          /* Same displayed second: keep the reference so uSES stays quiet. */
          state.remaining = left;
        }
      }

      const store = {
        getSnapshot: () => state,
        subscribe: (listener) => {
          listeners.add(listener);
          return () => {
            listeners.delete(listener);
          };
        },
        start: () => begin('focus'),
        pause: () => {
          if (state.status !== 'running' || state.endTime === null) return;
          set({
            status: 'paused',
            remaining: Math.max(0, state.endTime - Date.now()),
            endTime: null,
          });
        },
        resume: () => {
          if (state.status !== 'paused') return;
          const left = state.remaining > 1000 ? state.remaining : phaseSeconds(state.phase, state.settings);
          set({ status: 'running', endTime: Date.now() + left, remaining: left });
        },
        toggle: () => {
          if (state.status === 'running') store.pause();
          else if (state.status === 'paused') store.resume();
          else begin('focus');
        },
        skip: () => {
          if (state.status === 'running' || state.status === 'paused') {
            /* Skipping never earns a box: it only moves the cycle on. */
            const nextPhase = state.phase === 'focus' ? 'shortBreak' : 'focus';
            set({
              phase: nextPhase,
              status: 'idle',
              endTime: null,
              remaining: phaseSeconds(nextPhase, state.settings),
              hidden: false,
            });
            return;
          }
          set({
            phase: 'focus',
            status: 'idle',
            endTime: null,
            remaining: state.settings.focusMs,
            hidden: false,
          });
        },
        reset: () => {
          set({
            phase: 'focus',
            status: 'idle',
            endTime: null,
            remaining: state.settings.focusMs,
            hidden: false,
          });
        },
        hide: () => set({ hidden: true }),
        show: () => set({ hidden: false }),
        setDuration: (key, minutes) => {
          const allowed = key === 'focus' ? FOCUS_CHOICES : BREAK_CHOICES;
          const fallback = key === 'focus' ? 25 : key === 'shortBreak' ? 5 : 15;
          const value = clampMinutes(minutes, allowed, fallback);
          const nextSettings = Object.assign({}, state.settings, {
            [key]: value,
            [key + 'Ms']: value * 60_000,
          });
          const patch = { settings: nextSettings };
          if (state.status === 'idle') patch.remaining = phaseSeconds(state.phase, nextSettings);
          set(patch, true);
        },
        take: () => {
          if (state.pending === null) return;
          set({ pending: null }, true);
        },
        tick: tick,
      };

      return store;
    }

    /* ── icons ───────────────────────────────────────────────────────── */

    function Svg(props) {
      return h('svg', {
        viewBox: '0 0 16 16',
        width: 15,
        height: 15,
        fill: 'none',
        stroke: 'currentColor',
        strokeWidth: 1.5,
        strokeLinecap: 'round',
        strokeLinejoin: 'round',
        'aria-hidden': true,
        focusable: false,
      }, props.children);
    }

    function IconTomato() {
      return h(Svg, null,
        h('circle', { cx: 8, cy: 9, r: 4.6 }),
        h('path', { d: 'M8 4.4c-2 0-3.1-1-3.1-2.1 0-.7.6-1.1 1.2-1.1.9 0 1.5 1.2 1.9 2 .4-.8 1-2 1.9-2 .6 0 1.2.4 1.2 1.1 0 1.1-1.1 2.1-3.1 2.1Z', fill: 'currentColor', stroke: 'none' }),
        h('path', { d: 'M8 7.6v2.2l1.5 1.1' }));
    }

    function IconPlay() {
      return h(Svg, null, h('path', { d: 'M5.6 3.4 12 8l-6.4 4.6Z', fill: 'currentColor', stroke: 'none' }));
    }

    function IconPause() {
      return h(Svg, null, h('path', { d: 'M6.2 3.6v8.8M9.8 3.6v8.8' }));
    }

    function IconSkip() {
      return h(Svg, null,
        h('path', { d: 'M4 3.6 9.8 8 4 12.4Z', fill: 'currentColor', stroke: 'none' }),
        h('path', { d: 'M12 3.6v8.8' }));
    }

    function IconReset() {
      return h(Svg, null,
        h('path', { d: 'M3.3 8a4.7 4.7 0 1 0 1.4-3.4' }),
        h('path', { d: 'M3.3 3.5v2.8h2.8' }));
    }

    function IconGear() {
      return h(Svg, null,
        h('circle', { cx: 8, cy: 8, r: 2 }),
        h('path', { d: 'M8 2.3v1.4M8 12.3v1.4M2.3 8h1.4M12.3 8h1.4M4 4l1 1M11 11l1 1M12 4l-1 1M5 11l-1 1' }));
    }

    /* ── dock pill ───────────────────────────────────────────────────── */

    function DurationRow(props) {
      return h('div', { className: 'dshPomo_row' },
        h('span', { className: 'dshPomo_rowLabel' }, props.label),
        h('span', { className: 'dshPomo_choices' }, props.choices.map((minutes) => h('button', {
          key: minutes,
          type: 'button',
          className: 'dshPomo_choice',
          'aria-pressed': minutes === props.value,
          onClick: () => props.onPick(minutes),
          title: props.t('settings.minutes', { value: minutes }),
        }, String(minutes)))));
    }

    function CollectionGrid(props) {
      const t = props.t;
      const ownedSet = new Set(props.owned);
      const selected = props.selectedId === null ? null : ITEMS_BY_ID.get(props.selectedId);
      const selectedOwned = selected !== null && ownedSet.has(selected.id);
      const done = props.owned.length >= TOTAL_ITEMS;

      return h('div', { className: 'dshPomo_gallery' },
        h('div', { className: 'dshPomo_galleryHead' },
          h('span', { className: 'dshPomo_galleryTitle' }, t('gallery.title')),
          h('span', { className: 'dshPomo_galleryCount' + (done ? ' dshPomo_galleryDone' : '') },
            done
              ? t('gallery.complete') + ' · ' + props.owned.length + '/' + TOTAL_ITEMS
              : t('gallery.progress', { owned: props.owned.length, total: TOTAL_ITEMS }))),
        h('div', { className: 'dshPomo_grid' }, ITEMS.map((item) => {
          const owned = ownedSet.has(item.id);
          const active = props.selectedId === item.id;
          const tier = t('tier.' + item.tier);
          const label = owned
            ? t('gallery.ariaOwned', { name: t('item.' + item.id + '.name'), tier: tier })
            : t('gallery.ariaLocked', { tier: tier });
          return h('button', {
            key: item.id,
            type: 'button',
            className: 'dshPomo_slot' + (owned ? ' dshPomo_slotOwned' : '') + (active ? ' dshPomo_slotSelected' : ''),
            style: { '--dsh-pomo-slot': TIER_COLORS[item.tier] },
            'aria-pressed': active,
            'aria-label': label,
            title: label,
            onClick: () => props.onSelect(active ? null : item.id),
          }, owned ? item.emoji : null);
        })),
        h('div', { className: 'dshPomo_detail', 'aria-live': 'polite' },
          selected === null
            ? h('p', { className: 'dshPomo_detailBody dshPomo_detailHint' }, t('gallery.hint'))
            : [
              h('span', {
                key: 'emoji',
                className: 'dshPomo_detailEmoji',
                'aria-hidden': true,
              }, selectedOwned ? selected.emoji : '🔒'),
              h('div', { key: 'body', className: 'dshPomo_detailMain' },
                h('div', { className: 'dshPomo_detailName' },
                  selectedOwned ? t('item.' + selected.id + '.name') : t('gallery.locked'),
                  h('span', { className: 'dshPomo_detailTier' }, t('tier.' + selected.tier))),
                h('p', { className: 'dshPomo_detailBody' },
                  selectedOwned ? t('item.' + selected.id + '.description') : t('gallery.lockedHint'))),
            ]));
    }

    function PomodoroDock(props) {
      const t = props.t;
      const snapshot = props.usePomodoro((value) => value);
      const [panelOpen, setPanelOpen] = useState(false);
      const [selectedItem, setSelectedItem] = useState(null);
      const rootRef = useRef(null);

      useEffect(() => {
        if (!panelOpen) return undefined;
        function onPointerDown(event) {
          const root = rootRef.current;
          if (root !== null && !root.contains(event.target)) setPanelOpen(false);
        }
        function onKeyDown(event) {
          if (event.key === 'Escape') setPanelOpen(false);
        }
        document.addEventListener('pointerdown', onPointerDown, true);
        document.addEventListener('keydown', onKeyDown);
        return () => {
          document.removeEventListener('pointerdown', onPointerDown, true);
          document.removeEventListener('keydown', onKeyDown);
        };
      }, [panelOpen]);

      if (snapshot === undefined) return null;
      const phase = snapshot.phase;
      const status = snapshot.status;
      const settings = snapshot.settings;
      const stats = snapshot.stats;
      const running = status === 'running';
      const paused = status === 'paused';
      const time = formatClock(snapshot.remaining);
      const duration = phaseSeconds(phase, settings);
      const progress = Math.max(0, Math.min(100, (snapshot.remaining / duration) * 100));
      const focusMode = phase === 'focus';
      const accent = focusMode ? 'var(--dsw-alias-brand-primary)' : 'var(--dsw-alias-state-success-primary)';
      const tooltip = status === 'idle'
        ? t('pill.tipIdle', { minutes: Math.round(settings.focusMs / 60_000) })
        : running
          ? t('pill.tipRunning', { phase: t(phaseLabelKey(phase)), time: time })
          : t('pill.tipPaused', { phase: t(phaseLabelKey(phase)) });

      if (snapshot.hidden === true && snapshot.pending === null) {
        return h('div', { className: 'dshPomo_dock', ref: rootRef, 'data-dsh-pomodoro': 'hidden' },
          h(PomodoroStyles),
          h('button', {
            type: 'button',
            className: 'dshPomo_chip',
            onClick: props.showPomodoro,
            title: t('title'),
            'aria-label': t('title'),
          },
          h('span', { className: 'dshPomo_icon', style: { color: accent } }, h(IconTomato)),
          t('title')));
      }

      return h('div', {
        className: 'dshPomo_dock',
        ref: rootRef,
        'data-dsh-pomodoro': status,
        'data-dsh-pomodoro-phase': phase,
      },
      h(PomodoroStyles),
      h('div', { className: 'dshPomo_group', style: { position: 'relative' } },
        h('button', {
          type: 'button',
          className: 'dshPomo_chip',
          onClick: props.togglePomodoro,
          title: tooltip,
          'aria-label': tooltip,
          'aria-pressed': running,
        },
        h('span', { className: 'dshPomo_icon', style: { color: accent } },
          h('span', {
            className: 'dshPomo_ring',
            style: { '--dsh-pomo-accent': accent, '--dsh-pomo-progress': progress + '%' },
          })),
        h('span', { className: 'dshPomo_label' }, t('title')),
        h('span', { style: { fontWeight: 600 } }, time),
        h('span', { style: { fontSize: '11px', color: 'color-mix(in srgb,var(--dsw-alias-label-secondary) 70%,transparent)' } }, t(phaseLabelKey(phase))),
        snapshot.pending !== null
          ? h('span', { className: 'dshPomo_badge', title: t('caption.pending') }, '!')
          : null),
        paused
          ? h('button', {
            type: 'button',
            className: 'dshPomo_chip',
            onClick: props.resumePomodoro,
            title: t('action.resume'),
            'aria-label': t('action.resume'),
          }, h('span', { className: 'dshPomo_icon' }, h(IconPlay)))
          : running
            ? h('button', {
              type: 'button',
              className: 'dshPomo_chip',
              onClick: props.pausePomodoro,
              title: t('action.pause'),
              'aria-label': t('action.pause'),
            }, h('span', { className: 'dshPomo_icon' }, h(IconPause)))
            : null,
        h('button', {
          type: 'button',
          className: 'dshPomo_chip',
          onClick: props.skipPomodoro,
          title: t('action.skip'),
          'aria-label': t('action.skip'),
        }, h('span', { className: 'dshPomo_icon' }, h(IconSkip))),
        h('button', {
          type: 'button',
          className: 'dshPomo_chip',
          onClick: () => setPanelOpen((open) => !open),
          title: t('action.settings'),
          'aria-label': t('action.settings'),
          'aria-expanded': panelOpen,
        }, h('span', { className: 'dshPomo_icon' }, h(IconGear))),
        panelOpen
          ? h('div', { className: 'dshPomo_panel', role: 'dialog', 'aria-label': t('action.settings') },
            h('p', { className: 'dshPomo_panelTitle' }, t('title')),
            h(DurationRow, {
              label: t('settings.focus'),
              choices: FOCUS_CHOICES,
              value: settings.focus,
              onPick: (minutes) => props.setDuration('focus', minutes),
              t: t,
            }),
            h(DurationRow, {
              label: t('settings.shortBreak'),
              choices: BREAK_CHOICES,
              value: settings.shortBreak,
              onPick: (minutes) => props.setDuration('shortBreak', minutes),
              t: t,
            }),
            h(DurationRow, {
              label: t('settings.longBreak'),
              choices: BREAK_CHOICES,
              value: settings.longBreak,
              onPick: (minutes) => props.setDuration('longBreak', minutes),
              t: t,
            }),
            h('p', { className: 'dshPomo_hint' }, t('settings.hint')),
            h(CollectionGrid, {
              t: t,
              owned: stats.owned,
              selectedId: selectedItem,
              onSelect: setSelectedItem,
            }),
            h('div', { className: 'dshPomo_summary' },
              h('span', null, t('caption.completed', { count: stats.total })),
              h('span', null, t('caption.boxes', { count: stats.boxes }))))
          : null),
      h('div', { className: 'dshPomo_group' },
        h('span', { className: 'dshPomo_chip', style: { cursor: 'default' } },
          t('caption.completed', { count: stats.total })),
        h('button', {
          type: 'button',
          className: 'dshPomo_chip',
          onClick: props.resetPomodoro,
          title: t('action.reset'),
          'aria-label': t('action.reset'),
        }, h('span', { className: 'dshPomo_icon' }, h(IconReset)))));
    }

    /* ── blind box reveal ────────────────────────────────────────────── */

    function useRevealStage(boxId, forced) {
      const [stage, setStage] = useState(forced === true ? 'revealed' : 'shaking');
      useEffect(() => {
        if (boxId === undefined) return undefined;
        setStage('shaking');
        const timer = setTimeout(() => setStage('revealed'), 680);
        return () => clearTimeout(timer);
      }, [boxId]);
      return stage;
    }

    function PomodoroBox(props) {
      const t = props.t;
      const snapshot = props.usePomodoro((value) => value);
      const pending = snapshot === undefined ? null : snapshot.pending;
      const stage = useRevealStage(pending === null ? undefined : pending.id, props.devRevealed);
      const closeRef = useRef(null);
      const boxId = pending === null ? null : pending.id;

      useEffect(() => {
        if (boxId === null) return undefined;
        function onKeyDown(event) {
          if (event.key === 'Escape') props.takePomodoro();
        }
        document.addEventListener('keydown', onKeyDown);
        return () => document.removeEventListener('keydown', onKeyDown);
      }, [boxId]);

      useEffect(() => {
        if (stage !== 'revealed' || closeRef.current === null) return;
        try {
          closeRef.current.focus({ preventScroll: true });
        } catch (error) {
          /* Focus is a nicety; a failed call must not break the reveal. */
        }
      }, [stage]);

      if (pending === null) return null;
      const item = ITEMS_BY_ID.get(pending.itemId);
      if (item === undefined) return null;
      const accent = TIER_COLORS[pending.tier] || TIER_COLORS.common;
      const revealed = stage === 'revealed';
      const owned = snapshot.stats.owned.length;

      return h('div', {
        className: 'dshPomo_overlayLayer',
        style: { '--dsh-pomo-accent': accent },
        'data-dsh-pomodoro-box': pending.tier,
      },
      h(PomodoroStyles),
      h('div', { className: 'dshPomo_scrim' }),
      h('section', {
        className: 'dshPomo_card' + (revealed ? ' dshPomo_boxOpened' : ''),
        role: 'dialog',
        'aria-modal': 'true',
        'aria-labelledby': 'dshPomoBoxTitle',
        'aria-describedby': revealed ? 'dshPomoBoxName' : undefined,
      },
      h('p', { className: 'dshPomo_eyebrow', id: 'dshPomoBoxTitle' },
        h('span', { className: 'dshPomo_icon' }, h(IconTomato)),
        t('box.title')),
      h('div', { className: 'dshPomo_stage' },
        h('span', { className: 'dshPomo_halo' }),
        h('span', { className: 'dshPomo_burst' }),
        h('span', { className: 'dshPomo_box' }, h('span', { className: 'dshPomo_lid' }), h('span', { className: 'dshPomo_base' })),
        revealed
          ? h('span', { className: 'dshPomo_emoji', role: 'img', 'aria-label': t('item.' + item.id + '.name') }, item.emoji)
          : null,
        revealed
          ? SPARKS.map((spark, index) => h('span', {
            key: index,
            className: 'dshPomo_spark',
            'aria-hidden': true,
            style: {
              '--dsh-pomo-delay': (0.72 + index * 0.05) + 's',
              '--dsh-pomo-x': Math.round(Math.cos((index / SPARKS.length) * Math.PI * 2) * 66) + 'px',
              '--dsh-pomo-y': Math.round(Math.sin((index / SPARKS.length) * Math.PI * 2) * 54 - 10) + 'px',
            },
          }, spark))
          : null),
      revealed
        ? h('div', { className: 'dshPomo_body' },
          h('span', { className: 'dshPomo_tier' }, t('tier.' + pending.tier)),
          h('h2', { className: 'dshPomo_name', id: 'dshPomoBoxName' }, t('item.' + item.id + '.name')),
          h('p', { className: 'dshPomo_desc' }, t('item.' + item.id + '.description')),
          h('div', { className: 'dshPomo_meta' },
            h('span', { className: 'dshPomo_tag' + (pending.newItem ? ' dshPomo_tagNew' : '') },
              pending.newItem ? t('box.new') : t('box.duplicate')),
            h('span', { className: 'dshPomo_tag' }, t('box.collected', { owned: owned, total: TOTAL_ITEMS })),
            owned >= TOTAL_ITEMS
              ? h('span', { className: 'dshPomo_tag dshPomo_tagNew' }, t('box.complete'))
              : null,
            h('span', { className: 'dshPomo_tag' }, t('box.count', { count: snapshot.stats.boxes }))),
          h('div', { className: 'dshPomo_actions' },
            h('button', {
              type: 'button',
              className: 'dshPomo_primary',
              ref: closeRef,
              onClick: props.takePomodoro,
            }, t('action.collect')),
            h('button', {
              type: 'button',
              className: 'dshPomo_ghost',
              onClick: () => {
                props.takePomodoro();
                props.hidePomodoro();
              },
            }, t('action.archive'))),
          h('p', { className: 'dshPomo_foot' }, t('box.subtitle')))
        : h('p', { className: 'dshPomo_desc' }, t('box.waiting'))));
    }

    /* ── client entry ────────────────────────────────────────────────── */

    return {
      inject: ['slots', 'locale'],
      name: 'pomodoro-box',
      apply(ctx) {
        const pomodoro = createStore();
        ctx.effect(() => ctx.locale.register(NS, { en: EN, zh: ZH }), 'pomodoro-box: dictionaries');

        ctx.slots.inject('conversation.composer.dock', () => ctx.slots.register({
          name: 'conversation.composer.dock',
          id: 'pomodoro',
          order: 2,
          locale: NS,
          inject: () => ({
            hooks: { pomodoro: pomodoro },
            togglePomodoro: pomodoro.toggle,
            pausePomodoro: pomodoro.pause,
            resumePomodoro: pomodoro.resume,
            skipPomodoro: pomodoro.skip,
            resetPomodoro: pomodoro.reset,
            setDuration: pomodoro.setDuration,
            showPomodoro: pomodoro.show,
          }),
        }, PomodoroDock));

        ctx.slots.inject('shell.overlay', () => ctx.slots.register({
          name: 'shell.overlay',
          id: 'pomodoro-box',
          order: 20,
          locale: NS,
          inject: () => ({
            hooks: { pomodoro: pomodoro },
            takePomodoro: pomodoro.take,
            hidePomodoro: pomodoro.hide,
          }),
        }, PomodoroBox));

        ctx.effect(() => {
          const timer = setInterval(() => pomodoro.tick(), TICK_MS);
          return () => clearInterval(timer);
        }, 'pomodoro-box: ticker');
      },
    };
  },
});
