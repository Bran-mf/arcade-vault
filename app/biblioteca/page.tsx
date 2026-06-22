"use client"

import { useState } from "react"
import GameCard from "@/components/GameCard"
import { GAMES, CATS } from "@/lib/data"

export default function BibliotecaPage() {
  const [search, setSearch] = useState("")
  const [activeCat, setActiveCat] = useState("TODOS")

  const filtered = GAMES.filter((g) => {
    const matchCat = activeCat === "TODOS" || g.cat === activeCat
    const matchSearch = g.title.toLowerCase().includes(search.toLowerCase())
    return matchCat && matchSearch
  })

  return (
    <>
      <section className="av-hero">
        <h1 className="flicker">ARCADE VAULT</h1>
        <div className="sub">
          SELECCIONA TU JUEGO&nbsp;
          <span className="blink">_</span>
        </div>
      </section>

      <div className="av-filters">
        <div className="av-search">
          <span className="ico">▸</span>
          <input
            type="text"
            placeholder="Buscar juego..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
          />
        </div>
        <div className="av-chips">
          {CATS.map((cat) => (
            <button
              key={cat}
              className={"chip" + (activeCat === cat ? " active" : "")}
              onClick={() => setActiveCat(cat)}
            >
              {cat}
            </button>
          ))}
        </div>
      </div>

      <div className="av-grid">
        {filtered.map((game) => (
          <GameCard key={game.id} game={game} />
        ))}
      </div>
    </>
  )
}
