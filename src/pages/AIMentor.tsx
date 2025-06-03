
import { AuthGuard } from "@/components/AuthGuard"
import { DashboardLayout } from "@/components/DashboardLayout"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"

export default function AIMentorPage() {
  return (
    <AuthGuard allowedRoles={["student"]}>
      <DashboardLayout>
        <div className="space-y-6">
          <div>
            <h1 className="text-3xl font-bold tracking-tight">AI Mentor</h1>
            <p className="text-muted-foreground">Get personalized guidance and support from your AI mentor</p>
          </div>

          <Card className="overflow-hidden">
            <CardHeader>
              <CardTitle>Talk to Your Mentor</CardTitle>
              <CardDescription>
                Ask questions, get advice, and receive personalized guidance for your studies
              </CardDescription>
            </CardHeader>
            <CardContent className="p-0">
              <div className="h-[700px] w-full">
                <iframe
                  src="https://labs.heygen.com/guest/streaming-embed?share=eyJxdWFsaXR5IjoiaGlnaCIsImF2YXRhck5hbWUiOiJTaGF3bl9UaGVyYXBpc3RfcHVibGljIiwi%0D%0AcHJldmlld0ltZyI6Imh0dHBzOi8vZmlsZXMyLmhleWdlbi5haS9hdmF0YXIvdjMvZGIyZmI3ZmQw%0D%0AZDA0NGI5MDgzOTVhMDExMTY2YWIyMmRfNDU2ODAvcHJldmlld190YXJnZXQud2VicCIsIm5lZWRS%0D%0AZW1vdmVCYWNrZ3JvdW5kIjpmYWxzZSwia25vd2xlZGdlQmFzZUlkIjoiYjM4ZWQ3NzU4ZTJkNDQ2%0D%0AMWIwZTBiNDM5NTQ4NDZjN2YiLCJ1c2VybmFtZSI6IjkwNjJmZWI4NzY5MzRlMjJhN2FkMTVjOTE0%0D%0AMWNkZWRiIn0%3D&inIFrame=1"
                  width="100%"
                  height="100%"
                  frameBorder="0"
                  title="AI Mentor"
                  allow="microphone"
                  className="w-full h-full"
                ></iframe>
              </div>
            </CardContent>
          </Card>
        </div>
      </DashboardLayout>
    </AuthGuard>
  )
}
