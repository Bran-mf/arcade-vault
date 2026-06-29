import Link from "next/link";
import { getGames, getScores } from "@/lib/supabase/queries";

const RANK_CLASS = ["top1", "top2", "top3"];
const PODIUM_CLASS = ["silver", "gold", "bronze"];
const PODIUM_ORDER = [1, 0, 2];

export default async function SalonPage({
  searchParams,
}: {
  searchParams: Promise<{ game?: string }>;
}) {
  const { game: activeGame } = await searchParams;
  const [games, scores] = await Promise.all([
    getGames(),
    getScores(activeGame),
  ]);

  const top3 = scores.slice(0, 3);

  const gameTitle = (id: string) => games.find((g) => g.id === id)?.title ?? id;

  const formatDate = (iso: string) =>
    new Date(iso).toLocaleDateString("es-ES", {
      day: "2-digit",
      month: "2-digit",
      year: "numeric",
    });

  return (
    <div className="av-hall fade-in">
      <div className="hall-head">
        <h1 className="flicker">SALÓN DE LA FAMA</h1>
        <p>LOS MEJORES JUGADORES DE ARCADE VAULT</p>
      </div>

      <div className="hall-tabs">
        <Link href="/salon" className={"chip" + (!activeGame ? " active" : "")}>
          TODOS
        </Link>
        {games.map((g) => (
          <Link
            key={g.id}
            href={`/salon?game=${g.id}`}
            className={"chip" + (activeGame === g.id ? " active" : "")}
          >
            {g.title}
          </Link>
        ))}
      </div>

      {top3.length > 0 && (
        <div className="podium">
          {PODIUM_ORDER.map((pos) => {
            const entry = top3[pos];
            if (!entry) return <div key={pos} />;
            return (
              <div key={pos} className={`podium-slot ${PODIUM_CLASS[pos]}`}>
                <div className="rank-num">{pos + 1}</div>
                <div className="name">{entry.player}</div>
                <div className="score">
                  {entry.score.toLocaleString("es-ES")}
                </div>
                <div className="date">{gameTitle(entry.game_id)}</div>
                <div className="date">{formatDate(entry.created_at)}</div>
              </div>
            );
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
        {scores.map((s, i) => (
          <div
            key={s.id}
            className={`tr ${RANK_CLASS[i] ?? ""}`}
            style={{ animationDelay: `${i * 30}ms` }}
          >
            <span className="rk">#{i + 1}</span>
            <span className="pl">{s.player}</span>
            <span
              className="pl"
              style={{ fontSize: 11, color: "var(--ink-dim)" }}
            >
              {gameTitle(s.game_id)}
            </span>
            <span className="sc">{s.score.toLocaleString("es-ES")}</span>
          </div>
        ))}
      </div>
    </div>
  );
}
