import React, {
  HTMLProps,
  useEffect,
  useState,
} from 'react';
import { GameStatus } from '../../engine/src/state/GameStatus';
import { useThemeContext } from '../../theme/ThemeContext';
import styles from './styles.module.css';
import { Board } from '../../engine/src/board/Board';
import { BoardPosition } from '../../engine/src/board/BoardPosition';
import { BoardSquare } from '../../engine/src/board/BoardSquare';
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

export type ChessBoardProps = {
  id?: string,
  beforeBoard?: React.ReactNode,
  afterBoard?: React.ReactNode,
  gameStatus?: GameStatus,
  activeColor?: PieceColor,
  board: Board,
  playingAs: PieceColor,
  highlightedSquares: BoardPosition[],
  onSquareClick: OnSquareClickHandler,
  allowPlayingBoth?: boolean,
  onMove: OnMoveHandler,
  divProps?: HTMLProps<HTMLDivElement>,
  chessBoardSquareProps?: Partial<ChessBoardSquareProps>,
};

export function ChessBoard(props: ChessBoardProps) {
  const { theme } = useThemeContext();
  const [selected, setSelected] = useState<BoardPosition | null>(null);

  useEffect(() => {
    setSelected(null);
  }, [props.board]);

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
            if (lastSelectedPiece.isSome() && (props.allowPlayingBoth || lastSelectedPiece.value.color === props.playingAs)) {
              const targetPiece = props.board.getPieceFromPos(s.pos);
              if (!targetPiece.isSome() || targetPiece.value.color !== lastSelectedPiece.value.color) {
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
  const classNames = [
    // TODO: randomly generate
    `id_${props.id ?? 'default'}`,
    styles.chessboard,
  ];
  if (props.activeColor) {
    classNames.push(props.activeColor);
  }
  if (props.gameStatus) {
    classNames.push(props.gameStatus);
  }
  const isCheck = props.gameStatus === GameStatus.Check || props.gameStatus === GameStatus.Checkmate;
  const checkGlowStyles = (
    // TODO: handle custom sizes
    <style>
      {`
        .id_${props.id}.check .${props.activeColor}.king, .id_${props.id}.checkmate .${props.activeColor}.king {
          text-shadow: 0 0 2rem ${theme.CheckHighlightColor}, 0 0 2rem ${theme.CheckHighlightColor};
        }
      `}
    </style>
  );
  return (
    <>
      {props.beforeBoard}
      <div className={classNames.join(' ')} {...divProps}>
        {isCheck ? checkGlowStyles : null}
        {squares}
      </div>
      {props.afterBoard}
    </>
  );
}
