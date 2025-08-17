// Utility to dynamically load ethers in the browser context
let ethers: any = null

export async function getEthers() {
  if (ethers) {
    return ethers
  }

  if (typeof window === 'undefined') {
    throw new Error('Ethers can only be loaded in browser context')
  }

  try {
    // Dynamic import of ethers
    const ethersModule = await import('ethers')
    ethers = ethersModule
    return ethers
  } catch (error) {
    console.error('Failed to load ethers:', error)
    throw new Error('Failed to load ethers library')
  }
}

export async function createProvider() {
  const ethers = await getEthers()
  
  if (!window.ethereum) {
    throw new Error('No wallet detected. Please install MetaMask or another wallet.')
  }

  return new ethers.BrowserProvider(window.ethereum)
}

export async function createContract(address: string, abi: string[], signer: any) {
  const ethers = await getEthers()
  return new ethers.Contract(address, abi, signer)
}

export async function parseUnits(value: string | number, decimals: number) {
  const ethers = await getEthers()
  return ethers.parseUnits(value.toString(), decimals)
}

export async function formatUnits(value: any, decimals: number) {
  const ethers = await getEthers()
  return ethers.formatUnits(value, decimals)
}
