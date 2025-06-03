
import { AuthGuard } from "@/components/AuthGuard"
import { DashboardLayout } from "@/components/DashboardLayout"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Textarea } from "@/components/ui/textarea"
import { useState } from "react"
import { FileText, Upload, Loader2, Brain } from "lucide-react"

export default function ScriptAnalyzerPage() {
  const [script, setScript] = useState('')
  const [analysis, setAnalysis] = useState('')
  const [loading, setLoading] = useState(false)

  const handleAnalyze = async () => {
    if (!script.trim()) return
    
    setLoading(true)
    
    // Simulate analysis - replace with actual API call
    setTimeout(() => {
      setAnalysis(`Script Analysis Results:

Structure: Your script follows a clear three-act structure with well-defined plot points.

Character Development: Strong protagonist with clear motivations. Consider developing secondary characters further.

Dialogue: Natural and engaging dialogue that serves the story well. Some exposition could be more subtle.

Pacing: Good overall pacing with effective use of tension and release.

Visual Storytelling: Strong use of visual elements to advance the story.

Recommendations:
- Tighten dialogue in scenes 3-5
- Add more subtext to character interactions
- Consider strengthening the climax for maximum impact

Overall Score: 8.5/10 - Excellent foundation with room for minor improvements.`)
      setLoading(false)
    }, 2000)
  }

  return (
    <AuthGuard allowedRoles={["student"]}>
      <DashboardLayout>
        <div className="space-y-6">
          <div>
            <h1 className="text-3xl font-bold tracking-tight">Script Analyzer</h1>
            <p className="text-muted-foreground">Get detailed analysis and feedback on your scripts</p>
          </div>

          <div className="grid gap-6 md:grid-cols-2">
            {/* Input Section */}
            <Card>
              <CardHeader>
                <CardTitle>Upload Your Script</CardTitle>
                <CardDescription>
                  Paste your script content or upload a file for analysis
                </CardDescription>
              </CardHeader>
              <CardContent className="space-y-4">
                <Textarea
                  placeholder="Paste your script content here..."
                  value={script}
                  onChange={(e) => setScript(e.target.value)}
                  className="min-h-[300px] resize-none"
                />
                
                <div className="flex gap-2">
                  <Button
                    onClick={handleAnalyze}
                    disabled={!script.trim() || loading}
                    className="flex-1"
                  >
                    {loading ? (
                      <>
                        <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                        Analyzing...
                      </>
                    ) : (
                      <>
                        <Brain className="h-4 w-4 mr-2" />
                        Analyze Script
                      </>
                    )}
                  </Button>
                  
                  <Button variant="outline">
                    <Upload className="h-4 w-4 mr-2" />
                    Upload File
                  </Button>
                </div>
              </CardContent>
            </Card>

            {/* Analysis Results */}
            <Card>
              <CardHeader>
                <CardTitle>Analysis Results</CardTitle>
                <CardDescription>
                  AI-powered feedback and suggestions for your script
                </CardDescription>
              </CardHeader>
              <CardContent>
                {analysis ? (
                  <div className="whitespace-pre-wrap text-sm space-y-4">
                    {analysis}
                  </div>
                ) : (
                  <div className="text-center py-12 text-gray-500">
                    <FileText className="h-12 w-12 mx-auto mb-4 opacity-50" />
                    <p>Upload or paste your script to get detailed analysis</p>
                  </div>
                )}
              </CardContent>
            </Card>
          </div>

          {/* Features Section */}
          <div className="grid gap-4 md:grid-cols-3">
            <Card>
              <CardHeader>
                <CardTitle className="text-lg">Structure Analysis</CardTitle>
              </CardHeader>
              <CardContent>
                <p className="text-sm text-gray-600">
                  Analyzes your script's three-act structure, pacing, and plot points.
                </p>
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <CardTitle className="text-lg">Character Development</CardTitle>
              </CardHeader>
              <CardContent>
                <p className="text-sm text-gray-600">
                  Evaluates character arcs, motivations, and dialogue effectiveness.
                </p>
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <CardTitle className="text-lg">Industry Standards</CardTitle>
              </CardHeader>
              <CardContent>
                <p className="text-sm text-gray-600">
                  Checks formatting, industry conventions, and professional standards.
                </p>
              </CardContent>
            </Card>
          </div>
        </div>
      </DashboardLayout>
    </AuthGuard>
  )
}
