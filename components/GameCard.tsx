"use client"

import { useRef } from "react"
import Link from "next/link"
import type { Game } from "@/lib/data"

export default function GameCard({ game }: { game: Game }) {
  const cardRef = useRef<HTMLDivElement>(null)

  const handleMouseMove = (e: React.MouseEvent<HTMLDivElement>) => {
    const el = cardRef.current
    if (!el) return
    const rect = el.getBoundingClientRect()
    const x = (e.clientX - rect.left) / rect.width - 0.5
    const y = (e.clientY - rect.top) / rect.height - 0.5
    el.style.transform = `perspective(600px) rotateY(${x * 12}deg) rotateX(${-y * 12}deg) translateY(-6px)`
  }

  const handleMouseLeave = () => {
    const el = cardRef.current
    if (!el) return
    el.style.transform = ""
  }

  return (
    <div
      ref={cardRef}
      className="card"
      onMouseMove={handleMouseMove}
      onMouseLeave={handleMouseLeave}
      style={{ transition: "transform 120ms ease, box-shadow 220ms ease, border-color 220ms ease" }}
    >
      <div className="cover">
        <div className={`cover-bg ${game.cover}`} />
        <div className="label">{game.cat}</div>
      </div>
      <div className="meta">
        <div className="title">{game.title}</div>
        <div className="desc">{game.short}</div>
        <div className="row">
          <div className="score-badge">
            <span>MEJOR</span>
            <b>{game.best.toLocaleString("es-ES")}</b>
          </div>
          <Link href={`/detalle/${game.id}`} className={`btn ${game.color}`}>
            JUGAR
          </Link>
        </div>
      </div>
    </div>
  )
}
