import "https://deno.land/x/xhr@0.1.0/mod.ts";
import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2.57.4";

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

interface ParsedResumeData {
  personal_info: {
    first_name: string | null;
    last_name: string | null;
    email: string | null;
    phone: string | null;
  };
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
  confidence: 'high' | 'medium' | 'low';
  extraction_metadata?: {
    text_length: number;
    text_quality: string;
    resume_keywords_found: boolean;
  };
}

// Validate extracted text quality before AI processing
function validateTextQuality(text: string): { valid: boolean; reason?: string; quality: string } {
  if (text.length < 200) {
    return { valid: false, reason: 'Text too short - file may be scanned image or corrupted', quality: 'poor' };
  }
  
  // Check for common resume indicators
  const resumeKeywords = ['experience', 'education', 'skills', 'work', 'email', 'phone', 'profile', 'summary'];
  const lowerText = text.toLowerCase();
  const foundKeywords = resumeKeywords.filter(keyword => lowerText.includes(keyword));
  
  if (foundKeywords.length < 2) {
    return { 
      valid: false, 
      reason: 'No resume keywords found - this may not be a valid resume file',
      quality: 'poor'
    };
  }
  
  // Check if it's mostly readable ASCII characters
  const readableChars = (text.match(/[a-zA-Z0-9\s@.,\-]/g) || []).length;
  const asciiRatio = readableChars / text.length;
  
  if (asciiRatio < 0.5) {
    return { 
      valid: false, 
      reason: 'Garbled text detected - PDF may be encrypted or corrupted',
      quality: 'poor'
    };
  }
  
  // Determine quality level
  let quality = 'good';
  if (text.length < 500 || foundKeywords.length < 3) {
    quality = 'fair';
  }
  if (text.length > 2000 && foundKeywords.length >= 4 && asciiRatio > 0.8) {
    quality = 'excellent';
  }
  
  return { valid: true, quality };
}

