import workerLogo from "@/assets/worker-logo.png";

interface LoadingScreenProps {
  fullScreen?: boolean;
}

export const LoadingScreen = ({ fullScreen = true }: LoadingScreenProps) => {
  return (
    <div
      className={`${
        fullScreen ? "fixed inset-0 z-50" : "relative w-full h-full"
      } flex items-center justify-center bg-background`}
    >
      <div className="relative flex items-center justify-center">
        {/* Outer rotating circle */}
        <div className="absolute w-32 h-32 rounded-full border-4 border-primary/20 border-t-primary animate-spin" />
        
        {/* Middle rotating circle - slower and reverse */}
        <div className="absolute w-24 h-24 rounded-full border-4 border-accent/30 border-b-accent animate-[spin_2s_linear_infinite_reverse]" />
        
        {/* Inner pulsing circle */}
        <div className="absolute w-16 h-16 rounded-full bg-primary/10 animate-pulse" />
        
        {/* Worker logo in center */}
        <div className="relative z-10 w-20 h-20 rounded-full overflow-hidden bg-background shadow-lg animate-[scale-in_0.5s_ease-out]">
          <img
            src={workerLogo}
            alt="Loading"
            className="w-full h-full object-cover"
          />
        </div>
        
        {/* Orbiting dots */}
        <div className="absolute w-32 h-32 animate-spin">
          <div className="absolute top-0 left-1/2 w-2 h-2 -ml-1 bg-primary rounded-full" />
        </div>
        <div className="absolute w-32 h-32 animate-[spin_3s_linear_infinite]">
          <div className="absolute bottom-0 left-1/2 w-2 h-2 -ml-1 bg-accent rounded-full" />
        </div>
      </div>
      
      {/* Loading text */}
      <div className="absolute mt-40 text-center">
        <p className="text-sm text-muted-foreground animate-pulse">Loading...</p>
      </div>
    </div>
  );
};
