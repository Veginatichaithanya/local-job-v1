import { Button } from "@/components/ui/button";
import { MapPin, Users, Clock } from "lucide-react";
import heroImage from "@/assets/hero-image.jpg";
const Hero = () => {
  return <section id="home" className="relative min-h-screen bg-gradient-subtle flex items-center justify-center overflow-hidden pt-16">
      <div className="container mx-auto px-4 py-20">
        <div className="grid lg:grid-cols-2 gap-12 items-center">
          {/* Content */}
          <div className="text-center lg:text-left space-y-8">
            <div className="space-y-4">
              <h1 className="text-4xl md:text-5xl lg:text-6xl font-bold text-foreground leading-tight">
                Connect Local Workers with{" "}
                <span className="text-primary">Opportunities</span>
              </h1>
              <p className="text-xl text-muted-foreground max-w-2xl mx-auto lg:mx-0">
                LocalJobs uses GPS and skill-based matching to connect daily-wage workers 
                with nearby job providers in real-time. Transform your local employment landscape.
              </p>
            </div>

            {/* Key Stats */}
            <div className="flex flex-col sm:flex-row gap-6 justify-center lg:justify-start">
              <div className="flex items-center gap-2 text-muted-foreground">
                <MapPin className="h-5 w-5 text-primary" />
                <span>GPS-Based Matching</span>
              </div>
              <div className="flex items-center gap-2 text-muted-foreground">
                <Users className="h-5 w-5 text-success" />
                <span>Skill-Based Connections</span>
              </div>
              <div className="flex items-center gap-2 text-muted-foreground">
                <Clock className="h-5 w-5 text-primary" />
                <span>Real-Time Updates</span>
              </div>
            </div>

            {/* CTA Buttons */}
            <div className="flex flex-col sm:flex-row gap-4 justify-center lg:justify-start">
              <Button variant="hero" size="xl">
                Find Work Near You
              </Button>
              <Button variant="outline" size="xl">
                Post a Job
              </Button>
            </div>
          </div>

          {/* Hero Image */}
          <div className="relative">
            <div className="relative rounded-2xl overflow-hidden shadow-large">
              <img src={heroImage} alt="Local workers connecting with job opportunities through LocalJobs platform" className="w-full h-auto object-cover" />
            </div>
            
            {/* Floating Elements */}
            <div className="absolute -top-4 -right-4 bg-card rounded-lg shadow-medium p-4 border">
              <div className="flex items-center gap-2">
                <div className="w-3 h-3 bg-success rounded-full animate-pulse"></div>
                <span className="text-sm font-medium">Live Jobs Available</span>
              </div>
            </div>
            
            
          </div>
        </div>
      </div>
    </section>;
};
export default Hero;