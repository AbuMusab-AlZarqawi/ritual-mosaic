// SPDX-License-Identifier: MIT
pragma solidity ^0.8.20;

contract RitualMosaic {
    address public owner;
    uint256 public constant TOTAL_SLOTS = 334;

    struct Slot {
        address claimer;
        string ipfsHash;
        string xHandle;
        string displayName;
        uint256 claimedAt;
        bool claimed;
    }

    mapping(uint256 => Slot) public slots;
    uint256 public claimedCount;
    address[] public claimers;
    mapping(address => bool) public hasClaimed;

    event SlotClaimed(uint256 indexed slotId, address indexed claimer, string ipfsHash, string xHandle, string displayName, uint256 timestamp);

    modifier onlyOwner() { require(msg.sender == owner, "Not owner"); _; }

    constructor() { owner = msg.sender; }

    function claimSlot(
        uint256 slotId,
        string calldata ipfsHash,
        string calldata xHandle,
        string calldata displayName
    ) external {
        require(slotId < TOTAL_SLOTS, "Invalid slot");
        require(!slots[slotId].claimed, "Slot already claimed");
        require(bytes(displayName).length > 0, "Name required");

        slots[slotId] = Slot({
            claimer: msg.sender,
            ipfsHash: ipfsHash,
            xHandle: xHandle,
            displayName: displayName,
            claimedAt: block.timestamp,
            claimed: true
        });

        claimedCount++;
        if (!hasClaimed[msg.sender]) {
            claimers.push(msg.sender);
            hasClaimed[msg.sender] = true;
        }

        emit SlotClaimed(slotId, msg.sender, ipfsHash, xHandle, displayName, block.timestamp);
    }

    function getSlot(uint256 slotId) external view returns (Slot memory) {
        require(slotId < TOTAL_SLOTS, "Invalid slot");
        return slots[slotId];
    }

    function getAllSlots() external view returns (Slot[] memory) {
        Slot[] memory allSlots = new Slot[](TOTAL_SLOTS);
        for (uint256 i = 0; i < TOTAL_SLOTS; i++) {
            allSlots[i] = slots[i];
        }
        return allSlots;
    }

    function getClaimers() external view returns (address[] memory) { return claimers; }
    function transferOwnership(address newOwner) external onlyOwner { require(newOwner != address(0)); owner = newOwner; }
}
