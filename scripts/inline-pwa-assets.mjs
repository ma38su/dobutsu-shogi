import {readFile,writeFile} from 'node:fs/promises'
import {resolve} from 'node:path'

const dist=resolve('dist')

for(const app of ['okashi','samurai']){
  const appDir=resolve(dist,app)
  const htmlPath=resolve(appDir,'index.html')
  let html=await readFile(htmlPath,'utf8')

  const scriptMatch=html.match(/<script type="module" crossorigin src="([^"]+)"><\/script>/)
  const styleMatch=html.match(/<link rel="stylesheet" crossorigin href="([^"]+)">/)
  if(!scriptMatch||!styleMatch)throw new Error(`Built assets were not found in ${app}/index.html`)

  const scriptPath=resolve(appDir,scriptMatch[1])
  const stylePath=resolve(appDir,styleMatch[1])
  const [script,style]=await Promise.all([
    readFile(scriptPath,'utf8'),
    readFile(stylePath,'utf8'),
  ])

  html=html
    .replace(styleMatch[0],()=>`<style>${style}</style>`)
    .replace(scriptMatch[0],()=>`<script type="module">${script}</script>`)
  await writeFile(htmlPath,html)
}
