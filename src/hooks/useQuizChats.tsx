
import { useState, useEffect } from "react";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/hooks/useAuth";
import { toast } from "sonner";

export interface QuizChat {
  id: string;
  title: string;
  created_at: string;
  updated_at: string;
  status: string;
  topic: string | null;
  total_questions: number;
  completed_questions: number;
  score: number;
  message_count: number;
}

export interface QuizMessage {
  id: string;
  chat_id: string;
  role: "user" | "assistant";
  content: string;
  message_type: "text" | "quiz" | "result";
  quiz_data?: any;
  created_at: string;
}

export const useQuizChats = () => {
  const { user } = useAuth();
  const [chats, setChats] = useState<QuizChat[]>([]);
  const [messages, setMessages] = useState<QuizMessage[]>([]);
  const [currentChatId, setCurrentChatId] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);

  // Fetch user's quiz chats
  const fetchChats = async () => {
    if (!user) return;

    try {
      const { data, error } = await supabase.rpc("get_user_quiz_chats", {
        user_uuid: user.id,
      });

      if (error) throw error;
      setChats(data || []);
    } catch (error) {
      console.error("Error fetching quiz chats:", error);
      toast.error("Failed to load quiz history");
    }
  };

  // Fetch messages for a specific chat
  const fetchMessages = async (chatId: string) => {
    if (!user) return;

    try {
      const { data, error } = await supabase
        .from("quiz_chat_messages")
        .select("*")
        .eq("chat_id", chatId)
        .eq("user_id", user.id)
        .order("created_at", { ascending: true });

      if (error) throw error;
      
      // Type cast the data to ensure proper types
      const typedMessages: QuizMessage[] = (data || []).map((msg) => ({
        id: msg.id,
        chat_id: msg.chat_id,
        role: msg.role as "user" | "assistant",
        content: msg.content,
        message_type: msg.message_type as "text" | "quiz" | "result",
        quiz_data: msg.quiz_data,
        created_at: msg.created_at,
      }));
      
      setMessages(typedMessages);
    } catch (error) {
      console.error("Error fetching messages:", error);
      toast.error("Failed to load chat messages");
    }
  };

  // Create a new quiz chat
  const createNewChat = async (title: string = "New Quiz Session") => {
    if (!user) return null;

    try {
      const { data, error } = await supabase
        .from("quiz_chats")
        .insert({
          user_id: user.id,
          title,
          status: "active",
        })
        .select()
        .single();

      if (error) throw error;

      await fetchChats();
      setCurrentChatId(data.id);
      setMessages([]);
      
      toast.success("New quiz session created!");
      return data;
    } catch (error) {
      console.error("Error creating new chat:", error);
      toast.error("Failed to create new quiz session");
      return null;
    }
  };

  // Save a message to the current chat
  const saveMessage = async (
    role: "user" | "assistant",
    content: string,
    messageType: "text" | "quiz" | "result" = "text",
    quizData?: any
  ) => {
    if (!user || !currentChatId) return null;

    try {
      const { data, error } = await supabase
        .from("quiz_chat_messages")
        .insert({
          chat_id: currentChatId,
          user_id: user.id,
          role,
          content,
          message_type: messageType,
          quiz_data: quizData,
        })
        .select()
        .single();

      if (error) throw error;

      // Type cast the returned data
      const typedMessage: QuizMessage = {
        id: data.id,
        chat_id: data.chat_id,
        role: data.role as "user" | "assistant",
        content: data.content,
        message_type: data.message_type as "text" | "quiz" | "result",
        quiz_data: data.quiz_data,
        created_at: data.created_at,
      };

      setMessages(prev => [...prev, typedMessage]);
      return typedMessage;
    } catch (error) {
      console.error("Error saving message:", error);
      toast.error("Failed to save message");
      return null;
    }
  };

  // Update chat with quiz completion data
  const updateChatProgress = async (
    totalQuestions: number,
    completedQuestions: number,
    score: number,
    topic?: string
  ) => {
    if (!user || !currentChatId) return;

    try {
      const { error } = await supabase
        .from("quiz_chats")
        .update({
          total_questions: totalQuestions,
          completed_questions: completedQuestions,
          score,
          topic,
          status: completedQuestions >= totalQuestions ? "completed" : "active",
        })
        .eq("id", currentChatId)
        .eq("user_id", user.id);

      if (error) throw error;
      await fetchChats();
    } catch (error) {
      console.error("Error updating chat progress:", error);
    }
  };

  // Load a specific chat
  const loadChat = async (chatId: string) => {
    setCurrentChatId(chatId);
    await fetchMessages(chatId);
  };

  // Delete a chat
  const deleteChat = async (chatId: string) => {
    if (!user) return;

    try {
      const { error } = await supabase
        .from("quiz_chats")
        .delete()
        .eq("id", chatId)
        .eq("user_id", user.id);

      if (error) throw error;

      await fetchChats();
      if (currentChatId === chatId) {
        setCurrentChatId(null);
        setMessages([]);
      }
      
      toast.success("Quiz session deleted");
    } catch (error) {
      console.error("Error deleting chat:", error);
      toast.error("Failed to delete quiz session");
    }
  };

  useEffect(() => {
    if (user) {
      fetchChats();
    }
  }, [user]);

  return {
    chats,
    messages,
    currentChatId,
    loading,
    createNewChat,
    saveMessage,
    updateChatProgress,
    loadChat,
    deleteChat,
    fetchChats,
    setLoading,
  };
};
