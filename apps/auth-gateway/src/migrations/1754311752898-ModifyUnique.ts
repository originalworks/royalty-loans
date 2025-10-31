import { MigrationInterface, QueryRunner } from 'typeorm';

export class ModifyUnique1754311752898 implements MigrationInterface {
  name = 'ModifyUnique1754311752898';

  public async up(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(`
            ALTER TABLE "LoanTerms" DROP CONSTRAINT "UQ_8b493e938aaa6c50fb96f5a66fb"
        `);

    await queryRunner.query(`
            ALTER TABLE "LoanTerms"
            ADD CONSTRAINT "collateralTokenAddress_chainId" UNIQUE ("collateralTokenAddress", "chainId")
        `);
  }

  public async down(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(`
            ALTER TABLE "LoanTerms" DROP CONSTRAINT "collateralTokenAddress_chainId"
        `);

    await queryRunner.query(`
            ALTER TABLE "LoanTerms"
            ADD CONSTRAINT "UQ_8b493e938aaa6c50fb96f5a66fb" UNIQUE ("collateralTokenAddress")
        `);
  }
}
