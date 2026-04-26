"use client";

import React, { useEffect, useState } from "react";
import { 
  Table, 
  Pagination,
  Select,
  TextField,
  InputGroup,
  Label,
  ListBox,
  Spinner,
  Card,
  cn,
  SortDescriptor
} from "@heroui/react";
import { 
  IconTable, 
  IconDatabase, 
  IconChevronRight, 
  IconChevronLeft, 
  IconChevronRight as IconNext, 
  IconSearch,
  IconChevronUp,
  IconX
} from "@tabler/icons-react";

const API_BASE = "http://localhost:8000";

function SortableColumnHeader({
  children,
  sortDirection,
}: {
  children: React.ReactNode;
  sortDirection?: "ascending" | "descending";
}) {
  return (
    <span className="flex items-center justify-between gap-2">
      {children}
      <IconChevronUp
        size={12}
        className={cn(
          "transform transition-transform duration-200 opacity-0",
          sortDirection ? "opacity-100" : "group-hover:opacity-30",
          sortDirection === "descending" ? "rotate-180" : ""
        )}
      />
    </span>
  );
}

export default function ExplorePage() {
  const [tables, setTables] = useState<string[]>([]);
  const [selectedTable, setSelectedTable] = useState<string | null>(null);
  const [data, setData] = useState<any[]>([]);
  const [columns, setColumns] = useState<string[]>([]);
  const [loading, setLoading] = useState(false);
  
  const [page, setPage] = useState(1);
  const [pageSize, setPageSize] = useState(100);
  const [total, setTotal] = useState(0);
  const [search, setSearch] = useState("");
  const [debouncedSearch, setDebouncedSearch] = useState("");
  const [sortDescriptor, setSortDescriptor] = useState<SortDescriptor>({
    column: "",
    direction: "ascending"
  });

  const totalPages = Math.ceil(total / pageSize);

  // Handle search debouncing
  useEffect(() => {
    const timer = setTimeout(() => setDebouncedSearch(search), 500);
    return () => clearTimeout(timer);
  }, [search]);

  useEffect(() => {
    fetch(`${API_BASE}/data/tables`)
      .then(res => res.json())
      .then(res => {
        if (Array.isArray(res)) setTables(res);
        else setTables([]);
      })
      .catch(() => setTables([]));
  }, []);

  useEffect(() => {
    if (!selectedTable) return;

    setLoading(true);
    const params = new URLSearchParams({
      page: page.toString(),
      page_size: pageSize.toString(),
    });
    if (debouncedSearch) params.append("search", debouncedSearch);
    if (sortDescriptor.column) {
      params.append("sort_col", sortDescriptor.column as string);
      params.append("sort_dir", sortDescriptor.direction || "ascending");
    }

    console.log(`Fetching ${selectedTable} with params:`, Object.fromEntries(params.entries()));

    fetch(`${API_BASE}/data/table/${selectedTable}?${params.toString()}`)
      .then(res => res.json())
      .then(res => {
        setData(res.data);
        setColumns(res.columns);
        setTotal(res.total);
        setLoading(false);
      })
      .catch(() => setLoading(false));
  }, [selectedTable, page, pageSize, debouncedSearch, sortDescriptor]);

  return (
    <div className="flex flex-col md:flex-row gap-8 min-h-[calc(100vh-12rem)]">
      <aside className="w-full md:w-64 flex flex-col gap-4">
        <div className="flex items-center gap-2 px-2">
          <IconDatabase className="text-accent" size={18} />
          <h2 className="font-mono text-xs uppercase tracking-widest text-ink-3">Schema Tables</h2>
        </div>
        
        <div className="flex flex-col gap-1 overflow-y-auto max-h-[60vh] md:max-h-none pr-2">
          {tables.map(table => (
            <button
              key={table}
              onClick={() => {
                setSelectedTable(table);
                setPage(1);
              }}
              className={`
                flex items-center justify-between px-3 py-2.5 rounded-md text-xs font-mono transition-all
                ${selectedTable === table 
                  ? "bg-accent text-white shadow-lg shadow-accent/20" 
                  : "bg-paper-2 text-ink-3 hover:bg-paper-3 hover:text-ink"}
              `}
            >
              <div className="flex items-center gap-2">
                <IconTable size={14} />
                <span className="truncate">{table}</span>
              </div>
              {selectedTable === table && <IconChevronRight size={14} />}
            </button>
          ))}
        </div>
      </aside>

      <main className="flex-1 flex flex-col gap-6 overflow-hidden">
        {selectedTable ? (
          <>
            <div className="flex flex-col lg:flex-row lg:items-end justify-between gap-6">
              <div className="flex-1">
                <h1 className="section-title text-2xl lowercase tracking-tighter" style={{ fontFamily: "var(--font-fraunces), serif" }}>
                  {selectedTable}
                </h1>
                <div className="flex items-center gap-3 mt-2">
                  <p className="text-[10px] font-mono text-ink-3 uppercase tracking-widest">
                    {total.toLocaleString()} records
                  </p>
                  <div className="h-px w-8 bg-border" />
                  <p className="text-[10px] font-mono text-accent uppercase tracking-widest">
                    {columns.length} columns
                  </p>
                </div>
              </div>

              <div className="flex flex-wrap items-end gap-4">
                <TextField 
                  className="w-full sm:w-72"
                  value={search}
                  onChange={(val) => {
                    setSearch(val);
                    setPage(1);
                  }}
                >
                  <Label className="text-[10px] font-mono text-ink-4 uppercase tracking-wider mb-1 block">Global Search</Label>
                  <InputGroup className="bg-paper-2 border border-border rounded-md flex items-center gap-2 focus-within:border-accent transition-all group">
                    <InputGroup.Prefix>
                      <IconSearch size={14} className="text-ink-4 group-focus-within:text-accent transition-colors" />
                    </InputGroup.Prefix>
                    <InputGroup.Input 
                      placeholder="Filter all columns..."
                      className="bg-transparent border-none outline-none text-xs font-mono text-ink w-full placeholder:text-ink-4"
                    />
                    {search && (
                      <button 
                        onClick={() => { setSearch(""); setPage(1); }}
                        className="text-ink-4 p-0 mr-3 hover:text-accent transition-colors"
                      >
                        <IconX size={14} />
                      </button>
                    )}
                  </InputGroup>
                </TextField>

                <Select 
                  className="w-[140px]" 
                  placeholder="Rows"
                  selectedKey={pageSize.toString()}
                  onSelectionChange={(key) => {
                    if (key) {
                      setPageSize(parseInt(key as string));
                      setPage(1);
                    }
                  }}
                >
                  <Label className="text-[10px] font-mono text-ink-4 uppercase tracking-wider mb-1">Limit</Label>
                  <Select.Trigger className="bg-paper-2 border border-border rounded-md px-3 py-1.5 flex items-center justify-between font-mono text-xs text-ink">
                    <Select.Value />
                  </Select.Trigger>
                  <Select.Popover className="bg-paper-2 border border-border shadow-xl rounded-md overflow-hidden">
                    <ListBox className="p-1">
                      {[100, 500, 1000].map(size => (
                        <ListBox.Item 
                          key={size} 
                          id={size.toString()} 
                          textValue={`${size} Rows`}
                          className="px-3 py-2 text-xs font-mono rounded-sm hover:bg-paper-3 cursor-pointer outline-none"
                        >
                          {size} Rows
                        </ListBox.Item>
                      ))}
                    </ListBox>
                  </Select.Popover>
                </Select>
              </div>
            </div>

            <Card className="border border-border bg-paper-2 overflow-hidden flex-1 rounded-lg">
              <Table variant="secondary" className="h-full">
                <Table.ScrollContainer className="h-full max-h-[70vh]">
                  <Table.Content 
                    aria-label={`Data explorer for ${selectedTable}`}
                    className="min-w-full"
                    sortDescriptor={sortDescriptor}
                    onSortChange={(descriptor) => {
                      setSortDescriptor(descriptor);
                      setPage(1);
                    }}
                  >
                    <Table.Header>
                      {columns.map((col, index) => (
                        <Table.Column 
                          key={col}
                          id={col}
                          isRowHeader={index === 0}
                          allowsSorting
                          className="bg-paper-3 font-mono text-[10px] uppercase tracking-tighter text-ink-3 py-3 px-4 border-b border-border whitespace-nowrap group"
                        >
                          {({sortDirection}) => (
                            <SortableColumnHeader sortDirection={sortDirection}>
                              {col}
                            </SortableColumnHeader>
                          )}
                        </Table.Column>
                      ))}
                    </Table.Header>
                    <Table.Body 
                      renderEmptyState={() => (
                        <div className="flex flex-col items-center justify-center p-12">
                          {loading ? (
                            <Spinner color="warning" >
                              <span>Fetching Data...</span>
                            </Spinner>
                          ) : (
                            <span className="text-ink-4 font-mono text-xs uppercase">No results found</span>
                          )}
                        </div>
                      )}
                    >
                      {loading ? [] : data.map((row, i) => (
                        <Table.Row key={i}>
                          {columns.map(col => (
                            <Table.Cell key={col} className="font-mono text-[11px] py-2 px-4 whitespace-nowrap text-ink-2">
                              {row[col]?.toString() ?? "null"}
                            </Table.Cell>
                          ))}
                        </Table.Row>
                      ))}
                    </Table.Body>
                  </Table.Content>
                </Table.ScrollContainer>
                
                <Table.Footer className="border-t border-border bg-paper-2 py-4">
                  <Pagination className="justify-center">
                    <Pagination.Content className="flex items-center gap-1">
                      <Pagination.Item>
                        <Pagination.Previous 
                          isDisabled={page === 1} 
                          onPress={() => setPage((p) => p - 1)}
                          className="px-3 py-1 text-xs font-mono bg-paper-2 border border-border rounded hover:bg-paper-3 disabled:opacity-50"
                        >
                          <IconChevronLeft size={14} className="inline mr-1" />
                          <span>Prev</span>
                        </Pagination.Previous>
                      </Pagination.Item>
                      
                      {Array.from({ length: Math.min(5, totalPages) }, (_, i) => {
                        let pageNum;
                        if (totalPages <= 5) pageNum = i + 1;
                        else if (page <= 3) pageNum = i + 1;
                        else if (page >= totalPages - 2) pageNum = totalPages - 4 + i;
                        else pageNum = page - 2 + i;
                        
                        return (
                          <Pagination.Item key={pageNum}>
                            <Pagination.Link 
                              isActive={pageNum === page} 
                              onPress={() => setPage(pageNum)}
                              className={`
                                px-3 py-1 text-xs font-mono rounded border transition-all
                                ${pageNum === page 
                                  ? "bg-accent text-white border-accent" 
                                  : "bg-paper-2 border-border hover:border-accent text-ink-3"}
                              `}
                            >
                              {pageNum}
                            </Pagination.Link>
                          </Pagination.Item>
                        );
                      })}

                      <Pagination.Item>
                        <Pagination.Next 
                          isDisabled={page === totalPages} 
                          onPress={() => setPage((p) => p + 1)}
                          className="px-3 py-1 text-xs font-mono bg-paper-2 border border-border rounded hover:bg-paper-3 disabled:opacity-50"
                        >
                          <span>Next</span>
                          <IconNext size={14} className="inline ml-1" />
                        </Pagination.Next>
                      </Pagination.Item>
                    </Pagination.Content>
                  </Pagination>
                </Table.Footer>
              </Table>
            </Card>
          </>
        ) : (
          <div className="flex-1 flex flex-col items-center justify-center text-center p-12 border-2 border-dashed border-border rounded-xl bg-paper-2/30">
            <IconDatabase size={48} className="text-ink-5 mb-4" />
            <h3 className="font-serif text-xl text-ink-3">Select a table to begin exploration</h3>
            <p className="text-xs font-mono text-ink-4 mt-2 uppercase tracking-widest max-w-md">
              Access the raw relational microdata from the 2025 SEBI Household Survey.
            </p>
          </div>
        )}
      </main>
    </div>
  );
}
