import { HTMLProps } from 'react';
import { toIndex as boardFileToIndex } from '../../engine/src/board/BoardFile';
import { toIndex as boardRankToIndex } from '../../engine/src/board/BoardRank';
import { ChessPiece } from '../../engine/src/piece/ChessPiece';
import { BoardPosition } from '../../engine/src/board/BoardPosition';
import { useThemeContext } from '../../theme/ThemeContext';
import { ChessBoardPiece } from '../ChessBoardPiece';
import styles from './styles.module.css';

export function ChessBoardSquare(props: {
  piece: ChessPiece,
  pos: BoardPosition,
  isHighlighted?: boolean,
  // TODO: default to true
  showLabels: boolean,
  divProps?: HTMLProps<HTMLDivElement>
}) {
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
      style={{backgroundColor}}
      {...props.divProps}
    >
      <span
        className={styles.square_label}
        hidden={!props.showLabels}
      >
        {props.pos.toString()}
      </span>
      <ChessBoardPiece piece={props.piece} />
    </div>
  );
}
