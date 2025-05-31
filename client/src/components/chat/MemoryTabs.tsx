import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";

export function MemoryTabs() {
  return (
    <Tabs defaultValue="short-term" className="w-full flex-grow flex flex-col p-4">
      <TabsList className="grid w-full grid-cols-2">
        <TabsTrigger value="short-term">Short-Term Memory</TabsTrigger>
        <TabsTrigger value="long-term">Long-Term Memory</TabsTrigger>
      </TabsList>
      <TabsContent value="short-term" className="flex-grow mt-4">
        <div className="h-full p-4 border rounded-md bg-background">
          <p className="text-sm text-muted-foreground">
            Short-term memory content will appear here. This could include recent interactions or context.
          </p>
          {/* Placeholder for short-term memory content */}
        </div>
      </TabsContent>
      <TabsContent value="long-term" className="flex-grow mt-4">
        <div className="h-full p-4 border rounded-md bg-background">
          <p className="text-sm text-muted-foreground">
            Long-term memory content will appear here. This might involve summaries or key information from past conversations.
          </p>
          {/* Placeholder for long-term memory content */}
        </div>
      </TabsContent>
    </Tabs>
  );
} 