import { useAccount, useChains } from 'wagmi';
import { Controller } from 'react-hook-form';

import { Create } from '@refinedev/mui';
import { useForm } from '@refinedev/react-hook-form';
import { Autocomplete, Box, TextField } from '@mui/material';

export const LoanTermCreate = () => {
  const { isConnected, chainId } = useAccount();
  const chains = useChains();

  const {
    control,
    register,
    setValue,
    formState: { errors },
    refineCore: { formLoading },
    saveButtonProps,
  } = useForm({});

  const defaultChain =
    isConnected &&
    !!chainId &&
    chains.findIndex((chain) => chain.id === chainId) >= 0
      ? chainId.toString()
      : chains[0].id.toString();

  return (
    <Create isLoading={formLoading} saveButtonProps={saveButtonProps}>
      <Box
        component="form"
        sx={{ display: 'flex', flexDirection: 'column' }}
        autoComplete="off"
      >
        <TextField
          {...register('collateralTokenAddress', {
            required: 'This field is required',
            pattern: {
              value: /^0x[a-fA-F0-9]{40}$/,
              message: 'Invalid Token Address',
            },
          })}
          error={!!(errors as any)?.collateralTokenAddress}
          helperText={(errors as any)?.collateralTokenAddress?.message}
          margin="normal"
          fullWidth
          slotProps={{
            inputLabel: { shrink: true },
          }}
          type="text"
          label={'Collateral Token Address'}
          name="collateralTokenAddress"
          onChange={(event) =>
            setValue('collateralTokenAddress', event.target.value.toLowerCase())
          }
        />

        <Controller
          control={control}
          name="chainId"
          rules={{ required: 'This field is required' }}
          defaultValue={defaultChain}
          render={({ field }) => (
            <Autocomplete
              id="chainId"
              {...field}
              options={chains.map((chain) => chain.id.toString())}
              onChange={(_, value) => field.onChange(value)}
              getOptionLabel={(item) =>
                chains.find((chain) => chain.id.toString() === item)?.name || ''
              }
              isOptionEqualToValue={(option, value) =>
                value === undefined || option?.toString() === value?.toString()
              }
              renderInput={(params) => (
                <TextField
                  {...params}
                  label="Network"
                  margin="normal"
                  variant="outlined"
                  fullWidth
                  error={!!(errors as any)?.chainId}
                  helperText={(errors as any)?.chainId?.message}
                  slotProps={{
                    inputLabel: { shrink: true },
                  }}
                />
              )}
            />
          )}
        />

        <TextField
          {...register('feePercentagePpm', {
            required: 'This field is required',
            min: {
              value: 1,
              message: 'Invalid field',
            },
          })}
          error={!!(errors as any)?.feePercentagePpm}
          helperText={(errors as any)?.feePercentagePpm?.message}
          margin="normal"
          fullWidth
          slotProps={{
            inputLabel: { shrink: true },
          }}
          type="number"
          label={'Fee Percentage Ppm (1% = 10000)'}
          name="feePercentagePpm"
        />

        <TextField
          {...register('maxLoanAmount', {
            required: 'This field is required',
            min: {
              value: 1,
              message: 'Invalid field',
            },
          })}
          error={!!(errors as any)?.maxLoanAmount}
          helperText={(errors as any)?.maxLoanAmount?.message}
          margin="normal"
          fullWidth
          slotProps={{
            inputLabel: { shrink: true },
          }}
          type="number"
          label={'Max Loan Amount'}
          name="maxLoanAmount"
        />

        <TextField
          {...register('ratio', {
            required: 'This field is required',
            min: {
              value: 0.0001,
              message: 'Invalid field',
            },
            setValueAs: (value) => value.toString(),
          })}
          error={!!(errors as any)?.ratio}
          helperText={(errors as any)?.ratio?.message}
          margin="normal"
          fullWidth
          slotProps={{
            inputLabel: { shrink: true },
          }}
          type="number"
          label={'Ratio'}
          name="ratio"
        />
      </Box>
    </Create>
  );
};
