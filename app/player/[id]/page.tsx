"use client";

import { use, useState } from "react";
import { useRouter } from "next/navigation";
import { GAMES } from "@/lib/data";
import { GAME_COMPONENTS } from "@/lib/gameComponents";
import type { GameProps } from "@/lib/gameComponents";
import { insertScore } from "@/app/actions";

export default function PlayerPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = use(params);
  const game = GAMES.find((g) => g.id === id);
  const router = useRouter();

  const [score, setScore] = useState(0);
  const [lives, setLives] = useState(1);
  const [level, setLevel] = useState(1);
  const [paused, setPaused] = useState(false);
  const [gameOver, setGameOver] = useState(false);
  const [finalScore, setFinalScore] = useState(0);
  const [playerName, setPlayerName] = useState("");
  const [submitting, setSubmitting] = useState(false);
  const [nameError, setNameError] = useState("");
  const [gameKey, setGameKey] = useState(0);

  if (!game) {
    return (
      <div className="av-player fade-in">
        <p style={{ color: "#fff", padding: 24 }}>Juego no encontrado.</p>
      </div>
    );
  }

  const GameComponent = GAME_COMPONENTS[id] ?? null;

  const handleGameOver = (finalScoreFromGame?: number) => {
    setFinalScore(finalScoreFromGame ?? score);
    setGameOver(true);
  };

  const handleRetry = () => {
    setGameOver(false);
    setFinalScore(0);
    setScore(0);
    setLives(3);
    setLevel(1);
    setPlayerName("");
    setNameError("");
    setGameKey((k) => k + 1);
  };

  const handleSubmit = async () => {
    const name = playerName.trim().toUpperCase();
    if (!name) {
      setNameError("Ingresa un nombre.");
      return;
    }
    setNameError("");
    setSubmitting(true);
    try {
      await insertScore(id, name, finalScore);
      router.push(`/detalle/${id}`);
    } catch {
      setNameError("Error al enviar. Intenta de nuevo.");
      setSubmitting(false);
    }
  };

  const gameProps: GameProps = {
    onScore: setScore,
    onLives: setLives,
    onLevel: setLevel,
    onGameOver: handleGameOver,
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
              <GameComponent key={gameKey} {...gameProps} />
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

          {gameOver && (
            <div
              style={{
                position: "absolute",
                inset: 0,
                display: "flex",
                flexDirection: "column",
                alignItems: "center",
                justifyContent: "center",
                gap: 16,
                background: "rgba(0,0,0,0.85)",
                zIndex: 10,
                fontFamily: "var(--mono)",
              }}
            >
              <div
                className="flicker"
                style={{
                  fontSize: 28,
                  color: "var(--neon-yellow)",
                  letterSpacing: 4,
                }}
              >
                GAME OVER
              </div>
              <div style={{ fontSize: 13, color: "var(--ink-dim)" }}>
                PUNTUACIÓN FINAL
              </div>
              <div
                style={{
                  fontSize: 32,
                  color: "var(--neon-cyan)",
                  letterSpacing: 2,
                }}
              >
                {finalScore.toLocaleString("es-ES")}
              </div>
              <div
                style={{ fontSize: 11, color: "var(--ink-dim)", marginTop: 8 }}
              >
                INGRESA TU NOMBRE (máx. 12 caracteres)
              </div>
              <input
                type="text"
                maxLength={12}
                value={playerName}
                onChange={(e) => {
                  setPlayerName(e.target.value.toUpperCase());
                  setNameError("");
                }}
                style={{
                  background: "transparent",
                  border: "1px solid var(--neon-cyan)",
                  color: "var(--neon-cyan)",
                  fontFamily: "var(--mono)",
                  fontSize: 18,
                  padding: "6px 12px",
                  textAlign: "center",
                  letterSpacing: 4,
                  outline: "none",
                  width: 200,
                }}
                placeholder="JUGADOR"
                autoFocus
              />
              {nameError && (
                <div style={{ fontSize: 11, color: "var(--neon-magenta)" }}>
                  {nameError}
                </div>
              )}
              <div style={{ display: "flex", gap: 12, marginTop: 8 }}>
                <button
                  className="btn cyan"
                  onClick={handleSubmit}
                  disabled={submitting || !playerName.trim()}
                >
                  {submitting ? "ENVIANDO…" : "ENVIAR"}
                </button>
                <button className="btn ghost" onClick={handleRetry}>
                  REINTENTAR
                </button>
              </div>
            </div>
          )}
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
