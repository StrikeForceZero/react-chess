import React, { useState } from 'react';
import { Theme } from './Theme';
import { ThemeContext } from './ThemeContext';
import { DefaultTheme } from './Themes';

export type ThemeProviderProps = {
  children: React.ReactNode;
};

export const ThemeProvider: React.FC<ThemeProviderProps> = ({ children }) => {
  const [theme, setTheme] = useState<Theme>(DefaultTheme);

  return (
    <ThemeContext.Provider value={{ theme, setTheme }}>
      {children}
    </ThemeContext.Provider>
  );
};
