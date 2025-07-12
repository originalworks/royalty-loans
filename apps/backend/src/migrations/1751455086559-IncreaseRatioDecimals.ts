import { MigrationInterface, QueryRunner } from 'typeorm';

export class IncreaseRatioDecimals1751455086559 implements MigrationInterface {
  name = 'IncreaseRatioDecimals1751455086559';

  public async up(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(`
      ALTER TABLE "LoanTerms"
      ALTER COLUMN "ratio" TYPE decimal(7,4);
    `);
  }

  public async down(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(`
      ALTER TABLE "LoanTerms"
      ALTER COLUMN "ratio" TYPE decimal(5,2);
    `);
  }
}
