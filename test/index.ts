import { SignerWithAddress } from "@nomiclabs/hardhat-ethers/signers";
import { expect } from "chai";
import { BigNumberish } from "ethers";
import { ethers, network } from "hardhat";
import { ERC20, ERC20__factory, Staking, Staking__factory } from "../typechain";

describe("Staking", function () {
  let stakingToken: ERC20;
  let rewardToken: ERC20;
  let staking: Staking;

  let owner: SignerWithAddress, acc1: SignerWithAddress;

  beforeEach(async () => {
    [owner, acc1] = await ethers.getSigners();

    // Deploy staking token
    const StakingTokenFactory: ERC20__factory = <ERC20__factory>(
      await ethers.getContractFactory("ERC20")
    );
    stakingToken = await StakingTokenFactory.deploy("STAKING_TOKEN", "STN", 18);
    await stakingToken.deployed();

    // Deploy reward token
    const RewardTokenFactory: ERC20__factory = <ERC20__factory>(
      await ethers.getContractFactory("ERC20")
    );
    rewardToken = await RewardTokenFactory.deploy("REWARD_TOKEN", "RTN", 18);
    await rewardToken.deployed();

    // Deploy staking
    const Staking: Staking__factory = <Staking__factory>(
      await ethers.getContractFactory("Staking")
    );

    staking = await Staking.deploy(stakingToken.address, rewardToken.address);
    await staking.deployed();
  });

  const mintForAndApproveTokensFor = async (
    mintFor: SignerWithAddress,
    approved: string,
    amount: BigNumberish,
    token: ERC20 = stakingToken
  ) => {
    await token.mint(mintFor.address, amount);
    await token.connect(mintFor).approve(approved, amount);
  };

  const stakeFromAndCheckStakingBalance = async (
    from: SignerWithAddress,
    stakedAmount: number,
    expectedBalanceOfStake: number
  ) => {
    await staking.connect(from).stake(stakedAmount);
    expect(await staking.balances(from.address)).to.equal(
      expectedBalanceOfStake
    );
  };

  describe("Stake", () => {
    it("Should stake tokeks", async () => {
      await mintForAndApproveTokensFor(
        owner,
        staking.address,
        ethers.utils.parseEther("1")
      );
      await stakeFromAndCheckStakingBalance(owner, 2000, 2000);
    });

    it("Should correct calculate the reward tokens after changing the reward rate", async () => {
      await mintForAndApproveTokensFor(
        owner,
        staking.address,
        ethers.utils.parseEther("1")
      );
      await stakeFromAndCheckStakingBalance(owner, 10000, 10000);
      await rewardToken.mint(staking.address, ethers.utils.parseEther("1"));

      // in 1 minutes
      await network.provider.send("evm_increaseTime", [61]);
      await network.provider.send("evm_mine");

      // for this stake and rate 5000 * 0.3 + 2000 = 8000 reward will be earned
      await staking.stake(10000);
      await staking.setRate(30);

      staking
        .holders(owner.address)
        .then((holder) => {
          expect(holder.reward).to.equal(2000);
        })
        .catch(console.log);

      // in 1 minutes
      await network.provider.send("evm_increaseTime", [61]);
      await network.provider.send("evm_mine");

      await staking.claim();
      expect(await rewardToken.balanceOf(owner.address)).to.equal(8000);
    });

    it("Should fail if to stake nothing", async () => {
      await expect(staking.stake(0)).to.be.revertedWith("Cannot stake nothing");
    });
  });

  describe("Claim", () => {
    it("Should claim reward tokens", async () => {
      await mintForAndApproveTokensFor(
        owner,
        staking.address,
        ethers.utils.parseEther("1")
      );
      await stakeFromAndCheckStakingBalance(owner, 10000, 10000);
      rewardToken.mint(staking.address, ethers.utils.parseEther("1"));
      await network.provider.send("evm_increaseTime", [60]);
      await network.provider.send("evm_mine");
      await staking.claim();

      expect(await rewardToken.balanceOf(owner.address)).to.equal(2000);
    });

    it("Should fail if reward is equal to 0", async () => {
      await expect(staking.claim()).to.be.revertedWith("Nothing claim");
    });
  });

  describe("Unstake", () => {
    it("Should unstake staked tokens", async () => {
      await mintForAndApproveTokensFor(
        owner,
        staking.address,
        ethers.utils.parseEther("1")
      );
      await stakeFromAndCheckStakingBalance(owner, 100000, 100000);
      await network.provider.send("evm_increaseTime", [60]);
      await network.provider.send("evm_mine");
      await staking.unstake();
      expect(await stakingToken.balanceOf(owner.address)).to.equal(
        ethers.utils.parseEther("1")
      );
    });
    it("Should fail if balance is equal to 0", async () => {
      await expect(staking.unstake()).to.be.revertedWith("Nothing unstake");
    });

    it("Should fail if time is not over", async () => {
      await mintForAndApproveTokensFor(
        owner,
        staking.address,
        ethers.utils.parseEther("1")
      );
      await stakeFromAndCheckStakingBalance(owner, 100000, 100000);
      await expect(staking.unstake()).to.be.revertedWith(
        "The time to unstake is not over"
      );
    });
  });

  describe("Set rate", () => {
    it("Should set rate", async () => {
      await staking.setRate(50);
      expect(await staking.stakingRate()).to.equal(50);
    });
    it("Should fail if not admin", async () => {
      await expect(staking.connect(acc1).setRate(50)).to.be.revertedWith(
        "Only admin can set the rate"
      );
    });
  });

  describe("Set freeze time", () => {
    it("Should set freeze time", async () => {
      await staking.setFreezeTime(3);
      expect(await staking.freezeTime()).to.equal(180);
    });
    it("Should fail if not admin", async () => {
      await expect(staking.connect(acc1).setFreezeTime(50)).to.be.revertedWith(
        "Only admin can set the frezeeTime"
      );
    });
  });

  describe("Set reward time", () => {
    it("Should set reward time", async () => {
      await staking.setRewardTime(2);
      expect(await staking.rewardTime()).to.equal(120);
    });
    it("Should fail if not admin", async () => {
      await expect(staking.connect(acc1).setRewardTime(50)).to.be.revertedWith(
        "Only admin can set the time of reward"
      );
    });
  });
});
