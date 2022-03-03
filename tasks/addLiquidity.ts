import { task } from "hardhat/config";

const ROUTER_ADDRESS = "0x7a250d5630B4cF539739dF2C5dAcb4c659F2488D";
const MIN_AMOUNT_OF_TOKEN = 1;
const DEADLINE = 1746281394;

task("addLiquidity", "Add liquidity to the pair")
  .addParam("token", "Token which has pair with WETH")
  .addParam("desiredTokenAmount", "Desired amount of token")
  .setAction(async (taskArgs, hre) => {
    const { token, desiredTokenAmount } = taskArgs;

    const router = await hre.ethers.getContractAt(
      "IUniswapV2Router02",
      ROUTER_ADDRESS
    );

    const [owner] = await hre.ethers.getSigners();

    await (
      await router.addLiquidityETH(
        token,
        desiredTokenAmount,
        MIN_AMOUNT_OF_TOKEN,
        hre.ethers.utils.parseEther("0.01"),
        owner.address,
        DEADLINE,
        {
          from: owner.address,
          value: hre.ethers.utils.parseEther("0.1"),
        }
      )
    ).wait();
  });
