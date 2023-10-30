import React, {
  useEffect,
  useRef,
  useState,
} from 'react';
import './App.css';
import { ChessBoard } from './ChessBoard';
import { BoardPosition } from './engine/src/board/BoardPosition';
import { RandomBot } from './engine/src/bots/RandomBot';
import { isFen } from './engine/src/fen/FENString';
import { serialize } from './engine/src/fen/serialize';
import { deserialize } from './engine/src/fen/deserializer';
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

  const currentFenString = serialize(game.current.gameState);
  useEffect(() => {
    // Define the event handler
    const handleHashChange = () => {
      const fenString = decodeURIComponent(window.location.hash).slice(1);
      if (!isFen(fenString)) {
        console.error(`invalid fen string!: ${fenString}`);
        return;
      }
      if (fenString === currentFenString) {
        return;
      }
      console.log('updated game from url fen: ', fenString);
      Object.assign(game.current.gameState, deserialize(fenString));
      // TODO: we could probably go back to having game and bot being state?
      forceRender();
    };

    // Attach the event handler
    window.addEventListener('hashchange', handleHashChange);

    // Clean up the event handler when the component unmounts
    return () => {
      window.removeEventListener('hashchange', handleHashChange);
    };
  }, [currentFenString]);
  window.location.hash = encodeURIComponent(currentFenString);
  return (
    <div className="App">
      <div>{GameStatus[game.current.gameState.gameStatus]}</div>
      <div>{currentFenString}</div>
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
