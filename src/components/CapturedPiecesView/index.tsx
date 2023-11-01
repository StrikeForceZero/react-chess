import {
  ChessPiece,
  isColoredPieceContainer,
} from '../../engine/src/piece/ChessPiece';
import { PieceColor } from '../../engine/src/piece/PieceColor';
import { ChessBoardPiece } from '../ChessBoardPiece';

export function CapturedPiecesView(
  props: {
    capturedPieces: ChessPiece[],
    filterByColor?: PieceColor,
  }
) {
  const pieces = props.capturedPieces.filter(p => {
    if (isColoredPieceContainer(p)) {
      return props.filterByColor && p.coloredPiece.color === props.filterByColor;
    }
    return false;
  }).map((p, ix) => (
    <ChessBoardPiece key={ix} piece={p} />
  ))
  return (
    <div>
      {pieces}
    </div>
  )
}
