import React, { useState } from 'react';
import './App.css';
import { ChessBoard } from './ChessBoard';
import { Game } from './engine/src/game/Game';
import { PieceColor } from './engine/src/piece/PieceColor';
import { DefaultTheme } from './theme';

function App() {
  const [game] = useState(new Game());
  return (
    <div className="App">
      <ChessBoard board={game.gameState.board} theme={DefaultTheme} playingAs={PieceColor.White} onMove={(from, to) => game.move(from, to)} />
    </div>
  );
}

export default App;
