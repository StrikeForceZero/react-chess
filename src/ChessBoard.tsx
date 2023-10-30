import { useState } from 'react';
import styles from './ChessBoard.module.css';
import { Board } from './engine/src/board/Board';
import { BoardPosition } from './engine/src/board/BoardPosition';
import { BoardSquare } from './engine/src/board/BoardSquare';
import { isColoredPieceContainer } from './engine/src/piece/ChessPiece';
import { PieceColor } from './engine/src/piece/PieceColor';
import { assertExhaustive } from './engine/src/utils/assert';
import { Square } from './Square';
import { Theme } from './theme';

export function flipBoardVertically(squares: BoardSquare[]): BoardSquare[] {
  return flipBoardHorizontally(squares).reverse();
}

export function flipBoardHorizontally(squares: BoardSquare[]): BoardSquare[] {
  let ix = 0;
  return [
    ...squares.slice(ix, ix += 8).reverse(),
    ...squares.slice(ix, ix += 8).reverse(),
    ...squares.slice(ix, ix += 8).reverse(),
    ...squares.slice(ix, ix += 8).reverse(),
    ...squares.slice(ix, ix += 8).reverse(),
    ...squares.slice(ix, ix += 8).reverse(),
    ...squares.slice(ix, ix += 8).reverse(),
    ...squares.slice(ix, ix += 8).reverse(),
  ];
}

export function flipBoardForColor(board: Board, color: PieceColor): BoardSquare[] {
  switch (color) {
    case PieceColor.White: return flipBoardVertically(Array.from(board));
    case PieceColor.Black: return flipBoardHorizontally(Array.from(board));
    default: return assertExhaustive(color);
  }
}

export type OnMoveHandler = (fromPos: BoardPosition, toPos: BoardPosition) => void;

export function ChessBoard(props: { board: Board, theme: Theme, playingAs: PieceColor, onMove: OnMoveHandler }) {
  const [selected, setSelected] = useState<BoardPosition | null>(null);
  const squares = flipBoardForColor(props.board, props.playingAs).map(s => (
    <Square
      key={s.pos.toString()}
      piece={s.piece}
      pos={s.pos}
      theme={props.theme}
      isSelected={!!selected && s.pos.isEqual(selected)}
      divProps={{
        onClick: () => {
          if (selected) {
            const lastSelectedPiece = props.board.getPieceFromPos(selected);
            if (isColoredPieceContainer(lastSelectedPiece) && lastSelectedPiece.coloredPiece.color === props.playingAs) {
              const targetPiece = props.board.getPieceFromPos(s.pos);
              if (!isColoredPieceContainer(targetPiece) || targetPiece.coloredPiece.color !== props.playingAs) {
                props.onMove(selected, s.pos);
                return;
              }
            }
          }
          setSelected(s.pos);
        },
      }}
    />));
  return (
    <div className={styles.chessboard}>
      {squares}
    </div>
  );
}
