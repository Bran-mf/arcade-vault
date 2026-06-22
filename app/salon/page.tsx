"use client"

import { useState } from "react"
import { GAMES, MOCK_SCORES } from "@/lib/data"

const RANK_CLASS = ["top1", "top2", "top3"]
const PODIUM_CLASS = ["silver", "gold", "bronze"]
const PODIUM_ORDER = [1, 0, 2] // visual order: 2nd, 1st, 3rd

export default function SalonPage() {
  const [activeGame, setActiveGame] = useState("TODOS")

  const filtered = MOCK_SCORES
    .filter((s) => activeGame === "TODOS" || s.gameId === activeGame)
    .sort((a, b) => b.score - a.score)

  const top3 = filtered.slice(0, 3)

  const gameTitle = (id: string) =>
    GAMES.find((g) => g.id === id)?.title ?? id

  return (
    <div className="av-hall fade-in">
      <div className="hall-head">
        <h1 className="flicker">SALÓN DE LA FAMA</h1>
        <p>LOS MEJORES JUGADORES DE ARCADE VAULT</p>
      </div>

      <div className="hall-tabs">
        <button
          className={"chip" + (activeGame === "TODOS" ? " active" : "")}
          onClick={() => setActiveGame("TODOS")}
        >
          TODOS
        </button>
        {GAMES.map((g) => (
          <button
            key={g.id}
            className={"chip" + (activeGame === g.id ? " active" : "")}
            onClick={() => setActiveGame(g.id)}
          >
            {g.title}
          </button>
        ))}
      </div>

      {top3.length > 0 && (
        <div className="podium">
          {PODIUM_ORDER.map((pos) => {
            const entry = top3[pos]
            if (!entry) return <div key={pos} />
            return (
              <div key={pos} className={`podium-slot ${PODIUM_CLASS[pos]}`}>
                <div className="rank-num">{pos + 1}</div>
                <div className="name">{entry.player}</div>
                <div className="score">{entry.score.toLocaleString("es-ES")}</div>
                <div className="date">{gameTitle(entry.gameId)}</div>
                <div className="date">{entry.date}</div>
              </div>
            )
          })}
        </div>
      )}

      <div className="hall-table">
        <div className="th">
          <span>POS</span>
          <span>JUGADOR</span>
          <span>JUEGO</span>
          <span>PUNTUACIÓN</span>
        </div>
        {filtered.map((s, i) => (
          <div key={i} className={`tr ${RANK_CLASS[i] ?? ""}`} style={{ animationDelay: `${i * 30}ms` }}>
            <span className="rk">#{i + 1}</span>
            <span className="pl">{s.player}</span>
            <span className="pl" style={{ fontSize: 11, color: "var(--ink-dim)" }}>{gameTitle(s.gameId)}</span>
            <span className="sc">{s.score.toLocaleString("es-ES")}</span>
          </div>
        ))}
      </div>
    </div>
  )
}
