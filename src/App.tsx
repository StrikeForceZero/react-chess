import React, {
  useEffect,
  useRef,
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
import { isGameOver } from './engine/src/state/utils/GameStatusUtils';
import { DefaultTheme } from './theme';

function useForceRender() {
  const [, setTick] = useState(0);
  return () => setTick(tick => tick + 1);
}


function App() {
  const game = useRef(new Game());
  const playerColor = PieceColor.White;
  const bot = useRef(new RandomBot(InverseColorMap[playerColor], game.current));
  const [highlightedSquares, setHighlightedSquares] = useState<BoardPosition[]>([]);
  const forceRender = useForceRender();
  useEffect(() => {
    if (isGameOver(game.current.gameState)) {
      return;
    }
    if (game.current.gameState.activeColor !== playerColor) {
      const moveResult = bot.current.handleTurn();
      if (moveResult.isOk()) {
        const move = moveResult.unwrap();
        setHighlightedSquares([move.fromPos, move.toPos]);
      }
      forceRender();
    }
  }, [game.current.gameState.activeColor]);
  return (
    <div className="App">
      <div>{GameStatus[game.current.gameState.gameStatus]}</div>
      <div>{serialize(game.current.gameState)}</div>
      <ChessBoard
        board={game.current.gameState.board}
        theme={DefaultTheme}
        playingAs={playerColor}
        highlightedSquares={highlightedSquares}
        onSquareClick={fromPos => {
          const movingPiece = game.current.gameState.board.getPieceFromPos(fromPos);
          if (!isColoredPieceContainer(movingPiece)){
            setHighlightedSquares([]);
            return;
          }
          const moves = resolveMoves(movingPiece.coloredPiece.pieceType, movingPiece.coloredPiece.color);
          const validMoves = moves.map(move => move.getValidMovesForPosition(game.current.gameState, fromPos));
          const allValidMoveTargetPositions = validMoves.flatMap(executableMoves => executableMoves.map(em => em.toPos));
          setHighlightedSquares(allValidMoveTargetPositions);
        }}
        onMove={(from, to) => {
          game.current.move(from, to);
          setHighlightedSquares([from, to]);
        }}
      />
    </div>
  );
}

export default App;
