import React from 'react';

import { GridColumnMenu, GridColumnMenuProps } from '@mui/x-data-grid';

export const CustomColumnMenu: React.FC<GridColumnMenuProps> = (props) => {
  return (
    <GridColumnMenu
      {...props}
      slots={{
        // Hide `columnMenuColumnsItem`
        columnMenuColumnsItem: null,
      }}
    />
  );
};
