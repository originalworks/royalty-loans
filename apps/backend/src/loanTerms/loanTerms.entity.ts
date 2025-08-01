import {
  Column,
  CreateDateColumn,
  Entity,
  PrimaryGeneratedColumn,
  UpdateDateColumn,
} from 'typeorm';

export const bigintTransformer = {
  to: (value: string | number | bigint): string => value.toString(),
  from: (value: string): string => value,
};

@Entity({ name: 'LoanTerms' })
export class LoanTerm {
  @PrimaryGeneratedColumn()
  id: number;

  @Column({ nullable: false, unique: true })
  collateralTokenAddress: string;

  @Column({ type: 'bigint', nullable: false, transformer: bigintTransformer })
  feePercentagePpm: string;

  @Column({ type: 'bigint', nullable: false, transformer: bigintTransformer })
  maxLoanAmount: string;

  @Column('decimal', { precision: 10, scale: 4 })
  ratio: string;

  @Column({ nullable: false })
  chainId: string;

  @CreateDateColumn()
  createdAt: Date;

  @UpdateDateColumn()
  updatedAt: Date;
}
