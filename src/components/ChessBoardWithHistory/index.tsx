import React, {
  useCallback,
  useEffect,
  useState,
} from 'react';
import { Game } from '../../engine/src/game/Game';
import { revert } from '../../engine/src/state/utils/GameStatusUtils';
import {
  ChessBoard,
  ChessBoardProps,
} from '../ChessBoard';
import { FenToChessBoard } from '../FenToChessBoard';



type ChessBoardWithHistoryProps = {
  game: Game,
  moveIndex?: number,
} & Omit<ChessBoardProps, 'gameStatus' | 'activeColor' | 'board'>;

export function ChessBoardWithHistory(
  {
    game,
    moveIndex: propMoveIndex,
    ...props
  }: ChessBoardWithHistoryProps
) {
  const totalMoves = Math.max(game.gameState.history.history.length - 1, 0);
  const lastMoveIndex = game.gameState.history.history.length - 1;
  const [moveIndex, setMoveIndex] = useState(propMoveIndex ?? lastMoveIndex);

  // update moveIndex if props.moveIndex changes
  useEffect(() => {
    if (moveIndex === propMoveIndex || propMoveIndex === undefined) {
      return;
    }
    setMoveIndex(moveIndex => propMoveIndex ?? moveIndex);
  }, [moveIndex, propMoveIndex]);

  // detect new moves
  useEffect(() => {
    // don't use cached value, re-access it to make sure we have the latest count
    setMoveIndex(moveIndex => game.gameState.history.history.length > 1 ? game.gameState.history.history.length - 1 : 0);
  }, [game.gameState.history.history.length]);

  const onPrev = useCallback(() => {
    setMoveIndex(moveIndex => moveIndex - 1);
  }, []);

  const onNext = useCallback(() => {
    setMoveIndex(moveIndex => moveIndex + 1);
  }, []);

  const onPlayFromHere = useCallback(() => {
    console.log(`playing from: (${moveIndex}) ${game.gameState.history.history[moveIndex]}`);
    // TODO: recalculate captured pieces from history
    revert(game.gameState, moveIndex);
  }, [game, moveIndex]);

  const historyControls = (
    <div>
      <button onClick={onPrev} disabled={moveIndex === 0}>{'<'}</button>
      {moveIndex}/{totalMoves}
      <button onClick={onNext} disabled={totalMoves === 0 || moveIndex === lastMoveIndex}>{'>'}</button>
      <button onClick={onPlayFromHere} hidden={moveIndex === lastMoveIndex}>Play from here</button>
    </div>
  );

  if (totalMoves === 0 || moveIndex === lastMoveIndex) {
    return (
      <>
        {historyControls}
        <ChessBoard
          {...props}
          gameStatus={game.gameState.gameStatus}
          activeColor={game.gameState.activeColor}
          board={game.gameState.board}
        />
      </>
    );
  }
  if (!game.gameState.history.history[moveIndex]) {
    return (
      <>
        {historyControls}
        <div>Invalid Move Index {moveIndex}/{lastMoveIndex}</div>
      </>
    )
  }
  const selectedFen = game.gameState.history.history[moveIndex];
  // TODO: recalculate highlighted squares from history
  return (
    <>
      {historyControls}
      <FenToChessBoard
        {...props}
        fen={selectedFen}
        onMove={() => {}}
        onSquareClick={() => {}}
        highlightedSquares={[]}
      />
    </>
  );
}
