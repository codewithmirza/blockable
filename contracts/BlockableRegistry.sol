// SPDX-License-Identifier: MIT
pragma solidity ^0.8.20;

import "@openzeppelin/contracts/access/Ownable.sol";
import "@hyperlane-xyz/core/contracts/interfaces/IMailbox.sol";
import "@hyperlane-xyz/core/contracts/interfaces/IInterchainGasPaymaster.sol";

/**
 * @title BlockableRegistry
 * @dev Registry contract for cross-chain Blockable operations
 */
contract BlockableRegistry is Ownable {
    // Hyperlane mailbox for cross-chain messaging
    IMailbox public mailbox;
    IInterchainGasPaymaster public gasPaymaster;
    
    // Mapping from domain ID to registered Blockable contract address
    mapping(uint32 => bytes32) public registeredContracts;
    
    // Events
    event ContractRegistered(uint32 domain, bytes32 contractAddress);
    event CrossChainMessageSent(uint32 destinationDomain, bytes32 recipient, bytes message);

    constructor(address _mailbox, address _gasPaymaster) Ownable(msg.sender) {
        mailbox = IMailbox(_mailbox);
        gasPaymaster = IInterchainGasPaymaster(_gasPaymaster);
    }
    
    /**
     * @dev Registers a Blockable contract on a specific domain
     * @param domain The domain ID
     * @param contractAddress The contract address on that domain
     */
    function registerContract(uint32 domain, bytes32 contractAddress) external onlyOwner {
        registeredContracts[domain] = contractAddress;
        emit ContractRegistered(domain, contractAddress);
    }
    
    /**
     * @dev Sends a cross-chain message to a registered contract
     * @param destinationDomain The destination domain ID
     * @param message The message to send
     */
    function sendCrossChainMessage(uint32 destinationDomain, bytes calldata message) 
        external 
        payable 
    {
        bytes32 recipient = registeredContracts[destinationDomain];
        require(recipient != bytes32(0), "BlockableRegistry: destination contract not registered");
        
        bytes32 messageId = mailbox.dispatch(destinationDomain, recipient, message);
        
        // Pay for gas if value is provided
        if (msg.value > 0) {
            gasPaymaster.payForGas{value: msg.value}(
                messageId,
                destinationDomain,
                msg.value,
                msg.sender
            );
        }
        
        emit CrossChainMessageSent(destinationDomain, recipient, message);
    }
}
