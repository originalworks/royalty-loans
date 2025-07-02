import React, { useContext } from 'react';
import { ConnectKitButton } from 'connectkit';

import { ColorModeContext } from '../../contexts/color-mode';

export const ConnectButton: React.FC = () => {
  const { mode } = useContext(ColorModeContext);

  return <ConnectKitButton theme="auto" mode={mode} />;
};
