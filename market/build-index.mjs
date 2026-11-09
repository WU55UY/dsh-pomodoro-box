/*
 * Builds the format-1 plugin market index for this repository.
 *
 * Usage:
 *   node market/build-index.mjs --source npm  --timestamp 1794000000
 *   node market/build-index.mjs --source git  --commit <40-hex-sha> --timestamp 1794000000
 *
 * The result is written to market/index.json next to this file and must be
 * validated before publishing:
 *   npx @deepseek-ai/dsh-plugin-market-index ... (see market/README.md)
 */
import { readFileSync, writeFileSync, mkdirSync, copyFileSync } from 'node:fs'
import { dirname, join } from 'node:path'
import { fileURLToPath } from 'node:url'

const here = dirname(fileURLToPath(import.meta.url))
const root = join(here, '..')

const args = Object.fromEntries(
  process.argv.slice(2).reduce((pairs, arg, i, all) => {
    if (arg.startsWith('--')) pairs.push([arg.slice(2), all[i + 1]])
    return pairs
  }, []),
)

const source = args.source ?? 'npm'
const timestamp = Number(args.timestamp ?? Math.floor(Date.now() / 1000))
const commit = args.commit
const pkg = JSON.parse(readFileSync(join(root, 'package.json'), 'utf8'))

if (!Number.isInteger(timestamp) || timestamp <= 0) throw new Error('--timestamp must be a positive integer')
if (source === 'git' && !/^[0-9a-f]{40}$/.test(commit ?? '')) throw new Error('--source git requires --commit <40-hex-sha>')

const version = {
  version: pkg.version,
  publishTimestamp: timestamp,
  source:
    source === 'npm'
      ? { type: 'npm' }
      : { type: 'git', url: pkg.repository.url.replace(/^git\+/, '').replace(/\.git$/, ''), commit },
  engines: { dsh: pkg.engines.dsh },
}

const index = {
  format: 1,
  title: { en: 'WU55UY DSH Plugins', zh: 'WU55UY 的 DSH 插件' },
  description: {
    en: 'Bundles for DeepSeek Harness maintained by WU55UY.',
    zh: 'WU55UY 维护的 DeepSeek Harness 插件。',
  },
  metadata: {
    categories: {
      ui: { title: { en: 'UI Enhancements', zh: 'UI 增强' } },
      fun: { title: { en: 'Just for Fun', zh: '娱乐' } },
    },
  },
  plugins: [
    {
      name: pkg.name,
      title: { en: 'Pomodoro Blind Box', zh: '番茄钟盲盒' },
      description: {
        en: 'A pomodoro timer in the composer dock that opens a collectible blind box after every finished focus session, with a 15-item gallery and four rarity tiers.',
        zh: '挂在输入框下方的番茄钟，每完成一个专注段就开一个盲盒，带 15 件藏品图鉴和四档稀有度。',
      },
      icon: 'icons/pomodoro.svg',
      author: 'WU55UY',
      homepage: pkg.homepage,
      repository: { url: pkg.repository.url.replace(/^git\+/, '').replace(/\.git$/, '') },
      metadata: {
        category: 'ui',
        keywords: ['pomodoro', 'timer', 'focus', 'blind-box', 'productivity'],
      },
      'dist-tags': { latest: pkg.version },
      versions: [version],
    },
  ],
}

mkdirSync(join(here, 'icons'), { recursive: true })
copyFileSync(join(root, 'icon.svg'), join(here, 'icons', 'pomodoro.svg'))
writeFileSync(join(here, 'index.json'), JSON.stringify(index, null, 2) + '\n', 'utf8')

console.log(`market/index.json written: ${pkg.name}@${pkg.version} via ${source}`)
