const { expect } = require("chai");
const {
  loadFixture,
} = require("@nomicfoundation/hardhat-toolbox/network-helpers");

describe("ArtistRegistry", function () {
  async function deployArtistRegistryFixture() {
    const [owner, artist1, artist2, artist3] = await ethers.getSigners();
    const ArtistRegistry = await ethers.getContractFactory("ArtistRegistry");
    const artistRegistry = await ArtistRegistry.deploy();
    await artistRegistry.waitForDeployment();

    return { artistRegistry, owner, artist1, artist2, artist3 };
  }

  describe("Deployment", function () {
    it("Should set the right owner", async function () {
      const { artistRegistry, owner } = await loadFixture(
        deployArtistRegistryFixture
      );
      expect(await artistRegistry.owner()).to.equal(owner.address);
    });

    it("Should initialize with zero artists", async function () {
      const { artistRegistry } = await loadFixture(deployArtistRegistryFixture);
      expect(await artistRegistry.artistCount()).to.equal(0);
    });
  });

  describe("Artist Registration", function () {
    it("Should register a new artist", async function () {
      const { artistRegistry, artist1 } = await loadFixture(
        deployArtistRegistryFixture
      );

      await expect(
        artistRegistry
          .connect(artist1)
          .registerArtist("Artist One", "ipfs://profile1", 10)
      )
        .to.emit(artistRegistry, "ArtistRegistered")
        .withArgs(artist1.address, "Artist One");

      expect(await artistRegistry.artistCount()).to.equal(1);
      expect(await artistRegistry.registeredArtists(artist1.address)).to.be
        .true;

      const artistInfo = await artistRegistry.getArtist(artist1.address);
      expect(artistInfo[0]).to.equal("Artist One");
      expect(artistInfo[1]).to.equal("ipfs://profile1");
      expect(artistInfo[2]).to.equal(artist1.address);
      expect(artistInfo[3]).to.be.false; // isVerified
      expect(artistInfo[4]).to.equal(10); // royaltyPercentage
    });

    it("Should prevent registering an artist twice", async function () {
      const { artistRegistry, artist1 } = await loadFixture(
        deployArtistRegistryFixture
      );

      await artistRegistry
        .connect(artist1)
        .registerArtist("Artist One", "ipfs://profile1", 10);

      await expect(
        artistRegistry
          .connect(artist1)
          .registerArtist("Artist One Again", "ipfs://profile1-new", 15)
      ).to.be.revertedWith("Artist already registered");
    });

    it("Should enforce maximum royalty percentage", async function () {
      const { artistRegistry, artist1 } = await loadFixture(
        deployArtistRegistryFixture
      );

      await expect(
        artistRegistry
          .connect(artist1)
          .registerArtist("Artist One", "ipfs://profile1", 26)
      ).to.be.revertedWith("Royalty percentage too high");

      // This should work
      await artistRegistry
        .connect(artist1)
        .registerArtist("Artist One", "ipfs://profile1", 25);
    });
  });

  describe("Artist Verification", function () {
    it("Should verify an artist", async function () {
      const { artistRegistry, owner, artist1 } = await loadFixture(
        deployArtistRegistryFixture
      );

      await artistRegistry
        .connect(artist1)
        .registerArtist("Artist One", "ipfs://profile1", 10);

      await expect(artistRegistry.connect(owner).verifyArtist(artist1.address))
        .to.emit(artistRegistry, "ArtistVerified")
        .withArgs(artist1.address);

      const artistInfo = await artistRegistry.getArtist(artist1.address);
      expect(artistInfo[3]).to.be.true; // isVerified

      expect(await artistRegistry.isVerifiedArtist(artist1.address)).to.be.true;
    });

    it("Should only allow owner to verify artists", async function () {
      const { artistRegistry, artist1, artist2 } = await loadFixture(
        deployArtistRegistryFixture
      );

      await artistRegistry
        .connect(artist1)
        .registerArtist("Artist One", "ipfs://profile1", 10);

      await expect(
        artistRegistry.connect(artist2).verifyArtist(artist1.address)
      ).to.be.revertedWithCustomError(
        artistRegistry,
        "OwnableUnauthorizedAccount"
      );
    });

    it("Should prevent verifying an unregistered artist", async function () {
      const { artistRegistry, owner, artist1 } = await loadFixture(
        deployArtistRegistryFixture
      );

      await expect(
        artistRegistry.connect(owner).verifyArtist(artist1.address)
      ).to.be.revertedWith("Artist not registered");
    });

    it("Should prevent verifying an already verified artist", async function () {
      const { artistRegistry, owner, artist1 } = await loadFixture(
        deployArtistRegistryFixture
      );

      await artistRegistry
        .connect(artist1)
        .registerArtist("Artist One", "ipfs://profile1", 10);
      await artistRegistry.connect(owner).verifyArtist(artist1.address);

      await expect(
        artistRegistry.connect(owner).verifyArtist(artist1.address)
      ).to.be.revertedWith("Artist already verified");
    });
  });

  describe("Profile Updates", function () {
    it("Should update artist profile", async function () {
      const { artistRegistry, artist1 } = await loadFixture(
        deployArtistRegistryFixture
      );

      await artistRegistry
        .connect(artist1)
        .registerArtist("Artist One", "ipfs://profile1", 10);

      await expect(
        artistRegistry
          .connect(artist1)
          .updateProfile("Updated Artist", "ipfs://updated", 15)
      )
        .to.emit(artistRegistry, "ArtistProfileUpdated")
        .withArgs(artist1.address);

      const artistInfo = await artistRegistry.getArtist(artist1.address);
      expect(artistInfo[0]).to.equal("Updated Artist");
      expect(artistInfo[1]).to.equal("ipfs://updated");
      expect(artistInfo[4]).to.equal(15); // royaltyPercentage
    });

    it("Should enforce maximum royalty percentage on updates", async function () {
      const { artistRegistry, artist1 } = await loadFixture(
        deployArtistRegistryFixture
      );

      await artistRegistry
        .connect(artist1)
        .registerArtist("Artist One", "ipfs://profile1", 10);

      await expect(
        artistRegistry
          .connect(artist1)
          .updateProfile("Artist One", "ipfs://profile1", 26)
      ).to.be.revertedWith("Royalty percentage too high");
    });

    it("Should prevent updating unregistered artist profile", async function () {
      const { artistRegistry, artist1 } = await loadFixture(
        deployArtistRegistryFixture
      );

      await expect(
        artistRegistry
          .connect(artist1)
          .updateProfile("Artist One", "ipfs://profile1", 10)
      ).to.be.revertedWith("Artist not registered");
    });
  });

  describe("Artist Information", function () {
    it("Should check if address is registered artist", async function () {
      const { artistRegistry, artist1, artist2 } = await loadFixture(
        deployArtistRegistryFixture
      );

      await artistRegistry
        .connect(artist1)
        .registerArtist("Artist One", "ipfs://profile1", 10);

      expect(await artistRegistry.isRegisteredArtist(artist1.address)).to.be
        .true;
      expect(await artistRegistry.isRegisteredArtist(artist2.address)).to.be
        .false;
    });

    it("Should check if address is verified artist", async function () {
      const { artistRegistry, owner, artist1, artist2 } = await loadFixture(
        deployArtistRegistryFixture
      );

      await artistRegistry
        .connect(artist1)
        .registerArtist("Artist One", "ipfs://profile1", 10);
      await artistRegistry
        .connect(artist2)
        .registerArtist("Artist Two", "ipfs://profile2", 15);
      await artistRegistry.connect(owner).verifyArtist(artist1.address);

      expect(await artistRegistry.isVerifiedArtist(artist1.address)).to.be.true;
      expect(await artistRegistry.isVerifiedArtist(artist2.address)).to.be
        .false;
    });

    it("Should revert when getting non-registered artist", async function () {
      const { artistRegistry, artist1 } = await loadFixture(
        deployArtistRegistryFixture
      );

      await expect(
        artistRegistry.getArtist(artist1.address)
      ).to.be.revertedWith("Artist not registered");
    });
  });
});
