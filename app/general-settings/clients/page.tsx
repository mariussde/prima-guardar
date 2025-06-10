'use client'
import { useEffect, useState, useCallback, useRef } from 'react'
import { Loader2, Plus } from 'lucide-react'
import { useSession } from 'next-auth/react'
import { useRouter } from 'next/navigation'
import { ClientTable, defaultVisibleColumns } from '@/components/general-settings/clients/clients-table'
import { ClientFormModal } from '@/components/general-settings/clients/clients-form-modal'
import { Client } from '@/types/clients'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { 
  DropdownMenu, 
  DropdownMenuTrigger, 
  DropdownMenuContent, 
  DropdownMenuCheckboxItem 
} from '@/components/ui/dropdown-menu'
import { useToast } from "@/hooks/use-toast"
import { TableWrapper } from '@/components/ui/table-wrapper'
import { useTablePreferencesContext } from '@/lib/table-preferences-context'

// Custom hook for debounce
function useDebounce<T>(value: T, delay: number): T {
  const [debouncedValue, setDebouncedValue] = useState<T>(value);

  useEffect(() => {
    const timer = setTimeout(() => {
      setDebouncedValue(value);
    }, delay);

    return () => {
      clearTimeout(timer);
    };
  }, [value, delay]);

  return debouncedValue;
}

const CLIENT_COLUMNS = [
  'COMPID',
  'CLNTID',
  'CLNTDSC',
  'ADDRL1',
  'ADDRL2',
  'City',
  'ZIPCODE',
  'Phone',
  'Fax',
  'eMail',
  'WebSite',
  'FEDTXID',
  'STETXID',
  'CLBILL',
  'CLEC1',
  'CLEC2',
  'CLEC3',
  'CLEC4',
  'CLEC5',
  'CLEN1',
  'CLEN2',
  'CLEN3',
  'CLEN4',
  'CLEN5',
  'CNTYCOD',
  'STAID',
  'CRTUSR',
  'CRTDAT',
  'CRTTIM',
  'CHGUSR',
  'CHGDAT',
  'CHGTIM',
  'actions'
]

