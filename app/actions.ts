"use server";

import { insertScore as _insertScore } from "@/lib/supabase/queries";

export async function insertScore(
  gameId: string,
  player: string,
  score: number
) {
  await _insertScore(gameId, player, score);
}
