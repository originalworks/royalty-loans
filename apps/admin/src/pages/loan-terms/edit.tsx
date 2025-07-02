import { Edit } from '@refinedev/mui';
import { Box, TextField } from '@mui/material';
import { useForm } from '@refinedev/react-hook-form';

export const LoanTermEdit = () => {
  const {
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
    </Edit>
  );
};
