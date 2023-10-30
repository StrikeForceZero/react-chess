import React, {
  MutableRefObject,
  useCallback,
  useEffect,
  useRef,
  useState,
} from 'react';
import { ChessBoard } from '../../components/ChessBoard';
import { ChoosePromotionDialog } from '../../components/ChoosePromotionDialog';
import { BoardPosition } from '../../engine/src/board/BoardPosition';
import { AbstractBot } from '../../engine/src/bots/AbstractBot';
import { RandomBot } from '../../engine/src/bots/RandomBot';
import { deserializerWithStatus } from '../../engine/src/fen/deserializerWithStatus';
import {
  isFen,
  StandardStartPositionFEN,
} from '../../engine/src/fen/FENString';
import { serialize } from '../../engine/src/fen/serialize';
import { Game } from '../../engine/src/game/Game';
import { resolveMoves } from '../../engine/src/move/PieceMoveMap';
import { isColoredPieceContainer } from '../../engine/src/piece/ChessPiece';
import {
  InverseColorMap,
  PieceColor,
} from '../../engine/src/piece/PieceColor';
import { PieceType } from '../../engine/src/piece/PieceType';
import { GameStatus } from '../../engine/src/state/GameStatus';
import { isGameOver } from '../../engine/src/state/utils/GameStatusUtils';
import { PromotionRequiredError } from '../../engine/src/utils/errors/PromotionRequiredError';

const useGameInitialization = (): MutableRefObject<Game> => {
  const game = useRef<Game>(new Game());

  useEffect(() => {
    const initializedGame = new Game();
    const fenString = decodeURIComponent(window.location.hash).slice(1);

    if (fenString.length === 0) {
      console.log('fen string not provided in url');
      // url does not have fen string
      // required for type narrowing FENString
    }
    else if (!isFen(fenString)) {
      console.error(`invalid fen string: ${fenString}`);
    }
    else {
      console.log(`loading fen string from url: ${fenString}`);
      Object.assign(initializedGame.gameState, deserializerWithStatus(fenString, true));
    }
    game.current = initializedGame;
  }, []);

  return game;
};

const useBot = (playerColor: PieceColor, game: Game): AbstractBot => {
  const [bot, setBot] = useState<AbstractBot>(new RandomBot(InverseColorMap[playerColor], game));

  useEffect(() => {
    console.log('reload bot');
    setBot(new RandomBot(InverseColorMap[playerColor], game));
  }, [playerColor, game]);

  return bot;
};

function useExternallyMutableRef<T>(value: T): MutableRefObject<T> {
  const ref = useRef(value);
  useEffect(() => {
    ref.current = value;
  }, [value]);
  return ref;
}

