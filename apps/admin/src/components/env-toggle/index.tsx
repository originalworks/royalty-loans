import React, { useEffect, useState } from 'react';
import { Box, Switch, Typography } from '@mui/material';
import { PROD_DOMAIN, STAGE_DOMAIN } from '../../config/config';

const ENV_DOMAINS = {
  prod: PROD_DOMAIN,
  stage: STAGE_DOMAIN,
};

export const EnvironmentToggle: React.FC = () => {
  const [isProd, setIsProd] = useState<boolean>(false);

  useEffect(() => {
    const currentHost = window.location.hostname;
    if (currentHost === ENV_DOMAINS.prod) {
      setIsProd(true);
    } else if (currentHost === ENV_DOMAINS.stage) {
      setIsProd(false);
    }
  }, []);

  const handleToggle = () => {
    const targetUrl = isProd
      ? window.location.href.replace(ENV_DOMAINS.prod, ENV_DOMAINS.stage)
      : window.location.href.replace(ENV_DOMAINS.stage, ENV_DOMAINS.prod);

    window.location.href = targetUrl;
  };

  return (
    <Box display="flex" alignItems="center" gap={1}>
      <Typography variant="body2" color={!isProd ? 'primary' : 'textSecondary'}>
        Stage
      </Typography>

      <Switch checked={isProd} onChange={handleToggle} color="primary" />

      <Typography variant="body2" color={isProd ? 'primary' : 'textSecondary'}>
        Prod
      </Typography>
    </Box>
  );
};
