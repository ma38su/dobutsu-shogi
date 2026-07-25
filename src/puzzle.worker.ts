import {isInCheck,legal,pseudo} from './game'
import {applyPuzzle,puzzleMateDistance,puzzleWinningMoves} from './puzzle-engine'
import type {Move} from './game'
import type {PuzzleWorkerRequest,PuzzleWorkerResponse} from './puzzle-worker-protocol'

function chooseWrongLineReply(request:Extract<PuzzleWorkerRequest,{type:'reply'}>,replies:Move[],checked:boolean){
  const attackerLion=request.position.board.findIndex(piece=>piece?.side===request.attacker&&piece.kind==='lion')
  const lionCapture=attackerLion>=0?pseudo(request.position).find(move=>move.to===attackerLion&&move.captured==='lion'):undefined
  const lionReplies=replies.filter(move=>move.piece==='lion')
  const checkerCaptures=replies.filter(move=>move.to===request.wrongMove!.to&&move.captured)
  return lionCapture??(checked?checkerCaptures[0]??lionReplies[0]:lionReplies[0])??replies[0]
}

function chooseBestDefense(request:Extract<PuzzleWorkerRequest,{type:'reply'}>,replies:Move[]){
  return replies.map(move=>({
    move,
    distance:puzzleMateDistance(applyPuzzle(request.position,move),request.attacker,request.remaining-1),
  })).sort((a,b)=>(b.distance??999)-(a.distance??999))[0]?.move
}

self.onmessage=(event:MessageEvent<PuzzleWorkerRequest>)=>{
  const request=event.data
  if(request.type==='analyze'){
    const response:PuzzleWorkerResponse={
      id:request.id,
      type:'analyze',
      winningMoves:puzzleWinningMoves(request.position,request.attacker,request.remaining),
    }
    self.postMessage(response)
    return
  }

  const started=performance.now()
  const replies=legal(request.position),checked=isInCheck(request.position,request.position.turn)
  const choice=request.wrongMove
    ?chooseWrongLineReply(request,replies,checked)
    :chooseBestDefense(request,replies)
  const response:PuzzleWorkerResponse={id:request.id,type:'reply',choice,checked}
  const delay=Math.max(0,request.minimumDelayMs-(performance.now()-started))
  self.setTimeout(()=>self.postMessage(response),delay)
}