export function GamePage() {
  const game = useGameInitialization();
  const playerColor = PieceColor.White;
  const bot = useBot(playerColor, game.current);

  const [highlightedSquares, setHighlightedSquares] = useState<BoardPosition[]>([]);
  const [promotionFromTo, setPromotionFromTo] = useState<[BoardPosition, BoardPosition] | null>(null);
  const [currentFenString, setCurrentFenString] = useState(serialize(game.current.gameState));
  const [customFenString, setCustomFenString] = useState<string>(currentFenString);

  // TODO: hack - is there a better way to ensure we have the latest version of currentFenStringRef?
  const currentFenStringRef = useExternallyMutableRef(currentFenString);

  const updateFen = useCallback((context: string, fenString: string = serialize(game.current.gameState), allowLoading = false) => {
    console.log(`[${context}] updating fen: ${fenString}`);
    if (!isFen(fenString)) {
      throw new Error(`invalid fen string! ${fenString}`);
    }
    // by not setting the current fen, we will let the location.hash update handler load the game state
    if (!allowLoading) {
      // TODO: hack - is there a better way to ensure we have the latest version of currentFenStringRef?
      // make sure the reference is updated immediately so the window.location.hash update doesn't think it needs to overwrite the state
      currentFenStringRef.current = fenString;
      setCurrentFenString(fenString);
      setCustomFenString(fenString);
    } else {
      setHighlightedSquares([]);
    }
    setPromotionFromTo(null);
    window.location.hash = encodeURIComponent(fenString);
  }, [
    game,
  ]);

  useEffect(() => {
    if (isGameOver(game.current.gameState)) {
      return;
    }
    if (game.current.gameState.activeColor !== playerColor) {
      console.log('bot preparing move: ', serialize(game.current.gameState));
      const moveResult = bot.handleTurn();
      if (moveResult.isOk()) {
        const move = moveResult.unwrap();
        setHighlightedSquares([move.fromPos, move.toPos]);
        updateFen('bot after handleTurn');
      }
    }
  }, [game, bot, game.current.gameState.activeColor, playerColor, updateFen]);

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
      const loadedGameState = deserializerWithStatus(fenString, true);
      const loadedGame = new Game();
      Object.assign(loadedGame.gameState, loadedGameState);
      game.current = loadedGame;
    };

    // Attach the event handler
    window.addEventListener('hashchange', handleHashChange);

    // Clean up the event handler when the component unmounts
    return () => {
      window.removeEventListener('hashchange', handleHashChange);
    };
  }, [game, updateFen, currentFenStringRef]);

  const isInGameOverState = isGameOver(game.current.gameState);

  const resetGame = useCallback(() => {
    updateFen('reset button', StandardStartPositionFEN, true);
  }, [updateFen]);

  const handleInputChange = useCallback((e: React.ChangeEvent<HTMLInputElement>) => {
    setCustomFenString(e.currentTarget.value);
  }, []);

  const handleInputKeyDown = useCallback((e: React.KeyboardEvent<HTMLInputElement>) => {
    if (e.key === 'Enter') {
      updateFen('user input', e.currentTarget.value, true);
    }
  }, [updateFen]);

  const handleSquareClick = useCallback((fromPos: BoardPosition) => {
    const movingPiece = game.current.gameState.board.getPieceFromPos(fromPos);

    if (!isColoredPieceContainer(movingPiece)) {
      setHighlightedSquares([]);
      return;
    }

    const moves = resolveMoves(movingPiece.coloredPiece.pieceType, movingPiece.coloredPiece.color);
    const validMoves = moves.map(move => move.getValidMovesForPosition(game.current.gameState, fromPos));
    const allValidMoveTargetPositions = validMoves.flatMap(executableMoves => executableMoves.map(em => em.toPos));

    setHighlightedSquares(allValidMoveTargetPositions);
  }, [game]);

  const handleMove = useCallback((from: BoardPosition, to: BoardPosition, promoteTo?: PieceType) => {
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
  }, [
    game,
    updateFen,
  ]);

  const handlePromotionChoice = useCallback((pieceType: PieceType) => {
    if (!promotionFromTo) {
      console.error('invalid state!')
      return;
    }
    handleMove(...promotionFromTo, pieceType);
  }, [handleMove, promotionFromTo]);

  return (
    <div className="App">
      <button onClick={resetGame}>Reset Game</button>
      <div>{GameStatus[game.current.gameState.gameStatus]}</div>
      <div hidden={isInGameOverState}>{game.current.gameState.activeColor} to play</div>
      <div>
        <input
          style={{ width: '30rem' }}
          value={customFenString}
          placeholder={StandardStartPositionFEN}
          onChange={handleInputChange}
          onKeyDown={handleInputKeyDown}
        />
      </div>
      <ChessBoard
        board={game.current.gameState.board}
        playingAs={playerColor}
        highlightedSquares={highlightedSquares}
        onSquareClick={handleSquareClick}
        onMove={handleMove}
      />
      <ChoosePromotionDialog
        color={playerColor}
        onPieceSelected={handlePromotionChoice}
        divProps={{ hidden: promotionFromTo === null }}
      />
    </div>
  );
}
