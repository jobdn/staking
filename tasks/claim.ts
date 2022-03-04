import { task } from "hardhat/config";
import { config } from "../config";
import { Staking } from "../typechain";

const STAKING_CONTRACT = config.STAKING_CONTRACT;

task("claim", "Claim tokens from staking contract").setAction(
  async (taskArgs, hre) => {
    const [staker] = await hre.ethers.getSigners();

    const staking: Staking = await hre.ethers.getContractAt(
      "Staking",
      STAKING_CONTRACT
    );
    await staking.connect(staker).claim();

    console.log(
      `${staking.address} have transfered reward tokens to ${staker.address}`
    );
  }
);
