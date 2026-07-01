"use client";

import { useEffect, useRef } from "react";
import type { GameProps } from "@/lib/gameComponents";

const COLS = 10;
const ROWS = 20;
const BLOCK = 30;
const BOARD_W = COLS * BLOCK;
const BOARD_H = ROWS * BLOCK;
const BOARD_X = 40;
const BOARD_Y = 0;

const COLORS: (string | null)[] = [
  null,
  "#4dd0e1", // I - cyan
  "#ffd54f", // O - yellow
  "#ba68c8", // T - purple
  "#81c784", // S - green
  "#e57373", // Z - red
  "#90caf9", // J - pale blue
  "#ffb74d", // L - orange
];

const PIECES: (number[][] | null)[] = [
  null,
  [
    [0, 0, 0, 0],
    [1, 1, 1, 1],
    [0, 0, 0, 0],
    [0, 0, 0, 0],
  ], // I
  [
    [2, 2],
    [2, 2],
  ], // O
  [
    [0, 3, 0],
    [3, 3, 3],
    [0, 0, 0],
  ], // T
  [
    [0, 4, 4],
    [4, 4, 0],
    [0, 0, 0],
  ], // S
  [
    [5, 5, 0],
    [0, 5, 5],
    [0, 0, 0],
  ], // Z
  [
    [6, 0, 0],
    [6, 6, 6],
    [0, 0, 0],
  ], // J
  [
    [0, 0, 7],
    [7, 7, 7],
    [0, 0, 0],
  ], // L
];

const LINE_SCORES = [0, 100, 300, 500, 800];

interface Piece {
  type: number;
  shape: number[][];
  x: number;
  y: number;
}

type Phase = "select" | "playing" | "gameover";

