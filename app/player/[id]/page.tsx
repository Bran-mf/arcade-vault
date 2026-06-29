"use client";

import { use, useState } from "react";
import { useRouter } from "next/navigation";
import { GAMES } from "@/lib/data";
import { GAME_COMPONENTS } from "@/lib/gameComponents";
import type { GameProps } from "@/lib/gameComponents";

export default function PlayerPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = use(params);
  const game = GAMES.find((g) => g.id === id);
  const router = useRouter();

  const [score, setScore] = useState(0);
  const [lives, setLives] = useState(3);
  const [level, setLevel] = useState(1);
  const [paused, setPaused] = useState(false);
  const [gameOver, setGameOver] = useState(false);

  if (!game) {
    return (
      <div className="av-player fade-in">
        <p style={{ color: "#fff", padding: 24 }}>Juego no encontrado.</p>
      </div>
    );
  }

  const GameComponent = GAME_COMPONENTS[id] ?? null;

  const gameProps: GameProps = {
    onScore: setScore,
    onLives: setLives,
    onLevel: setLevel,
    onGameOver: () => setGameOver(true),
    paused,
  };

  const scoreStr = String(score).padStart(5, "0");
  const levelStr = String(level).padStart(2, "0");
  const heartsStr = "♥ ".repeat(Math.max(0, lives)).trim();

  return (
    <div className="av-player fade-in">
      <div className="player-hud">
        <div style={{ display: "flex", gap: 24, flexWrap: "wrap" }}>
          <div className="hud-stat">
            <div className="l">Juego</div>
            <div className="v" style={{ color: "var(--ink)", fontSize: 11 }}>
              {game.title}
            </div>
          </div>
          <div className="hud-stat">
            <div className="l">Puntuación</div>
            <div className="v">{scoreStr}</div>
          </div>
          <div className="hud-stat lives">
            <div className="l">Vidas</div>
            <div className="v">{heartsStr || "—"}</div>
          </div>
          <div className="hud-stat level">
            <div className="l">Nivel</div>
            <div className="v">{levelStr}</div>
          </div>
        </div>
        <div className="hud-actions">
          <button className="btn yellow" onClick={() => setPaused((p) => !p)}>
            {paused ? "REANUDAR" : "PAUSA"}
          </button>
          <button
            className="btn magenta"
            onClick={() => router.push(`/detalle/${id}`)}
          >
            FIN
          </button>
        </div>
      </div>

      <div className="crt">
        <div className="crt-screen">
          <div className="game-arena">
            {GameComponent ? (
              <GameComponent {...gameProps} />
            ) : (
              <>
                <div className="grid-floor" />
                <div className="enemy e1" />
                <div className="enemy e2" />
                <div className="enemy e3" />
                <div className="player-ship" />
              </>
            )}
          </div>
        </div>
        <div className="crt-bottom">
          <span className="led">
            {gameOver ? "GAME OVER" : paused ? "PAUSA" : "SEÑAL OK"}
          </span>
          <span>{game.title} · CRT-83 · 60 HZ</span>
          <span>CARGA · 1MB</span>
        </div>
      </div>
    </div>
  );
}
