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
    // const pairAddress = (
    //   await Factory.createPair(taskArgs.token1, taskArgs.token2)
    // ).wait();

    const [ owner ] = await hre.ethers.getSigners();

    const FactoryWithSigner = Factory.connect(owner);

    const pairAddress = (
      await FactoryWithSigner.createPair(taskArgs.token1, taskArgs.token2)
    )

    console.log(`Pair address: ${pairAddress}`);
    console.log(pairAddress);
  });

  // pair: 0x4EE38eaf103288db9A17fa1D027c1d33F6653549

  // pair: 0x79e2F77df7204746F4E175D7ba7c135B3EAF5399
  // token: 0x9603216F56A8AD58d51c87Fe9ECb96dE905814C1
  // me: 0x5c0D12FCFEDBC5f19c3e4a0E4093EcCCd7459aCF