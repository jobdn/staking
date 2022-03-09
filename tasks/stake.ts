import { task } from "hardhat/config";
import { config } from "../config";
import { Staking } from "../typechain";

const STAKING_CONTRACT = config.STAKING_CONTRACT;

task("stake", "Stake tokens to staking contract")
  .addParam("amount", "Amount of staking tokens")
  .setAction(async (taskArgs, hre) => {
    const { amount } = taskArgs;
    const [staker] = await hre.ethers.getSigners();

    const staking: Staking = await hre.ethers.getContractAt(
      "Staking",
      STAKING_CONTRACT
    );
    await staking.connect(staker).stake(amount, {
      // from: staker.address,
      // gasPrice: hre.ethers.utils.parseEther("0.01"),
      // gasLimit: hre.ethers.utils.parseEther("0.0001")
      // gasLimit: 210
    });

    console.log(
      `${staker.address} have staked ${amount} to ${staking.address}`
    );
  });
