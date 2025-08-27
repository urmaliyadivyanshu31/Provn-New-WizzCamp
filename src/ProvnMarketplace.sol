// SPDX-License-Identifier: MIT
pragma solidity ^0.8.29;

import { IERC20 } from "@openzeppelin/contracts/token/ERC20/IERC20.sol";
import { SafeERC20 } from "@openzeppelin/contracts/token/ERC20/utils/SafeERC20.sol";
import { Ownable } from "@openzeppelin/contracts/access/Ownable.sol";
import { Pausable } from "@openzeppelin/contracts/utils/Pausable.sol";
import { ReentrancyGuard } from "@openzeppelin/contracts/utils/ReentrancyGuard.sol";
import { Address } from "@openzeppelin/contracts/utils/Address.sol";

interface IIpNFT {
    function ownerOf(uint256 tokenId) external view returns (address);
    function getTerms(uint256 tokenId) external view returns (uint128 price, uint32 duration, uint16 royaltyBps, address paymentToken);
}

/// @title Provn Marketplace
/// @notice Enhanced marketplace for content licensing with community features
/// @dev Implements industry-standard security practices for DeFi protocols
contract ProvnMarketplace is Ownable, Pausable, ReentrancyGuard {
    using SafeERC20 for IERC20;
    using Address for address;

    /*´:°•.°+.*•´.*:˚.°*.˚•´.°:°•.°•.*•´.*:˚.°*.˚•´.°:°•.°+.*•´.*:*/
    /*                          CONSTANTS                         */
    /*.•°:°.´+˚.*°.˚:*.´•*.+°.•°:´*.´•*.•°.•°:°.´:•˚°.*°.˚:*.´+°.•*/

    /// @dev Maximum protocol fee (10%)
    uint16 public constant MAX_PROTOCOL_FEE = 1000;
    
    /// @dev Maximum royalty percentage (10%)
    uint16 public constant MAX_ROYALTY_BPS = 1000;
    
    /// @dev Maximum subscription periods
    uint256 public constant MAX_SUBSCRIPTION_PERIOD = 12;
    
    /// @dev Minimum license duration (1 hour)
    uint32 public constant MIN_LICENSE_DURATION = 3600;
    
    /// @dev Maximum license duration (5 years)
    uint32 public constant MAX_LICENSE_DURATION = 157680000;
    
    /// @dev Community name length limits
    uint256 public constant MIN_NAME_LENGTH = 3;
    uint256 public constant MAX_NAME_LENGTH = 50;
    uint256 public constant MAX_DESCRIPTION_LENGTH = 500;

    /*´:°•.°+.*•´.*:˚.°*.˚•´.°:°•.°•.*•´.*:˚.°*.˚•´.°:°•.°+.*•´.*:*/
    /*                          ENUMS & STRUCTS                   */
    /*.•°:°.´+˚.*°.˚:*.´•*.+°.•°:´*.´•*.•°.•°:°.´:•˚°.*°.˚:*.´+°.•*/

    enum LicenseType {
        BASIC,      // Social media reposting with attribution
        COMMERCIAL, // Use in videos & commercial content
        FULL_RIGHTS // Complete usage freedom
    }

    enum CommunityTier {
        BRONZE,  // 1-10 derivatives
        SILVER,  // 11-50 derivatives  
        GOLD,    // 51-100 derivatives
        PLATINUM // 100+ derivatives
    }

    struct LicenseTerms {
        uint128 price;           // Price in CAMP tokens (using uint128 for gas optimization)
        uint32 duration;         // License duration in seconds
        LicenseType licenseType; // Type of license
        bool transferable;       // Can license be transferred
        uint16 royaltyBps;      // Royalty percentage for derivatives
        bool active;            // Whether license terms are active
    }

    struct License {
        uint256 tokenId;
        address licensee;
        LicenseType licenseType;
        uint64 expiryTimestamp;  // Using uint64 for timestamp (sufficient until year 584 billion)
        bool active;
        uint128 purchasePrice;   // Using uint128 for gas optimization
    }

    struct Community {
        uint256 creatorTokenId;      // Original content that started community
        address creator;             // Community creator/admin
        string name;                 // Community name
        string description;          // Community description
        uint64 createdAt;           // Creation timestamp
        uint64 memberCount;         // Number of members
        uint64 derivativeCount;     // Number of derivatives created
        CommunityTier tier;         // Community tier based on activity
        bool active;                // Community status
    }

    /*´:°•.°+.*•´.*:˚.°*.˚•´.°:°•.°•.*•´.*:˚.°*.˚•´.°:°•.°+.*•´.*:*/
    /*                          STORAGE                           */
    /*.•°:°.´+˚.*°.˚:*.´•*.+°.•°:´*.´•*.•°.•°:°.´:•˚°.*°.˚:*.´+°.•*/

    /// @dev The IP-NFT contract
    IIpNFT public immutable ipToken;
    
    /// @dev CAMP token contract
    IERC20 public immutable campToken;
    
    /// @dev Protocol treasury
    address public treasury;
    
    /// @dev Protocol fee in basis points
    uint16 public protocolFeeBps = 250; // 2.5%

    /// @dev License terms for each token
    mapping(uint256 => LicenseTerms) public licenseTerms;
    
    /// @dev Active licenses: tokenId => licensee => License
    mapping(uint256 => mapping(address => License)) public licenses;
    
    /// @dev License expiry: tokenId => licensee => timestamp
    mapping(uint256 => mapping(address => uint64)) public licenseExpiry;
    
    /// @dev Communities storage
    mapping(uint256 => Community) public communities;
    
    /// @dev Community members: communityId => member => isMember
    mapping(uint256 => mapping(address => bool)) public communityMembers;
    
    /// @dev Community derivatives: communityId => tokenId => isDerivative
    mapping(uint256 => mapping(uint256 => bool)) public communityDerivatives;
    
    /// @dev Member join dates: communityId => member => joinDate
    mapping(uint256 => mapping(address => uint64)) public memberJoinDate;
    
    /// @dev Community counter
    uint256 public communityCounter;
    
    /// @dev Creator to community mapping
    mapping(address => uint256[]) public creatorCommunities;
    
    /// @dev Token to community mapping
    mapping(uint256 => uint256) public tokenToCommunity;
    
    /// @dev Monthly top creators (for community creation rights)
    mapping(uint256 => address[2]) public monthlyTopCreators;
    
    /// @dev Creator statistics for leaderboard
    mapping(address => uint256) public creatorRevenue;
    mapping(address => uint256) public creatorLicensesSold;
    mapping(address => uint256) public creatorDerivativeCount;
    
    /// @dev Emergency pause flag for specific functions
    mapping(bytes4 => bool) public functionPaused;

    /*´:°•.°+.*•´.*:˚.°*.˚•´.°:°•.°•.*•´.*:˚.°*.˚•´.°:°•.°+.*•´.*:*/
    /*                          EVENTS                            */
    /*.•°:°.´+˚.*°.˚:*.´•*.+°.•°:´*.´•*.•°.•°:°.´:•˚°.*°.˚:*.´+°.•*/

    event LicenseTermsSet(
        uint256 indexed tokenId,
        uint128 price,
        uint32 duration,
        LicenseType licenseType,
        bool transferable,
        uint16 royaltyBps
    );

    event LicensePurchased(
        uint256 indexed tokenId,
        address indexed licensee,
        LicenseType licenseType,
        uint128 price,
        uint64 expiryTimestamp
    );

    event CommunityCreated(
        uint256 indexed communityId,
        uint256 indexed creatorTokenId,
        address indexed creator,
        string name
    );

    event MemberJoined(
        uint256 indexed communityId,
        address indexed member,
        uint64 timestamp
    );

    event MemberLeft(
        uint256 indexed communityId,
        address indexed member,
        uint64 timestamp
    );

    event DerivativeAdded(
        uint256 indexed communityId,
        uint256 indexed derivativeTokenId,
        address indexed creator
    );

    event CommunityTierUpgraded(
        uint256 indexed communityId,
        CommunityTier newTier
    );

    event ProtocolFeeUpdated(uint16 oldFee, uint16 newFee);
    
    event TreasuryUpdated(address oldTreasury, address newTreasury);
    
    event MonthlyTopCreatorsSet(uint256 indexed month, address creator1, address creator2);
    
    event FunctionPauseStatusChanged(bytes4 indexed functionSelector, bool paused);

    /*´:°•.°+.*•´.*:˚.°*.˚•´.°:°•.°•.*•´.*:˚.°*.˚•´.°:°•.°+.*•´.*:*/
    /*                          ERRORS                            */
    /*.•°:°.´+˚.*°.˚:*.´•*.+°.•°:´*.´•*.•°.•°:°.´:•˚°.*°.˚:*.´+°.•*/

    error NotTokenOwner();
    error InvalidRoyalty();
    error InvalidPeriods();
    error LicenseNotAvailable();
    error InsufficientBalance();
    error InvalidDuration();
    error InvalidPrice();
    error CommunityNotActive();
    error AlreadyMember();
    error NotMember();
    error AlreadyAdded();
    error NoActiveLicense();
    error NotEligibleForCommunity();
    error InvalidName();
    error InvalidDescription();
    error FeeExceedsMaximum();
    error InvalidAddress();
    error FunctionPaused();
    error InvalidMonth();
    error SameCreators();
    error CreatorCannotBeZero();
    error CommunityDoesNotExist();
    error TokenAlreadyInCommunity();

    /*´:°•.°+.*•´.*:˚.°*.˚•´.°:°•.°•.*•´.*:˚.°*.˚•´.°:°•.°+.*•´.*:*/
    /*                          MODIFIERS                         */
    /*.•°:°.´+˚.*°.˚:*.´•*.+°.•°:´*.´•*.•°.•°:°.´:•˚°.*°.˚:*.´+°.•*/

    modifier onlyTokenOwner(uint256 tokenId) {
        if (ipToken.ownerOf(tokenId) != msg.sender) revert NotTokenOwner();
        _;
    }

    modifier validAddress(address addr) {
        if (addr == address(0)) revert InvalidAddress();
        _;
    }

    modifier functionNotPaused(bytes4 functionSelector) {
        if (functionPaused[functionSelector]) revert FunctionPaused();
        _;
    }

    modifier communityExists(uint256 communityId) {
        if (communityId == 0 || communityId > communityCounter) revert CommunityDoesNotExist();
        _;
    }

    /*´:°•.°+.*•´.*:˚.°*.˚•´.°:°•.°•.*•´.*:˚.°*.˚•´.°:°•.°+.*•´.*:*/
    /*                          CONSTRUCTOR                       */
    /*.•°:°.´+˚.*°.˚:*.´•*.+°.•°:´*.´•*.•°.•°:°.´:•˚°.*°.˚:*.´+°.•*/

    constructor(
        address _ipToken,
        address _campToken,
        address _treasury
    ) 
        Ownable(msg.sender) 
        validAddress(_ipToken)
        validAddress(_campToken)
        validAddress(_treasury)
    {
        ipToken = IIpNFT(_ipToken);
        campToken = IERC20(_campToken);
        treasury = _treasury;
    }

    /*´:°•.°+.*•´.*:˚.°*.˚•´.°:°•.°•.*•´.*:˚.°*.˚•´.°:°•.°+.*•´.*:*/
    /*                      LICENSING FUNCTIONS                   */
    /*.•°:°.´+˚.*°.˚:*.´•*.+°.•°:´*.´•*.•°.•°:°.´:•˚°.*°.˚:*.´+°.•*/

    /// @notice Set license terms for a token (only token owner)
    function setLicenseTerms(
        uint256 tokenId,
        uint128 price,
        uint32 duration,
        LicenseType licenseType,
        bool transferable,
        uint16 royaltyBps
    ) 
        external 
        whenNotPaused
        nonReentrant
        onlyTokenOwner(tokenId)
        functionNotPaused(this.setLicenseTerms.selector)
    {
        if (royaltyBps > MAX_ROYALTY_BPS) revert InvalidRoyalty();
        if (duration < MIN_LICENSE_DURATION || duration > MAX_LICENSE_DURATION) revert InvalidDuration();
        if (price == 0) revert InvalidPrice();
        
        licenseTerms[tokenId] = LicenseTerms({
            price: price,
            duration: duration,
            licenseType: licenseType,
            transferable: transferable,
            royaltyBps: royaltyBps,
            active: true
        });

        emit LicenseTermsSet(tokenId, price, duration, licenseType, transferable, royaltyBps);
    }

    /// @notice Sync license terms from IP-NFT contract to ProvnMarketplace (anyone can call)
    function syncLicenseTermsFromIPNFT(uint256 tokenId) 
        external 
        whenNotPaused
        nonReentrant
        functionNotPaused(this.syncLicenseTermsFromIPNFT.selector)
    {
        // Skip if already synced and active
        if (licenseTerms[tokenId].active && licenseTerms[tokenId].price > 0) {
            return;
        }
        
        (uint128 ipPrice, uint32 ipDuration, uint16 ipRoyalty, address ipPaymentToken) = ipToken.getTerms(tokenId);
        
        if (ipPrice > 0 && ipDuration > 0) {
            licenseTerms[tokenId] = LicenseTerms({
                price: ipPrice,
                duration: ipDuration,
                licenseType: LicenseType.BASIC, // Default for synced terms
                transferable: true, // Default for synced terms
                royaltyBps: ipRoyalty,
                active: true
            });
            
            emit LicenseTermsSet(tokenId, ipPrice, ipDuration, LicenseType.BASIC, true, ipRoyalty);
        } else {
            revert LicenseNotAvailable();
        }
    }

    /// @notice Purchase a license for content
    function purchaseLicense(uint256 tokenId, uint32 periods) 
        external 
        whenNotPaused
        nonReentrant
        functionNotPaused(this.purchaseLicense.selector)
    {
        if (periods == 0 || periods > MAX_SUBSCRIPTION_PERIOD) revert InvalidPeriods();
        
        // First try to get terms from ProvnMarketplace storage (for backward compatibility)
        LicenseTerms memory terms = licenseTerms[tokenId];
        
        // If not available in ProvnMarketplace, read from IP-NFT contract
        if (!terms.active || terms.price == 0) {
            (uint128 ipPrice, uint32 ipDuration, uint16 ipRoyalty, address ipPaymentToken) = ipToken.getTerms(tokenId);
            
            // Check if IP-NFT has valid terms
            if (ipPrice > 0 && ipDuration > 0) {
                terms = LicenseTerms({
                    price: ipPrice,
                    duration: ipDuration,
                    licenseType: LicenseType.BASIC, // Default to BASIC for IP-NFT terms
                    transferable: true, // Default to transferable
                    royaltyBps: ipRoyalty,
                    active: true
                });
            } else {
                revert LicenseNotAvailable();
            }
        }
        
        uint256 totalPrice = uint256(terms.price) * periods;
        uint256 protocolFee = (totalPrice * protocolFeeBps) / 10000;
        uint256 creatorPayment = totalPrice - protocolFee;
        
        // Check user balance before proceeding
        if (campToken.balanceOf(msg.sender) < totalPrice) revert InsufficientBalance();
        
        address tokenOwner = ipToken.ownerOf(tokenId);
        
        // Transfer payment
        campToken.transferFrom(msg.sender, treasury, protocolFee);
        campToken.transferFrom(msg.sender, tokenOwner, creatorPayment);
        
        // Calculate new expiry
        uint64 currentExpiry = licenseExpiry[tokenId][msg.sender];
        uint64 newExpiry;
        
        if (currentExpiry <= block.timestamp) {
            newExpiry = uint64(block.timestamp + (uint256(terms.duration) * periods));
        } else {
            newExpiry = uint64(currentExpiry + (uint256(terms.duration) * periods));
        }
        
        licenseExpiry[tokenId][msg.sender] = newExpiry;
        
        // Store license details
        licenses[tokenId][msg.sender] = License({
            tokenId: tokenId,
            licensee: msg.sender,
            licenseType: terms.licenseType,
            expiryTimestamp: newExpiry,
            active: true,
            purchasePrice: uint128(totalPrice)
        });
        
        // Update creator stats
        unchecked {
            creatorRevenue[tokenOwner] += creatorPayment;
            creatorLicensesSold[tokenOwner]++;
        }
        
        emit LicensePurchased(tokenId, msg.sender, terms.licenseType, uint128(totalPrice), newExpiry);
    }

    /// @notice Check if user has active license
    function hasActiveLicense(address user, uint256 tokenId) external view returns (bool) {
        return licenseExpiry[tokenId][user] > block.timestamp;
    }

    /*´:°•.°+.*•´.*:˚.°*.˚•´.°:°•.°•.*•´.*:˚.°*.˚•´.°:°•.°+.*•´.*:*/
    /*                     COMMUNITY FUNCTIONS                    */
    /*.•°:°.´+˚.*°.˚:*.´•*.+°.•°:´*.´•*.•°.•°:°.´:•˚°.*°.˚:*.´+°.•*/

    /// @notice Create a new community (only top 2 creators monthly)
    function createCommunity(
        uint256 creatorTokenId,
        string calldata name,
        string calldata description
    ) 
        external 
        whenNotPaused
        nonReentrant
        onlyTokenOwner(creatorTokenId)
        functionNotPaused(this.createCommunity.selector)
    {
        if (!_canCreateCommunity(msg.sender)) revert NotEligibleForCommunity();
        if (bytes(name).length < MIN_NAME_LENGTH || bytes(name).length > MAX_NAME_LENGTH) {
            revert InvalidName();
        }
        if (bytes(description).length > MAX_DESCRIPTION_LENGTH) revert InvalidDescription();
        if (tokenToCommunity[creatorTokenId] != 0) revert TokenAlreadyInCommunity();
        
        uint256 communityId = ++communityCounter;
        
        communities[communityId] = Community({
            creatorTokenId: creatorTokenId,
            creator: msg.sender,
            name: name,
            description: description,
            createdAt: uint64(block.timestamp),
            memberCount: 1,
            derivativeCount: 0,
            tier: CommunityTier.BRONZE,
            active: true
        });
        
        communityMembers[communityId][msg.sender] = true;
        memberJoinDate[communityId][msg.sender] = uint64(block.timestamp);
        
        creatorCommunities[msg.sender].push(communityId);
        tokenToCommunity[creatorTokenId] = communityId;
        
        emit CommunityCreated(communityId, creatorTokenId, msg.sender, name);
    }

    /// @notice Join a community
    function joinCommunity(uint256 communityId) 
        external 
        whenNotPaused
        nonReentrant
        communityExists(communityId)
        functionNotPaused(this.joinCommunity.selector)
    {
        Community storage community = communities[communityId];
        if (!community.active) revert CommunityNotActive();
        if (communityMembers[communityId][msg.sender]) revert AlreadyMember();
        
        communityMembers[communityId][msg.sender] = true;
        memberJoinDate[communityId][msg.sender] = uint64(block.timestamp);
        
        unchecked {
            community.memberCount++;
        }
        
        emit MemberJoined(communityId, msg.sender, uint64(block.timestamp));
    }

    /// @notice Add derivative content to community
    function addDerivativeToCommunit(uint256 communityId, uint256 derivativeTokenId) 
        external 
        whenNotPaused
        nonReentrant
        onlyTokenOwner(derivativeTokenId)
        communityExists(communityId)
        functionNotPaused(this.addDerivativeToCommunit.selector)
    {
        Community storage community = communities[communityId];
        if (!community.active) revert CommunityNotActive();
        if (!communityMembers[communityId][msg.sender]) revert NotMember();
        if (communityDerivatives[communityId][derivativeTokenId]) revert AlreadyAdded();
        
        // Verify user has license for original content
        if (licenseExpiry[community.creatorTokenId][msg.sender] <= block.timestamp) {
            revert NoActiveLicense();
        }
        
        communityDerivatives[communityId][derivativeTokenId] = true;
        
        unchecked {
            community.derivativeCount++;
            creatorDerivativeCount[community.creator]++;
        }
        
        // Check for tier upgrade
        _checkTierUpgrade(communityId);
        
        emit DerivativeAdded(communityId, derivativeTokenId, msg.sender);
    }

    /*´:°•.°+.*•´.*:˚.°*.˚•´.°:°•.°•.*•´.*:˚.°*.˚•´.°:°•.°+.*•´.*:*/
    /*                      ADMIN FUNCTIONS                       */
    /*.•°:°.´+˚.*°.˚:*.´•*.+°.•°:´*.´•*.•°.•°:°.´:•˚°.*°.˚:*.´+°.•*/

    /// @notice Set monthly top creators (admin only)
    function setMonthlyTopCreators(uint256 month, address[2] calldata topCreators) 
        external 
        onlyOwner 
    {
        if (month == 0) revert InvalidMonth();
        if (topCreators[0] == address(0) || topCreators[1] == address(0)) revert CreatorCannotBeZero();
        if (topCreators[0] == topCreators[1]) revert SameCreators();
        
        monthlyTopCreators[month] = topCreators;
        
        emit MonthlyTopCreatorsSet(month, topCreators[0], topCreators[1]);
    }

    /// @notice Update protocol fee
    function updateProtocolFee(uint16 newFeeBps) external onlyOwner {
        if (newFeeBps > MAX_PROTOCOL_FEE) revert FeeExceedsMaximum();
        
        uint16 oldFee = protocolFeeBps;
        protocolFeeBps = newFeeBps;
        
        emit ProtocolFeeUpdated(oldFee, newFeeBps);
    }

    /*´:°•.°+.*•´.*:˚.°*.˚•´.°:°•.°•.*•´.*:˚.°*.˚•´.°:°•.°+.*•´.*:*/
    /*                      VIEW FUNCTIONS                        */
    /*.•°:°.´+˚.*°.˚:*.´•*.+°.•°:´*.´•*.•°.•°:°.´:•˚°.*°.˚:*.´+°.•*/

    /// @notice Check if creator can create community
    function canCreateCommunity(address creator) external view returns (bool) {
        return _canCreateCommunity(creator);
    }

    /// @notice Get community details
    function getCommunityDetails(uint256 communityId) 
        external 
        view 
        communityExists(communityId)
        returns (
            uint256 creatorTokenId,
            address creator,
            string memory name,
            string memory description,
            uint64 createdAt,
            uint64 memberCount,
            uint64 derivativeCount,
            CommunityTier tier,
            bool active
        ) 
    {
        Community storage community = communities[communityId];
        return (
            community.creatorTokenId,
            community.creator,
            community.name,
            community.description,
            community.createdAt,
            community.memberCount,
            community.derivativeCount,
            community.tier,
            community.active
        );
    }

    /// @notice Check if address is community member
    function isCommunityMember(uint256 communityId, address user) external view returns (bool) {
        return communityMembers[communityId][user];
    }

    /// @notice Get creator stats for leaderboard
    function getCreatorStats(address creator) 
        external 
        view 
        returns (uint256 revenue, uint256 licensesSold, uint256 derivatives) 
    {
        return (creatorRevenue[creator], creatorLicensesSold[creator], creatorDerivativeCount[creator]);
    }

    /*´:°•.°+.*•´.*:˚.°*.˚•´.°:°•.°•.*•´.*:˚.°*.˚•´.°:°•.°+.*•´.*:*/
    /*                     INTERNAL FUNCTIONS                     */
    /*.•°:°.´+˚.*°.˚:*.´•*.+°.•°:´*.´•*.•°.•°:°.´:•˚°.*°.˚:*.´+°.•*/

    /// @notice Check if creator can create community
    function _canCreateCommunity(address creator) internal view returns (bool) {
        uint256 currentMonth = block.timestamp / 30 days;
        address[2] memory topCreators = monthlyTopCreators[currentMonth];
        return (creator == topCreators[0] || creator == topCreators[1]);
    }

    /// @notice Check and upgrade community tier
    function _checkTierUpgrade(uint256 communityId) internal {
        Community storage community = communities[communityId];
        CommunityTier currentTier = community.tier;
        CommunityTier newTier = currentTier;
        
        uint64 derivativeCount = community.derivativeCount;
        
        if (derivativeCount >= 100 && currentTier < CommunityTier.PLATINUM) {
            newTier = CommunityTier.PLATINUM;
        } else if (derivativeCount >= 51 && currentTier < CommunityTier.GOLD) {
            newTier = CommunityTier.GOLD;
        } else if (derivativeCount >= 11 && currentTier < CommunityTier.SILVER) {
            newTier = CommunityTier.SILVER;
        }
        
        if (newTier != currentTier) {
            community.tier = newTier;
            emit CommunityTierUpgraded(communityId, newTier);
        }
    }
}