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

  describe("Make staking", () => {
    it("Should make stake", async () => {
      await stakingToken.mint(owner.address, 10000);
      await stakingToken.approve(staking.address, 1000);

      await staking.stake(100);
      expect(await staking.balances(owner.address)).to.equal(100);

      // Check that stakeholder is added to stakeholderToIndex mapping
      const firstStakeholderIndex = await staking.stakeholderToIndex(
        owner.address
      );
      expect(firstStakeholderIndex).to.equal(1);

      //Check for acc1
      await stakingToken.mint(acc1.address, 10000);
      await stakingToken.connect(acc1).approve(staking.address, 1000);

      await staking.connect(acc1).stake(100);
      expect(await staking.balances(acc1.address)).to.equal(100);
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

      await staking.stake(1000);
      expect(await staking.balances(owner.address)).to.equal(1000);

      await network.provider.send("evm_increaseTime", [1800]);

      await staking.stake(500);
      expect(await staking.balances(owner.address)).to.equal(1500);

      await network.provider.send("evm_increaseTime", [1800]);

      await staking.claim();

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

      await staking.unstake();
      await expect(staking.claim()).to.be.revertedWith("Have no stakes");
    });

    it("Should fail if sender didn't stake never", async () => {
      await expect(staking.unstake()).to.be.revertedWith(
        "There is no you in stakeholder list"
      );
    });

    it("Should fail if sender want unstake more one time", async () => {
      await stakingToken.mint(owner.address, 10000);
      await stakingToken.approve(staking.address, 10000);
      await staking.stake(1000);
      await staking.unstake();
      await expect(staking.unstake()).to.be.revertedWith("Have no stakes");
    });
  });
});
