import React, { useState } from 'react';
import './App.css';
import { ChessBoard } from './ChessBoard';
import { BoardPosition } from './engine/src/board/BoardPosition';
import { Game } from './engine/src/game/Game';
import { resolveMoves } from './engine/src/move/PieceMoveMap';
import { isColoredPieceContainer } from './engine/src/piece/ChessPiece';
import { PieceColor } from './engine/src/piece/PieceColor';
import { DefaultTheme } from './theme';

function App() {
  const [game] = useState(new Game());
  const [highlightedSquares, setHighlightedSquares] = useState<BoardPosition[]>([]);
  return (
    <div className="App">
      <ChessBoard
        board={game.gameState.board}
        theme={DefaultTheme}
        playingAs={PieceColor.White}
        highlightedSquares={highlightedSquares}
        onSquareClick={fromPos => {
          const movingPiece = game.gameState.board.getPieceFromPos(fromPos);
          if (!isColoredPieceContainer(movingPiece)){
            setHighlightedSquares([]);
            return;
          }
          const moves = resolveMoves(movingPiece.coloredPiece.pieceType, movingPiece.coloredPiece.color);
          const validMoves = moves.map(move => move.getValidMovesForPosition(game.gameState, fromPos));
          const allValidMoveTargetPositions = validMoves.flatMap(executableMoves => executableMoves.map(em => em.toPos));
          setHighlightedSquares(allValidMoveTargetPositions);
        }}
        onMove={(from, to) => game.move(from, to)}
      />
    </div>
  );
}

export default App;
