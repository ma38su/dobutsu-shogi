import { useCallback, useEffect, useMemo, useState } from 'react'
import AiWorker from './ai.worker?worker&inline'
import type {AiSearchStats} from './ai-engine'
import {apply,attacked,clone,isInCheck,legal,other,pseudo,vec,type Kind,type Move,type Position,type Side} from './game'
import {applyPuzzle,puzzleMateDistance,puzzleWinningMoves} from './puzzle-engine'
import {PUZZLES,PUZZLE_LEVELS,type PuzzleDefinition,type PuzzleDifficulty} from './puzzles'
import {buildReview,immediateWinningMoves,type ReviewMoment} from './review-engine'
import './App.css'
import './board-fix.css'
type RuleMode='normal'|'beginner'; type PieceSet='wagashi'|'western'|'mix'; type VisualTheme='sweets'; type AppMode='menu'|'battle'|'puzzle'; export type AppVariant='okashi'|'samurai'
type AiDebugResult={move?:Move;stats:AiSearchStats}
const F=['1','2','3'],R=['一','二','三','四']; const L:Record<PieceSet,Record<Kind,string>>={wagashi:{lion:'あんみつ',giraffe:'だんご',elephant:'さくらもち',chick:'こんぺいとう',hen:'花こんぺいとう'},western:{lion:'ケーキ',giraffe:'エクレア',elephant:'カップケーキ',chick:'マカロン',hen:'キャンディ'},mix:{lion:'パフェ',giraffe:'プリン',elephant:'いちご大福',chick:'クッキー',hen:'王冠クッキー'}}
const VISUAL_THEMES:Record<VisualTheme,{label:string;pieceRoot:string}>={sweets:{label:'おかし',pieceRoot:'./pieces/sweets'}}
const SAMURAI_NAMES:Record<Kind,string>={lion:'大将',giraffe:'槍武者',elephant:'弓武者',chick:'足軽',hen:'若武者'}
const INITIAL:Position={board:[{side:'gote',kind:'giraffe'},{side:'gote',kind:'lion'},{side:'gote',kind:'elephant'},null,{side:'gote',kind:'chick'},null,null,{side:'sente',kind:'chick'},null,{side:'sente',kind:'elephant'},{side:'sente',kind:'lion'},{side:'sente',kind:'giraffe'}],hands:{sente:[],gote:[]},turn:'sente'}
if(import.meta.env.DEV)PUZZLES.forEach(item=>{const distance=puzzleMateDistance(item.position,'sente',item.plies),shorter=item.plies>1?puzzleMateDistance(item.position,'sente',item.plies-2):null,firstMoves=puzzleWinningMoves(item.position,'sente',item.plies);if(distance!==item.plies||shorter!==null||firstMoves.length!==1)console.error(`Invalid puzzle: ${item.id}`,{distance,shorter,firstMoves})})
const movesEqual=(a:Move,b:Move)=>a.to===b.to&&a.from===b.from&&a.hand===b.hand&&a.piece===b.piece
const note=(m:Move,names:Record<Kind,string>)=>`${m.side==='sente'?'▲':'△'}${F[m.to%3]}${R[Math.floor(m.to/3)]} ${names[m.piece]}${m.hand?'打':''}${m.promote?'成':''}`
function App({variant='okashi'}:{variant?:AppVariant}){
  const[appMode,setAppMode]=useState<AppMode>('menu'),[hist,setHist]=useState<Position[]>([clone(INITIAL)]),[moves,setMoves]=useState<Move[]>([]),[cur,setCur]=useState(0),[sel,setSel]=useState<{from?:number;hand?:number}|null>(null),[players,setPlayers]=useState<Record<Side,'human'|'ai'>>({sente:'human',gote:'ai'}),[level,setLevel]=useState(2),[ruleMode,setRuleMode]=useState<RuleMode>('normal'),[visualTheme,setVisualTheme]=useState<VisualTheme>('sweets'),[pieceSet,setPieceSet]=useState<PieceSet>('mix'),[thinking,setThinking]=useState(false),[aiDebug,setAiDebug]=useState<AiDebugResult|null>(null),[review,setReview]=useState<ReviewMoment[]|null>(null),[reviewBusy,setReviewBusy]=useState(false)
  const p=hist[cur],isSamurai=variant==='samurai',names=isSamurai?SAMURAI_NAMES:L[pieceSet],pieceRoot=isSamurai?'../pieces/samurai':'../pieces/sweets',lm=useMemo(()=>legal(p),[p]),pm=useMemo(()=>pseudo(p),[p])
  const isSelected=(m:Move)=>!!sel&&(sel.from!==undefined?m.from===sel.from:m.hand===p.hands[p.turn][sel.hand!])
  const sameMove=(a:Move,b:Move)=>a.to===b.to&&a.from===b.from&&a.hand===b.hand
  const commit=useCallback((m:Move,foul=false)=>{
    const next=apply(p,m,!foul)
    if(foul){next.winner=other(m.side);next.reason='反則負け：合法手ではない手を指しました'}
    setHist([...hist.slice(0,cur+1),next])
    setMoves([...moves.slice(0,cur),m])
    setCur(cur+1)
    setSel(null)
  },[cur,hist,moves,p])
  useEffect(()=>{
    if(appMode!=='battle'||p.winner||players[p.turn]!=='ai'){setThinking(false);return}
    setThinking(true)
    const worker=new AiWorker(),requestId=Math.random()
    const timer=window.setTimeout(()=>worker.postMessage({id:requestId,position:p,level}),350)
    worker.onmessage=(event:MessageEvent<{id:number;move?:Move;stats:AiSearchStats}>)=>{
      if(event.data.id!==requestId)return
      setAiDebug({move:event.data.move,stats:event.data.stats})
      if(event.data.move)commit(event.data.move)
      else setThinking(false)
    }
    worker.onerror=event=>{
      console.error('AI worker failed',event)
      setThinking(false)
    }
    return()=>{window.clearTimeout(timer);worker.terminate()}
  },[appMode,commit,level,p,players])
  function tap(i:number){if(thinking||p.winner||players[p.turn]==='ai')return;if(sel){const legalMove=lm.find(m=>m.to===i&&isSelected(m));if(legalMove){commit(legalMove);return}const illegalMove=pm.find(m=>m.to===i&&isSelected(m));if(illegalMove&&ruleMode==='normal'){commit(illegalMove,true);return}}const x=p.board[i];setSel(x?.side===p.turn?{from:i}:null)}
  function reset(){setHist([clone(INITIAL)]);setMoves([]);setCur(0);setSel(null);setAiDebug(null);setReview(null)}
  function openReview(){setReviewBusy(true);window.setTimeout(()=>{setReview(buildReview(hist,moves,players));setReviewBusy(false)},40)}
  const selectedPseudo=sel?pm.filter(isSelected):[],targets=new Set(selectedPseudo.filter(m=>lm.some(x=>sameMove(x,m))).map(m=>m.to)),illegalTargets=new Set(selectedPseudo.filter(m=>!lm.some(x=>sameMove(x,m))).map(m=>m.to))
if(appMode==='menu')return <ModeMenu variant={variant} pieceSet={pieceSet} pieceRoot={pieceRoot} onBattle={()=>setAppMode('battle')} onPuzzle={()=>setAppMode('puzzle')}/>
if(appMode==='puzzle')return <PuzzleMode variant={variant} names={names} pieceSet={pieceSet} setPieceSet={setPieceSet} pieceRoot={pieceRoot} onExit={()=>setAppMode('menu')}/>
if(review)return <ReviewScreen moments={review} variant={variant} names={names} pieceSet={pieceSet} pieceRoot={pieceRoot} onClose={()=>setReview(null)} onReset={reset}/>
return <main className={`app-shell ${isSamurai?'samurai':`sweets-${pieceSet}`}`}><header><div className="brand"><span>{isSamurai?'さ':'お'}</span><div><h1>{isSamurai?'さむらいしょうぎ':'おかししょうぎ'}</h1><p>対局モード</p></div></div><div className="header-actions"><button className="new" onClick={()=>setAppMode('menu')}>モード選択</button><button className="new" onClick={reset}>新しい対局</button></div></header><section className="game-card">
{(['gote']as Side[]).map(s=><Player key={s} side={s} p={p} thinking={thinking} players={players} setPlayers={setPlayers}/>)}<Hand side="gote" p={p} sel={sel} setSel={setSel} players={players} pieceSet={pieceSet} names={names} pieceRoot={pieceRoot}/><div className="board">{p.board.map((x,i)=><button key={i} onClick={()=>tap(i)} className={`square ${(Math.floor(i/3)+i%3)%2?'shade':''} ${sel?.from===i?'chosen':''} ${targets.has(i)?'target':''} ${ruleMode==='beginner'&&illegalTargets.has(i)?'illegal-target':''}`} aria-label={`${F[i%3]}${R[Math.floor(i/3)]}${x?names[x.kind]:'空き'}${ruleMode==='beginner'&&illegalTargets.has(i)?'、合法手ではありません':''}`}>{x&&<><MovementGuides kind={x.kind} side={x.side}/><div className={`piece ${x.side}`}><PieceIcon kind={x.kind} pieceSet={pieceSet} pieceRoot={pieceRoot}/></div></>}</button>)}</div><Hand side="sente" p={p} sel={sel} setSel={setSel} players={players} pieceSet={pieceSet} names={names} pieceRoot={pieceRoot}/>{(['sente']as Side[]).map(s=><Player key={s} side={s} p={p} thinking={thinking} players={players} setPlayers={setPlayers}/>)}{p.winner&&<div className="result"><span>{p.reason?.startsWith('反則負け')?'❌':'🎉'}</span><div><b>{p.winner==='sente'?'せんて':'ごて'}の勝ち！</b><small>{p.reason}</small></div><div className="result-actions"><button className="review-start" onClick={openReview} disabled={reviewBusy}>{reviewBusy?'考え中…':'いっしょにおさらい'}</button><button onClick={reset}>もう一局</button></div></div>}</section>
<section className="controls"><div className="timeline"><button onClick={()=>setCur(0)} disabled={!cur}>|◀</button><button onClick={()=>setCur(cur-1)} disabled={!cur}>◀ 待った</button><div><b>{cur}</b> / {moves.length} 手</div><button onClick={()=>setCur(cur+1)} disabled={cur>=hist.length-1}>進む ▶</button><button onClick={()=>setCur(hist.length-1)} disabled={cur>=hist.length-1}>▶|</button></div><div className="setting"><div><b>対局モード</b><span>{ruleMode==='normal'?'不正手は反則負けになります':'不正な移動先を❌で案内します'}</span></div><select value={ruleMode} onChange={e=>{setRuleMode(e.target.value as RuleMode);setSel(null)}}><option value="normal">通常</option><option value="beginner">入門</option></select></div><div className="setting"><div><b>AIのつよさ</b><span>端末の中だけで考えます</span></div><select value={level} onChange={e=>setLevel(+e.target.value)}><option value="1">やさしい</option><option value="2">ふつう</option><option value="3">つよい</option><option value="4">とてもつよい</option></select></div>{import.meta.env.DEV&&<AiDebug result={aiDebug} names={names}/>} {!isSamurai&&<><div className="setting"><div><b>見た目のテーマ</b><span>新しいテーマを追加できます</span></div><select value={visualTheme} onChange={e=>setVisualTheme(e.target.value as VisualTheme)}>{Object.entries(VISUAL_THEMES).map(([id,v])=><option key={id} value={id}>{v.label}</option>)}</select></div><div className="setting"><div><b>おかしの種類</b><span>対局中も変更できます</span></div><select value={pieceSet} onChange={e=>setPieceSet(e.target.value as PieceSet)}><option value="wagashi">和菓子</option><option value="western">洋菓子</option><option value="mix">和洋MIX</option></select></div></>}{isSamurai?<div className="battlefield-setting"><div><b>舞台</b><span>草原と土の戦場</span></div><strong>戦場</strong></div>:<div className="board-setting"><div><b>盤のデザイン</b><span>対局中も変更できます</span></div><BoardStylePicker/></div>}<details><summary>棋譜を見る <span>{moves.length}手</span></summary><ol>{moves.map((m,i)=><li className={cur===i+1?'current':''} key={i}><button onClick={()=>setCur(i+1)}>{note(m,names)}</button></li>)}</ol></details></section><footer>対局はこの端末だけで進みます · オフラインでも遊べます</footer></main>}
function AiDebug({result,names}:{result:AiDebugResult|null;names:Record<Kind,string>}){
  if(!result)return <aside className="ai-debug"><b>AI探索情報（開発用）</b><span>AIが指すと計測結果を表示します</span></aside>
  const{stats,move}=result,hitRate=stats.nodes?stats.tableHits/stats.nodes*100:0
  return <aside className="ai-debug"><b>AI探索情報（開発用）</b><span>{move?note(move,names):'指し手なし'}</span><dl><div><dt>局面</dt><dd>{stats.nodes.toLocaleString()}</dd></div><div><dt>置換表</dt><dd>{stats.tableHits.toLocaleString()}回 ({hitRate.toFixed(1)}%)</dd></div><div><dt>枝刈り</dt><dd>{stats.cutoffs.toLocaleString()}回</dd></div><div><dt>深さ</dt><dd>{stats.maxPly} / {stats.depth}</dd></div><div><dt>時間</dt><dd>{stats.durationMs.toFixed(1)} ms</dd></div><div><dt>評価</dt><dd>{stats.value===null?'—':stats.value.toFixed(1)}</dd></div><div><dt>保存局面</dt><dd>{stats.tableSize.toLocaleString()}</dd></div></dl></aside>
}
function ModeMenu({variant,pieceSet,pieceRoot,onBattle,onPuzzle}:{variant:AppVariant;pieceSet:PieceSet;pieceRoot:string;onBattle:()=>void;onPuzzle:()=>void}){
  const isSamurai=variant==='samurai',title=isSamurai?'さむらいしょうぎ':'おかししょうぎ'
  return <main className={`mode-shell ${variant}`}>
    <header className="mode-header">
      <a href="../" aria-label="しょうぎの種類を選ぶ">← もどる</a>
      <div className="brand"><span>{isSamurai?'さ':'お'}</span><div><h1>{title}</h1><p>あそびかたを えらぼう</p></div></div>
    </header>
    <section className="mode-intro">
      <div className="mode-heroes" aria-hidden="true"><PieceIcon kind="lion" pieceSet={pieceSet} pieceRoot={pieceRoot}/><PieceIcon kind="chick" pieceSet={pieceSet} pieceRoot={pieceRoot}/></div>
      <h2>きょうは どっちであそぶ？</h2>
      <p>対局と詰将棋は、いつでもここから選べます。</p>
    </section>
    <section className="mode-choices" aria-label="モードを選ぶ">
      <button className="mode-choice battle" onClick={onBattle}><span className="mode-icon">対</span><span><small>AIや家族と勝負</small><b>対局する</b><em>いつもの3×4のしょうぎ</em></span><i>→</i></button>
      <button className="mode-choice puzzle" onClick={onPuzzle}><span className="mode-icon">詰</span><span><small>ひとりでじっくり</small><b>詰将棋に挑戦</b><em>1手・3手・5手の全{PUZZLES.length}問</em></span><i>→</i></button>
    </section>
  </main>
}
function PuzzleMode({variant,names,pieceSet,setPieceSet,pieceRoot,onExit}:{variant:AppVariant;names:Record<Kind,string>;pieceSet:PieceSet;setPieceSet:(value:PieceSet)=>void;pieceRoot:string;onExit:()=>void}){
  const progressKey=`${variant}-puzzle-progress-v2`
  const[difficulty,setDifficulty]=useState<PuzzleDifficulty>('starter'),[selected,setSelected]=useState<PuzzleDefinition|null>(null),[completed,setCompleted]=useState<Set<string>>(()=>{try{return new Set(JSON.parse(localStorage.getItem(progressKey)??'[]') as string[])}catch{return new Set()}})
  const finish=(id:string)=>{setCompleted(previous=>{const next=new Set(previous).add(id);localStorage.setItem(progressKey,JSON.stringify([...next]));return next})}
  useEffect(()=>{if(selected)window.scrollTo({top:0,left:0,behavior:'instant'})},[selected])
  const selectedIndex=selected?PUZZLES.findIndex(item=>item.id===selected.id):-1,nextPuzzle=selectedIndex>=0?PUZZLES[selectedIndex+1]:undefined
  if(selected)return <PuzzlePlay key={selected.id} puzzle={selected} variant={variant} names={names} pieceSet={pieceSet} pieceRoot={pieceRoot} onBack={()=>setSelected(null)} onNext={nextPuzzle?()=>{setDifficulty(nextPuzzle.difficulty);setSelected(nextPuzzle)}:undefined} onComplete={()=>finish(selected.id)}/>
  const level=PUZZLE_LEVELS[difficulty],items=PUZZLES.filter(item=>item.difficulty===difficulty),isSamurai=variant==='samurai'
  return <main className={`puzzle-shell ${variant}`}>
    <header className="puzzle-header"><button onClick={onExit}>← モード選択</button><div><b>{isSamurai?'さむらい詰将棋':'おかし詰将棋'}</b><span>{completed.size} / {PUZZLES.length} クリア</span></div></header>
    <section className="puzzle-hero"><div><span>ひとりで じっくり</span><h1>詰将棋に挑戦！</h1><p>王手を続けて、最後に{names.lion}の逃げ道をなくそう。</p></div><div className="puzzle-hero-piece"><PieceIcon kind="lion" pieceSet={pieceSet} pieceRoot={pieceRoot}/></div></section>
    {variant==='okashi'&&<label className="puzzle-piece-set"><span><b>おかしの種類</b><small>好きな見た目で挑戦できます</small></span><select value={pieceSet} onChange={event=>setPieceSet(event.target.value as PieceSet)}><option value="wagashi">和菓子</option><option value="western">洋菓子</option><option value="mix">和洋MIX</option></select></label>}
    <nav className="difficulty-tabs" aria-label="難易度を選ぶ">{(Object.entries(PUZZLE_LEVELS) as [PuzzleDifficulty,typeof level][]).map(([id,item])=><button key={id} className={difficulty===id?'active':''} onClick={()=>setDifficulty(id)}><small>{item.short}</small><b>{item.label}</b></button>)}</nav>
    <section className="difficulty-copy"><div className={`difficulty-mark ${difficulty}`}>{level.plies}</div><div><h2>{level.short} · {level.label}</h2><p>{level.description}</p></div></section>
    <section className="puzzle-list">{items.map((item,index)=><button key={item.id} className={`puzzle-card ${completed.has(item.id)?'completed':''}`} onClick={()=>setSelected(item)}><span className="puzzle-number">{completed.has(item.id)?'✓':index+1}</span><span><b>{item.title}</b><small>{item.mission.replace('ライオン',names.lion)}</small></span><em>{item.plies}手</em><i>›</i></button>)}</section>
    <p className="puzzle-note">問題と相手の応手は、すべて端末の中で動きます。</p>
  </main>
}
function PuzzlePlay({puzzle,variant,names,pieceSet,pieceRoot,onBack,onNext,onComplete}:{puzzle:PuzzleDefinition;variant:AppVariant;names:Record<Kind,string>;pieceSet:PieceSet;pieceRoot:string;onBack:()=>void;onNext?:()=>void;onComplete:()=>void}){
  const attacker:Side='sente'
  type WrongPreview={move:Move;reply?:Move;message?:string;done:boolean}
  const[current,setCurrent]=useState(()=>clone(puzzle.position)),[remaining,setRemaining]=useState<number>(puzzle.plies),[selected,setSelected]=useState<{from?:number;hand?:Kind}|null>(null),[feedback,setFeedback]=useState<'wrong'|'good'|'your-turn'|null>(null),[hintStage,setHintStage]=useState(0),[thinking,setThinking]=useState(false),[solved,setSolved]=useState(false),[attempts,setAttempts]=useState(0),[wrongPreview,setWrongPreview]=useState<WrongPreview|null>(null)
  const userMoves=useMemo(()=>pseudo(current),[current]),sourceMatches=(m:Move)=>!!selected&&(selected.from!==undefined?m.from===selected.from:m.hand===selected.hand),targets=new Set(selected?userMoves.filter(sourceMatches).map(m=>m.to):[])
  const winningMoves=current.turn===attacker&&!solved&&!wrongPreview?puzzleWinningMoves(current,attacker,remaining):[],hintMove=winningMoves[0]
  useEffect(()=>{
    if(solved||current.winner||current.turn===attacker||wrongPreview?.done){setThinking(false);return}
    if(wrongPreview){
      setThinking(true)
      const timer=window.setTimeout(()=>{
        const replies=legal(current),checked=isInCheck(current,current.turn)
        const attackerLion=current.board.findIndex(piece=>piece?.side===attacker&&piece.kind==='lion')
        const lionCapture=attackerLion>=0?pseudo(current).find(move=>move.to===attackerLion&&move.captured==='lion'):undefined
        const lionReplies=replies.filter(move=>move.piece==='lion')
        const checkerCaptures=replies.filter(move=>move.to===wrongPreview.move.to&&move.captured)
        const choice=lionCapture??(checked?lionReplies[0]??checkerCaptures[0]:lionReplies[0])??replies[0]
        if(!choice){
          setWrongPreview(preview=>preview?{...preview,done:true,message:`その手は${names.lion}への王手になっていません。相手に合法手はありませんが、王手ではないため詰みではありません。`}:preview)
          setThinking(false)
          return
        }
        const replyText=note(choice,names),destination=squareName(choice.to)
        const action=choice.captured==='lion'
          ?`${names[choice.piece]}が ${destination} で、こちらの${names.lion}を取れます。`
          :choice.piece==='lion'
          ?choice.captured?`${names.lion}が ${destination} で王手した駒を取れます。`:`${names.lion}が ${destination} へ逃げられます。`
          :choice.captured?`${names[choice.piece]}が ${destination} で王手した駒を取れます。`
          :choice.hand?`${names[choice.piece]}を ${destination} へ打って応じられます。`
          :`${names[choice.piece]}を ${destination} へ動かして応じられます。`
        const message=`${checked?'王手はかかりましたが、':'その手は王手になっていません。'}${action}`
        setCurrent(applyPuzzle(current,choice))
        setWrongPreview(preview=>preview?{...preview,reply:choice,message:`${message} 実際の応手は「${replyText}」です。`,done:true}:preview)
        setFeedback('wrong');setThinking(false)
      },620)
      return()=>window.clearTimeout(timer)
    }
    setThinking(true)
    const timer=window.setTimeout(()=>{
      const choices=legal(current).map(move=>({move,distance:puzzleMateDistance(applyPuzzle(current,move),attacker,remaining-1)})).sort((a,b)=>(b.distance??999)-(a.distance??999))
      const choice=choices[0]?.move
      if(choice){setCurrent(applyPuzzle(current,choice));setRemaining(value=>value-1);setFeedback('your-turn');setHintStage(0);setSelected(null)}
      setThinking(false)
    },520)
    return()=>window.clearTimeout(timer)
  },[current,remaining,solved,wrongPreview,names])
  const resetPuzzle=()=>{setCurrent(clone(puzzle.position));setRemaining(puzzle.plies);setSelected(null);setFeedback(null);setHintStage(0);setThinking(false);setSolved(false);setAttempts(0);setWrongPreview(null)}
  const chooseSquare=(to:number)=>{
    if(thinking||solved||wrongPreview||current.turn!==attacker)return
    if(selected){
      const choice=userMoves.find(move=>move.to===to&&sourceMatches(move))
      if(choice){
        if(!winningMoves.some(move=>movesEqual(move,choice))){
          setFeedback('wrong');setAttempts(value=>value+1);setSelected(null);setHintStage(0)
          if(puzzle.plies===1){
            setCurrent(apply(current,choice,false));setWrongPreview({move:choice,done:false});setThinking(true)
          }
          return
        }
        const next=applyPuzzle(current,choice)
        setCurrent(next);setRemaining(value=>value-1);setSelected(null);setFeedback('good');setHintStage(0)
        if(next.winner===attacker){setSolved(true);onComplete()}
        return
      }
    }
    const piece=current.board[to]
    setSelected(piece?.side===attacker?{from:to}:null)
    setFeedback(null)
  }
  const answerText=hintMove?(hintMove.hand?`${names[hintMove.piece]}を持ち駒から ${squareName(hintMove.to)} へ置こう`:`${squareName(hintMove.from!)} の${names[hintMove.piece]}を ${squareName(hintMove.to)} へ動かそう`):''
  return <main className={`puzzle-play-shell ${variant} ${solved?'puzzle-outcome-clear':wrongPreview?.done?'puzzle-outcome-wrong':''}`}>
    {(solved||wrongPreview?.done)&&<div className={`puzzle-outcome-effect ${solved?'clear':'wrong'}`} aria-hidden="true">{solved?<>{Array.from({length:12},(_,index)=><i key={index}/>)}</>:<b>×</b>}</div>}
    <header className="puzzle-play-header"><button onClick={onBack}>← 問題一覧</button><div><b>{PUZZLE_LEVELS[puzzle.difficulty].short}</b><span>{puzzle.title}</span></div><button onClick={resetPuzzle}>やり直す</button></header>
    <div className="puzzle-play-layout">
      <section className="puzzle-game">
        <div className="puzzle-status"><span className={`difficulty-pill ${puzzle.difficulty}`}>{PUZZLE_LEVELS[puzzle.difficulty].label}</span><b>{solved?'詰み！':wrongPreview?.done?(wrongPreview.reply?'不正解：応手があります':'不正解：王手ではありません'):wrongPreview?'相手が応手しています…':thinking?'相手が考えています…':`${remaining}手以内に詰ませよう`}</b></div>
        <PuzzleHand side="gote" position={current} selected={selected} setSelected={setSelected} disabled pieceSet={pieceSet} pieceRoot={pieceRoot} names={names}/>
        <div className="board puzzle-board">{current.board.map((piece,i)=><button key={i} onClick={()=>chooseSquare(i)} className={`square ${(Math.floor(i/3)+i%3)%2?'shade':''} ${selected?.from===i?'chosen':''} ${targets.has(i)?'target':''} ${hintStage>=1&&hintMove?.from===i?'puzzle-hint-source':''} ${hintStage>=2&&hintMove?.to===i?'puzzle-hint-target':''} ${wrongPreview?.move.to===i?'puzzle-wrong-move':''} ${wrongPreview?.reply?.from===i?'puzzle-reply-source':''} ${wrongPreview?.reply?.to===i?'puzzle-reply-target':''}`} aria-label={`${squareName(i)} ${piece?names[piece.kind]:'空き'}`}>{piece&&<><MovementGuides kind={piece.kind} side={piece.side}/><div className={`piece ${piece.side}`}><PieceIcon kind={piece.kind} pieceSet={pieceSet} pieceRoot={pieceRoot}/></div></>}</button>)}</div>
        <PuzzleHand side="sente" position={current} selected={selected} setSelected={value=>{if(!thinking&&!solved&&!wrongPreview&&current.turn===attacker){setSelected(value);setFeedback(null)}}} disabled={thinking||solved||!!wrongPreview||current.turn!==attacker} pieceSet={pieceSet} pieceRoot={pieceRoot} names={names} hintKind={hintStage>=1?hintMove?.hand:undefined}/>
      </section>
      <section className={`puzzle-guide ${feedback??''} ${solved?'solved':''} ${wrongPreview?'wrong-preview':''}`} aria-live="polite">
        {solved?<><div className="puzzle-celebrate">🎉</div><span>クリア！</span><h1>{attempts?'あきらめずに見つけたね！':'読み切ったね！'}</h1><p>{puzzle.plies}手の詰みを完成させました。別の問題にも挑戦してみよう。</p><div className="puzzle-guide-actions"><button className="primary next-puzzle" onClick={onNext??onBack}>{onNext?'つぎの問題へ →':'全問クリア！ 問題一覧へ'}</button><button onClick={onBack}>問題一覧</button><button onClick={resetPuzzle}>もう一度</button></div></>:wrongPreview?<><div className="puzzle-wrong-mark">×</div><span className="puzzle-wrong-label">{wrongPreview.done?'不正解':'応手を確認中'}</span><h1>{wrongPreview.done?(wrongPreview.reply?'相手に一手返されました':'王手になっていません'):'その手のあとを見てみよう'}</h1><p>{wrongPreview.message??`相手がどう応じるか、盤面で確認しています。`}</p>{wrongPreview.reply&&<div className="puzzle-wrong-reply"><b>相手の応手</b><span>{note(wrongPreview.reply,names)}</span></div>}<div className="puzzle-guide-actions"><button className="primary retry-puzzle" onClick={resetPuzzle} disabled={!wrongPreview.done}>もう一度考える</button><button onClick={onBack}>問題一覧</button></div></>:<>
          <span className="puzzle-guide-label">今回のミッション</span><h1>{puzzle.mission.replace('ライオン',names.lion)}</h1>
          <p>{feedback==='wrong'?'その手では、相手に逃げ道が残るよ。別の手を考えてみよう。':feedback==='good'?'いい王手！ 相手の返しも見てみよう。':feedback==='your-turn'?'相手が逃げたよ。次の一手で追いかけよう。':'下側の自分の駒を選んで、行き先をタップしよう。'}</p>
          {hintStage>=2&&answerText&&<div className="puzzle-answer">{answerText}</div>}
          <div className="puzzle-guide-actions"><button onClick={()=>setHintStage(stage=>Math.min(2,stage+1))} disabled={thinking||hintStage>=2}>{hintStage===0?'動かす駒のヒント':hintStage===1?'行き先も見る':'答えを表示中'}</button><button onClick={resetPuzzle}>最初から</button></div>
        </>}
      </section>
    </div>
  </main>
}
function PuzzleHand({side,position,selected,setSelected,disabled,pieceSet,pieceRoot,names,hintKind}:{side:Side;position:Position;selected:{from?:number;hand?:Kind}|null;setSelected:(value:{hand:Kind})=>void;disabled:boolean;pieceSet:PieceSet;pieceRoot:string;names:Record<Kind,string>;hintKind?:Kind}){
  const pieces=position.hands[side]
  return <div className={`hand puzzle-hand ${side}`}><span>もちごま</span><div>{pieces.length?pieces.map((kind,index)=><button key={`${kind}-${index}`} disabled={disabled} onClick={()=>setSelected({hand:kind})} className={`${selected?.from===undefined&&selected?.hand===kind?'selected':''} ${hintKind===kind?'puzzle-hint-source':''}`} aria-label={handPieceLabel(kind,names)} title={`置いたあとの動き：${movementLabel(kind)}`}><MovementGuides kind={kind} side={side} compact/><PieceIcon kind={kind} pieceSet={pieceSet} pieceRoot={pieceRoot}/></button>):<em>なし</em>}</div>{pieces.length>0&&<small className="hand-move-key" aria-hidden="true"><i/>置いた後の動き</small>}</div>
}
function BoardStylePicker(){return <fieldset className="board-styles"><legend>盤のデザイン</legend><label><input id="board-box" type="radio" name="board-style" defaultChecked/><span>おかし箱</span></label><label><input id="board-wood" type="radio" name="board-style"/><span>木の盤</span></label><label><input id="board-grass" type="radio" name="board-style"/><span>若草</span></label><label><input id="board-ink" type="radio" name="board-style"/><span>墨色</span></label></fieldset>}
function Player({side,p,thinking,players,setPlayers}:{side:Side;p:Position;thinking:boolean;players:Record<Side,'human'|'ai'>;setPlayers:(v:Record<Side,'human'|'ai'>)=>void}){return <div className={`player ${side} ${p.turn===side?'active':''}`}><div className={`avatar ${side}`}>{side==='sente'?'先':'後'}</div><div className="info"><b>{side==='sente'?'先手':'後手'}</b><span>{p.turn===side?(thinking?'● かんがえ中…':'● 手番です'):'待っています'}</span></div><select aria-label={`${side==='sente'?'先手':'後手'}の担当`} value={players[side]} onChange={e=>setPlayers({...players,[side]:e.target.value as 'human'|'ai'})}><option value="human">👤 人間</option><option value="ai">🤖 AI</option></select></div>}
function PieceIcon({kind,pieceSet,pieceRoot}:{kind:Kind;pieceSet:PieceSet;pieceRoot:string}){const samuraiFile=kind==='lion'?'lion-mounted-sword':kind;const src=pieceRoot.endsWith('/samurai')?`${pieceRoot}/${samuraiFile}.png?v=3`:`${pieceRoot}/${pieceSet}/${kind}.png?v=8`;return <img className="piece-icon sweet-icon" src={src} alt="" draggable={false}/>}
function MovementGuides({kind,side,compact=false}:{kind:Kind;side:Side;compact?:boolean}){return <span className={`movement-guides${compact?' hand-movement-guides':''}`} aria-hidden="true">{vec(kind,side).map(([dr,dc])=><i key={`${dr},${dc}`} style={{gridRow:dr+2,gridColumn:dc+2,alignSelf:dr<0?'start':dr>0?'end':'center',justifySelf:dc<0?'start':dc>0?'end':'center'}}/>)}</span>}
function movementLabel(kind:Kind){return kind==='lion'?'まわり8方向に1マス':kind==='giraffe'?'たて・よこに1マス':kind==='elephant'?'ななめに1マス':kind==='chick'?'前に1マス':'前3方向と横、うしろに1マス'}
function handPieceLabel(kind:Kind,names:Record<Kind,string>){return `${names[kind]}。置いたあとは${movementLabel(kind)}動けます。選ぶと置ける場所を表示します`}
function Hand({side,p,sel,setSel,players,pieceSet,names,pieceRoot}:{side:Side;p:Position;sel:{from?:number;hand?:number}|null;setSel:(v:{hand:number})=>void;players:Record<Side,'human'|'ai'>;pieceSet:PieceSet;names:Record<Kind,string>;pieceRoot:string}){
  const pieces=p.hands[side]
  return <div className={`hand ${side}`}><span>もちごま</span><div>{pieces.length?pieces.map((kind,index)=><button aria-label={handPieceLabel(kind,names)} title={`置いたあとの動き：${movementLabel(kind)}`} disabled={p.turn!==side||players[side]==='ai'} onClick={()=>setSel({hand:index})} className={sel?.hand===index&&sel.from===undefined?'selected':''} key={index}><MovementGuides kind={kind} side={side} compact/><PieceIcon kind={kind} pieceSet={pieceSet} pieceRoot={pieceRoot}/></button>):<em>なし</em>}</div>{pieces.length>0&&<small className="hand-move-key" aria-hidden="true"><i/>置いた後の動き</small>}</div>
}
type ReviewLesson={title:string;action:string;result:string;reason:string}
const squareName=(i:number)=>`${F[i%3]}${R[Math.floor(i/3)]}`
function immediateWin(p:Position){return immediateWinningMoves(p)[0]}
function lessonFor(moment:ReviewMoment,names:Record<Kind,string>):ReviewLesson{
  const {position,best,played,kind}=moment
  const afterBest=apply(position,best),afterPlayed=apply(position,played)
  const target=position.board[best.to]
  const action=best.hand
    ?`${names[best.piece]}を、もちごまから ${squareName(best.to)} に置く`
    :`${names[best.piece]}を、${squareName(best.from!)} から ${squareName(best.to)} へ動かす`
  if(kind==='mate1'){
    if(target?.kind==='lion')return{title:`1手で 相手の${names.lion}をつかまえよう`,action,result:`${names[best.piece]}が相手の${names.lion}をつかまえる`,reason:'この一手を指したところで勝ちになるから、見逃していた1手詰めだよ。'}
    if(afterBest.reason?.includes('トライ'))return{title:'1手で トライを決めよう',action,result:`${names.lion}が相手側のいちばん奥まで進む`,reason:`その場所は相手の駒に取られないので、この一手でトライが決まるよ。`}
    return{title:'1手で 相手の逃げ道をなくそう',action,result:'相手が動かせる駒も、置ける持ち駒もなくなる',reason:'この一手のあと、相手には指せる手がないので詰みになるよ。'}
  }
  if(kind==='capture'&&target)return{title:`相手の${names[target.kind]}を取ろう`,action,result:`相手の${names[target.kind]}を取って、もちごまにできる`,reason:'取った駒は、あとで空いている場所へ置いて仲間として使えるからだよ。'}
  if(kind==='escape'){
    const threat=immediateWin(afterPlayed)
    const threatAfter=threat?apply(afterPlayed,threat):undefined
    const threatText=!threat?'そのままだと、相手が次の一手で勝てるところだった'
      :threatAfter?.reason?.includes('つかまえ')?`そのままだと、相手の${names[threat.piece]}が ${squareName(threat.to)} へ来て、${names.lion}をつかまえられた`
      :threatAfter?.reason?.includes('トライ')?`そのままだと、相手の${names.lion}が ${squareName(threat.to)} へ進み、トライで勝てた`
      :`そのままだと、相手の${names[threat.piece]}が ${squareName(threat.to)} へ来て、こちらの逃げ道がなくなり詰みになった`
    return{title:'助かる一手を見つけよう',action,result:'相手が次の一手で勝てなくなる',reason:`${threatText}から、逃げる・守る・相手を取る手のどれかで先に助けるんだよ。`}
  }
  if(kind==='try')return{title:`${names.lion}をゴールへ進めよう`,action,result:`${names.lion}が相手側のいちばん奥へ進む`,reason:'相手の駒が届かない場所なので、安全にトライをねらえるよ。'}
  if(kind==='safety'){
    const attacker=pseudo({...afterPlayed,hands:{sente:[],gote:[]}},other(position.turn)).find(m=>m.to===played.to)
    return{title:`${names[played.piece]}を取られない場所へ動かそう`,action,result:`${names[best.piece]}が相手にすぐ取られない場所へ移る`,reason:`実際の手では相手の${attacker?names[attacker.piece]:'駒'}が動ける場所に入っていたので、先に安全な場所へ動かすんだよ。`}
  }
  if(kind==='praise'){
    if(target)return{title:`さっきの「${names[target.kind]}を取る手」をもう一度`,action,result:`相手の${names[target.kind]}を取って、もちごまにできる`,reason:'相手の駒を減らし、自分はその駒をあとで使えるから、よい一手だよ。'}
    if(best.promote)return{title:'さっきのパワーアップする手をもう一度',action,result:`${names[best.piece]}が${names.hen}にパワーアップする`,reason:`動ける方向が増えて、次の手からもっと活躍できるから、よい一手だよ。`}
    const enemyLion=afterBest.board.findIndex(x=>x?.side===other(position.turn)&&x.kind==='lion')
    if(enemyLion>=0&&attacked(afterBest,enemyLion,position.turn))return{title:`さっきの${names.lion}をねらう手をもう一度`,action,result:`次の手で相手の${names.lion}をつかまえられる形になる`,reason:`相手は${names.lion}を助ける必要があり、こちらから攻め続けられるから、よい一手だよ。`}
    return{title:'さっきのよい一手をもう一度',action,result:`${names[best.piece]}が ${squareName(best.to)} で次の手をねらえる`,reason:`${names.lion}を危険にせず、続けて攻めたり守ったりできる手だからだよ。`}
  }
  const opponentMoves=legal(afterBest).length
  return{title:'相手が動きにくくなる一手を指そう',action,result:`相手が選べる手を ${opponentMoves}こにしぼる`,reason:'相手の自由を少なくすると、こちらが次の作戦を進めやすくなるからだよ。'}
}
function ReviewScreen({moments,variant,names,pieceSet,pieceRoot,onClose,onReset}:{moments:ReviewMoment[];variant:AppVariant;names:Record<Kind,string>;pieceSet:PieceSet;pieceRoot:string;onClose:()=>void;onReset:()=>void}){
  const[index,setIndex]=useState(0),[selected,setSelected]=useState<{from?:number;hand?:Kind}|null>(null),[feedback,setFeedback]=useState<'correct'|'again'|null>(null),[hint,setHint]=useState(false),[answer,setAnswer]=useState(false),[solvedMove,setSolvedMove]=useState<Move|null>(null)
  const moment=moments[index]
  if(!moment)return <main className={`review-shell ${variant}`}><section className="review-empty"><div className="coach-celebrate">🌟</div><h1>とてもいい対局だったね！</h1><p>今回は大きく形勢が変わる手が見つかりませんでした。棋譜を見ながら、お気に入りの一手を思い出してみよう。</p><button onClick={onClose}>棋譜にもどる</button><button className="primary" onClick={onReset}>もう一局</button></section></main>
  const position=moment.position,allMoves=legal(position)
  const sourceMatches=(m:Move)=>selected&&(selected.from!==undefined?m.from===selected.from:m.hand===selected.hand)
  const targets=new Set(selected?allMoves.filter(sourceMatches).map(m=>m.to):[])
  const shownMove=solvedMove??moment.best
  const shownMoment={...moment,best:shownMove}
  const coachKind=shownMove.piece
  const lesson=lessonFor(shownMoment,names)
  const lessonLabel=moment.kind==='mate1'?'1手詰め':moment.kind==='escape'?'逃げ道を見つけよう':'今回のめあて'
  const coachPrompt=moment.kind==='mate1'?'1手で勝てるよ！':moment.kind==='escape'?'まだ助かるよ！':'やることは1つ！'
  const selectedKind=selected?.from!==undefined?position.board[selected.from]?.kind:selected?.hand
  const instruction=selectedKind?`${names[selectedKind]}を選んだね。つぎに、行き先をタップしよう。`:'まず、動かす駒を1つタップしよう。'
  const canSpeak='speechSynthesis'in window&&'SpeechSynthesisUtterance'in window
  const resetQuestion=()=>{setSelected(null);setFeedback(null);setHint(false);setAnswer(false);setSolvedMove(null)}
  const moveTo=(to:number)=>{
    if(answer)return
    if(selected){
      const choice=allMoves.find(m=>m.to===to&&sourceMatches(m))
      if(choice){
        if(moment.goodMoves.some(m=>movesEqual(m,choice))){setSolvedMove(choice);setFeedback('correct');setAnswer(true)}
        else{setFeedback('again');setSelected(null)}
        return
      }
    }
    const piece=position.board[to]
    setSelected(piece?.side===position.turn?{from:to}:null)
    setFeedback(null)
  }
  const speakText=answer?`${lesson.action}。${lesson.result}。${lesson.reason}`:`${lesson.title}。${instruction}`
  const speak=()=>{if(!canSpeak)return;window.speechSynthesis.cancel();const voice=new SpeechSynthesisUtterance(speakText);voice.lang='ja-JP';voice.rate=.9;window.speechSynthesis.speak(voice)}
  const next=()=>{if(index<moments.length-1){setIndex(index+1);resetQuestion()}else onReset()}
  return <main className={`review-shell ${variant}`}>
    <header className="review-header">
      <button onClick={onClose} aria-label="対局画面にもどる">← もどる</button>
      <div><b>{variant==='samurai'?'さむらい作戦会議':'おかしのおさらい会'}</b><span>{index+1} / {moments.length}</span></div>
    </header>
    <div className="review-layout">
      <section className="review-game">
        <div className="review-turn"><b>{moment.moveIndex+1}手目</b><span>{position.turn==='sente'?'せんて':'ごて'}の番</span></div>
        <ReviewHand side="gote" position={position} selected={selected} setSelected={setSelected} pieceSet={pieceSet} pieceRoot={pieceRoot} names={names} hintKind={hint?moment.best.hand:undefined} answerKind={answer?shownMove.hand:undefined}/>
        <div className="board review-board">{position.board.map((x,i)=><button key={i} onClick={()=>moveTo(i)} className={`square ${(Math.floor(i/3)+i%3)%2?'shade':''} ${selected?.from===i?'chosen':''} ${targets.has(i)?'target':''} ${answer&&shownMove.from===i?'review-source':''} ${answer&&shownMove.to===i?'review-answer':''} ${hint&&moment.best.from===i?'review-hint':''}`} aria-label={`${F[i%3]}${R[Math.floor(i/3)]}${x?names[x.kind]:'空き'}`}>{x&&<div className={`piece ${x.side}`}><PieceIcon kind={x.kind} pieceSet={pieceSet} pieceRoot={pieceRoot}/></div>}</button>)}</div>
        <ReviewHand side="sente" position={position} selected={selected} setSelected={setSelected} pieceSet={pieceSet} pieceRoot={pieceRoot} names={names} hintKind={hint?moment.best.hand:undefined} answerKind={answer?shownMove.hand:undefined}/>
      </section>
      <section className="coach-panel" aria-live="polite">
        <div className="coach">
          <div className="coach-picture"><PieceIcon kind={coachKind} pieceSet={pieceSet} pieceRoot={pieceRoot}/></div>
          <div><span>{names[coachKind]}と考えよう</span><b>{feedback==='correct'?'できた！ なぜかな？':feedback==='again'?'めあてを見てみよう':answer?'手と理由を見よう':coachPrompt}</b></div>
          {canSpeak&&<button className="speak" onClick={speak} aria-label="メッセージを読み上げる">🔊</button>}
        </div>
        <div className={`speech ${feedback??''}`}>
          {answer?<div className="answer-explanation">
            <div className="move-guide">{shownMove.hand?'もちごまの ① を、盤の ② へ':'盤の ① の駒を、② へ'}</div>
            <ol>
              <li><span>1</span><div><b>こう動かす</b><p>{lesson.action}</p></div></li>
              <li><span>2</span><div><b>こう変わる</b><p>{lesson.result}</p></div></li>
              <li><span>3</span><div><b>だから、よい手</b><p>{lesson.reason}</p></div></li>
            </ol>
          </div>:<>
            <span className={`lesson-label ${moment.kind}`}>{lessonLabel}</span>
            <h2>{lesson.title}</h2>
            <p className="lesson-instruction">{feedback==='again'?`その手も動かせるよ。でも今回は「${lesson.title}」がめあて。別の手をさがそう。`:instruction}</p>
          </>}
        </div>
        <div className="review-actions">{answer?<><button className="primary" onClick={next}>{index<moments.length-1?'つぎのもんだい →':'できた！ もう一局'}</button><button onClick={resetQuestion}>この問題をもう一度</button></>:<><button onClick={()=>setHint(true)}>{hint?'オレンジの駒をタップしてね':'動かす駒のヒント'}</button><button onClick={()=>{setSolvedMove(null);setAnswer(true);setFeedback(null)}}>手と理由を見る</button></>}</div>
      </section>
    </div>
  </main>
}
function ReviewHand({side,position,selected,setSelected,pieceSet,pieceRoot,names,hintKind,answerKind}:{side:Side;position:Position;selected:{from?:number;hand?:Kind}|null;setSelected:(value:{hand:Kind})=>void;pieceSet:PieceSet;pieceRoot:string;names:Record<Kind,string>;hintKind?:Kind;answerKind?:Kind}){
  const pieces=position.hands[side]
  return <div className={`hand review-hand ${side}`}><span>もちごま</span><div>{pieces.length?pieces.map((kind,i)=><button key={`${kind}-${i}`} disabled={position.turn!==side} onClick={()=>setSelected({hand:kind})} className={`${selected?.from===undefined&&selected?.hand===kind?'selected':''} ${hintKind===kind?'review-hint':''} ${answerKind===kind?'review-source':''}`} aria-label={handPieceLabel(kind,names)} title={`置いたあとの動き：${movementLabel(kind)}`}><MovementGuides kind={kind} side={side} compact/><PieceIcon kind={kind} pieceSet={pieceSet} pieceRoot={pieceRoot}/></button>):<em>なし</em>}</div>{pieces.length>0&&<small className="hand-move-key" aria-hidden="true"><i/>置いた後の動き</small>}</div>
}
export default App
