import React, {
  useEffect,
  useState,
} from 'react';
import './App.css';
import { ChessBoard } from './ChessBoard';
import { BoardPosition } from './engine/src/board/BoardPosition';
import { RandomBot } from './engine/src/bots/RandomBot';
import { serialize } from './engine/src/fen/serialize';
import { Game } from './engine/src/game/Game';
import { resolveMoves } from './engine/src/move/PieceMoveMap';
import { isColoredPieceContainer } from './engine/src/piece/ChessPiece';
import {
  InverseColorMap,
  PieceColor,
} from './engine/src/piece/PieceColor';
import { GameStatus } from './engine/src/state/GameStatus';
import { DefaultTheme } from './theme';

function useForceRender() {
  const [, setTick] = useState(0);
  return () => setTick(tick => tick + 1);
}


function App() {
  const [game] = useState(new Game());
  const playerColor = PieceColor.White;
  const [bot] = useState(new RandomBot(InverseColorMap[playerColor], game));
  const [highlightedSquares, setHighlightedSquares] = useState<BoardPosition[]>([]);
  const forceRender = useForceRender();
  useEffect(() => {
    console.log('check if bots turn');
    if (game.gameState.activeColor !== playerColor) {
      console.log('bots turn');
      const moveResult = bot.handleTurn();
      if (moveResult.isOk()) {
        // TODO: handleTurn should return something useful for us to render
        forceRender();
      }
    }
  }, [game.gameState.activeColor]);
  return (
    <div className="App">
      <div>{GameStatus[game.gameState.gameStatus]}</div>
      <div>{serialize(game.gameState)}</div>
      <ChessBoard
        board={game.gameState.board}
        theme={DefaultTheme}
        playingAs={playerColor}
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
        onMove={(from, to) => {
          game.move(from, to);
          setHighlightedSquares([from, to]);
        }}
      />
    </div>
  );
}

export default App;
