//SPDX-License-Identifier: Unlicense
pragma solidity ^0.8.0;

import "@openzeppelin/contracts/token/ERC20/IERC20.sol";

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

    event Staked(
        address indexed stakeholder,
        uint256 amount,
        uint256 stakeholderIndex,
        uint256 timestamp
    );

    constructor(address _stakingToken, address _rewardToken) {
        stakingToken = IERC20(_stakingToken);
        rewardToken = IERC20(_rewardToken);
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

        // TODO: разрешить контракту списывать токены с контракта staking токена
        stakingToken.transferFrom(msg.sender, address(this), _amount);

        emit Staked(msg.sender, _amount, stakeholderIndex, block.timestamp);
    }

    function unstake() public {}

    function claim() public {}
}
