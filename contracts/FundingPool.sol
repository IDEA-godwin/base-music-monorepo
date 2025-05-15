// SPDX-License-Identifier: MIT
pragma solidity ^0.8.17;

/**
 * @title FundingPool
 * @dev Contract for managing funding for artist projects
 */
contract FundingPool {
    struct Project {
        string name;
        string description;
        uint256 fundingGoal;
        uint256 currentFunding;
        uint256 deadline;
        bool completed;
        bool fundingReleased;
        address artistAddress;
    }

    struct MilestonePhase {
        string description;
        uint256 percentage;
        bool released;
    }

    mapping(address => uint256) public artistFunds;
    mapping(address => mapping(uint256 => Project)) public artistProjects;
    mapping(address => uint256) public artistProjectCount;
    mapping(address => mapping(uint256 => MilestonePhase[]))
        public projectMilestones;

    event FundsAdded(address indexed artist, uint256 amount);
    event ProjectCreated(
        address indexed artist,
        uint256 indexed projectId,
        string name,
        uint256 fundingGoal
    );
    event ProjectFunded(address indexed artist, uint256 indexed projectId);
    event MilestoneReleased(
        address indexed artist,
        uint256 indexed projectId,
        uint256 milestoneIndex,
        uint256 amount
    );
    event ProjectCompleted(address indexed artist, uint256 indexed projectId);

    function addFunds(address _artist, uint256 _amount) external payable {
        require(
            _amount == 0 || msg.value == _amount,
            "Amount mismatch with sent value"
        );

        artistFunds[_artist] += _amount;

        emit FundsAdded(_artist, _amount);
    }

    function createProject(
        string memory _name,
        string memory _description,
        uint256 _fundingGoal,
        uint256 _deadlineDuration,
        string[] memory _milestoneDescriptions,
        uint256[] memory _milestonePercentages
    ) external {
        require(
            _milestoneDescriptions.length == _milestonePercentages.length,
            "Milestone arrays length mismatch"
        );
        require(
            _milestoneDescriptions.length > 0,
            "At least one milestone required"
        );

        uint256 totalPercentage = 0;
        for (uint i = 0; i < _milestonePercentages.length; i++) {
            totalPercentage += _milestonePercentages[i];
        }
        require(
            totalPercentage == 100,
            "Milestone percentages must total 100%"
        );

        uint256 projectId = artistProjectCount[msg.sender];
        uint256 deadline = block.timestamp + _deadlineDuration;

        artistProjects[msg.sender][projectId] = Project({
            name: _name,
            description: _description,
            fundingGoal: _fundingGoal,
            currentFunding: 0,
            deadline: deadline,
            completed: false,
            fundingReleased: false,
            artistAddress: msg.sender
        });

        for (uint i = 0; i < _milestoneDescriptions.length; i++) {
            projectMilestones[msg.sender][projectId].push(
                MilestonePhase({
                    description: _milestoneDescriptions[i],
                    percentage: _milestonePercentages[i],
                    released: false
                })
            );
        }

        artistProjectCount[msg.sender]++;

        emit ProjectCreated(msg.sender, projectId, _name, _fundingGoal);
    }

    function fundProject(uint256 _projectId) external {
        Project storage project = artistProjects[msg.sender][_projectId];
        require(!project.completed, "Project already completed");
        require(block.timestamp <= project.deadline, "Project deadline passed");

        uint256 neededFunding = project.fundingGoal - project.currentFunding;
        uint256 availableFunds = artistFunds[msg.sender];

        require(availableFunds > 0, "No funds available");

        uint256 fundingAmount = neededFunding < availableFunds
            ? neededFunding
            : availableFunds;

        project.currentFunding += fundingAmount;
        artistFunds[msg.sender] -= fundingAmount;

        if (project.currentFunding >= project.fundingGoal) {
            emit ProjectFunded(msg.sender, _projectId);
        }
    }

    function releaseMilestone(
        uint256 _projectId,
        uint256 _milestoneIndex
    ) external {
        Project storage project = artistProjects[msg.sender][_projectId];
        require(
            project.currentFunding >= project.fundingGoal,
            "Project not fully funded"
        );
        require(!project.completed, "Project already completed");

        MilestonePhase[] storage milestones = projectMilestones[msg.sender][
            _projectId
        ];
        require(_milestoneIndex < milestones.length, "Invalid milestone index");

        MilestonePhase storage milestone = milestones[_milestoneIndex];
        require(!milestone.released, "Milestone already released");

        uint256 releaseAmount = (project.fundingGoal * milestone.percentage) /
            100;
        milestone.released = true;

        payable(msg.sender).transfer(releaseAmount);

        emit MilestoneReleased(
            msg.sender,
            _projectId,
            _milestoneIndex,
            releaseAmount
        );

        // Check if all milestones are released
        bool allReleased = true;
        for (uint i = 0; i < milestones.length; i++) {
            if (!milestones[i].released) {
                allReleased = false;
                break;
            }
        }

        if (allReleased) {
            project.completed = true;
            project.fundingReleased = true;
            emit ProjectCompleted(msg.sender, _projectId);
        }
    }

    function getProjectDetails(
        address _artist,
        uint256 _projectId
    )
        external
        view
        returns (
            string memory name,
            string memory description,
            uint256 fundingGoal,
            uint256 currentFunding,
            uint256 deadline,
            bool completed,
            bool fundingReleased
        )
    {
        Project memory project = artistProjects[_artist][_projectId];

        return (
            project.name,
            project.description,
            project.fundingGoal,
            project.currentFunding,
            project.deadline,
            project.completed,
            project.fundingReleased
        );
    }

    function getProjectMilestones(
        address _artist,
        uint256 _projectId
    )
        external
        view
        returns (
            string[] memory descriptions,
            uint256[] memory percentages,
            bool[] memory released
        )
    {
        MilestonePhase[] storage milestones = projectMilestones[_artist][
            _projectId
        ];
        uint256 count = milestones.length;

        descriptions = new string[](count);
        percentages = new uint256[](count);
        released = new bool[](count);

        for (uint i = 0; i < count; i++) {
            descriptions[i] = milestones[i].description;
            percentages[i] = milestones[i].percentage;
            released[i] = milestones[i].released;
        }

        return (descriptions, percentages, released);
    }

    function getArtistAvailableFunds(
        address _artist
    ) external view returns (uint256) {
        return artistFunds[_artist];
    }
}
