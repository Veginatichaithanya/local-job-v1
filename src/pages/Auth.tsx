import { useState, useEffect } from 'react';
import { useNavigate, useLocation, Link } from 'react-router-dom';
import { useAuth } from '@/hooks/useAuth';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Users, Building2, ArrowLeft } from 'lucide-react';
import { LoadingScreen } from '@/components/LoadingScreen';

const Auth = () => {
  const navigate = useNavigate();
  const location = useLocation();
  const { signIn, signUp, user, profile } = useAuth();
  const [isLoading, setIsLoading] = useState(false);

  // Sign in form state
  const [signInEmail, setSignInEmail] = useState('');
  const [signInPassword, setSignInPassword] = useState('');

  // Sign up form state
  const [signUpEmail, setSignUpEmail] = useState('');
  const [signUpPassword, setSignUpPassword] = useState('');
  const [firstName, setFirstName] = useState('');
  const [lastName, setLastName] = useState('');
  const [companyName, setCompanyName] = useState('');

  // Get role from URL path
  const getRoleFromPath = () => {
    if (location.pathname === '/login/worker') return 'worker';
    if (location.pathname === '/login/job-provider') return 'job_provider';
    return null;
  };

  const currentRole = getRoleFromPath();

  // Redirect based on user state
  useEffect(() => {
    if (user && profile?.role) {
      // Redirect based on role
      if (profile.role === 'worker') {
        navigate('/worker/dashboard');
      } else if (profile.role === 'job_provider') {
        navigate('/job-provider/dashboard');
      } else {
        navigate('/');
      }
    }
  }, [user, profile, navigate]);

  const handleSignIn = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsLoading(true);
    
    // Show loading for minimum time
    const minLoadingTime = new Promise(resolve => setTimeout(resolve, 2000));
    
    // Pass the expected role for validation
    const signInPromise = signIn(signInEmail, signInPassword, currentRole || undefined);
    
    await Promise.all([minLoadingTime, signInPromise]);
    
    setIsLoading(false);
  };

  const handleSignUp = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsLoading(true);
    
    const signUpData: any = {
      firstName,
      lastName,
    };

    // Set role and company name for job providers
    if (currentRole) {
      signUpData.role = currentRole;
      if (currentRole === 'job_provider' && companyName) {
        signUpData.company_name = companyName;
      }
    }
    
    // Show loading for minimum time
    const minLoadingTime = new Promise(resolve => setTimeout(resolve, 2000));
    
    const signUpPromise = signUp(signUpEmail, signUpPassword, signUpData);
    
    await Promise.all([minLoadingTime, signUpPromise]);
    
    setIsLoading(false);
  };

  if (isLoading) {
    return <LoadingScreen fullScreen={false} />;
  }

  const getRoleDisplay = () => {
    if (currentRole === 'worker') return { title: 'Worker', icon: Users };
    if (currentRole === 'job_provider') return { title: 'Job Provider', icon: Building2 };
    return null;
  };

  const roleDisplay = getRoleDisplay();

  return (
    <div className="min-h-screen bg-background flex items-center justify-center p-4">
      <div className="w-full max-w-md space-y-6">
        <Link 
          to="/role-selection" 
          className="inline-flex items-center text-sm text-muted-foreground hover:text-foreground transition-colors"
        >
          <ArrowLeft className="w-4 h-4 mr-2" />
          Back to role selection
        </Link>

        <Card>
          <CardHeader className="text-center">
            {roleDisplay && (
              <div className="flex items-center justify-center gap-2 mb-2">
                <roleDisplay.icon className="w-5 h-5 text-primary" />
                <span className="text-sm text-muted-foreground">Signing in as {roleDisplay.title}</span>
              </div>
            )}
            <CardTitle className="text-2xl font-bold">Welcome</CardTitle>
            <CardDescription>
              Sign in to your account or create a new one
            </CardDescription>
          </CardHeader>

          <CardContent>
            <Tabs defaultValue="signin" className="w-full">
              <TabsList className="grid w-full grid-cols-2">
                <TabsTrigger value="signin">Sign In</TabsTrigger>
                <TabsTrigger value="signup">Sign Up</TabsTrigger>
              </TabsList>

              <TabsContent value="signin" className="space-y-4">
                <form onSubmit={handleSignIn} className="space-y-4">
                  <div className="space-y-2">
                    <Label htmlFor="signin-email">Email</Label>
                    <Input
                      id="signin-email"
                      type="email"
                      placeholder="Enter your email"
                      value={signInEmail}
                      onChange={(e) => setSignInEmail(e.target.value)}
                      required
                    />
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="signin-password">Password</Label>
                    <Input
                      id="signin-password"
                      type="password"
                      placeholder="Enter your password"
                      value={signInPassword}
                      onChange={(e) => setSignInPassword(e.target.value)}
                      required
                    />
                  </div>
                  <Button type="submit" className="w-full" disabled={isLoading}>
                    {isLoading ? 'Signing in...' : 'Sign In'}
                  </Button>
                </form>
              </TabsContent>

              <TabsContent value="signup" className="space-y-4">
                <form onSubmit={handleSignUp} className="space-y-4">
                  <div className="grid grid-cols-2 gap-4">
                    <div className="space-y-2">
                      <Label htmlFor="first-name">First Name</Label>
                      <Input
                        id="first-name"
                        placeholder="First name"
                        value={firstName}
                        onChange={(e) => setFirstName(e.target.value)}
                        required
                      />
                    </div>
                    <div className="space-y-2">
                      <Label htmlFor="last-name">Last Name</Label>
                      <Input
                        id="last-name"
                        placeholder="Last name"
                        value={lastName}
                        onChange={(e) => setLastName(e.target.value)}
                        required
                      />
                    </div>
                  </div>

                  <div className="space-y-2">
                    <Label htmlFor="signup-email">Email</Label>
                    <Input
                      id="signup-email"
                      type="email"
                      placeholder="Enter your email"
                      value={signUpEmail}
                      onChange={(e) => setSignUpEmail(e.target.value)}
                      required
                    />
                  </div>

                  <div className="space-y-2">
                    <Label htmlFor="signup-password">Password</Label>
                    <Input
                      id="signup-password"
                      type="password"
                      placeholder="Create a password (min 6 characters)"
                      value={signUpPassword}
                      onChange={(e) => setSignUpPassword(e.target.value)}
                      minLength={6}
                      required
                    />
                  </div>


                  {currentRole === 'job_provider' && (
                    <div className="space-y-2">
                      <Label htmlFor="company-name">Company Name</Label>
                      <Input
                        id="company-name"
                        placeholder="Enter your company name"
                        value={companyName}
                        onChange={(e) => setCompanyName(e.target.value)}
                        required
                      />
                    </div>
                  )}

                  <Button 
                    type="submit" 
                    className="w-full" 
                    disabled={isLoading || (currentRole === 'job_provider' && !companyName)}
                  >
                    {isLoading ? 'Creating account...' : 'Create Account'}
                  </Button>
                </form>
              </TabsContent>
            </Tabs>
          </CardContent>
        </Card>
      </div>
    </div>
  );
};

export default Auth;