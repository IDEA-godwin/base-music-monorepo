// SPDX-License-Identifier: MIT
pragma solidity ^0.8.17;

import {MusicToken} from "./MusicToken.sol";
import {RoyaltyDistribution} from "./RoyaltyDistribution.sol";
import {FundingPool} from "./FundingPool.sol";
import "@openzeppelin/contracts/token/ERC1155/ERC1155.sol";
import "@openzeppelin/contracts/token/ERC20/IERC20.sol";
import "@openzeppelin/contracts/token/ERC20/utils/SafeERC20.sol";
import "@openzeppelin/contracts/access/Ownable.sol";
import "@openzeppelin/contracts/utils/structs/EnumerableSet.sol";
import "@openzeppelin/contracts/interfaces/IERC2981.sol";

/**
 * @title Marketplace
 * @dev Secondary trading of music tokens with royalty support
 */
contract Marketplace is Ownable {
    MusicToken public musicToken;
    RoyaltyDistribution public royaltyDistribution;
    FundingPool public fundingPool;

    uint256 public platformFeePercentage = 2; // 2% platform fee
    address payable public platformWallet;

    event TokenPurchased(
        uint256 indexed tokenId,
        address indexed buyer,
        address indexed seller,
        uint256 quantity,
        uint256 price
    );

    event TokenListed(
        uint256 indexed tokenId,
        address indexed seller,
        uint256 price,
        uint256 quantity
    );
    event TokenDelisted(uint256 indexed tokenId, address indexed seller);

    struct Listing {
        address seller;
        uint256 price;
        uint256 quantity;
    }

    mapping(address => mapping(uint256 => Listing)) public secondaryListings;

    constructor(
        address _musicTokenAddress,
        address _royaltyDistributionAddress,
        address _fundingPoolAddress,
        address payable _platformWallet
    ) Ownable(msg.sender) {
        musicToken = MusicToken(_musicTokenAddress);
        royaltyDistribution = RoyaltyDistribution(_royaltyDistributionAddress);
        fundingPool = FundingPool(_fundingPoolAddress);
        platformWallet = _platformWallet;
    }

    function setPlatformFee(uint256 _feePercentage) external onlyOwner {
        require(_feePercentage <= 10, "Fee too high"); // Max 10%
        platformFeePercentage = _feePercentage;
    }

    function setPlatformWallet(
        address payable _platformWallet
    ) external onlyOwner {
        platformWallet = _platformWallet;
    }

    function buyPrimaryToken(
        uint256 _tokenId,
        uint256 _quantity
    ) external payable {
        require(_quantity > 0, "Quantity must be greater than zero");

        (
            ,
            ,
            address artistAddress,
            uint256 price,
            uint256 royaltyPercentage,
            ,
            uint256 maxSupply,
            uint256 currentSupply
        ) = musicToken.getTokenData(_tokenId);

        require(artistAddress != address(0), "Token does not exist");
        require(
            maxSupply == 0 || currentSupply + _quantity <= maxSupply,
            "Not enough tokens available"
        );
        require(msg.value >= price * _quantity, "Insufficient funds sent");

        // Calculate fee distribution
        uint256 totalPrice = price * _quantity;
        uint256 platformFee = (totalPrice * platformFeePercentage) / 100;

        uint256 artistProceeds = totalPrice - platformFee;
        uint256 royaltyPortion = (artistProceeds * royaltyPercentage) / 100;
        uint256 fundingPortion = artistProceeds - royaltyPortion;

        // Transfer fees
        platformWallet.transfer(platformFee);

        // Distribute royalties and add to funding pool
        royaltyDistribution.addRoyalty{value: royaltyPortion}(
            artistAddress,
            _tokenId,
            royaltyPortion
        );
        fundingPool.addFunds{value: fundingPortion}(artistAddress, fundingPortion);

        // Mint token to buyer
        musicToken.mintAdditional(_tokenId, _quantity);
        musicToken.safeTransferFrom(
            artistAddress,
            msg.sender,
            _tokenId,
            _quantity,
            ""
        );

        emit TokenPurchased(
            _tokenId,
            msg.sender,
            artistAddress,
            _quantity,
            price
        );
    }

    function listTokenForSale(
        uint256 _tokenId,
        uint256 _price,
        uint256 _quantity
    ) external {
        require(
            musicToken.balanceOf(msg.sender, _tokenId) >= _quantity,
            "Insufficient token balance"
        );
        require(_price > 0, "Price must be greater than zero");
        require(_quantity > 0, "Quantity must be greater than zero");

        secondaryListings[msg.sender][_tokenId] = Listing({
            seller: msg.sender,
            price: _price,
            quantity: _quantity
        });

        // Approve the marketplace to transfer tokens
        musicToken.setApprovalForAll(address(this), true);

        emit TokenListed(_tokenId, msg.sender, _price, _quantity);
    }

    function buySecondaryToken(
        address _seller,
        uint256 _tokenId,
        uint256 _quantity
    ) external payable {
        Listing memory listing = secondaryListings[_seller][_tokenId];

        require(
            listing.seller == _seller,
            "No active listing from this seller"
        );
        require(listing.quantity >= _quantity, "Not enough tokens listed");
        require(
            msg.value >= listing.price * _quantity,
            "Insufficient funds sent"
        );

        (
            ,
            ,
            address artistAddress,
            ,
            uint256 royaltyPercentage,
            ,
            ,

        ) = musicToken.getTokenData(_tokenId);

        // Calculate fee distribution
        uint256 totalPrice = listing.price * _quantity;
        uint256 platformFee = (totalPrice * platformFeePercentage) / 100;
        uint256 royaltyAmount = (totalPrice * royaltyPercentage) / 100;
        uint256 sellerAmount = totalPrice - platformFee - royaltyAmount;

        // Transfer fees
        platformWallet.transfer(platformFee);

        // Transfer royalties to artist
        if (royaltyAmount > 0) {
            royaltyDistribution.addRoyalty{value: royaltyAmount}(
                artistAddress,
                _tokenId,
                royaltyAmount
            );
        }

        // Transfer remaining amount to seller
        payable(_seller).transfer(sellerAmount);

        // Transfer token to buyer
        musicToken.safeTransferFrom(
            _seller,
            msg.sender,
            _tokenId,
            _quantity,
            ""
        );

        // Update listing
        if (listing.quantity == _quantity) {
            delete secondaryListings[_seller][_tokenId];
        } else {
            secondaryListings[_seller][_tokenId].quantity -= _quantity;
        }

        emit TokenPurchased(
            _tokenId,
            msg.sender,
            _seller,
            _quantity,
            listing.price
        );
    }

    function cancelListing(uint256 _tokenId) external {
        require(
            secondaryListings[msg.sender][_tokenId].seller == msg.sender,
            "No active listing found"
        );

        delete secondaryListings[msg.sender][_tokenId];

        emit TokenDelisted(_tokenId, msg.sender);
    }

    function getSecondaryListing(
        address _seller,
        uint256 _tokenId
    ) external view returns (address seller, uint256 price, uint256 quantity) {
        Listing memory listing = secondaryListings[_seller][_tokenId];
        return (listing.seller, listing.price, listing.quantity);
    }
}