export default function CaidaGame({
  onScore,
  onLives,
  onLevel,
  onGameOver,
  onPause,
  paused = false,
}: GameProps) {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const pausedRef = useRef(paused);

  useEffect(() => {
    pausedRef.current = paused;
  }, [paused]);

  useEffect(() => {
    const canvas = canvasRef.current!;
    const ctx = canvas.getContext("2d")!;
    const W = 800;
    const H = 600;

    onLives(1);

    let board: number[][] = Array.from({ length: ROWS }, () =>
      new Array(COLS).fill(0)
    );
    let current: Piece;
    let next: Piece;
    let score = 0;
    let lines = 0;
    let level = 1;
    let startLevel = 1;
    let dropInterval = 1000;
    let dropAccum = 0;
    let lastTime: number | null = null;
    let rafId: number;

    let phase: Phase = "select";
    let selectedLevel = 1;
    let internalPaused = false;
    let gameOverFired = false;

    let prevScore = -1;
    let prevLevel = -1;

    function randomPiece(): Piece {
      const type = Math.floor(Math.random() * 7) + 1;
      const shape = (PIECES[type] as number[][]).map((row) => [...row]);
      return {
        type,
        shape,
        x: Math.floor(COLS / 2) - Math.floor(shape[0].length / 2),
        y: 0,
      };
    }

    function collide(shape: number[][], ox: number, oy: number) {
      for (let r = 0; r < shape.length; r++) {
        for (let c = 0; c < shape[r].length; c++) {
          if (!shape[r][c]) continue;
          const nx = ox + c;
          const ny = oy + r;
          if (nx < 0 || nx >= COLS || ny >= ROWS) return true;
          if (ny >= 0 && board[ny][nx]) return true;
        }
      }
      return false;
    }

    function rotateCW(shape: number[][]) {
      const rows = shape.length;
      const cols = shape[0].length;
      const result = Array.from({ length: cols }, () =>
        new Array(rows).fill(0)
      );
      for (let r = 0; r < rows; r++)
        for (let c = 0; c < cols; c++) result[c][rows - 1 - r] = shape[r][c];
      return result;
    }

    function tryRotate() {
      const rotated = rotateCW(current.shape);
      const kicks = [0, -1, 1, -2, 2];
      for (const kick of kicks) {
        if (!collide(rotated, current.x + kick, current.y)) {
          current.shape = rotated;
          current.x += kick;
          return;
        }
      }
    }

    function merge() {
      for (let r = 0; r < current.shape.length; r++)
        for (let c = 0; c < current.shape[r].length; c++)
          if (current.shape[r][c])
            board[current.y + r][current.x + c] = current.shape[r][c];
    }

    function clearLines() {
      let cleared = 0;
      for (let r = ROWS - 1; r >= 0; r--) {
        if (board[r].every((v) => v !== 0)) {
          board.splice(r, 1);
          board.unshift(new Array(COLS).fill(0));
          cleared++;
          r++;
        }
      }
      if (cleared) {
        lines += cleared;
        score += (LINE_SCORES[cleared] || 0) * level;
        level = startLevel + Math.floor(lines / 10);
        dropInterval = Math.max(100, 1000 - (level - 1) * 90);
      }
    }

    function ghostY() {
      let gy = current.y;
      while (!collide(current.shape, current.x, gy + 1)) gy++;
      return gy;
    }

    function spawn() {
      current = next;
      next = randomPiece();
      if (collide(current.shape, current.x, current.y)) {
        phase = "gameover";
      }
    }

    function lockPiece() {
      merge();
      clearLines();
      spawn();
    }

    function hardDrop() {
      const gy = ghostY();
      score += (gy - current.y) * 2;
      current.y = gy;
      lockPiece();
    }

    function softDrop() {
      if (!collide(current.shape, current.x, current.y + 1)) {
        current.y++;
        score += 1;
      } else {
        lockPiece();
      }
    }

    function startGame(lvl: number) {
      startLevel = lvl;
      board = Array.from({ length: ROWS }, () => new Array(COLS).fill(0));
      score = 0;
      lines = 0;
      level = lvl;
      dropInterval = Math.max(100, 1000 - (lvl - 1) * 90);
      dropAccum = 0;
      lastTime = performance.now();
      next = randomPiece();
      spawn();
      phase = "playing";
    }

    // ── Input ──────────────────────────────────────────────────────────────────
    function onKeyDown(e: KeyboardEvent) {
      if (
        ["ArrowUp", "ArrowDown", "ArrowLeft", "ArrowRight", "Space"].includes(
          e.code
        )
      ) {
        e.preventDefault();
      }

      if (phase === "select") {
        if (e.code === "ArrowUp")
          selectedLevel = Math.min(15, selectedLevel + 1);
        else if (e.code === "ArrowDown")
          selectedLevel = Math.max(1, selectedLevel - 1);
        else if (e.code === "ArrowRight")
          selectedLevel = Math.min(15, selectedLevel + 5);
        else if (e.code === "ArrowLeft")
          selectedLevel = Math.max(1, selectedLevel - 5);
        else if (e.code === "Enter" || e.code === "Space")
          startGame(selectedLevel);
        return;
      }

      if (e.code === "KeyP" || e.code === "Escape") {
        if (phase === "playing") {
          internalPaused = !internalPaused;
          onPause?.();
        }
        return;
      }

      if (phase !== "playing" || internalPaused || pausedRef.current) return;

      switch (e.code) {
        case "ArrowLeft":
          if (!collide(current.shape, current.x - 1, current.y)) current.x--;
          break;
        case "ArrowRight":
          if (!collide(current.shape, current.x + 1, current.y)) current.x++;
          break;
        case "ArrowDown":
          softDrop();
          break;
        case "ArrowUp":
          tryRotate();
          break;
        case "Space":
          hardDrop();
          break;
      }
    }

    function onKeyUp() {
      // no-op: Tetris controls are discrete key-down actions
    }

    canvas.addEventListener("keydown", onKeyDown);
    canvas.addEventListener("keyup", onKeyUp);

    // ── Draw ───────────────────────────────────────────────────────────────────
    function drawBlock(x: number, y: number, colorIndex: number, alpha = 1) {
      if (!colorIndex) return;
      ctx.globalAlpha = alpha;
      ctx.fillStyle = COLORS[colorIndex]!;
      ctx.fillRect(
        BOARD_X + x * BLOCK + 1,
        BOARD_Y + y * BLOCK + 1,
        BLOCK - 2,
        BLOCK - 2
      );
      ctx.fillStyle = "rgba(255,255,255,0.12)";
      ctx.fillRect(
        BOARD_X + x * BLOCK + 1,
        BOARD_Y + y * BLOCK + 1,
        BLOCK - 2,
        4
      );
      ctx.globalAlpha = 1;
    }

    function drawGrid() {
      ctx.strokeStyle = "rgba(255,255,255,0.08)";
      ctx.lineWidth = 0.5;
      for (let c = 1; c < COLS; c++) {
        ctx.beginPath();
        ctx.moveTo(BOARD_X + c * BLOCK, BOARD_Y);
        ctx.lineTo(BOARD_X + c * BLOCK, BOARD_Y + BOARD_H);
        ctx.stroke();
      }
      for (let r = 1; r < ROWS; r++) {
        ctx.beginPath();
        ctx.moveTo(BOARD_X, BOARD_Y + r * BLOCK);
        ctx.lineTo(BOARD_X + BOARD_W, BOARD_Y + r * BLOCK);
        ctx.stroke();
      }
      ctx.strokeStyle = "rgba(255,255,255,0.3)";
      ctx.lineWidth = 1;
      ctx.strokeRect(BOARD_X, BOARD_Y, BOARD_W, BOARD_H);
    }

    function drawNextPreview() {
      const panelX = BOARD_X + BOARD_W + 40;
      ctx.textAlign = "left";
      ctx.fillStyle = "rgba(255,255,255,0.7)";
      ctx.font = "14px monospace";
      ctx.fillText("SIGUIENTE", panelX, 30);
      const nb = 24;
      const shape = next.shape;
      const offX = Math.floor((4 - shape[0].length) / 2);
      const offY = Math.floor((4 - shape.length) / 2);
      for (let r = 0; r < shape.length; r++) {
        for (let c = 0; c < shape[r].length; c++) {
          if (!shape[r][c]) continue;
          ctx.fillStyle = COLORS[shape[r][c]]!;
          ctx.fillRect(
            panelX + (offX + c) * nb,
            50 + (offY + r) * nb,
            nb - 2,
            nb - 2
          );
        }
      }
      ctx.fillStyle = "rgba(255,255,255,0.7)";
      ctx.font = "14px monospace";
      ctx.fillText(`PUNTAJE: ${score}`, panelX, 200);
      ctx.fillText(`LÍNEAS: ${lines}`, panelX, 224);
      ctx.fillText(`NIVEL: ${level}`, panelX, 248);
    }

    function drawSelectScreen() {
      ctx.fillStyle = "#000";
      ctx.fillRect(0, 0, W, H);
      ctx.textAlign = "center";
      ctx.fillStyle = "#fff";
      ctx.font = "bold 36px monospace";
      ctx.fillText("CAÍDA", W / 2, 140);
      ctx.font = "16px monospace";
      ctx.fillStyle = "rgba(255,255,255,0.7)";
      ctx.fillText(
        "SELECCIONA NIVEL (↑/↓) — ENTER/ESPACIO PARA JUGAR",
        W / 2,
        190
      );
      ctx.font = "bold 64px monospace";
      ctx.fillStyle = "#4dd0e1";
      ctx.fillText(String(selectedLevel), W / 2, 300);
    }

    function drawPauseOverlay() {
      ctx.fillStyle = "rgba(0,0,0,0.6)";
      ctx.fillRect(0, 0, W, H);
      ctx.textAlign = "center";
      ctx.fillStyle = "#fff";
      ctx.font = "bold 32px monospace";
      ctx.fillText("PAUSA", W / 2, H / 2);
    }

    function drawGameOverOverlay() {
      ctx.fillStyle = "rgba(0,0,0,0.75)";
      ctx.fillRect(0, 0, W, H);
      ctx.textAlign = "center";
      ctx.fillStyle = "#fff";
      ctx.font = "bold 36px monospace";
      ctx.fillText("GAME OVER", W / 2, H / 2 - 10);
      ctx.font = "16px monospace";
      ctx.fillStyle = "rgba(255,255,255,0.7)";
      ctx.fillText(`PUNTAJE: ${score}`, W / 2, H / 2 + 24);
    }

    function draw() {
      ctx.fillStyle = "#000";
      ctx.fillRect(0, 0, W, H);

      if (phase === "select") {
        drawSelectScreen();
        return;
      }

      drawGrid();

      for (let r = 0; r < ROWS; r++)
        for (let c = 0; c < COLS; c++) drawBlock(c, r, board[r][c]);

      const gy = ghostY();
      for (let r = 0; r < current.shape.length; r++)
        for (let c = 0; c < current.shape[r].length; c++)
          if (current.shape[r][c])
            drawBlock(current.x + c, gy + r, current.shape[r][c], 0.2);

      for (let r = 0; r < current.shape.length; r++)
        for (let c = 0; c < current.shape[r].length; c++)
          drawBlock(current.x + c, current.y + r, current.shape[r][c]);

      drawNextPreview();

      if (internalPaused) drawPauseOverlay();
      if (phase === "gameover") drawGameOverOverlay();
    }

    function fireCallbacks() {
      if (score !== prevScore) {
        prevScore = score;
        onScore(score);
      }
      if (level !== prevLevel) {
        prevLevel = level;
        onLevel(level);
      }
    }

    // ── Loop ───────────────────────────────────────────────────────────────────
    function loop(ts: number) {
      const dt = lastTime === null ? 0 : ts - lastTime;
      lastTime = ts;

      if (phase === "playing" && !internalPaused && !pausedRef.current) {
        dropAccum += dt;
        if (dropAccum >= dropInterval) {
          dropAccum = 0;
          if (!collide(current.shape, current.x, current.y + 1)) {
            current.y++;
          } else {
            lockPiece();
          }
        }
      }

      draw();

      if (phase !== "select") fireCallbacks();

      if (phase === "gameover" && !gameOverFired) {
        gameOverFired = true;
        onGameOver(score);
      }

      rafId = requestAnimationFrame(loop);
    }

    canvas.focus();
    draw();
    rafId = requestAnimationFrame(loop);

    return () => {
      cancelAnimationFrame(rafId);
      canvas.removeEventListener("keydown", onKeyDown);
      canvas.removeEventListener("keyup", onKeyUp);
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  return (
    <canvas
      ref={canvasRef}
      width={800}
      height={600}
      tabIndex={0}
      style={{
        width: "100%",
        height: "100%",
        objectFit: "contain",
        display: "block",
      }}
    />
  );
}
