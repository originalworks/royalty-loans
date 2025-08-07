import { watchChainId } from 'wagmi/actions';
import React, { useContext, useEffect } from 'react';
import { useConfig, useChains, useDisconnect, useAccount } from 'wagmi';

import Stack from '@mui/material/Stack';
import AppBar from '@mui/material/AppBar';
import Avatar from '@mui/material/Avatar';
import Toolbar from '@mui/material/Toolbar';
import { useGetIdentity } from '@refinedev/core';
import IconButton from '@mui/material/IconButton';
import Typography from '@mui/material/Typography';
import DarkModeOutlined from '@mui/icons-material/DarkModeOutlined';
import LightModeOutlined from '@mui/icons-material/LightModeOutlined';
import { HamburgerMenu, RefineThemedLayoutV2HeaderProps } from '@refinedev/mui';

import { ColorModeContext } from '../../contexts/color-mode';
import { ConnectButton } from '../connect-button';
import { EnvironmentToggle } from '../env-toggle';

type IUser = {
  id: number;
  name: string;
  avatar: string;
};

export const Header: React.FC<RefineThemedLayoutV2HeaderProps> = ({
  sticky = true,
}) => {
  const config = useConfig();
  const chains = useChains();
  const { disconnect } = useDisconnect();
  const { isConnected, chainId } = useAccount();
  const { mode, setMode } = useContext(ColorModeContext);

  const { data: user } = useGetIdentity<IUser>();

  watchChainId(config, {
    // eslint-disable-next-line @typescript-eslint/no-empty-function
    onChange() {},
  });

  useEffect(() => {
    if (isConnected && chains.findIndex((chain) => chain.id === chainId) < 0)
      disconnect();
  }, [chainId, chains, isConnected, disconnect]);

  return (
    <AppBar position={sticky ? 'sticky' : 'relative'}>
      <Toolbar>
        <Stack
          direction="row"
          width="100%"
          justifyContent="flex-end"
          alignItems="center"
        >
          <HamburgerMenu />
          <Stack
            direction="row"
            width="100%"
            justifyContent="flex-end"
            alignItems="center"
            gap={2}
          >
            <EnvironmentToggle mode={mode} />
            <IconButton
              color="inherit"
              onClick={() => {
                setMode();
              }}
            >
              {mode === 'dark' ? <LightModeOutlined /> : <DarkModeOutlined />}
            </IconButton>

            {(user?.avatar || user?.name) && (
              <Stack
                direction="row"
                gap="16px"
                alignItems="center"
                justifyContent="center"
              >
                {user?.name && (
                  <Typography
                    sx={{
                      display: {
                        xs: 'none',
                        sm: 'inline-block',
                      },
                    }}
                    variant="subtitle2"
                  >
                    {user?.name}
                  </Typography>
                )}
                <Avatar src={user?.avatar} alt={user?.name} />
              </Stack>
            )}

            <ConnectButton />
          </Stack>
        </Stack>
      </Toolbar>
    </AppBar>
  );
};
