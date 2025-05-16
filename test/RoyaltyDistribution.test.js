const { expect } = require("chai");
const { ethers } = require("hardhat");
const { bigint } = require("hardhat/internal/core/params/argumentTypes");

describe("RoyaltyDistribution", function () {
  let RoyaltyDistribution;
  let royalty;
  let owner, artist, collaborator1, collaborator2, other;

  beforeEach(async function () {
    [owner, artist, collaborator1, collaborator2, other] =
      await ethers.getSigners();
    RoyaltyDistribution = await ethers.getContractFactory(
      "RoyaltyDistribution"
    );
    royalty = await RoyaltyDistribution.deploy();
    await royalty.waitForDeployment();
  });

  describe("addRoyalty", function () {
    it("should add royalties correctly", async function () {
      const amount = ethers.parseEther("1");
      await royalty
        .connect(owner)
        .addRoyalty(artist.address, 1, amount, { value: amount });

      const [total, withdrawn, available] = await royalty.getTokenRoyalties(
        artist.address,
        1
      );
      expect(total).to.equal(amount);
      expect(withdrawn).to.equal(0);
      expect(available).to.equal(amount);

      const artistRoyalties = await royalty.getAvailableRoyalties(
        artist.address
      );
      expect(artistRoyalties).to.equal(amount);
    });

    it("should revert if msg.value does not match amount", async function () {
      await expect(
        royalty
          .connect(owner)
          .addRoyalty(artist.address, 1, ethers.parseEther("1"), {
            value: ethers.parseEther("0.5"),
          })
      ).to.be.revertedWith("Amount must match sent value");
    });
  });

  describe("addCollaborator", function () {
    beforeEach(async function () {
      await royalty
        .connect(owner)
        .addRoyalty(artist.address, 1, ethers.parseEther("1"), {
          value: ethers.parseEther("1"),
        });
    });

    it("should add a new collaborator", async function () {
      await royalty
        .connect(artist)
        .addCollaborator(1, collaborator1.address, 20);
      const [addresses, shares] = await royalty.getCollaborators(
        artist.address,
        1
      );

      expect(addresses[0]).to.equal(collaborator1.address);
      expect(shares[0]).to.equal(20);
    });

    it("should revert on duplicate collaborator", async function () {
      await royalty
        .connect(artist)
        .addCollaborator(1, collaborator1.address, 10);
      await expect(
        royalty.connect(artist).addCollaborator(1, collaborator1.address, 10)
      ).to.be.revertedWith("Collaborator already added");
    });

    it("should revert if share percentage exceeds 100%", async function () {
      await royalty
        .connect(artist)
        .addCollaborator(1, collaborator1.address, 70);
      await expect(
        royalty.connect(artist).addCollaborator(1, collaborator2.address, 40)
      ).to.be.revertedWith("Total share percentage exceeds 100%");
    });
  });

  describe("withdrawRoyalties", function () {
    beforeEach(async function () {
      await royalty
        .connect(owner)
        .addRoyalty(artist.address, 1, ethers.parseEther("1"), {
          value: ethers.parseEther("1"),
        });
    });

    it("should allow artist to withdraw full royalty", async function () {
      const before = await ethers.provider.getBalance(artist.address);
      const tx = await royalty.connect(artist).withdrawRoyalties();
      const receipt = await tx.wait();
      const gas = BigInt(receipt.gasUsed) * BigInt(receipt.cumulativeGasUsed);

      const after = await ethers.provider.getBalance(artist.address);
      expect(after).to.be.closeTo(
        before + ethers.parseEther("1") - gas,
        ethers.parseEther("0.01")
      );
    });

    it("should revert if no royalties are available", async function () {
      await royalty.connect(artist).withdrawRoyalties();
      await expect(
        royalty.connect(artist).withdrawRoyalties()
      ).to.be.revertedWith("No royalties available");
    });
  });

  describe("withdrawTokenRoyalties", function () {
    beforeEach(async function () {
      await royalty
        .connect(owner)
        .addRoyalty(artist.address, 1, ethers.parseEther("1"), {
          value: ethers.parseEther("1"),
        });

      await royalty
        .connect(artist)
        .addCollaborator(1, collaborator1.address, 25);
      await royalty
        .connect(artist)
        .addCollaborator(1, collaborator2.address, 25);
    });

    it("should split royalties among artist and collaborators", async function () {
      const beforeArtist = await ethers.provider.getBalance(artist.address);
      const beforeCol1 = await ethers.provider.getBalance(
        collaborator1.address
      );
      const beforeCol2 = await ethers.provider.getBalance(
        collaborator2.address
      );

      const tx = await royalty.connect(artist).withdrawTokenRoyalties(1);
      const receipt = await tx.wait();
      const gas = BigInt(receipt.gasUsed) * BigInt(receipt.cumulativeGasUsed);

      const afterArtist = await ethers.provider.getBalance(artist.address);
      const afterCol1 = await ethers.provider.getBalance(collaborator1.address);
      const afterCol2 = await ethers.provider.getBalance(collaborator2.address);

      // Each gets 25%, artist gets 50%
      expect(afterArtist).to.be.closeTo(
        beforeArtist + ethers.parseEther("0.5") - gas,
        ethers.parseEther("0.01")
      );
      expect(afterCol1).to.equal(beforeCol1 + ethers.parseEther("0.25"));
      expect(afterCol2).to.equal(beforeCol2 + ethers.parseEther("0.25"));
    });

    it("should revert if there are no royalties to withdraw", async function () {
      await royalty.connect(artist).withdrawTokenRoyalties(1);
      await expect(
        royalty.connect(artist).withdrawTokenRoyalties(1)
      ).to.be.revertedWith("No royalties available for this token");
    });
  });
});
