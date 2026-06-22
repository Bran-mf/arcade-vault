import { notFound } from "next/navigation"
import Link from "next/link"
import { GAMES, MOCK_SCORES } from "@/lib/data"

export default async function DetallePage({
  params,
}: {
  params: Promise<{ id: string }>
}) {
  const { id } = await params
  const game = GAMES.find((g) => g.id === id)
  if (!game) notFound()

  const scores = MOCK_SCORES.filter((s) => s.gameId === id)
    .sort((a, b) => b.score - a.score)

  const rankClass = (i: number) =>
    i === 0 ? "top1" : i === 1 ? "top2" : i === 2 ? "top3" : ""

  return (
    <div className="av-detail fade-in">
      <div className="detail-cover">
        <div className={`cover-bg ${game.cover}`} style={{ position: "absolute", inset: 0 }} />
      </div>

      <div className="detail-info">
        <div className="detail-tags">
          <span>{game.cat}</span>
          <span className={`neon-${game.color}`}>{game.color.toUpperCase()}</span>
        </div>
        <h2 className={`neon-${game.color}`}>{game.title}</h2>
        <p>{game.long}</p>

        <div className="stat-strip">
          <div>
            <div className="l">MEJOR PUNTUACIÓN</div>
            <div className="v">{game.best.toLocaleString("es-ES")}</div>
          </div>
          <div>
            <div className="l">PARTIDAS</div>
            <div className="v">{game.plays}</div>
          </div>
          <div>
            <div className="l">CATEGORÍA</div>
            <div className="v" style={{ fontSize: 11 }}>{game.cat}</div>
          </div>
        </div>

        <div className="detail-actions">
          <Link href={`/player/${game.id}`} className={`btn ${game.color} lg pulse`}>
            ▶ JUGAR
          </Link>
          <Link href="/biblioteca" className="btn ghost">
            ← VOLVER
          </Link>
        </div>

        <div className="leaderboard" style={{ marginTop: 24 }}>
          <h3>TABLA DE LÍDERES</h3>
          {scores.length === 0 ? (
            <div style={{ padding: "16px", color: "var(--ink-faint)", fontFamily: "var(--mono)", fontSize: 12 }}>
              Sin puntuaciones aún.
            </div>
          ) : (
            scores.map((s, i) => (
              <div key={i} className={`lb-row ${rankClass(i)}`}>
                <span className="rk">#{i + 1}</span>
                <span className="pl">{s.player}</span>
                <span className="sc">{s.score.toLocaleString("es-ES")}</span>
              </div>
            ))
          )}
        </div>
      </div>
    </div>
  )
}
