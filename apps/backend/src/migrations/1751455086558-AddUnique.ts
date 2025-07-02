import { MigrationInterface, QueryRunner } from 'typeorm';

export class AddUnique1751455086558 implements MigrationInterface {
  name = 'AddUnique1751455086558';

  public async up(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(`
            ALTER TABLE "LoanTerms"
            ADD CONSTRAINT "UQ_8b493e938aaa6c50fb96f5a66fb" UNIQUE ("collateralTokenAddress")
        `);
  }

  public async down(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(`
            ALTER TABLE "LoanTerms" DROP CONSTRAINT "UQ_8b493e938aaa6c50fb96f5a66fb"
        `);
  }
}
