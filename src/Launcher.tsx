import './launcher.css'

const base = import.meta.env.BASE_URL

export default function Launcher() {
  return <main className="launcher">
    <header className="launcher-header">
      <span className="launcher-mark">将</span>
      <div><h1>どちらであそぶ？</h1><p>すきな世界を えらんでね</p></div>
    </header>
    <section className="app-choices" aria-label="アプリを選ぶ">
      <a className="app-choice okashi-choice" href={`${base}okashi/`}>
        <span className="choice-pattern" aria-hidden="true" />
        <span className="choice-art"><img src={`${base}pieces/sweets/mix/lion.png?v=8`} alt=""/><img src={`${base}pieces/sweets/mix/chick.png?v=8`} alt=""/></span>
        <span className="choice-copy"><span className="choice-label">おかしの国</span><b>おかししょうぎ</b><small>かわいいおかしで対局しよう</small><span className="choice-action">あそぶ <i aria-hidden="true">→</i></span></span>
      </a>
      <a className="app-choice samurai-choice" href={`${base}samurai/`}>
        <span className="choice-pattern" aria-hidden="true" />
        <span className="choice-art"><img src={`${base}pieces/samurai/lion-mounted-sword.png?v=3`} alt=""/><img src={`${base}pieces/samurai/chick.png?v=3`} alt=""/></span>
        <span className="choice-copy"><span className="choice-label">いざ、戦場へ</span><b>さむらいしょうぎ</b><small>侍たちをひきいて勝負しよう</small><span className="choice-action">あそぶ <i aria-hidden="true">→</i></span></span>
      </a>
    </section>
    <p className="launcher-note"><span aria-hidden="true">●</span> ルールとAIはどちらも同じです</p>
  </main>
}
