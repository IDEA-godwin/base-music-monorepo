const { expect } = require("chai");
const {
  loadFixture,
} = require("@nomicfoundation/hardhat-toolbox/network-helpers");
const { ethers } = require("hardhat");

describe("Marketplace", function () {
  async function deployMarketplaceFixture() {
    const [owner, artist, buyer1, buyer2, platformWallet] =
      await ethers.getSigners();

    // Deploy MusicToken mock
    const MusicTokenMock = await ethers.getContractFactory("MusicTokenMock");
    const musicToken = await MusicTokenMock.deploy();

    // Deploy RoyaltyDistribution mock
    const RoyaltyDistributionMock = await ethers.getContractFactory(
      "RoyaltyDistributionMock"
    );
    const royaltyDistribution = await RoyaltyDistributionMock.deploy();

    // Deploy FundingPool mock
    const FundingPoolMock = await ethers.getContractFactory("FundingPoolMock");
    const fundingPool = await FundingPoolMock.deploy();

    // Deploy Marketplace
    const Marketplace = await ethers.getContractFactory("Marketplace");
    const marketplace = await Marketplace.deploy(
      await musicToken.getAddress(),
      await royaltyDistribution.getAddress(),
      await fundingPool.getAddress(),
      platformWallet.address
    );

    // Setup mock token data
    const tokenId = 1;
    const price = ethers.parseEther("0.1");
    const royaltyPercentage = 10; // 10%
    const maxSupply = 100;

    await musicToken.setTokenData(
      tokenId,
      "Test Token",
      "Test URI",
      artist.address,
      price,
      royaltyPercentage,
      true,
      maxSupply,
      0
    );

    return {
      marketplace,
      musicToken,
      royaltyDistribution,
      fundingPool,
      owner,
      artist,
      buyer1,
      buyer2,
      platformWallet,
      tokenId,
      price,
    };
  }

  describe("Deployment", function () {
    it("Should set the correct addresses", async function () {
      const {
        marketplace,
        musicToken,
        royaltyDistribution,
        fundingPool,
        platformWallet,
      } = await loadFixture(deployMarketplaceFixture);

      expect(await marketplace.musicToken()).to.equal(
        await musicToken.getAddress()
      );
      expect(await marketplace.royaltyDistribution()).to.equal(
        await royaltyDistribution.getAddress()
      );
      expect(await marketplace.fundingPool()).to.equal(
        await fundingPool.getAddress()
      );
      expect(await marketplace.platformWallet()).to.equal(
        platformWallet.address
      );
      expect(await marketplace.platformFeePercentage()).to.equal(2);
    });
  });

  describe("Platform Settings", function () {
    it("Should set platform fee", async function () {
      const { marketplace, owner } = await loadFixture(
        deployMarketplaceFixture
      );

      await marketplace.connect(owner).setPlatformFee(5);
      expect(await marketplace.platformFeePercentage()).to.equal(5);
    });

    it("Should revert if fee is too high", async function () {
      const { marketplace, owner } = await loadFixture(
        deployMarketplaceFixture
      );

      await expect(
        marketplace.connect(owner).setPlatformFee(11)
      ).to.be.revertedWith("Fee too high");
    });

    it("Should set platform wallet", async function () {
      const { marketplace, owner, buyer1 } = await loadFixture(
        deployMarketplaceFixture
      );

      await marketplace.connect(owner).setPlatformWallet(buyer1.address);
      expect(await marketplace.platformWallet()).to.equal(buyer1.address);
    });

    it("Should only allow owner to update settings", async function () {
      const { marketplace, buyer1 } = await loadFixture(
        deployMarketplaceFixture
      );

      await expect(
        marketplace.connect(buyer1).setPlatformFee(5)
      ).to.be.revertedWithCustomError(
        marketplace,
        "OwnableUnauthorizedAccount"
      );

      await expect(
        marketplace.connect(buyer1).setPlatformWallet(buyer1.address)
      ).to.be.revertedWithCustomError(
        marketplace,
        "OwnableUnauthorizedAccount"
      );
    });
  });

  describe("Primary Market", function () {
    it("Should buy a token from primary market", async function () {
      const {
        marketplace,
        musicToken,
        royaltyDistribution,
        fundingPool,
        buyer1,
        artist,
        tokenId,
        price,
      } = await loadFixture(deployMarketplaceFixture);

      const quantity = 2;
      const totalPrice = price * BigInt(quantity);

      // Setup mocks
      await musicToken.mock_balanceOf(artist.address, tokenId, 10);
      await musicToken.mock_safeTransferFrom();
      await musicToken.mock_mintAdditional();

      await expect(
        marketplace
          .connect(buyer1)
          .buyPrimaryToken(tokenId, quantity, { value: totalPrice })
      )
        .to.emit(marketplace, "TokenPurchased")
        .withArgs(tokenId, buyer1.address, artist.address, quantity, price);

      // Verify royaltyDistribution and fundingPool were called
      expect(await royaltyDistribution.royaltyAdded()).to.be.true;
      expect(await fundingPool.fundsAdded()).to.be.true;
    });

    it("Should revert if insufficient funds sent", async function () {
      const { marketplace, musicToken, buyer1, artist, tokenId, price } =
        await loadFixture(deployMarketplaceFixture);

      const quantity = 2;
      const insufficientAmount = price - BigInt(1);

      await expect(
        marketplace
          .connect(buyer1)
          .buyPrimaryToken(tokenId, quantity, { value: insufficientAmount })
      ).to.be.revertedWith("Insufficient funds sent");
    });

    it("Should revert if token exceeds max supply", async function () {
      const { marketplace, musicToken, buyer1, tokenId } = await loadFixture(
        deployMarketplaceFixture
      );

      // Set current supply to maxSupply
      await musicToken.setTokenData(
        tokenId,
        "Test Token",
        "Test URI",
        buyer1.address,
        ethers.parseEther("0.1"),
        10,
        true,
        100,
        100
      );

      await expect(
        marketplace
          .connect(buyer1)
          .buyPrimaryToken(tokenId, 1, { value: ethers.parseEther("0.1") })
      ).to.be.revertedWith("Not enough tokens available");
    });
  });

  describe("Secondary Market", function () {
    it("Should list a token for sale", async function () {
      const { marketplace, musicToken, buyer1, tokenId } = await loadFixture(
        deployMarketplaceFixture
      );

      const listingPrice = ethers.parseEther("0.2");
      const quantity = 1;

      // Mock token balance
      await musicToken.mock_balanceOf(buyer1.address, tokenId, quantity);
      await musicToken.mock_setApprovalForAll();

      await expect(
        marketplace
          .connect(buyer1)
          .listTokenForSale(tokenId, listingPrice, quantity)
      )
        .to.emit(marketplace, "TokenListed")
        .withArgs(tokenId, buyer1.address, listingPrice, quantity);

      const listing = await marketplace.getSecondaryListing(
        buyer1.address,
        tokenId
      );
      expect(listing[0]).to.equal(buyer1.address);
      expect(listing[1]).to.equal(listingPrice);
      expect(listing[2]).to.equal(quantity);
    });

    it("Should revert listing if token balance is insufficient", async function () {
      const { marketplace, musicToken, buyer1, tokenId } = await loadFixture(
        deployMarketplaceFixture
      );

      // Mock insufficient balance
      await musicToken.mock_balanceOf(buyer1.address, tokenId, 0);

      await expect(
        marketplace
          .connect(buyer1)
          .listTokenForSale(tokenId, ethers.parseEther("0.2"), 1)
      ).to.be.revertedWith("Insufficient token balance");
    });

    it("Should buy a token from secondary market", async function () {
      const {
        marketplace,
        musicToken,
        royaltyDistribution,
        buyer1,
        buyer2,
        tokenId,
      } = await loadFixture(deployMarketplaceFixture);

      const listingPrice = ethers.parseEther("0.2");
      const quantity = 1;

      // Setup listing
      await musicToken.mock_balanceOf(buyer1.address, tokenId, quantity);
      await musicToken.mock_setApprovalForAll();
      await marketplace
        .connect(buyer1)
        .listTokenForSale(tokenId, listingPrice, quantity);

      // Mock transfer
      await musicToken.mock_safeTransferFrom();

      await expect(
        marketplace
          .connect(buyer2)
          .buySecondaryToken(buyer1.address, tokenId, quantity, {
            value: listingPrice,
          })
      )
        .to.emit(marketplace, "TokenPurchased")
        .withArgs(
          tokenId,
          buyer2.address,
          buyer1.address,
          quantity,
          listingPrice
        );

      // Verify royalty was added
      expect(await royaltyDistribution.royaltyAdded()).to.be.true;

      // Verify listing was removed
      const listing = await marketplace.getSecondaryListing(
        buyer1.address,
        tokenId
      );
      expect(listing[0]).to.equal(ethers.ZeroAddress);
      expect(listing[1]).to.equal(0);
      expect(listing[2]).to.equal(0);
    });

    it("Should update listing when buying partial quantity", async function () {
      const { marketplace, musicToken, buyer1, buyer2, tokenId } =
        await loadFixture(deployMarketplaceFixture);

      const listingPrice = ethers.parseEther("0.2");
      const listingQuantity = 5;
      const purchaseQuantity = 2;

      // Setup listing
      await musicToken.mock_balanceOf(buyer1.address, tokenId, listingQuantity);
      await musicToken.mock_setApprovalForAll();
      await marketplace
        .connect(buyer1)
        .listTokenForSale(tokenId, listingPrice, listingQuantity);

      // Mock transfer
      await musicToken.mock_safeTransferFrom();

      await marketplace
        .connect(buyer2)
        .buySecondaryToken(buyer1.address, tokenId, purchaseQuantity, {
          value: listingPrice * BigInt(purchaseQuantity),
        });

      // Verify listing was updated
      const listing = await marketplace.getSecondaryListing(
        buyer1.address,
        tokenId
      );
      expect(listing[0]).to.equal(buyer1.address);
      expect(listing[1]).to.equal(listingPrice);
      expect(listing[2]).to.equal(listingQuantity - purchaseQuantity);
    });

    it("Should cancel a listing", async function () {
      const { marketplace, musicToken, buyer1, tokenId } = await loadFixture(
        deployMarketplaceFixture
      );

      // Setup listing
      await musicToken.mock_balanceOf(buyer1.address, tokenId, 1);
      await musicToken.mock_setApprovalForAll();
      await marketplace
        .connect(buyer1)
        .listTokenForSale(tokenId, ethers.parseEther("0.2"), 1);

      await expect(marketplace.connect(buyer1).cancelListing(tokenId))
        .to.emit(marketplace, "TokenDelisted")
        .withArgs(tokenId, buyer1.address);

      // Verify listing was removed
      const listing = await marketplace.getSecondaryListing(
        buyer1.address,
        tokenId
      );
      expect(listing[0]).to.equal(ethers.ZeroAddress);
    });

    it("Should revert when cancelling non-existent listing", async function () {
      const { marketplace, buyer1, tokenId } = await loadFixture(
        deployMarketplaceFixture
      );

      await expect(
        marketplace.connect(buyer1).cancelListing(tokenId)
      ).to.be.revertedWith("No active listing found");
    });
  });
});
