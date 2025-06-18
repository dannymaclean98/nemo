// SPDX-License-Identifier: MIT
pragma solidity ^0.8.20;

import "@openzeppelin/contracts/token/ERC1155/ERC1155.sol";
import "@openzeppelin/contracts/access/Ownable.sol";
import "@openzeppelin/contracts/utils/ReentrancyGuard.sol";
import "@openzeppelin/contracts/interfaces/IERC2981.sol";
import "@openzeppelin/contracts/interfaces/IERC165.sol";

/**
 * @title NemoPhotoAlbums
 * @dev ERC1155 contract for minting photo NFTs and logically grouping them into albums
 * Supports paid minting, royalties, and batch operations
 * 
 * METADATA STANDARD COMPLIANCE:
 * This contract follows the ERC1155 Metadata URI JSON Schema standard.
 * 
 * Expected metadata URI format: ipfs://<hash>
 * The URI should point to a JSON file with the following structure:
 * {
 *   "name": "Photo Title",
 *   "description": "Photo description",
 *   "image": "ipfs://<image_hash>",
 *   "attributes": [
 *     {
 *       "trait_type": "Album",
 *       "value": "Album Name"
 *     },
 *     {
 *       "trait_type": "Photographer", 
 *       "value": "Photographer Name"
 *     }
 *   ]
 * }
 */
