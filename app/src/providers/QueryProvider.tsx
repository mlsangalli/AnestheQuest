import { QueryClient } from '@tanstack/react-query';
import { PersistQueryClientProvider } from '@tanstack/react-query-persist-client';
import { createAsyncStoragePersister } from '@tanstack/query-async-storage-persister';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { type ReactNode, useState } from 'react';

// Persistência offline: o cache do React Query é salvo no AsyncStorage,
// permitindo abrir o app e ver conteúdo/desempenho já carregados sem rede.
const DAY = 1000 * 60 * 60 * 24;

export function QueryProvider({ children }: { children: ReactNode }) {
  const [client] = useState(
    () =>
      new QueryClient({
        defaultOptions: {
          queries: { staleTime: 60_000, gcTime: 7 * DAY, retry: 1, refetchOnWindowFocus: false },
        },
      }),
  );
  const [persister] = useState(() => createAsyncStoragePersister({ storage: AsyncStorage }));

  return (
    <PersistQueryClientProvider client={client} persistOptions={{ persister, maxAge: 7 * DAY }}>
      {children}
    </PersistQueryClientProvider>
  );
}
