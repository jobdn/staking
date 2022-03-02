import { task } from "hardhat/config";
import { config } from "../config";

const ROUTER_ADDRESS = "0x7a250d5630B4cF539739dF2C5dAcb4c659F2488D";

task("addLiquidity", "Add liquidity to the pair").setAction(
  async (taskArgs, hre) => {
    const router = await hre.ethers.getContractAt(
      "IUniswapV2Router02",
      ROUTER_ADDRESS
    );

    const [owner] = await hre.ethers.getSigners();

    const routerWithSigner = router.connect(owner);

    console.log("BIG NUMBER: ", hre.ethers.BigNumber.from("1"));
    
    const result = await (await routerWithSigner.addLiquidityETH(
      config.TOKEN_ADDRESS,
      20,
      20,
      hre.ethers.BigNumber.from("1"),
      "0xcCD7df7995E526771327422047F3f3ebe68B3044",
      1646281394
    )).wait();

    console.log(result);
  }
);
