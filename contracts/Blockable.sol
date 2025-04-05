
// SPDX-License-Identifier: MIT
pragma solidity ^0.8.20;

import "@openzeppelin/contracts/token/ERC721/extensions/ERC721URIStorage.sol";
import "@openzeppelin/contracts/access/Ownable.sol";

/**
 * @title Blockable
 * @dev A smart contract for managing AI-generated NFTs and blockchain development artifacts
 */
contract Blockable is ERC721URIStorage, Ownable {
    uint256 private _tokenIdCounter;
    
    // Mapping from token ID to metadata hash
    mapping(uint256 => string) private _metadataHashes;
    
    // Events
    event ArtifactCreated(uint256 indexed tokenId, address indexed creator, string metadataHash);
    event ArtifactUpdated(uint256 indexed tokenId, string newMetadataHash);

    constructor() ERC721("Blockable", "BLOCK") Ownable(msg.sender) {
        _tokenIdCounter = 0;
    }
    
    /**
     * @dev Creates a new blockchain artifact as an NFT
     * @param recipient The address that will receive the NFT
     * @param tokenURI The token URI containing the metadata
     * @param metadataHash IPFS hash of the metadata
     * @return The ID of the newly minted token
     */
    function createArtifact(address recipient, string memory tokenURI, string memory metadataHash) 
        public 
        returns (uint256) 
    {
        uint256 tokenId = _tokenIdCounter++;
        _mint(recipient, tokenId);
        _setTokenURI(tokenId, tokenURI);
        _metadataHashes[tokenId] = metadataHash;
        
        emit ArtifactCreated(tokenId, recipient, metadataHash);
        
        return tokenId;
    }
    
    /**
     * @dev Updates the metadata of an existing artifact
     * @param tokenId The ID of the token to update
     * @param newTokenURI The new token URI
     * @param newMetadataHash The new IPFS hash of the metadata
     */
    function updateArtifact(uint256 tokenId, string memory newTokenURI, string memory newMetadataHash) 
        public 
    {
        require(_exists(tokenId), "Blockable: token does not exist");
        require(ownerOf(tokenId) == msg.sender || owner() == msg.sender, "Blockable: caller is not owner or contract owner");
        
        _setTokenURI(tokenId, newTokenURI);
        _metadataHashes[tokenId] = newMetadataHash;
        
        emit ArtifactUpdated(tokenId, newMetadataHash);
    }
    
    /**
     * @dev Gets the metadata hash for a token
     * @param tokenId The ID of the token
     * @return The metadata hash
     */
    function getMetadataHash(uint256 tokenId) public view returns (string memory) {
        require(_exists(tokenId), "Blockable: token does not exist");
        return _metadataHashes[tokenId];
    }
    
    /**
     * @dev Checks if a token exists
     * @param tokenId The ID of the token to check
     * @return Whether the token exists
     */
    function _exists(uint256 tokenId) internal view returns (bool) {
        return _ownerOf(tokenId) != address(0);
    }
}
