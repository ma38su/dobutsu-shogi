import { useEffect, useState } from 'react'
import type { AppVariant } from './App'
import type { Kind } from './game'
import './rules.css'

type Lesson = 'move' | 'capture' | 'promote'
type Square = { kind: Kind; side: 'sente' | 'gote' } | null
const NAMES: Record<AppVariant, Record<Kind, string>> = {
  okashi: { lion: 'あんみつ', giraffe: 'だんご', elephant: 'さくらもち', chick: 'こんぺいとう', hen: '花こんぺいとう' },
  samurai: { lion: '大将', giraffe: '槍武者', elephant: '弓武者', chick: '足軽', hen: '若武者' },
}
const LESSONS = {
  move: ['まずは動かしてみよう', '中央の駒を選び、光ったマスへ動かそう', 'できた！ 駒は印のある方向へ1マス動きます。'],
  capture: ['相手の駒を取ってみよう', '自分の駒で、上にいる相手の駒を取ろう', '取った駒は「持ち駒」に。次の手から空いたマスに置けます。'],
  promote: ['いちばん奥へ進もう', '自分の駒を、いちばん奥の段へ進めよう', '成った！ 奥まで進むと、動ける方向が増えます。'],
} satisfies Record<Lesson, [string, string, string]>

function pieceSrc(variant: AppVariant, kind: Kind) {
  return variant === 'samurai' ? `../../pieces/samurai/${kind === 'lion' ? 'lion-mounted-sword' : kind}.png?v=3` : `../../pieces/sweets/wagashi/${kind}.png?v=8`
}
function Piece({ variant, kind }: { variant: AppVariant; kind: Kind }) { return <img src={pieceSrc(variant, kind)} alt="" draggable={false} /> }

function MiniLesson({ variant }: { variant: AppVariant }) {
  const [lesson, setLesson] = useState<Lesson>('move'), [selected, setSelected] = useState(false), [done, setDone] = useState(false), [board, setBoard] = useState<Square[]>([]), [hand, setHand] = useState(false)
  const reset = (id = lesson) => {
    setSelected(false); setDone(false); setHand(false)
    setBoard(id === 'move' ? [null, null, null, null, { kind: 'giraffe', side: 'sente' }, null, null, null, null] : id === 'capture' ? [null, { kind: 'chick', side: 'gote' }, null, null, { kind: 'giraffe', side: 'sente' }, null, null, null, null] : [null, null, null, null, { kind: 'chick', side: 'sente' }, null, null, null, null])
  }
  useEffect(() => reset(lesson), [lesson])
  const source = board.findIndex(piece => piece?.side === 'sente'), target = lesson === 'move' ? 3 : 1
  const tap = (index: number) => {
    if (done) return
    if (index === source) return setSelected(true)
    if (!selected || index !== target) return setSelected(false)
    const next = [...board], moving = next[source]!
    next[source] = null; next[target] = lesson === 'promote' ? { ...moving, kind: 'hen' } : moving
    setBoard(next); setHand(lesson === 'capture'); setSelected(false); setDone(true)
  }
  return <section className="try-card">
    <div className="try-heading"><span>やってみよう</span><div><h2>{LESSONS[lesson][0]}</h2><p>{done ? LESSONS[lesson][2] : LESSONS[lesson][1]}</p></div></div>
    <div className="lesson-tabs" role="tablist">{(['move', 'capture', 'promote'] as Lesson[]).map((id, i) => <button key={id} role="tab" aria-selected={lesson === id} className={lesson === id ? 'active' : ''} onClick={() => setLesson(id)}>{i + 1}<span>{id === 'move' ? '動かす' : id === 'capture' ? '取る' : '成る'}</span></button>)}</div>
    <div className="lesson-stage"><div className={`mini-board ${done ? 'complete' : ''}`}>{board.map((piece, index) => <button key={index} className={`${selected && index === target ? 'target' : ''} ${selected && index === source ? 'selected' : ''}`} onClick={() => tap(index)} aria-label={piece ? `${NAMES[variant][piece.kind]}を選ぶ` : '空きマス'}>{piece && <span className={piece.side}><Piece variant={variant} kind={piece.kind} /></span>}</button>)}</div>
      <aside className="lesson-side"><div className="lesson-hand"><small>持ち駒</small>{hand ? <Piece variant={variant} kind="chick" /> : <span>まだありません</span>}</div><div className={done ? 'lesson-message success' : 'lesson-message'} role="status">{done ? '✓ クリア！' : selected ? '光るマスをタップ' : '駒をタップしてね'}</div>{done && <button className="retry" onClick={() => reset()}>もう一度</button>}</aside></div>
  </section>
}

