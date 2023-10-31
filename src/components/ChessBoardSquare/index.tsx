import { HTMLProps } from 'react';
import { toIndex as boardFileToIndex } from '../../engine/src/board/BoardFile';
import { toIndex as boardRankToIndex } from '../../engine/src/board/BoardRank';
import { ChessPiece } from '../../engine/src/piece/ChessPiece';
import { BoardPosition } from '../../engine/src/board/BoardPosition';
import { useThemeContext } from '../../theme/ThemeContext';
import { ChessBoardPiece } from '../ChessBoardPiece';
import styles from './styles.module.css';

export type ChessBoardSquareProps = {
  piece: ChessPiece,
  pos: BoardPosition,
  isHighlighted?: boolean,
  // TODO: default to true
  showLabels: boolean,
  divProps?: HTMLProps<HTMLDivElement>,
  spanProps?: HTMLProps<HTMLSpanElement>,
};

export function ChessBoardSquare(props: ChessBoardSquareProps) {
  const { theme } = useThemeContext();
  let backgroundColor = (
    boardFileToIndex(props.pos.file) + boardRankToIndex(props.pos.rank)
  ) % 2 === 0 ? theme.LightSquareColor : theme.DarkSquareColor;
  if (props.isHighlighted) {
    backgroundColor = theme.HighlightSquareColor;
  }

  return (
    <div
      className={styles.square}
      {...props.divProps}
      style={{
        width: '5rem',
        height: '5rem',
        fontSize: '5rem',
        backgroundColor,
        ...props.divProps?.style,
      }}
    >
      <span
        className={styles.square_label}
        hidden={!props.showLabels}
        {...props.spanProps}
        style={{
          fontSize: '1rem',
          ...props.spanProps?.style,
        }}
      >
        {props.pos.toString()}
      </span>
      <ChessBoardPiece piece={props.piece} />
    </div>
  );
}
