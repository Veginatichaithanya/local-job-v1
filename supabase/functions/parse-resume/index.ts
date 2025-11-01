import "https://deno.land/x/xhr@0.1.0/mod.ts";
import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2.57.4";

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

interface ParsedResumeData {
  skills: string[];
  location: {
    address: string | null;
    pincode: string | null;
  };
  previous_works: Array<{
    company_name: string;
    job_title: string;
    duration: string;
    description: string | null;
    location: string | null;
  }>;
}

serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const LOVABLE_API_KEY = Deno.env.get('LOVABLE_API_KEY');
    const SUPABASE_URL = Deno.env.get('SUPABASE_URL');
    const SUPABASE_SERVICE_ROLE_KEY = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY');

    if (!LOVABLE_API_KEY || !SUPABASE_URL || !SUPABASE_SERVICE_ROLE_KEY) {
      throw new Error('Missing required environment variables');
    }

    const supabase = createClient(SUPABASE_URL, SUPABASE_SERVICE_ROLE_KEY);

    const { resumeUrl } = await req.json();
    
    if (!resumeUrl) {
      return new Response(
        JSON.stringify({ error: 'Resume URL is required' }),
        { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    console.log('Downloading resume from:', resumeUrl);

    // Download the resume file
    const resumeResponse = await fetch(resumeUrl);
    if (!resumeResponse.ok) {
      throw new Error('Failed to download resume file');
    }

    const resumeBlob = await resumeResponse.blob();
    const resumeArrayBuffer = await resumeBlob.arrayBuffer();
    
    // Convert to base64 for document parsing
    const base64Resume = btoa(String.fromCharCode(...new Uint8Array(resumeArrayBuffer)));

    console.log('Extracting text from resume...');

    // Extract text from PDF/DOCX using a simple approach
    // For production, you might want to use a dedicated library
    let resumeText = '';
    
    // Try to extract text directly (this works for simple PDFs)
    const decoder = new TextDecoder('utf-8', { fatal: false });
    resumeText = decoder.decode(resumeArrayBuffer);
    
    // Clean up the text
    resumeText = resumeText
      .replace(/[\x00-\x08\x0B-\x0C\x0E-\x1F\x7F-\x9F]/g, ' ')
      .replace(/\s+/g, ' ')
      .trim();

    if (resumeText.length < 100) {
      throw new Error('Could not extract meaningful text from resume. Please ensure the file is a valid PDF or DOCX.');
    }

    console.log('Extracted text length:', resumeText.length);

    // Call Lovable AI to parse the resume
    const aiResponse = await fetch('https://ai.gateway.lovable.dev/v1/chat/completions', {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${LOVABLE_API_KEY}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        model: 'google/gemini-2.5-flash',
        messages: [
          {
            role: 'system',
            content: `You are a resume parser. Extract information from the resume text and structure it properly.`
          },
          {
            role: 'user',
            content: `Extract the following information from this resume:

Resume text:
${resumeText.substring(0, 10000)}

Please extract:
1. All skills (technical and soft skills)
2. Location/address information (including 6-digit pincode if present)
3. Previous work experience with company name, job title, duration, description, and location`
          }
        ],
        tools: [{
          type: 'function',
          function: {
            name: 'extract_resume_data',
            description: 'Extract structured data from resume',
            parameters: {
              type: 'object',
              properties: {
                skills: {
                  type: 'array',
                  items: { type: 'string' },
                  description: 'List of all skills found in the resume'
                },
                location: {
                  type: 'object',
                  properties: {
                    address: { 
                      type: 'string',
                      description: 'Full address or location mentioned in resume'
                    },
                    pincode: { 
                      type: 'string',
                      description: '6-digit Indian pincode if found, otherwise null'
                    }
                  }
                },
                previous_works: {
                  type: 'array',
                  items: {
                    type: 'object',
                    properties: {
                      company_name: { type: 'string' },
                      job_title: { type: 'string' },
                      duration: { 
                        type: 'string',
                        description: 'e.g., "Jan 2020 - Dec 2022" or "2 years"'
                      },
                      description: { type: 'string' },
                      location: { type: 'string' }
                    },
                    required: ['company_name', 'job_title']
                  }
                }
              },
              required: ['skills', 'location', 'previous_works']
            }
          }
        }],
        tool_choice: { type: 'function', function: { name: 'extract_resume_data' } }
      })
    });

    if (!aiResponse.ok) {
      const errorText = await aiResponse.text();
      console.error('AI Gateway error:', aiResponse.status, errorText);
      
      if (aiResponse.status === 429) {
        return new Response(
          JSON.stringify({ error: 'Rate limit exceeded. Please try again in a moment.' }),
          { status: 429, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
        );
      }
      
      if (aiResponse.status === 402) {
        return new Response(
          JSON.stringify({ error: 'AI service temporarily unavailable. Please try again later.' }),
          { status: 402, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
        );
      }
      
      throw new Error('Failed to parse resume with AI');
    }

    const aiData = await aiResponse.json();
    console.log('AI response:', JSON.stringify(aiData, null, 2));

    // Extract the parsed data from AI response
    const toolCall = aiData.choices?.[0]?.message?.tool_calls?.[0];
    if (!toolCall) {
      throw new Error('No structured data returned from AI');
    }

    const parsedData: ParsedResumeData = JSON.parse(toolCall.function.arguments);

    console.log('Successfully parsed resume:', {
      skillsCount: parsedData.skills.length,
      worksCount: parsedData.previous_works.length,
      hasLocation: !!parsedData.location.address
    });

    return new Response(
      JSON.stringify(parsedData),
      { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );

  } catch (error) {
    console.error('Error in parse-resume function:', error);
    return new Response(
      JSON.stringify({ 
        error: error instanceof Error ? error.message : 'Failed to parse resume'
      }),
      { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );
  }
});
