import { HTMLProps } from 'react';
import { Square } from '../ChessBoard/Square';
import { Theme } from '../../theme';
import { BoardPosition } from '../../engine/src/board/BoardPosition';
import { from } from '../../engine/src/piece/ChessPiece';
import { PieceColor } from '../../engine/src/piece/PieceColor';
import { PieceType } from '../../engine/src/piece/PieceType';

import styles from './ChoosePromotionDialog.module.css';

export type OnPieceSelectedHandler = (pieceType: PieceType) => void;

export function ChoosePromotionDialog(
  props: {
    color: PieceColor,
    Theme: Theme,
    onPieceSelected: OnPieceSelectedHandler,
    divProps?: HTMLProps<HTMLDivElement>
  },
) {
  const pieces = Object.values(PieceType).filter(p => p !== PieceType.Pawn && p !== PieceType.King);
  const coloredPieces = pieces.map((pieceType, ix) => (
    <Square
      key={pieceType}
      piece={from(props.color, pieceType)}
      pos={BoardPosition.fromString(`a${ix+1}`)}
      theme={props.Theme}
      showLabels={false}
      divProps={{
        ...props.divProps,
        onClick: () => {
          props.onPieceSelected(pieceType);
        },
      }}
    />
  ));
  return (
    <div className={styles.dialog} {...props.divProps}>
      <h1>Choose promotion</h1>
      {coloredPieces}
    </div>
  );
}
