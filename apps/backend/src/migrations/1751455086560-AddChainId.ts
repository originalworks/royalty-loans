import { MigrationInterface, QueryRunner } from 'typeorm';

export class AddChainId1751455086560 implements MigrationInterface {
  name = 'AddChainId1751455086560';

  public async up(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(`
      ALTER TABLE "LoanTerms" ADD COLUMN "chainId" VARCHAR
    `);
    let chainId: string;

    switch (process.env.ENVIRONMENT) {
      case 'prod':
        chainId = '8453';
        break;
      case 'stage':
        chainId = '84532';
        break;
      default:
        chainId = '1';
        break;
    }

    await queryRunner.query(`
      UPDATE "LoanTerms" SET "chainId" = '${chainId}'
    `);

    await queryRunner.query(`
      ALTER TABLE "LoanTerms" ALTER COLUMN "chainId" SET NOT NULL
    `);
  }

  public async down(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(`
      ALTER TABLE "LoanTerms" DROP COLUMN "chainId"
    `);
  }
}
