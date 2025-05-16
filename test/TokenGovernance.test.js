const { expect } = require("chai");
const {
  loadFixture,
} = require("@nomicfoundation/hardhat-toolbox/network-helpers");
const { time } = require("@nomicfoundation/hardhat-network-helpers");

describe("TokenGovernance", function () {
  async function deployFixture() {
    const [owner, artist, voter1, voter2] = await ethers.getSigners();

    // Deploy mock MusicToken
    const MockMusicToken = await ethers.getContractFactory("MockMusicToken");
    const musicToken = await MockMusicToken.deploy();
    await musicToken.waitForDeployment();

    // Deploy TokenGovernance
    const TokenGovernance = await ethers.getContractFactory("TokenGovernance");
    const governance = await TokenGovernance.deploy(
      await musicToken.getAddress()
    );
    await governance.waitForDeployment();

    // Setup mock token data
    const tokenId = 1;

    // IMPORTANT: Set the artist address BEFORE creating proposals
    await musicToken.setTokenData(tokenId, artist.address);

    // Mint tokens to voters
    await musicToken.mint(artist.address, tokenId, 70);
    await musicToken.mint(voter1.address, tokenId, 20);
    await musicToken.mint(voter2.address, tokenId, 10);

    // Verify artist is set correctly
    const tokenData = await musicToken.getTokenData(tokenId);
    console.log("Artist address in token data:", tokenData[2]);
    console.log("Test artist address:", artist.address);

    return { governance, musicToken, owner, artist, voter1, voter2, tokenId };
  }

  describe("Deployment", function () {
    it("Should set the right owner", async function () {
      const { governance, owner } = await loadFixture(deployFixture);
      expect(await governance.owner()).to.equal(owner.address);
    });

    it("Should set the correct music token address", async function () {
      const { governance, musicToken } = await loadFixture(deployFixture);
      expect(await governance.musicToken()).to.equal(
        await musicToken.getAddress()
      );
    });
  });

  describe("Proposal Creation", function () {
    it("Should allow artist to create proposal", async function () {
      const { governance, artist, tokenId } = await loadFixture(deployFixture);

      const description = "Test Proposal";
      const tx = await governance
        .connect(artist)
        .createProposal(tokenId, description);

      // Get the transaction receipt to extract the actual event data
      const receipt = await tx.wait();
      const event = receipt.logs.find(
        (log) => governance.interface.parseLog(log).name === "ProposalCreated"
      );

      // Verify the event was emitted with correct parameters
      expect(event).to.not.be.undefined;
      const parsedEvent = governance.interface.parseLog(event);
      expect(parsedEvent.args.proposalId).to.equal(0);
      expect(parsedEvent.args.artist).to.equal(artist.address);
      expect(parsedEvent.args.tokenId).to.equal(tokenId);
      expect(parsedEvent.args.description).to.equal(description);

      // Just check the end time is roughly 3 days from the start time
      const startTime = parsedEvent.args.startTime;
      const endTime = parsedEvent.args.endTime;
      expect(endTime - startTime).to.equal(3 * 24 * 60 * 60); // 3 days
    });

    it("Should reject proposal creation from non-artist", async function () {
      const { governance, voter1, tokenId } = await loadFixture(deployFixture);

      await expect(
        governance.connect(voter1).createProposal(tokenId, "Test")
      ).to.be.revertedWith("Only token artist can create proposals");
    });

    it("Should track artist proposals correctly", async function () {
      const { governance, artist, tokenId } = await loadFixture(deployFixture);

      await governance.connect(artist).createProposal(tokenId, "Proposal 1");

      const artistProposals = await governance.getArtistProposals(
        artist.address
      );
      expect(artistProposals.length).to.equal(1);
      expect(artistProposals[0]).to.equal(0);
    });
  });

  describe("Voting", function () {
    it("Should allow token holders to vote", async function () {
      const { governance, artist, voter1, tokenId } = await loadFixture(
        deployFixture
      );

      await governance.connect(artist).createProposal(tokenId, "Test Proposal");

      await expect(governance.connect(voter1).castVote(0, true))
        .to.emit(governance, "VoteCast")
        .withArgs(0, voter1.address, true, 20);

      const proposal = await governance.getProposalDetails(0);
      expect(proposal.forVotes).to.equal(20);
    });

    it("Should prevent double voting", async function () {
      const { governance, artist, voter1, tokenId } = await loadFixture(
        deployFixture
      );

      await governance.connect(artist).createProposal(tokenId, "Test Proposal");
      await governance.connect(voter1).castVote(0, true);

      await expect(
        governance.connect(voter1).castVote(0, false)
      ).to.be.revertedWith("Already voted");
    });

    it("Should track votes correctly", async function () {
      const { governance, artist, voter1, voter2, tokenId } = await loadFixture(
        deployFixture
      );

      await governance.connect(artist).createProposal(tokenId, "Test Proposal");
      await governance.connect(voter1).castVote(0, true);
      await governance.connect(voter2).castVote(0, false);

      const proposal = await governance.getProposalDetails(0);
      expect(proposal.forVotes).to.equal(20);
      expect(proposal.againstVotes).to.equal(10);
    });

    it("Should prevent voting without token balance", async function () {
      const { governance, artist, owner, tokenId } = await loadFixture(
        deployFixture
      );

      await governance.connect(artist).createProposal(tokenId, "Test Proposal");

      await expect(
        governance.connect(owner).castVote(0, true)
      ).to.be.revertedWith("No voting power");
    });

    it("Should prevent voting after deadline", async function () {
      const { governance, artist, voter1, tokenId } = await loadFixture(
        deployFixture
      );

      await governance.connect(artist).createProposal(tokenId, "Test Proposal");

      // Advance time past voting period (3 days)
      await time.increase(3 * 24 * 60 * 60 + 1);

      await expect(
        governance.connect(voter1).castVote(0, true)
      ).to.be.revertedWith("Voting period ended");
    });
  });

  describe("Proposal Execution", function () {
    it("Should allow artist to execute successful proposal", async function () {
      const { governance, artist, voter1, tokenId } = await loadFixture(
        deployFixture
      );

      await governance.connect(artist).createProposal(tokenId, "Test Proposal");
      await governance.connect(voter1).castVote(0, true);

      // Advance time past voting period
      await time.increase(3 * 24 * 60 * 60 + 1);

      await expect(governance.connect(artist).executeProposal(0))
        .to.emit(governance, "ProposalExecuted")
        .withArgs(0);

      const proposal = await governance.getProposalDetails(0);
      expect(proposal.status).to.equal(1); // Executed status
    });

    it("Should prevent execution before voting ends", async function () {
      const { governance, artist, voter1, tokenId } = await loadFixture(
        deployFixture
      );

      await governance.connect(artist).createProposal(tokenId, "Test Proposal");
      await governance.connect(voter1).castVote(0, true);

      await expect(
        governance.connect(artist).executeProposal(0)
      ).to.be.revertedWith("Voting period not ended");
    });

    it("Should prevent execution of defeated proposal", async function () {
      const { governance, artist, voter2, tokenId } = await loadFixture(
        deployFixture
      );

      await governance.connect(artist).createProposal(tokenId, "Test Proposal");
      await governance.connect(voter2).castVote(0, false);

      // Advance time past voting period
      await time.increase(3 * 24 * 60 * 60 + 1);

      await expect(
        governance.connect(artist).executeProposal(0)
      ).to.be.revertedWith("Proposal was defeated");
    });

    it("Should prevent non-artist from executing proposal", async function () {
      const { governance, artist, voter1, owner, tokenId } = await loadFixture(
        deployFixture
      );

      await governance.connect(artist).createProposal(tokenId, "Test Proposal");
      await governance.connect(voter1).castVote(0, true);

      // Advance time past voting period
      await time.increase(3 * 24 * 60 * 60 + 1);

      await expect(
        governance.connect(owner).executeProposal(0)
      ).to.be.revertedWith("Only artist can execute proposal");
    });
  });

  describe("Proposal Cancellation", function () {
    it("Should allow artist to cancel proposal", async function () {
      const { governance, artist, tokenId } = await loadFixture(deployFixture);

      await governance.connect(artist).createProposal(tokenId, "Test Proposal");

      await expect(governance.connect(artist).cancelProposal(0))
        .to.emit(governance, "ProposalCancelled")
        .withArgs(0);

      const proposal = await governance.getProposalDetails(0);
      expect(proposal.status).to.equal(2); // Cancelled status
    });

    it("Should allow owner to cancel proposal", async function () {
      const { governance, artist, owner, tokenId } = await loadFixture(
        deployFixture
      );

      await governance.connect(artist).createProposal(tokenId, "Test Proposal");

      await expect(governance.connect(owner).cancelProposal(0))
        .to.emit(governance, "ProposalCancelled")
        .withArgs(0);
    });

    it("Should prevent unauthorized users from cancelling", async function () {
      const { governance, artist, voter1, tokenId } = await loadFixture(
        deployFixture
      );

      await governance.connect(artist).createProposal(tokenId, "Test Proposal");

      await expect(
        governance.connect(voter1).cancelProposal(0)
      ).to.be.revertedWith("Not authorized");
    });
  });

  describe("Admin Functions", function () {
    it("Should allow owner to change voting period", async function () {
      const { governance, owner } = await loadFixture(deployFixture);

      const newPeriod = 7 * 24 * 60 * 60; // 7 days
      await governance.connect(owner).setVotingPeriod(newPeriod);

      expect(await governance.votingPeriod()).to.equal(newPeriod);
    });

    it("Should prevent non-owner from changing voting period", async function () {
      const { governance, artist } = await loadFixture(deployFixture);

      await expect(governance.connect(artist).setVotingPeriod(1000)).to.be
        .reverted;
    });

    it("Should reject zero voting period", async function () {
      const { governance, owner } = await loadFixture(deployFixture);

      await expect(
        governance.connect(owner).setVotingPeriod(0)
      ).to.be.revertedWith("Voting period must be greater than zero");
    });
  });

  describe("Helper Functions", function () {
    it("Should return correct proposal details", async function () {
      const { governance, artist, voter1, tokenId } = await loadFixture(
        deployFixture
      );

      await governance.connect(artist).createProposal(tokenId, "Test Proposal");
      await governance.connect(voter1).castVote(0, true);

      const proposal = await governance.getProposalDetails(0);

      expect(proposal.artistAddress).to.equal(artist.address);
      expect(proposal.tokenId).to.equal(tokenId);
      expect(proposal.description).to.equal("Test Proposal");
      expect(proposal.forVotes).to.equal(20);
      expect(proposal.status).to.equal(0); // Active
    });

    it("Should track voting status correctly", async function () {
      const { governance, artist, voter1, voter2, tokenId } = await loadFixture(
        deployFixture
      );

      await governance.connect(artist).createProposal(tokenId, "Test Proposal");
      await governance.connect(voter1).castVote(0, true);

      expect(await governance.hasVoted(0, voter1.address)).to.be.true;
      expect(await governance.hasVoted(0, voter2.address)).to.be.false;
    });
  });
});
