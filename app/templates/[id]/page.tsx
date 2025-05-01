"use client";

import { useEffect, useState, useCallback } from "react";
import { useParams, useRouter } from "next/navigation";
import { TemplateActions } from "@/components/templates/template-actions";
import { Template } from "@/types/template";
import { createClient } from "@/utils/supabase/client";
import { Button } from "@/components/ui/button";
import { ClipboardList, Share2, Heart, MessageSquare } from "lucide-react";
import { toast } from "react-toastify";
import { Textarea } from "@/components/ui/textarea";
import { Card } from "@/components/ui/card";

export default function TemplateResults() {
  const { id } = useParams();
  const router = useRouter();
  const [template, setTemplate] = useState<Template | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [currentUserId, setCurrentUserId] = useState<string>("");
  const [hasLiked, setHasLiked] = useState(false);
  const [comment, setComment] = useState<string>("");
  const [comments, setComments] = useState<any[]>([]);
  const [totalComments, setTotalComments] = useState(0);
  const [currentPage, setCurrentPage] = useState(1);
  const [totalPages, setTotalPages] = useState(0);
  const [isLoadingComments, setIsLoadingComments] = useState(false);
  const [isSubmittingComment, setIsSubmittingComment] = useState(false);
  const [isTogglingLike, setIsTogglingLike] = useState(false);

  const supabase = createClient();

  useEffect(() => {
    const fetchCurrentUser = async () => {
      const {
        data: { user },
      } = await supabase.auth.getUser();
      setCurrentUserId(user?.id || "");
    };

    const fetchLikeStatus = async () => {
      try {
        const response = await fetch(`/api/templates/${id}/likes`);
        if (response.ok) {
          const data = await response.json();
          setHasLiked(data.hasLiked);
        }
      } catch (error) {
        console.error("Error fetching like status:", error);
      }
    };

    const fetchComments = async () => {
      try {
        setIsLoadingComments(true);
        const response = await fetch(
          `/api/templates/${id}/comments?page=${currentPage}&limit=5`
        );
        if (response.ok) {
          const data = await response.json();
          setComments(data.comments);
          setTotalComments(data.totalComments);
          setTotalPages(data.totalPages);
        }
      } catch (error) {
        console.error("Error fetching comments:", error);
      } finally {
        setIsLoadingComments(false);
      }
    };

    fetchCurrentUser();
    if (id) {
      fetchLikeStatus();
      fetchComments();
    }

    // Check if we have a submitted=true query param to show success message
    const urlParams = new URLSearchParams(window.location.search);
    if (urlParams.get("submitted") === "true") {
      toast.success(
        "Form submitted successfully! Thank you for your submission.",
        {
          position: "top-center",
          autoClose: 6000,
        }
      );
      window.history.replaceState({}, document.title, window.location.pathname);
    }
  }, [id, currentPage]);

  const handleLike = async () => {
    if (!currentUserId && isTogglingLike) return;

    const newLikeState = !hasLiked;
    const oldLikeCount = template?._count?.likes || 0;

    // Set toggling state
    setIsTogglingLike(true);

    // Optimistic update
    setHasLiked(newLikeState);
    setTemplate((prev) =>
      prev
        ? {
            ...prev,
            _count: {
              ...prev._count!,
              likes: oldLikeCount + (newLikeState ? 1 : -1),
              comments: prev._count?.comments || 0,
              submissions: prev._count?.submissions || 0,
            },
          }
        : null
    );

    try {
      const response = await fetch(`/api/templates/${id}/likes`, {
        method: "POST",
      });

      if (!response.ok) {
        throw new Error("Failed to toggle like");
      }
      await response.json();
    } catch (error) {
      console.error("Error toggling like:", error);

      // Revert optimistic update on error
      setHasLiked(!newLikeState);
      setTemplate((prev) =>
        prev
          ? {
              ...prev,
              _count: {
                ...prev._count!,
                likes: oldLikeCount,
                comments: prev._count?.comments || 0,
                submissions: prev._count?.submissions || 0,
              },
            }
          : null
      );
      toast.error("Take some breath before trying again...");
    } finally {
      setIsTogglingLike(false);
    }
  };

  const handleComment = async () => {
    if (!currentUserId || !comment.trim() || isSubmittingComment) return;

    try {
      setIsSubmittingComment(true);
      const response = await fetch(`/api/templates/${id}/comments`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({ content: comment }),
      });

      if (response.ok) {
        setComment("");
        // Refresh comments
        const commentsResponse = await fetch(
          `/api/templates/${id}/comments?page=1&limit=5`
        );
        if (commentsResponse.ok) {
          const data = await commentsResponse.json();
          setComments(data.comments);
          setTotalComments(data.totalComments);
          setTotalPages(data.totalPages);
          setCurrentPage(1);
        }
        toast.success("Comment added successfully", {
          position: "top-center",
          autoClose: 2500,
        });
      }
    } catch (error) {
      console.error("Error adding comment:", error);
      toast.error("Failed to add comment", {
        position: "top-center",
        autoClose: 3000,
      });
    } finally {
      setIsSubmittingComment(false);
    }
  };

  const loadMoreComments = () => {
    if (currentPage < totalPages) {
      setCurrentPage((prev) => prev + 1);
    }
  };
  useEffect(() => {
    const fetchTemplate = async () => {
      try {
        const response = await fetch(`/api/templates/${id}`);
        if (!response.ok) {
          throw new Error("Failed to fetch template");
        }
        const data = await response.json();
        setTemplate(data);
      } catch (err) {
        setError(err instanceof Error ? err.message : "An error occurred");
      } finally {
        setLoading(false);
      }
    };

    if (id) {
      fetchTemplate();
    }
  }, [id]);

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <div className="animate-spin rounded-full h-8 w-8 border-t-2 border-b-2 border-blue-500"></div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <div className="text-red-500">{error}</div>
      </div>
    );
  }

  if (!template) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <div>Template not found</div>
      </div>
    );
  }

  return (
    <div className="container mx-auto px-4 py-8">
      <div className="bg-white dark:bg-gray-800 max-w-3xl mx-auto rounded-lg shadow-lg p-6">
        <div className="flex justify-end mb-4">
          <TemplateActions
            templateId={template.id}
            ownerId={template.owner.id}
            currentUserId={currentUserId}
          />
        </div>
        <div className="mb-6">
          <h1 className="text-3xl font-bold mb-2">{template.title}</h1>
          {template.description && (
            <p className="text-gray-600">{template.description}</p>
          )}
        </div>

        <div className="mb-6">
          <div className="flex items-center gap-4 text-sm text-gray-600">
            <div className="flex items-center gap-2">
              <span>Created by:</span>
              <span className="font-medium">
                {template.owner.name || "Anonymous"}
              </span>
            </div>
            {template.topic && (
              <div className="flex items-center gap-2">
                <span>Topic:</span>
                <span className="font-medium">{template.topic.name}</span>
              </div>
            )}
          </div>
        </div>

        <div className="mb-6">
          <h2 className="text-xl font-semibold mb-4">Template Fields</h2>
          <div className="space-y-4">
            {template.templateFields.map((field) => (
              <div key={field.id} className="border rounded-lg p-4">
                <h3 className="font-medium mb-2">{field.title}</h3>
                {field.description && (
                  <p className="text-gray-600 text-sm mb-2">
                    {field.description}
                  </p>
                )}
                <div className="flex gap-4 text-sm text-gray-600">
                  <span>Type: {field.type}</span>
                  <span>{field.required ? "Required" : "Optional"}</span>
                  <span>
                    {field.showInResults
                      ? "Shown in results"
                      : "Hidden in results"}
                  </span>
                </div>
              </div>
            ))}
          </div>
        </div>

        {template._count && (
          <div className="flex gap-4 text-sm text-gray-600 mb-6">
            <span>{template._count.submissions} submissions</span>
            <span>{template._count.likes} likes</span>
            <span>{template._count.comments} comments</span>
          </div>
        )}

        <div className="space-y-6">
          <div className="flex gap-4">
            <Button
              onClick={() => router.push(`/templates/${id}/submit`)}
              className="bg-blue-600 hover:bg-blue-700"
            >
              <ClipboardList className="mr-2 h-4 w-4" /> Fill Out Form
            </Button>

            {/* Only show the View Submissions button for template owners */}
            {template.owner.id === currentUserId && (
              <Button
                variant="outline"
                onClick={() => router.push(`/templates/${id}/submissions`)}
              >
                <Share2 className="mr-2 h-4 w-4" /> View Submissions
              </Button>
            )}

            <Button
              variant="outline"
              onClick={handleLike}
              disabled={!currentUserId || isTogglingLike}
              className={`transition-colors duration-200 ${
                hasLiked
                  ? "bg-red-50 text-red-600 hover:bg-red-100 border-red-200"
                  : "hover:bg-gray-100"
              }`}
            >
              <Heart
                className={`mr-2 h-4 w-4 transition-transform duration-200 ${
                  hasLiked ? "fill-current scale-110" : "scale-100"
                }`}
              />
              <span
                className={`${hasLiked ? "text-red-100" : "text-gray-400"}`}
              >
                {template._count?.likes || 0}{" "}
                {template._count?.likes === 1 ? "Like" : "Likes"}
              </span>
            </Button>
          </div>

          {/* Comments Section */}
          <div className="space-y-4">
            <h3 className="text-lg font-semibold">
              Comments ({totalComments})
            </h3>

            {currentUserId ? (
              <div className="space-y-2">
                <Textarea
                  value={comment}
                  onChange={(e) => setComment(e.target.value)}
                  placeholder="Add a comment..."
                  className="w-full"
                />
                <Button
                  onClick={handleComment}
                  disabled={!comment.trim() || isSubmittingComment}
                >
                  <MessageSquare className="mr-2 h-4 w-4" />
                  {isSubmittingComment ? "Posting..." : "Post Comment"}
                </Button>
              </div>
            ) : (
              <p className="text-sm text-gray-500">Please sign in to comment</p>
            )}

            <div className="space-y-4">
              {comments.map((comment) => (
                <Card key={comment.id} className="p-4 dark:bg-gray">
                  <div className="flex items-start justify-center space-x-4">
                    {comment.user.avatarUrl ? (
                      <img
                        src={comment.user.avatarUrl}
                        alt={comment.user.name}
                        className="w-10 h-10 rounded-full"
                      />
                    ) : (
                      <span className="w-10 h-10 rounded-full bg-blue-600"></span>
                    )}
                    <div className="flex-1">
                      <div className="flex items-center justify-between">
                        <h4 className="font-medium">
                          {comment.user.name ?? "Anonymous"}
                        </h4>
                        <span className="text-sm text-gray-100">
                          {new Date(comment.createdAt).toLocaleDateString()}
                        </span>
                      </div>
                      <p className="mt-1 text-gray-200">{comment.content}</p>
                    </div>
                  </div>
                </Card>
              ))}

              {isLoadingComments && (
                <div className="flex justify-center">
                  <div className="animate-spin rounded-full h-8 w-8 border-t-2 border-b-2 border-blue-500"></div>
                </div>
              )}

              {currentPage < totalPages && (
                <div className="flex justify-center">
                  <Button
                    variant="outline"
                    onClick={loadMoreComments}
                    disabled={isLoadingComments}
                  >
                    Load More Comments
                  </Button>
                </div>
              )}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
