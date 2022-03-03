import { task } from "hardhat/config";
import { config } from "../config";

const ROUTER_ADDRESS = "0x7a250d5630B4cF539739dF2C5dAcb4c659F2488D";
const MIN_AMOUNT_OF_TOKEN = 1;
const DEADLINE = 1746281394;

task("addLiquidity", "Add liquidity to the pair")
  .addParam(
    "token",
    "Token address which you want to create the pair with WETH"
  )
  .addParam("desiredTokenAmount", "Desired amount of token")
  .setAction(async (taskArgs, hre) => {
    const { token, desiredTokenAmount } = taskArgs;

    const router = await hre.ethers.getContractAt(
      "IUniswapV2Router02",
      ROUTER_ADDRESS
    );

    await (
      await router.addLiquidityETH(
        token,
        desiredTokenAmount,
        MIN_AMOUNT_OF_TOKEN,
        hre.ethers.utils.parseEther("0.01"),
        config.OWNER_ADDRESS,
        DEADLINE,
        {
          from: config.OWNER_ADDRESS,
          value: hre.ethers.utils.parseEther("0.1"),
        }
      )
    ).wait();
  });
