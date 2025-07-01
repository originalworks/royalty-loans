import { MigrationInterface, QueryRunner } from 'typeorm';

export class InitialMigration1751379607529 implements MigrationInterface {
  name = 'InitialMigration1751379607529';

  public async up(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(`
            CREATE TABLE "LoanTerms" (
                "id" SERIAL NOT NULL,
                "collateralTokenAddress" character varying NOT NULL,
                "feePercentagePpm" bigint NOT NULL,
                "maxLoanAmount" bigint NOT NULL,
                "ratio" numeric(5, 2) NOT NULL,
                "createdAt" TIMESTAMP NOT NULL DEFAULT now(),
                "updatedAt" TIMESTAMP NOT NULL DEFAULT now(),
                CONSTRAINT "PK_de5d46c7031dc3dd3eec9821f13" PRIMARY KEY ("id")
            )
        `);
  }

  public async down(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(`
            DROP TABLE "LoanTerms"
        `);
  }
}
