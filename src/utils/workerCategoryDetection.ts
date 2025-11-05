import { WORKER_CATEGORIES } from "@/pages/worker/WorkerProfile";

interface ParsedResumeData {
  skills?: string[];
  previous_works?: Array<{
    job_title: string;
    company_name: string;
  }>;
}

export const detectWorkerCategory = (parsedData: ParsedResumeData): string | null => {
  const allText = [
    ...(parsedData.skills || []),
    ...(parsedData.previous_works?.map(w => `${w.job_title} ${w.company_name}`) || [])
  ].join(' ').toLowerCase();

  // Category keyword mappings
  const categoryKeywords: Record<string, string[]> = {
    driver: ['driver', 'driving', 'transport', 'vehicle', 'delivery', 'cab', 'taxi', 'logistics'],
    carpenter: ['carpenter', 'carpentry', 'woodwork', 'furniture', 'wood', 'joinery'],
    electrician: ['electrician', 'electrical', 'wiring', 'circuit', 'electric', 'voltage'],
    plumber: ['plumber', 'plumbing', 'pipe', 'drainage', 'sanitary', 'water supply'],
    mason: ['mason', 'masonry', 'bricklayer', 'construction', 'cement', 'brick'],
    painter: ['painter', 'painting', 'wall paint', 'spray paint', 'decorator'],
    welder: ['welder', 'welding', 'fabrication', 'metal work', 'arc welding'],
    mechanic: ['mechanic', 'mechanical', 'auto', 'automobile', 'vehicle repair', 'engine'],
    cleaner: ['cleaner', 'cleaning', 'housekeeping', 'janitor', 'sanitation'],
    gardener: ['gardener', 'gardening', 'landscaping', 'horticulture', 'lawn'],
    security: ['security', 'guard', 'watchman', 'surveillance', 'protection'],
    cook: ['cook', 'chef', 'kitchen', 'culinary', 'food preparation', 'catering'],
    tailor: ['tailor', 'sewing', 'stitching', 'garment', 'alterations', 'dressmaking'],
    helper: ['helper', 'assistant', 'labor', 'general work', 'support staff'],
    other: []
  };

  // Score each category
  const categoryScores: Record<string, number> = {};
  
  for (const [category, keywords] of Object.entries(categoryKeywords)) {
    let score = 0;
    for (const keyword of keywords) {
      if (allText.includes(keyword)) {
        score++;
      }
    }
    if (score > 0) {
      categoryScores[category] = score;
    }
  }

  // Find category with highest score
  if (Object.keys(categoryScores).length === 0) {
    return null;
  }

  const detectedCategory = Object.entries(categoryScores)
    .sort((a, b) => b[1] - a[1])[0][0];

  // Verify the category exists in WORKER_CATEGORIES
  const validCategory = WORKER_CATEGORIES.find(
    cat => cat.value === detectedCategory
  );

  return validCategory ? detectedCategory : null;
};
