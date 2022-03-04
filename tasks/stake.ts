import { task } from "hardhat/config";
import { config } from "../config";

const STAKING_ADDRESS = config.STAKING_TOKEN;

task("stake", "Stake tokens to staking contract")
  .addParam("amount", "Amount of staking tokens")
  .setAction(async (taskArgs, hre) => {
    const staking = await hre.ethers.getContractAt("Staking", STAKING_ADDRESS); 
  });
