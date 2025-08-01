import { Test, TestingModule } from '@nestjs/testing';
import { CanActivate, INestApplication, ValidationPipe } from '@nestjs/common';
import request from 'supertest';
import { TypeOrmModule } from '@nestjs/typeorm';
import { Factory, getFactory } from '../../tests/factory';
import { DataSource, Repository } from 'typeorm';
import { LoanTerm } from './loanTerms.entity';
import { dbConfigs } from '../config/dbConfig';
import { LoanTermsModule } from './loanTerms.module';
import { Auth0Guard } from '../auth/auth.guard';
import { AuthModule } from '../auth/auth.module';
import { clearDatabase } from '../../tests/typeorm.utils';
import { ConfigModule } from '@nestjs/config';

describe('AppController', () => {
  let factory: Factory;
  let app: INestApplication;
  let dataSource: DataSource;
  let loanTermsRepo: Repository<LoanTerm>;

  beforeAll(async () => {
    const guardMock: CanActivate = { canActivate: jest.fn(() => true) };
    const module: TestingModule = await Test.createTestingModule({
      imports: [
        ConfigModule.forRoot({ isGlobal: true }),
        TypeOrmModule.forRoot(dbConfigs.test),
        LoanTermsModule,
        AuthModule,
      ],
    })
      .overrideGuard(Auth0Guard)
      .useValue(guardMock)
      .compile();

    dataSource = module.get(DataSource);
    factory = getFactory(dataSource);
    loanTermsRepo = dataSource.getRepository(LoanTerm);
    app = module.createNestApplication();

    app.useGlobalPipes(
      new ValidationPipe({
        whitelist: true,
        forbidNonWhitelisted: true,
      }),
    );

    await app.init();
  });

  beforeEach(async () => {
    await clearDatabase(dataSource);
    await factory.createMany<LoanTerm>(LoanTerm.name, 10);
  });

  afterAll(async () => {
    await clearDatabase(dataSource);
    await app.close();
  });

  describe('Loan Terms Controller', () => {
    it('GetOne', async () => {
      await request(app.getHttpServer()).get('/loan-terms/1').expect(200);
    });
    it('GetMany', async () => {
      await request(app.getHttpServer()).get('/loan-terms').expect(200);
    });
    it('CreateOne', async () => {
      const address = '0x388C818cA8b9251b393131C08a736a67ccb19297'; // Mixed Case
      const res = await request(app.getHttpServer())
        .post('/loan-terms/')
        .set('Content-Type', 'application/json')
        .send({
          collateralTokenAddress: address,
          feePercentagePpm: '1000',
          maxLoanAmount: '1000',
          ratio: '1',
          chainId: '1',
        })
        .expect(201);

      expect(res.body.collateralTokenAddress).toEqual(address.toLowerCase());
    });
    it('UpdateOne', async () => {
      const address = '0x388C818cA8b9251b393131C08a736a67ccb19297';
      const res = await request(app.getHttpServer())
        .patch('/loan-terms/1')
        .set('Content-Type', 'application/json')
        .send({
          collateralTokenAddress: address,
          feePercentagePpm: '1000',
          maxLoanAmount: '1000',
          ratio: '1',
          chainId: '1',
        })
        .expect(200);

      expect(res.body.collateralTokenAddress).toEqual(address.toLowerCase());
    });
    it('DeleteOne', async () => {
      await request(app.getHttpServer()).delete('/loan-terms/1').expect(200);
    });

    it('GetOneByCollateralTokenAddress', async () => {
      const entry = await loanTermsRepo.findOneBy({ id: 5 });
      const res = await request(app.getHttpServer())
        .get(
          `/loan-terms/collateral/${entry?.collateralTokenAddress.toUpperCase()}`,
        )
        .expect(200);

      expect(res.body.id).toEqual(5);
    });
  });
});
