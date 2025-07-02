import React, { useContext } from 'react';

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

type IUser = {
  id: number;
  name: string;
  avatar: string;
};

export const Header: React.FC<RefineThemedLayoutV2HeaderProps> = ({
  sticky = true,
}) => {
  const { mode, setMode } = useContext(ColorModeContext);

  const { data: user } = useGetIdentity<IUser>();

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
