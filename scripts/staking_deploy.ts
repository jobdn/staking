import { ethers } from "hardhat";
import { config } from "../config";
import { Staking__factory } from "../typechain";

async function main() {
  const Staking: Staking__factory = <Staking__factory>(await ethers.getContractFactory("Staking"));
  const staking = await Staking.deploy(config.STAKING_TOKEN, config.REWARD_TOKEN);
  await staking.deployed();

  console.log("Staking deployed to:", staking.address);
}

main().catch((error) => {
  console.error(error);
  process.exitCode = 1;
});
