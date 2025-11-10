const React = require('react')

function selectContextUser() {
  if (typeof window === 'undefined') {
    return null
  }
  if (window.__bearbrickUser && typeof window.__bearbrickUser === 'object') {
    return window.__bearbrickUser
  }
  if (window.__farcasterUser && typeof window.__farcasterUser === 'object') {
    return window.__farcasterUser
  }
  return null
}

function useFarcasterAuth(options = {}) {
  const { mockUser, fallbackUser, onReady } = options
  const [state, setState] = React.useState({
    status: 'loading',
    state: 'loading',
    user: null,
    error: null,
    mode: undefined,
    isMock: false,
  })

  React.useEffect(() => {
    let active = true

    const initialise = async () => {
      try {
        const contextUser = selectContextUser()
        if (!active) return

        if (contextUser) {
          setState({
            status: 'authenticated',
            state: 'ready',
            user: contextUser,
            error: null,
            mode: 'live',
            isMock: false,
          })
          if (typeof onReady === 'function') {
            onReady(contextUser)
          }
          return
        }

        const derivedUser = mockUser || fallbackUser || null
        setState({
          status: derivedUser ? 'authenticated' : 'loading',
          state: derivedUser ? 'ready' : 'loading',
          user: derivedUser,
          error: null,
          mode: derivedUser && mockUser ? 'mock' : undefined,
          isMock: Boolean(mockUser && !contextUser),
        })

        if (derivedUser && typeof onReady === 'function') {
          onReady(derivedUser)
        }
      } catch (error) {
        if (!active) return
        setState({
          status: 'error',
          state: 'error',
          user: fallbackUser ?? null,
          error,
          mode: 'error',
          isMock: Boolean(fallbackUser),
        })
      }
    }

    initialise()

    return () => {
      active = false
    }
  }, [mockUser, fallbackUser, onReady])

  return state
}

module.exports = {
  useFarcasterAuth,
  default: useFarcasterAuth,
}
