'use client'

import { QueryClient, QueryClientProvider } from '@tanstack/react-query'
import { ReactQueryDevtools } from '@tanstack/react-query-devtools'
import { ThemeProvider } from '@/components/theme-provider'
import { useState } from 'react'

interface ProvidersProps {
  children: React.ReactNode
}

export function Providers({ children }: ProvidersProps) {
  const [queryClient] = useState(
    () =>
      new QueryClient({
        defaultOptions: {
          queries: {
            // Manufacturing data should be fresh
            staleTime: 30 * 1000, // 30 seconds
            gcTime: 5 * 60 * 1000, // 5 minutes (renamed from cacheTime)
            retry: (failureCount, error: any) => {
              // Don't retry on 4xx errors except 408, 429
              if (error?.status >= 400 && error?.status < 500) {
                return error?.status === 408 || error?.status === 429
              }
              // Retry up to 3 times for other errors
              return failureCount < 3
            },
            retryDelay: (attemptIndex) => Math.min(1000 * 2 ** attemptIndex, 30000),
            // Refetch on window focus for critical manufacturing data
            refetchOnWindowFocus: true,
            // Network recovery is important in manufacturing environments
            refetchOnReconnect: true,
          },
          mutations: {
            retry: 1, // Only retry mutations once
            // Global error handling for mutations
            onError: (error: any) => {
              console.error('Mutation error:', error)
              // Here you could add global error reporting
            },
          },
        },
      })
  )

  return (
    <QueryClientProvider client={queryClient}>
      <ThemeProvider
        attribute="class"
        defaultTheme="light" // Manufacturing environments typically use light themes
        enableSystem={false} // Disable system theme detection for consistency
        disableTransitionOnChange
      >
        {children}
        {process.env.NODE_ENV === 'development' && (
          <ReactQueryDevtools
            initialIsOpen={false}
            position="bottom-right"
            buttonPosition="bottom-right"
          />
        )}
      </ThemeProvider>
    </QueryClientProvider>
  )
}
