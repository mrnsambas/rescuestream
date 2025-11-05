// SPDX-License-Identifier: MIT
pragma solidity ^0.8.20;

import "@openzeppelin/contracts/access/Ownable.sol";

contract LendingAdapter is Ownable {
    struct Position {
        address owner;
        uint256 collateral;
        uint256 debt;
        uint256 lastUpdated;
    }

    mapping(bytes32 => Position) public positions;
    address public helper;

    event PositionUpdated(
        bytes32 indexed positionId,
        address indexed owner,
        uint256 collateral,
        uint256 debt,
        uint256 timestamp
    );

    event HelperUpdated(address indexed helper);

    function setHelper(address _helper) external onlyOwner {
        helper = _helper;
        emit HelperUpdated(_helper);
    }

    function setPosition(
        bytes32 positionId,
        address positionOwner,
        uint256 collateral,
        uint256 debt
    ) external {
        require(msg.sender == owner() || msg.sender == helper, "not authorized");
        positions[positionId] = Position(positionOwner, collateral, debt, block.timestamp);
        emit PositionUpdated(positionId, positionOwner, collateral, debt, block.timestamp);
    }

    function getPosition(bytes32 positionId) external view returns (Position memory) {
        return positions[positionId];
    }
}


