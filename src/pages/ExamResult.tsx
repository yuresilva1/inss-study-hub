import { useEffect, useState } from "react";
import { useParams, Link } from "react-router-dom";
import { supabase } from "@/integrations/supabase/client";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Progress } from "@/components/ui/progress";
import { Trophy, Clock, Target, ArrowLeft, CheckCircle, XCircle } from "lucide-react";

interface ExamData {
  score: number;
  total_correct: number;
  total_questions: number;
  time_spent_seconds: number;
}

interface AnswerDetail {
  id: string;
  question_order: number;
  user_answer: string | null;
  is_correct: boolean | null;
  question: {
    statement: string;
    option_a: string;
    option_b: string;
    option_c: string;
    option_d: string;
    option_e: string;
    correct_answer: string;
    explanation: string | null;
    subject: { name: string; color: string } | null;
  };
}

export default function ExamResult() {
  const { id } = useParams<{ id: string }>();
  const [exam, setExam] = useState<ExamData | null>(null);
  const [answers, setAnswers] = useState<AnswerDetail[]>([]);
  const [showOnlyErrors, setShowOnlyErrors] = useState(false);

  useEffect(() => {
    if (!id) return;
    const load = async () => {
      const { data: examData } = await supabase
        .from("exams")
        .select("score, total_correct, total_questions, time_spent_seconds")
        .eq("id", id)
        .single();

      if (examData) setExam(examData as ExamData);

      const { data: answerData } = await supabase
        .from("exam_answers")
        .select(`
          id, question_order, user_answer, is_correct,
          question:questions(statement, option_a, option_b, option_c, option_d, option_e, correct_answer, explanation, subject:subjects(name, color))
        `)
        .eq("exam_id", id)
        .order("question_order");

      if (answerData) {
        setAnswers(answerData as unknown as AnswerDetail[]);
      }
    };
    load();
  }, [id]);

  if (!exam) {
    return (
      <div className="flex min-h-[60vh] items-center justify-center">
        <div className="h-12 w-12 animate-spin rounded-full border-4 border-primary border-t-transparent" />
      </div>
    );
  }

  const score = Math.round(Number(exam.score));
  const minutes = Math.floor((exam.time_spent_seconds || 0) / 60);
  const filteredAnswers = showOnlyErrors ? answers.filter((a) => !a.is_correct) : answers;

  const getOptionText = (q: AnswerDetail["question"], key: string) => {
    const map: Record<string, string> = { A: q.option_a, B: q.option_b, C: q.option_c, D: q.option_d, E: q.option_e };
    return map[key] || "";
  };

  return (
    <div className="max-w-3xl mx-auto space-y-6 animate-fade-in">
      <Link to="/">
        <Button variant="ghost" className="gap-1"><ArrowLeft className="h-4 w-4" /> Voltar</Button>
      </Link>

      {/* Score hero */}
      <Card className={`border-0 shadow-xl ${score >= 70 ? "gradient-cool" : score >= 50 ? "gradient-primary" : "gradient-warm"} text-primary-foreground`}>
        <CardContent className="p-8 text-center">
          <Trophy className="h-16 w-16 mx-auto mb-4 opacity-80" />
          <p className="font-display text-6xl font-bold">{score}%</p>
          <p className="text-lg opacity-90 mt-2">
            {exam.total_correct} de {exam.total_questions} questões corretas
          </p>
          <div className="flex justify-center gap-6 mt-6 text-sm opacity-80">
            <span className="flex items-center gap-1"><Clock className="h-4 w-4" /> {minutes} min</span>
            <span className="flex items-center gap-1"><Target className="h-4 w-4" /> {score >= 70 ? "Excelente!" : score >= 50 ? "Bom!" : "Continue praticando!"}</span>
          </div>
        </CardContent>
      </Card>

      {/* Filters */}
      <div className="flex gap-2">
        <Button variant={showOnlyErrors ? "outline" : "default"} size="sm" onClick={() => setShowOnlyErrors(false)}>Todas ({answers.length})</Button>
        <Button variant={showOnlyErrors ? "default" : "outline"} size="sm" onClick={() => setShowOnlyErrors(true)} className={showOnlyErrors ? "bg-destructive text-destructive-foreground" : ""}>
          Erradas ({answers.filter((a) => !a.is_correct).length})
        </Button>
      </div>

      {/* Answers */}
      <div className="space-y-4">
        {filteredAnswers.map((a) => (
          <Card key={a.id} className={`border-l-4 ${a.is_correct ? "border-l-success" : "border-l-destructive"} shadow-md`}>
            <CardContent className="p-5">
              <div className="flex items-start justify-between mb-3">
                <div className="flex items-center gap-2">
                  {a.is_correct ? (
                    <CheckCircle className="h-5 w-5 text-success shrink-0" />
                  ) : (
                    <XCircle className="h-5 w-5 text-destructive shrink-0" />
                  )}
                  <span className="text-xs font-semibold text-muted-foreground">Questão {a.question_order}</span>
                </div>
                {a.question.subject && (
                  <span className="text-xs font-medium px-2 py-1 rounded-full" style={{ backgroundColor: `${a.question.subject.color}20`, color: a.question.subject.color }}>
                    {a.question.subject.name}
                  </span>
                )}
              </div>

              <p className="text-sm leading-relaxed mb-3 whitespace-pre-wrap">{a.question.statement}</p>

              <div className="space-y-1.5 text-sm">
                {["A", "B", "C", "D", "E"].map((key) => {
                  const isCorrectOption = a.question.correct_answer === key;
                  const isUserAnswer = a.user_answer === key;
                  return (
                    <div
                      key={key}
                      className={`p-2 rounded-lg flex items-start gap-2 ${
                        isCorrectOption
                          ? "bg-success/10 text-success font-medium"
                          : isUserAnswer && !a.is_correct
                          ? "bg-destructive/10 text-destructive line-through"
                          : "text-muted-foreground"
                      }`}
                    >
                      <span className="font-bold shrink-0">{key})</span>
                      <span>{getOptionText(a.question, key)}</span>
                    </div>
                  );
                })}
              </div>

              {a.question.explanation && (
                <div className="mt-3 p-3 bg-muted rounded-lg text-sm">
                  <p className="font-semibold text-xs text-primary mb-1">💡 Explicação</p>
                  <p className="text-muted-foreground">{a.question.explanation}</p>
                </div>
              )}
            </CardContent>
          </Card>
        ))}
      </div>
    </div>
  );
}
