// SPDX-License-Identifier: MIT
pragma solidity ^0.8.17;

import {Counters} from "./utils/Counters.sol";
import "@openzeppelin/contracts/token/ERC1155/ERC1155.sol";
import "@openzeppelin/contracts/access/Ownable.sol";
import "@openzeppelin/contracts/token/ERC1155/extensions/ERC1155Supply.sol";
import "@openzeppelin/contracts/utils/Strings.sol";

/**
 * @title ArtistRegistry
 * @dev Contract for registering and verifying artists
 */
contract ArtistRegistry is Ownable {
    struct Artist {
        string name;
        string profileURI;
        address payable artistAddress;
        bool isVerified;
        uint defaultRoyaltyPercentage;
    }

    mapping(address => Artist) public artists;
    mapping(address => bool) public registeredArtists;

    uint public artistCount;
    uint public constant MAX_ROYALTY_PERCENTAGE = 25; // 25%

    event ArtistRegistered(address indexed artistAddress, string name);
    event ArtistVerified(address indexed artistAddress);
    event ArtistProfileUpdated(address indexed artistAddress);

    constructor() Ownable(msg.sender) {}

    function registerArtist(
        string memory _name,
        string memory _profileURI,
        uint _royaltyPercentage
    ) external {
        require(!registeredArtists[msg.sender], "Artist already registered");
        require(
            _royaltyPercentage <= MAX_ROYALTY_PERCENTAGE,
            "Royalty percentage too high"
        );

        artists[msg.sender] = Artist({
            name: _name,
            profileURI: _profileURI,
            artistAddress: payable(msg.sender),
            isVerified: false,
            defaultRoyaltyPercentage: _royaltyPercentage
        });

        registeredArtists[msg.sender] = true;
        artistCount++;

        emit ArtistRegistered(msg.sender, _name);
    }

    function verifyArtist(address _artistAddress) external onlyOwner {
        require(registeredArtists[_artistAddress], "Artist not registered");
        require(!artists[_artistAddress].isVerified, "Artist already verified");

        artists[_artistAddress].isVerified = true;

        emit ArtistVerified(_artistAddress);
    }

    function updateProfile(
        string memory _name,
        string memory _profileURI,
        uint _royaltyPercentage
    ) external {
        require(registeredArtists[msg.sender], "Artist not registered");
        require(
            _royaltyPercentage <= MAX_ROYALTY_PERCENTAGE,
            "Royalty percentage too high"
        );

        Artist storage artist = artists[msg.sender];
        artist.name = _name;
        artist.profileURI = _profileURI;
        artist.defaultRoyaltyPercentage = _royaltyPercentage;

        emit ArtistProfileUpdated(msg.sender);
    }

    function getArtist(
        address _artistAddress
    )
        external
        view
        returns (
            string memory name,
            string memory profileURI,
            address payable artistAddress,
            bool isVerified,
            uint defaultRoyaltyPercentage
        )
    {
        require(registeredArtists[_artistAddress], "Artist not registered");
        Artist memory artist = artists[_artistAddress];

        return (
            artist.name,
            artist.profileURI,
            artist.artistAddress,
            artist.isVerified,
            artist.defaultRoyaltyPercentage
        );
    }

    function isRegisteredArtist(address _address) external view returns (bool) {
        return registeredArtists[_address];
    }

    function isVerifiedArtist(address _address) external view returns (bool) {
        return registeredArtists[_address] && artists[_address].isVerified;
    }
}
