// SPDX-License-Identifier: Unlicense
pragma solidity ^0.8.0;

import "@openzeppelin/contracts/token/ERC20/IERC20.sol";
import "@openzeppelin/contracts/access/AccessControl.sol";

contract Staking is AccessControl {
    IERC20 public rewardToken;
    IERC20 public stakingToken;
    uint256 public rewardTime = 1 minutes;
    uint256 public stakingRate = 20;
    uint256 public freezeTime = 1 minutes;

    struct Holder {
        uint256 reward;
        uint256 lastRewardUpdateTime;
    }

    mapping(address => uint256) public balances;
    mapping(address => Holder) public holders;

    bytes32 public constant ADMIN_ROLE = keccak256("ADMIN_ROLE");

    event Staked(address indexed staker, uint256 amount, uint256 time);
    event Claimed(address indexed staker, uint256 amount, uint256 time);
    event Unstaked(address indexed staker, uint256 amount, uint256 time);

    constructor(address _stakingToken, address _rewardToken) {
        stakingToken = IERC20(_stakingToken);
        rewardToken = IERC20(_rewardToken);

        _setupRole(ADMIN_ROLE, msg.sender);
        _setupRole(DEFAULT_ADMIN_ROLE, msg.sender);
    }

    function setRate(uint256 _rate) public {
        require(hasRole(ADMIN_ROLE, msg.sender), "Only admin can set the rate");
        stakingRate = _rate;
    }

    function setFreezeTime(uint256 _freezeTime) public {
        require(
            hasRole(ADMIN_ROLE, msg.sender),
            "Only admin can set the frezeeTime"
        );
        freezeTime = _freezeTime * 1 minutes;
    }

    function setRewardTime(uint256 _rewardTime) public {
        require(
            hasRole(ADMIN_ROLE, msg.sender),
            "Only admin can set the time of reward"
        );
        rewardTime = _rewardTime * 1 minutes;
    }

    function updateReward(address _holderAddress) internal {
        holders[_holderAddress].reward += earned(_holderAddress);
        holders[_holderAddress].lastRewardUpdateTime = block.timestamp;
    }

    function earned(address _address) internal view returns (uint256) {
        uint256 integerAmountOfRewardTime = (block.timestamp -
            holders[_address].lastRewardUpdateTime) / rewardTime;
        uint256 reward = ((integerAmountOfRewardTime * balances[_address]) *
            stakingRate) / 100;
        return reward;
    }

    function stake(uint256 _amount) public {
        updateReward(msg.sender);
        require(_amount > 0, "Cannot stake nothing");

        balances[msg.sender] += _amount;
        stakingToken.transferFrom(msg.sender, address(this), _amount);

        emit Staked(msg.sender, _amount, block.timestamp);
    }

    function unstake() public {
        require(balances[msg.sender] > 0, "Nothing unstake");
        require(
            block.timestamp >
                holders[msg.sender].lastRewardUpdateTime + freezeTime,
            "The time to unstake is not over"
        );

        updateReward(msg.sender);

        address sender = msg.sender;
        uint256 balanceOfSender = balances[sender];
        balances[sender] = 0;

        stakingToken.transfer(sender, balanceOfSender);

        emit Unstaked(sender, balanceOfSender, block.timestamp);
    }

    function claim() public {
        updateReward(msg.sender);
        require(holders[msg.sender].reward > 0, "Nothing claim");

        address sender = msg.sender;
        uint256 reward = holders[sender].reward;
        holders[sender].reward = 0;

        rewardToken.transfer(sender, reward);

        emit Claimed(sender, reward, block.timestamp);
    }
}
