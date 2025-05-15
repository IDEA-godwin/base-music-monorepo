# 🎵 MusicDapp Smart Contracts

**MusicDapp** is a decentralized music platform that empowers verified artists to tokenize their music, sell editions, receive royalties, and govern the platform. It uses ERC-1155 tokens for flexible music representation and enforces a transparent royalty and funding model.

---

## 📁 Contracts Overview

| Contract              | Responsibility                                        |
| --------------------- | ----------------------------------------------------- |
| `ArtistRegistry`      | Registers and verifies music artists                  |
| `MusicToken`          | Mints and manages music tokens (ERC-1155)             |
| `Marketplace`         | Facilitates buying/selling of music tokens            |
| `RoyaltyDistribution` | Distributes royalties on sales                        |
| `FundingPool`         | Manages pooled funds for artists, staking, grants     |
| `AccessControl`       | Role-based permission system                          |
| `TokenGovernance`     | Token-weighted governance system for proposals/voting |

---
Below is a concise **README.md** covering each contract in the MusicDapp suite, their purpose, and all exposed functions (including constructors). It uses the exact names and signatures from your code.

## 📦 Contracts

### 1. MusicDapp

**Purpose:** Deploys and holds ownership of all sub-modules. Allows the owner to hot-swap module addresses.

```solidity
constructor()                            // Deploys and wires sub-contracts:
                                          // ‣ ArtistRegistry
                                          // ‣ MusicToken(artistRegistry)
                                          // ‣ RoyaltyDistribution
                                          // ‣ FundingPool
                                          // ‣ Marketplace(musicToken, royaltyDistribution, fundingPool, platformWallet)
                                          // ‣ AccessControl(musicToken)
                                          // ‣ TokenGovernance(musicToken)
onlyOwner
function updateContractAddresses(
    address _artistRegistry,
    address _musicToken,
    address _marketplace,
    address _royaltyDistribution,
    address _fundingPool,
    address _accessControl,
    address _governance
) external                               // Swap in new module addresses (if non-zero)
```

---

### 2. ArtistRegistry

**Purpose:** Onboards artists, stores profiles & default royalties, and flags them as verified.

```solidity
function registerArtist(
    string memory _name,
    string memory _profileURI,
    uint256 _royaltyPercentage
) external                              // Anyone registers as an artist

function verifyArtist(address _artistAddress)
    external onlyOwner                   // Admin marks a registered artist as verified

function updateProfile(
    string memory _name,
    string memory _profileURI,
    uint256 _royaltyPercentage
) external                              // Registered artist updates own profile

function getArtist(address _artistAddress)
    external view
    returns (
      string memory name,
      string memory profileURI,
      address payable artistAddress,
      bool isVerified,
      uint256 defaultRoyaltyPercentage
    )                                    // Fetch an artist’s full profile

function isRegisteredArtist(address _address)
    external view returns (bool)        // Quick check

function isVerifiedArtist(address _address)
    external view returns (bool)        // Quick check
```

---

### 3. MusicToken

**Purpose:** ERC-1155 multi-token for music: NFTs, limited editions, or infinite drops. Tracks price & royalty metadata per token.

```solidity
constructor(address _artistRegistryAddress)

function createMusicToken(
    string memory _title,
    string memory _metadataURI,
    uint256 _price,
    uint256 _royaltyPercentage,
    bool _isExclusive,
    uint256 _maxSupply,
    uint256 _initialMint
) external returns (uint256 tokenId)    // Verified artists mint new tokens

function updateTokenPrice(uint256 _tokenId, uint256 _newPrice) external  
                                        // Only the token’s artist

function mintAdditional(uint256 _tokenId, uint256 _amount) external  
                                        // Only the token’s artist; respects maxSupply

function uri(uint256 _tokenId) public view override returns (string memory)
                                        // Returns metadataURI

function getTokenData(uint256 _tokenId)
    external view
    returns (
      string memory title,
      string memory metadataURI,
      address artistAddress,
      uint256 price,
      uint256 royaltyPercentage,
      bool isExclusive,
      uint256 maxSupply,
      uint256 currentSupply
    )                                    // All on-chain token metadata

function getTokenPrice(uint256 _tokenId) external view returns (uint256)
                                        // Shortcut to price
```

---

### 4. Marketplace

**Purpose:** Primary & secondary trading of `MusicToken` with platform fees + royalty integration into `RoyaltyDistribution` & `FundingPool`.

```solidity
constructor(
    address _musicTokenAddress,
    address _royaltyDistributionAddress,
    address _fundingPoolAddress,
    address payable _platformWallet
)

function setPlatformFee(uint256 _feePercentage) external onlyOwner  
                                        // Max 10%

function setPlatformWallet(address payable _platformWallet) external onlyOwner

function buyPrimaryToken(uint256 _tokenId, uint256 _quantity) external payable
                                        // Mints & transfers from artist; splits fees & royalties

function listTokenForSale(uint256 _tokenId, uint256 _price, uint256 _quantity) external
                                        // Seller lists own tokens

function buySecondaryToken(address _seller, uint256 _tokenId, uint256 _quantity) external payable
                                        // Purchases from a listing; pays platform + royalty + seller

function cancelListing(uint256 _tokenId) external  
                                        // Seller withdraws listing

function getSecondaryListing(address _seller, uint256 _tokenId)
    external view returns (address seller, uint256 price, uint256 quantity)
```

