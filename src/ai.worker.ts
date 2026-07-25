import {chooseAiMove} from './ai-engine'
import type {AiSearchResult} from './ai-engine'
import type {Position} from './game'

type AiRequest={id:number;position:Position;level:number}
export type AiResponse={id:number}&AiSearchResult

self.onmessage=(event:MessageEvent<AiRequest>)=>{
  const {id,position,level}=event.data
  const response:AiResponse={id,...chooseAiMove(position,level)}
  self.postMessage(response)
}
