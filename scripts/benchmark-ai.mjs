import { performance } from 'node:perf_hooks'
import { chooseAiMove } from '../src/ai-engine.ts'
import { apply, clone, legal } from '../src/game.ts'

const INITIAL = {
  board: [
    { side: 'gote', kind: 'giraffe' }, { side: 'gote', kind: 'lion' }, { side: 'gote', kind: 'elephant' },
    null, { side: 'gote', kind: 'chick' }, null,
    null, { side: 'sente', kind: 'chick' }, null,
    { side: 'sente', kind: 'elephant' }, { side: 'sente', kind: 'lion' }, { side: 'sente', kind: 'giraffe' },
  ],
  hands: { sente: [], gote: [] },
  turn: 'sente',
}

const sampleSize = Number.parseInt(process.env.AI_BENCHMARK_SAMPLES ?? '100', 10)
const warmupSize = Math.min(10, sampleSize)
let randomState = 0x5eed1234
function random() {
  randomState = (randomState * 1664525 + 1013904223) >>> 0
  return randomState / 0x100000000
}

function benchmarkPositions() {
  const positions = [clone(INITIAL)]
  let position = clone(INITIAL)
  while (positions.length < sampleSize) {
    const moves = legal(position)
    const nonWinning = moves.filter(move => !apply(position, move).winner)
    const choices = nonWinning.length ? nonWinning : moves
    if (!choices.length) {
      position = clone(INITIAL)
      continue
    }
    position = apply(position, choices[Math.floor(random() * choices.length)])
    if (position.winner) position = clone(INITIAL)
    else positions.push(clone(position))
  }
  return positions
}

function percentile(values, ratio) {
  const sorted = [...values].sort((a, b) => a - b)
  return sorted[Math.max(0, Math.ceil(sorted.length * ratio) - 1)]
}

const positions = benchmarkPositions()
for (const level of [2, 3, 4]) {
  for (const position of positions.slice(0, warmupSize)) {
    chooseAiMove(position, level, { randomizeTies: false })
  }
}

const rows = [2, 3, 4].map(level => {
  const times = []
  const nodeCounts = []
  for (const position of positions) {
    const started = performance.now()
    const result = chooseAiMove(position, level, { randomizeTies: false })
    times.push(performance.now() - started)
    nodeCounts.push(result.stats.nodes)
  }
  return {
    level,
    samples: positions.length,
    p50Ms: Number(percentile(times, .5).toFixed(2)),
    p90Ms: Number(percentile(times, .9).toFixed(2)),
    p95Ms: Number(percentile(times, .95).toFixed(2)),
    maxMs: Number(Math.max(...times).toFixed(2)),
    p95Nodes: Math.round(percentile(nodeCounts, .95)),
  }
})

console.table(rows)
