import { HTMLProps } from 'react';
import { ChessBoardSquare } from '../ChessBoardSquare';
import { BoardPosition } from '../../engine/src/board/BoardPosition';
import { from } from '../../engine/src/piece/ChessPiece';
import { PieceColor } from '../../engine/src/piece/PieceColor';
import { PieceType } from '../../engine/src/piece/PieceType';

import styles from './styles.module.css';

export type OnPieceSelectedHandler = (pieceType: PieceType) => void;

export function ChoosePromotionDialog(
  props: {
    color: PieceColor,
    onPieceSelected: OnPieceSelectedHandler,
    divProps?: HTMLProps<HTMLDivElement>
  },
) {
  const pieces = Object.values(PieceType).filter(p => p !== PieceType.Pawn && p !== PieceType.King);
  const coloredPieces = pieces.map((pieceType, ix) => (
    <ChessBoardSquare
      key={pieceType}
      piece={from(props.color, pieceType)}
      pos={BoardPosition.fromString(`a${ix+1}`)}
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