const MOVE_COPY: Record<Kind, string> = { lion: 'すべての方向', giraffe: '前後と左右', elephant: 'ななめ4方向', chick: '前へ1マスだけ', hen: '後ろななめ以外' }
function MoveCard({ variant, kind }: { variant: AppVariant; kind: Kind }) { return <article className="move-card"><div className={`move-demo ${kind}`}><i /><Piece variant={variant} kind={kind} /></div><b>{NAMES[variant][kind]}</b><small>{MOVE_COPY[kind]}</small></article> }

export default function Rules({ variant }: { variant: AppVariant }) {
  const samurai = variant === 'samurai', names = NAMES[variant], title = samurai ? 'さむらいしょうぎ' : 'おかししょうぎ'
  return <main className={`rules-shell ${variant}`}>
    <header className="rules-header"><a href="../../">← トップへ</a><span>{samurai ? 'さ' : 'お'}</span><a className="play-link" href={`../../${variant}/`}>さっそく遊ぶ</a></header>
    <section className="rules-hero"><div><small>3分でわかる</small><h1>{title}の<br />あそびかた</h1><p>3×4の小さな盤で遊ぶ、やさしい将棋。<br />駒を動かしながら覚えよう。</p></div><div className="hero-pieces"><Piece variant={variant} kind="lion" /><Piece variant={variant} kind="chick" /></div></section>
    <section className="rule-summary"><article><span>1</span><div><b>交代で1手ずつ</b><p>駒を1つ動かすか、持ち駒を空いたマスに置きます。</p></div></article><article><span>2</span><div><b>重なれば取れる</b><p>相手の駒がいるマスへ進むと、その駒を味方にできます。</p></div></article><article><span>3</span><div><b>味方とは重なれない</b><p>盤の外や、味方の駒がいるマスへは動かせません。</p></div></article></section>
    <MiniLesson variant={variant} />
    <section className="rules-section"><div className="section-title"><span>駒の動き</span><h2>印の方向へ、1マス</h2><p>向きが変わると「前」も変わります。白い点が動ける場所です。</p></div><div className="move-list">{(['lion', 'giraffe', 'elephant', 'chick', 'hen'] as Kind[]).map(kind => <MoveCard key={kind} variant={variant} kind={kind} />)}</div></section>
    <section className="rules-section"><div className="section-title"><span>勝ちと負け</span><h2>勝ち方は3つ</h2></div><div className="win-grid"><article><i>①</i><b>{names.lion}を取る</b><p>相手の{names.lion}がいるマスへ、自分の駒を進めます。</p></article><article><i>②</i><b>詰みにする</b><p>王手をかけ、相手の{names.lion}がどこにも逃げられなければ勝ち。</p></article><article><i>③</i><b>トライする</b><p>{names.lion}を相手側の最奥段へ。次に取られない場所なら勝ち。</p></article></div><div className="lose-note"><strong>こんなときは負け</strong><p>{names.lion}を取られる／詰みにされる／相手にトライされる。また、通常モードでは{names.lion}を取られる場所へ自分で動かしても負けです。</p></div></section>
    <section className="rules-section"><div className="section-title"><span>ここに注意</span><h2>まちがえやすいポイント</h2></div><div className="careful-list"><p><b>「王手」と言わなくてもOK</b><span>王手の宣言は必要ありません。</span></p><p><b>取った駒は自分の向きで使う</b><span>{names.hen}を取ったときは、{names.chick}に戻ります。</span></p><p><b>{names.chick}は奥に置けない</b><span>次に動けなくなるため、持ち駒から最奥段へは置けません。</span></p><p><b>トライは安全なときだけ</b><span>奥へ着いても、すぐ相手に取られる場所なら勝ちではありません。</span></p></div></section>
    <section className="rules-cta"><Piece variant={variant} kind="lion" /><div><small>準備はできた？</small><h2>さっそく対局してみよう</h2><a href={`../../${variant}/`}>{title}をはじめる →</a></div></section>
  </main>
}
