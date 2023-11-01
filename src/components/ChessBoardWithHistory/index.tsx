import React, {
  useCallback,
  useEffect,
  useState,
} from 'react';
import { deserializerWithStatus } from '../../engine/src/fen/deserializerWithStatus';
import { Game } from '../../engine/src/game/Game';
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
  const totalMoves = game.gameState.history.history.length;
  const lastMoveIndex = totalMoves - 1;
  const [moveIndex, setMoveIndex] = useState(propMoveIndex ?? lastMoveIndex);

  useEffect(() => {
    console.log(`moveIndex prop updated ${moveIndex} -> ${propMoveIndex}`);
    setMoveIndex(moveIndex => propMoveIndex ?? moveIndex);
  }, [propMoveIndex]);

  useEffect(() => {
    console.log('new move detected');
    setMoveIndex(moveIndex => game.gameState.history.history.length > 0 ? game.gameState.history.history.length - 1 : 0);
  }, [game.gameState.history.history.length]);

  const onPrev = useCallback(() => {
    setMoveIndex(moveIndex => moveIndex - 1);
  }, []);

  const onNext = useCallback(() => {
    setMoveIndex(moveIndex => moveIndex + 1);
  }, []);

  const historyControls = (
    <div>
      <button onClick={onPrev} disabled={moveIndex === 0}>{'<'}</button>
      {moveIndex + 1}/{totalMoves}
      <button onClick={onNext} disabled={totalMoves === 0 || moveIndex === lastMoveIndex}>{'>'}</button>
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
  return (
    <>
      {historyControls}
      <FenToChessBoard
        {...props}
        fen={selectedFen}
        onMove={(...args) => {
          const historyCopy = game.gameState.history.history.slice(0, moveIndex);
          // fix history
          Object.assign(
            game.gameState,
            {
              ...deserializerWithStatus(selectedFen, true),
              history: {
                ...game.gameState.history,
                history: historyCopy,
              },
            },
          );
          props.onMove(...args);
        }}
      />
    </>
  );
}
