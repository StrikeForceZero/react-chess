import React, { HTMLProps } from 'react';
import { ChessPiece } from '../../engine/src/piece/ChessPiece';
import { Option } from '../../engine/src/utils/Option';
import { chessPieceToUnicode } from '../../engine/src/utils/print/unicode';

function getPieceAndColor(piece: ChessPiece): string[] {
  return [piece.color, piece.pieceType];
}

function ChessBoardPieceComponent(
  props: {
    piece: ChessPiece,
    spanProps?: HTMLProps<HTMLSpanElement>,
  },
) {
  return (
    <span {...props.spanProps} className={getPieceAndColor(props.piece).join(' ')}>
      {chessPieceToUnicode(Option.Some(props.piece))}
    </span>
  )
}

export const ChessBoardPiece = React.memo(ChessBoardPieceComponent);
