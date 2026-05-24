import { ethers } from "hardhat";
async function main() {
  const [deployer] = await ethers.getSigners();
  console.log("Deploying with:", deployer.address);
  const RitualMosaic = await ethers.getContractFactory("RitualMosaic");
  const mosaic = await RitualMosaic.deploy();
  await mosaic.waitForDeployment();
  const address = await mosaic.getAddress();
  console.log("✅ RitualMosaic deployed to:", address);
  console.log(`\nAdd to frontend/.env.local:\nNEXT_PUBLIC_CONTRACT_ADDRESS=${address}`);
}
main().catch((e) => { console.error(e); process.exitCode = 1; });
