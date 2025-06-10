"use client";

import { useCallback, useEffect, useRef } from "react";
import { GenericTable } from "@/components/ui/generic-table";
import { Country } from "@/types/countries";
import { TableColumn } from "@/types/table";

// Define columns with exact translations
const columns: TableColumn<Country>[] = [
  { accessorKey: "COMPID", header: "Company ID" },
  { accessorKey: "CNTYCOD", header: "Country Code" },
  { accessorKey: "CNTYDSC", header: "Description" },
  { accessorKey: "CRTUSR", header: "Created By" },
  { accessorKey: "CRTDAT", header: "Created Date" },
  { accessorKey: "CRTTIM", header: "Created Time" },
  { accessorKey: "CHGUSR", header: "Last Modified By" },
  { accessorKey: "CHGDAT", header: "Last Modified Date" },
  { accessorKey: "CHGTIM", header: "Last Modified Time" },
];

// Define default visible columns
export const defaultVisibleColumns = {
  COMPID: false, // hidden by default
  CNTYCOD: true,
  CNTYDSC: true,
  CRTUSR: false, // hidden by default
  CRTDAT: false, // hidden by default
  CRTTIM: false, // hidden by default
  CHGUSR: true,
  CHGDAT: true,
  CHGTIM: false, // hidden by default
  actions: true,
};

interface CountryTableProps {
  data: Country[];
  onRowClick?: (country: Country) => void;
  onLoadMore?: () => void;
  isLoading?: boolean;
  hasMore?: boolean;
  columnVisibility?: Record<string, boolean>;
  onFilterChange?: (columnKey: string, value: string) => void;
  columnFilters?: Record<string, string>;
  onSortChange?: (column: string, direction: "asc" | "desc" | null) => void;
  showActions?: boolean;
  onEdit?: (country: Country) => void;
  onDelete?: (country: Country) => void;
  columnOrder?: string[];
  onColumnOrderChange?: (newOrder: string[]) => void;
}

export function CountryTable({
  data,
  onRowClick,
  onLoadMore,
  isLoading = false,
  hasMore = false,
  columnVisibility,
  onFilterChange,
  columnFilters = {},
  onSortChange,
  showActions = false,
  onEdit,
  onDelete,
  columnOrder,
  onColumnOrderChange,
}: CountryTableProps) {
  const observer = useRef<IntersectionObserver | null>(null);

  const lastRowRef = useCallback(
    (node: HTMLTableRowElement | null) => {
      if (isLoading) return;
      if (observer.current) observer.current.disconnect();

      observer.current = new IntersectionObserver(
        (entries) => {
          if (entries[0].isIntersecting && hasMore && !isLoading) {
            onLoadMore?.();
          }
        },
        {
          root: null,
          rootMargin: "100px",
          threshold: 0.1,
        }
      );

      if (node) observer.current.observe(node);
    },
    [isLoading, hasMore, onLoadMore]
  );

  // Cleanup observer on unmount
  useEffect(() => {
    return () => {
      if (observer.current) {
        observer.current.disconnect();
      }
    };
  }, []);

  return (
    <GenericTable
      data={data}
      columns={columns}
      onRowClick={onRowClick}
      columnVisibility={columnVisibility}
      lastRowRef={lastRowRef}
      isLoading={isLoading}
      onFilterChange={onFilterChange}
      columnFilters={columnFilters}
      onSortChange={onSortChange}
      hasMore={hasMore}
      showActions={showActions}
      onEdit={onEdit}
      onDelete={onDelete}
      columnOrder={columnOrder}
      onColumnOrderChange={onColumnOrderChange}
    />
  );
}
