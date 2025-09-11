import { useState } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import { useAuth, type UserRole } from '@/hooks/useAuth';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Users, Building2, ArrowLeft } from 'lucide-react';

const RoleSelection = () => {
  const navigate = useNavigate();
  const { user } = useAuth();
  const [selectedRole, setSelectedRole] = useState<UserRole | null>(null);

  // If user is already authenticated, redirect to home
  if (user) {
    navigate('/');
    return null;
  }

  const handleRoleSelect = (role: UserRole) => {
    setSelectedRole(role);
  };

  const handleContinue = () => {
    if (selectedRole) {
      navigate(`/login/${selectedRole === 'job_provider' ? 'job-provider' : selectedRole}`);
    }
  };

  const roles = [
    {
      key: 'worker' as UserRole,
      title: 'Worker',
      description: 'Looking for jobs based on your skills and location',
      icon: Users,
    },
    {
      key: 'job_provider' as UserRole,
      title: 'Job Provider', 
      description: 'Post jobs with location & skill requirements',
      icon: Building2,
    },
  ];

  return (
    <div className="min-h-screen bg-background flex items-center justify-center p-4">
      <div className="w-full max-w-md space-y-6">
        <Link 
          to="/" 
          className="inline-flex items-center text-sm text-muted-foreground hover:text-foreground transition-colors"
        >
          <ArrowLeft className="w-4 h-4 mr-2" />
          Back to home
        </Link>

        <Card>
          <CardHeader className="text-center">
            <CardTitle className="text-2xl font-bold">Choose Your Role</CardTitle>
            <CardDescription>
              Select how you'll be using the platform to continue
            </CardDescription>
          </CardHeader>

          <CardContent className="space-y-4">
            <div className="grid gap-3">
              {roles.map((role) => {
                const Icon = role.icon;
                return (
                  <div
                    key={role.key}
                    className={`p-4 border rounded-lg cursor-pointer transition-colors hover:border-primary/50 hover:bg-primary/5 ${
                      selectedRole === role.key ? 'border-primary bg-primary/10' : ''
                    }`}
                    onClick={() => handleRoleSelect(role.key)}
                  >
                    <div className="flex items-center gap-3">
                      <Icon className="w-6 h-6 text-primary" />
                      <div className="flex-1">
                        <h3 className="font-semibold text-lg">{role.title}</h3>
                        <p className="text-sm text-muted-foreground">
                          {role.description}
                        </p>
                      </div>
                    </div>
                  </div>
                );
              })}
            </div>

            {selectedRole && (
              <div className="pt-4">
                <Button 
                  onClick={handleContinue}
                  className="w-full"
                  size="lg"
                >
                  Continue as {selectedRole === 'job_provider' ? 'Job Provider' : 'Worker'}
                </Button>
              </div>
            )}
          </CardContent>
        </Card>
      </div>
    </div>
  );
};

export default RoleSelection;