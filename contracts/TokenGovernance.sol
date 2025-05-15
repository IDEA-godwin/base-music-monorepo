// SPDX-License-Identifier: MIT
pragma solidity ^0.8.17;

import {Ownable} from "@openzeppelin/contracts/access/Ownable.sol";
import {Counters} from "./utils/Counters.sol";
import {MusicToken} from "./MusicToken.sol";

/**
 * @title TokenGovernance
 * @dev Contract for governance features based on token holdings
 */
contract TokenGovernance is Ownable {
    using Counters for Counters.Counter;

    MusicToken public musicToken;

    Counters.Counter private _proposalIds;

    enum ProposalStatus {
        Active,
        Executed,
        Cancelled,
        Defeated
    }

    struct Proposal {
        uint256 id;
        address artistAddress;
        uint256 tokenId;
        string description;
        uint256 forVotes;
        uint256 againstVotes;
        uint256 startTime;
        uint256 endTime;
        ProposalStatus status;
        mapping(address => bool) hasVoted;
    }

    mapping(uint256 => Proposal) public proposals;
    mapping(address => uint256[]) public artistProposals;

    uint256 public votingPeriod = 3 days;

    event ProposalCreated(
        uint256 indexed proposalId,
        address indexed artist,
        uint256 indexed tokenId,
        string description,
        uint256 startTime,
        uint256 endTime
    );

    event VoteCast(
        uint256 indexed proposalId,
        address indexed voter,
        bool support,
        uint256 weight
    );

    event ProposalExecuted(uint256 indexed proposalId);
    event ProposalCancelled(uint256 indexed proposalId);

    constructor(address _musicTokenAddress) Ownable(msg.sender) {
        musicToken = MusicToken(_musicTokenAddress);
    }

    function setVotingPeriod(uint256 _votingPeriod) external onlyOwner {
        require(_votingPeriod > 0, "Voting period must be greater than zero");
        votingPeriod = _votingPeriod;
    }

    function createProposal(
        uint256 _tokenId,
        string memory _description
    ) external returns (uint256) {
        (, , address artistAddress, , , , , ) = musicToken.getTokenData(
            _tokenId
        );
        require(
            msg.sender == artistAddress,
            "Only token artist can create proposals"
        );

        uint256 proposalId = _proposalIds.current();
        _proposalIds.increment();

        Proposal storage newProposal = proposals[proposalId];
        newProposal.id = proposalId;
        newProposal.artistAddress = msg.sender;
        newProposal.tokenId = _tokenId;
        newProposal.description = _description;
        newProposal.startTime = block.timestamp;
        newProposal.endTime = block.timestamp + votingPeriod;
        newProposal.status = ProposalStatus.Active;

        artistProposals[msg.sender].push(proposalId);

        emit ProposalCreated(
            proposalId,
            msg.sender,
            _tokenId,
            _description,
            newProposal.startTime,
            newProposal.endTime
        );

        return proposalId;
    }

    function castVote(uint256 _proposalId, bool _support) external {
        Proposal storage proposal = proposals[_proposalId];

        require(
            proposal.status == ProposalStatus.Active,
            "Proposal not active"
        );
        require(block.timestamp <= proposal.endTime, "Voting period ended");
        require(!proposal.hasVoted[msg.sender], "Already voted");

        uint256 votes = musicToken.balanceOf(msg.sender, proposal.tokenId);
        require(votes > 0, "No voting power");

        proposal.hasVoted[msg.sender] = true;

        if (_support) {
            proposal.forVotes += votes;
        } else {
            proposal.againstVotes += votes;
        }

        emit VoteCast(_proposalId, msg.sender, _support, votes);
    }

    function executeProposal(uint256 _proposalId) external {
        Proposal storage proposal = proposals[_proposalId];

        require(
            msg.sender == proposal.artistAddress,
            "Only artist can execute proposal"
        );
        require(
            proposal.status == ProposalStatus.Active,
            "Proposal not active"
        );
        require(block.timestamp > proposal.endTime, "Voting period not ended");
        require(
            proposal.forVotes > proposal.againstVotes,
            "Proposal was defeated"
        );

        proposal.status = ProposalStatus.Executed;

        emit ProposalExecuted(_proposalId);
    }

    function cancelProposal(uint256 _proposalId) external {
        Proposal storage proposal = proposals[_proposalId];

        require(
            msg.sender == proposal.artistAddress || msg.sender == owner(),
            "Not authorized"
        );
        require(
            proposal.status == ProposalStatus.Active,
            "Proposal not active"
        );

        proposal.status = ProposalStatus.Cancelled;

        emit ProposalCancelled(_proposalId);
    }

    function getProposalDetails(
        uint256 _proposalId
    )
        external
        view
        returns (
            address artistAddress,
            uint256 tokenId,
            string memory description,
            uint256 forVotes,
            uint256 againstVotes,
            uint256 startTime,
            uint256 endTime,
            ProposalStatus status
        )
    {
        Proposal storage proposal = proposals[_proposalId];

        return (
            proposal.artistAddress,
            proposal.tokenId,
            proposal.description,
            proposal.forVotes,
            proposal.againstVotes,
            proposal.startTime,
            proposal.endTime,
            proposal.status
        );
    }

    function getArtistProposals(
        address _artist
    ) external view returns (uint256[] memory) {
        return artistProposals[_artist];
    }

    function hasVoted(
        uint256 _proposalId,
        address _voter
    ) external view returns (bool) {
        return proposals[_proposalId].hasVoted[_voter];
    }
}
