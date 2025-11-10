// Test the BearBrick contract package
const BearBrickContract = require('./packages/bearbrick-contract')

console.log('Testing BearBrick contract package...')
console.log('ABI available:', !!BearBrickContract.BEARBRICK_NFT_ABI)
console.log('Contract addresses:', BearBrickContract.CONTRACT_ADDRESSES)
console.log('Mint price:', BearBrickContract.MINT_PRICE)
console.log('✓ Contract package loaded successfully')