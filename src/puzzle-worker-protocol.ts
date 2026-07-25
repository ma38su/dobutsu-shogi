import type {Move,Position,Side} from './game'

export type PuzzleWorkerRequest=
  |{id:number;type:'analyze';position:Position;attacker:Side;remaining:number}
  |{id:number;type:'reply';position:Position;attacker:Side;remaining:number;wrongMove?:Move;minimumDelayMs:number}

export type PuzzleWorkerResponse=
  |{id:number;type:'analyze';winningMoves:Move[]}
  |{id:number;type:'reply';choice?:Move;checked:boolean}