function ClientsContent() {
  const { data: session, status } = useSession()
  const router = useRouter()
  const { toast } = useToast()
  const [clientData, setClientData] = useState<Client[]>([])
  const [isLoading, setIsLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [page, setPage] = useState<number>(1)
  const [hasMore, setHasMore] = useState<boolean>(true)
  const [columnFilters, setColumnFilters] = useState<Record<string, string>>({})
  const [sortConfig, setSortConfig] = useState<{column: string | null, direction: 'asc' | 'desc' | null}>({
    column: null,
    direction: null
  })
  const [modalState, setModalState] = useState<{
    isOpen: boolean;
    mode: 'add' | 'edit';
    client?: Client;
  }>({
    isOpen: false,
    mode: 'add'
  })

  const { preferences, updateColumnOrder } = useTablePreferencesContext();

  const debouncedFilters = useDebounce(columnFilters, 300)
  const initialFetchDone = useRef(false)
  const abortControllerRef = useRef<AbortController | null>(null)

  // Add event listener for the custom event
  useEffect(() => {
    const handleAddNewEvent = () => {
      handleAddNew();
    };
    
    document.addEventListener('client:add', handleAddNewEvent);
    
    return () => {
      document.removeEventListener('client:add', handleAddNewEvent);
    };
  }, []);

  const fetchClientData = useCallback(async (
    pageNum: number = 1, 
    currentFilters = columnFilters,
    sort = sortConfig
  ) => {
    // Cancel any ongoing request
    if (abortControllerRef.current) {
      abortControllerRef.current.abort()
    }

    // Create new abort controller
    abortControllerRef.current = new AbortController()

    try {
      setIsLoading(true)
      
      // Build query parameters more safely
      const params = new URLSearchParams({ 
        pageNumber: pageNum.toString(),
        pageSize: '100'
      })
      
      // Add filters with new format
      Object.entries(currentFilters).forEach(([key, value]) => {
        if (value) {
          // Use the original column name as the parameter
          params.append(key, value)
        }
      })
      
      // Add sorting if available
      if (sort.column && sort.direction) {
        params.append('sortColumn', sort.column)
        params.append('sortDirection', sort.direction)
      }
      
      const response = await fetch(`/api/general-settings/clients?${params.toString()}`, {
        signal: abortControllerRef.current.signal
      })
      
      if (!response.ok) {
        const errorText = await response.text()
        throw new Error(`Failed to fetch client data: ${errorText}`)
      }
      
      const data = await response.json()
      
      // Update data based on page number
      if (pageNum === 1) {
        setClientData(data.data)
      } else {
        setClientData(prev => [...prev, ...data.data])
      }
      
      // Check if we have more data to load based on totalPages
      setHasMore(pageNum < data.totalPages)
    } catch (error) {
      // Don't set error state if this was an abort
      if (error instanceof DOMException && error.name === 'AbortError') {
        return
      }
      setError(error instanceof Error ? error.message : 'Failed to load client data')
    } finally {
      setIsLoading(false)
    }
  }, [])

  // Handle authentication and initial load
  useEffect(() => {
    if (status === 'unauthenticated') {
      router.push('/login')
      return
    }
    
    if (status === 'authenticated' && !initialFetchDone.current) {
      initialFetchDone.current = true
      fetchClientData(1, columnFilters, sortConfig)
    }
  }, [status, router, fetchClientData])

  // Handle filter and sort changes
  useEffect(() => {
    if (initialFetchDone.current) {
      setPage(1)
      setClientData([])
      setHasMore(true)
      fetchClientData(1, debouncedFilters, sortConfig)
    }
  }, [debouncedFilters, sortConfig, fetchClientData])

  // Cleanup effect for aborting any pending requests on unmount
  useEffect(() => {
    return () => {
      if (abortControllerRef.current) {
        abortControllerRef.current.abort()
      }
    }
  }, [])

  // Handle filter change - now just updates state without direct API call
  const handleFilterChange = useCallback((columnKey: string, value: string) => {
    setColumnFilters(prev => {
      const newFilters = { ...prev }
      if (!value) {
        delete newFilters[columnKey]
      } else {
        newFilters[columnKey] = value
      }
      return newFilters
    })
  }, [])

  // Handle sort change
  const handleSortChange = useCallback((column: string, direction: 'asc' | 'desc' | null) => {
    setSortConfig({ column, direction })
  }, [])

  const handleLoadMore = useCallback(() => {
    if (!isLoading && hasMore) {
      const nextPage = page + 1
      setPage(nextPage)
      fetchClientData(nextPage, columnFilters, sortConfig)
    }
  }, [isLoading, hasMore, page, fetchClientData, columnFilters, sortConfig])

  const handleRowClick = (client: Client) => {
    // Add your row click handling logic here
  }

  const handleAddNew = () => {
    setModalState({ isOpen: true, mode: 'add' })
  }

  const handleEdit = (client: Client) => {
    setModalState({ isOpen: true, mode: 'edit', client })
  }

  const handleModalClose = () => {
    setModalState({ isOpen: false, mode: 'add' })
  }

  const handleClientSubmit = async (data: any) => {
    try {
      const response = await fetch('/api/general-settings/clients', {
        method: modalState.mode === 'add' ? 'POST' : 'PUT',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(data),
      })

      const responseData = await response.json()

      if (!response.ok) {
        // Extract the actual error message from the response
        let errorMessage = responseData.error || `Failed to ${modalState.mode} client`
        
        // If we have details, try to parse them for a more specific error message
        if (responseData.details) {
          try {
            const details = JSON.parse(responseData.details)
            if (details.error) {
              errorMessage = details.error
            } else if (details.message) {
              errorMessage = details.message
            }
          } catch (e) {
            // If parsing fails, use the response details as the error message
            errorMessage = responseData.details || errorMessage
          }
        }

        // Show error toast with complete error message
        toast({
          title: "Error",
          description: errorMessage,
          variant: "destructive",
          duration: 8000,
          className: "bg-red-50 border-red-200 text-red-800 dark:bg-red-900/50 dark:border-red-800 dark:text-red-100",
        })

        return { error: errorMessage }
      }

      // Show success toast
      toast({
        title: modalState.mode === 'add' ? "Client Created" : "Client Updated",
        description: modalState.mode === 'add'
          ? "The new client has been successfully created."
          : "The client has been successfully updated.",
        duration: 3000,
        className: "bg-green-50 border-green-200 text-green-800 dark:bg-green-900/50 dark:border-green-800 dark:text-green-100",
      })

      // Refresh data and close modal
      await fetchClientData(1, columnFilters, sortConfig)
      handleModalClose()
      return { success: true }
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : "An error occurred while saving the client"
      
      // Show error toast
      toast({
        title: "Error",
        description: errorMessage,
        variant: "destructive",
        duration: 8000,
        className: "bg-red-50 border-red-200 text-red-800 dark:bg-red-900/50 dark:border-red-800 dark:text-red-100",
      })
      
      return { error: errorMessage }
    }
  }

  const handleDelete = async (client: Client) => {
    try {
      const response = await fetch(`/api/general-settings/clients?COMPID=${client.COMPID}&CLNTID=${client.CLNTID}`, {
        method: 'DELETE',
      })

      if (!response.ok) {
        const errorData = await response.json()
        let errorMessage = errorData.error || 'Failed to delete client'
        
        // If we have details, try to parse them for a more specific error message
        if (errorData.details) {
          try {
            const details = JSON.parse(errorData.details)
            if (details.error) {
              errorMessage = details.error
            } else if (details.message) {
              errorMessage = details.message
            }
          } catch (e) {
            // If parsing fails, use the response details as the error message
            errorMessage = errorData.details || errorMessage
          }
        }
        
        toast({
          title: "Error",
          description: errorMessage,
          variant: "destructive",
          duration: 8000,
          className: "bg-red-50 border-red-200 text-red-800 dark:bg-red-900/50 dark:border-red-800 dark:text-red-100",
        })
        
        return
      }

      toast({
        title: "Success",
        description: "Client has been successfully deleted.",
        duration: 3000,
        className: "bg-green-50 border-green-200 text-green-800 dark:bg-green-900/50 dark:border-green-800 dark:text-green-100",
      })

      // Refresh the client data
      await fetchClientData(1, columnFilters, sortConfig)
    } catch (error) {
      toast({
        title: "Error",
        description: error instanceof Error ? error.message : "Failed to delete client",
        variant: "destructive",
        duration: 8000,
        className: "bg-red-50 border-red-200 text-red-800 dark:bg-red-900/50 dark:border-red-800 dark:text-red-100",
      })
    }
  }

  if (status === 'loading') {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="flex items-center space-x-2">
          <Loader2 className="h-6 w-6 animate-spin" />
          <span>Loading...</span>
        </div>
      </div>
    )
  }

  if (error) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <Card className="w-full max-w-[600px] mx-4">
          <CardHeader>
            <CardTitle className="text-red-600">Error</CardTitle>
          </CardHeader>
          <CardContent>
            <p className="text-gray-600">{error}</p>
            <button
              onClick={() => {
                setError(null)
                fetchClientData(1, columnFilters, sortConfig)
              }}
              className="mt-4 px-4 py-2 bg-blue-500 text-white rounded hover:bg-blue-600"
            >
              Retry
            </button>
          </CardContent>
        </Card>
      </div>
    )
  }

  return (
    <>
      <ClientTable
        data={clientData}
        onRowClick={handleRowClick}
        onLoadMore={handleLoadMore}
        isLoading={isLoading}
        hasMore={hasMore}
        columnVisibility={preferences.columnVisibility}
        onFilterChange={handleFilterChange}
        columnFilters={columnFilters}
        onSortChange={handleSortChange}
        showActions={true}
        onEdit={handleEdit}
        onDelete={handleDelete}
        columnOrder={preferences.columnOrder}
        onColumnOrderChange={updateColumnOrder}
      />

      <ClientFormModal
        open={modalState.isOpen}
        onOpenChange={(open) => !open && handleModalClose()}
        client={modalState.client}
        onSubmit={handleClientSubmit}
      />
    </>
  );
}

export default function ClientsPage() {
  const { data: session, status } = useSession();
  
  // We need to check authentication at the top level
  if (status === 'unauthenticated') {
    return null; // Router will redirect in the ClientsContent component
  }
  
  return (
    <TableWrapper
      tableId="clients-table"
      defaultColumns={CLIENT_COLUMNS}
      defaultVisibility={defaultVisibleColumns}
      title="Clients"
      onAddNew={() => document.dispatchEvent(new CustomEvent('client:add'))}
      isLoading={status === 'loading'}
    >
      {status === 'authenticated' && <ClientsContent />}
    </TableWrapper>
  );
} 
