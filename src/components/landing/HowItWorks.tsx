import { UserPlus, Search, MessageCircle, CheckCircle } from "lucide-react";

const HowItWorks = () => {
  const steps = [
    {
      icon: UserPlus,
      title: "Create Your Profile",
      description: "Sign up and add your skills, experience, and location preferences.",
      color: "text-blue-600",
      bgColor: "bg-blue-50",
    },
    {
      icon: Search,
      title: "Discover Jobs",
      description: "Browse nearby opportunities that match your skills and availability.",
      color: "text-green-600", 
      bgColor: "bg-green-50",
    },
    {
      icon: MessageCircle,
      title: "Connect & Apply",
      description: "Message employers directly and apply for jobs with one click.",
      color: "text-purple-600",
      bgColor: "bg-purple-50",
    },
    {
      icon: CheckCircle,
      title: "Start Working",
      description: "Get hired and start earning with verified local employers.",
      color: "text-orange-600",
      bgColor: "bg-orange-50",
    },
  ];

  return (
    <section id="how-it-works" className="py-20 bg-muted/30">
      <div className="container mx-auto px-4">
        {/* Header */}
        <div className="text-center max-w-3xl mx-auto mb-16">
          <h2 className="text-3xl md:text-4xl font-bold text-foreground mb-4">
            How LocalJobs Works
          </h2>
          <p className="text-xl text-muted-foreground">
            Getting started is simple. Follow these four easy steps to connect with 
            local employment opportunities in your area.
          </p>
        </div>

        {/* Steps */}
        <div className="grid md:grid-cols-2 lg:grid-cols-4 gap-8">
          {steps.map((step, index) => (
            <div key={index} className="text-center group">
              <div className="relative mb-6">
                {/* Step Number */}
                <div className="absolute -top-3 -right-3 w-8 h-8 bg-primary text-primary-foreground rounded-full flex items-center justify-center text-sm font-bold z-10">
                  {index + 1}
                </div>
                
                {/* Icon */}
                <div className={`w-20 h-20 ${step.bgColor} rounded-2xl flex items-center justify-center mx-auto group-hover:scale-110 transition-smooth shadow-soft`}>
                  <step.icon className={`h-10 w-10 ${step.color}`} />
                </div>
              </div>

              <div className="space-y-3">
                <h3 className="text-xl font-semibold text-foreground">{step.title}</h3>
                <p className="text-muted-foreground leading-relaxed">{step.description}</p>
              </div>

              {/* Connector Line (except last item) */}
              {index < steps.length - 1 && (
                <div className="hidden lg:block absolute top-10 left-1/2 w-full h-0.5 bg-border transform translate-x-16 -translate-y-1/2 z-0"></div>
              )}
            </div>
          ))}
        </div>

        {/* CTA Section */}
        <div className="text-center mt-16">
          <div className="bg-card rounded-2xl p-8 shadow-medium border max-w-2xl mx-auto">
            <h3 className="text-2xl font-bold text-foreground mb-4">
              Ready to Transform Your Local Job Search?
            </h3>
            <p className="text-muted-foreground mb-6">
              Join thousands of workers and employers already using LocalJobs to create 
              better employment opportunities in their communities.
            </p>
            <div className="flex flex-col sm:flex-row gap-4 justify-center">
              <a href="/login/worker" className="bg-gradient-primary text-white px-8 py-3 rounded-lg font-semibold hover:shadow-medium transform hover:scale-105 transition-smooth text-center">
                Get Started as Worker
              </a>
              <a href="/login/job-provider" className="bg-secondary text-secondary-foreground px-8 py-3 rounded-lg font-semibold hover:bg-secondary/80 transition-smooth border text-center">
                Post Your First Job
              </a>
            </div>
          </div>
        </div>
      </div>
    </section>
  );
};

export default HowItWorks;