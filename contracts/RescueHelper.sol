// SPDX-License-Identifier: MIT
pragma solidity ^0.8.20;

import "@openzeppelin/contracts/access/Ownable.sol";
import "@openzeppelin/contracts/security/ReentrancyGuard.sol";

interface ILendingAdapter {
    function setPosition(bytes32 positionId, address owner, uint256 collateral, uint256 debt) external;
    function positions(bytes32 positionId) external view returns (address owner, uint256 collateral, uint256 debt, uint256 lastUpdated);
}

contract RescueHelper is Ownable, ReentrancyGuard {
    ILendingAdapter public lending;
    uint256 public maxTopUpDelta; // max allowed increase in collateral per rescue

    event RescueExecuted(bytes32 indexed positionId, address indexed rescuer, uint256 collateralDelta, uint256 timestamp);

    constructor(address _lending) {
        lending = ILendingAdapter(_lending);
        maxTopUpDelta = 1e18; // default small cap; update via setMaxTopUpDelta
    }

    function setMaxTopUpDelta(uint256 newCap) external onlyOwner {
        maxTopUpDelta = newCap;
    }

    function rescueTopUp(
        bytes32 positionId,
        address owner,
        uint256 newCollateral,
        uint256 debt
    ) external onlyOwner nonReentrant {
        (address currentOwner, uint256 currentCollateral,,) = lending.positions(positionId);
        require(currentOwner == owner, "owner mismatch");
        require(newCollateral >= currentCollateral, "collateral must not decrease");
        uint256 delta = newCollateral - currentCollateral;
        require(delta <= maxTopUpDelta, "top-up exceeds cap");
        lending.setPosition(positionId, owner, newCollateral, debt);
        emit RescueExecuted(positionId, msg.sender, delta, block.timestamp);
    }
}


