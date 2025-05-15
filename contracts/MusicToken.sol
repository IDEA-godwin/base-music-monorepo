// SPDX-License-Identifier: MIT
pragma solidity ^0.8.17;

import {Counters} from "./utils/Counters.sol";
import {ArtistRegistry} from "./ArtistRegistry.sol";
import "@openzeppelin/contracts/token/ERC1155/ERC1155.sol";
import "@openzeppelin/contracts/token/ERC20/IERC20.sol";
import "@openzeppelin/contracts/token/ERC20/utils/SafeERC20.sol";
import "@openzeppelin/contracts/access/Ownable.sol";
import "@openzeppelin/contracts/utils/structs/EnumerableSet.sol";
import "@openzeppelin/contracts/interfaces/IERC2981.sol";
import "@openzeppelin/contracts/token/ERC1155/extensions/ERC1155Supply.sol";
import "@openzeppelin/contracts/utils/Strings.sol";

/**
 * @title MusicToken
 * @dev ERC1155 token implementation for music tokenization
 */
contract MusicToken is ERC1155Supply {
    using Counters for Counters.Counter;
    using Strings for uint256;

    ArtistRegistry public artistRegistry;

    Counters.Counter private _tokenIds;

    struct MusicData {
        string title;
        string metadataURI;
        address artistAddress;
        uint256 price;
        uint256 royaltyPercentage;
        bool isExclusive; // true for limited edition, false for mass distribution
        uint256 maxSupply; // 1 for NFT, >1 for limited edition, 0 for unlimited
    }

    mapping(uint256 => MusicData) public musicData;

    event MusicTokenCreated(
        uint256 indexed tokenId,
        address indexed artist,
        string title,
        uint256 price,
        uint256 maxSupply,
        bool isExclusive
    );

    event PriceUpdated(uint256 indexed tokenId, uint256 newPrice);

    constructor(address _artistRegistryAddress) ERC1155("") {
        artistRegistry = ArtistRegistry(_artistRegistryAddress);
    }

    function createMusicToken(
        string memory _title,
        string memory _metadataURI,
        uint256 _price,
        uint256 _royaltyPercentage,
        bool _isExclusive,
        uint256 _maxSupply,
        uint256 _initialMint
    ) external returns (uint256) {
        require(
            artistRegistry.isVerifiedArtist(msg.sender),
            "Only verified artists can create tokens"
        );
        require(
            _initialMint <= _maxSupply || _maxSupply == 0,
            "Initial mint exceeds max supply"
        );

        uint256 newTokenId = _tokenIds.current();
        _tokenIds.increment();

        musicData[newTokenId] = MusicData({
            title: _title,
            metadataURI: _metadataURI,
            artistAddress: msg.sender,
            price: _price,
            royaltyPercentage: _royaltyPercentage,
            isExclusive: _isExclusive,
            maxSupply: _maxSupply
        });

        if (_initialMint > 0) {
            _mint(msg.sender, newTokenId, _initialMint, "");
        }

        emit MusicTokenCreated(
            newTokenId,
            msg.sender,
            _title,
            _price,
            _maxSupply,
            _isExclusive
        );

        return newTokenId;
    }

    function updateTokenPrice(uint256 _tokenId, uint256 _newPrice) external {
        require(
            msg.sender == musicData[_tokenId].artistAddress,
            "Only token artist can update price"
        );

        musicData[_tokenId].price = _newPrice;

        emit PriceUpdated(_tokenId, _newPrice);
    }

    function mintAdditional(uint256 _tokenId, uint256 _amount) external {
        MusicData memory data = musicData[_tokenId];
        require(
            msg.sender == data.artistAddress,
            "Only token artist can mint additional"
        );

        if (data.maxSupply > 0) {
            uint256 currentSupply = totalSupply(_tokenId);
            require(
                currentSupply + _amount <= data.maxSupply,
                "Would exceed max supply"
            );
        }

        _mint(msg.sender, _tokenId, _amount, "");
    }

    function uri(
        uint256 _tokenId
    ) public view override returns (string memory) {
        require(exists(_tokenId), "URI query for nonexistent token");
        return musicData[_tokenId].metadataURI;
    }

    function getTokenData(
        uint256 _tokenId
    )
        external
        view
        returns (
            string memory title,
            string memory metadataURI,
            address artistAddress,
            uint256 price,
            uint256 royaltyPercentage,
            bool isExclusive,
            uint256 maxSupply,
            uint256 currentSupply
        )
    {
        require(exists(_tokenId), "Token does not exist");
        MusicData memory data = musicData[_tokenId];

        return (
            data.title,
            data.metadataURI,
            data.artistAddress,
            data.price,
            data.royaltyPercentage,
            data.isExclusive,
            data.maxSupply,
            totalSupply(_tokenId)
        );
    }

    function getTokenPrice(uint256 _tokenId) external view returns (uint256) {
        require(exists(_tokenId), "Token does not exist");
        return musicData[_tokenId].price;
    }
}
