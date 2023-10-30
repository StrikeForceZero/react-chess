import { HTMLProps } from 'react';
import { toIndex as boardFileToIndex } from '../../../engine/src/board/BoardFile';
import { toIndex as boardRankToIndex } from '../../../engine/src/board/BoardRank';
import { ChessPiece } from '../../../engine/src/piece/ChessPiece';
import { chessPieceToUnicode } from '../../../engine/src/utils/print/unicode';
import { Theme } from '../../../theme';
import { BoardPosition } from '../../../engine/src/board/BoardPosition';
import styles from './Square.module.css';

export function Square(props: {
  piece: ChessPiece,
  pos: BoardPosition,
  theme: Theme,
  isHighlighted?: boolean,
  // TODO: default to true
  showLabels: boolean,
  divProps?: HTMLProps<HTMLDivElement>
}) {
  let backgroundColor = (
    boardFileToIndex(props.pos.file) + boardRankToIndex(props.pos.rank)
  ) % 2 === 0 ? props.theme.LightSquareColor : props.theme.DarkSquareColor;
  if (props.isHighlighted) {
    backgroundColor = props.theme.HighlightSquareColor;
  }

  return (
    <div className={styles.square} style={{backgroundColor}} {...props.divProps}><span className={styles.square_label} hidden={!props.showLabels}>{props.pos.toString()}</span>{chessPieceToUnicode(props.piece)}</div>
  );
}
