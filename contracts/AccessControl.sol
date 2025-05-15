// SPDX-License-Identifier: MIT
pragma solidity ^0.8.17;

import {MusicToken} from "./MusicToken.sol";

/**
 * @title AccessControl
 * @dev Contract for managing token holder access rights
 */
contract AccessControl {
    MusicToken public musicToken;

    struct AccessRule {
        uint256 tokenId;
        uint256 minQuantity;
        string accessURI;
        bool active;
    }

    mapping(address => mapping(bytes32 => AccessRule)) public accessRules;
    mapping(address => bytes32[]) public artistAccessRules;

    event AccessRuleCreated(
        address indexed artist,
        bytes32 ruleId,
        uint256 tokenId,
        uint256 minQuantity
    );
    event AccessRuleUpdated(address indexed artist, bytes32 ruleId);
    event AccessRuleDeactivated(address indexed artist, bytes32 ruleId);

    constructor(address _musicTokenAddress) {
        musicToken = MusicToken(_musicTokenAddress);
    }

    function createAccessRule(
        uint256 _tokenId,
        uint256 _minQuantity,
        string memory _accessURI
    ) external returns (bytes32) {
        (, , address artistAddress, , , , , ) = musicToken.getTokenData(
            _tokenId
        );
        require(
            msg.sender == artistAddress,
            "Only token artist can create access rules"
        );

        bytes32 ruleId = keccak256(
            abi.encodePacked(msg.sender, _tokenId, block.timestamp)
        );

        accessRules[msg.sender][ruleId] = AccessRule({
            tokenId: _tokenId,
            minQuantity: _minQuantity,
            accessURI: _accessURI,
            active: true
        });

        artistAccessRules[msg.sender].push(ruleId);

        emit AccessRuleCreated(msg.sender, ruleId, _tokenId, _minQuantity);

        return ruleId;
    }

    function updateAccessRule(
        bytes32 _ruleId,
        uint256 _minQuantity,
        string memory _accessURI
    ) external {
        AccessRule storage rule = accessRules[msg.sender][_ruleId];
        require(rule.active, "Access rule not found or inactive");

        rule.minQuantity = _minQuantity;
        rule.accessURI = _accessURI;

        emit AccessRuleUpdated(msg.sender, _ruleId);
    }

    function deactivateAccessRule(bytes32 _ruleId) external {
        AccessRule storage rule = accessRules[msg.sender][_ruleId];
        require(rule.active, "Access rule already inactive");

        rule.active = false;

        emit AccessRuleDeactivated(msg.sender, _ruleId);
    }

    function checkAccess(
        address _artist,
        bytes32 _ruleId,
        address _holder
    ) external view returns (bool, string memory) {
        AccessRule memory rule = accessRules[_artist][_ruleId];
        require(rule.active, "Access rule not active");

        uint256 balance = musicToken.balanceOf(_holder, rule.tokenId);

        if (balance >= rule.minQuantity) {
            return (true, rule.accessURI);
        } else {
            return (false, "");
        }
    }

    function getArtistAccessRules(
        address _artist
    )
        external
        view
        returns (
            bytes32[] memory ruleIds,
            uint256[] memory tokenIds,
            uint256[] memory minQuantities,
            bool[] memory activeStatuses
        )
    {
        bytes32[] memory artistRules = artistAccessRules[_artist];
        uint256 count = artistRules.length;

        tokenIds = new uint256[](count);
        minQuantities = new uint256[](count);
        activeStatuses = new bool[](count);

        for (uint i = 0; i < count; i++) {
            AccessRule memory rule = accessRules[_artist][artistRules[i]];
            tokenIds[i] = rule.tokenId;
            minQuantities[i] = rule.minQuantity;
            activeStatuses[i] = rule.active;
        }

        return (artistRules, tokenIds, minQuantities, activeStatuses);
    }
}
