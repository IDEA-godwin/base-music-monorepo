// SPDX-License-Identifier: MIT
pragma solidity ^0.8.17;

import {MusicToken} from "./MusicToken.sol";
import {Ownable} from "@openzeppelin/contracts/access/Ownable.sol";
import {ArtistRegistry} from "./ArtistRegistry.sol";
import {Marketplace} from "./Marketplace.sol";
import {RoyaltyDistribution} from "./RoyaltyDistribution.sol";
import {FundingPool} from "./FundingPool.sol";
import {AccessControl} from "./AccessControl.sol";
import {TokenGovernance} from "./TokenGovernance.sol";

/**
 * @title MusicDapp
 * @dev Main dApp contract that manages all other contracts
 */
contract MusicDapp is Ownable {
    ArtistRegistry public artistRegistry;
    MusicToken public musicToken;
    Marketplace public marketplace;
    RoyaltyDistribution public royaltyDistribution;
    FundingPool public fundingPool;
    AccessControl public accessControl;
    TokenGovernance public governance;

    constructor() Ownable(msg.sender) {
        // Initialize all contracts
        artistRegistry = new ArtistRegistry();

        musicToken = new MusicToken(address(artistRegistry));

        royaltyDistribution = new RoyaltyDistribution();

        fundingPool = new FundingPool();

        marketplace = new Marketplace(
            address(musicToken),
            address(royaltyDistribution),
            address(fundingPool),
            payable(msg.sender)
        );

        accessControl = new AccessControl(address(musicToken));

        governance = new TokenGovernance(address(musicToken));

        // Transfer ownership of contracts to this contract
        artistRegistry.transferOwnership(address(this));
        musicToken.transferOwnership(address(this));
        royaltyDistribution.transferOwnership(address(this));
        fundingPool.transferOwnership(address(this));
        marketplace.transferOwnership(address(this));
        accessControl.transferOwnership(address(this));
        governance.transferOwnership(address(this));
    }

    function updateContractAddresses(
        address _artistRegistry,
        address _musicToken,
        address _marketplace,
        address _royaltyDistribution,
        address _fundingPool,
        address _accessControl,
        address _governance
    ) external onlyOwner {
        if (_artistRegistry != address(0)) {
            artistRegistry = ArtistRegistry(_artistRegistry);
        }

        if (_musicToken != address(0)) {
            musicToken = MusicToken(_musicToken);
        }

        if (_marketplace != address(0)) {
            marketplace = Marketplace(_marketplace);
        }

        if (_royaltyDistribution != address(0)) {
            royaltyDistribution = RoyaltyDistribution(_royaltyDistribution);
        }

        if (_fundingPool != address(0)) {
            fundingPool = FundingPool(_fundingPool);
        }

        if (_accessControl != address(0)) {
            accessControl = AccessControl(_accessControl);
        }

        if (_governance != address(0)) {
            governance = TokenGovernance(_governance);
        }
    }
}
