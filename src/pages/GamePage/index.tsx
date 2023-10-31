import React, {
  MutableRefObject,
  useCallback,
  useEffect,
  useRef,
  useState,
} from 'react';
import { ChessBoard } from '../../components/ChessBoard';
import { ChoosePromotionDialog } from '../../components/ChoosePromotionDialog';
import {
  CustomizableSelect,
  SimpleOptions,
} from '../../components/CustomizableSelect';
import {
  PlayerType,
  PlayerTypeSelector,
} from '../../components/PlayerTypeSelector';
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
import { assertExhaustive } from '../../engine/src/utils/assert';
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

const useBot = (botColor: PieceColor): AbstractBot => {
  const [bot, setBot] = useState<AbstractBot>(new RandomBot(botColor));

  useEffect(() => {
    console.log('reload bot');
    setBot(new RandomBot(botColor));
  }, [botColor]);

  return bot;
};

function useExternallyMutableRef<T>(value: T): MutableRefObject<T> {
  const ref = useRef(value);
  useEffect(() => {
    ref.current = value;
  }, [value]);
  return ref;
}

function resolveMainPlayerColor(whitePlayerType: PlayerType, blackPlayerType: PlayerType): PieceColor {
  if (whitePlayerType === PlayerType.Human) {
    return PieceColor.White;
  }
  if (blackPlayerType === PlayerType.Human) {
    return PieceColor.Black;
  }
  return PieceColor.White;
}

