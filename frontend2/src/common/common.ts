export const GAME_STATE = {
    WAITING_FOR_PLAYERS: 'WAITING_FOR_PLAYERS',
    PLAYING: 'PLAYING',
    FINISHED: 'FINISHED'
} as const;

export type GameState = keyof typeof GAME_STATE;