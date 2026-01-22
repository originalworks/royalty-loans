import path from 'path';
import { readdir, readFile, writeFile } from 'fs/promises';

export interface IDeployment {
  deployer: string;
  standardRoyaltyLoanTemplate: string;
  beneficiaryRoyaltyLoanTemplate: string;
  royaltyLoanFactory: string;
  paymentToken: string;
}

export const deploymentsDir = path.resolve(__dirname, '../deployments');

export const buildDeploymentFileName = () => {
  const network = process.env.HARDHAT_NETWORK || 'unknown';
  const date = new Date(Date.now());
  const month =
    date.getMonth() + 1 > 9 ? date.getMonth() + 1 : `0${date.getMonth() + 1}`;
  const day = date.getDate() > 9 ? date.getDate() : `0${date.getDate()}`;
  const hour = date.getHours() > 9 ? date.getHours() : `0${date.getHours()}`;
  const minute =
    date.getMinutes() > 9 ? date.getMinutes() : `0${date.getMinutes()}`;
  const second =
    date.getSeconds() > 9 ? date.getSeconds() : `0${date.getSeconds()}`;
  const dateString = `${date.getFullYear()}-${month}-${day}_${hour}:${minute}:${second}`;
  return `${network}__${dateString}.json`;
};

export const getLatestDeployment = async () => {
  const network = process.env.HARDHAT_NETWORK || 'unknown';
  const files = await readdir(deploymentsDir);

  const matching = files.filter((file) => file.startsWith(`${network}__`));

  if (matching.length === 0) {
    throw new Error(`Deployment for network ${network} not found`);
  }

  const sorted = matching.sort((a, b) => {
    const getTimestamp = (file: string) => file.split('__')[1];
    const tsA = new Date(getTimestamp(a).replace('_', ' ')).getTime();
    const tsB = new Date(getTimestamp(b).replace('_', ' ')).getTime();

    return tsB - tsA; // newest first
  });

  const latestDeploymentPath = sorted[0];

  const content = await readFile(
    path.join(deploymentsDir, latestDeploymentPath),
    'utf-8',
  );
  const parsed = await JSON.parse(content);

  return parsed as IDeployment;
};

export const saveNewDeployment = async (deployment: IDeployment) => {
  const deploymentDataFilePath = path.join(
    deploymentsDir,
    buildDeploymentFileName(),
  );

  await writeFile(deploymentDataFilePath, JSON.stringify(deployment, null, 2));

  console.log('new deployment:', deployment);
  console.log('saved to:', deploymentDataFilePath);
};