contract NemoPhotoAlbums is ERC1155, Ownable, ReentrancyGuard, IERC2981 {
    uint256 private _tokenIds = 0;
    uint256 private _albumIds = 0;
    
    // Pricing
    uint256 public albumMintPrice = 0.00001 ether; // Price per photo in album (about $0.0001)
    
    // Royalty info
    address private _royaltyReceiver;
    uint96 private _royaltyFeeNumerator;
    
    // Album structure
    struct Album {
        uint256 id;
        string name;
        string description;
        address creator;
        uint256[] tokenIds;
        uint256 createdAt;
        bool exists;
    }
    
    // Mappings
    mapping(uint256 => Album) public albums;           // albumId => Album
    mapping(uint256 => uint256) public tokenToAlbum;   // tokenId => albumId
    mapping(uint256 => string) private tokenURIs;      // tokenId => IPFS metadata URI
    mapping(address => uint256[]) public userAlbums;   // user => albumIds[]
    mapping(uint256 => uint256) public tokenMaxSupply; // tokenId => max supply
    mapping(uint256 => uint256) public tokenCurrentSupply; // tokenId => current supply

    // Events
    event AlbumCreated(
        uint256 indexed albumId,
        string name,
        string description,
        address indexed creator,
        uint256[] tokenIds
    );
    
    event PhotoMinted(
        uint256 indexed tokenId,
        uint256 indexed albumId,
        address indexed to,
        string metadataURI,
        uint256 amount
    );
    
    event PriceUpdated(uint256 albumPrice);

    constructor() ERC1155("") Ownable(msg.sender) {
        // Set default royalty to 5% for the contract owner
        _royaltyReceiver = msg.sender;
        _royaltyFeeNumerator = 500; // 5% in basis points
    }

    /**
     * @dev Create a new album and mint photo NFTs to the creator
     * @param albumName Name of the album
     * @param albumDescription Description of the album
     * @param photoMetadataURIs Array of IPFS URIs pointing to JSON metadata files for each photo
     *                         Each URI should be in format: ipfs://<hash>
     *                         Each JSON file should follow ERC1155 Metadata URI JSON Schema
     */
    function createAlbum(
        string memory albumName,
        string memory albumDescription,
        string[] memory photoMetadataURIs
    ) public payable nonReentrant returns (uint256 albumId, uint256[] memory tokenIds) {
        require(photoMetadataURIs.length > 0, "Album must contain at least one photo");
        require(photoMetadataURIs.length <= 50, "Album cannot have more than 50 photos");
        require(bytes(albumName).length > 0, "Album name cannot be empty");
        require(msg.value >= albumMintPrice * photoMetadataURIs.length, "Insufficient payment");

        _albumIds++;
        albumId = _albumIds;

        tokenIds = new uint256[](photoMetadataURIs.length);
        uint256[] memory amounts = new uint256[](photoMetadataURIs.length);

        for (uint256 i = 0; i < photoMetadataURIs.length; i++) {
            _tokenIds++;
            uint256 tokenId = _tokenIds;

            tokenIds[i] = tokenId;
            amounts[i] = 1;
            tokenToAlbum[tokenId] = albumId;
            tokenURIs[tokenId] = photoMetadataURIs[i];
            tokenMaxSupply[tokenId] = 1; // Unique photos by default
            tokenCurrentSupply[tokenId] = 1;

            emit PhotoMinted(tokenId, albumId, msg.sender, photoMetadataURIs[i], 1);
        }

        // Batch mint all photos at once (ERC1155 efficiency!)
        _mintBatch(msg.sender, tokenIds, amounts, "");

        albums[albumId] = Album({
            id: albumId,
            name: albumName,
            description: albumDescription,
            creator: msg.sender,
            tokenIds: tokenIds,
            createdAt: block.timestamp,
            exists: true
        });

        userAlbums[msg.sender].push(albumId);

        emit AlbumCreated(albumId, albumName, albumDescription, msg.sender, tokenIds);

        return (albumId, tokenIds);
    }

    /**
     * @dev Mint additional copies of an existing photo NFT
     * @param tokenId Existing token ID (photo)
     * @param amount How many copies to mint
     */
    function mintAdditionalPhotoCopies(
        uint256 tokenId,
        uint256 amount
    ) public payable nonReentrant {
        require(bytes(tokenURIs[tokenId]).length > 0, "Token ID does not exist");
        require(amount > 0, "Amount must be greater than 0");
        require(
            tokenCurrentSupply[tokenId] + amount <= tokenMaxSupply[tokenId] || tokenMaxSupply[tokenId] == 0,
            "Would exceed max supply"
        );

        tokenCurrentSupply[tokenId] += amount;
        _mint(msg.sender, tokenId, amount, "");

        uint256 albumId = tokenToAlbum[tokenId];
        emit PhotoMinted(tokenId, albumId, msg.sender, tokenURIs[tokenId], amount);
    }

    /**
     * @dev Set max supply for a token (only owner)
     */
    function setTokenMaxSupply(uint256 tokenId, uint256 maxSupply) external onlyOwner {
        require(bytes(tokenURIs[tokenId]).length > 0, "Token ID does not exist");
        require(maxSupply >= tokenCurrentSupply[tokenId], "Max supply cannot be less than current supply");
        tokenMaxSupply[tokenId] = maxSupply;
    }

    /**
     * @dev Update mint prices (only owner)
     */
    function updatePrices(uint256 newAlbumPrice) external onlyOwner {
        albumMintPrice = newAlbumPrice;
        emit PriceUpdated(newAlbumPrice);
    }

    /**
     * @dev Withdraw contract balance (only owner)
     */
    function withdraw() external onlyOwner {
        uint256 balance = address(this).balance;
        require(balance > 0, "No funds to withdraw");
        
        (bool success, ) = payable(owner()).call{value: balance}("");
        require(success, "Withdrawal failed");
    }

    /**
     * @dev Get album details by ID
     */
    function getAlbum(uint256 albumId) public view returns (
        uint256 id,
        string memory name,
        string memory description,
        address creator,
        uint256[] memory tokenIds,
        uint256 createdAt
    ) {
        require(albums[albumId].exists, "Album does not exist");
        Album memory album = albums[albumId];

        return (
            album.id,
            album.name,
            album.description,
            album.creator,
            album.tokenIds,
            album.createdAt
        );
    }

    function getUserAlbums(address user) public view returns (uint256[] memory) {
        return userAlbums[user];
    }

    function getTokenAlbum(uint256 tokenId) public view returns (uint256) {
        return tokenToAlbum[tokenId];
    }

    function totalAlbums() public view returns (uint256) {
        return _albumIds;
    }

    function totalPhotos() public view returns (uint256) {
        return _tokenIds;
    }

    function albumExists(uint256 albumId) public view returns (bool) {
        return albums[albumId].exists;
    }

    function getTokenSupplyInfo(uint256 tokenId) public view returns (uint256 current, uint256 max) {
        return (tokenCurrentSupply[tokenId], tokenMaxSupply[tokenId]);
    }

    /**
     * @dev ERC1155 override: Returns the metadata URI for a given token ID
     * This should be an IPFS URI pointing to a JSON file following the 
     * ERC1155 Metadata URI JSON Schema standard
     */
    function uri(uint256 tokenId) public view override returns (string memory) {
        return tokenURIs[tokenId];
    }

    /**
     * @dev ERC2981 royalty info
     */
    function royaltyInfo(uint256, uint256 salePrice) external view override returns (address receiver, uint256 royaltyAmount) {
        uint256 royalty = (salePrice * _royaltyFeeNumerator) / 10000;
        return (_royaltyReceiver, royalty);
    }

    /**
     * @dev Override supportsInterface to include ERC2981
     */
    function supportsInterface(bytes4 interfaceId) public view virtual override(ERC1155, IERC165) returns (bool) {
        return interfaceId == type(IERC2981).interfaceId || super.supportsInterface(interfaceId);
    }
}