// Validate parsed data from AI
function validateParsedData(data: ParsedResumeData): { valid: boolean; warnings: string[] } {
  const warnings: string[] = [];
  
  // Check personal info
  if (!data.personal_info?.first_name && !data.personal_info?.last_name) {
    warnings.push('No name found in resume');
  }
  
  // Validate phone number format (Indian: 10 digits)
  if (data.personal_info?.phone) {
    const cleanPhone = data.personal_info.phone.replace(/\D/g, '');
    if (cleanPhone.length !== 10 || !cleanPhone.startsWith('6') && !cleanPhone.startsWith('7') && !cleanPhone.startsWith('8') && !cleanPhone.startsWith('9')) {
      warnings.push(`Invalid phone format: ${data.personal_info.phone}`);
      data.personal_info.phone = null;
    } else {
      data.personal_info.phone = cleanPhone;
    }
  }
  
  // Validate email
  if (data.personal_info?.email) {
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!emailRegex.test(data.personal_info.email)) {
      warnings.push(`Invalid email format: ${data.personal_info.email}`);
      data.personal_info.email = null;
    }
  }
  
  // Validate pincode (6 digits)
  if (data.location?.pincode) {
    const cleanPincode = data.location.pincode.replace(/\D/g, '');
    if (cleanPincode.length !== 6) {
      warnings.push(`Invalid pincode format: ${data.location.pincode}`);
      data.location.pincode = null;
    } else {
      data.location.pincode = cleanPincode;
    }
  }
  
  // Check if we have enough data
  const hasMinimumData = 
    (data.personal_info?.first_name || data.personal_info?.last_name) &&
    (data.skills?.length > 0 || data.previous_works?.length > 0);
  
  if (!hasMinimumData) {
    warnings.push('Insufficient data extracted - resume may be in unsupported format');
  }
  
  return { valid: hasMinimumData, warnings };
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
      console.error('Failed to download resume:', resumeResponse.status, resumeResponse.statusText);
      throw new Error(`Failed to download resume file: ${resumeResponse.status} ${resumeResponse.statusText}`);
    }

    const resumeBlob = await resumeResponse.blob();
    const resumeArrayBuffer = await resumeBlob.arrayBuffer();
    const uint8Array = new Uint8Array(resumeArrayBuffer);

    console.log('Extracting text from resume...');

    // Import PDF.js for proper PDF parsing
    const pdfjsLib = await import('https://esm.sh/pdfjs-dist@3.11.174/build/pdf.mjs');
    
    let resumeText = '';
    
    try {
      // Use PDF.js to properly extract text from PDF
      const loadingTask = pdfjsLib.getDocument({ data: uint8Array });
      const pdf = await loadingTask.promise;
      
      console.log(`PDF loaded successfully. Pages: ${pdf.numPages}`);
      
      // Extract text from all pages (limit to first 10 pages for performance)
      const maxPages = Math.min(pdf.numPages, 10);
      const textPromises = [];
      
      for (let i = 1; i <= maxPages; i++) {
        textPromises.push(
          pdf.getPage(i).then(async (page) => {
            const textContent = await page.getTextContent();
            return textContent.items
              .map((item: any) => item.str)
              .join(' ');
          })
        );
      }
      
      const pageTexts = await Promise.all(textPromises);
      resumeText = pageTexts.join('\n').replace(/\s+/g, ' ').trim();
      
      console.log('PDF text extraction successful');
      
    } catch (pdfError) {
      console.error('PDF.js extraction failed, trying fallback method:', pdfError);
      
      // Fallback: Try basic text extraction for text-based PDFs
      const decoder = new TextDecoder('utf-8', { fatal: false });
      const decodedText = decoder.decode(resumeArrayBuffer);
      
      // Extract text between common PDF text markers
      const textMatches = decodedText.match(/\(([^)]+)\)/g);
      if (textMatches && textMatches.length > 20) {
        resumeText = textMatches
          .map(match => match.slice(1, -1))
          .join(' ')
          .replace(/\\[nr]/g, ' ')
          .replace(/\s+/g, ' ')
          .trim();
      }
      
      // If still no text, try extracting visible ASCII
      if (resumeText.length < 100) {
        resumeText = decodedText
          .replace(/[\x00-\x08\x0B-\x0C\x0E-\x1F\x7F-\x9F]/g, ' ')
          .replace(/[^\x20-\x7E\s]/g, '')
          .replace(/\s+/g, ' ')
          .trim();
      }
    }

    console.log('Extracted text length:', resumeText.length, 'chars');
    console.log('First 500 chars of extracted text:', resumeText.substring(0, 500));

    // Validate text quality before sending to AI
    const textQuality = validateTextQuality(resumeText);
    if (!textQuality.valid) {
      console.error('Text quality check failed:', textQuality.reason);
      return new Response(
        JSON.stringify({ 
          error: textQuality.reason || 'Could not extract readable text from resume',
          suggestion: 'Please ensure your resume is a text-based PDF (not a scanned image). If needed, try converting to DOCX or plain text format.'
        }),
        { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    console.log('Text quality assessment:', textQuality.quality);

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
            content: `You are a strict resume parser. Extract ONLY information that is explicitly present in the resume.

CRITICAL RULES:
- If information is NOT found in the resume, return null - DO NOT make up or infer data
- DO NOT hallucinate names, emails, or phone numbers
- Only extract data that is clearly visible in the text
- If uncertain about any field, set it to null
- Be conservative - accuracy is more important than completeness`
          },
          {
            role: 'user',
            content: `Extract the following information from this resume text:

Resume text:
${resumeText.substring(0, 10000)}

Extract ONLY if clearly present:
1. Personal information: first name, last name, email, phone number (Indian format: 10 digits)
2. Skills (technical and soft skills) - list all mentioned
3. Location/address with 6-digit pincode
4. Previous work experience: company, job title, duration, description, location

IMPORTANT: If you cannot find a piece of information, return null for that field. Do not make assumptions.`
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
                personal_info: {
                  type: 'object',
                  properties: {
                    first_name: { 
                      type: 'string',
                      description: 'First name of the person'
                    },
                    last_name: { 
                      type: 'string',
                      description: 'Last name of the person'
                    },
                    email: { 
                      type: 'string',
                      description: 'Email address'
                    },
                    phone: { 
                      type: 'string',
                      description: 'Phone number (10 digits for Indian numbers)'
                    }
                  }
                },
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
              required: ['personal_info', 'skills', 'location', 'previous_works']
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

    // Add extraction metadata
    parsedData.extraction_metadata = {
      text_length: resumeText.length,
      text_quality: textQuality.quality,
      resume_keywords_found: true
    };

    console.log('Raw parsed data:', JSON.stringify(parsedData, null, 2));

    // Validate parsed data
    const validation = validateParsedData(parsedData);
    
    if (validation.warnings.length > 0) {
      console.warn('Validation warnings:', validation.warnings);
    }

    // Determine confidence level
    let confidence: 'high' | 'medium' | 'low' = 'high';
    
    if (!parsedData.personal_info?.first_name || !parsedData.personal_info?.last_name) {
      confidence = 'low';
      console.warn('Low confidence: Missing name information');
    } else if (parsedData.skills.length === 0 && parsedData.previous_works.length === 0) {
      confidence = 'low';
      console.warn('Low confidence: No skills or experience found');
    } else if (validation.warnings.length > 2 || textQuality.quality === 'fair') {
      confidence = 'medium';
    }

    parsedData.confidence = confidence;

    if (!validation.valid) {
      return new Response(
        JSON.stringify({ 
          error: 'Could not extract sufficient information from resume',
          warnings: validation.warnings,
          partialData: parsedData
        }),
        { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    console.log('Successfully parsed resume:', {
      hasPersonalInfo: !!parsedData.personal_info?.first_name,
      skillsCount: parsedData.skills.length,
      worksCount: parsedData.previous_works.length,
      hasLocation: !!parsedData.location.address,
      confidence: parsedData.confidence,
      warnings: validation.warnings
    });

    return new Response(
      JSON.stringify({
        ...parsedData,
        warnings: validation.warnings.length > 0 ? validation.warnings : undefined
      }),
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
