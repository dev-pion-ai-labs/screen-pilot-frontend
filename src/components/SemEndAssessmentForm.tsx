import { useEffect, useMemo, useState } from "react";
import { useAuth } from "@/hooks/useAuth";
import { supabase } from "@/integrations/supabase/client";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Label } from "@/components/ui/label";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { toast } from "@/hooks/use-toast";
import { CheckCircle2, GraduationCap, Loader2, Users } from "lucide-react";
import { cn } from "@/lib/utils";

interface TeacherClass {
  id: string;
  name: string;
  semester: number;
  program: string | null;
  student_count: number;
}

interface SemEndAssessmentFormProps {
  onCreated?: () => void;
}

// Sem-End assessments are scoped to a single class. Picking a class gives us
// program + semester implicitly (classes already carry both), so we don't need
// a separate program picker. After insert we look up class_students for that
// class and bulk-upsert assignment_enrollments — without that step the
// students never see the assessment in their dashboard.
export const SemEndAssessmentForm = ({ onCreated }: SemEndAssessmentFormProps) => {
  const { user, profile } = useAuth();
  const [classes, setClasses] = useState<TeacherClass[]>([]);
  const [loadingClasses, setLoadingClasses] = useState(true);
  const [selectedClassId, setSelectedClassId] = useState<string>("");
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [formData, setFormData] = useState({
    title: "",
    description: "",
    due_date: "",
    total_points: 100,
  });

  const teacherId = (profile as any)?.id || user?.id;

  useEffect(() => {
    if (!teacherId) return;
    void fetchClasses();
  }, [teacherId]);

  const fetchClasses = async () => {
    setLoadingClasses(true);
    try {
      const { data, error } = await supabase
        .from("class_teachers")
        .select(
          `
          class_id,
          classes:class_id ( id, name, semester, program )
        `,
        )
        .eq("teacher_id", teacherId);
      if (error) throw error;

      const withCounts = await Promise.all(
        (data || []).map(async (row: any) => {
          const cls = row.classes;
          if (!cls) return null;
          const { count } = await supabase
            .from("class_students")
            .select("*", { count: "exact", head: true })
            .eq("class_id", cls.id);
          return {
            id: cls.id,
            name: cls.name,
            semester: cls.semester,
            program: cls.program,
            student_count: count || 0,
          } as TeacherClass;
        }),
      );

      setClasses(withCounts.filter(Boolean) as TeacherClass[]);
    } catch (err) {
      console.error("Failed to load teacher classes:", err);
      toast({
        title: "Couldn't load your classes",
        description: (err as Error).message,
        variant: "destructive",
      });
    } finally {
      setLoadingClasses(false);
    }
  };

  const selectedClass = useMemo(
    () => classes.find((c) => c.id === selectedClassId) || null,
    [classes, selectedClassId],
  );

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!teacherId) return;
    if (!selectedClass) {
      toast({
        title: "Pick a class first",
        description: "Sem-End assessments need a class so the right students get enrolled.",
        variant: "destructive",
      });
      return;
    }
    if (!formData.title.trim() || !formData.description.trim() || !formData.due_date) {
      toast({
        title: "Fill in title, description, and due date",
        variant: "destructive",
      });
      return;
    }

    setIsSubmitting(true);
    let assignmentId: string | null = null;
    try {
      // 1. Insert assignment as draft. We flip to published only after
      //    enrollments succeed so students never see an unenrolled
      //    assessment in their dashboard.
      const { data: inserted, error: insertErr } = await supabase
        .from("assignments")
        .insert([
          {
            title: formData.title.trim(),
            description: formData.description,
            teacher_id: teacherId,
            class_id: selectedClass.id,
            semester: selectedClass.semester,
            topic: "Semester End Assessment",
            due_date: new Date(formData.due_date).toISOString(),
            total_points: formData.total_points,
            difficulty: "medium",
            ai_generated_content: formData.description,
            status: "draft",
            is_sem_end: true,
          },
        ])
        .select()
        .single();
      if (insertErr) throw insertErr;
      assignmentId = inserted.id;

      // 2. Look up enrolled students for this class.
      const { data: students, error: studentsErr } = await supabase
        .from("class_students")
        .select("student_id")
        .eq("class_id", selectedClass.id);
      if (studentsErr) throw studentsErr;

      const enrollmentRows = (students || []).map((s: any) => ({
        assignment_id: assignmentId,
        student_id: s.student_id,
        assigned_at: new Date().toISOString(),
        status: "assigned",
      }));

      // 3. Bulk upsert enrollments. ignoreDuplicates lets us retry
      //    safely if a partial failure already created some rows.
      if (enrollmentRows.length > 0) {
        const { error: enrollErr } = await supabase
          .from("assignment_enrollments")
          .upsert(enrollmentRows, {
            onConflict: "assignment_id,student_id",
            ignoreDuplicates: true,
          });
        if (enrollErr) throw enrollErr;
      }

      // 4. Publish — only now do students see it.
      const { error: publishErr } = await supabase
        .from("assignments")
        .update({ status: "published", updated_at: new Date().toISOString() })
        .eq("id", assignmentId);
      if (publishErr) throw publishErr;

      toast({
        title: "Sem-End assessment published 🎓",
        description:
          enrollmentRows.length > 0
            ? `Assigned to ${enrollmentRows.length} student${enrollmentRows.length === 1 ? "" : "s"} in ${selectedClass.name}.`
            : `Created for ${selectedClass.name}, but the class has no students enrolled yet.`,
      });

      setFormData({ title: "", description: "", due_date: "", total_points: 100 });
      setSelectedClassId("");
      onCreated?.();
    } catch (err) {
      console.error("Sem-End create failed:", err);
      // Best-effort rollback so we don't leave a published-but-unenrolled
      // assignment dangling for the teacher.
      if (assignmentId) {
        try {
          await supabase
            .from("assignment_enrollments")
            .delete()
            .eq("assignment_id", assignmentId);
          await supabase.from("assignments").delete().eq("id", assignmentId);
        } catch (cleanupErr) {
          console.error("Rollback failed:", cleanupErr);
        }
      }
      toast({
        title: "Couldn't create Sem-End assessment",
        description: (err as Error).message || "Try again in a moment.",
        variant: "destructive",
      });
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <Card className="w-full max-w-3xl mx-auto">
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <GraduationCap className="h-5 w-5 text-amber-600" />
          Create Semester-End Assessment
        </CardTitle>
      </CardHeader>
      <CardContent>
        <form onSubmit={handleSubmit} className="space-y-5">
          <div>
            <div className="flex items-center justify-between mb-3">
              <Label className="text-sm font-semibold text-gray-800">
                Class
              </Label>
              {selectedClass && (
                <span className="text-xs text-amber-700 font-medium">
                  {selectedClass.student_count} student
                  {selectedClass.student_count === 1 ? "" : "s"} will be enrolled
                </span>
              )}
            </div>
            {loadingClasses ? (
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                {[0, 1].map((i) => (
                  <div
                    key={i}
                    className="h-24 rounded-2xl bg-gradient-to-br from-gray-100 to-gray-50 animate-pulse"
                  />
                ))}
              </div>
            ) : classes.length === 0 ? (
              <div className="rounded-2xl border border-dashed border-amber-300 bg-amber-50/50 px-4 py-6 text-sm text-amber-900 text-center">
                You don't have any classes assigned yet. Ask an admin to add
                you to a class first.
              </div>
            ) : (
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                {classes.map((c) => {
                  const isSelected = c.id === selectedClassId;
                  return (
                    <button
                      type="button"
                      key={c.id}
                      onClick={() => setSelectedClassId(c.id)}
                      className={cn(
                        "group relative text-left rounded-2xl border p-4 transition-all duration-200",
                        "focus:outline-none focus-visible:ring-2 focus-visible:ring-amber-500 focus-visible:ring-offset-2",
                        isSelected
                          ? "border-amber-500 bg-gradient-to-br from-amber-50 to-orange-50 shadow-md ring-1 ring-amber-300"
                          : "border-gray-200 bg-white hover:border-amber-300 hover:shadow-sm",
                      )}
                    >
                      {isSelected && (
                        <CheckCircle2 className="absolute top-3 right-3 h-5 w-5 text-amber-600" />
                      )}
                      <div className="space-y-2 pr-6">
                        <div
                          className={cn(
                            "font-semibold leading-tight",
                            isSelected ? "text-amber-900" : "text-gray-900",
                          )}
                        >
                          {c.name}
                        </div>
                        <div className="flex flex-wrap gap-1.5">
                          {c.program && (
                            <Badge
                              variant="secondary"
                              className={cn(
                                "border-0 text-[11px] font-medium",
                                isSelected
                                  ? "bg-purple-200 text-purple-900"
                                  : "bg-purple-100 text-purple-800",
                              )}
                            >
                              {c.program}
                            </Badge>
                          )}
                          <Badge
                            variant="secondary"
                            className={cn(
                              "border-0 text-[11px] font-medium",
                              isSelected
                                ? "bg-indigo-200 text-indigo-900"
                                : "bg-indigo-100 text-indigo-800",
                            )}
                          >
                            Sem {c.semester}
                          </Badge>
                        </div>
                        <div className="flex items-center gap-1.5 text-xs text-gray-600">
                          <Users className="h-3 w-3" />
                          {c.student_count} student
                          {c.student_count === 1 ? "" : "s"}
                        </div>
                      </div>
                    </button>
                  );
                })}
              </div>
            )}
          </div>

          <div>
            <Label htmlFor="sem-end-title">Assessment Title</Label>
            <Input
              id="sem-end-title"
              value={formData.title}
              onChange={(e) => setFormData({ ...formData, title: e.target.value })}
              placeholder="e.g. Sem 2 Final Screenplay Project"
              required
            />
          </div>

          <div>
            <Label htmlFor="sem-end-description">Description</Label>
            <Textarea
              id="sem-end-description"
              value={formData.description}
              onChange={(e) => setFormData({ ...formData, description: e.target.value })}
              placeholder="Brief, deliverables, evaluation criteria, etc."
              className="min-h-32"
              required
            />
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div>
              <Label htmlFor="sem-end-due">Due Date</Label>
              <Input
                id="sem-end-due"
                type="datetime-local"
                value={formData.due_date}
                onChange={(e) => setFormData({ ...formData, due_date: e.target.value })}
                required
              />
            </div>
            <div>
              <Label htmlFor="sem-end-points">Total Points</Label>
              <Input
                id="sem-end-points"
                type="number"
                min={1}
                value={formData.total_points}
                onChange={(e) =>
                  setFormData({
                    ...formData,
                    total_points: parseInt(e.target.value || "0", 10),
                  })
                }
                required
              />
            </div>
          </div>

          <Button
            type="submit"
            disabled={isSubmitting || classes.length === 0}
            className="w-full bg-gradient-to-r from-amber-500 to-orange-500 hover:from-amber-600 hover:to-orange-600"
          >
            {isSubmitting && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
            {isSubmitting ? "Publishing…" : "Create & Assign Sem-End Assessment"}
          </Button>
        </form>
      </CardContent>
    </Card>
  );
};

export default SemEndAssessmentForm;
