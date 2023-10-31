import React, {
  HTMLProps,
  useState,
} from 'react';
import { BoardPosition } from '../../engine/src/board/BoardPosition';
import { deserialize } from '../../engine/src/fen/deserializer';
import { FENString } from '../../engine/src/fen/FENString';
import { PieceColor } from '../../engine/src/piece/PieceColor';
import { ChessBoard } from '../ChessBoard';

export function BoardHistoryView(
  props: {
    playingAsColor?: PieceColor,
    highlightedSquares?: BoardPosition[],
    fen: FENString,
    divProps?: HTMLProps<HTMLDivElement>,
  },
) {
  const [gameState] = useState(deserialize(props.fen));
  return (
    <div {...props.divProps}>
      <span>{props.fen}</span>
      <ChessBoard
        board={gameState.board}
        playingAs={props.playingAsColor ?? PieceColor.White}
        highlightedSquares={props.highlightedSquares ?? []}
        onSquareClick={() => {}}
        onMove={() => {}}
        divProps={{
          style: {
            width: '20rem',
            height: '20rem',
          },
        }}
        chessBoardSquareProps={{
          divProps: {
            style: {
              width: '2.5rem',
              height: '2.5rem',
              fontSize: '2.5rem',
            },
          },
          spanProps: {
            style: {
              fontSize: '.5rem',
            },
          },
        }}
      />
    </div>
  )
}
