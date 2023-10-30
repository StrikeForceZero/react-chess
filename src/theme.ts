import { Color } from './types';

export type Theme = {
  DarkSquareColor: Color,
  LightSquareColor: Color,
  HighlightSquareColor: Color,
  White: Color,
  Black: Color,
}

export const DefaultTheme: Theme = {
  DarkSquareColor: '#769656',
  LightSquareColor: '#EEEED2',
  HighlightSquareColor: '#BACA44',
  White: '#FFF',
  Black: '#000',
};
