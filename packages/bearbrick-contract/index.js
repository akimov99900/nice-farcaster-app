// BearBrick NFT Contract ABI
const BEARBRICK_NFT_ABI = [
  {
    inputs: [
      { internalType: "uint256", name: "fid", type: "uint256" },
      { internalType: "string", name: "tokenUri", type: "string" }
    ],
    name: "mint",
    outputs: [],
    stateMutability: "payable",
    type: "function"
  },
  {
    inputs: [{ internalType: "uint256", name: "fid", type: "uint256" }],
    name: "hasMinted",
    outputs: [{ internalType: "bool", name: "", type: "bool" }],
    stateMutability: "view",
    type: "function"
  },
  {
    inputs: [{ internalType: "uint256", name: "fid", type: "uint256" }],
    name: "getTokenIdByFid",
    outputs: [{ internalType: "uint256", name: "", type: "uint256" }],
    stateMutability: "view",
    type: "function"
  },
  {
    inputs: [{ internalType: "uint256", name: "tokenId", type: "uint256" }],
    name: "tokenURI",
    outputs: [{ internalType: "string", name: "", type: "string" }],
    stateMutability: "view",
    type: "function"
  },
  {
    inputs: [],
    name: "name",
    outputs: [{ internalType: "string", name: "", type: "string" }],
    stateMutability: "view",
    type: "function"
  },
  {
    inputs: [],
    name: "symbol",
    outputs: [{ internalType: "string", name: "", type: "string" }],
    stateMutability: "view",
    type: "function"
  },
  {
    inputs: [{ internalType: "address", name: "owner", type: "address" }],
    name: "balanceOf",
    outputs: [{ internalType: "uint256", name: "", type: "uint256" }],
    stateMutability: "view",
    type: "function"
  },
  {
    inputs: [{ internalType: "uint256", name: "tokenId", type: "uint256" }],
    name: "ownerOf",
    outputs: [{ internalType: "address", name: "", type: "address" }],
    stateMutability: "view",
    type: "function"
  }
]

// Contract addresses for different networks
const CONTRACT_ADDRESSES = {
  base: process.env.NEXT_PUBLIC_BEARBRICK_CONTRACT_ADDRESS_BASE || '0x1234567890123456789012345678901234567890',
  baseSepolia: process.env.NEXT_PUBLIC_BEARBRICK_CONTRACT_ADDRESS_BASE_SEPOLIA || '0x1234567890123456789012345678901234567890'
}

// Network configurations
const NETWORKS = {
  base: {
    id: 8453,
    name: 'Base',
    rpcUrl: process.env.NEXT_PUBLIC_BASE_RPC_URL || 'https://mainnet.base.org',
    blockExplorers: {
      default: { name: 'BaseScan', url: 'https://basescan.org' }
    }
  },
  baseSepolia: {
    id: 84532,
    name: 'Base Sepolia',
    rpcUrl: process.env.NEXT_PUBLIC_BASE_SEPOLIA_RPC_URL || 'https://sepolia.base.org',
    blockExplorers: {
      default: { name: 'BaseScan Sepolia', url: 'https://sepolia.basescan.org' }
    }
  }
}

// Mint price in ETH (0.00001 ETH)
const MINT_PRICE = '0.00001'

module.exports = {
  BEARBRICK_NFT_ABI,
  CONTRACT_ADDRESSES,
  NETWORKS,
  MINT_PRICE,
  default: {
    BEARBRICK_NFT_ABI,
    CONTRACT_ADDRESSES,
    NETWORKS,
    MINT_PRICE
  }
}