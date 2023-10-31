import React, { HTMLProps } from 'react';
import {
  ChessPiece,
  isColoredPieceContainer,
} from '../../engine/src/piece/ChessPiece';
import { chessPieceToUnicode } from '../../engine/src/utils/print/unicode';

function getPieceAndColor(piece: ChessPiece): string[] {
  if (!isColoredPieceContainer(piece)) {
    return [];
  }
  return [piece.coloredPiece.color, piece.coloredPiece.pieceType];
}

function ChessBoardPieceComponent(
  props: {
    piece: ChessPiece,
    spanProps?: HTMLProps<HTMLSpanElement>,
  },
) {
  return (
    <span {...props.spanProps} className={getPieceAndColor(props.piece).join(' ')}>
      {chessPieceToUnicode(props.piece)}
    </span>
  )
}

export const ChessBoardPiece = React.memo(ChessBoardPieceComponent);
