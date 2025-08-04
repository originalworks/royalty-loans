import { polygon } from 'wagmi/chains';
import { useEffect, useState } from 'react';
import { watchChainId } from 'wagmi/actions';
import { useChainId, useConfig } from 'wagmi';

import { useBack } from "@refinedev/core";

import { ENVIRONMENT } from '../config/config';

export const useDataProvider = (goBack = false) => {
  const back = useBack();
  const config = useConfig();
  const chainId = useChainId();

  const [dataProvider, setDataProvider] = useState<string>('graphQlBase');

  useEffect(() => {
    watchChainId(config, {
      onChange: async (_chainId) => {
        if (_chainId === chainId) return;

        if (ENVIRONMENT === 'PROD' && _chainId === polygon.id)
          setDataProvider('graphQlPolygon');
        else setDataProvider('graphQlBase');

        if (goBack) back();
      },
    });
  }, [back, chainId, config, goBack]);

  return dataProvider;
};
