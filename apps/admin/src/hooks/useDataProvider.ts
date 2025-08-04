import { polygon } from 'wagmi/chains';
import { useEffect, useState } from 'react';
import { watchChainId } from 'wagmi/actions';
import { useChainId, useConfig } from 'wagmi';

import { useBack } from '@refinedev/core';

import { ENVIRONMENT } from '../config/config';

export const useDataProvider = (goBack = false) => {
  const back = useBack();
  const config = useConfig();
  const chainId = useChainId();

  const [dataProvider, setDataProvider] = useState<string>(
    ENVIRONMENT === 'PROD' && chainId === polygon.id
      ? 'graphQlPolygon'
      : 'graphQlBase',
  );

  const handleChangeDataProvider = (id: number) => {
    if (ENVIRONMENT === 'PROD' && id === polygon.id)
      setDataProvider('graphQlPolygon');
    else setDataProvider('graphQlBase');
  };

  useEffect(() => {
    handleChangeDataProvider(chainId);
  }, [chainId]);

  useEffect(() => {
    watchChainId(config, {
      onChange: async (_chainId) => {
        if (_chainId === chainId) return;

        handleChangeDataProvider(_chainId);
        if (goBack) back();
      },
    });
  }, [back, chainId, config, goBack]);

  return dataProvider;
};
