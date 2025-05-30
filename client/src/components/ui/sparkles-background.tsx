import { SparklesCore } from "./sparkles";
import { useTheme } from "@/lib/theme";
import { memo } from "react";

export const SparklesBackground = memo(function SparklesBackground() {
  const { theme } = useTheme();
  
  return (
    <div className="fixed inset-0 w-full h-full overflow-hidden z-0 pointer-events-none">
      <SparklesCore
        id="sparkles-background"
        background="transparent"
        minSize={0.6}
        maxSize={1.4}
        particleDensity={333}
        className="w-full h-full"
        particleColor={theme === "dark" ? "rgba(255, 255, 255, 0.85)" : "#6366f1"}
        speed={1}
      />
    </div>
  );
});