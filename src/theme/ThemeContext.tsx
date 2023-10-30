import React, { useContext } from 'react';
import { Theme } from './Theme';

export type ThemeContextType = {
  theme: Theme;
  setTheme: React.Dispatch<React.SetStateAction<Theme>>;
};

export const ThemeContext = React.createContext<ThemeContextType | undefined>(undefined);

export const useThemeContext = () => {
  const themeContext = useContext(ThemeContext);
  if (!themeContext) {
    throw new Error("Component must be wrapped within a ThemeProvider");
  }
  return themeContext;
}
