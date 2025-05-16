const { expect } = require("chai");
const { ethers } = require("hardhat");

describe("MusicToken", function () {
  let artistRegistry, musicToken;
  let owner, artist, other;

  beforeEach(async () => {
    [owner, artist, other] = await ethers.getSigners();

    const ArtistRegistry = await ethers.getContractFactory("ArtistRegistry");
    artistRegistry = await ArtistRegistry.deploy();
    await artistRegistry.waitForDeployment();

    const MusicToken = await ethers.getContractFactory("MusicToken");
    musicToken = await MusicToken.deploy(artistRegistry.getAddress());
    await musicToken.waitForDeployment();

    // Register and verify the artist
    await artistRegistry.connect(artist).registerArtist(
      "ArtistName",
      "ipfs://profile",
      10 // 10% royalty
    );
    await artistRegistry.connect(owner).verifyArtist(artist.address);
  });

  it("should allow a verified artist to create a music token", async () => {
    const tx = await musicToken
      .connect(artist)
      .createMusicToken(
        "Cool Song",
        "ipfs://metadata",
        ethers.parseEther("1"),
        10,
        true,
        10,
        2
      );
    const receipt = await tx.wait();
    const event = receipt.logs.find(
      (log) => log.fragment.name === "MusicTokenCreated"
    );
    const tokenId = event.args.tokenId;

    expect(await musicToken.balanceOf(artist.address, tokenId)).to.equal(2);
    const data = await musicToken.getTokenData(tokenId);
    expect(data.title).to.equal("Cool Song");
  });

  it("should revert if an unverified artist tries to create a token", async () => {
    await expect(
      musicToken
        .connect(other)
        .createMusicToken("Unauthorized", "ipfs://meta", 100, 5, false, 100, 10)
    ).to.be.revertedWith("Only verified artists can create tokens");
  });

  it("should allow an artist to update token price", async () => {
    const tx = await musicToken
      .connect(artist)
      .createMusicToken("Pricy Song", "ipfs://metadata", 200, 5, false, 100, 1);
    const receipt = await tx.wait();
    const event = receipt.logs.find(
      (log) => log.fragment.name === "MusicTokenCreated"
    );
    const tokenId = event.args.tokenId;

    await musicToken.connect(artist).updateTokenPrice(tokenId, 500);
    const price = await musicToken.getTokenPrice(tokenId);
    expect(price).to.equal(500);
  });

  it("should not allow others to update price", async () => {
    const tx = await musicToken
      .connect(artist)
      .createMusicToken("Price Locked", "ipfs://locked", 200, 5, false, 100, 1);
    const receipt = await tx.wait();
    const event = receipt.logs.find(
      (log) => log.fragment.name === "MusicTokenCreated"
    );
    const tokenId = event.args.tokenId;

    await expect(
      musicToken.connect(other).updateTokenPrice(tokenId, 500)
    ).to.be.revertedWith("Only token artist can update price");
  });

  it("should allow minting additional tokens if within supply limit", async () => {
    const tx = await musicToken
      .connect(artist)
      .createMusicToken("MintMore", "ipfs://mint", 100, 5, false, 50, 1);

    const receipt = await tx.wait();
    const event = receipt.logs.find(
      (log) => log.fragment.name === "MusicTokenCreated"
    );

    const tokenId = event.args.tokenId;

    await musicToken.connect(artist).mintAdditional(tokenId, 2);

    expect(await musicToken["totalSupply(uint256)"](tokenId)).to.equal(3);
  });

  it("should revert if minting exceeds max supply", async () => {
    const tx = await musicToken
      .connect(artist)
      .createMusicToken("MaxedOut", "ipfs://maxed", 100, 5, false, 2, 1);
    const receipt = await tx.wait();
    const event = receipt.logs.find(
      (log) => log.fragment.name === "MusicTokenCreated"
    );

    const tokenId = event.args.tokenId;

    await expect(
      musicToken.connect(artist).mintAdditional(tokenId, 2)
    ).to.be.revertedWith("Would exceed max supply");
  });

  it("should return correct token URI", async () => {
    const tx = await musicToken
      .connect(artist)
      .createMusicToken("URI Tune", "ipfs://token-uri", 100, 5, false, 10, 10);
    const receipt = await tx.wait();
    const event = receipt.logs.find(
      (log) => log.fragment.name === "MusicTokenCreated"
    );

    const tokenId = event.args.tokenId;


    const uri = await musicToken.uri(Number(tokenId));
    expect(uri).to.equal("ipfs://token-uri");
  });

  it("should revert uri() for nonexistent token", async () => {
    await expect(musicToken.uri(999)).to.be.revertedWith(
      "URI query for nonexistent token"
    );
  });

  it("should revert getTokenData for nonexistent token", async () => {
    await expect(musicToken.getTokenData(404)).to.be.revertedWith(
      "Token does not exist"
    );
  });

  it("should revert getTokenPrice for nonexistent token", async () => {
    await expect(musicToken.getTokenPrice(123)).to.be.revertedWith(
      "Token does not exist"
    );
  });
});
