'use client';

import React, { useEffect, useState, useMemo } from 'react';
import {
  ColumnDef,
  flexRender,
  getCoreRowModel,
  getPaginationRowModel,
  getSortedRowModel,
  SortingState,
  useReactTable,
  RowSelectionState,
} from '@tanstack/react-table';
import { ArrowUpDown, MoreHorizontal } from 'lucide-react';

import { Button } from '@/components/ui/button';
import { Checkbox } from '@/components/ui/checkbox';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';
import { Input } from '@/components/ui/input';
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table';
import { toast } from 'react-toastify';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { createClient } from '@/utils/supabase/client';

interface User {
  id: string;
  email: string;
  name: string | null;
  avatarUrl: string | null;
  isAdmin: boolean;
  isActive: boolean;
  createdAt: string;
  _count: {
    templates: number;
    submissions: number;
  };
}

interface ApiResponse {
  users: User[];
  totalUsers: number;
  totalPages: number;
  currentPage: number;
}

export default function AdminUsersPage() {
  const [data, setData] = useState<User[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [sorting, setSorting] = useState<SortingState>([]);
  const [rowSelection, setRowSelection] = useState<RowSelectionState>({});
  const [pagination, setPagination] = useState({
    pageIndex: 0, //initial page index
    pageSize: 10, //default page size
  });
  const [totalPages, setTotalPages] = useState(0);
  const [searchQuery, setSearchQuery] = useState('');

  const fetchData = async (page: number, limit: number, query: string) => {
    setLoading(true);
    try {
      const response = await fetch(`/api/admin/users?page=${page + 1}&limit=${limit}&q=${query}`);
      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.error || 'Failed to fetch users');
      }
      const result: ApiResponse = await response.json();
      setData(result.users);
      setTotalPages(result.totalPages);
      setError(null);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'An unknown error occurred');
      toast.error(err instanceof Error ? err.message : 'An unknown error occurred');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchData(pagination.pageIndex, pagination.pageSize, searchQuery);
  }, [pagination.pageIndex, pagination.pageSize, searchQuery]);

  const handleSearchChange = (event: React.ChangeEvent<HTMLInputElement>) => {
    setSearchQuery(event.target.value);
    setPagination(prev => ({ ...prev, pageIndex: 0 })); // Reset to first page on search
  };

  const handleUserAction = async (userId: string, action: 'block' | 'unblock' | 'delete' | 'makeAdmin' | 'removeAdmin') => {
    let newIsActive: boolean | undefined;
    let newIsAdmin: boolean | undefined;
    let method = 'PUT';
    let successMessage = 'User updated successfully';

    switch (action) {
      case 'block':
        newIsActive = false;
        successMessage = 'User blocked successfully';
        break;
      case 'unblock':
        newIsActive = true;
        successMessage = 'User unblocked successfully';
        break;
      case 'makeAdmin':
        newIsAdmin = true;
        successMessage = 'User promoted to admin';
        break;
      case 'removeAdmin':
        newIsAdmin = false;
        successMessage = 'User demoted from admin';
        break;
      case 'delete':
        method = 'DELETE';
        successMessage = 'User deleted successfully';
        if (!confirm('Are you sure you want to delete this user? This action cannot be undone.')) {
          return;
        }
        break;
    }
    const supabase = createClient();
    const { data: { user } } = await supabase.auth.getUser();

    try {
      const url = method === 'DELETE' ? `/api/user/profile/delete?userId=${userId}&curUser=${user?.id}` : '/api/admin/users';
      const body = method === 'PUT' ? JSON.stringify({ userId, isActive: newIsActive, isAdmin: newIsAdmin }) : undefined;
      
      const response = await fetch(url, {
        method,
        headers: {
          'Content-Type': 'application/json',
        },
        body,
      });

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.error || `Failed to ${action} user`);
      }
      toast.success(successMessage);
      fetchData(pagination.pageIndex, pagination.pageSize, searchQuery); // Refresh data
      setRowSelection({}); // Clear selection
    } catch (err) {
      toast.error(err instanceof Error ? err.message : `Failed to ${action} user`);
      console.error(`Error performing action ${action}:`, err);
    }
  };

  const columns: ColumnDef<User>[] = useMemo(() => [
    {
      id: 'select',
      header: ({ table }) => (
        <Checkbox
          checked={table.getIsAllPageRowsSelected()}
          onCheckedChange={(value) => table.toggleAllPageRowsSelected(!!value)}
          aria-label="Select all"
        />
      ),
      cell: ({ row }) => (
        <Checkbox
          checked={row.getIsSelected()}
          onCheckedChange={(value) => row.toggleSelected(!!value)}
          aria-label="Select row"
        />
      ),
      enableSorting: false,
      enableHiding: false,
    },
    {
      accessorKey: 'name',
      header: ({ column }) => (
        <Button
          variant="ghost"
          onClick={() => column.toggleSorting(column.getIsSorted() === 'asc')}
        >
          User
          <ArrowUpDown className="ml-2 h-4 w-4" />
        </Button>
      ),
      cell: ({ row }) => {
        const user = row.original;
        return (
          <div className="flex items-center space-x-2">
            <Avatar className="h-8 w-8">
              <AvatarImage src={user.avatarUrl || undefined} alt={user.name || user.email} />
              <AvatarFallback>{user.name ? user.name[0].toUpperCase() : user.email[0].toUpperCase()}</AvatarFallback>
            </Avatar>
            <div>
              <div className="font-medium">{user.name || 'N/A'}</div>
              <div className="text-xs text-muted-foreground">{user.email}</div>
            </div>
          </div>
        );
      },
    },
    {
      accessorKey: 'isAdmin',
      header: 'Admin',
      cell: ({ row }) => (row.original.isAdmin ? 'Yes' : 'No'),
    },
    {
      accessorKey: 'isActive',
      header: 'Status',
      cell: ({ row }) => (row.original.isActive ? 
        <span className="px-2 py-1 text-xs font-medium text-green-700 bg-green-100 rounded-full dark:text-green-200 dark:bg-green-700">Active</span> : 
        <span className="px-2 py-1 text-xs font-medium text-red-700 bg-red-100 rounded-full dark:text-red-200 dark:bg-red-700">Blocked</span>
      ),
    },
    {
      accessorKey: '_count.templates',
      header: 'Templates',
      cell: ({ row }) => row.original._count.templates,
    },
    {
      accessorKey: '_count.submissions',
      header: 'Submissions',
      cell: ({ row }) => row.original._count.submissions,
    },
    {
      accessorKey: 'createdAt',
      header: 'Joined',
      cell: ({ row }) => new Date(row.original.createdAt).toLocaleDateString(),
    },
    {
      id: 'actions',
      cell: ({ row }) => {
        const user = row.original;
        return (
          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <Button variant="ghost" className="h-8 w-8 p-0">
                <span className="sr-only">Open menu</span>
                <MoreHorizontal className="h-4 w-4" />
              </Button>
            </DropdownMenuTrigger>
            <DropdownMenuContent align="end">
              <DropdownMenuLabel>Actions</DropdownMenuLabel>
              <DropdownMenuItem onClick={() => navigator.clipboard.writeText(user.id)}>
                Copy user ID
              </DropdownMenuItem>
              <DropdownMenuSeparator />
              {user.isActive ? (
                <DropdownMenuItem onClick={() => handleUserAction(user.id, 'block')}>Block User</DropdownMenuItem>
              ) : (
                <DropdownMenuItem onClick={() => handleUserAction(user.id, 'unblock')}>Unblock User</DropdownMenuItem>
              )}
              {user.isAdmin ? (
                <DropdownMenuItem onClick={() => handleUserAction(user.id, 'removeAdmin')}>Remove Admin</DropdownMenuItem>
              ) : (
                <DropdownMenuItem onClick={() => handleUserAction(user.id, 'makeAdmin')}>Make Admin</DropdownMenuItem>
              )}
              <DropdownMenuItem className="text-red-600" onClick={() => handleUserAction(user.id, 'delete')}>Delete User</DropdownMenuItem>
            </DropdownMenuContent>
          </DropdownMenu>
        );
      },
    },
  ], [handleUserAction]);

  const table = useReactTable({
    data,
    columns,
    state: {
      sorting,
      rowSelection,
      pagination,
    },
    manualPagination: true,
    pageCount: totalPages,
    onPaginationChange: setPagination,
    onSortingChange: setSorting,
    onRowSelectionChange: setRowSelection,
    getCoreRowModel: getCoreRowModel(),
    getPaginationRowModel: getPaginationRowModel(),
    getSortedRowModel: getSortedRowModel(),
  });

  const selectedRows = table.getSelectedRowModel().rows;
  const singleSelectedUser = selectedRows.length === 1 ? selectedRows[0].original : null;

  if (loading && data.length === 0) {
    return <div className="flex items-center justify-center min-h-screen"><div className="animate-spin rounded-full h-10 w-10 border-t-2 border-b-2 border-primary"></div></div>;
  }

  if (error && data.length === 0) {
    return <div className="flex items-center justify-center min-h-screen text-red-500">Error: {error}</div>;
  }

  return (
    <div className="container mx-auto py-10">
      <h1 className="text-2xl font-bold mb-6">User Management</h1>
      <div className="flex items-center justify-between py-4">
        <Input
          placeholder="Search users (email or name)..."
          value={searchQuery}
          onChange={handleSearchChange}
          className="max-w-sm"
        />
        {singleSelectedUser && (
          <div className="space-x-2">
            {singleSelectedUser.isActive ? (
                <Button variant="outline" onClick={() => handleUserAction(singleSelectedUser.id, 'block')}>Block</Button>
            ) : (
                <Button variant="outline" onClick={() => handleUserAction(singleSelectedUser.id, 'unblock')}>Unblock</Button>
            )}
            {singleSelectedUser.isAdmin ? (
                <Button variant="outline" onClick={() => handleUserAction(singleSelectedUser.id, 'removeAdmin')}>Remove Admin</Button>
            ) : (
                <Button variant="outline" onClick={() => handleUserAction(singleSelectedUser.id, 'makeAdmin')}>Make Admin</Button>
            )}
            <Button variant="destructive" onClick={() => handleUserAction(singleSelectedUser.id, 'delete')}>Delete</Button>
          </div>
        )}
      </div>
      <div className="rounded-md border">
        <Table>
          <TableHeader>
            {table.getHeaderGroups().map((headerGroup) => (
              <TableRow key={headerGroup.id}>
                {headerGroup.headers.map((header) => (
                  <TableHead key={header.id}>
                    {header.isPlaceholder
                      ? null
                      : flexRender(
                          header.column.columnDef.header,
                          header.getContext()
                        )}
                  </TableHead>
                ))}
              </TableRow>
            ))}
          </TableHeader>
          <TableBody>
            {table.getRowModel().rows?.length ? (
              table.getRowModel().rows.map((row) => (
                <TableRow
                  key={row.id}
                  data-state={row.getIsSelected() && 'selected'}
                >
                  {row.getVisibleCells().map((cell) => (
                    <TableCell key={cell.id}>
                      {flexRender(cell.column.columnDef.cell, cell.getContext())}
                    </TableCell>
                  ))}
                </TableRow>
              ))
            ) : (
              <TableRow>
                <TableCell colSpan={columns.length} className="h-24 text-center">
                  No results.
                </TableCell>
              </TableRow>
            )}
          </TableBody>
        </Table>
      </div>
      <div className="flex items-center justify-end space-x-2 py-4">
        <div className="flex-1 text-sm text-muted-foreground">
          {table.getFilteredSelectedRowModel().rows.length} of{" "}
          {table.getFilteredRowModel().rows.length} row(s) selected.
        </div>
        <Button
          variant="outline"
          size="sm"
          onClick={() => table.previousPage()}
          disabled={!table.getCanPreviousPage()}
        >
          Previous
        </Button>
        <Button
          variant="outline"
          size="sm"
          onClick={() => table.nextPage()}
          disabled={!table.getCanNextPage()}
        >
          Next
        </Button>
         <span className="text-sm">
          Page {table.getState().pagination.pageIndex + 1} of {table.getPageCount()}
        </span>
      </div>
    </div>
  );
}