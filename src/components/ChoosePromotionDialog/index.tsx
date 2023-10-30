import { HTMLProps } from 'react';
import { ChessBoardPiece } from '../ChessBoardPiece';
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
    <ChessBoardPiece
      key={pieceType}
      piece={from(props.color, pieceType)}
      spanProps={{
        style: { fontSize: '5rem', cursor: 'pointer' },
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
