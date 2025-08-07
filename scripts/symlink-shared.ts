import fs from 'fs';
import path from 'path';

const rootDir = path.resolve(__dirname, '../');
const sharedContractsPath = path.join(
  rootDir,
  'libs',
  'contracts-shared',
  'contracts',
);

// List your contracts libs here
const targets = ['contracts-agreements', 'contracts-loans'];

for (const target of targets) {
  const targetSharedPath = path.join(
    rootDir,
    'libs',
    target,
    'contracts',
    'shared',
  );

  // Remove existing symlink or folder
  try {
    if (fs.existsSync(targetSharedPath)) {
      fs.unlinkSync(targetSharedPath);
    }
  } catch (err) {
    console.error(`Failed to remove existing shared link in ${target}:`, err);
  }

  // Create new symlink
  try {
    fs.symlinkSync(sharedContractsPath, targetSharedPath, 'dir');
    console.log(`✅ Created symlink for ${target} → shared`);
  } catch (err) {
    console.error(`❌ Failed to create symlink for ${target}:`, err);
  }
}