---

### 5. RoyaltyDistribution

**Purpose:** Collects and disburses royalties per token, splitting between artist & collaborators.

```solidity
constructor()

function addRoyalty(address _artist, uint256 _tokenId, uint256 _amount)
    external payable                   // Deposit royalties

function addCollaborator(
    uint256 _tokenId,
    address payable _collaborator,
    uint256 _sharePercentage
) external                             // Artist adds collaborators up to 100%

function withdrawRoyalties() external // Artist withdraws all global unclaimed royalties

function withdrawTokenRoyalties(uint256 _tokenId) external
                                      // Distributes this token’s royalties to artist + collaborators

function getAvailableRoyalties(address _artist) external view returns (uint256)

function getTokenRoyalties(address _artist, uint256 _tokenId)
    external view returns (
      uint256 total,
      uint256 withdrawn,
      uint256 available
    )

function getCollaborators(address _artist, uint256 _tokenId)
    external view returns (address[] memory addresses, uint256[] memory shares)
```

---

### 6. FundingPool

**Purpose:** Milestone-based funding for artist projects.

```solidity
constructor()

function addFunds(address _artist, uint256 _amount) external payable
                                      // Deposit ETH into artist’s fund

function createProject(
    string memory _name,
    string memory _description,
    uint256 _fundingGoal,
    uint256 _deadlineDuration,
    string[] memory _milestoneDescriptions,
    uint256[] memory _milestonePercentages
) external                               // Artist defines project + milestones

function fundProject(uint256 _projectId) external
                                      // Draw from artistFunds → project

function releaseMilestone(uint256 _projectId, uint256 _milestoneIndex) external
                                      // After full funding, artist claims each milestone

function getProjectDetails(address _artist, uint256 _projectId)
    external view returns (
      string memory name,
      string memory description,
      uint256 fundingGoal,
      uint256 currentFunding,
      uint256 deadline,
      bool completed,
      bool fundingReleased
    )

function getProjectMilestones(address _artist, uint256 _projectId)
    external view returns (
      string[] memory descriptions,
      uint256[] memory percentages,
      bool[] memory released
    )

function getArtistAvailableFunds(address _artist) external view returns (uint256)
```

---

### 7. AccessControl

**Purpose:** Token-gated content access rules defined by artists.

```solidity
constructor(address _musicTokenAddress)

function createAccessRule(
    uint256 _tokenId,
    uint256 _minQuantity,
    string memory _accessURI
) external returns (bytes32 ruleId)
                                    // Only token’s artist

function updateAccessRule(bytes32 _ruleId, uint256 _minQuantity, string memory _accessURI) external

function deactivateAccessRule(bytes32 _ruleId) external

function checkAccess(address _artist, bytes32 _ruleId, address _holder)
    external view returns (bool granted, string memory accessURI)

function getArtistAccessRules(address _artist)
    external view returns (
      bytes32[] memory ruleIds,
      uint256[] memory tokenIds,
      uint256[] memory minQuantities,
      bool[] memory activeStatuses
    )
```

---

### 8. TokenGovernance

**Purpose:** On-chain proposals & voting weighted by `MusicToken` holdings.

```solidity
constructor(address _musicTokenAddress)

function setVotingPeriod(uint256 _votingPeriod) external onlyOwner

function createProposal(uint256 _tokenId, string memory _description)
    external returns (uint256 proposalId)
                                    // Only token’s artist

function castVote(uint256 _proposalId, bool _support) external
                                    // Votes = holder’s balance of tokenId

function executeProposal(uint256 _proposalId) external
                                    // Only artist; after endTime & if forVotes > againstVotes

function cancelProposal(uint256 _proposalId) external
                                     // Artist or owner

function getProposalDetails(uint256 _proposalId)
    external view returns (
      address artistAddress,
      uint256 tokenId,
      string memory description,
      uint256 forVotes,
      uint256 againstVotes,
      uint256 startTime,
      uint256 endTime,
      ProposalStatus status
    )

function getArtistProposals(address _artist) external view returns (uint256[] memory)

function hasVoted(uint256 _proposalId, address _voter) external view returns (bool)
```

---

## 🔗 How They Work Together

1. **ArtistRegistry** stores and verifies artists.
2. **MusicToken** lets only verified artists mint and manage music NFTs.
3. **Marketplace** sells/mints tokens, pushing royalties into **RoyaltyDistribution** and **FundingPool**.
4. **RoyaltyDistribution** holds royalties, allowing artists & collaborators to withdraw.
5. **FundingPool** lets artists fund projects with collected ETH and release in milestones.
6. **AccessControl** enables token-gated content (URIs) based on ownership.
7. **TokenGovernance** lets token holders vote on proposals the artist creates.
8. **MusicDapp** is the central deployer/owner, orchestrating upgrades and ownership across all modules.
