import { Contract, providers, ethers } from 'ethers'
import {
  AgreementERC1155__factory,
  AgreementERC20__factory,
  AgreementFactory,
  AgreementFactory__factory,
  AgreementRelationsRegistry__factory,
  deployProxy,
  ERC20TokenMock__factory,
  FallbackVault__factory,
  FeeManager,
  FeeManager__factory,
  NamespaceRegistry__factory,
  SplitCurrencyListManager__factory,
} from '@original-works/contracts-agreements-typechain'
import { SignerWithAddress } from '@nomiclabs/hardhat-ethers/signers'
import { IHolder } from '@original-works/contracts-agreements-typechain/dist/typechain/contracts/agreements/AgreementERC1155'

export async function getEvent(
  txPromise: Promise<providers.TransactionResponse>,
  contract: Contract,
  eventName: string,
) {
  const tx = await txPromise
  const receipt = await contract.provider.getTransactionReceipt(tx.hash!)
  const eventFragment = contract.interface.getEvent(eventName)
  const topic = contract.interface.getEventTopic(eventFragment)
  const logs = receipt.logs!.filter((log) => log.topics.includes(topic))
  if (logs.length === 0) {
    throw Error(`Event ${eventName} was not emitted`)
  }
  return contract.interface.parseLog(logs[0])
}

export const deployTestTrackedToken = async (deployer: SignerWithAddress) => {
  // TrackedToken
  const trackedTokenFactory = new ERC20TokenMock__factory(deployer)
  const trackedTokenConsts = {
    name: 'TRACKED_TOKEN',
    symbol: 'USDC',
    decimals: 6,
    lendingCurrency: true,
    nativeCoin: false,
  }
  const trackedToken = await deployProxy(trackedTokenFactory, [
    trackedTokenConsts.name,
    trackedTokenConsts.symbol,
    trackedTokenConsts.decimals,
  ])
  await (
    await trackedToken.mintTo(
      deployer.address,
      ethers.utils.parseUnits('10000', trackedTokenConsts.decimals),
    )
  ).wait()
  return trackedToken
}

export const initialDeployment = async (deployer: SignerWithAddress) => {
  const agreementERC20 = await new AgreementERC20__factory(deployer).deploy()

  const agreementERC1155 = await new AgreementERC1155__factory(
    deployer,
  ).deploy()

  // // TrackedToken
  const trackedToken = await deployTestTrackedToken(deployer)

  // Fee Manager
  const feeManagerFactory = new FeeManager__factory(deployer)
  const feeManager = await deployProxy(feeManagerFactory, [
    ethers.utils.parseEther('0.01'),
    ethers.utils.parseEther('0.02'),
  ])

  const agreementRelationsRegistry =
    await new AgreementRelationsRegistry__factory(deployer).deploy()

  // SplitCurrency
  const splitCurrencyListManagerFactory = new SplitCurrencyListManager__factory(
    deployer,
  )
  const splitCurrencyListManager = await deployProxy(
    splitCurrencyListManagerFactory,
    [[], trackedToken.address],
  )

  // FallbackVault
  const fallbackVaultFactory = new FallbackVault__factory(deployer)
  const fallbackVault = await deployProxy(fallbackVaultFactory, [])

  // NamespaceRegistry
  const namespaceRegistryFactory = new NamespaceRegistry__factory(deployer)
  const namespaceRegistry = await deployProxy(namespaceRegistryFactory, [])

  const agreementFactoryFactory = new AgreementFactory__factory(deployer)
  const agreementFactory = await deployProxy(agreementFactoryFactory, [
    agreementERC20.address,
    agreementERC1155.address,
    feeManager.address,
    agreementRelationsRegistry.address,
    splitCurrencyListManager.address,
    fallbackVault.address,
    namespaceRegistry.address,
  ])

  return {
    agreementERC20,
    agreementERC1155,
    trackedToken,
    feeManager,
    agreementRelationsRegistry,
    splitCurrencyListManager,
    fallbackVault,
    namespaceRegistry,
    agreementFactory,
  }
}

export const createERC1155 = async (
  deployer: SignerWithAddress,
  holders: IHolder.HolderStruct[],
  agreementFactory: AgreementFactory,
  feeManager: FeeManager,
) => {
  const randomIPFUri = 'ipfs://random'
  const contractUri = 'contractUri'
  const createERC1155AgreementTx = agreementFactory.createERC1155(
    randomIPFUri,
    holders,
    contractUri,
    ['ABC123'],
    { value: await feeManager.creationFee() },
  )
  const event = await getEvent(
    createERC1155AgreementTx,
    agreementFactory,
    'AgreementCreated',
  )

  const agreementAddress = event.args[0]
  const agreement = new AgreementERC1155__factory(deployer).attach(
    agreementAddress,
  )
  return agreement
}

export const createERC20 = async (
  deployer: SignerWithAddress,
  holders: IHolder.HolderStruct[],
  agreementFactory: AgreementFactory,
  feeManager: FeeManager,
) => {
  const DATA_HASH = `0x${'ab'.repeat(32)}`
  const createERC20AgreementTx = agreementFactory.createERC20(
    DATA_HASH,
    holders,
    [''],
    { value: await feeManager.creationFee() },
  )
  const event = await getEvent(
    createERC20AgreementTx,
    agreementFactory,
    'AgreementCreated',
  )

  const agreementAddress = event.args[0]
  const agreement = new AgreementERC20__factory(deployer).attach(
    agreementAddress,
  )
  return agreement
}
