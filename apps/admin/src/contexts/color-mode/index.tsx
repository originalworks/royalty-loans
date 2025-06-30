import React, {
  useState,
  useEffect,
  createContext,
  PropsWithChildren,
} from 'react';

import { RefineThemes } from '@refinedev/mui';
import { ThemeProvider } from '@mui/material/styles';

export type Mode = 'light' | 'dark';

type ColorModeContextType = {
  mode: Mode;
  setMode: () => void;
};

export const ColorModeContext = createContext<ColorModeContextType>(
  {} as ColorModeContextType,
);

export const ColorModeContextProvider: React.FC<PropsWithChildren<unknown>> = ({
  children,
}) => {
  const colorModeFromLocalStorage = localStorage.getItem('colorMode') as Mode;
  const isSystemPreferenceDark = window?.matchMedia(
    '(prefers-color-scheme: dark)',
  ).matches;

  const systemPreference: Mode = isSystemPreferenceDark ? 'dark' : 'light';
  const [mode, setMode] = useState(
    colorModeFromLocalStorage || systemPreference,
  );

  useEffect(() => {
    window.localStorage.setItem('colorMode', mode);
  }, [mode]);

  const setColorMode = () => {
    if (mode === 'light') {
      setMode('dark');
    } else {
      setMode('light');
    }
  };

  return (
    <ColorModeContext.Provider
      value={{
        setMode: setColorMode,
        mode,
      }}
    >
      <ThemeProvider
        // you can change the theme colors here. example: mode === "light" ? RefineThemes.Magenta : RefineThemes.MagentaDark
        theme={mode === 'light' ? RefineThemes.Blue : RefineThemes.BlueDark}
      >
        {children}
      </ThemeProvider>
    </ColorModeContext.Provider>
  );
};
