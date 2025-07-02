import { Create } from '@refinedev/mui';
import { Box, TextField } from '@mui/material';
import { useForm } from '@refinedev/react-hook-form';

export const LoanTermCreate = () => {
  const {
    saveButtonProps,
    refineCore: { formLoading },
    register,
    formState: { errors },
  } = useForm({});

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
          label={'Fee Percentage Ppm'}
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
            valueAsNumber: true,
            min: {
              value: 0.01,
              message: 'Invalid field',
            },
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
