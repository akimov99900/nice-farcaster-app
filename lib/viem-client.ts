import { createPublicClient, http, parseEther, encodeFunctionData } from 'viem'
import { base, baseSepolia } from 'viem/chains'
import * as BearBrickContract from '@lab/bearbrick-contract'

export type MintStatus = 'idle' | 'checking' | 'eligible' | 'already-minted' | 'minting' | 'awaiting-signature' | 'pending' | 'confirmed' | 'failed'

export type MintData = {
  tokenId?: bigint
  transactionHash?: string
  error?: string
}

// Create public client for reading contract data
export function createPublicClientForBase() {
  const rpcUrl = process.env.NEXT_PUBLIC_BASE_RPC_URL || base.rpcUrls.default.http[0]
  return createPublicClient({
    chain: base,
    transport: http(rpcUrl)
  })
}

// Create public client for Base Sepolia (development)
export function createPublicClientForBaseSepolia() {
  const rpcUrl = process.env.NEXT_PUBLIC_BASE_SEPOLIA_RPC_URL || baseSepolia.rpcUrls.default.http[0]
  return createPublicClient({
    chain: baseSepolia,
    transport: http(rpcUrl)
  })
}

// Get contract address for current environment
export function getContractAddress(): `0x${string}` {
  const isDevelopment = process.env.NODE_ENV === 'development'
  const address = isDevelopment 
    ? BearBrickContract.CONTRACT_ADDRESSES.baseSepolia 
    : BearBrickContract.CONTRACT_ADDRESSES.base
  
  return address as `0x${string}`
}

// Check if user has already minted
export async function checkMintStatus(fid: number): Promise<{ hasMinted: boolean; tokenId?: bigint }> {
  try {
    const isDevelopment = process.env.NODE_ENV === 'development'
    const client = isDevelopment ? createPublicClientForBaseSepolia() : createPublicClientForBase()
    const contractAddress = getContractAddress()

    // Check if already minted
    const hasMinted = await client.readContract({
      address: contractAddress,
      abi: BearBrickContract.BEARBRICK_NFT_ABI,
      functionName: 'hasMinted',
      args: [BigInt(fid)]
    }) as boolean

    if (hasMinted) {
      // Get token ID if already minted
      const tokenId = await client.readContract({
        address: contractAddress,
        abi: BearBrickContract.BEARBRICK_NFT_ABI,
        functionName: 'getTokenIdByFid',
        args: [BigInt(fid)]
      }) as bigint

      return { hasMinted: true, tokenId }
    }

    return { hasMinted: false }
  } catch (error) {
    console.error('Error checking mint status:', error)
    throw error
  }
}

// Mint function for Farcaster wallet
export async function mintWithFarcasterWallet(
  fid: number,
  tokenUri: string,
  sdkWallet: any
): Promise<{ transactionHash: string; tokenId?: bigint }> {
  try {
    const isDevelopment = process.env.NODE_ENV === 'development'
    const contractAddress = getContractAddress()
    const mintPrice = parseEther(BearBrickContract.MINT_PRICE)

    if (!sdkWallet?.sendTransaction) {
      throw new Error('Farcaster wallet not available')
    }

    // Prepare transaction data
    const data = encodeFunctionData({
      abi: BearBrickContract.BEARBRICK_NFT_ABI,
      functionName: 'mint',
      args: [BigInt(fid), tokenUri]
    })

    // Prepare transaction
    const transaction = await sdkWallet.sendTransaction({
      to: contractAddress,
      data: data,
      value: mintPrice,
    })

    if (!transaction.hash) {
      throw new Error('Transaction failed to generate hash')
    }

    // Wait for confirmation and get token ID
    const tokenId = await waitForMintConfirmation(transaction.hash, fid)

    return { transactionHash: transaction.hash, tokenId }
  } catch (error) {
    console.error('Error minting with Farcaster wallet:', error)
    throw error
  }
}

// Mint function for development fallback (window.ethereum)
export async function mintWithMetaMask(
  fid: number,
  tokenUri: string
): Promise<{ transactionHash: string; tokenId?: bigint }> {
  try {
    if (typeof window === 'undefined' || !window.ethereum) {
      throw new Error('MetaMask not available')
    }

    const isDevelopment = process.env.NODE_ENV === 'development'
    const contractAddress = getContractAddress()
    const mintPrice = parseEther(BearBrickContract.MINT_PRICE)

    // Request accounts
    const accounts = await window.ethereum.request({ method: 'eth_requestAccounts' })
    if (!accounts || accounts.length === 0) {
      throw new Error('No accounts available')
    }

    // Prepare transaction data
    const data = encodeFunctionData({
      abi: BearBrickContract.BEARBRICK_NFT_ABI,
      functionName: 'mint',
      args: [BigInt(fid), tokenUri]
    })

    // Send transaction using window.ethereum directly
    const transactionParams = {
      from: accounts[0],
      to: contractAddress,
      data: data,
      value: mintPrice.toString(),
      chainId: isDevelopment ? baseSepolia.id : base.id,
    }

    const hash = await window.ethereum.request({
      method: 'eth_sendTransaction',
      params: [transactionParams],
    })

    // Wait for confirmation and get token ID
    const tokenId = await waitForMintConfirmation(hash, fid)

    return { transactionHash: hash, tokenId }
  } catch (error) {
    console.error('Error minting with MetaMask:', error)
    throw error
  }
}

// Encode mint function data
function encodeMintFunctionData(fid: number, tokenUri: string): `0x${string}` {
  return encodeFunctionData({
    abi: BearBrickContract.BEARBRICK_NFT_ABI,
    functionName: 'mint',
    args: [BigInt(fid), tokenUri]
  })
}

// Wait for mint confirmation and get token ID
async function waitForMintConfirmation(transactionHash: string, fid: number): Promise<bigint> {
  const isDevelopment = process.env.NODE_ENV === 'development'
  const client = isDevelopment ? createPublicClientForBaseSepolia() : createPublicClientForBase()
  const contractAddress = getContractAddress()

  try {
    // Wait for transaction receipt
    const receipt = await client.waitForTransactionReceipt({
      hash: transactionHash as `0x${string}`,
      confirmations: 1
    })

    if (receipt.status !== 'success') {
      throw new Error('Transaction failed')
    }

    // Get token ID
    const tokenId = await client.readContract({
      address: contractAddress,
      abi: BearBrickContract.BEARBRICK_NFT_ABI,
      functionName: 'getTokenIdByFid',
      args: [BigInt(fid)]
    }) as bigint

    return tokenId
  } catch (error) {
    console.error('Error waiting for mint confirmation:', error)
    throw error
  }
}

// Generate OpenSea link
export function generateOpenSeaLink(tokenId: bigint): string {
  const isDevelopment = process.env.NODE_ENV === 'development'
  const contractAddress = getContractAddress()
  const network = isDevelopment ? 'base-sepolia' : 'base'
  return `https://opensea.io/assets/${network}/${contractAddress}/${tokenId.toString()}`
}

// Generate block explorer link
export function generateBlockExplorerLink(transactionHash: string): string {
  const isDevelopment = process.env.NODE_ENV === 'development'
  const baseUrl = isDevelopment ? 'https://sepolia.basescan.org' : 'https://basescan.org'
  return `${baseUrl}/tx/${transactionHash}`
}