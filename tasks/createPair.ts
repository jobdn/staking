import { task } from "hardhat/config";
import { config } from "../config";
import { IUniswapV2Factory } from "../typechain";

const FACTORY_ADDRESS = "0x5C69bEe701ef814a2B6a3EDD4B1652CB9cc5aA6f";
const WETH_ADDRESS = "0xc778417E063141139Fce010982780140Aa0cD5Ab";

task("createPair", "Create the pair")
.addParam("token1", "The address of the first token from pair")
.setAction(async (taskArgs, hre) => {
  const TOKEN_ADDRESS = taskArgs.token1;
  const Factory: IUniswapV2Factory = await hre.ethers.getContractAt(
    "IUniswapV2Factory",
    FACTORY_ADDRESS
    );
    
    await (await Factory.createPair(TOKEN_ADDRESS, WETH_ADDRESS)).wait();

    const pairAddress = await Factory.getPair(
      TOKEN_ADDRESS,
      WETH_ADDRESS
    );

    console.log(`Pair address: ${pairAddress}`);
  });
