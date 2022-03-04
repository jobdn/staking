import { SignerWithAddress } from "@nomiclabs/hardhat-ethers/signers";
import { expect, should } from "chai";
import { ethers, network } from "hardhat";
import { config } from "../config";
import { ERC20, ERC20__factory, Staking, Staking__factory } from "../typechain";

describe("Staking", function () {
  let stakingToken: ERC20;
  let rewardToken: ERC20;
  let staking: Staking;

  let owner: SignerWithAddress,
    acc1: SignerWithAddress,
    acc2: SignerWithAddress;

  beforeEach(async () => {
    [owner, acc1, acc2] = await ethers.getSigners();

    // Deploy staking token
    const StakingTokenFactory: ERC20__factory = <ERC20__factory>(
      await ethers.getContractFactory("ERC20")
    );
    stakingToken = await StakingTokenFactory.deploy("STAKING_TOKEN", "STN", 1);
    await stakingToken.deployed();

    // Deploy reward token
    const RewardTokenFactory: ERC20__factory = <ERC20__factory>(
      await ethers.getContractFactory("ERC20")
    );
    rewardToken = await RewardTokenFactory.deploy("REWARD_TOKEN", "RTN", 1);
    await rewardToken.deployed();

    // Deploy staking
    const Staking: Staking__factory = <Staking__factory>(
      await ethers.getContractFactory("Staking")
    );

    staking = await Staking.deploy(stakingToken.address, rewardToken.address);
    await staking.deployed();
  });

  describe("Stake", () => {
    it("Should make stake", async () => {
      await stakingToken.mint(owner.address, 10000);
      await stakingToken.approve(staking.address, 1000);

      await staking.stake(100);
      await staking.stake(100);
      expect(await staking.balances(owner.address)).to.equal(200);

      // Check that stakeholder is added to stakeholderToIndex mapping
      const firstStakeholderIndex = await staking.stakeholderToIndex(
        owner.address
      );
      expect(firstStakeholderIndex).to.equal(1);

      staking
        .stakeholders(firstStakeholderIndex)
        .then((stakeholder) => {
          expect(stakeholder.stakeholderAddress).to.equal(owner.address);
          expect(stakeholder.totalStaking).to.equal(200);
        })
        .catch(console.log);

      //Check for acc1
      await stakingToken.mint(acc1.address, 10000);
      await stakingToken.connect(acc1).approve(staking.address, 1000);

      await staking.connect(acc1).stake(10);
      expect(await staking.balances(acc1.address)).to.equal(10);

      staking
        .stakeholders(2)
        .then((stakeholder) => {
          expect(stakeholder.stakeholderAddress).to.equal(acc1.address);
          expect(stakeholder.totalStaking).to.equal(10);
        })
        .catch(console.log);
    });

    it("Should fail if amount is equal to 0", async () => {
      await stakingToken.mint(owner.address, 10000);
      await stakingToken.approve(staking.address, 1000);

      await expect(staking.stake(0)).to.be.revertedWith("Cannot stake nothing");
    });
  });

  describe("Claim", () => {
    it("Should claim reward tokens", async () => {
      await stakingToken.mint(owner.address, 10000);
      await stakingToken.approve(staking.address, 10000);

      await rewardToken.mint(staking.address, 10000);
      expect(await rewardToken.balanceOf(staking.address)).to.equal(10000);

      // First stake
      await staking.stake(1000);
      expect(await staking.balances(owner.address)).to.equal(1000);

      // 30 minutes went
      await network.provider.send("evm_increaseTime", [1800]);
      await staking.stake(500);
      expect(await staking.balances(owner.address)).to.equal(1500);

      // 30 minutes went
      await network.provider.send("evm_increaseTime", [1800]);
      await staking.claim();
      expect(await rewardToken.balanceOf(owner.address)).to.equal(1500);

      await network.provider.send("evm_increaseTime", [1800]);
      await staking.claim();
      expect(await rewardToken.balanceOf(owner.address)).to.equal(2400);
      await network.provider.send("evm_mine");
    });

    it("Should fail if sender didn't stake never", async () => {
      await expect(staking.claim()).to.be.revertedWith(
        "There is no you in stakeholder list"
      );
    });
  });

  describe("Unstake", () => {
    it("Should unstake all stake of the user", async () => {
      await stakingToken.mint(owner.address, 10000);
      await stakingToken.approve(staking.address, 10000);

      await staking.stake(1000);
      expect(await stakingToken.balanceOf(owner.address)).to.equal(9000);
      expect(await staking.balances(owner.address)).to.equal(1000);
      await staking.stake(1000);
      expect(await stakingToken.balanceOf(owner.address)).to.equal(8000);
      expect(await staking.balances(owner.address)).to.equal(2000);

      await network.provider.send("evm_increaseTime", [120]);
      await network.provider.send("evm_mine");
      await staking.unstake();
      expect(await stakingToken.balanceOf(owner.address)).to.equal(10000);
      expect(await staking.balances(owner.address)).to.equal(0);
    });

    it("Should fail if sender want to claim after unstake", async () => {
      await stakingToken.mint(owner.address, 10000);
      await stakingToken.approve(staking.address, 10000);

      await staking.stake(1000);
      expect(await stakingToken.balanceOf(owner.address)).to.equal(9000);
      expect(await staking.balances(owner.address)).to.equal(1000);

      await network.provider.send("evm_increaseTime", [120]);
      await network.provider.send("evm_mine");

      await staking.unstake();
      await expect(staking.claim()).to.be.revertedWith("Have no stakes");
    });

    it("Should fail if sender didn't stake never", async () => {
      await expect(staking.unstake()).to.be.revertedWith(
        "There is no you in stakeholder list"
      );
    });

    it("Should fail if timeFreeze is not over", async () => {
      await stakingToken.mint(owner.address, 10000);
      await stakingToken.approve(staking.address, 10000);
      await staking.stake(1000);
      
      await expect(staking.unstake()).to.be.revertedWith(
        "timeFreeze is not over"
      );
    });

    it("Should fail if sender want unstake more one time", async () => {
      await stakingToken.mint(owner.address, 10000);
      await stakingToken.approve(staking.address, 10000);
      await staking.stake(1000);

      await network.provider.send("evm_increaseTime", [120]);
      await network.provider.send("evm_mine");

      await staking.unstake();

      await expect(staking.unstake()).to.be.revertedWith("Have no stakes");
    });
  });

  describe("Set freeze time", () => {
    it("Should fail if not owner", async () => {
      await expect(staking.connect(acc1).setFreezeTime(30)).to.be.revertedWith(
        "Only owner can set timeFreeze"
      );
    });

    it("Should set timeFreeze", async () => {
      await staking.setFreezeTime(30);
      expect(await staking.freezeTime()).to.equal(1800);
    });
  });

  describe("Set rewardPerToken", () => {
    it("Should set rewardPerToken", async () => {
      await stakingToken.mint(owner.address, 100000);
      await stakingToken.approve(staking.address, 100000);

      await rewardToken.mint(staking.address, 10000);
      expect(await rewardToken.balanceOf(staking.address)).to.equal(10000);

      await staking.setRewardPerToken(30);
      await staking.stake(1000);

      // in 50 minutes
      await network.provider.send("evm_increaseTime", [3000]);
      await network.provider.send("evm_mine");
      await staking.claim();

      expect(await rewardToken.balanceOf(owner.address)).to.equal(1500);
    });

    it("Should fail if not owner", async () => {
      await expect(
        staking.connect(acc1).setRewardPerToken(30)
      ).to.be.revertedWith("Only owner can set reward per time");
    });
  });
});
