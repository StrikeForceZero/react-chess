import React from 'react';
import { render, screen } from '@testing-library/react';
import App from './App';
import { WhiteKing } from './engine/src/piece/ChessPiece';
import { chessPieceToUnicode } from './engine/src/utils/print/unicode';

test('renders chessboard', () => {
  render(<App />);
  const linkElement = screen.getByText(chessPieceToUnicode(WhiteKing));
  expect(linkElement).toBeInTheDocument();
});
