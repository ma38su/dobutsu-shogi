import { useCallback, useEffect, useMemo, useState } from 'react'
import './App.css'
import './board-fix.css'
type Side='sente'|'gote'; type Kind='lion'|'giraffe'|'elephant'|'chick'|'hen'; type RuleMode='normal'|'beginner'; type PieceSet='wagashi'|'western'|'mix'; type VisualTheme='sweets'; type AppMode='menu'|'battle'|'puzzle'; type PuzzleDifficulty='starter'|'stepup'|'challenge'; export type AppVariant='okashi'|'samurai'; type Piece={side:Side;kind:Kind}; type Move={from?:number;hand?:Kind;to:number;piece:Kind;side:Side;captured?:Kind;promote?:boolean}; type Position={board:(Piece|null)[];hands:Record<Side,Kind[]>;turn:Side;winner?:Side;reason?:string}; type PuzzleDefinition={id:string;difficulty:PuzzleDifficulty;title:string;mission:string;plies:1|3|5;position:Position}
type ReviewKind='praise'|'mate1'|'escape'|'capture'|'try'|'safety'|'choice'
type ReviewMoment={moveIndex:number;position:Position;played:Move;best:Move;goodMoves:Move[];loss:number;kind:ReviewKind}
const F=['1','2','3'],R=['一','二','三','四']; const L:Record<PieceSet,Record<Kind,string>>={wagashi:{lion:'あんみつ',giraffe:'だんご',elephant:'さくらもち',chick:'こんぺいとう',hen:'花こんぺいとう'},western:{lion:'ケーキ',giraffe:'エクレア',elephant:'マカロン',chick:'ジェリー',hen:'キャンディ'},mix:{lion:'パフェ',giraffe:'プリン',elephant:'いちご大福',chick:'クッキー',hen:'王冠クッキー'}},V:Record<Kind,number>={lion:1000,giraffe:5,elephant:5,chick:2,hen:7}
const VISUAL_THEMES:Record<VisualTheme,{label:string;pieceRoot:string}>={sweets:{label:'おかし',pieceRoot:'./pieces/sweets'}}
const SAMURAI_NAMES:Record<Kind,string>={lion:'大将',giraffe:'槍武者',elephant:'弓武者',chick:'足軽',hen:'若武者'}
const INITIAL:Position={board:[{side:'gote',kind:'giraffe'},{side:'gote',kind:'lion'},{side:'gote',kind:'elephant'},null,{side:'gote',kind:'chick'},null,null,{side:'sente',kind:'chick'},null,{side:'sente',kind:'elephant'},{side:'sente',kind:'lion'},{side:'sente',kind:'giraffe'}],hands:{sente:[],gote:[]},turn:'sente'}
const S=(kind:Kind):Piece=>({side:'sente',kind}),G=(kind:Kind):Piece=>({side:'gote',kind})
const puzzle=(id:string,difficulty:PuzzleDifficulty,title:string,mission:string,plies:1|3|5,board:(Piece|null)[],sente:Kind[]=[],gote:Kind[]=[]):PuzzleDefinition=>({id,difficulty,title,mission,plies,position:{board,hands:{sente,gote},turn:'sente'}})
const PUZZLES:PuzzleDefinition[]=[
  puzzle('starter-1','starter','まんなかを ふさごう','もちごまを使って、逃げ道をなくそう',1,[G('giraffe'),G('lion'),null,null,null,S('chick'),G('giraffe'),S('elephant'),S('lion'),null,null,null],['chick','elephant']),
  puzzle('starter-2','starter','みぎから おさえよう','どの駒をどこに置けば、逃げられないかな？',1,[null,G('giraffe'),G('lion'),G('giraffe'),null,null,null,S('chick'),S('lion'),S('elephant'),null,null],['chick','elephant']),
  puzzle('starter-3','starter','ななめの いって','斜めに動く駒で、ライオンを追い詰めよう',1,[S('giraffe'),null,null,null,null,G('lion'),S('lion'),S('chick'),null,S('elephant'),S('giraffe'),null],['elephant','chick']),
  puzzle('stepup-1','stepup','にげた先を ねらおう','相手が逃げても、次の一手でつかまえよう',3,[G('giraffe'),null,null,G('lion'),null,S('chick'),null,null,S('lion'),null,null,null],['elephant','giraffe'],['chick','elephant']),
  puzzle('stepup-2','stepup','パワーアップの 王手','いちばん奥へ進む駒の変化を使おう',3,[S('giraffe'),null,G('lion'),null,S('chick'),null,S('lion'),S('chick'),null,S('elephant'),null,S('giraffe')],[],['elephant']),
  puzzle('stepup-3','stepup','ななめから はさもう','持ち駒で相手の行き先をしぼろう',3,[G('lion'),null,null,null,null,S('chick'),S('lion'),null,G('giraffe'),null,null,S('giraffe')],['chick','elephant'],['elephant']),
  puzzle('challenge-1','challenge','守りを くずそう','守りの駒を取りながら、5手で追い詰めよう',5,[null,G('lion'),G('elephant'),null,null,G('giraffe'),null,S('lion'),S('giraffe'),S('elephant'),null,null],['chick','chick']),
  puzzle('challenge-2','challenge','しずかな いって','すぐに王手をせず、逃げ道を先に消そう',5,[null,G('lion'),null,G('chick'),null,null,S('giraffe'),null,S('giraffe'),S('lion'),S('elephant'),null],['elephant','chick']),
  puzzle('challenge-3','challenge','さいごの 包囲網','持ち駒と盤上の駒をつないで包囲しよう',5,[G('giraffe'),null,G('lion'),null,G('elephant'),null,null,S('lion'),null,null,null,null],['chick','giraffe'],['chick','elephant']),
]
const PUZZLE_LEVELS:Record<PuzzleDifficulty,{label:string;short:string;description:string;plies:1|3|5}>={starter:{label:'はじめて',short:'1手詰め',description:'一手で逃げ道をなくそう',plies:1},stepup:{label:'ステップアップ',short:'3手詰め',description:'相手の返しを読んでみよう',plies:3},challenge:{label:'チャレンジ',short:'5手詰め',description:'最後まで手順を読み切ろう',plies:5}}
const other=(s:Side):Side=>s==='sente'?'gote':'sente', clone=(p:Position):Position=>({...p,board:p.board.map(x=>x&&{...x}),hands:{sente:[...p.hands.sente],gote:[...p.hands.gote]}})
function vec(k:Kind,s:Side){const f=s==='sente'?-1:1;if(k==='lion')return[[-1,-1],[-1,0],[-1,1],[0,-1],[0,1],[1,-1],[1,0],[1,1]];if(k==='giraffe')return[[-1,0],[0,-1],[0,1],[1,0]];if(k==='elephant')return[[-1,-1],[-1,1],[1,-1],[1,1]];if(k==='chick')return[[f,0]];return[[f,-1],[f,0],[f,1],[0,-1],[0,1],[-f,0]]}
function pseudo(p:Position,side=p.turn){const a:Move[]=[];p.board.forEach((x,from)=>{if(!x||x.side!==side)return;const r=Math.floor(from/3),c=from%3;vec(x.kind,side).forEach(([dr,dc])=>{const nr=r+dr,nc=c+dc;if(nr<0||nr>3||nc<0||nc>2)return;const to=nr*3+nc,t=p.board[to];if(t?.side!==side)a.push({from,to,piece:x.kind,side,captured:t?.kind,promote:x.kind==='chick'&&(nr===0||nr===3)})})});p.hands[side].forEach(k=>p.board.forEach((x,to)=>{const row=Math.floor(to/3);if(!x&&!(k==='chick'&&(row===0||row===3)))a.push({hand:k,to,piece:k,side})}));return a}
function attacked(p:Position,sq:number,by:Side){return pseudo({...p,hands:{sente:[],gote:[]}},by).some(m=>m.to===sq)}
function apply(p:Position,m:Move,win=true){const n=clone(p),target=n.board[m.to];if(m.from!==undefined)n.board[m.from]=null;else{const i=n.hands[m.side].indexOf(m.piece);n.hands[m.side].splice(i,1)}n.board[m.to]={side:m.side,kind:m.promote?'hen':m.piece};if(target&&target.kind!=='lion')n.hands[m.side].push(target.kind==='hen'?'chick':target.kind);n.turn=other(m.side);if(win){if(target?.kind==='lion'){n.winner=m.side;n.reason='ライオンをつかまえました'}else if(m.piece==='lion'){const goal=m.side==='sente'?0:3;if(Math.floor(m.to/3)===goal&&!attacked(n,m.to,other(m.side))){n.winner=m.side;n.reason='トライに成功しました'}}if(!n.winner&&legal(n).length===0){n.winner=m.side;n.reason='相手に指せる手がありません（詰み）'}}return n}
function legal(p:Position){return pseudo(p).filter(m=>{const n=apply(p,m,false),li=n.board.findIndex(x=>x?.side===p.turn&&x.kind==='lion');return li<0||!attacked(n,li,other(p.turn))})}
function applyPuzzle(p:Position,m:Move){const target=p.board[m.to],n=apply(p,m,false);if(target?.kind==='lion'){n.winner=m.side;n.reason='相手のライオンをつかまえました'}else if(legal(n).length===0){n.winner=m.side;n.reason='相手の逃げ道をなくしました'}return n}
const puzzleDistanceCache=new Map<string,number|null>()
function puzzlePositionKey(p:Position){return JSON.stringify([p.board,p.hands,p.turn,p.winner])}
function puzzleMateDistance(p:Position,attacker:Side,depth:number):number|null{
  if(p.winner)return p.winner===attacker?0:null
  if(depth<=0)return null
  const cacheKey=`${puzzlePositionKey(p)}|${attacker}|${depth}`,cached=puzzleDistanceCache.get(cacheKey)
  if(cached!==undefined||puzzleDistanceCache.has(cacheKey))return cached??null
  const moves=legal(p)
  let result:number|null=null
  if(p.turn===attacker){
    const wins=moves.map(m=>puzzleMateDistance(applyPuzzle(p,m),attacker,depth-1)).filter((d):d is number=>d!==null)
    if(wins.length)result=1+Math.min(...wins)
  }else{
    const replies=moves.map(m=>puzzleMateDistance(applyPuzzle(p,m),attacker,depth-1))
    if(replies.length&&replies.every((d):d is number=>d!==null))result=1+Math.max(...replies)
  }
  puzzleDistanceCache.set(cacheKey,result)
  return result
}
function puzzleWinningMoves(p:Position,attacker:Side,remaining:number){return legal(p).filter(m=>{const d=puzzleMateDistance(applyPuzzle(p,m),attacker,remaining-1);return d!==null&&d<=remaining-1})}
function score(p:Position,s:Side){if(p.winner)return p.winner===s?99999:-99999;let v=0;p.board.forEach(x=>{if(x)v+=(x.side===s?1:-1)*V[x.kind]});(['sente','gote']as Side[]).forEach(o=>p.hands[o].forEach(k=>v+=(o===s?1:-1)*V[k]*.9));return v}
function ai(p:Position,lv:number){const root=p.turn,ms=legal(p);if(lv===1)return ms[Math.floor(Math.random()*ms.length)];const depth=lv===2?2:lv===3?4:5;function go(q:Position,d:number,a:number,b:number):number{if(!d||q.winner)return score(q,root);const xs=legal(q);if(!xs.length)return q.turn===root?-90000:90000;if(q.turn===root){let v=-Infinity;for(const m of xs){v=Math.max(v,go(apply(q,m),d-1,a,b));a=Math.max(a,v);if(b<=a)break}return v}let v=Infinity;for(const m of xs){v=Math.min(v,go(apply(q,m),d-1,a,b));b=Math.min(b,v);if(b<=a)break}return v}return ms.map(m=>({m,v:go(apply(p,m),depth-1,-Infinity,Infinity)+Math.random()*.05})).sort((a,b)=>b.v-a.v)[0]?.m}
const movesEqual=(a:Move,b:Move)=>a.to===b.to&&a.from===b.from&&a.hand===b.hand&&a.piece===b.piece
function reviewScore(p:Position,root:Side){
  let v=score(p,root)
  if(Math.abs(v)>90000)return v
  p.board.forEach((x,i)=>{
    if(!x)return
    const sign=x.side===root?1:-1,row=Math.floor(i/3)
    if(x.kind==='lion'){
      const progress=x.side==='sente'?3-row:row
      v+=sign*progress*.55
    }
    if(x.kind!=='lion'&&attacked(p,i,other(x.side)))v-=sign*V[x.kind]*.22
  })
  return v
}
function reviewSearch(p:Position,d:number,root:Side,a=-Infinity,b=Infinity):number{
  if(!d||p.winner)return reviewScore(p,root)
  const ms=legal(p)
  if(!ms.length)return p.turn===root?-90000:90000
  if(p.turn===root){
    let v=-Infinity
    for(const m of ms){v=Math.max(v,reviewSearch(apply(p,m),d-1,root,a,b));a=Math.max(a,v);if(b<=a)break}
    return v
  }
  let v=Infinity
  for(const m of ms){v=Math.min(v,reviewSearch(apply(p,m),d-1,root,a,b));b=Math.min(b,v);if(b<=a)break}
  return v
}
function immediateWinningMoves(p:Position){return p.winner?[]:legal(p).filter(m=>apply(p,m).winner===p.turn)}
function reviewKind(position:Position,played:Move,best:Move,loss:number):ReviewKind{
  if(loss<.55)return'praise'
  const after=apply(position,played)
  if(best.captured&&!played.captured)return'capture'
  const goal=position.turn==='sente'?0:3
  if(best.piece==='lion'&&Math.floor(best.to/3)===goal)return'try'
  if(attacked(after,played.to,other(position.turn)))return'safety'
  return'choice'
}
function buildReview(hist:Position[],moves:Move[],players:Record<Side,'human'|'ai'>){
  const moments:ReviewMoment[]=[]
  moves.forEach((played,i)=>{
    const position=hist[i]
    if(!position||position.winner||players[played.side]!=='human')return
    const options=legal(position)
    const actualMove=options.find(m=>movesEqual(m,played))
    if(!actualMove)return
    const afterPlayed=apply(position,actualMove)
    const mateInOne=immediateWinningMoves(position)
    if(mateInOne.length&&afterPlayed.winner!==played.side){
      moments.push({moveIndex:i,position,best:mateInOne[0],played,loss:99999,goodMoves:mateInOne,kind:'mate1'})
      return
    }
    const opponentWins=immediateWinningMoves(afterPlayed)
    const escapes=opponentWins.length?options.filter(m=>{
      const next=apply(position,m)
      return next.winner===played.side||(!next.winner&&!immediateWinningMoves(next).length)
    }):[]
    if(opponentWins.length&&escapes.length){
      const rankedEscapes=escapes.map(m=>({m,value:reviewSearch(apply(position,m),2,played.side)})).sort((a,b)=>b.value-a.value)
      moments.push({moveIndex:i,position,best:rankedEscapes[0].m,played,loss:90000,goodMoves:escapes,kind:'escape'})
      return
    }
    const ranked=options.map(m=>({m,value:reviewSearch(apply(position,m),2,played.side)})).sort((a,b)=>b.value-a.value)
    const actual=ranked.find(x=>movesEqual(x.m,played))
    if(!actual||!ranked[0])return
    const loss=Math.max(0,ranked[0].value-actual.value),best=loss<.55?played:ranked[0].m
    moments.push({moveIndex:i,position,best,played,loss,goodMoves:ranked.filter(x=>ranked[0].value-x.value<.55).map(x=>x.m),kind:reviewKind(position,played,best,loss)})
  })
  const tactical=moments.filter(x=>x.kind==='mate1'||x.kind==='escape').slice(-3).sort((a,b)=>a.moveIndex-b.moveIndex)
  const useful=moments.filter(x=>x.loss>=.55&&x.kind!=='mate1'&&x.kind!=='escape').sort((a,b)=>b.loss-a.loss)
  const picked:ReviewMoment[]=[...tactical]
  for(const moment of useful){
    if(picked.length===3)break
    if(picked.every(x=>Math.abs(x.moveIndex-moment.moveIndex)>1))picked.push(moment)
  }
  if(!picked.length)return moments.filter(x=>x.kind==='praise').slice(-2)
  if(tactical.length)return[...tactical,...picked.filter(x=>x.kind!=='mate1'&&x.kind!=='escape').sort((a,b)=>a.moveIndex-b.moveIndex)]
  return picked.sort((a,b)=>a.moveIndex-b.moveIndex)
}
const note=(m:Move,names:Record<Kind,string>)=>`${m.side==='sente'?'▲':'△'}${F[m.to%3]}${R[Math.floor(m.to/3)]} ${names[m.piece]}${m.hand?'打':''}${m.promote?'成':''}`
function App({variant='okashi'}:{variant?:AppVariant}){const[appMode,setAppMode]=useState<AppMode>('menu'),[hist,setHist]=useState<Position[]>([clone(INITIAL)]),[moves,setMoves]=useState<Move[]>([]),[cur,setCur]=useState(0),[sel,setSel]=useState<{from?:number;hand?:number}|null>(null),[players,setPlayers]=useState<Record<Side,'human'|'ai'>>({sente:'human',gote:'ai'}),[level,setLevel]=useState(2),[ruleMode,setRuleMode]=useState<RuleMode>('normal'),[visualTheme,setVisualTheme]=useState<VisualTheme>('sweets'),[pieceSet,setPieceSet]=useState<PieceSet>('mix'),[thinking,setThinking]=useState(false),[review,setReview]=useState<ReviewMoment[]|null>(null),[reviewBusy,setReviewBusy]=useState(false);const p=hist[cur],isSamurai=variant==='samurai',names=isSamurai?SAMURAI_NAMES:L[pieceSet],pieceRoot=isSamurai?'../pieces/samurai':'../pieces/sweets',lm=useMemo(()=>legal(p),[p]),pm=useMemo(()=>pseudo(p),[p]);const isSelected=(m:Move)=>!!sel&&(sel.from!==undefined?m.from===sel.from:m.hand===p.hands[p.turn][sel.hand!]);const sameMove=(a:Move,b:Move)=>a.to===b.to&&a.from===b.from&&a.hand===b.hand;const commit=useCallback((m:Move,foul=false)=>{const next=apply(p,m,!foul);if(foul){next.winner=other(m.side);next.reason='反則負け：合法手ではない手を指しました'}setHist([...hist.slice(0,cur+1),next]);setMoves([...moves.slice(0,cur),m]);setCur(cur+1);setSel(null)},[cur,hist,moves,p]);useEffect(()=>{if(appMode!=='battle'||p.winner||players[p.turn]!=='ai'){setThinking(false);return}setThinking(true);const t=setTimeout(()=>{const m=ai(p,level);if(m)commit(m)},350);return()=>clearTimeout(t)},[appMode,commit,level,p,players]);function tap(i:number){if(thinking||p.winner||players[p.turn]==='ai')return;if(sel){const legalMove=lm.find(m=>m.to===i&&isSelected(m));if(legalMove){commit(legalMove);return}const illegalMove=pm.find(m=>m.to===i&&isSelected(m));if(illegalMove&&ruleMode==='normal'){commit(illegalMove,true);return}}const x=p.board[i];setSel(x?.side===p.turn?{from:i}:null)}function reset(){setHist([clone(INITIAL)]);setMoves([]);setCur(0);setSel(null);setReview(null)}function openReview(){setReviewBusy(true);window.setTimeout(()=>{setReview(buildReview(hist,moves,players));setReviewBusy(false)},40)}const selectedPseudo=sel?pm.filter(isSelected):[],targets=new Set(selectedPseudo.filter(m=>lm.some(x=>sameMove(x,m))).map(m=>m.to)),illegalTargets=new Set(selectedPseudo.filter(m=>!lm.some(x=>sameMove(x,m))).map(m=>m.to))
if(appMode==='menu')return <ModeMenu variant={variant} pieceSet={pieceSet} pieceRoot={pieceRoot} onBattle={()=>setAppMode('battle')} onPuzzle={()=>setAppMode('puzzle')}/>
if(appMode==='puzzle')return <PuzzleMode variant={variant} names={names} pieceSet={pieceSet} setPieceSet={setPieceSet} pieceRoot={pieceRoot} onExit={()=>setAppMode('menu')}/>
if(review)return <ReviewScreen moments={review} variant={variant} names={names} pieceSet={pieceSet} pieceRoot={pieceRoot} onClose={()=>setReview(null)} onReset={reset}/>
return <main className={`app-shell ${isSamurai?'samurai':`sweets-${pieceSet}`}`}><header><div className="brand"><span>{isSamurai?'さ':'お'}</span><div><h1>{isSamurai?'さむらいしょうぎ':'おかししょうぎ'}</h1><p>対局モード</p></div></div><div className="header-actions"><button className="new" onClick={()=>setAppMode('menu')}>モード選択</button><button className="new" onClick={reset}>新しい対局</button></div></header><section className="game-card">
{(['gote']as Side[]).map(s=><Player key={s} side={s} p={p} thinking={thinking} players={players} setPlayers={setPlayers}/>)}<Hand side="gote" p={p} sel={sel} setSel={setSel} players={players} pieceSet={pieceSet} names={names} pieceRoot={pieceRoot}/><div className="board">{p.board.map((x,i)=><button key={i} onClick={()=>tap(i)} className={`square ${(Math.floor(i/3)+i%3)%2?'shade':''} ${sel?.from===i?'chosen':''} ${targets.has(i)?'target':''} ${ruleMode==='beginner'&&illegalTargets.has(i)?'illegal-target':''}`} aria-label={`${F[i%3]}${R[Math.floor(i/3)]}${x?names[x.kind]:'空き'}${ruleMode==='beginner'&&illegalTargets.has(i)?'、合法手ではありません':''}`}>{x&&<><MovementGuides kind={x.kind} side={x.side}/><div className={`piece ${x.side}`}><PieceIcon kind={x.kind} pieceSet={pieceSet} pieceRoot={pieceRoot}/></div></>}</button>)}</div><Hand side="sente" p={p} sel={sel} setSel={setSel} players={players} pieceSet={pieceSet} names={names} pieceRoot={pieceRoot}/>{(['sente']as Side[]).map(s=><Player key={s} side={s} p={p} thinking={thinking} players={players} setPlayers={setPlayers}/>)}{p.winner&&<div className="result"><span>{p.reason?.startsWith('反則負け')?'❌':'🎉'}</span><div><b>{p.winner==='sente'?'せんて':'ごて'}の勝ち！</b><small>{p.reason}</small></div><div className="result-actions"><button className="review-start" onClick={openReview} disabled={reviewBusy}>{reviewBusy?'考え中…':'いっしょにおさらい'}</button><button onClick={reset}>もう一局</button></div></div>}</section>
<section className="controls"><div className="timeline"><button onClick={()=>setCur(0)} disabled={!cur}>|◀</button><button onClick={()=>setCur(cur-1)} disabled={!cur}>◀ 待った</button><div><b>{cur}</b> / {moves.length} 手</div><button onClick={()=>setCur(cur+1)} disabled={cur>=hist.length-1}>進む ▶</button><button onClick={()=>setCur(hist.length-1)} disabled={cur>=hist.length-1}>▶|</button></div><div className="setting"><div><b>対局モード</b><span>{ruleMode==='normal'?'不正手は反則負けになります':'不正な移動先を❌で案内します'}</span></div><select value={ruleMode} onChange={e=>{setRuleMode(e.target.value as RuleMode);setSel(null)}}><option value="normal">通常</option><option value="beginner">入門</option></select></div><div className="setting"><div><b>AIのつよさ</b><span>端末の中だけで考えます</span></div><select value={level} onChange={e=>setLevel(+e.target.value)}><option value="1">やさしい</option><option value="2">ふつう</option><option value="3">つよい</option><option value="4">とてもつよい</option></select></div>{!isSamurai&&<><div className="setting"><div><b>見た目のテーマ</b><span>新しいテーマを追加できます</span></div><select value={visualTheme} onChange={e=>setVisualTheme(e.target.value as VisualTheme)}>{Object.entries(VISUAL_THEMES).map(([id,v])=><option key={id} value={id}>{v.label}</option>)}</select></div><div className="setting"><div><b>おかしの種類</b><span>対局中も変更できます</span></div><select value={pieceSet} onChange={e=>setPieceSet(e.target.value as PieceSet)}><option value="wagashi">和菓子</option><option value="western">洋菓子</option><option value="mix">和洋MIX</option></select></div></>}{isSamurai?<div className="battlefield-setting"><div><b>舞台</b><span>草原と土の戦場</span></div><strong>戦場</strong></div>:<div className="board-setting"><div><b>盤のデザイン</b><span>対局中も変更できます</span></div><BoardStylePicker/></div>}<details><summary>棋譜を見る <span>{moves.length}手</span></summary><ol>{moves.map((m,i)=><li className={cur===i+1?'current':''} key={i}><button onClick={()=>setCur(i+1)}>{note(m,names)}</button></li>)}</ol></details></section><footer>対局はこの端末だけで進みます · オフラインでも遊べます</footer></main>}
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
      <button className="mode-choice puzzle" onClick={onPuzzle}><span className="mode-icon">詰</span><span><small>ひとりでじっくり</small><b>詰将棋に挑戦</b><em>1手・3手・5手の全9問</em></span><i>→</i></button>
    </section>
  </main>
}
function PuzzleMode({variant,names,pieceSet,setPieceSet,pieceRoot,onExit}:{variant:AppVariant;names:Record<Kind,string>;pieceSet:PieceSet;setPieceSet:(value:PieceSet)=>void;pieceRoot:string;onExit:()=>void}){
  const[difficulty,setDifficulty]=useState<PuzzleDifficulty>('starter'),[selected,setSelected]=useState<PuzzleDefinition|null>(null),[completed,setCompleted]=useState<Set<string>>(()=>{try{return new Set(JSON.parse(localStorage.getItem(`${variant}-puzzle-progress`)??'[]') as string[])}catch{return new Set()}})
  const finish=(id:string)=>{setCompleted(previous=>{const next=new Set(previous).add(id);localStorage.setItem(`${variant}-puzzle-progress`,JSON.stringify([...next]));return next})}
  if(selected)return <PuzzlePlay key={selected.id} puzzle={selected} variant={variant} names={names} pieceSet={pieceSet} pieceRoot={pieceRoot} onBack={()=>setSelected(null)} onComplete={()=>finish(selected.id)}/>
  const level=PUZZLE_LEVELS[difficulty],items=PUZZLES.filter(item=>item.difficulty===difficulty),isSamurai=variant==='samurai'
  return <main className={`puzzle-shell ${variant}`}>
    <header className="puzzle-header"><button onClick={onExit}>← モード選択</button><div><b>{isSamurai?'さむらい詰将棋':'おかし詰将棋'}</b><span>{completed.size} / {PUZZLES.length} クリア</span></div></header>
    <section className="puzzle-hero"><div><span>ひとりで じっくり</span><h1>詰将棋に挑戦！</h1><p>相手がどこへ逃げても、最後に{names.lion}をつかまえよう。</p></div><div className="puzzle-hero-piece"><PieceIcon kind="lion" pieceSet={pieceSet} pieceRoot={pieceRoot}/></div></section>
    {variant==='okashi'&&<label className="puzzle-piece-set"><span><b>おかしの種類</b><small>好きな見た目で挑戦できます</small></span><select value={pieceSet} onChange={event=>setPieceSet(event.target.value as PieceSet)}><option value="wagashi">和菓子</option><option value="western">洋菓子</option><option value="mix">和洋MIX</option></select></label>}
    <nav className="difficulty-tabs" aria-label="難易度を選ぶ">{(Object.entries(PUZZLE_LEVELS) as [PuzzleDifficulty,typeof level][]).map(([id,item])=><button key={id} className={difficulty===id?'active':''} onClick={()=>setDifficulty(id)}><small>{item.short}</small><b>{item.label}</b></button>)}</nav>
    <section className="difficulty-copy"><div className={`difficulty-mark ${difficulty}`}>{level.plies}</div><div><h2>{level.short} · {level.label}</h2><p>{level.description}</p></div></section>
    <section className="puzzle-list">{items.map((item,index)=><button key={item.id} className={`puzzle-card ${completed.has(item.id)?'completed':''}`} onClick={()=>setSelected(item)}><span className="puzzle-number">{completed.has(item.id)?'✓':index+1}</span><span><b>{item.title}</b><small>{item.mission}</small></span><em>{item.plies}手</em><i>›</i></button>)}</section>
    <p className="puzzle-note">問題と相手の応手は、すべて端末の中で動きます。</p>
  </main>
}
function PuzzlePlay({puzzle,variant,names,pieceSet,pieceRoot,onBack,onComplete}:{puzzle:PuzzleDefinition;variant:AppVariant;names:Record<Kind,string>;pieceSet:PieceSet;pieceRoot:string;onBack:()=>void;onComplete:()=>void}){
  const attacker:Side='sente'
  const[current,setCurrent]=useState(()=>clone(puzzle.position)),[remaining,setRemaining]=useState<number>(puzzle.plies),[selected,setSelected]=useState<{from?:number;hand?:Kind}|null>(null),[feedback,setFeedback]=useState<'wrong'|'good'|'your-turn'|null>(null),[hintStage,setHintStage]=useState(0),[thinking,setThinking]=useState(false),[solved,setSolved]=useState(false),[attempts,setAttempts]=useState(0)
  const allMoves=useMemo(()=>legal(current),[current]),sourceMatches=(m:Move)=>!!selected&&(selected.from!==undefined?m.from===selected.from:m.hand===selected.hand),targets=new Set(selected?allMoves.filter(sourceMatches).map(m=>m.to):[])
  const winningMoves=current.turn===attacker&&!solved?puzzleWinningMoves(current,attacker,remaining):[],hintMove=winningMoves[0]
  useEffect(()=>{
    if(solved||current.winner||current.turn===attacker){setThinking(false);return}
    setThinking(true)
    const timer=window.setTimeout(()=>{
      const choices=legal(current).map(move=>({move,distance:puzzleMateDistance(applyPuzzle(current,move),attacker,remaining-1)})).sort((a,b)=>(b.distance??999)-(a.distance??999))
      const choice=choices[0]?.move
      if(choice){setCurrent(applyPuzzle(current,choice));setRemaining(value=>value-1);setFeedback('your-turn');setHintStage(0);setSelected(null)}
      setThinking(false)
    },520)
    return()=>window.clearTimeout(timer)
  },[current,remaining,solved])
  const resetPuzzle=()=>{setCurrent(clone(puzzle.position));setRemaining(puzzle.plies);setSelected(null);setFeedback(null);setHintStage(0);setThinking(false);setSolved(false);setAttempts(0)}
  const chooseSquare=(to:number)=>{
    if(thinking||solved||current.turn!==attacker)return
    if(selected){
      const choice=allMoves.find(move=>move.to===to&&sourceMatches(move))
      if(choice){
        if(!winningMoves.some(move=>movesEqual(move,choice))){setFeedback('wrong');setAttempts(value=>value+1);setSelected(null);setHintStage(0);return}
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
  return <main className={`puzzle-play-shell ${variant}`}>
    <header className="puzzle-play-header"><button onClick={onBack}>← 問題一覧</button><div><b>{PUZZLE_LEVELS[puzzle.difficulty].short}</b><span>{puzzle.title}</span></div><button onClick={resetPuzzle}>やり直す</button></header>
    <div className="puzzle-play-layout">
      <section className="puzzle-game">
        <div className="puzzle-status"><span className={`difficulty-pill ${puzzle.difficulty}`}>{PUZZLE_LEVELS[puzzle.difficulty].label}</span><b>{solved?'詰み！':thinking?'相手が考えています…':`${remaining}手以内に詰ませよう`}</b></div>
        <PuzzleHand side="gote" position={current} selected={selected} setSelected={setSelected} disabled pieceSet={pieceSet} pieceRoot={pieceRoot} names={names}/>
        <div className="board puzzle-board">{current.board.map((piece,i)=><button key={i} onClick={()=>chooseSquare(i)} className={`square ${(Math.floor(i/3)+i%3)%2?'shade':''} ${selected?.from===i?'chosen':''} ${targets.has(i)?'target':''} ${hintStage>=1&&hintMove?.from===i?'puzzle-hint-source':''} ${hintStage>=2&&hintMove?.to===i?'puzzle-hint-target':''}`} aria-label={`${squareName(i)} ${piece?names[piece.kind]:'空き'}`}>{piece&&<><MovementGuides kind={piece.kind} side={piece.side}/><div className={`piece ${piece.side}`}><PieceIcon kind={piece.kind} pieceSet={pieceSet} pieceRoot={pieceRoot}/></div></>}</button>)}</div>
        <PuzzleHand side="sente" position={current} selected={selected} setSelected={value=>{if(!thinking&&!solved&&current.turn===attacker){setSelected(value);setFeedback(null)}}} disabled={thinking||solved||current.turn!==attacker} pieceSet={pieceSet} pieceRoot={pieceRoot} names={names} hintKind={hintStage>=1?hintMove?.hand:undefined}/>
      </section>
      <section className={`puzzle-guide ${feedback??''} ${solved?'solved':''}`} aria-live="polite">
        {solved?<><div className="puzzle-celebrate">🎉</div><span>クリア！</span><h1>{attempts?'あきらめずに見つけたね！':'読み切ったね！'}</h1><p>{puzzle.plies}手の詰みを完成させました。別の問題にも挑戦してみよう。</p><div className="puzzle-guide-actions"><button className="primary" onClick={onBack}>問題一覧へ</button><button onClick={resetPuzzle}>もう一度</button></div></>:<>
          <span className="puzzle-guide-label">今回のミッション</span><h1>{puzzle.mission}</h1>
          <p>{feedback==='wrong'?'その手では、相手に逃げ道が残るよ。別の手を考えてみよう。':feedback==='good'?'いい王手！ 相手の返しも見てみよう。':feedback==='your-turn'?'相手が逃げたよ。次の一手で追いかけよう。':'下側の自分の駒を選んで、行き先をタップしよう。'}</p>
          {hintStage>=2&&answerText&&<div className="puzzle-answer">{answerText}</div>}
          <div className="puzzle-guide-actions"><button onClick={()=>setHintStage(stage=>Math.min(2,stage+1))} disabled={thinking||hintStage>=2}>{hintStage===0?'動かす駒のヒント':hintStage===1?'行き先も見る':'答えを表示中'}</button><button onClick={resetPuzzle}>最初から</button></div>
        </>}
      </section>
    </div>
  </main>
}
function PuzzleHand({side,position,selected,setSelected,disabled,pieceSet,pieceRoot,names,hintKind}:{side:Side;position:Position;selected:{from?:number;hand?:Kind}|null;setSelected:(value:{hand:Kind})=>void;disabled:boolean;pieceSet:PieceSet;pieceRoot:string;names:Record<Kind,string>;hintKind?:Kind}){
  return <div className={`hand puzzle-hand ${side}`}><span>もちごま</span><div>{position.hands[side].length?position.hands[side].map((kind,index)=><button key={`${kind}-${index}`} disabled={disabled} onClick={()=>setSelected({hand:kind})} className={`${selected?.from===undefined&&selected?.hand===kind?'selected':''} ${hintKind===kind?'puzzle-hint-source':''}`} aria-label={`${names[kind]}を置く`}><PieceIcon kind={kind} pieceSet={pieceSet} pieceRoot={pieceRoot}/></button>):<em>なし</em>}</div></div>
}
function BoardStylePicker(){return <fieldset className="board-styles"><legend>盤のデザイン</legend><label><input id="board-box" type="radio" name="board-style" defaultChecked/><span>おかし箱</span></label><label><input id="board-wood" type="radio" name="board-style"/><span>木の盤</span></label><label><input id="board-grass" type="radio" name="board-style"/><span>若草</span></label><label><input id="board-ink" type="radio" name="board-style"/><span>墨色</span></label></fieldset>}
function Player({side,p,thinking,players,setPlayers}:{side:Side;p:Position;thinking:boolean;players:Record<Side,'human'|'ai'>;setPlayers:(v:Record<Side,'human'|'ai'>)=>void}){return <div className={`player ${side} ${p.turn===side?'active':''}`}><div className={`avatar ${side}`}>{side==='sente'?'先':'後'}</div><div className="info"><b>{side==='sente'?'先手':'後手'}</b><span>{p.turn===side?(thinking?'● かんがえ中…':'● 手番です'):'待っています'}</span></div><select aria-label={`${side==='sente'?'先手':'後手'}の担当`} value={players[side]} onChange={e=>setPlayers({...players,[side]:e.target.value as 'human'|'ai'})}><option value="human">👤 人間</option><option value="ai">🤖 AI</option></select></div>}
function PieceIcon({kind,pieceSet,pieceRoot}:{kind:Kind;pieceSet:PieceSet;pieceRoot:string}){const samuraiFile=kind==='lion'?'lion-mounted-sword':kind;const src=pieceRoot.endsWith('/samurai')?`${pieceRoot}/${samuraiFile}.png?v=3`:`${pieceRoot}/${pieceSet}/${kind}.png?v=7`;return <img className="piece-icon sweet-icon" src={src} alt="" draggable={false}/>}
function MovementGuides({kind,side}:{kind:Kind;side:Side}){return <span className="movement-guides" aria-hidden="true">{vec(kind,side).map(([dr,dc])=><i key={`${dr},${dc}`} style={{gridRow:dr+2,gridColumn:dc+2,alignSelf:dr<0?'start':dr>0?'end':'center',justifySelf:dc<0?'start':dc>0?'end':'center'}}/>)}</span>}
function Hand({side,p,sel,setSel,players,pieceSet,names,pieceRoot}:{side:Side;p:Position;sel:{from?:number;hand?:number}|null;setSel:(v:{hand:number})=>void;players:Record<Side,'human'|'ai'>;pieceSet:PieceSet;names:Record<Kind,string>;pieceRoot:string}){return <div className={`hand ${side}`}><span>もちごま</span><div>{p.hands[side].length?p.hands[side].map((k,i)=><button aria-label={names[k]} disabled={p.turn!==side||players[side]==='ai'} onClick={()=>setSel({hand:i})} className={sel?.hand===i&&sel.from===undefined?'selected':''} key={i}><PieceIcon kind={k} pieceSet={pieceSet} pieceRoot={pieceRoot}/></button>):<em>なし</em>}</div></div>}
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
  return <div className={`hand review-hand ${side}`}><span>もちごま</span><div>{position.hands[side].length?position.hands[side].map((kind,i)=><button key={`${kind}-${i}`} disabled={position.turn!==side} onClick={()=>setSelected({hand:kind})} className={`${selected?.from===undefined&&selected?.hand===kind?'selected':''} ${hintKind===kind?'review-hint':''} ${answerKind===kind?'review-source':''}`} aria-label={`${names[kind]}を打つ`}><PieceIcon kind={kind} pieceSet={pieceSet} pieceRoot={pieceRoot}/></button>):<em>なし</em>}</div></div>
}
export default App
