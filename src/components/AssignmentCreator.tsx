
import { useState } from 'react';
import { useAuth } from '@/hooks/useAuth';
import { supabase } from '@/integrations/supabase/client';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { toast } from '@/hooks/use-toast';
import { Loader2 } from 'lucide-react';

interface AssignmentCreatorProps {
  aiResponse?: string;
  semester?: number;
  topic?: string;
  onAssignmentCreated?: () => void;
  // When true, the assignment is flagged as a semester-end assessment so the
  // faculty's Sem-End tab can manage it separately from regular assignments.
  isSemEnd?: boolean;
}

export const AssignmentCreator = ({ aiResponse, semester, topic, onAssignmentCreated, isSemEnd = false }: AssignmentCreatorProps) => {
  const { user } = useAuth();
  const [isCreating, setIsCreating] = useState(false);
  const [formData, setFormData] = useState({
    title: '',
    description: aiResponse || '',
    semester: semester || 1,
    topic: topic || (isSemEnd ? 'Semester End Assessment' : ''),
    due_date: '',
    total_points: 100,
    estimated_time: 0,
    difficulty: 'medium' as 'easy' | 'medium' | 'hard'
  });

  const parseAIResponse = (response: string) => {
    const lines = response.split('\n');
    let title = '';
    let description = response;

    // Try to extract title from the response
    for (const line of lines) {
      if (line.includes('ASSIGNMENT TITLE') || line.includes('Assignment Title')) {
        title = line.split(':')[1]?.trim() || '';
        break;
      }
    }

    return { title, description };
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!user) return;

    setIsCreating(true);
    try {
      const { title, description } = parseAIResponse(formData.description);
      
      const { data, error } = await supabase
        .from('assignments')
        .insert([
          {
            title: title || formData.title,
            description: formData.description,
            teacher_id: user.id,
            semester: formData.semester,
            topic: formData.topic,
            due_date: formData.due_date,
            total_points: formData.total_points,
            estimated_time: formData.estimated_time,
            difficulty: formData.difficulty,
            ai_generated_content: aiResponse,
            status: 'published',
            is_sem_end: isSemEnd
          }
        ])
        .select()
        .single();

      if (error) throw error;

      toast({
        title: isSemEnd ? "Semester-End Assessment Created!" : "Assignment Created Successfully!",
        description: `${isSemEnd ? 'Sem-End assessment' : 'Assignment'} has been created and assigned to all Semester ${formData.semester} students.`
      });

      // Reset form
      setFormData({
        title: '',
        description: '',
        semester: 1,
        topic: isSemEnd ? 'Semester End Assessment' : '',
        due_date: '',
        total_points: 100,
        estimated_time: 0,
        difficulty: 'medium'
      });

      onAssignmentCreated?.();
    } catch (error) {
      console.error('Error creating assignment:', error);
      toast({
        title: "Error",
        description: "Failed to create assignment. Please try again.",
        variant: "destructive"
      });
    } finally {
      setIsCreating(false);
    }
  };

  return (
    <Card className="w-full max-w-2xl mx-auto">
      <CardHeader>
        <CardTitle>
          {isSemEnd ? 'Create Semester-End Assessment' : 'Create New Assignment'}
        </CardTitle>
      </CardHeader>
      <CardContent>
        <form onSubmit={handleSubmit} className="space-y-4">
          <div>
            <Label htmlFor="title">Assignment Title</Label>
            <Input
              id="title"
              value={formData.title}
              onChange={(e) => setFormData({ ...formData, title: e.target.value })}
              placeholder="Enter assignment title"
              required
            />
          </div>

          <div>
            <Label htmlFor="description">Assignment Description</Label>
            <Textarea
              id="description"
              value={formData.description}
              onChange={(e) => setFormData({ ...formData, description: e.target.value })}
              placeholder="Enter assignment description"
              className="min-h-32"
              required
            />
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div>
              <Label htmlFor="semester">Semester</Label>
              <Select value={formData.semester.toString()} onValueChange={(value) => setFormData({ ...formData, semester: parseInt(value) })}>
                <SelectTrigger>
                  <SelectValue placeholder="Select semester" />
                </SelectTrigger>
                <SelectContent>
                  {[1, 2, 3, 4, 5, 6, 7, 8].map((sem) => (
                    <SelectItem key={sem} value={sem.toString()}>
                      Semester {sem}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            <div>
              <Label htmlFor="difficulty">Difficulty</Label>
              <Select value={formData.difficulty} onValueChange={(value: 'easy' | 'medium' | 'hard') => setFormData({ ...formData, difficulty: value })}>
                <SelectTrigger>
                  <SelectValue placeholder="Select difficulty" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="easy">Easy</SelectItem>
                  <SelectItem value="medium">Medium</SelectItem>
                  <SelectItem value="hard">Hard</SelectItem>
                </SelectContent>
              </Select>
            </div>
          </div>

          <div>
            <Label htmlFor="topic">Topic</Label>
            <Input
              id="topic"
              value={formData.topic}
              onChange={(e) => setFormData({ ...formData, topic: e.target.value })}
              placeholder="Enter assignment topic"
            />
          </div>

          <div>
            <Label htmlFor="due_date">Due Date</Label>
            <Input
              id="due_date"
              type="datetime-local"
              value={formData.due_date}
              onChange={(e) => setFormData({ ...formData, due_date: e.target.value })}
              required
            />
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div>
              <Label htmlFor="total_points">Total Points</Label>
              <Input
                id="total_points"
                type="number"
                value={formData.total_points}
                onChange={(e) => setFormData({ ...formData, total_points: parseInt(e.target.value) })}
                min="1"
                required
              />
            </div>

            <div>
              <Label htmlFor="estimated_time">Estimated Time (hours)</Label>
              <Input
                id="estimated_time"
                type="number"
                value={formData.estimated_time}
                onChange={(e) => setFormData({ ...formData, estimated_time: parseInt(e.target.value) })}
                min="0"
              />
            </div>
          </div>

          <Button type="submit" disabled={isCreating} className="w-full">
            {isCreating && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
            Create Assignment
          </Button>
        </form>
      </CardContent>
    </Card>
  );
};
