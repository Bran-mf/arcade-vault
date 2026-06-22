export type Game = {
  id: string
  title: string
  short: string
  long: string
  cat: string
  cover: string
  color: string
  best: number
  plays: string
}

export type ScoreEntry = {
  player: string
  score: number
  gameId: string
  date: string
}

export const CATS: string[] = ["TODOS", "ARCADE", "PUZZLE", "SHOOTER", "VERSUS"]

export const GAMES: Game[] = [
  {
    id: "bloque-buster",
    title: "BLOQUE BUSTER",
    short: "Rebota la pelota y destruye muros de neón.",
    long: "Pilota una nave-paleta y rebota un núcleo de plasma para pulverizar muros de bloques cromáticos. Cada nivel reorganiza la grilla en patrones imposibles. ¿Hasta dónde llegará tu racha?",
    cat: "ARCADE",
    cover: "cover-bricks",
    color: "cyan",
    best: 28450,
    plays: "12.4K",
  },
  {
    id: "caida",
    title: "CAÍDA",
    short: "Encaja las piezas antes de que el techo te aplaste.",
    long: "Piezas geométricas descienden desde la oscuridad. Rótalas, encástralas y limpia líneas para sobrevivir. La velocidad aumenta sin piedad cada 10 líneas.",
    cat: "PUZZLE",
    cover: "cover-tetro",
    color: "magenta",
    best: 184220,
    plays: "31.8K",
  },
  {
    id: "serpentina",
    title: "SERPENTINA",
    short: "Crece sin morder tu propia cola.",
    long: "Una serpiente de luz recorre la grilla buscando núcleos magenta. Cada bocado la alarga y la hace más veloz. Un movimiento en falso y se devora a sí misma.",
    cat: "ARCADE",
    cover: "cover-snake",
    color: "green",
    best: 7820,
    plays: "9.1K",
  },
  {
    id: "gloton",
    title: "GLOTÓN",
    short: "Devora puntos y escapa de los fantasmas.",
    long: "Un círculo glotón patrulla un laberinto coleccionando puntos luminosos. Cuatro espectros lo persiguen, pero cada cierto tiempo aparece una píldora que invierte los papeles.",
    cat: "ARCADE",
    cover: "cover-glot",
    color: "yellow",
    best: 96400,
    plays: "27.2K",
  },
  {
    id: "invasores",
    title: "INVASORES",
    short: "Defiende el planeta de filas alienígenas.",
    long: "Olas de pixeles hostiles descienden formación tras formación. Mueve tu cañón en horizontal y abre fuego con precisión, antes de que toquen la superficie.",
    cat: "SHOOTER",
    cover: "cover-invaders",
    color: "green",
    best: 54190,
    plays: "18.0K",
  },
  {
    id: "rocas",
    title: "ROCAS",
    short: "Pulveriza asteroides en gravedad cero.",
    long: "Tu nave triangular flota en vacío absoluto. Dispara y rota para dividir rocas en fragmentos cada vez más pequeños. Cuidado con los OVNIs en el horizonte.",
    cat: "SHOOTER",
    cover: "cover-rocas",
    color: "yellow",
    best: 41200,
    plays: "15.6K",
  },
  {
    id: "ranaria",
    title: "RANARIA",
    short: "Cruza la autopista de pixeles.",
    long: "Salta entre carriles de coches a toda velocidad y troncos a la deriva en el río. Llega a los nenúfares antes de que se acabe el tiempo.",
    cat: "ARCADE",
    cover: "cover-rana",
    color: "green",
    best: 18900,
    plays: "6.4K",
  },
  {
    id: "duelo-pixel",
    title: "DUELO PIXEL",
    short: "Dos paletas. Una pelota. Reflejos máximos.",
    long: "El duelo más puro: dos paletas verticales se enfrentan por rebotar una pelota luminosa. Modo solitario contra la CPU o partida local a dos jugadores.",
    cat: "VERSUS",
    cover: "cover-duelo",
    color: "cyan",
    best: 24,
    plays: "4.2K",
  },
]

export const MOCK_SCORES: ScoreEntry[] = [
  { player: "PX_KAI",     score: 284500, gameId: "bloque-buster", date: "21/06/2026" },
  { player: "NEONFOX",    score: 271200, gameId: "caida",         date: "19/06/2026" },
  { player: "Z3R0COOL",   score: 258900, gameId: "gloton",        date: "18/06/2026" },
  { player: "M00NRYU",    score: 241300, gameId: "invasores",     date: "17/06/2026" },
  { player: "VAULT_07",   score: 228750, gameId: "caida",         date: "15/06/2026" },
  { player: "GLITCHA",    score: 214600, gameId: "bloque-buster", date: "14/06/2026" },
  { player: "ATARI_KID",  score: 199300, gameId: "serpentina",    date: "12/06/2026" },
  { player: "CYBER_LU",   score: 187400, gameId: "rocas",         date: "11/06/2026" },
  { player: "MAGENTA88",  score: 174800, gameId: "gloton",        date: "09/06/2026" },
  { player: "SCANLINE",   score: 162200, gameId: "invasores",     date: "07/06/2026" },
  { player: "BIT_LORD",   score: 149700, gameId: "ranaria",       date: "05/06/2026" },
  { player: "ARKADYA",    score: 138500, gameId: "bloque-buster", date: "03/06/2026" },
  { player: "DROID_X",    score: 124300, gameId: "duelo-pixel",   date: "01/06/2026" },
  { player: "RGB_QUEEN",  score: 112900, gameId: "caida",         date: "29/05/2026" },
  { player: "VECTORX",    score:  98600, gameId: "serpentina",    date: "27/05/2026" },
]
