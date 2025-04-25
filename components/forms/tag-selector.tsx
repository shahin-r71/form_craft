'use client';

import { useEffect, useState } from 'react';
import { Label } from '@/components/ui/label';
import { Badge } from '@/components/ui/badge';
import { Input } from '@/components/ui/input';
import { X, Loader2 } from 'lucide-react';

interface Tag {
  id: string;
  name: string;
}

interface TagSelectorProps {
  selectedTags: string[];
  onTagsChange: (tags: string[]) => void;
}

export function TagSelector({ selectedTags, onTagsChange }: TagSelectorProps) {
  const [tags, setTags] = useState<Tag[]>([]);
  const [isLoading, setIsLoading] = useState(true); 
  const [inputValue, setInputValue] = useState('');
  const [filteredTags, setFilteredTags] = useState<Tag[]>([]);
  const [isCreatingTag, setIsCreatingTag] = useState(false); 
  const maxSuggestedTags = 5;

  useEffect(() => {
    const fetchTags = async () => {
      setIsLoading(true); 
      try {
        const response = await fetch('/api/tags');
        if (!response.ok) throw new Error('Failed to fetch tags');
        const data = await response.json();
        setTags(data);
        // Initial filter can be empty or based on initial state if needed
        // setFilteredTags(data); // Removed this, filter effect handles it
      } catch (error) {
        console.error('Error fetching tags:', error);
   
      } finally {
        setIsLoading(false);
      }
    };

    fetchTags();
  }, []);

  useEffect(() => {
    if (isLoading) return; 

    const trimmedInput = inputValue.trim().toLowerCase();
    if (!trimmedInput) {
        setFilteredTags([]); 
        return;
    }

    const filtered = tags
      .filter(
        (tag) =>
          tag.name.toLowerCase().includes(trimmedInput) &&
          !selectedTags.includes(tag.id)
      )
      .slice(0, maxSuggestedTags);
    setFilteredTags(filtered);
  }, [inputValue, selectedTags, tags, isLoading]); 

  const handleTagSelect = (tagId: string) => {
    // Prevent adding duplicates just in case
    if (!selectedTags.includes(tagId)) {
        onTagsChange([...selectedTags, tagId]);
    }
    setInputValue('');
  };

  const handleCreateTag = async () => {
    const trimmedInput = inputValue.trim();
    if (!trimmedInput || isCreatingTag) return; // Prevent empty/double creation

    setIsCreatingTag(true);
    try {
      const response = await fetch('/api/tags', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ name: trimmedInput })
      });

      if (!response.ok) {
          // Handle specific errors maybe? e.g., tag already exists
          const errorData = await response.text(); // Or response.json() if API returns JSON error
          throw new Error(`Failed to create tag: ${response.statusText} (${errorData})`);
      }

      const newTag: Tag = await response.json();
      // Update local state immediately for better UX
      setTags(prevTags => {
          // Avoid adding duplicate if fetched tags updated concurrently
          if (prevTags.some(t => t.id === newTag.id)) {
              return prevTags;
          }
          return [...prevTags, newTag];
      });
      handleTagSelect(newTag.id);
    } catch (error) {
      console.error('Error creating tag:', error);
      // Optionally show an error message to the user
    } finally {
      setIsCreatingTag(false);
      // Input is cleared by handleTagSelect called on success
    }
  };

  const handleTagRemove = (tagId: string) => {
    onTagsChange(selectedTags.filter((id) => id !== tagId));
  };

  // Use a Map for faster lookups, especially if `tags` list grows large
  const tagNameMap = new Map(tags.map(tag => [tag.id, tag.name]));
  const getTagName = (tagId: string) => {
    return tagNameMap.get(tagId) || '';
  };

  // Determine if the exact match exists for the create button logic
  const exactMatchExists = filteredTags.some(tag =>
    tag.name.toLowerCase() === inputValue.trim().toLowerCase()
  );
  const showCreateButton = inputValue.trim() && !exactMatchExists;

  return (
    <div className="space-y-2">
      <Label htmlFor="tags">Tags</Label>
      <div className="space-y-2">
        <div className="flex flex-wrap gap-2 min-h-[28px]"> {/* Added min-height */}
          {selectedTags.map((tagId) => (
            <Badge key={tagId} variant="secondary" className="flex items-center gap-1 whitespace-nowrap"> {/* Added whitespace-nowrap */}
              {getTagName(tagId)}
              <button
                type="button"
                onClick={() => handleTagRemove(tagId)}
                className="text-muted-foreground hover:text-foreground focus:outline-none rounded-full" // Added focus style
                aria-label={`Remove tag ${getTagName(tagId)}`} // Added aria-label
              >
                <X className="h-3 w-3" />
              </button>
            </Badge>
          ))}
        </div>
        <div className="relative">
          <Input
            id="tags"
            value={inputValue}
            onChange={(e) => setInputValue(e.target.value)}
            placeholder="Type to search or create tags..." 
            disabled={isLoading} // Disable only during initial load
            aria-autocomplete="list" 
            aria-controls="tag-suggestions" 
          />
          {/* Show suggestions only when input is not empty and not during initial load */}
          {inputValue.trim() && !isLoading && (
            <div
              id="tag-suggestions" 
              className="absolute z-10 w-full mt-1 bg-popover border rounded-md shadow-lg max-h-60 overflow-y-auto" 
            >
              {filteredTags.map((tag) => (
                <button
                  key={tag.id}
                  type="button"
                  className="w-full px-4 py-2 text-left hover:bg-accent focus:bg-accent focus:outline-none" 
                  onClick={() => handleTagSelect(tag.id)}
                >
                  {tag.name}
                </button>
              ))}
              {/* Show create button if input has text and no exact match exists */}
              {showCreateButton && (
                <button
                  type="button"
                  className="w-full px-4 py-2 text-left hover:bg-accent focus:bg-accent focus:outline-none text-primary flex items-center gap-2" // Added flex, items-center, gap
                  onClick={handleCreateTag}
                  disabled={isCreatingTag} 
                >
                  {isCreatingTag ? (
                    <>
                      <Loader2 className="h-4 w-4 animate-spin" />
                      Creating... 
                    </>
                  ) : (
                    `Create tag "${inputValue.trim()}"` // Normal Text
                  )}
                </button>
              )}
              {/*  Show message if input has text but no results/create option */}
              {inputValue.trim() && filteredTags.length === 0 && !showCreateButton && (
                 <div className="px-4 py-2 text-sm text-muted-foreground">No matching tags found.</div>
              )}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
