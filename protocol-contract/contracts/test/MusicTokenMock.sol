// Mock contracts for testing
contract MusicTokenMock {
    struct TokenData {
        string name;
        string tokenURI;
        address artistAddress;
        uint256 price;
        uint256 royaltyPercentage;
        bool isActive;
        uint256 maxSupply;
        uint256 currentSupply;
    }

    mapping(uint256 => TokenData) private tokenData;
    mapping(address => mapping(uint256 => uint256)) private balances;

    bool public approvalSet;
    bool public mintCalled;
    bool public transferCalled;

    function mintToken(
        address _to,
        uint256 _tokenId,
        string memory _name,
        string memory _tokenURI,
        uint256 _amount
    ) external {
        tokenData[_tokenId] = TokenData({
            name: _name,
            tokenURI: _tokenURI,
            artistAddress: msg.sender,
            price: 0,
            royaltyPercentage: 0,
            isActive: true,
            maxSupply: 0,
            currentSupply: _amount
        });
        balances[_to][_tokenId] += _amount;
    }

    function setTokenData(
        uint256 _tokenId,
        string memory _name,
        string memory _tokenURI,
        address _artistAddress,
        uint256 _price,
        uint256 _royaltyPercentage,
        bool _isActive,
        uint256 _maxSupply,
        uint256 _currentSupply
    ) external {
        tokenData[_tokenId] = TokenData({
            name: _name,
            tokenURI: _tokenURI,
            artistAddress: _artistAddress,
            price: _price,
            royaltyPercentage: _royaltyPercentage,
            isActive: _isActive,
            maxSupply: _maxSupply,
            currentSupply: _currentSupply
        });
    }

    function getTokenData(
        uint256 _tokenId
    )
        external
        view
        returns (
            string memory name,
            string memory tokenURI,
            address artistAddress,
            uint256 price,
            uint256 royaltyPercentage,
            bool isActive,
            uint256 maxSupply,
            uint256 currentSupply
        )
    {
        TokenData memory token = tokenData[_tokenId];
        return (
            token.name,
            token.tokenURI,
            token.artistAddress,
            token.price,
            token.royaltyPercentage,
            token.isActive,
            token.maxSupply,
            token.currentSupply
        );
    }

    function mock_balanceOf(
        address _account,
        uint256 _id,
        uint256 _balance
    ) external {
        balances[_account][_id] = _balance;
    }

    function balanceOf(
        address _account,
        uint256 _id
    ) external view returns (uint256) {
        return balances[_account][_id];
    }

    function mock_setApprovalForAll() external {
        approvalSet = true;
    }

    function setApprovalForAll(address _operator, bool _approved) external {
        approvalSet = true;
    }

    function mock_mintAdditional() external {
        mintCalled = true;
    }

    function mintAdditional(uint256 _tokenId, uint256 _quantity) external {
        mintCalled = true;
        tokenData[_tokenId].currentSupply += _quantity;
    }

    function mock_safeTransferFrom() external {
        transferCalled = true;
    }

    function safeTransferFrom(
        address _from,
        address _to,
        uint256 _id,
        uint256 _amount,
        bytes memory _data
    ) external {
        transferCalled = true;
    }
}

contract RoyaltyDistributionMock {
    bool public royaltyAdded;

    function addRoyalty(
        address _artistAddress,
        uint256 _tokenId,
        uint256 _amount
    ) external payable {
        royaltyAdded = true;
    }
}

contract FundingPoolMock {
    bool public fundsAdded;

    function addFunds(address _artist, uint256 _amount) external payable {
        fundsAdded = true;
    }
}

// SPDX-License-Identifier: MIT
pragma solidity ^0.8.17;

import "@openzeppelin/contracts/token/ERC1155/ERC1155.sol";

contract MockMusicToken is ERC1155 {
    mapping(uint256 => address) public tokenArtists;

    constructor() ERC1155("") {}

    function mint(address account, uint256 id, uint256 amount) external {
        _mint(account, id, amount, "");
    }

    function setTokenData(uint256 id, address artist) external {
        tokenArtists[id] = artist;
    }

    function getTokenData(
        uint256 id
    )
        external
        view
        returns (
            uint256,
            string memory,
            address,
            address,
            uint256,
            uint256,
            string memory,
            bool
        )
    {
        // Make sure the artist address is properly set and returned
        return (
            id, // tokenId
            "Test Token", // name
            tokenArtists[id], // artistAddress - this should be properly set
            address(0), // owner
            0, // price
            0, // royaltyPercentage
            "", // tokenURI
            false // isForSale
        );
    }
}
