import { notFound } from "next/navigation"
import Link from "next/link"
import { GAMES } from "@/lib/data"

export default async function PlayerPage({
  params,
}: {
  params: Promise<{ id: string }>
}) {
  const { id } = await params
  const game = GAMES.find((g) => g.id === id)
  if (!game) notFound()

  return (
    <div className="av-player fade-in">
      <div className="player-hud">
        <div style={{ display: "flex", gap: 24, flexWrap: "wrap" }}>
          <div className="hud-stat">
            <div className="l">Juego</div>
            <div className="v" style={{ color: "var(--ink)", fontSize: 11 }}>{game.title}</div>
          </div>
          <div className="hud-stat">
            <div className="l">Puntuación</div>
            <div className="v">00000</div>
          </div>
          <div className="hud-stat lives">
            <div className="l">Vidas</div>
            <div className="v">♥ ♥ ♥</div>
          </div>
          <div className="hud-stat level">
            <div className="l">Nivel</div>
            <div className="v">01</div>
          </div>
        </div>
        <div className="hud-actions">
          <button className="btn yellow">PAUSA</button>
          <button className="btn magenta">FIN</button>
          <Link href={`/detalle/${game.id}`} className="btn ghost">SALIR</Link>
        </div>
      </div>

      <div className="crt">
        <div className="crt-screen">
          <div className="game-arena">
            <div className="grid-floor" />
            <div className="enemy e1" />
            <div className="enemy e2" />
            <div className="enemy e3" />
            <div className="player-ship" />
          </div>
        </div>
        <div className="crt-bottom">
          <span className="led">SEÑAL OK</span>
          <span>{game.title} · CRT-83 · 60 HZ</span>
          <span>CARGA · 1MB</span>
        </div>
      </div>
    </div>
  )
}
