import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2.57.4";

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

interface Job {
  id: string;
  title: string;
  latitude: number;
  longitude: number;
  wage: number;
  location: string;
}

interface Worker {
  user_id: string;
  latitude: number;
  longitude: number;
  notification_preferences: {
    job_alerts: boolean;
    location_radius_km: number;
  };
}

function calculateDistance(lat1: number, lon1: number, lat2: number, lon2: number): number {
  const R = 6371; // Earth's radius in km
  const dLat = (lat2 - lat1) * Math.PI / 180;
  const dLon = (lon2 - lon1) * Math.PI / 180;
  const a = 
    Math.sin(dLat/2) * Math.sin(dLat/2) +
    Math.cos(lat1 * Math.PI / 180) * Math.cos(lat2 * Math.PI / 180) *
    Math.sin(dLon/2) * Math.sin(dLon/2);
  const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1-a));
  return R * c;
}

serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const supabaseUrl = Deno.env.get('SUPABASE_URL')!;
    const supabaseServiceKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!;
    const supabase = createClient(supabaseUrl, supabaseServiceKey);

    const { jobId } = await req.json();

    if (!jobId) {
      return new Response(
        JSON.stringify({ error: 'Job ID is required' }),
        { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    // Fetch job details
    const { data: job, error: jobError } = await supabase
      .from('jobs')
      .select('*')
      .eq('id', jobId)
      .single();

    if (jobError || !job) {
      console.error('Error fetching job:', jobError);
      return new Response(
        JSON.stringify({ error: 'Job not found' }),
        { status: 404, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    if (!job.latitude || !job.longitude) {
      return new Response(
        JSON.stringify({ message: 'Job has no location data, skipping notifications' }),
        { status: 200, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    // Fetch all workers with location data and profile completion >= 75%
    const { data: workers, error: workersError } = await supabase
      .from('profiles')
      .select('user_id, latitude, longitude, notification_preferences, profile_completion_percentage')
      .eq('role', 'worker')
      .gte('profile_completion_percentage', 75)
      .not('latitude', 'is', null)
      .not('longitude', 'is', null);

    if (workersError) {
      console.error('Error fetching workers:', workersError);
      return new Response(
        JSON.stringify({ error: 'Failed to fetch workers' }),
        { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    // Find workers within radius and create notifications
    const notifications = [];
    for (const worker of workers || []) {
      const distance = calculateDistance(
        job.latitude,
        job.longitude,
        worker.latitude,
        worker.longitude
      );

      const radiusKm = worker.notification_preferences?.location_radius_km || 10;
      const jobAlerts = worker.notification_preferences?.job_alerts ?? true;

      if (jobAlerts && distance <= radiusKm) {
        notifications.push({
          user_id: worker.user_id,
          job_id: jobId,
          title: 'New Job Nearby!',
          message: `${job.title} - ₹${job.wage}/day - ${distance.toFixed(1)}km away`,
          type: 'job_alert',
          metadata: {
            distance_km: distance,
            job_location: job.location,
          },
        });
      }
    }

    // Bulk insert notifications
    if (notifications.length > 0) {
      const { error: notifError } = await supabase
        .from('notifications')
        .insert(notifications);

      if (notifError) {
        console.error('Error creating notifications:', notifError);
        return new Response(
          JSON.stringify({ error: 'Failed to create notifications' }),
          { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
        );
      }
    }

    return new Response(
      JSON.stringify({ 
        success: true, 
        notified_workers: notifications.length,
        message: `Notified ${notifications.length} workers within range`
      }),
      { status: 200, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );

  } catch (error) {
    console.error('Error in notify-nearby-workers function:', error);
    return new Response(
      JSON.stringify({ error: error.message }),
      { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );
  }
});