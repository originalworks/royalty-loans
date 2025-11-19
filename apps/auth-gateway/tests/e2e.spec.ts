/// <reference types="jest" />

import { INestApplication, ValidationPipe } from '@nestjs/common';
import { ConfigModule } from '@nestjs/config';
import { Test, TestingModule } from '@nestjs/testing';
import { SignatureModule } from '../src/signature/signature.module';
import { BlockchainService } from '../src/blockchain/blockchain.service';
import { ANVIL_CHAIN_ID, ANVIL_RPC_URL, fixture } from './fixture';
import request from 'supertest';
import { Signer, ZeroAddress } from 'ethers';
import {
  EIP712_DELEGATED_AUTH_TYPES,
  EIP712_DOMAIN,
  EIP712_SHAREHOLDER_AUTH_TYPES,
} from '../src/signature/signature.const';
import { MULTICALL3_ADDRESS } from './multicall';

const getRpcUrlMock = jest.fn().mockReturnValue(ANVIL_RPC_URL);

describe('Signature controller', () => {
  let app: INestApplication;
  let fix: Awaited<ReturnType<typeof fixture>>;

  beforeAll(async () => {
    const module: TestingModule = await Test.createTestingModule({
      imports: [ConfigModule.forRoot({ isGlobal: true }), SignatureModule],
    }).compile();

    const blockchainService = module.get(BlockchainService);
    blockchainService.getRpcUrl = getRpcUrlMock;

    app = module.createNestApplication();

    app.useGlobalPipes(
      new ValidationPipe({
        whitelist: true,
        forbidNonWhitelisted: true,
      }),
    );

    await app.init();

    fix = await fixture();
  });

  afterAll(async () => {
    await app.close();
  });

  describe('Signature Controller', () => {
    describe('shareholder/template', () => {
      it('returns template', async () => {
        const res = await request(app.getHttpServer()).get(
          '/payment-details/shareholder/template',
        );

        expect(res.body).toEqual({
          domain: {
            name: 'OWAuthGateway',
            version: '1',
          },
          types: {
            ShareholderAuth: [
              { name: 'shareholder', type: 'address' },
              { name: 'issuedAt', type: 'uint256' },
              { name: 'chainId', type: 'uint256' },
            ],
          },
          message: {
            shareholder: ZeroAddress,
            issuedAt: 0,
            chainId: '0',
          },
        });
      });
    });
    describe('shareholder', () => {
      const createShareholderPayload = async ({
        issuedAt,
        chainId,
        shareholder,
        assets,
        signer,
      }: {
        signer: Signer;
        assets: string[];
        issuedAt: number;
        chainId: string;
        shareholder?: string;
      }) => {
        const message = {
          shareholder: shareholder ?? (await signer.getAddress()),
          issuedAt,
          chainId,
        };
        const signature = await signer.signTypedData(
          EIP712_DOMAIN,
          EIP712_SHAREHOLDER_AUTH_TYPES,
          message,
        );

        return {
          signature,
          message,
          assets,
        };
      };
      it('rejects on malformed signature', async () => {
        const payload = await createShareholderPayload({
          chainId: ANVIL_CHAIN_ID,
          issuedAt: Date.now(),
          signer: fix.wallets.shareholder1,
          assets: [await fix.agreements.agreement1.getAddress()],
        });

        const res = await request(app.getHttpServer())
          .post('/payment-details/shareholder')
          .send({ ...payload, signature: '0x1234' })
          .expect(401);

        expect(res.text).toEqual(
          '{"message":"Signature malformed","error":"Unauthorized","statusCode":401}',
        );
      });

      it('rejects on wrong shareholder', async () => {
        const payload = await createShareholderPayload({
          chainId: ANVIL_CHAIN_ID,
          issuedAt: Date.now(),
          signer: fix.wallets.shareholder1,
          shareholder: await fix.wallets.shareholder2.getAddress(),
          assets: [await fix.agreements.agreement1.getAddress()],
        });

        const res = await request(app.getHttpServer())
          .post('/payment-details/shareholder')
          .send(payload)
          .expect(401);

        expect(res.text).toEqual(
          '{"message":"Signature does not match claimed address","error":"Unauthorized","statusCode":401}',
        );
      });

      it('rejects on unsupported chain', async () => {
        const payload = await createShareholderPayload({
          chainId: '1',
          issuedAt: Date.now(),
          signer: fix.wallets.shareholder1,
          assets: [await fix.agreements.agreement1.getAddress()],
        });

        const res = await request(app.getHttpServer())
          .post('/payment-details/shareholder')
          .send(payload)
          .expect(403);

        expect(res.text).toEqual(
          '{"message":"Unsupported chain: 1","error":"Forbidden","statusCode":403}',
        );
      });

      it('rejects on invalid issuedAt', async () => {
        let payload = await createShareholderPayload({
          chainId: ANVIL_CHAIN_ID,
          issuedAt: Date.now() - 60 * 60 * 24 * 1000 - 1000,
          signer: fix.wallets.shareholder1,
          assets: [await fix.agreements.agreement1.getAddress()],
        });

        let res = await request(app.getHttpServer())
          .post('/payment-details/shareholder')
          .send(payload)
          .expect(401);

        expect(res.text).toEqual(
          '{"message":"Signature expired","error":"Unauthorized","statusCode":401}',
        );

        payload = await createShareholderPayload({
          chainId: ANVIL_CHAIN_ID,
          issuedAt: Date.now() + 60 * 60 * 24 * 1000 + 1000,
          signer: fix.wallets.shareholder1,
          assets: [await fix.agreements.agreement1.getAddress()],
        });

        res = await request(app.getHttpServer())
          .post('/payment-details/shareholder')
          .send(payload)
          .expect(401);

        expect(res.text).toEqual(
          '{"message":"Signature expired","error":"Unauthorized","statusCode":401}',
        );
      });

      it('rejects when asset is not a contract or invalid contract', async () => {
        let payload = await createShareholderPayload({
          chainId: ANVIL_CHAIN_ID,
          issuedAt: Date.now(),
          signer: fix.wallets.shareholder1,
          assets: [await fix.agreements.agreement1.getAddress(), ZeroAddress],
        });

        let res = await request(app.getHttpServer())
          .post('/payment-details/shareholder')
          .send(payload)
          .expect(404);

        expect(res.text).toEqual(
          `{"message":"Failed to query contract at ${ZeroAddress}","error":"Not Found","statusCode":404}`,
        );

        payload = await createShareholderPayload({
          chainId: ANVIL_CHAIN_ID,
          issuedAt: Date.now(),
          signer: fix.wallets.shareholder1,
          assets: [
            await fix.agreements.agreement1.getAddress(),
            MULTICALL3_ADDRESS,
          ],
        });

        res = await request(app.getHttpServer())
          .post('/payment-details/shareholder')
          .send(payload)
          .expect(404);

        expect(res.text).toEqual(
          `{"message":"Failed to query contract at ${MULTICALL3_ADDRESS}","error":"Not Found","statusCode":404}`,
        );
      });

      it('rejects when at least one asset is unowned', async () => {
        const payload = await createShareholderPayload({
          chainId: ANVIL_CHAIN_ID,
          issuedAt: Date.now(),
          signer: fix.wallets.shareholder1,
          assets: [
            await fix.agreements.agreement1.getAddress(),
            await fix.agreements.agreement2.getAddress(),
          ],
        });

        const res = await request(app.getHttpServer())
          .post('/payment-details/shareholder')
          .send(payload)
          .expect(401);

        expect(res.text).toEqual(
          `{"message":"Address 0x70997970C51812dc3A010C7d01b50e0d17dc79C8 has no shares in assets on chain 84532","unownedTokens":["${await fix.agreements.agreement2.getAddress()}"]}`,
        );
      });

      it('returns response', async () => {
        const payload = await createShareholderPayload({
          chainId: ANVIL_CHAIN_ID,
          issuedAt: Date.now(),
          signer: fix.wallets.shareholder1,
          assets: [await fix.agreements.agreement1.getAddress()],
        });

        await request(app.getHttpServer())
          .post('/payment-details/shareholder')
          .send(payload)
          .expect(200);
      });
    });
    describe('delegated/template', () => {
      it('returns template', async () => {
        const res = await request(app.getHttpServer()).get(
          '/payment-details/delegated/template',
        );

        expect(res.body).toEqual({
          domain: {
            name: 'OWAuthGateway',
            version: '1',
          },
          types: {
            DelegatedAuth: [
              { name: 'shareholder', type: 'address' },
              { name: 'delegate', type: 'address' },
              { name: 'chainId', type: 'uint256' },
              { name: 'assets', type: 'address[]' },
              { name: 'startDate', type: 'uint256' },
              { name: 'endDate', type: 'uint256' },
            ],
          },
          message: {
            shareholder: '0x0000000000000000000000000000000000000000',
            delegate: '0x0000000000000000000000000000000000000000',
            assets: ['0x0000000000000000000000000000000000000000'],
            chainId: '0',
            startDate: 0,
            endDate: 0,
          },
        });
      });
    });
    describe('delegated', () => {
      const createDelegatedPayload = async ({
        startDate,
        endDate,
        chainId,
        shareholder,
        assets,
        signer,
        delegate,
      }: {
        signer: Signer;
        assets: string[];
        chainId: string;
        startDate: number;
        endDate: number;
        delegate: string;
        shareholder?: string;
      }) => {
        const message = {
          shareholder: shareholder ?? (await signer.getAddress()),
          delegate,
          chainId,
          assets,
          startDate,
          endDate,
        };
        const signature = await signer.signTypedData(
          EIP712_DOMAIN,
          EIP712_DELEGATED_AUTH_TYPES,
          message,
        );

        return {
          shareholderSignature: signature,
          shareholderMessage: message,
          assets,
        };
      };

      it('rejects on malformed delegate signature', async () => {
        const { shareholderMessage, shareholderSignature } =
          await createDelegatedPayload({
            signer: fix.wallets.shareholder1,
            delegate: await fix.wallets.external.getAddress(),
            chainId: ANVIL_CHAIN_ID,
            assets: [await fix.agreements.agreement1.getAddress()],
            startDate: 0,
            endDate: 0,
          });

        const res = await request(app.getHttpServer())
          .post('/payment-details/delegated')
          .send({
            shareholderMessage,
            shareholderSignature,
            delegateSignature: '0x1234',
          })
          .expect(401);

        expect(res.text).toEqual(
          '{"message":"Delegate signature malformed","error":"Unauthorized","statusCode":401}',
        );
      });

      it('rejects on invalid delegate signature address', async () => {
        const { shareholderMessage, shareholderSignature } =
          await createDelegatedPayload({
            signer: fix.wallets.shareholder1,
            delegate: await fix.wallets.external.getAddress(),
            chainId: ANVIL_CHAIN_ID,
            assets: [await fix.agreements.agreement1.getAddress()],
            startDate: 0,
            endDate: 0,
          });

        const delegateSignature =
          await fix.wallets.shareholder2.signMessage(shareholderSignature);

        const res = await request(app.getHttpServer())
          .post('/payment-details/delegated')
          .send({
            shareholderMessage,
            shareholderSignature,
            delegateSignature,
          })
          .expect(401);

        expect(res.text).toEqual(
          '{"message":"Delegate signature does not match delegate address from shareholder message","error":"Unauthorized","statusCode":401}',
        );
      });

      it('rejects on malformed shareholder signature', async () => {
        const { shareholderMessage } = await createDelegatedPayload({
          signer: fix.wallets.shareholder1,
          delegate: await fix.wallets.external.getAddress(),
          chainId: ANVIL_CHAIN_ID,
          assets: [await fix.agreements.agreement1.getAddress()],
          startDate: 0,
          endDate: 0,
        });

        const shareholderSignature = '0x1234';
        const delegateSignature =
          await fix.wallets.external.signMessage(shareholderSignature);

        const res = await request(app.getHttpServer())
          .post('/payment-details/delegated')
          .send({
            shareholderMessage,
            shareholderSignature,
            delegateSignature,
          })
          .expect(401);

        expect(res.text).toEqual(
          '{"message":"Shareholder signature malformed","error":"Unauthorized","statusCode":401}',
        );
      });

      it('rejects on wrong shareholder signature address', async () => {
        const { shareholderMessage, shareholderSignature } =
          await createDelegatedPayload({
            signer: fix.wallets.shareholder1,
            shareholder: await fix.wallets.shareholder2.getAddress(),
            delegate: await fix.wallets.external.getAddress(),
            chainId: ANVIL_CHAIN_ID,
            assets: [await fix.agreements.agreement1.getAddress()],
            startDate: 0,
            endDate: 0,
          });

        const delegateSignature =
          await fix.wallets.external.signMessage(shareholderSignature);

        const res = await request(app.getHttpServer())
          .post('/payment-details/delegated')
          .send({
            shareholderMessage,
            shareholderSignature,
            delegateSignature,
          })
          .expect(401);

        expect(res.text).toEqual(
          '{"message":"Shareholder signature does not match shareholder address from shareholder message","error":"Unauthorized","statusCode":401}',
        );
      });

      it('rejects on unsupported chain', async () => {
        const { shareholderMessage, shareholderSignature } =
          await createDelegatedPayload({
            signer: fix.wallets.shareholder1,
            delegate: await fix.wallets.external.getAddress(),
            chainId: '1',
            assets: [await fix.agreements.agreement1.getAddress()],
            startDate: 0,
            endDate: 0,
          });

        const delegateSignature =
          await fix.wallets.external.signMessage(shareholderSignature);

        const res = await request(app.getHttpServer())
          .post('/payment-details/delegated')
          .send({
            shareholderMessage,
            shareholderSignature,
            delegateSignature,
          })
          .expect(403);

        expect(res.text).toEqual(
          '{"message":"Unsupported chain: 1","error":"Forbidden","statusCode":403}',
        );
      });

      it('rejects on unsupported chain', async () => {
        const { shareholderMessage, shareholderSignature } =
          await createDelegatedPayload({
            signer: fix.wallets.shareholder1,
            delegate: await fix.wallets.external.getAddress(),
            chainId: '1',
            assets: [await fix.agreements.agreement1.getAddress()],
            startDate: 0,
            endDate: 0,
          });

        const delegateSignature =
          await fix.wallets.external.signMessage(shareholderSignature);

        const res = await request(app.getHttpServer())
          .post('/payment-details/delegated')
          .send({
            shareholderMessage,
            shareholderSignature,
            delegateSignature,
          })
          .expect(403);

        expect(res.text).toEqual(
          '{"message":"Unsupported chain: 1","error":"Forbidden","statusCode":403}',
        );
      });

      it('rejects when asset is not a contract or invalid contract', async () => {
        let { shareholderMessage, shareholderSignature } =
          await createDelegatedPayload({
            signer: fix.wallets.shareholder1,
            delegate: await fix.wallets.external.getAddress(),
            chainId: ANVIL_CHAIN_ID,
            assets: [await fix.agreements.agreement1.getAddress(), ZeroAddress],
            startDate: 0,
            endDate: 0,
          });

        let delegateSignature =
          await fix.wallets.external.signMessage(shareholderSignature);

        let res = await request(app.getHttpServer())
          .post('/payment-details/delegated')
          .send({
            shareholderMessage,
            shareholderSignature,
            delegateSignature,
          })
          .expect(404);

        expect(res.text).toEqual(
          `{"message":"Failed to query contract at ${ZeroAddress}","error":"Not Found","statusCode":404}`,
        );

        ({ shareholderMessage, shareholderSignature } =
          await createDelegatedPayload({
            signer: fix.wallets.shareholder1,
            delegate: await fix.wallets.external.getAddress(),
            chainId: ANVIL_CHAIN_ID,
            assets: [
              await fix.agreements.agreement1.getAddress(),
              MULTICALL3_ADDRESS,
            ],
            startDate: 0,
            endDate: 0,
          }));

        delegateSignature =
          await fix.wallets.external.signMessage(shareholderSignature);

        res = await request(app.getHttpServer())
          .post('/payment-details/delegated')
          .send({
            shareholderMessage,
            shareholderSignature,
            delegateSignature,
          })
          .expect(404);

        expect(res.text).toEqual(
          `{"message":"Failed to query contract at ${MULTICALL3_ADDRESS}","error":"Not Found","statusCode":404}`,
        );
      });

      it('rejects when at least one asset is unowned', async () => {
        const { shareholderMessage, shareholderSignature } =
          await createDelegatedPayload({
            signer: fix.wallets.shareholder1,
            delegate: await fix.wallets.external.getAddress(),
            chainId: ANVIL_CHAIN_ID,
            assets: [
              await fix.agreements.agreement1.getAddress(),
              await fix.agreements.agreement2.getAddress(),
            ],
            startDate: 0,
            endDate: 0,
          });

        const delegateSignature =
          await fix.wallets.external.signMessage(shareholderSignature);

        const res = await request(app.getHttpServer())
          .post('/payment-details/delegated')
          .send({
            shareholderMessage,
            shareholderSignature,
            delegateSignature,
          })
          .expect(401);

        expect(res.text).toEqual(
          `{"message":"Address 0x70997970C51812dc3A010C7d01b50e0d17dc79C8 has no shares in assets on chain 84532","unownedTokens":["${await fix.agreements.agreement2.getAddress()}"]}`,
        );
      });

      it('returns response', async () => {
        const { shareholderMessage, shareholderSignature } =
          await createDelegatedPayload({
            signer: fix.wallets.shareholder1,
            delegate: await fix.wallets.external.getAddress(),
            chainId: ANVIL_CHAIN_ID,
            assets: [await fix.agreements.agreement1.getAddress()],
            startDate: 0,
            endDate: 0,
          });

        const delegateSignature =
          await fix.wallets.external.signMessage(shareholderSignature);

        await request(app.getHttpServer())
          .post('/payment-details/delegated')
          .send({
            shareholderMessage,
            shareholderSignature,
            delegateSignature,
          })
          .expect(200);
      });
      // TODO: Missing startDate & endDate tests
    });
  });
});
