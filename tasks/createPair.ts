import { task } from "hardhat/config";
import { config } from "../config";

const FACTORY_ADDRESS = "0x5C69bEe701ef814a2B6a3EDD4B1652CB9cc5aA6f";
const WETH_ADDRESS = "0xc778417E063141139Fce010982780140Aa0cD5Ab";

task("createPair", "Create the pair")
  .addParam("token1", "The address of the first token from pair")
  .setAction(async (taskArgs, hre) => {
    const TOKEN_ADDRESS = taskArgs.token1;
    const Factory = await hre.ethers.getContractAt(
      "IUniswapV2Factory",
      FACTORY_ADDRESS
    );

    const [owner] = await hre.ethers.getSigners();

    const FactoryWithSigner = Factory.connect(owner);

    await (await FactoryWithSigner.createPair(TOKEN_ADDRESS, WETH_ADDRESS)).wait();

    const pairAddress = await FactoryWithSigner.getPair(
      TOKEN_ADDRESS,
      WETH_ADDRESS
    );
    console.log(pairAddress);

    console.log(`Pair address: ${pairAddress}`);
  });
