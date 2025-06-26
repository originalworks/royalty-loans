import { Test, TestingModule } from '@nestjs/testing';
import { CanActivate, INestApplication, ValidationPipe } from '@nestjs/common';
import request from 'supertest';
import { TypeOrmModule } from '@nestjs/typeorm';
import { Factory, getFactory } from '../../tests/factory';
import { DataSource, Repository } from 'typeorm';
import { LoanTerm } from './loanTerms.entity';
import { testDbConfig } from '../config/dbConfig';
import { LoanTermsModule } from './loanTerms.module';
import { Auth0Guard } from '../auth/auth.guard';
import { clearDatabase } from '../../tests/typeorm.utils';

describe('AppController', () => {
  let factory: Factory;
  let app: INestApplication;
  let dataSource: DataSource;
  let loanTermsRepo: Repository<LoanTerm>;

  beforeAll(async () => {
    const guardMock: CanActivate = { canActivate: jest.fn(() => true) };
    const module: TestingModule = await Test.createTestingModule({
      imports: [TypeOrmModule.forRoot(testDbConfig()), LoanTermsModule],
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
        transform: true,
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
    it('Works', async () => {
      await request(app.getHttpServer()).get('/loan-terms').expect(200);
    });
  });
});
