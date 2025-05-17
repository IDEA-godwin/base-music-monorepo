// SPDX-License-Identifier: MIT
pragma solidity ^0.8.17;

import {Counters} from "./utils/Counters.sol";
import "@openzeppelin/contracts/access/Ownable.sol";

/**
 * @title RoyaltyDistribution
 * @dev Contract for managing royalty distributions
 */
contract RoyaltyDistribution is Ownable {
    struct Collaborator {
        address payable collaboratorAddress;
        uint256 sharePercentage;
    }

    struct RoyaltyInfo {
        uint256 totalRoyalties;
        uint256 withdrawnRoyalties;
        mapping(address => bool) isCollaborator;
        Collaborator[] collaborators;
    }

    mapping(address => mapping(uint256 => RoyaltyInfo)) public royalties;
    mapping(address => uint256) public artistTotalRoyalties;
    mapping(address => uint256) public artistWithdrawnRoyalties;

    event RoyaltyAdded(
        address indexed artist,
        uint256 indexed tokenId,
        uint256 amount
    );
    event RoyaltyWithdrawn(address indexed recipient, uint256 amount);
    event CollaboratorAdded(
        address indexed artist,
        uint256 indexed tokenId,
        address collaborator,
        uint256 sharePercentage
    );

    constructor() Ownable(msg.sender) {}

    function addRoyalty(
        address _artist,
        uint256 _tokenId,
        uint256 _amount
    ) external payable {
        require(msg.value == _amount, "Amount must match sent value");

        RoyaltyInfo storage info = royalties[_artist][_tokenId];
        info.totalRoyalties += _amount;
        artistTotalRoyalties[_artist] += _amount;

        emit RoyaltyAdded(_artist, _tokenId, _amount);
    }

    function addCollaborator(
        uint256 _tokenId,
        address payable _collaborator,
        uint256 _sharePercentage
    ) external {
        require(
            _sharePercentage > 0 && _sharePercentage <= 100,
            "Invalid share percentage"
        );

        RoyaltyInfo storage info = royalties[msg.sender][_tokenId];
        require(
            !info.isCollaborator[_collaborator],
            "Collaborator already added"
        );

        uint256 totalShare = _sharePercentage;
        for (uint i = 0; i < info.collaborators.length; i++) {
            totalShare += info.collaborators[i].sharePercentage;
        }
        require(totalShare <= 100, "Total share percentage exceeds 100%");

        info.collaborators.push(
            Collaborator({
                collaboratorAddress: _collaborator,
                sharePercentage: _sharePercentage
            })
        );

        info.isCollaborator[_collaborator] = true;

        emit CollaboratorAdded(
            msg.sender,
            _tokenId,
            _collaborator,
            _sharePercentage
        );
    }

    function withdrawRoyalties() external {
        uint256 availableRoyalties = artistTotalRoyalties[msg.sender] -
            artistWithdrawnRoyalties[msg.sender];
        require(availableRoyalties > 0, "No royalties available");

        artistWithdrawnRoyalties[msg.sender] += availableRoyalties;

        payable(msg.sender).transfer(availableRoyalties);

        emit RoyaltyWithdrawn(msg.sender, availableRoyalties);
    }

    function withdrawTokenRoyalties(uint256 _tokenId) external {
        RoyaltyInfo storage info = royalties[msg.sender][_tokenId];

        uint256 availableRoyalties = info.totalRoyalties -
            info.withdrawnRoyalties;
        require(
            availableRoyalties > 0,
            "No royalties available for this token"
        );

        // Calculate primary artist share
        uint256 totalCollaboratorShare = 0;
        for (uint i = 0; i < info.collaborators.length; i++) {
            totalCollaboratorShare += info.collaborators[i].sharePercentage;
        }

        uint256 artistShare = 100 - totalCollaboratorShare;
        uint256 artistAmount = (availableRoyalties * artistShare) / 100;

        // Distribute royalties to collaborators
        for (uint i = 0; i < info.collaborators.length; i++) {
            Collaborator memory collaborator = info.collaborators[i];
            uint256 collaboratorAmount = (availableRoyalties *
                collaborator.sharePercentage) / 100;

            if (collaboratorAmount > 0) {
                collaborator.collaboratorAddress.transfer(collaboratorAmount);
                emit RoyaltyWithdrawn(
                    collaborator.collaboratorAddress,
                    collaboratorAmount
                );
            }
        }

        // Transfer artist share
        if (artistAmount > 0) {
            payable(msg.sender).transfer(artistAmount);
            emit RoyaltyWithdrawn(msg.sender, artistAmount);
        }

        info.withdrawnRoyalties += availableRoyalties;
        artistWithdrawnRoyalties[msg.sender] += availableRoyalties;
    }

    function getAvailableRoyalties(
        address _artist
    ) external view returns (uint256) {
        return
            artistTotalRoyalties[_artist] - artistWithdrawnRoyalties[_artist];
    }

    function getTokenRoyalties(
        address _artist,
        uint256 _tokenId
    )
        external
        view
        returns (uint256 total, uint256 withdrawn, uint256 available)
    {
        RoyaltyInfo storage info = royalties[_artist][_tokenId];
        return (
            info.totalRoyalties,
            info.withdrawnRoyalties,
            info.totalRoyalties - info.withdrawnRoyalties
        );
    }

    function getCollaborators(
        address _artist,
        uint256 _tokenId
    )
        external
        view
        returns (address[] memory addresses, uint256[] memory shares)
    {
        RoyaltyInfo storage info = royalties[_artist][_tokenId];
        uint256 count = info.collaborators.length;

        addresses = new address[](count);
        shares = new uint256[](count);

        for (uint i = 0; i < count; i++) {
            addresses[i] = info.collaborators[i].collaboratorAddress;
            shares[i] = info.collaborators[i].sharePercentage;
        }

        return (addresses, shares);
    }
}
