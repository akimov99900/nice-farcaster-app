declare global {
  interface Window {
    ethereum?: {
      request: (args: { method: string; params?: any[] }) => Promise<any>
      on: (event: string, handler: (...args: any[]) => void) => void
      removeListener: (event: string, handler: (...args: any[]) => void) => void
    }
    __farcasterSdk?: {
      wallet?: {
        sendTransaction: (args: any) => Promise<{ hash: string }>
      }
    }
    __bearbrickUser?: any
    __farcasterUser?: any
  }
}

export {}