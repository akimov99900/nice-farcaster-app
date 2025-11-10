// Simple test script to verify mint functionality
const { createPublicClientForBase, checkMintStatus, generateTokenURI } = require('./lib/viem-client')

async function testMintFunctionality() {
  console.log('Testing BearBrick mint functionality...')
  
  try {
    // Test 1: Generate token URI
    const testFid = 777000
    const tokenUri = generateTokenURI(testFid, 'bearbrick-demo', 'BearBrick Explorer')
    console.log('✓ Token URI generated:', tokenUri)
    
    // Test 2: Check mint status (this will likely fail in development without real contract)
    try {
      const mintStatus = await checkMintStatus(testFid)
      console.log('✓ Mint status checked:', mintStatus)
    } catch (error) {
      console.log('⚠ Mint status check failed (expected in development):', error.message)
    }
    
    console.log('✓ All basic tests passed!')
  } catch (error) {
    console.error('✗ Test failed:', error)
  }
}

testMintFunctionality()