
import { serve } from "https://deno.land/std@0.168.0/http/server.ts"
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2'

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
}

serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response('ok', { headers: corsHeaders })
  }

  try {
    const supabase = createClient(
      Deno.env.get('SUPABASE_URL') ?? '',
      Deno.env.get('SUPABASE_SERVICE_ROLE_KEY') ?? ''
    )

    const { submissionId, filePath, metadata } = await req.json()

    // Download the file from storage
    const { data: fileData, error: downloadError } = await supabase.storage
      .from('assignment-submissions')
      .download(filePath)

    if (downloadError) throw downloadError

    // Convert file to text (assuming it's a text file or PDF that can be processed)
    const text = await fileData.text()
    const fullContent = metadata + text

    // Mock AI evaluation (replace with actual AI service call)
    const mockEvaluation = {
      grade: "Excellent",
      score: "91/100",
      feedback: `EVALUATION REPORT
Overall Grade: Excellent
Score: 91/100

Rubric-Based Breakdown:
• Content Understanding (30%): 28/30 - The student demonstrates a thorough understanding of the subject matter and its societal implications.
• Critical Analysis (30%): 27/30 - The critical analysis is insightful with effective use of examples and evidence.
• Research Quality (20%): 18/20 - The submission utilizes a variety of credible sources to support the arguments.
• Organization and Clarity (10%): 9/10 - The organization is logical with clear transitions between sections.
• Citations and Formatting (10%): 9/10 - The citations are mostly well-formatted and adhere to academic standards.

Constructive Feedback:
Strengths: Strong understanding of subject matter, insightful critical analysis, good research quality with relevant sources, well-organized presentation.
Areas for Improvement: Expand critical analysis by incorporating more comparative examples, refine citation formatting.

Recommendations: Consider reviewing additional scholarly sources and comparative studies.

Faculty Progress Summary:
Status: On-track
Red Flags: None detected
Academic Integrity: Clean - no plagiarism or AI content detected`,
      rubric: {
        content_understanding: { score: 28, max: 30 },
        critical_analysis: { score: 27, max: 30 },
        research_quality: { score: 18, max: 20 },
        organization: { score: 9, max: 10 },
        citations: { score: 9, max: 10 }
      },
      status: "On-track",
      red_flags: "None detected",
      academic_integrity: "Clean"
    }

    // Update submission with AI evaluation
    const { error: updateError } = await supabase
      .from('submissions')
      .update({
        ai_evaluation: mockEvaluation,
        ai_feedback: mockEvaluation
      })
      .eq('id', submissionId)

    if (updateError) throw updateError

    return new Response(
      JSON.stringify({ success: true, evaluation: mockEvaluation }),
      { 
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        status: 200,
      },
    )
  } catch (error) {
    console.error('Error in evaluate-submission function:', error)
    return new Response(
      JSON.stringify({ error: error.message }),
      { 
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        status: 400,
      },
    )
  }
})
