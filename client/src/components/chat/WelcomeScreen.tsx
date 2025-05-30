import { Button } from "@/components/ui/button";
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

interface WelcomeScreenProps {
  onSendMessage: (message: string) => void;
  isLoading: boolean;
}

export function WelcomeScreen({ onSendMessage, isLoading }: WelcomeScreenProps) {
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
    <div className="flex-1 flex flex-col items-center justify-center px-4 py-8" style={{ paddingTop: '300px' }}>
      <div className="max-w-4xl w-full text-center space-y-8">
        
        {/* Header */}
        <div className="mb-6">
          <h1 className="text-6xl md:text-7xl lg:text-8xl font-black tracking-tight text-black dark:text-white">
            Conquer
          </h1>
        </div>

        {/* AI Input */}
        <div className="w-full max-w-3xl mx-auto px-2 sm:px-4 relative z-10">
          <AIInput onSubmit={handleSubmit} className="border border-gray-300 dark:border-gray-600 rounded-lg shadow-[0_0_0_1px_rgba(67,80,88,0.15)] dark:shadow-[0_0_0_1px_rgba(67,80,88,0.3)] hover:shadow-[0_0_0_2px_rgba(67,80,88,0.25)] dark:hover:shadow-[0_0_0_2px_rgba(67,80,88,0.4)] transition-all duration-300">
            <AIInputTextarea 
              placeholder="Ask anything" 
              disabled={isLoading}
              className="text-sm sm:text-base dark:text-white dark:placeholder-white border-none resize-none"
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


      </div>
    </div>
  );
}