
import React, { useState } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Progress } from "@/components/ui/progress";
import {
  CheckCircle,
  Trophy,
  Target,
  Clock,
  Award,
  Star,
  Zap,
} from "lucide-react";
import { cn } from "@/lib/utils";

interface QuizQuestion {
  id: number;
  question: string;
  options: string[];
}

interface QuizData {
  questions?: QuizQuestion[];
  score?: number;
  totalQuestions?: number;
  topics?: string[];
  results?: any[];
}

interface QuizAnswers {
  [questionId: number]: string;
}

interface QuizRendererProps {
  quizData: QuizData;
  onAnswerSubmit?: (answers: QuizAnswers) => void;
  onProgress?: (progress: { completed: number; total: number }) => void;
}

export const QuizRenderer: React.FC<QuizRendererProps> = ({
  quizData,
  onAnswerSubmit,
  onProgress,
}) => {
  const [selectedAnswers, setSelectedAnswers] = useState<QuizAnswers>({});
  const [submitted, setSubmitted] = useState<boolean>(false);
  const [showResults, setShowResults] = useState<boolean>(false);

  const handleAnswerSelect = (questionId: number, answer: string): void => {
    if (submitted) return;

    setSelectedAnswers((prev) => {
      const newAnswers = { ...prev, [questionId]: answer };
      
      // Update progress
      onProgress?.({
        completed: Object.keys(newAnswers).length,
        total: getTotalQuestions(),
      });
      
      return newAnswers;
    });
  };

  const handleSubmit = (): void => {
    setSubmitted(true);
    setShowResults(true);
    onAnswerSubmit?.(selectedAnswers);
  };

  const getTotalQuestions = (): number => {
    return quizData.questions?.length || 0;
  };

  const getAnsweredQuestions = (): number => {
    return Object.keys(selectedAnswers).length;
  };

  const getProgressPercentage = (): number => {
    return (getAnsweredQuestions() / getTotalQuestions()) * 100;
  };

  const formatText = (text: string): React.ReactNode => {
    const parts = text.split(/(\*\*.*?\*\*)/);
    return parts.map((part, index) => {
      if (part.startsWith("**") && part.endsWith("**")) {
        const boldText = part.slice(2, -2);
        return (
          <strong key={index} className="font-semibold text-gray-900">
            {boldText}
          </strong>
        );
      }
      return <span key={index}>{part}</span>;
    });
  };

  if (!quizData.questions || quizData.questions.length === 0) {
    return (
      <div className="text-center py-8 text-gray-500">
        <Target className="h-12 w-12 mx-auto mb-3 text-gray-400" />
        <p className="text-lg font-medium">No quiz questions found</p>
        <p className="text-sm">Please try asking for a quiz again.</p>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Quiz Header */}
      <Card className="bg-gradient-to-r from-purple-50 to-blue-50 border-purple-200">
        <CardHeader className="pb-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-3">
              <div className="w-12 h-12 bg-gradient-to-r from-purple-600 to-blue-600 rounded-xl flex items-center justify-center">
                <Trophy className="h-6 w-6 text-white" />
              </div>
              <div>
                <CardTitle className="text-purple-900">Interactive Quiz</CardTitle>
                <p className="text-purple-600 text-sm">
                  {getTotalQuestions()} Questions • Test your knowledge
                </p>
              </div>
            </div>
            <div className="text-right">
              <div className="text-sm font-medium text-purple-700 mb-1">
                Progress
              </div>
              <Badge
                variant="secondary"
                className="bg-purple-100 text-purple-700"
              >
                {getAnsweredQuestions()}/{getTotalQuestions()}
              </Badge>
            </div>
          </div>
          
          <div className="mt-4">
            <div className="flex items-center justify-between text-xs text-purple-600 mb-2">
              <span>Completed</span>
              <span>{Math.round(getProgressPercentage())}%</span>
            </div>
            <Progress value={getProgressPercentage()} className="h-2" />
          </div>
        </CardHeader>
      </Card>

      {/* Questions */}
      <div className="space-y-6">
        {quizData.questions.map((q) => (
          <Card
            key={q.id}
            className={cn(
              "transition-all duration-300 hover:shadow-md",
              selectedAnswers[q.id] ? "ring-2 ring-purple-200 bg-purple-50/30" : "",
              submitted ? "opacity-75" : ""
            )}
          >
            <CardHeader className="pb-3">
              <div className="flex items-start gap-4">
                <div className="w-10 h-10 bg-gradient-to-r from-purple-500 to-blue-500 rounded-full flex items-center justify-center flex-shrink-0 text-white font-semibold">
                  {q.id}
                </div>
                <div className="flex-1">
                  <CardTitle className="text-base font-medium text-gray-900 leading-relaxed">
                    {formatText(q.question)}
                  </CardTitle>
                </div>
                {selectedAnswers[q.id] && (
                  <CheckCircle className="h-5 w-5 text-green-500 flex-shrink-0" />
                )}
              </div>
            </CardHeader>
            <CardContent>
              <div className="grid gap-3">
                {q.options.map((option, index) => {
                  const optionLetter = option.charAt(0);
                  const optionText = option.substring(3).trim();
                  const isSelected = selectedAnswers[q.id] === optionLetter;

                  return (
                    <button
                      key={`${q.id}-${index}`}
                      onClick={() => handleAnswerSelect(q.id, optionLetter)}
                      disabled={submitted}
                      className={cn(
                        "w-full text-left p-4 rounded-lg border-2 transition-all duration-200",
                        "hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-purple-500 focus:ring-opacity-50",
                        isSelected
                          ? "bg-purple-50 border-purple-300 shadow-sm"
                          : "border-gray-200 hover:border-purple-200",
                        submitted && "cursor-not-allowed"
                      )}
                    >
                      <div className="flex items-start gap-4">
                        <div
                          className={cn(
                            "w-8 h-8 rounded-full border-2 flex items-center justify-center text-sm font-semibold transition-all flex-shrink-0",
                            isSelected
                              ? "bg-purple-600 border-purple-600 text-white shadow-sm"
                              : "border-gray-300 text-gray-600 hover:border-purple-300"
                          )}
                        >
                          {optionLetter}
                        </div>
                        <div className="text-sm text-gray-800 flex-1 leading-relaxed">
                          {formatText(optionText)}
                        </div>
                      </div>
                    </button>
                  );
                })}
              </div>
            </CardContent>
          </Card>
        ))}
      </div>

      {/* Submit Button */}
      {!submitted && (
        <div className="flex justify-center pt-6">
          <Button
            onClick={handleSubmit}
            disabled={getAnsweredQuestions() !== getTotalQuestions()}
            className={cn(
              "bg-gradient-to-r from-purple-600 to-blue-600 hover:from-purple-700 hover:to-blue-700 text-white px-8 py-3 text-base font-medium rounded-xl",
              getAnsweredQuestions() === getTotalQuestions()
                ? "shadow-lg hover:shadow-xl transform hover:scale-105"
                : "opacity-50 cursor-not-allowed"
            )}
            size="lg"
          >
            <Zap className="h-5 w-5 mr-2" />
            Submit Quiz ({getAnsweredQuestions()}/{getTotalQuestions()})
          </Button>
        </div>
      )}

      {/* Results */}
      {submitted && showResults && (
        <Card className="bg-gradient-to-r from-green-50 to-emerald-50 border-green-200">
          <CardContent className="text-center py-8">
            <div className="space-y-4">
              <div className="w-16 h-16 bg-gradient-to-r from-green-500 to-emerald-500 rounded-full flex items-center justify-center mx-auto">
                <Award className="h-8 w-8 text-white" />
              </div>
              <div>
                <h3 className="text-xl font-semibold text-green-800 mb-2">
                  Quiz Completed Successfully! 🎉
                </h3>
                <p className="text-green-600 mb-4">
                  You've answered all {getTotalQuestions()} questions. Great work!
                </p>
                <div className="flex items-center justify-center gap-2">
                  <Star className="h-5 w-5 text-yellow-500" />
                  <span className="text-sm font-medium text-gray-700">
                    Keep practicing to improve your knowledge!
                  </span>
                </div>
              </div>
            </div>
          </CardContent>
        </Card>
      )}
    </div>
  );
};
