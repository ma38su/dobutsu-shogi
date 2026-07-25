import type {Kind,Piece,Position} from './game.ts'

export type PuzzleDifficulty='starter'|'stepup'|'challenge'
export type PuzzleDefinition={
  id:string
  difficulty:PuzzleDifficulty
  title:string
  mission:string
  plies:1|3|5
  position:Position
}

const sente=(kind:Kind):Piece=>({side:'sente',kind})
const gote=(kind:Kind):Piece=>({side:'gote',kind})
const puzzle=(id:string,difficulty:PuzzleDifficulty,title:string,mission:string,plies:1|3|5,board:(Piece|null)[],senteHand:Kind[]=[],goteHand:Kind[]=[]):PuzzleDefinition=>({
  id,
  difficulty,
  title,
  mission,
  plies,
  position:{board,hands:{sente:senteHand,gote:goteHand},turn:'sente'},
})

export const PUZZLES:PuzzleDefinition[]=[
  puzzle('starter-1','starter','まんなかを ふさごう','もちごまを使って、王手と逃げ道封鎖を同時に決めよう',1,[gote('giraffe'),gote('lion'),null,null,null,sente('chick'),gote('giraffe'),sente('elephant'),sente('lion'),null,null,null],['chick','elephant']),
  puzzle('starter-2','starter','みぎから おさえよう','右側から王手をかけて、すべての逃げ道をなくそう',1,[null,gote('giraffe'),gote('lion'),gote('giraffe'),null,null,null,sente('chick'),sente('lion'),sente('elephant'),null,null],['chick','elephant']),
  puzzle('starter-3','starter','ななめの いって','斜めに動く駒で王手をかけ、ライオンを詰ませよう',1,[gote('giraffe'),null,gote('elephant'),sente('chick'),sente('chick'),gote('lion'),sente('lion'),null,null,sente('elephant'),null,sente('giraffe')]),
  puzzle('starter-4','starter','もちごまの 王手','まっすぐ動く持ち駒を、王手になる場所へ置こう',1,[gote('lion'),null,null,sente('elephant'),gote('elephant'),null,sente('chick'),sente('lion'),null,null,null,sente('giraffe')],['chick','giraffe']),
  puzzle('starter-5','starter','パワーアップで 詰み','いちばん奥へ進み、成った駒の動きで詰ませよう',1,[null,null,gote('lion'),sente('giraffe'),sente('chick'),sente('elephant'),null,sente('elephant'),sente('lion'),null,gote('giraffe'),null],['chick']),
  puzzle('starter-6','starter','取って 王手','相手の駒を取りながら、ライオンへ王手をかけよう',1,[gote('lion'),null,gote('elephant'),gote('giraffe'),null,sente('elephant'),sente('chick'),sente('lion'),null,gote('hen'),null,sente('giraffe')]),
  puzzle('stepup-1','stepup','取って 追いかけよう','守りの駒を取り、相手の返しにも王手を続けよう',3,[gote('lion'),null,gote('elephant'),gote('giraffe'),gote('chick'),null,sente('chick'),sente('elephant'),null,sente('giraffe'),sente('lion'),null]),
  puzzle('stepup-2','stepup','ななめの 連続王手','持ち駒の斜めの動きから、次の王手へつなげよう',3,[null,null,sente('giraffe'),gote('lion'),null,null,gote('chick'),sente('giraffe'),null,sente('elephant'),null,sente('lion')],['chick','elephant']),
  puzzle('stepup-3','stepup','強い駒で はさもう','成った駒の広い動きで、逃げ先をしぼろう',3,[sente('giraffe'),null,sente('hen'),null,gote('lion'),null,null,null,gote('chick'),null,sente('lion'),sente('giraffe')],[],['elephant','elephant']),
  puzzle('challenge-1','challenge','守りを くずそう','守りの駒を取りながら、5手の連続王手で追い詰めよう',5,[gote('giraffe'),gote('lion'),gote('elephant'),sente('chick'),null,sente('giraffe'),null,sente('elephant'),null,null,sente('lion'),null],['chick']),
  puzzle('challenge-2','challenge','もちごまから 連続王手','持ち駒を起点に、相手の応手を最後まで読み切ろう',5,[null,gote('lion'),null,null,null,sente('chick'),gote('elephant'),sente('giraffe'),sente('lion'),sente('elephant'),null,null],['chick','giraffe']),
  puzzle('challenge-3','challenge','さいごの 包囲網','盤上の駒をつないで、5手の王手を続けよう',5,[null,null,gote('lion'),null,null,null,null,sente('elephant'),sente('giraffe'),null,null,sente('lion')],['giraffe','elephant'],['chick','chick']),
]

export const PUZZLE_LEVELS:Record<PuzzleDifficulty,{label:string;short:string;description:string;plies:1|3|5}>={
  starter:{label:'はじめて',short:'1手詰め',description:'王手と逃げ道を一手で確認しよう',plies:1},
  stepup:{label:'ステップアップ',short:'3手詰め',description:'相手の返しにも王手を続けよう',plies:3},
  challenge:{label:'チャレンジ',short:'5手詰め',description:'連続王手を最後まで読み切ろう',plies:5},
}
