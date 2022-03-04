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

        balances[msg.sender] += _amount;
        console.log("TIME STAMP in stake: ", block.timestamp);

        // TODO: разрешить контракту списывать токены с контракта staking токена
        stakingToken.transferFrom(msg.sender, address(this), _amount);

        emit Staked(msg.sender, _amount, stakeholderIndex, block.timestamp);
    }

    function unstake() public {}

    function calculateStakeReward(Stake memory currentStake)
        internal
        view
        returns (uint256)
    {
        console.log("================CALCULATE REWARDS================");
        console.log("CURRENT STAKE AMOUNT: ", currentStake.amount);
        console.log("CURRENT STAKE SINCE: ", currentStake.since);
        console.log("CURRENT STAKE HOLDER: ", currentStake.stakeholderAddress);

        uint256 amountOfTenMinutes = (block.timestamp - currentStake.since) /
            10 minutes;

        console.log("WHAT 10 minutes is went: ", amountOfTenMinutes);

        uint256 stakingTokenPerMinutes = amountOfTenMinutes *
            currentStake.amount;
        console.log(
            "STAKING TOKENS * AMOUNT OF TEN MINUTES: ",
            stakingTokenPerMinutes
        );

        uint256 rewardForCurrentStake = (stakingTokenPerMinutes * 20) / 100;
        console.log("Current reward amount: ", rewardForCurrentStake);

        return rewardForCurrentStake;
    }

    function claim() public {
        console.log("\nTIME STAMP in claim: ", block.timestamp);
        uint256 senderIndex = stakeholderToIndex[msg.sender];
        // Пользователь снимает все ревард токены, то нет проверки на количество ревард токенов

        /*
         * А может ли быть ревард токенов не быть?
         * При стейкинге создается элемент стейкинга в массив к юзеру
         */

        // Если пользователь есть в массиве инвесторов, то у него точно будут ревард токены
        require(senderIndex != 0, "Have no stake");
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

        // Нужно удалять ревард токены
        console.log("ALL REWARDS: ", allRewardsOfSender);
        rewardToken.transfer(msg.sender, allRewardsOfSender);
    }
}
