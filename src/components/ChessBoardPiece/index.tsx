import { HTMLProps } from 'react';
import { ChessPiece } from '../../engine/src/piece/ChessPiece';
import { chessPieceToUnicode } from '../../engine/src/utils/print/unicode';

export function ChessBoardPiece(
  props: {
    piece: ChessPiece,
    spanProps?: HTMLProps<HTMLSpanElement>,
  },
) {
  return (
    <span {...props.spanProps}>
      {chessPieceToUnicode(props.piece)}
    </span>
  )
}
