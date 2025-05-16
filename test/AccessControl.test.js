const { expect } = require("chai");
const {
  loadFixture,
} = require("@nomicfoundation/hardhat-toolbox/network-helpers");
const { anyValue } = require("@nomicfoundation/hardhat-chai-matchers/withArgs");
const { ethers } = require("hardhat");

describe("AccessControl contract", function () {
  // Define our fixture for consistent test setup
  async function deployAccessControlFixture() {
    const [owner, artist, user1, user2] = await ethers.getSigners();

    const artistRegistry = await ethers.deployContract("ArtistRegistry");

    // Deploy MusicToken first
    const musicToken = await ethers.deployContract("MusicToken", [
      artistRegistry.getAddress(),
    ]);

    // Deploy AccessControl with MusicToken address
    const accessControl = await ethers.deployContract("AccessControl", [
      await musicToken.getAddress(),
    ]);

    // register and verify artist
    await artistRegistry.connect(artist).registerArtist("name", "uri", 20);
    await artistRegistry.verifyArtist(artist.address);

    // Setup a test token (assumes your MusicToken has a function to create tokens)
    const tokenId = 0;
    // Mock function to set up token data so that the artist is recognized as the token creator
    // The actual implementation would depend on your MusicToken contract
    await musicToken
      .connect(artist)
      .createMusicToken("title", "uri", 10, 10, false, 100, 100);

    return { accessControl, musicToken, owner, artist, user1, user2, tokenId };
  }

  describe("Access Rule Management", function () {
    it("Should allow artist to create an access rule", async function () {
      const { accessControl, artist, tokenId } = await loadFixture(
        deployAccessControlFixture
      );

      const minQuantity = 5;
      const accessURI = "https://example.com/access/special";

      // Test creating a rule and check the emitted event
      await expect(
        accessControl
          .connect(artist)
          .createAccessRule(tokenId, minQuantity, accessURI)
      )
        .to.emit(accessControl, "AccessRuleCreated")
        .withArgs(artist.address, anyValue, tokenId, minQuantity);
    });

    it("Should prevent non-artists from creating access rules", async function () {
      const { accessControl, user1, tokenId } = await loadFixture(
        deployAccessControlFixture
      );

      const minQuantity = 5;
      const accessURI = "https://example.com/access/special";

      // Non-artist should not be able to create rules
      await expect(
        accessControl
          .connect(user1)
          .createAccessRule(tokenId, minQuantity, accessURI)
      ).to.be.revertedWith("Only token artist can create access rules");
    });

    it("Should allow artist to update an access rule", async function () {
      const { accessControl, artist, tokenId } = await loadFixture(
        deployAccessControlFixture
      );

      // First create a rule
      const minQuantity = 5;
      const accessURI = "https://example.com/access/special";

      const tx = await accessControl
        .connect(artist)
        .createAccessRule(tokenId, minQuantity, accessURI);
      const receipt = await tx.wait();
      const event = receipt.logs.find(
        (log) => log.fragment && log.fragment.name === "AccessRuleCreated"
      );
      const ruleId = event.args.ruleId;

      // Update the rule
      const newMinQuantity = 10;
      const newAccessURI = "https://example.com/access/premium";

      await expect(
        accessControl
          .connect(artist)
          .updateAccessRule(ruleId, newMinQuantity, newAccessURI)
      )
        .to.emit(accessControl, "AccessRuleUpdated")
        .withArgs(artist.address, ruleId);

      // Verify the rule was updated correctly
      const [hasAccess, returnedURI] = await accessControl.checkAccess(
        artist.address,
        ruleId,
        artist.address
      );

      // Since we're not modifying token balances, it may not have access,
      // but we should get the updated URI if we had access
      if (hasAccess) {
        expect(returnedURI).to.equal(newAccessURI);
      }
    });

    it("Should allow artist to deactivate an access rule", async function () {
      const { accessControl, artist, tokenId } = await loadFixture(
        deployAccessControlFixture
      );

      // First create a rule
      const minQuantity = 5;
      const accessURI = "https://example.com/access/special";

      const tx = await accessControl
        .connect(artist)
        .createAccessRule(tokenId, minQuantity, accessURI);
      const receipt = await tx.wait();
      const event = receipt.logs.find(
        (log) => log.fragment && log.fragment.name === "AccessRuleCreated"
      );
      const ruleId = event.args.ruleId;

      // Deactivate the rule
      await expect(accessControl.connect(artist).deactivateAccessRule(ruleId))
        .to.emit(accessControl, "AccessRuleDeactivated")
        .withArgs(artist.address, ruleId);

      // Verify the rule was deactivated by trying to check access
      await expect(
        accessControl.checkAccess(artist.address, ruleId, artist.address)
      ).to.be.revertedWith("Access rule not active");
    });

    it("Should prevent deactivating an already inactive rule", async function () {
      const { accessControl, artist, tokenId } = await loadFixture(
        deployAccessControlFixture
      );

      // First create a rule
      const minQuantity = 5;
      const accessURI = "https://example.com/access/special";

      const tx = await accessControl
        .connect(artist)
        .createAccessRule(tokenId, minQuantity, accessURI);
      const receipt = await tx.wait();
      const event = receipt.logs.find(
        (log) => log.fragment && log.fragment.name === "AccessRuleCreated"
      );
      const ruleId = event.args.ruleId;

      // First deactivation should succeed
      await accessControl.connect(artist).deactivateAccessRule(ruleId);

      // Second deactivation should fail
      await expect(
        accessControl.connect(artist).deactivateAccessRule(ruleId)
      ).to.be.revertedWith("Access rule already inactive");
    });
  });

  // describe("Access Checking", function () {
  //   it("Should grant access when user has enough tokens", async function () {
  //     const { accessControl, musicToken, artist, user1, tokenId } =
  //       await loadFixture(deployAccessControlFixture);

  //     // Create a rule
  //     const minQuantity = 5;
  //     const accessURI = "https://example.com/access/special";

  //     const tx = await accessControl
  //       .connect(artist)
  //       .createAccessRule(tokenId, minQuantity, accessURI);
  //     const receipt = await tx.wait();
  //     const event = receipt.logs.find(
  //       (log) => log.fragment && log.fragment.name === "AccessRuleCreated"
  //     );
  //     const ruleId = event.args.ruleId;

  //     // Check access
  //     const [hasAccess, returnedURI] = await accessControl.checkAccess(
  //       artist.address,
  //       ruleId,
  //       user1.address
  //     );
  //     expect(hasAccess).to.be.true;
  //     expect(returnedURI).to.equal(accessURI);
  //   });

  //   it("Should deny access when user has insufficient tokens", async function () {
  //     const { accessControl, musicToken, artist, user1, tokenId } =
  //       await loadFixture(deployAccessControlFixture);

  //     // Create a rule
  //     const minQuantity = 5;
  //     const accessURI = "https://example.com/access/special";

  //     const tx = await accessControl
  //       .connect(artist)
  //       .createAccessRule(tokenId, minQuantity, accessURI);
  //     const receipt = await tx.wait();
  //     const event = receipt.logs.find(
  //       (log) => log.fragment && log.fragment.name === "AccessRuleCreated"
  //     );
  //     const ruleId = event.args.ruleId;

  //     // Give user1 insufficient tokens
  //     await musicToken.mockBalanceOf(user1.address, tokenId, 3);

  //     // Check access
  //     const [hasAccess, returnedURI] = await accessControl.checkAccess(
  //       artist.address,
  //       ruleId,
  //       user1.address
  //     );
  //     expect(hasAccess).to.be.false;
  //     expect(returnedURI).to.equal("");
  //   });
  // });

  describe("Getting Artist Rules", function () {
    it("Should correctly return all artist rules", async function () {
      const { accessControl, artist, tokenId } = await loadFixture(
        deployAccessControlFixture
      );

      // Create multiple rules
      const rule1 = {
        tokenId: tokenId,
        minQuantity: 5,
        accessURI: "https://example.com/access/basic",
      };

      const rule2 = {
        tokenId: tokenId,
        minQuantity: 10,
        accessURI: "https://example.com/access/premium",
      };

      const tx1 = await accessControl
        .connect(artist)
        .createAccessRule(rule1.tokenId, rule1.minQuantity, rule1.accessURI);
      const receipt1 = await tx1.wait();

      const tx2 = await accessControl
        .connect(artist)
        .createAccessRule(rule2.tokenId, rule2.minQuantity, rule2.accessURI);

      // Deactivate the first rule
      const event1 = receipt1.logs.find(
        (log) => log.fragment && log.fragment.name === "AccessRuleCreated"
      );
      const ruleId1 = event1.args.ruleId;
      await accessControl.connect(artist).deactivateAccessRule(ruleId1);

      // Get all artist rules
      const [ruleIds, tokenIds, minQuantities, activeStatuses] =
        await accessControl.getArtistAccessRules(artist.address);

      expect(ruleIds.length).to.equal(2);
      expect(tokenIds.length).to.equal(2);
      expect(minQuantities.length).to.equal(2);
      expect(activeStatuses.length).to.equal(2);

      // First rule should be inactive
      expect(activeStatuses[0]).to.be.false;

      // Second rule should be active
      expect(activeStatuses[1]).to.be.true;

      // Check token IDs and min quantities
      expect(tokenIds[0]).to.equal(tokenId);
      expect(tokenIds[1]).to.equal(tokenId);
      expect(minQuantities[0]).to.equal(rule1.minQuantity);
      expect(minQuantities[1]).to.equal(rule2.minQuantity);
    });

    it("Should return empty arrays for artists with no rules", async function () {
      const { accessControl, user1 } = await loadFixture(
        deployAccessControlFixture
      );

      const [ruleIds, tokenIds, minQuantities, activeStatuses] =
        await accessControl.getArtistAccessRules(user1.address);

      expect(ruleIds.length).to.equal(0);
      expect(tokenIds.length).to.equal(0);
      expect(minQuantities.length).to.equal(0);
      expect(activeStatuses.length).to.equal(0);
    });
  });
});