export function GamePage() {
  const game = useGameInitialization();
  // TODO: this only used so the bots will automatically start moving when the game state has been reset
  // previously they would only resume if the active color changed
  // this might even cause side effects and needs investigation
  const currentGame = game.current;
  const whiteBot = useBot(PieceColor.White);
  const blackBot = useBot(InverseColorMap[whiteBot.playAsColor]);

  const [whitePlayerType, setWhitePlayerType] = useState(PlayerType.Human);
  const [blackPlayerType, setBlackPlayerType] = useState(PlayerType.Bot);
  const [botDelayMs, setBotDelayMs] = useState(0);
  const [highlightedSquares, setHighlightedSquares] = useState<BoardPosition[]>([]);
  const [promotionFromTo, setPromotionFromTo] = useState<[BoardPosition, BoardPosition] | null>(null);
  const [currentFenString, setCurrentFenString] = useState(serialize(game.current.gameState));
  const [customFenString, setCustomFenString] = useState<string>(currentFenString);

  // TODO: hack - is there a better way to ensure we have the latest version of currentFenStringRef?
  const currentFenStringRef = useExternallyMutableRef(currentFenString);

  const windowLocationHashAssignmentDebounceTimeoutRef = useRef<NodeJS.Timeout | null>(null);
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

    // Debounce the assignment of window.location.hash
    if (windowLocationHashAssignmentDebounceTimeoutRef.current) {
      clearTimeout(windowLocationHashAssignmentDebounceTimeoutRef.current);
    }

    windowLocationHashAssignmentDebounceTimeoutRef.current = setTimeout(() => {
      window.location.hash = encodeURIComponent(fenString);
    }, 300)
  }, [
    currentFenStringRef,
    game,
  ]);
  // Cleanup on unmount
  useEffect(() => {
    return () => {
      if (windowLocationHashAssignmentDebounceTimeoutRef.current) {
        clearTimeout(windowLocationHashAssignmentDebounceTimeoutRef.current);
      }
    };
  }, []);

  // TODO: might not be needed
  useEffect(() => {
    updateFen('game change', serialize(game.current.gameState))
  }, [game, updateFen]);

  const handleBotMove = useCallback((bot: AbstractBot) => {
    console.log(`${bot.playAsColor} bot preparing move: `, serialize(game.current.gameState));
    const timeoutId = setTimeout(() => {
      if (isGameOver(game.current.gameState) || game.current.gameState.activeColor !== bot.playAsColor) {
        console.warn('no longer bots turn');
        return;
      }
      const moveResult = bot.handleTurn(game.current);
      if (moveResult.isOk()) {
        const move = moveResult.unwrap();
        setHighlightedSquares([move.fromPos, move.toPos]);
        updateFen(`${bot.playAsColor} bot after handleTurn`);
      }
    }, botDelayMs)
    return () => clearTimeout(timeoutId);
  }, [game, updateFen, botDelayMs]);

  useEffect(() => {
    if (isGameOver(currentGame.gameState)) {
      return;
    }
    let cancelBotMove = () => {};
    if (whitePlayerType === PlayerType.Bot && currentGame.gameState.activeColor === whiteBot.playAsColor) {
      cancelBotMove = handleBotMove(whiteBot);
    }
    if (blackPlayerType === PlayerType.Bot && currentGame.gameState.activeColor === blackBot.playAsColor) {
      cancelBotMove = handleBotMove(blackBot);
    }
    return () => cancelBotMove();
  }, [whiteBot, blackBot, currentGame, currentGame.gameState.activeColor, whitePlayerType, blackPlayerType, handleBotMove]);

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

  const [mainPlayerColor, setMainPlayerColor] = useState(PieceColor.White)
  useEffect(() => {
    setMainPlayerColor(resolveMainPlayerColor(whitePlayerType, blackPlayerType));
  }, [whitePlayerType, blackPlayerType]);

  const isInGameOverState = isGameOver(game.current.gameState);
  const winningColor = game.current.gameState.gameStatus === GameStatus.Checkmate ? InverseColorMap[game.current.gameState.activeColor] : null;
  const winningColorText = winningColor ? ` ${winningColor} Wins!` : null;

  const resetGame = useCallback(() => {
    updateFen('reset button', StandardStartPositionFEN, false);
    game.current = new Game();
  }, [game, updateFen]);

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

  const handlePlayerTypeChange = useCallback((color: PieceColor, playerType: PlayerType) => {
    switch (color) {
      case PieceColor.White:
        setWhitePlayerType(playerType);
        break;
      case PieceColor.Black:
        setBlackPlayerType(playerType);
        break;
      default: return assertExhaustive(color);
    }
  }, []);

  const handlePlayerTypeChangeWhite = useCallback((playerType: PlayerType) => {
    handlePlayerTypeChange(PieceColor.White, playerType);
  }, [handlePlayerTypeChange]);

  const handlePlayerTypeChangeBlack = useCallback((playerType: PlayerType) => {
    handlePlayerTypeChange(PieceColor.Black, playerType);
  }, [handlePlayerTypeChange]);

  const handleBotDelayMsChange = useCallback((botDelay: number) => {
    setBotDelayMs(botDelay);
  }, []);

  return (
    <div className="App">
      <PlayerTypeSelector id={'player_type_white'} label={'White Player Type: '} onPlayerTypeChange={handlePlayerTypeChangeWhite} value={whitePlayerType} />
      <PlayerTypeSelector id={'player_type_black'} label={'Black Player Type: '} onPlayerTypeChange={handlePlayerTypeChangeBlack} value={blackPlayerType} />
      <CustomizableSelect id={'bot_delay_ms'} label={'Bot Move Delay MS'} options={SimpleOptions([0, 100, 500, 1000])} defaultValue={botDelayMs} value={botDelayMs} onSelectedValueChange={handleBotDelayMsChange} />
      <button onClick={resetGame}>Reset Game</button>
      <div>{GameStatus[game.current.gameState.gameStatus]}{winningColorText}</div>
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
        playingAs={mainPlayerColor}
        allowPlayingBoth={[whitePlayerType, blackPlayerType].every(t => t === PlayerType.Human)}
        highlightedSquares={highlightedSquares}
        onSquareClick={handleSquareClick}
        onMove={handleMove}
      />
      <ChoosePromotionDialog
        color={PieceColor.White}
        onPieceSelected={handlePromotionChoice}
        divProps={{ hidden: game.current.gameState.activeColor !== PieceColor.White || promotionFromTo === null }}
      />
      <ChoosePromotionDialog
        color={PieceColor.Black}
        onPieceSelected={handlePromotionChoice}
        divProps={{ hidden: game.current.gameState.activeColor !== PieceColor.Black || promotionFromTo === null }}
      />
    </div>
  );
}
