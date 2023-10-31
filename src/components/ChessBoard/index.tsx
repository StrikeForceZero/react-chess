import {
  HTMLProps,
  useState,
} from 'react';
import styles from './styles.module.css';
import { Board } from '../../engine/src/board/Board';
import { BoardPosition } from '../../engine/src/board/BoardPosition';
import { BoardSquare } from '../../engine/src/board/BoardSquare';
import { resolveMoves } from '../../engine/src/move/PieceMoveMap';
import { isColoredPieceContainer } from '../../engine/src/piece/ChessPiece';
import { PieceColor } from '../../engine/src/piece/PieceColor';
import { assertExhaustive } from '../../engine/src/utils/assert';
import {
  ChessBoardSquare,
  ChessBoardSquareProps,
} from '../ChessBoardSquare';

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
export type OnSquareClickHandler = (pos: BoardPosition) => void;

export function ChessBoard(props: {
  board: Board,
  playingAs: PieceColor,
  highlightedSquares: BoardPosition[],
  onSquareClick: OnSquareClickHandler,
  allowPlayingBoth?: boolean,
  onMove: OnMoveHandler,
  divProps?: HTMLProps<HTMLDivElement>,
  chessBoardSquareProps?: Partial<ChessBoardSquareProps>,
}) {
  const [selected, setSelected] = useState<BoardPosition | null>(null);
  const squares = flipBoardForColor(props.board, props.playingAs).map(s => (
    <ChessBoardSquare
      key={s.pos.toString()}
      piece={s.piece}
      pos={s.pos}
      showLabels={true}
      isHighlighted={(!!selected && s.pos.isEqual(selected)) || props.highlightedSquares.map(String).includes(s.pos.toString())}
      {...props.chessBoardSquareProps}
      divProps={{
        onClick: () => {
          if (selected) {
            const lastSelectedPiece = props.board.getPieceFromPos(selected);
            if (isColoredPieceContainer(lastSelectedPiece) && (props.allowPlayingBoth || lastSelectedPiece.coloredPiece.color === props.playingAs)) {
              const targetPiece = props.board.getPieceFromPos(s.pos);
              if (!isColoredPieceContainer(targetPiece) || targetPiece.coloredPiece.color !== lastSelectedPiece.coloredPiece.color) {
                props.onMove(selected, s.pos);
                setSelected(s.pos);
                return;
              }
            }
          }
          setSelected(s.pos);
          props.onSquareClick(s.pos);
        },
        ...props.chessBoardSquareProps?.divProps,
      }}
    />));
  const divProps = {
    ...props.divProps,
    style: {
      width: '40rem',
      height: '40rem',
      ...props.divProps?.style,
    }
  }
  return (
    <div className={styles.chessboard} {...divProps}>
      {squares}
    </div>
  );
}
