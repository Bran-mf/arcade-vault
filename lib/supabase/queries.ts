import { createClient } from "@/lib/supabase/server";

export type Game = {
  id: string;
  title: string;
  short: string;
  long: string;
  cat: string;
  cover: string;
  color: string;
};

export type ScoreEntry = {
  id: string;
  game_id: string;
  player: string;
  score: number;
  created_at: string;
};

export async function getGames(): Promise<Game[]> {
  const supabase = await createClient();
  const { data, error } = await supabase
    .from("games")
    .select("*")
    .order("title");
  if (error) throw error;
  return data ?? [];
}

export async function getGame(id: string): Promise<Game | null> {
  const supabase = await createClient();
  const { data, error } = await supabase
    .from("games")
    .select("*")
    .eq("id", id)
    .single();
  if (error) return null;
  return data;
}

export async function getScores(gameId?: string): Promise<ScoreEntry[]> {
  const supabase = await createClient();
  let query = supabase
    .from("scores")
    .select("*")
    .order("score", { ascending: false })
    .limit(15);
  if (gameId) {
    query = query.eq("game_id", gameId);
  }
  const { data, error } = await query;
  if (error) throw error;
  return data ?? [];
}

export async function getGameStats(
  id: string
): Promise<{ best: number; plays: number }> {
  const supabase = await createClient();
  const { data, error } = await supabase
    .from("scores")
    .select("score")
    .eq("game_id", id);
  if (error) throw error;
  const rows = data ?? [];
  const best = rows.length > 0 ? Math.max(...rows.map((r) => r.score)) : 0;
  const plays = rows.length;
  return { best, plays };
}

export async function insertScore(
  gameId: string,
  player: string,
  score: number
): Promise<void> {
  const supabase = await createClient();
  const { error } = await supabase
    .from("scores")
    .insert({ game_id: gameId, player, score });
  if (error) throw error;
}
