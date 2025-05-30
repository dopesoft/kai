import {
  AIInput,
  AIInputButton,
  AIInputModelSelect,
  AIInputModelSelectContent,
  AIInputModelSelectItem,
  AIInputModelSelectTrigger,
  AIInputModelSelectValue,
  AIInputSubmit,
  AIInputTextarea,
  AIInputToolbar,
  AIInputTools,
} from "@/components/ui/ai-input";
import { Mic, Paperclip, Send } from "lucide-react";
import { type FormEventHandler, useState } from "react";

interface ChatInputProps {
  onSendMessage: (message: string) => void;
  isLoading: boolean;
}

export function ChatInput({ onSendMessage, isLoading }: ChatInputProps) {
  const [model, setModel] = useState<string>("1k");

  const handleSubmit: FormEventHandler<HTMLFormElement> = (event) => {
    event.preventDefault();
    const formData = new FormData(event.currentTarget);
    const message = formData.get("message") as string;
    if (message?.trim()) {
      onSendMessage(message.trim());
      event.currentTarget.reset();
    }
  };

  return (
    <footer className="bg-white dark:bg-black p-4 md:p-4 relative z-20">
      <div className="w-full max-w-4xl mx-auto px-2 sm:px-0">
        <AIInput onSubmit={handleSubmit} className="border border-gray-300 dark:border-gray-600 rounded-lg shadow-sm">
          <AIInputTextarea 
            placeholder="Type a message..." 
            disabled={isLoading}
            className="text-sm sm:text-base font-medium dark:text-white dark:placeholder-white border-none resize-none"
          />
          <AIInputToolbar className="gap-1">
            <AIInputTools className="gap-1">
              <AIInputButton disabled={isLoading} className="h-8 w-8 sm:h-9 sm:w-9 dark:text-white dark:hover:bg-[#435058]">
                <Paperclip size={14} className="sm:size-4" />
              </AIInputButton>
              <AIInputButton disabled={isLoading} className="h-8 w-8 sm:h-9 sm:w-9 dark:text-white dark:hover:bg-[#435058]">
                <Mic size={14} className="sm:size-4" />
              </AIInputButton>
              <AIInputModelSelect value={model} onValueChange={setModel}>
                <AIInputModelSelectTrigger className="h-8 sm:h-9 text-xs sm:text-sm w-12 sm:w-auto min-w-[48px] px-2 dark:text-white dark:border-white">
                  <AIInputModelSelectValue />
                </AIInputModelSelectTrigger>
                <AIInputModelSelectContent className="dark:bg-black dark:border-white">
                  <AIInputModelSelectItem value="1k" className="dark:text-white dark:hover:bg-[#435058]">
                    1k
                  </AIInputModelSelectItem>
                </AIInputModelSelectContent>
              </AIInputModelSelect>
            </AIInputTools>
            <AIInputSubmit disabled={isLoading} className="h-8 w-8 sm:h-9 sm:w-9 dark:text-white dark:hover:bg-[#435058]">
              <Send size={14} className="sm:size-4" />
            </AIInputSubmit>
          </AIInputToolbar>
        </AIInput>
      </div>
    </footer>
  );
}
