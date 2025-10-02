import request from 'supertest';
import { DataSource, Repository } from 'typeorm';

import { ConfigModule } from '@nestjs/config';
import { TypeOrmModule } from '@nestjs/typeorm';
import { Test, TestingModule } from '@nestjs/testing';
import { CanActivate, ValidationPipe, INestApplication } from '@nestjs/common';

import {
  Factory,
  getFactory,
  zeroEthAddress,
  randomEthAddress,
} from '../../tests/factory';
import { clearDatabase } from '../../tests/typeorm.utils';
import { dbConfigs } from '../config/dbConfig';
import { Auth0Guard } from '../auth/auth.guard';
import { AuthModule } from '../auth/auth.module';
import { LoanTerm } from './loanTerms.entity';
import { LoanTermsModule } from './loanTerms.module';
import { GetLoanTermsByCollateralAddressesBodyDto } from './loanTerms.dto';

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

    it('getLoanTermByCollateralAddress - happy path', async () => {
      const entry = await loanTermsRepo.findOneBy({ id: 5 });
      const entryOnDifferentChain = await factory.create<LoanTerm>(
        LoanTerm.name,
        {
          collateralTokenAddress: entry?.collateralTokenAddress,
          chainId: '2',
        },
      );
      let res = await request(app.getHttpServer())
        .get(
          `/loan-terms/collateral/${entry?.collateralTokenAddress.toUpperCase()}/${entry?.chainId}`,
        )
        .expect(200);

      expect(res.body.id).toEqual(5);

      res = await request(app.getHttpServer())
        .get(
          `/loan-terms/collateral/${entry?.collateralTokenAddress.toUpperCase()}/${entryOnDifferentChain.chainId}`,
        )
        .expect(200);

      expect(res.body.id).toEqual(entryOnDifferentChain.id);
    });

    it('getLoanTermByCollateralAddress - catch error', async () => {
      const res = await request(app.getHttpServer())
        .get(`/loan-terms/collateral/${zeroEthAddress}/2`)
        .expect(404);

      expect(res.text).toEqual(
        '{"criteria":{"collateralTokenAddress":"0x0000000000000000000000000000000000000000","chainId":"2"},"message":"Could not find any entity of type \\"LoanTerm\\" matching: {\\n    \\"collateralTokenAddress\\": \\"0x0000000000000000000000000000000000000000\\",\\n    \\"chainId\\": \\"2\\"\\n}"}',
      );
    });

    it('getLoanTermsByCollateralAddresses - happy path - all addresses have loan terms', async () => {
      const firstEntry = await loanTermsRepo.findOneBy({ id: 1 });
      const secondEntry = await loanTermsRepo.findOneBy({ id: 2 });
      const dto: GetLoanTermsByCollateralAddressesBodyDto = {
        chainId: '1',
        tokenAddresses: [
          firstEntry?.collateralTokenAddress || '',
          secondEntry?.collateralTokenAddress || '',
        ],
      };

      const res = await request(app.getHttpServer())
        .post('/loan-terms/collaterals')
        .send(dto)
        .expect(200);

      expect(res.body.length).toEqual(2);
      expect(res.body[0].id).toEqual(1);
      expect(res.body[1].id).toEqual(2);
    });

    it('getLoanTermsByCollateralAddresses - happy path - only one address has loan terms', async () => {
      const entry = await loanTermsRepo.findOneBy({ id: 2 });
      const dto: GetLoanTermsByCollateralAddressesBodyDto = {
        chainId: '1',
        tokenAddresses: [
          randomEthAddress(),
          entry?.collateralTokenAddress || '',
        ],
      };

      const res = await request(app.getHttpServer())
        .post('/loan-terms/collaterals')
        .send(dto)
        .expect(200);

      expect(res.body.length).toEqual(1);
      expect(res.body[0].id).toEqual(2);
    });

    it('getLoanTermsByCollateralAddresses - none of the addresses have loan terms', async () => {
      const dto: GetLoanTermsByCollateralAddressesBodyDto = {
        chainId: '2',
        tokenAddresses: [randomEthAddress(), randomEthAddress()],
      };

      const res = await request(app.getHttpServer())
        .post('/loan-terms/collaterals')
        .send(dto)
        .expect(200);

      expect(res.body.length).toEqual(0);
    });

    it('getLoanTermsByCollateralAddresses - catch error - wrong params', async () => {
      const res = await request(app.getHttpServer())
        .post('/loan-terms/collaterals')
        .send({})
        .expect(400);

      expect(res.body).toEqual({
        error: 'Bad Request',
        message: [
          'chainId must be a numeric string',
          'chainId must be a string',
          'each value in tokenAddresses must be a string',
          'tokenAddresses must be an array',
        ],
        statusCode: 400,
      });
    });
  });
});
