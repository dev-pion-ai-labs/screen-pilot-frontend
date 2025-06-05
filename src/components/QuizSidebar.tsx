
import React from "react";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Separator } from "@/components/ui/separator";
import { ScrollArea } from "@/components/ui/scroll-area";
import {
  Plus,
  Brain,
  Trophy,
  Target,
  Clock,
  MoreVertical,
  Trash2,
  MessageCircle,
} from "lucide-react";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { cn } from "@/lib/utils";
import { QuizChat } from "@/hooks/useQuizChats";

interface QuizSidebarProps {
  chats: QuizChat[];
  activeChat: string | null;
  onCreateNew: () => void;
  onLoadChat: (chatId: string) => void;
  onDeleteChat: (chatId: string) => void;
}

export const QuizSidebar: React.FC<QuizSidebarProps> = ({
  chats,
  activeChat,
  onCreateNew,
  onLoadChat,
  onDeleteChat,
}) => {
  const formatTimeAgo = (date: string): string => {
    const now = new Date();
    const created = new Date(date);
    const diffMs = now.getTime() - created.getTime();
    const diffHours = Math.floor(diffMs / (1000 * 60 * 60));
    const diffMins = Math.floor(diffMs / (1000 * 60));
    const diffDays = Math.floor(diffHours / 24);

    if (diffDays > 0) return `${diffDays}d`;
    if (diffHours > 0) return `${diffHours}h`;
    if (diffMins > 0) return `${diffMins}m`;
    return "now";
  };

  const getScoreDisplay = (chat: QuizChat): string => {
    if (chat.total_questions > 0) {
      return `${chat.score}/${chat.total_questions}`;
    }
    return chat.status === "completed" ? "Complete" : "In Progress";
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case "completed":
        return "bg-green-100 text-green-700 border-green-200";
      case "active":
        return "bg-blue-100 text-blue-700 border-blue-200";
      default:
        return "bg-gray-100 text-gray-700 border-gray-200";
    }
  };

  return (
    <div className="h-full flex flex-col bg-white border-r">
      {/* Header */}
      <div className="p-4 border-b bg-gradient-to-r from-purple-50 to-blue-50">
        <div className="flex items-center gap-3 mb-4">
          <div className="w-8 h-8 bg-gradient-to-r from-purple-600 to-blue-600 rounded-lg flex items-center justify-center">
            <Brain className="h-4 w-4 text-white" />
          </div>
          <div>
            <h3 className="font-semibold text-gray-900">Quizzy</h3>
            <p className="text-xs text-gray-600">Quiz Master AI</p>
          </div>
        </div>

        <Button
          onClick={onCreateNew}
          className="w-full bg-gradient-to-r from-purple-600 to-blue-600 hover:from-purple-700 hover:to-blue-700 text-white shadow-sm"
          size="sm"
        >
          <Plus className="h-4 w-4 mr-2" />
          New Quiz Session
        </Button>
      </div>

      {/* Stats */}
      <div className="p-4 bg-gray-50 border-b">
        <div className="grid grid-cols-2 gap-3 text-center">
          <div className="bg-white rounded-lg p-3 shadow-sm">
            <div className="text-lg font-semibold text-purple-600">
              {chats.length}
            </div>
            <div className="text-xs text-gray-600">Total Sessions</div>
          </div>
          <div className="bg-white rounded-lg p-3 shadow-sm">
            <div className="text-lg font-semibold text-green-600">
              {chats.filter((c) => c.status === "completed").length}
            </div>
            <div className="text-xs text-gray-600">Completed</div>
          </div>
        </div>
      </div>

      {/* Chat List */}
      <div className="flex-1 overflow-hidden">
        <div className="p-4">
          <div className="flex items-center justify-between mb-3">
            <span className="text-sm font-medium text-gray-900">
              Recent Sessions
            </span>
            <Badge variant="secondary" className="text-xs">
              {chats.length}
            </Badge>
          </div>
        </div>

        <ScrollArea className="flex-1 px-4">
          <div className="space-y-2 pb-4">
            {chats.length === 0 ? (
              <div className="text-center py-8 text-gray-500">
                <Target className="h-8 w-8 mx-auto mb-2 text-gray-400" />
                <p className="text-sm">No quiz sessions yet</p>
                <p className="text-xs">Create your first quiz to get started!</p>
              </div>
            ) : (
              chats.map((chat) => (
                <div
                  key={chat.id}
                  onClick={() => onLoadChat(chat.id)}
                  className={cn(
                    "p-3 rounded-lg cursor-pointer border transition-all duration-200 hover:shadow-sm",
                    activeChat === chat.id
                      ? "bg-purple-50 border-purple-200 shadow-sm"
                      : "hover:bg-gray-50 border-transparent"
                  )}
                >
                  <div className="flex items-start justify-between mb-2">
                    <div className="flex items-center gap-2 flex-1 min-w-0">
                      {chat.status === "completed" ? (
                        <Trophy className="h-4 w-4 text-yellow-500 flex-shrink-0" />
                      ) : (
                        <Target className="h-4 w-4 text-purple-500 flex-shrink-0" />
                      )}
                      <span className="text-sm font-medium truncate">
                        {chat.title}
                      </span>
                    </div>
                    <DropdownMenu>
                      <DropdownMenuTrigger asChild>
                        <Button
                          variant="ghost"
                          size="sm"
                          className="h-6 w-6 p-0 hover:bg-gray-200"
                          onClick={(e) => e.stopPropagation()}
                        >
                          <MoreVertical className="h-3 w-3" />
                        </Button>
                      </DropdownMenuTrigger>
                      <DropdownMenuContent align="end" className="w-32">
                        <DropdownMenuItem
                          onClick={(e) => {
                            e.stopPropagation();
                            onDeleteChat(chat.id);
                          }}
                          className="text-red-600 focus:text-red-600"
                        >
                          <Trash2 className="h-3 w-3 mr-2" />
                          Delete
                        </DropdownMenuItem>
                      </DropdownMenuContent>
                    </DropdownMenu>
                  </div>

                  <div className="space-y-2">
                    {chat.topic && (
                      <Badge
                        variant="outline"
                        className="text-xs text-purple-600 border-purple-200"
                      >
                        {chat.topic}
                      </Badge>
                    )}

                    <div className="flex items-center justify-between text-xs">
                      <div className="flex items-center gap-1 text-gray-500">
                        <Clock className="h-3 w-3" />
                        {formatTimeAgo(chat.updated_at)}
                      </div>
                      <Badge
                        variant="outline"
                        className={cn("text-xs", getStatusColor(chat.status))}
                      >
                        {getScoreDisplay(chat)}
                      </Badge>
                    </div>

                    <div className="flex items-center justify-between text-xs text-gray-500">
                      <div className="flex items-center gap-1">
                        <MessageCircle className="h-3 w-3" />
                        {chat.message_count} messages
                      </div>
                      {chat.total_questions > 0 && (
                        <span>{chat.completed_questions}/{chat.total_questions} answered</span>
                      )}
                    </div>
                  </div>
                </div>
              ))
            )}
          </div>
        </ScrollArea>
      </div>
    </div>
  );
};
