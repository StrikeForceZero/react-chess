import React, {
  useEffect,
  useRef,
  useState,
} from 'react';
import './App.css';
import { ChessBoard } from './ChessBoard';
import { ChoosePromotionDialog } from './ChoosePromotionDialog';
import { BoardPosition } from './engine/src/board/BoardPosition';
import { RandomBot } from './engine/src/bots/RandomBot';
import {
  isFen,
  StandardStartPositionFEN,
} from './engine/src/fen/FENString';
import { serialize } from './engine/src/fen/serialize';
import { deserialize } from './engine/src/fen/deserializer';
import { Game } from './engine/src/game/Game';
import { resolveMoves } from './engine/src/move/PieceMoveMap';
import { isColoredPieceContainer } from './engine/src/piece/ChessPiece';
import {
  InverseColorMap,
  PieceColor,
} from './engine/src/piece/PieceColor';
import { PieceType } from './engine/src/piece/PieceType';
import { GameStatus } from './engine/src/state/GameStatus';
import { isGameOver } from './engine/src/state/utils/GameStatusUtils';
import { PromotionRequiredError } from './engine/src/utils/errors/PromotionRequiredError';
import { DefaultTheme } from './theme';

function useForceRender() {
  const [, setTick] = useState(0);
  return () => setTick(tick => tick + 1);
}

function App() {
  const game = useRef((() => {
    // TODO: maybe this whole thing should be a function that's shared with the handleHashChange
    const game = new Game();
    const fenString = decodeURIComponent(window.location.hash).slice(1);
    if (fenString.length === 0) {
      return game;
    }
    if (!isFen(fenString)) {
      console.error(`invalid fen string: ${fenString}`);
      return game;
    }
    Object.assign(game.gameState, deserialize(fenString, true));
    return game;
  })());
  const playerColor = PieceColor.White;
  const bot = useRef(new RandomBot(InverseColorMap[playerColor], game.current));
  const [highlightedSquares, setHighlightedSquares] = useState<BoardPosition[]>([]);
  const [promotionFromTo, setPromotionFromTo] = useState<[BoardPosition, BoardPosition] | null>(null);
  const [execMove] = useState(() => (from: BoardPosition, to: BoardPosition, promoteTo?: PieceType) => {
    const result = game.current.move(from, to, promoteTo);
    if (result.isErr()) {
      const err = result.unwrapErr();
      if (err instanceof PromotionRequiredError) {
        setPromotionFromTo([from, to]);
      } else {
        console.error(err);
      }
    } else {
      setPromotionFromTo(null);
      updateFen('player execMove');
    }
    setHighlightedSquares([from, to]);
  });
  const forceRender = useForceRender();

  const [currentFenString, setCurrentFenString] = useState(serialize(game.current.gameState));
  const [customFenString, setCustomFenString] = useState<string>(currentFenString);

  // TODO: hack?
  const currentFenStringRef = useRef(currentFenString); // useRef to keep track of the latest value
  useEffect(() => {
    currentFenStringRef.current = currentFenString; // Update the ref every time currentFenString changes
  }, [currentFenString]);

  function updateFen(context: string, fenString: string = serialize(game.current.gameState), allowLoading = false) {
    console.log(`[${context}] updating fen: ${fenString}`);
    if (!isFen(fenString)) {
      throw new Error(`invalid fen string! ${fenString}`);
    }
    // by not setting the current fen, we will let the location.hash update handler load the game state
    if (!allowLoading) {
      // TODO: hack?
      // make sure the reference is updated immediately so the window.location.hash update doesn't think it needs to overwrite the state
      currentFenStringRef.current = fenString;
      setCurrentFenString(fenString);
      setCustomFenString(fenString);
    } else {
      setHighlightedSquares([]);
    }
    setPromotionFromTo(null);
    window.location.hash = encodeURIComponent(fenString);
  }

  useEffect(() => {
    if (isGameOver(game.current.gameState)) {
      return;
    }
    if (game.current.gameState.activeColor !== playerColor) {
      const moveResult = bot.current.handleTurn();
      if (moveResult.isOk()) {
        const move = moveResult.unwrap();
        setHighlightedSquares([move.fromPos, move.toPos]);
        updateFen('bot after handleTurn');
      }
    }
  }, [game.current.gameState.activeColor]);

  useEffect(() => {
    // Define the event handler
    const handleHashChange = () => {
      const fenString = decodeURIComponent(window.location.hash).slice(1);
      if (!isFen(fenString)) {
        console.error(`invalid fen string!: ${fenString}`);
        return;
      }
      if (fenString === currentFenStringRef.current) {
        return;
      }
      console.log(`updated game from url fen: ${currentFenStringRef.current} -> ${fenString}`);
      updateFen('handleHashChange', fenString, false);
      Object.assign(game.current.gameState, deserialize(fenString, true));
      // TODO: we could probably go back to having game and bot being state?
      // forceRender();
    };

    // Attach the event handler
    window.addEventListener('hashchange', handleHashChange);

    // Clean up the event handler when the component unmounts
    return () => {
      window.removeEventListener('hashchange', handleHashChange);
    };
  }, []);

  const isInGameOverState = isGameOver(game.current.gameState);
  return (
    <div className="App">
      <button
        onClick={() => {
          updateFen('reset button', StandardStartPositionFEN, true);
        }}
      >
        Reset Game
      </button>
      <div>{GameStatus[game.current.gameState.gameStatus]}</div>
      <div hidden={isInGameOverState}>{game.current.gameState.activeColor} to play</div>
      <div>
        <input
          style={{ width: '30rem' }}
          value={customFenString}
          placeholder={StandardStartPositionFEN}
          onChange={e => setCustomFenString(e.currentTarget.value)}
          onKeyDown={e => {
            if (e.key === 'Enter') {
              updateFen('user input', e.currentTarget.value, true)
            }
          }}
        />
      </div>
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
        onMove={execMove}
      />
      <ChoosePromotionDialog
        color={playerColor}
        Theme={DefaultTheme}
        onPieceSelected={pieceType => {
          if (!promotionFromTo) {
            console.error('invalid state!')
            return;
          }
          execMove(...promotionFromTo, pieceType);
        }}
        divProps={{ hidden: promotionFromTo === null }}
      />
    </div>
  );
}

export default App;
