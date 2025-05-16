const { expect } = require("chai");
const {
  loadFixture,
} = require("@nomicfoundation/hardhat-toolbox/network-helpers");
const { ethers } = require("hardhat");

describe("FundingPool", function () {
  async function deployFundingPoolFixture() {
    const [owner, artist1, artist2, funder] = await ethers.getSigners();
    const FundingPool = await ethers.getContractFactory("FundingPool");
    const fundingPool = await FundingPool.deploy();
    await fundingPool.waitForDeployment();

    return { fundingPool, owner, artist1, artist2, funder };
  }

  describe("Deployment", function () {
    it("Should set the right owner", async function () {
      const { fundingPool, owner } = await loadFixture(
        deployFundingPoolFixture
      );
      expect(await fundingPool.owner()).to.equal(owner.address);
    });
  });

  describe("Adding Funds", function () {
    it("Should allow adding funds to artists", async function () {
      const { fundingPool, funder, artist1 } = await loadFixture(
        deployFundingPoolFixture
      );

      const fundAmount = ethers.parseEther("1.0");
      await expect(
        fundingPool
          .connect(funder)
          .addFunds(artist1.address, fundAmount, { value: fundAmount })
      )
        .to.emit(fundingPool, "FundsAdded")
        .withArgs(artist1.address, fundAmount);

      expect(
        await fundingPool.getArtistAvailableFunds(artist1.address)
      ).to.equal(fundAmount);
    });

    it("Should revert when sent value doesn't match amount", async function () {
      const { fundingPool, funder, artist1 } = await loadFixture(
        deployFundingPoolFixture
      );

      const fundAmount = ethers.parseEther("1.0");
      const sentAmount = ethers.parseEther("0.5");

      await expect(
        fundingPool
          .connect(funder)
          .addFunds(artist1.address, fundAmount, { value: sentAmount })
      ).to.be.revertedWith("Amount mismatch with sent value");
    });

    it("Should allow adding 0 funds with 0 value", async function () {
      const { fundingPool, funder, artist1 } = await loadFixture(
        deployFundingPoolFixture
      );

      await expect(
        fundingPool.connect(funder).addFunds(artist1.address, 0, { value: 0 })
      )
        .to.emit(fundingPool, "FundsAdded")
        .withArgs(artist1.address, 0);
    });
  });

  describe("Project Creation", function () {
    it("Should create a project with milestones", async function () {
      const { fundingPool, artist1 } = await loadFixture(
        deployFundingPoolFixture
      );

      const milestoneDescriptions = ["Design", "Development", "Testing"];
      const milestonePercentages = [20, 50, 30];
      const fundingGoal = ethers.parseEther("10.0");
      const deadlineDuration = 60 * 60 * 24 * 30; // 30 days

      await expect(
        fundingPool
          .connect(artist1)
          .createProject(
            "Project Alpha",
            "A test project",
            fundingGoal,
            deadlineDuration,
            milestoneDescriptions,
            milestonePercentages
          )
      )
        .to.emit(fundingPool, "ProjectCreated")
        .withArgs(artist1.address, 0, "Project Alpha", fundingGoal);

      expect(await fundingPool.artistProjectCount(artist1.address)).to.equal(1);

      const projectDetails = await fundingPool.getProjectDetails(
        artist1.address,
        0
      );
      expect(projectDetails[0]).to.equal("Project Alpha");
      expect(projectDetails[1]).to.equal("A test project");
      expect(projectDetails[2]).to.equal(fundingGoal);

      const milestones = await fundingPool.getProjectMilestones(
        artist1.address,
        0
      );
      expect(milestones.descriptions).to.deep.equal(milestoneDescriptions);
      expect(milestones.percentages.map((p) => Number(p))).to.deep.equal(
        milestonePercentages
      );
      expect(milestones.released).to.deep.equal([false, false, false]);
    });

    it("Should revert if milestone arrays have different lengths", async function () {
      const { fundingPool, artist1 } = await loadFixture(
        deployFundingPoolFixture
      );

      const milestoneDescriptions = ["Design", "Development", "Testing"];
      const milestonePercentages = [30, 70]; // Missing one percentage

      await expect(
        fundingPool
          .connect(artist1)
          .createProject(
            "Project Alpha",
            "A test project",
            ethers.parseEther("10.0"),
            60 * 60 * 24 * 30,
            milestoneDescriptions,
            milestonePercentages
          )
      ).to.be.revertedWith("Milestone arrays length mismatch");
    });

    it("Should revert if no milestones are provided", async function () {
      const { fundingPool, artist1 } = await loadFixture(
        deployFundingPoolFixture
      );

      await expect(
        fundingPool
          .connect(artist1)
          .createProject(
            "Project Alpha",
            "A test project",
            ethers.parseEther("10.0"),
            60 * 60 * 24 * 30,
            [],
            []
          )
      ).to.be.revertedWith("At least one milestone required");
    });

    it("Should revert if milestone percentages don't add up to 100", async function () {
      const { fundingPool, artist1 } = await loadFixture(
        deployFundingPoolFixture
      );

      const milestoneDescriptions = ["Design", "Development", "Testing"];
      const milestonePercentages = [20, 50, 20]; // Total: 90%

      await expect(
        fundingPool
          .connect(artist1)
          .createProject(
            "Project Alpha",
            "A test project",
            ethers.parseEther("10.0"),
            60 * 60 * 24 * 30,
            milestoneDescriptions,
            milestonePercentages
          )
      ).to.be.revertedWith("Milestone percentages must total 100%");
    });
  });

  describe("Project Funding", function () {
    async function createProjectWithFunds() {
      const { fundingPool, owner, artist1, funder } = await loadFixture(
        deployFundingPoolFixture
      );

      const milestoneDescriptions = ["Design", "Development", "Testing"];
      const milestonePercentages = [20, 50, 30];
      const fundingGoal = ethers.parseEther("10.0");
      const deadlineDuration = 60 * 60 * 24 * 30; // 30 days

      // Create project
      await fundingPool
        .connect(artist1)
        .createProject(
          "Project Alpha",
          "A test project",
          fundingGoal,
          deadlineDuration,
          milestoneDescriptions,
          milestonePercentages
        );

      // Add funds to artist account
      await fundingPool
        .connect(funder)
        .addFunds(artist1.address, fundingGoal, { value: fundingGoal });

      return { fundingPool, owner, artist1, funder, fundingGoal };
    }

    it("Should fund a project from artist funds", async function () {
      const { fundingPool, artist1, fundingGoal } =
        await createProjectWithFunds();

      await expect(fundingPool.connect(artist1).fundProject(0))
        .to.emit(fundingPool, "ProjectFunded")
        .withArgs(artist1.address, 0);

      const projectDetails = await fundingPool.getProjectDetails(
        artist1.address,
        0
      );
      expect(projectDetails[3]).to.equal(fundingGoal); // currentFunding
      expect(
        await fundingPool.getArtistAvailableFunds(artist1.address)
      ).to.equal(0);
    });

    it("Should fund a project partially when not enough funds", async function () {
      const { fundingPool, artist1, funder } = await loadFixture(
        deployFundingPoolFixture
      );

      const milestoneDescriptions = ["Design", "Development", "Testing"];
      const milestonePercentages = [20, 50, 30];
      const fundingGoal = ethers.parseEther("10.0");
      const partialFunds = ethers.parseEther("4.0");

      // Create project
      await fundingPool
        .connect(artist1)
        .createProject(
          "Project Alpha",
          "A test project",
          fundingGoal,
          60 * 60 * 24 * 30,
          milestoneDescriptions,
          milestonePercentages
        );

      // Add partial funds
      await fundingPool
        .connect(funder)
        .addFunds(artist1.address, partialFunds, { value: partialFunds });

      // Fund project
      await fundingPool.connect(artist1).fundProject(0);

      const projectDetails = await fundingPool.getProjectDetails(
        artist1.address,
        0
      );
      expect(projectDetails[3]).to.equal(partialFunds); // currentFunding
      expect(
        await fundingPool.getArtistAvailableFunds(artist1.address)
      ).to.equal(0);
    });

    it("Should revert funding if project deadline passed", async function () {
      const { fundingPool, artist1, funder } = await loadFixture(
        deployFundingPoolFixture
      );

      // Create project with very short deadline
      await fundingPool.connect(artist1).createProject(
        "Project Alpha",
        "A test project",
        ethers.parseEther("10.0"),
        1, // 1 second
        ["Milestone"],
        [100]
      );

      // Add funds
      await fundingPool
        .connect(funder)
        .addFunds(artist1.address, ethers.parseEther("10.0"), {
          value: ethers.parseEther("10.0"),
        });

      // Wait for deadline to pass
      await new Promise((r) => setTimeout(r, 2000));

      await expect(
        fundingPool.connect(artist1).fundProject(0)
      ).to.be.revertedWith("Project deadline passed");
    });

    it("Should revert funding if no funds available", async function () {
      const { fundingPool, artist1 } = await loadFixture(
        deployFundingPoolFixture
      );

      // Create project
      await fundingPool
        .connect(artist1)
        .createProject(
          "Project Alpha",
          "A test project",
          ethers.parseEther("10.0"),
          60 * 60 * 24 * 30,
          ["Milestone"],
          [100]
        );

      await expect(
        fundingPool.connect(artist1).fundProject(0)
      ).to.be.revertedWith("No funds available");
    });
  });

  describe("Milestone Release", function () {
    async function fullyFundedProject() {
      const { fundingPool, owner, artist1, funder } = await loadFixture(
        deployFundingPoolFixture
      );

      const milestoneDescriptions = ["Design", "Development", "Testing"];
      const milestonePercentages = [20, 50, 30];
      const fundingGoal = ethers.parseEther("10.0");

      // Create project
      await fundingPool
        .connect(artist1)
        .createProject(
          "Project Alpha",
          "A test project",
          fundingGoal,
          60 * 60 * 24 * 30,
          milestoneDescriptions,
          milestonePercentages
        );

      // Add funds and fund project
      await fundingPool
        .connect(funder)
        .addFunds(artist1.address, fundingGoal, { value: fundingGoal });
      await fundingPool.connect(artist1).fundProject(0);

      return { fundingPool, owner, artist1, fundingGoal, milestonePercentages };
    }

    it("Should release a milestone payment", async function () {
      const { fundingPool, artist1, fundingGoal, milestonePercentages } =
        await fullyFundedProject();

      const initialBalance = await ethers.provider.getBalance(artist1.address);
      const milestone1Amount =
        (fundingGoal * BigInt(milestonePercentages[0])) / 100n;

      await expect(fundingPool.connect(artist1).releaseMilestone(0, 0))
        .to.emit(fundingPool, "MilestoneReleased")
        .withArgs(artist1.address, 0, 0, milestone1Amount);

      const milestones = await fundingPool.getProjectMilestones(
        artist1.address,
        0
      );
      expect(milestones.released[0]).to.be.true;
      expect(milestones.released[1]).to.be.false;
      expect(milestones.released[2]).to.be.false;

      // Check balance increased (accounting for gas)
      const finalBalance = await ethers.provider.getBalance(artist1.address);
      expect(finalBalance).to.be.gt(initialBalance);
    });

    it("Should complete project after releasing all milestones", async function () {
      const { fundingPool, artist1 } = await fullyFundedProject();

      // Release all milestones
      await fundingPool.connect(artist1).releaseMilestone(0, 0);
      await fundingPool.connect(artist1).releaseMilestone(0, 1);

      await expect(fundingPool.connect(artist1).releaseMilestone(0, 2))
        .to.emit(fundingPool, "ProjectCompleted")
        .withArgs(artist1.address, 0);

      const projectDetails = await fundingPool.getProjectDetails(
        artist1.address,
        0
      );
      expect(projectDetails[5]).to.be.true; // completed
      expect(projectDetails[6]).to.be.true; // fundingReleased
    });

    it("Should revert if releasing milestone for non-fully funded project", async function () {
      const { fundingPool, artist1, funder } = await loadFixture(
        deployFundingPoolFixture
      );

      // Create project
      await fundingPool
        .connect(artist1)
        .createProject(
          "Project Alpha",
          "A test project",
          ethers.parseEther("10.0"),
          60 * 60 * 24 * 30,
          ["Milestone"],
          [100]
        );

      // Add partial funds
      await fundingPool
        .connect(funder)
        .addFunds(artist1.address, ethers.parseEther("5.0"), {
          value: ethers.parseEther("5.0"),
        });
      await fundingPool.connect(artist1).fundProject(0);

      await expect(
        fundingPool.connect(artist1).releaseMilestone(0, 0)
      ).to.be.revertedWith("Project not fully funded");
    });

    it("Should revert if releasing already released milestone", async function () {
      const { fundingPool, artist1 } = await fullyFundedProject();

      // Release first milestone
      await fundingPool.connect(artist1).releaseMilestone(0, 0);

      // Try to release it again
      await expect(
        fundingPool.connect(artist1).releaseMilestone(0, 0)
      ).to.be.revertedWith("Milestone already released");
    });

    it("Should revert if invalid milestone index", async function () {
      const { fundingPool, artist1 } = await fullyFundedProject();

      await expect(
        fundingPool.connect(artist1).releaseMilestone(0, 99)
      ).to.be.revertedWith("Invalid milestone index");
    });
  });

  describe("Project Queries", function () {
    it("Should return correct project details", async function () {
      const { fundingPool, artist1 } = await loadFixture(
        deployFundingPoolFixture
      );

      const projectName = "Project Alpha";
      const projectDesc = "A test project";
      const fundingGoal = ethers.parseEther("10.0");
      const deadlineDuration = 60 * 60 * 24 * 30;

      // Create project
      await fundingPool
        .connect(artist1)
        .createProject(
          projectName,
          projectDesc,
          fundingGoal,
          deadlineDuration,
          ["Milestone"],
          [100]
        );

      const details = await fundingPool.getProjectDetails(artist1.address, 0);
      expect(details[0]).to.equal(projectName);
      expect(details[1]).to.equal(projectDesc);
      expect(details[2]).to.equal(fundingGoal);
      expect(details[3]).to.equal(0); // currentFunding
      expect(details[5]).to.be.false; // completed
      expect(details[6]).to.be.false; // fundingReleased
    });

    it("Should return correct milestone details", async function () {
      const { fundingPool, artist1 } = await loadFixture(
        deployFundingPoolFixture
      );

      const milestoneDescs = ["Design", "Development", "Testing"];
      const milestonePercs = [20, 50, 30];

      // Create project
      await fundingPool
        .connect(artist1)
        .createProject(
          "Project Alpha",
          "A test project",
          ethers.parseEther("10.0"),
          60 * 60 * 24 * 30,
          milestoneDescs,
          milestonePercs
        );

      const milestones = await fundingPool.getProjectMilestones(
        artist1.address,
        0
      );
      expect(milestones.descriptions).to.deep.equal(milestoneDescs);
      expect(milestones.percentages.map((p) => Number(p))).to.deep.equal(
        milestonePercs
      );
      expect(milestones.released).to.deep.equal([false, false, false]);
    });
  });
});
