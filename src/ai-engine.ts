import {V,apply,finalRank,isInCheck,legal,other,positionKey,score,vec,type Move,type Position,type Side} from './game.ts'

type SearchBound='exact'|'lower'|'upper'
type SearchEntry={value:number;bound:SearchBound;bestMove?:Move}
export type AiSearchStats={
  nodes:number
  tableHits:number
  cutoffs:number
  depth:number
  maxPly:number
  tableSize:number
  generatedMoves:number
  durationMs:number
  value:number|null
}
export type AiSearchResult={move?:Move;stats:AiSearchStats}
export type AiSearchOptions={randomizeTies?:boolean}

function sameMove(a:Move,b:Move){
  return a.to===b.to&&a.from===b.from&&a.hand===b.hand&&a.piece===b.piece
}

function movePriority(position:Position,move:Move,preferred?:Move){
  let priority=preferred&&sameMove(move,preferred)?1000000:0
  const goal=move.side==='sente'?0:3
  if(move.captured==='lion'||(move.piece==='lion'&&Math.floor(move.to/3)===goal))priority+=500000
  if(move.captured)priority+=10000+V[move.captured]*100-V[move.piece]
  if(move.promote)priority+=2000
  const enemyLion=position.board.findIndex(piece=>piece?.side===other(move.side)&&piece.kind==='lion')
  if(enemyLion>=0&&move.captured!=='lion'){
    const row=Math.floor(move.to/3),column=move.to%3
    const enemyRow=Math.floor(enemyLion/3),enemyColumn=enemyLion%3,kind=move.promote?'hen':move.piece
    if(vec(kind,move.side).some(([rowDelta,columnDelta])=>row+rowDelta===enemyRow&&column+columnDelta===enemyColumn))priority+=1000
  }
  return priority
}

function ordered(position:Position,moves:Move[],preferred?:Move,randomizeTies=false){
  return moves.map(move=>({move,priority:movePriority(position,move,preferred),tie:randomizeTies?Math.random():0}))
    .sort((a,b)=>b.priority-a.priority||b.tie-a.tie)
    .map(item=>item.move)
}

function applyForSearch(position:Position,move:Move){
  const next=apply(position,move,false)
  if(move.captured==='lion'||(move.piece==='lion'&&Math.floor(move.to/3)===finalRank(move.side)))next.winner=move.side
  return next
}

export function chooseAiMove(position:Position,level:number,options:AiSearchOptions={}):AiSearchResult{
  const started=performance.now()
  const root=position.turn,moves=legal(position)
  if(level===1)return{
    move:moves[Math.floor(Math.random()*moves.length)],
    stats:{nodes:1,tableHits:0,cutoffs:0,depth:1,maxPly:1,tableSize:0,generatedMoves:moves.length,durationMs:performance.now()-started,value:null},
  }

  const depth=level===2?2:level===3?4:5
  const table=new Map<string,SearchEntry>(),mateScore=100000
  let nodes=1,tableHits=0,cutoffs=0,maxPly=0,generatedMoves=moves.length
  const terminalValue=(winner:Side,ply:number)=>winner===root?mateScore-ply:-mateScore+ply

  function search(current:Position,remaining:number,alpha:number,beta:number,ply:number):number{
    nodes+=1
    maxPly=Math.max(maxPly,ply)
    if(current.winner)return terminalValue(current.winner,ply)
    if(!remaining){
      if(isInCheck(current)){
        const replies=legal(current)
        generatedMoves+=replies.length
        if(!replies.length)return terminalValue(other(current.turn),ply)
      }
      return score(current,root)
    }

    const tableKey=`${positionKey(current)}|${remaining}`
    const alphaStart=alpha,betaStart=beta,cached=table.get(tableKey)
    if(cached){
      tableHits+=1
      if(cached.bound==='exact')return cached.value
      if(cached.bound==='lower')alpha=Math.max(alpha,cached.value)
      else beta=Math.min(beta,cached.value)
      if(beta<=alpha){cutoffs+=1;return cached.value}
    }

    const candidates=legal(current)
    generatedMoves+=candidates.length
    if(!candidates.length)return isInCheck(current)?terminalValue(other(current.turn),ply):0

    let value=current.turn===root?-Infinity:Infinity,bestMove:Move|undefined
    if(current.turn===root){
      for(const move of ordered(current,candidates,cached?.bestMove)){
        const child=search(applyForSearch(current,move),remaining-1,alpha,beta,ply+1)
        if(child>value){value=child;bestMove=move}
        alpha=Math.max(alpha,value)
        if(beta<=alpha){cutoffs+=1;break}
      }
    }else{
      for(const move of ordered(current,candidates,cached?.bestMove)){
        const child=search(applyForSearch(current,move),remaining-1,alpha,beta,ply+1)
        if(child<value){value=child;bestMove=move}
        beta=Math.min(beta,value)
        if(beta<=alpha){cutoffs+=1;break}
      }
    }

    const bound:SearchBound=value<=alphaStart?'upper':value>=betaStart?'lower':'exact'
    table.set(tableKey,{value,bound,bestMove})
    return value
  }

  let alpha=-Infinity,bestValue=-Infinity,bestMove:Move|undefined
  const rootMoves=ordered(position,moves,undefined,options.randomizeTies??true)
  for(const move of rootMoves){
    const value=search(applyForSearch(position,move),depth-1,alpha,Infinity,1)
    if(value>bestValue){bestValue=value;bestMove=move}
    alpha=Math.max(alpha,bestValue)
  }
  return{
    move:bestMove,
    stats:{
      nodes,
      tableHits,
      cutoffs,
      depth,
      maxPly,
      tableSize:table.size,
      generatedMoves,
      durationMs:performance.now()-started,
      value:Number.isFinite(bestValue)?bestValue:null,
    },
  }
}
