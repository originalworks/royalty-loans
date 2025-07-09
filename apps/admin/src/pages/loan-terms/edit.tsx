import { Edit } from '@refinedev/mui';
import { Box, TextField } from '@mui/material';
import { useForm } from '@refinedev/react-hook-form';

export const LoanTermEdit = () => {
  const {
    setValue,
    saveButtonProps,
    register,
    formState: { errors },
  } = useForm({});

  return (
    <Edit saveButtonProps={saveButtonProps}>
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
    </Edit>
  );
};
