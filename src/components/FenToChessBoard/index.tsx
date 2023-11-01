import React, {
  useEffect,
  useState,
} from 'react';
import { deserializerWithStatus } from '../../engine/src/fen/deserializerWithStatus';
import { FENString } from '../../engine/src/fen/FENString';
import {
  ChessBoard,
  ChessBoardProps,
} from '../ChessBoard';

type FenToChessBoardProps = {
  fen: FENString,
} & Omit<ChessBoardProps, 'gameStatus' | 'activeColor' | 'board'>;

export function FenToChessBoard(
  {
    fen,
    ...props
  }: FenToChessBoardProps,
) {
  const [gameState, setGameState] = useState(deserializerWithStatus(fen, true));

  useEffect(() => {
    setGameState(deserializerWithStatus(fen, true));
  }, [fen]);

  return (
    <ChessBoard
      {...props}
      gameStatus={gameState.gameStatus}
      activeColor={gameState.activeColor}
      board={gameState.board}
    />
  )
}
