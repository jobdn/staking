//SPDX-License-Identifier: Unlicense
pragma solidity ^0.8.0;

contract Staking {
    mapping(address => bool) public stakeholders;
    mapping(address => uint256) public stakes;

    function stakeOf(address _stakeholder) public view returns (uint256) {
        return stakes[_stakeholder];
    }

    function stake(uint256 _amount) public {
        stakes[msg.sender] += _amount;
    }

    function unstake() public {}

    function claim() public {}
}
