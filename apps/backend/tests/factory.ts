import factory from 'factory-girl';
import { DataSource } from 'typeorm';
import { LoanTerm } from '../src/loanTerms/loanTerms.entity';
import { ethers } from 'ethers';

export type Factory = typeof factory;

//@ts-expect-error TsPlzLemmeGo
export let factoryCached: Factory = null;

export const zeroEthAddress = ethers.ZeroAddress;

export const randomEthAddress = () =>
  ethers.Wallet.createRandom().address.toLowerCase();

export const getFactory = (dataSource: DataSource) => {
  if (factoryCached === null) {
    factory.setAdapter(new CustomTypeORMAdapter(dataSource));
    factory.define('LoanTerm', LoanTerm, {
      id: factory.sequence((n) => n),
      collateralTokenAddress: randomEthAddress,
      feePercentagePpm: '1000',
      maxLoanAmount: ethers.parseUnits('10', 6).toString(),
      ratio: '1',
      chainId: '1',
      createdAt: new Date('2021-09-01T12:46:25.241Z'),
      updatedAt: new Date('2021-09-01T12:46:25.241Z'),
    });
    factoryCached = factory;
  }
  return factoryCached;
};

export class CustomTypeORMAdapter {
  dataSource: DataSource;

  constructor(dataSource: DataSource) {
    this.dataSource = dataSource;
  }

  build(Model, props) {
    const model = new Model();
    for (const [key, value] of Object.entries(props)) {
      model[key] = value;
    }
    return model;
  }

  //eslint-disable-next-line @typescript-eslint/no-unused-vars
  async save(model, _Model) {
    return this.dataSource.manager.save(model);
  }

  async destroy(model, Model) {
    const manager = this.dataSource.manager;
    const modelRepo = manager.getRepository(Model);
    const theModel = await modelRepo.findOneBy({ id: model.id });
    if (theModel) {
      return manager.transaction(async (tm) => {
        await tm.query('SET FOREIGN_KEY_CHECKS=0;');
        await tm.delete(Model, model.id);
        return tm.query('SET FOREIGN_KEY_CHECKS=1;');
      });
    }
  }

  //eslint-disable-next-line @typescript-eslint/no-unused-vars
  get(model, attr, _Model) {
    return model[attr];
  }

  //eslint-disable-next-line @typescript-eslint/no-unused-vars
  set(props, model, _Model) {
    Object.keys(props).forEach((key) => {
      model[key] = props[key];
    });
    return model;
  }
}
