'use client';

import { useEffect, useState } from 'react';
import { Label } from '@/components/ui/label';
import { Badge } from '@/components/ui/badge';
import { Input } from '@/components/ui/input';
import { X, Loader2 } from 'lucide-react';
import { useTranslations } from 'next-intl';
import { toast } from 'react-toastify';

interface User {
  id: string;
  email: string;
  name?: string;
}

interface UserSelectorProps {
  selectedUsers: string[];
  onUsersChange: (users: string[]) => void;
}

export function UserSelector({ selectedUsers, onUsersChange }: UserSelectorProps) {
  const t = useTranslations('UserSelector');
  const [users, setUsers] = useState<User[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [inputValue, setInputValue] = useState('');
  const [filteredUsers, setFilteredUsers] = useState<User[]>([]);
  const [page, setPage] = useState(1);
  const [hasMore, setHasMore] = useState(false);
  const maxSuggestedUsers = 10;
  const debounceTimeout = 300;

  const fetchUsers = async (searchTerm: string, pageNum: number) => {
    try {
      const response = await fetch(
        `/api/users/search?q=${encodeURIComponent(searchTerm)}&page=${pageNum}&limit=${maxSuggestedUsers}`
      );
      if (!response.ok) throw new Error(t('errorFetchUsers'));
      const data = await response.json();
      return {
        users: data.users as User[],
        hasMore: data.hasMore as boolean
      };
    } catch (error) {
      console.error('Error fetching users:', error); // Keep console log for debugging
      toast.error(t('errorFetchUsers'));
      return { users: [], hasMore: false };
    }
  };

  useEffect(() => {
    let timeoutId: NodeJS.Timeout;

    const debouncedSearch = async () => {
      setIsLoading(true);
      const trimmedInput = inputValue.trim();

      if (!trimmedInput) {
        setFilteredUsers([]);
        setIsLoading(false);
        return;
      }

      try {
        const { users: fetchedUsers, hasMore: moreAvailable } = await fetchUsers(trimmedInput, 1);
        setFilteredUsers(fetchedUsers.filter(user => !selectedUsers.includes(user.id)));
        setHasMore(moreAvailable);
        setPage(1);
      } finally {
        setIsLoading(false);
      }
    };

    timeoutId = setTimeout(debouncedSearch, debounceTimeout);

    return () => clearTimeout(timeoutId);
  }, [inputValue, selectedUsers]);

  const loadMoreUsers = async () => {
    if (!hasMore || isLoading || !inputValue.trim()) return;

    setIsLoading(true);
    try {
      const { users: moreUsers, hasMore: moreAvailable } = await fetchUsers(inputValue.trim(), page + 1);
      setFilteredUsers(prev => [
        ...prev,
        ...moreUsers.filter(user => !selectedUsers.includes(user.id))
      ]);
      setHasMore(moreAvailable);
      setPage(prev => prev + 1);
    } finally {
      setIsLoading(false);
    }
  };

  const handleUserSelect = (user: User) => {
    if (!selectedUsers.includes(user.id)) {
      // Update users state to include the newly selected user
      setUsers(prevUsers => {
        if (!prevUsers.find(u => u.id === user.id)) {
          return [...prevUsers, user];
        }
        return prevUsers;
      });
      onUsersChange([...selectedUsers, user.id]);
    }
    setInputValue('');
    setFilteredUsers([]);
  };

  const handleUserRemove = (userId: string) => {
    onUsersChange(selectedUsers.filter((id) => id !== userId));
  };

  // Maintain a map of all users we've seen for efficient lookup
  const getUserDisplay = (user: User) => {
    return user.name ? `${user.name} (${user.email})` : user.email;
  };


  return (
    <div className="space-y-2">
      <Label htmlFor="users" className="flex items-center gap-2">
        {t('label')}
        <span className="text-sm text-muted-foreground">{t('labelHint')}</span>
      </Label>
      <div className="space-y-2">
        {
          selectedUsers.length > 0 && (
        <div className="flex flex-wrap gap-2 min-h-[28px] p-2 bg-muted/30 rounded-lg border border-dashed">
          {selectedUsers.map((userId) => (
            <Badge key={userId} variant="secondary" className="flex items-center gap-1 whitespace-nowrap">
              {getUserDisplay(users.find(u => u.id === userId) || { id: userId, email: '' })}
              <button
                type="button"
                onClick={() => handleUserRemove(userId)}
                className="text-muted-foreground hover:text-foreground focus:outline-none rounded-full"
                aria-label={t('removeUserAriaLabel', { userName: getUserDisplay(users.find(u => u.id === userId) || { id: userId, email: '' }) })}
              >
                <X className="h-3 w-3" />
              </button>
            </Badge>
          ))}
        </div>
            
          )
        }
        <div className="relative">
          <Input
            id="users"
            value={inputValue}
            onChange={(e) => setInputValue(e.target.value)}
            placeholder={t('searchPlaceholder')}
            // disabled={isLoading}
            aria-autocomplete="list"
            aria-controls="user-suggestions"
          />
          {inputValue.trim() && (
            <div
              id="user-suggestions"
              className="absolute z-10 w-full mt-1 bg-popover border rounded-md shadow-lg max-h-60 overflow-y-auto"
            >
              {filteredUsers.map((user) => (
                <button
                  key={user.id}
                  type="button"
                  className="w-full px-4 py-2 text-left hover:bg-accent focus:bg-accent focus:outline-none"
                  onClick={() => handleUserSelect(user)}
                >
                  {getUserDisplay(user)}
                </button>
              ))}
              {isLoading && filteredUsers.length===0 && (
                    <div className='flex justify-start items-center gap-1.5 py-2 px-4'> {/* Added padding */} 
                      <Loader2 className="h-4 w-4 animate-spin" />
                      {t('loadingText')}
                    </div>
                  
                )}
              {hasMore && (
                <button
                  type="button"
                  className="w-full px-4 py-2 text-left hover:bg-accent focus:bg-accent focus:outline-none text-primary flex items-center justify-center gap-2"
                  onClick={loadMoreUsers}
                  disabled={isLoading}
                >
                  {isLoading ? (
                    <div className='flex justify-center items-center gap-1.5 py-2'> {/* Centered loading */} 
                      <Loader2 className="h-4 w-4 animate-spin" />
                      {t('loadingText')}
                    </div>
                  ) : (
                    t('loadMoreButton')
                  )}
                </button>
              )}
              {!isLoading && filteredUsers.length === 0 && (
                <div className="px-4 py-2 text-sm text-muted-foreground">
                  {t('noResultsText')}
                </div>
              )}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}