const { expect } = require("chai");
const { ethers } = require("hardhat");

describe("MusicDapp", function () {
  let MusicDapp, musicDapp;
  let owner, otherAccount;
  let artistRegistryAddress, musicTokenAddress, marketplaceAddress;
  let royaltyDistributionAddress,
    fundingPoolAddress,
    accessControlAddress,
    governanceAddress;

  beforeEach(async function () {
    [owner, otherAccount] = await ethers.getSigners();

    // Deploy MusicDapp
    MusicDapp = await ethers.getContractFactory("MusicDapp");
    musicDapp = await MusicDapp.connect(owner).deploy();
    await musicDapp.waitForDeployment();

    // Extract deployed subcontracts addresses from musicDapp state
    artistRegistryAddress = await musicDapp.artistRegistry();
    musicTokenAddress = await musicDapp.musicToken();
    marketplaceAddress = await musicDapp.marketplace();
    royaltyDistributionAddress = await musicDapp.royaltyDistribution();
    fundingPoolAddress = await musicDapp.fundingPool();
    accessControlAddress = await musicDapp.accessControl();
    governanceAddress = await musicDapp.governance();
  });

  it("should deploy all subcontracts and assign addresses", async function () {
    expect(artistRegistryAddress).to.properAddress;
    expect(musicTokenAddress).to.properAddress;
    expect(marketplaceAddress).to.properAddress;
    expect(royaltyDistributionAddress).to.properAddress;
    expect(fundingPoolAddress).to.properAddress;
    expect(accessControlAddress).to.properAddress;
    expect(governanceAddress).to.properAddress;
  });

  it("should own all subcontracts after deployment", async function () {
    // Helper to check ownership of a contract
    const checkOwnership = async (contractAddress, contractName) => {
      const Contract = await ethers.getContractFactory(contractName);
      const contractInstance = Contract.attach(contractAddress);
      expect(await contractInstance.owner()).to.equal(
        await musicDapp.getAddress()
      );
    };

    await checkOwnership(artistRegistryAddress, "ArtistRegistry");
    await checkOwnership(musicTokenAddress, "MusicToken");
    await checkOwnership(marketplaceAddress, "Marketplace");
    await checkOwnership(royaltyDistributionAddress, "RoyaltyDistribution");
    await checkOwnership(fundingPoolAddress, "FundingPool");
    await checkOwnership(accessControlAddress, "AccessControl");
    await checkOwnership(governanceAddress, "TokenGovernance");
  });

  describe("updateContractAddresses", function () {
    it("should only allow owner to call updateContractAddresses", async function () {
      await expect(
        musicDapp
          .connect(otherAccount)
          .updateContractAddresses(
            ethers.ZeroAddress,
            ethers.ZeroAddress,
            ethers.ZeroAddress,
            ethers.ZeroAddress,
            ethers.ZeroAddress,
            ethers.ZeroAddress,
            ethers.ZeroAddress
          )
      ).to.be.reverted;
    });

    it("should update only provided addresses (non-zero) and keep others unchanged", async function () {
      // Deploy dummy contracts to update to
      const DummyContract = await ethers.getContractFactory("ArtistRegistry");
      const dummyArtistRegistry = await DummyContract.deploy();
      await dummyArtistRegistry.waitForDeployment();

      // Before update: check current address
      const oldArtistRegistry = await musicDapp.artistRegistry();

      // Update artistRegistry to dummy address only
      await musicDapp.updateContractAddresses(
        await dummyArtistRegistry.getAddress(),
        ethers.ZeroAddress,
        ethers.ZeroAddress,
        ethers.ZeroAddress,
        ethers.ZeroAddress,
        ethers.ZeroAddress,
        ethers.ZeroAddress
      );

      // Confirm updated
      expect(await musicDapp.artistRegistry()).to.equal(
        await dummyArtistRegistry.getAddress()
      );

      // Confirm others unchanged
      expect(await musicDapp.musicToken()).to.equal(musicTokenAddress);
      expect(await musicDapp.marketplace()).to.equal(marketplaceAddress);
      expect(await musicDapp.royaltyDistribution()).to.equal(
        royaltyDistributionAddress
      );
      expect(await musicDapp.fundingPool()).to.equal(fundingPoolAddress);
      expect(await musicDapp.accessControl()).to.equal(accessControlAddress);
      expect(await musicDapp.governance()).to.equal(governanceAddress);
    });
  });
});
