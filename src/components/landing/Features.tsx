import { MapPin, Target, Clock, Users, TrendingUp, Shield } from "lucide-react";
import gpsMatchingImage from "@/assets/gps-matching.jpg";
import jobMatchImage from "@/assets/job-match.jpg";

const Features = () => {
  const features = [
    {
      icon: MapPin,
      title: "GPS-Based Job Discovery",
      description: "Find work opportunities within your immediate area using precise location matching.",
    },
    {
      icon: Target,
      title: "Skill-Based Matching",
      description: "Connect with jobs that match your specific skills and experience level.",
    },
    {
      icon: Clock,
      title: "Real-Time Notifications",
      description: "Get instant alerts when new jobs matching your profile become available.",
    },
    {
      icon: Users,
      title: "Verified Employers",
      description: "Work with trusted local businesses and employers in your community.",
    },
    {
      icon: TrendingUp,
      title: "Increase Income",
      description: "Access more job opportunities to boost your earning potential.",
    },
    {
      icon: Shield,
      title: "Secure Platform",
      description: "Safe and reliable platform protecting both workers and employers.",
    },
  ];

  return (
    <section id="features" className="py-20 bg-background">
      <div className="container mx-auto px-4">
        {/* Header */}
        <div className="text-center max-w-3xl mx-auto mb-16">
          <h2 className="text-3xl md:text-4xl font-bold text-foreground mb-4">
            Bridging the Gap in Local Employment
          </h2>
          <p className="text-xl text-muted-foreground">
            LocalJobs addresses challenges in informal job markets by providing efficient, 
            location-based job searching that reduces underemployment and increases opportunities.
          </p>
        </div>

        {/* Feature Grid */}
        <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-8 mb-20">
          {features.map((feature, index) => (
            <div key={index} className="group">
              <div className="bg-card rounded-xl p-6 shadow-soft hover:shadow-medium transition-smooth border">
                <div className="flex items-center gap-4 mb-4">
                  <div className="p-3 bg-accent rounded-lg group-hover:bg-primary group-hover:text-primary-foreground transition-smooth">
                    <feature.icon className="h-6 w-6" />
                  </div>
                  <h3 className="text-xl font-semibold text-foreground">{feature.title}</h3>
                </div>
                <p className="text-muted-foreground leading-relaxed">{feature.description}</p>
              </div>
            </div>
          ))}
        </div>

        {/* Feature Showcase */}
        <div className="grid lg:grid-cols-2 gap-12 items-center">
          <div className="space-y-8">
            <div>
              <h3 className="text-2xl md:text-3xl font-bold text-foreground mb-4">
                Smart Matching Technology
              </h3>
              <p className="text-lg text-muted-foreground mb-6">
                Our advanced algorithm considers location proximity, skill requirements, 
                and availability to ensure perfect job matches for both workers and employers.
              </p>
            </div>
            
            <div className="space-y-4">
              <div className="flex items-start gap-4">
                <div className="p-2 bg-primary/10 rounded-lg mt-1">
                  <MapPin className="h-5 w-5 text-primary" />
                </div>
                <div>
                  <h4 className="font-semibold text-foreground mb-1">Location Intelligence</h4>
                  <p className="text-muted-foreground">GPS technology finds the closest opportunities</p>
                </div>
              </div>
              
              <div className="flex items-start gap-4">
                <div className="p-2 bg-success/10 rounded-lg mt-1">
                  <Target className="h-5 w-5 text-success" />
                </div>
                <div>
                  <h4 className="font-semibold text-foreground mb-1">Skill Assessment</h4>
                  <p className="text-muted-foreground">Match your expertise with job requirements</p>
                </div>
              </div>
            </div>
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-4">
              <img 
                src={gpsMatchingImage} 
                alt="GPS-based job matching technology"
                className="w-full rounded-xl shadow-medium"
              />
            </div>
            <div className="space-y-4 pt-8">
              <img 
                src={jobMatchImage} 
                alt="Workers connecting with local employers"
                className="w-full rounded-xl shadow-medium"
              />
            </div>
          </div>
        </div>
      </div>
    </section>
  );
};

export default Features;