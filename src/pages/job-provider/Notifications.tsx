import { useEffect, useState } from "react";
import { useAuth } from "@/hooks/useAuth";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Bell, CheckCircle } from "lucide-react";

// Simple notification mock for job providers
interface MockNotification {
  id: string;
  title: string;
  message: string;
  type: 'application' | 'system' | 'job_update';
  read: boolean;
  created_at: string;
}

export default function Notifications() {
  const { user } = useAuth();
  const [notifications, setNotifications] = useState<MockNotification[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    // Mock notifications for demonstration
    // In a real app, you would fetch from a notifications table
    const mockNotifications: MockNotification[] = [
      {
        id: "1",
        title: "New Job Application",
        message: "You have received a new application for your Construction Worker position.",
        type: "application",
        read: false,
        created_at: new Date().toISOString(),
      },
      {
        id: "2", 
        title: "Job Posted Successfully",
        message: "Your Construction Worker job has been posted and is now visible to workers.",
        type: "system",
        read: true,
        created_at: new Date(Date.now() - 24 * 60 * 60 * 1000).toISOString(),
      },
      {
        id: "3",
        title: "Application Status Update", 
        message: "A worker has withdrawn their application for your Plumber position.",
        type: "job_update",
        read: false,
        created_at: new Date(Date.now() - 2 * 24 * 60 * 60 * 1000).toISOString(),
      },
    ];

    setNotifications(mockNotifications);
    setLoading(false);
  }, [user]);

  const markAsRead = (notificationId: string) => {
    setNotifications(notifications.map(notification =>
      notification.id === notificationId 
        ? { ...notification, read: true }
        : notification
    ));
  };

  const markAllAsRead = () => {
    setNotifications(notifications.map(notification => ({ ...notification, read: true })));
  };

  const getNotificationIcon = (type: string) => {
    switch (type) {
      case 'application':
        return <Bell className="w-5 h-5 text-blue-600" />;
      case 'system':
        return <CheckCircle className="w-5 h-5 text-green-600" />;
      case 'job_update':
        return <Bell className="w-5 h-5 text-orange-600" />;
      default:
        return <Bell className="w-5 h-5 text-gray-600" />;
    }
  };

  const getNotificationBadge = (type: string) => {
    switch (type) {
      case 'application':
        return <Badge variant="secondary" className="bg-blue-100 text-blue-800">Application</Badge>;
      case 'system':
        return <Badge variant="secondary" className="bg-green-100 text-green-800">System</Badge>;
      case 'job_update':
        return <Badge variant="secondary" className="bg-orange-100 text-orange-800">Job Update</Badge>;
      default:
        return <Badge variant="secondary">General</Badge>;
    }
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary"></div>
      </div>
    );
  }

  const unreadCount = notifications.filter(n => !n.read).length;

  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center">
        <div>
          <h1 className="text-3xl font-bold">Notifications</h1>
          <p className="text-muted-foreground">
            {unreadCount > 0 ? `You have ${unreadCount} unread notification${unreadCount > 1 ? 's' : ''}` : 'All notifications read'}
          </p>
        </div>
        {unreadCount > 0 && (
          <button
            onClick={markAllAsRead}
            className="text-sm text-primary hover:underline"
          >
            Mark all as read
          </button>
        )}
      </div>

      {notifications.length === 0 ? (
        <Card>
          <CardContent className="text-center py-12">
            <Bell className="w-12 h-12 text-muted-foreground mx-auto mb-4" />
            <p className="text-muted-foreground">No notifications yet.</p>
          </CardContent>
        </Card>
      ) : (
        <div className="space-y-4">
          {notifications.map((notification) => (
            <Card 
              key={notification.id} 
              className={`cursor-pointer transition-colors ${
                notification.read ? 'bg-background' : 'bg-blue-50 dark:bg-blue-950/20'
              }`}
              onClick={() => markAsRead(notification.id)}
            >
              <CardHeader className="pb-3">
                <div className="flex items-start justify-between">
                  <div className="flex items-start space-x-3">
                    {getNotificationIcon(notification.type)}
                    <div className="flex-1">
                      <div className="flex items-center space-x-2 mb-1">
                        <CardTitle className="text-lg">{notification.title}</CardTitle>
                        {!notification.read && (
                          <div className="w-2 h-2 bg-blue-600 rounded-full"></div>
                        )}
                      </div>
                      <p className="text-muted-foreground text-sm">{notification.message}</p>
                    </div>
                  </div>
                  <div className="flex flex-col items-end space-y-2">
                    {getNotificationBadge(notification.type)}
                    <span className="text-xs text-muted-foreground">
                      {new Date(notification.created_at).toLocaleDateString()}
                    </span>
                  </div>
                </div>
              </CardHeader>
            </Card>
          ))}
        </div>
      )}
    </div>
  );
}