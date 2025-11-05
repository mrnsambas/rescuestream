import { expect } from "chai";
import { ethers } from "hardhat";

describe("RescueStream Contracts", function () {
  it("sets and reads a position, emits event", async function () {
    const [owner, user] = await ethers.getSigners();

    const LendingAdapter = await ethers.getContractFactory("LendingAdapter");
    const lending = await LendingAdapter.deploy();
    await lending.waitForDeployment();

    const positionId = ethers.keccak256(ethers.toUtf8Bytes("protocol:user1"));
    await expect(lending.connect(owner).setPosition(positionId, user.address, 100n, 50n))
      .to.emit(lending, "PositionUpdated");

    const pos = await lending.getPosition(positionId);
    expect(pos.owner).to.eq(user.address);
    expect(pos.collateral).to.eq(100n);
    expect(pos.debt).to.eq(50n);
  });

  it("only owner can set position and perform rescue", async function () {
    const [owner, user] = await ethers.getSigners();
    const LendingAdapter = await ethers.getContractFactory("LendingAdapter");
    const lending = await LendingAdapter.deploy();
    await lending.waitForDeployment();

    const RescueHelper = await ethers.getContractFactory("RescueHelper");
    const rescue = await RescueHelper.deploy(await lending.getAddress());
    await rescue.waitForDeployment();

    const positionId = ethers.keccak256(ethers.toUtf8Bytes("p:u1"));

    await expect(lending.connect(user).setPosition(positionId, user.address, 1n, 1n)).to.be.reverted;
    await lending.connect(owner).setPosition(positionId, user.address, 1n, 1n);

    // Give RescueHelper permission to call setPosition as owner
    await (await lending.connect(owner).transferOwnership(await rescue.getAddress())).wait();

    await expect(rescue.connect(user).rescueTopUp(positionId, user.address, 10n, 1n)).to.be.reverted;
    // adjust cap to allow top-up of 9
    await (await rescue.connect(owner).setMaxTopUpDelta(9n)).wait();
    await expect(rescue.connect(owner).rescueTopUp(positionId, user.address, 10n, 1n))
      .to.emit(rescue, "RescueExecuted");
  });
});


