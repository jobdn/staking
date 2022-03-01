import { task } from "hardhat/config";

const FACTORY_ADDRESS = "0x5C69bEe701ef814a2B6a3EDD4B1652CB9cc5aA6f";

task("createPair", "Create the pair")
  .addParam("token1", "The address of the first token from pair")
  .addParam("token2", "The address of the second token from pair")
  .setAction(async (taskArgs, hre) => {
    const Factory = await hre.ethers.getContractAt(
      "IUniswapV2Factory",
      FACTORY_ADDRESS
    );
    const pairAddress = (
      await Factory.createPair(taskArgs.token1, taskArgs.token2)
    ).wait();
    console.log(`Pair address: ${pairAddress}`);
    console.log(pairAddress);
  });
