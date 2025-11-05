import { ethers } from "hardhat";
import * as fs from "fs";
import * as path from "path";

async function main() {
  const [deployer] = await ethers.getSigners();
  console.log("Deploying with:", deployer.address);

  const LendingAdapter = await ethers.getContractFactory("LendingAdapter");
  const lending = await LendingAdapter.deploy();
  await lending.waitForDeployment();

  const RescueHelper = await ethers.getContractFactory("RescueHelper");
  const rescue = await RescueHelper.deploy(await lending.getAddress());
  await rescue.waitForDeployment();

  // authorize helper on adapter
  const tx = await lending.setHelper(await rescue.getAddress());
  await tx.wait();

  const out = {
    network: (await deployer.provider!.getNetwork()).name,
    lendingAdapter: await lending.getAddress(),
    rescueHelper: await rescue.getAddress(),
  };

  const dir = path.join(__dirname, "../deployments");
  fs.mkdirSync(dir, { recursive: true });
  const file = path.join(dir, `${Date.now()}.json`);
  fs.writeFileSync(file, JSON.stringify(out, null, 2));
  console.log("Deployed:", out);
}

main().catch((e) => {
  console.error(e);
  process.exit(1);
});


