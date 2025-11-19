import { HDNodeWallet, JsonRpcProvider, Signer } from 'ethers';
import { deployMulticall } from './multicall';
import {
  AgreementERC1155Mock__factory,
  ERC1967Proxy__factory,
} from '@royalty-loans/contracts-loans';

const ANVIL_MNEMONIC =
  'test test test test test test test test test test test junk';
export const ANVIL_RPC_URL = 'http://anvil:8545';
export const ANVIL_CHAIN_ID = '84532';

export type SignerWithNonceControl = Signer & {
  setNonce: () => { nonce: number };
};

const createSignerWithNonceControl = async (
  signer: Signer,
): Promise<SignerWithNonceControl> => {
  const setNonce = await createNonceController(signer);

  (signer as SignerWithNonceControl).setNonce = setNonce;

  return signer as SignerWithNonceControl;
};

const createNonceController = async (signer: Signer) => {
  let currentNonce = await signer.getNonce('pending');

  const setNonce = () => {
    const txSettings = {
      nonce: currentNonce,
    };
    currentNonce++;
    return txSettings;
  };

  return setNonce;
};

const getSigners = async () => {
  const signers: SignerWithNonceControl[] = [];

  for (let i = 0; i < 10; i++) {
    const signer = HDNodeWallet.fromPhrase(
      ANVIL_MNEMONIC,
      undefined,
      `m/44'/60'/0'/0/${i}`,
    ).connect(new JsonRpcProvider(ANVIL_RPC_URL));

    const signerWithNonceControl = await createSignerWithNonceControl(signer);

    signers.push(signerWithNonceControl);
  }

  return signers;
};

export const fixture = async () => {
  const [deployer, shareholder1, shareholder2, external] = await getSigners();

  await deployMulticall(deployer);

  const ERC1155Impl = await new AgreementERC1155Mock__factory(deployer).deploy(
    deployer.setNonce(),
  );
  await ERC1155Impl.waitForDeployment();

  const ERC1155ImplAddress = await ERC1155Impl.getAddress();

  const deployERC1155 = async (uri: string, mintTo: string) => {
    const initData =
      AgreementERC1155Mock__factory.createInterface().encodeFunctionData(
        'initialize',
        [uri],
      );

    const proxy = await new ERC1967Proxy__factory(deployer).deploy(
      ERC1155ImplAddress,
      initData,
      deployer.setNonce(),
    );

    await proxy.waitForDeployment();

    const agreement = AgreementERC1155Mock__factory.connect(
      await proxy.getAddress(),
      deployer,
    );

    await (await agreement.mint(mintTo, 1n, 1000n, deployer.setNonce())).wait();

    return agreement;
  };

  const agreement1 = await deployERC1155(
    'abc',
    await shareholder1.getAddress(),
  );
  const agreement2 = await deployERC1155(
    'abc',
    await shareholder2.getAddress(),
  );

  return {
    wallets: {
      deployer,
      shareholder1,
      shareholder2,
      external,
    },
    deployERC1155,
    agreements: {
      agreement1,
      agreement2,
    },
  };
};
