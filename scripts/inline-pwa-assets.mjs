import {copyFile,readdir,readFile,writeFile} from 'node:fs/promises'
import {basename,resolve} from 'node:path'

const dist=resolve('dist')
const assetsDir=resolve(dist,'assets')
const assetFiles=await readdir(assetsDir)
const workerName=assetFiles.find(name=>name.startsWith('ai.worker-')&&name.endsWith('.js'))

if(!workerName)throw new Error('AI worker asset was not generated')

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

  await copyFile(resolve(assetsDir,workerName),resolve(appDir,workerName))
  html=html
    .replace(styleMatch[0],()=>`<style>${style}</style>`)
    .replace(scriptMatch[0],()=>`<link rel="modulepreload" href="./${basename(workerName)}">\n    <script type="module">${script}</script>`)
  await writeFile(htmlPath,html)
}
