//SPDX-License-Identifier: Unlicense
pragma solidity ^0.8.0;

import "@openzeppelin/contracts/token/ERC20/IERC20.sol";
import "hardhat/console.sol";

contract Staking {
    IERC20 public stakingToken;
    IERC20 public rewardToken;

    struct Stake {
        address stakeholderAddress;
        uint256 amount;
        uint256 since;
    }

    struct Stakeholder {
        address stakeholderAddress;
        Stake[] stakes;
        uint256 totalStaking;
    }

    Stakeholder[] public stakeholders;
    mapping(address => uint256) public stakeholderToIndex;
    mapping(address => uint256) public balances;
    uint256 public constant rewardPerTenMinutes = 20;

    event Staked(
        address indexed stakeholder,
        uint256 amount,
        uint256 stakeholderIndex,
        uint256 timestamp
    );

    constructor(address _stakingToken, address _rewardToken) {
        stakingToken = IERC20(_stakingToken);
        rewardToken = IERC20(_rewardToken);

        // To avoid bug of index-1
        stakeholders.push();
    }

    function hasStakes(uint256 index) internal view returns (bool) {
        return stakeholders[index].stakes.length != 0;
    }

    function addStakeholder(address _stakeholderAddress)
        internal
        returns (uint256)
    {
        stakeholders.push();
        uint256 stakeholderIndex = stakeholders.length - 1;
        stakeholderToIndex[_stakeholderAddress] = stakeholderIndex;
        stakeholders[stakeholderIndex].stakeholderAddress = _stakeholderAddress;
        return stakeholderIndex;
    }

    function stake(uint256 _amount) public {
        require(_amount > 0, "Cannot stake nothing");
        uint256 stakeholderIndex = stakeholderToIndex[msg.sender];
        if (stakeholderIndex == 0) {
            stakeholderIndex = addStakeholder(msg.sender);
        }

        stakeholders[stakeholderIndex].stakes.push(
            Stake({
                stakeholderAddress: msg.sender,
                amount: _amount,
                since: block.timestamp
            })
        );

        stakeholders[stakeholderIndex].totalStaking += _amount;
        balances[msg.sender] += _amount;
        stakingToken.transferFrom(msg.sender, address(this), _amount);

        emit Staked(msg.sender, _amount, stakeholderIndex, block.timestamp);
    }

    function unstake() public {
        uint256 senderIndex = stakeholderToIndex[msg.sender];
        require(senderIndex != 0, "There is no you in stakeholder list");
        require(hasStakes(senderIndex), "Have no stakes");

        Stakeholder storage stakeholder = stakeholders[senderIndex];
        uint256 totalStakingOfStakeholder = stakeholder.totalStaking;
        delete stakeholder.stakes;

        stakeholder.totalStaking = 0;
        balances[msg.sender] -= totalStakingOfStakeholder;
        stakingToken.transfer(msg.sender, totalStakingOfStakeholder);
    }

    function calculateStakeReward(Stake memory currentStake)
        internal
        view
        returns (uint256)
    {
        uint256 amountOfTenMinutes = (block.timestamp - currentStake.since) /
            10 minutes;
        uint256 stakingTokenPerMinutes = amountOfTenMinutes *
            currentStake.amount;
        uint256 rewardForCurrentStake = (stakingTokenPerMinutes * 20) / 100;

        return rewardForCurrentStake;
    }

    function claim() public {
        uint256 senderIndex = stakeholderToIndex[msg.sender];

        require(senderIndex != 0, "There is no you in stakeholder list");
        require(hasStakes(senderIndex), "Have no stakes");

        Stake[] memory stakeholderStakes = stakeholders[senderIndex].stakes;
        uint256 allRewardsOfSender;

        for (
            uint256 stakeIndex = 0;
            stakeIndex < stakeholderStakes.length;
            stakeIndex++
        ) {
            Stake memory currentStake = stakeholderStakes[stakeIndex];
            allRewardsOfSender += calculateStakeReward(currentStake);
            stakeholders[senderIndex].stakes[stakeIndex].since = block
                .timestamp;
        }

        rewardToken.transfer(msg.sender, allRewardsOfSender);
    }
}
