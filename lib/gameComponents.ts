import dynamic from "next/dynamic";
import type { ComponentType } from "react";

export interface GameProps {
  onScore: (n: number) => void;
  onLives: (n: number) => void;
  onLevel: (n: number) => void;
  onGameOver: (score: number) => void;
  onPause?: () => void;
  paused?: boolean;
}

export const GAME_COMPONENTS: Record<string, ComponentType<GameProps>> = {
  rocas: dynamic(() => import("@/components/games/AsteroidsGame"), {
    ssr: false,
  }),
  caida: dynamic(() => import("@/components/games/CaidaGame"), {
    ssr: false,
  }),
};
