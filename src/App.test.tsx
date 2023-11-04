import React from 'react';
import { render, screen } from '@testing-library/react';
import App from './App';
import { WhiteKing } from './engine/src/piece/ChessPiece';
import { Option } from './engine/src/utils/Option';
import { chessPieceToUnicode } from './engine/src/utils/print/unicode';

test('renders chessboard', () => {
  render(<App />);
  const linkElement = screen.getByText(chessPieceToUnicode(Option.Some(WhiteKing)));
  expect(linkElement).toBeInTheDocument();
});
