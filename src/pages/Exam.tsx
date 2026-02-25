import { useEffect, useState, useCallback, useRef } from "react";
import { useParams, useNavigate } from "react-router-dom";
import { supabase } from "@/integrations/supabase/client";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { toast } from "@/hooks/use-toast";
import { AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent, AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle, AlertDialogTrigger } from "@/components/ui/alert-dialog";
import { Flag, ChevronLeft, ChevronRight, Clock, Send } from "lucide-react";

interface Answer {
  id: string;
  question_id: string;
  user_answer: string | null;
  is_flagged: boolean;
  question_order: number;
  time_spent_seconds: number;
}

interface Question {
  id: string;
  statement: string;
  option_a: string;
  option_b: string;
  option_c: string;
  option_d: string;
  option_e: string;
}

export default function Exam() {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const [answers, setAnswers] = useState<Answer[]>([]);
  const [questions, setQuestions] = useState<Map<string, Question>>(new Map());
  const [currentIdx, setCurrentIdx] = useState(0);
  const [timeLeft, setTimeLeft] = useState(0);
  const [examLoaded, setExamLoaded] = useState(false);
  const questionStartRef = useRef(Date.now());

  useEffect(() => {
    if (!id) return;
    const load = async () => {
      const { data: exam } = await supabase.from("exams").select("*").eq("id", id).single();
      if (!exam || exam.status === "finished") {
        navigate(`/result/${id}`);
        return;
      }

      setTimeLeft((exam.time_limit_minutes || 60) * 60);

      const { data: answerData } = await supabase
        .from("exam_answers")
        .select("*")
        .eq("exam_id", id)
        .order("question_order");

      if (!answerData) return;
      setAnswers(answerData as Answer[]);

      const qIds = answerData.map((a) => a.question_id);
      const { data: qData } = await supabase
        .from("questions")
        .select("id, statement, option_a, option_b, option_c, option_d, option_e")
        .in("id", qIds);

      if (qData) {
        setQuestions(new Map(qData.map((q) => [q.id, q as Question])));
      }
      setExamLoaded(true);
    };
    load();
  }, [id, navigate]);

  // Timer
  useEffect(() => {
    if (!examLoaded || timeLeft <= 0) return;
    const interval = setInterval(() => {
      setTimeLeft((prev) => {
        if (prev <= 1) {
          clearInterval(interval);
          finishExam();
          return 0;
        }
        return prev - 1;
      });
    }, 1000);
    return () => clearInterval(interval);
  }, [examLoaded]);

  const trackTime = useCallback(() => {
    const elapsed = Math.round((Date.now() - questionStartRef.current) / 1000);
    setAnswers((prev) => {
      const updated = [...prev];
      if (updated[currentIdx]) {
        updated[currentIdx] = {
          ...updated[currentIdx],
          time_spent_seconds: (updated[currentIdx].time_spent_seconds || 0) + elapsed,
        };
      }
      return updated;
    });
    questionStartRef.current = Date.now();
  }, [currentIdx]);

  const selectAnswer = async (option: string) => {
    const answer = answers[currentIdx];
    if (!answer) return;

    const updated = [...answers];
    updated[currentIdx] = { ...updated[currentIdx], user_answer: option };
    setAnswers(updated);

    await supabase
      .from("exam_answers")
      .update({ user_answer: option })
      .eq("id", answer.id);
  };

  const toggleFlag = async () => {
    const answer = answers[currentIdx];
    if (!answer) return;

    const newFlag = !answer.is_flagged;
    const updated = [...answers];
    updated[currentIdx] = { ...updated[currentIdx], is_flagged: newFlag };
    setAnswers(updated);

    await supabase.from("exam_answers").update({ is_flagged: newFlag }).eq("id", answer.id);
  };

  const goTo = (idx: number) => {
    trackTime();
    setCurrentIdx(idx);
  };

  const finishExam = async () => {
    trackTime();
    if (!id) return;

    // Save time for current question
    for (const a of answers) {
      await supabase
        .from("exam_answers")
        .update({ time_spent_seconds: a.time_spent_seconds })
        .eq("id", a.id);
    }

    // Calculate score
    const questionIds = answers.map((a) => a.question_id);
    const { data: qFull } = await supabase
      .from("questions")
      .select("id, correct_answer")
      .in("id", questionIds);

    if (!qFull) return;
    const correctMap = new Map(qFull.map((q) => [q.id, q.correct_answer]));

    let totalCorrect = 0;
    for (const a of answers) {
      const isCorrect = a.user_answer === correctMap.get(a.question_id);
      if (isCorrect) totalCorrect++;
      await supabase.from("exam_answers").update({ is_correct: isCorrect }).eq("id", a.id);
    }

    const score = answers.length > 0 ? (totalCorrect / answers.length) * 100 : 0;
    const totalTime = answers.reduce((sum, a) => sum + (a.time_spent_seconds || 0), 0);

    await supabase
      .from("exams")
      .update({
        status: "finished",
        score,
        total_correct: totalCorrect,
        time_spent_seconds: totalTime,
        finished_at: new Date().toISOString(),
      })
      .eq("id", id);

    navigate(`/result/${id}`);
  };

  if (!examLoaded) {
    return (
      <div className="flex min-h-[60vh] items-center justify-center">
        <div className="h-12 w-12 animate-spin rounded-full border-4 border-primary border-t-transparent" />
      </div>
    );
  }

  const currentAnswer = answers[currentIdx];
  const currentQuestion = currentAnswer ? questions.get(currentAnswer.question_id) : null;
  const minutes = Math.floor(timeLeft / 60);
  const seconds = timeLeft % 60;
  const isLowTime = timeLeft < 300;

  const options = currentQuestion
    ? [
        { key: "A", text: currentQuestion.option_a },
        { key: "B", text: currentQuestion.option_b },
        { key: "C", text: currentQuestion.option_c },
        { key: "D", text: currentQuestion.option_d },
        { key: "E", text: currentQuestion.option_e },
      ]
    : [];

  return (
    <div className="max-w-4xl mx-auto space-y-4 animate-fade-in">
      {/* Timer bar */}
      <div className={`flex items-center justify-between p-3 rounded-xl ${isLowTime ? "bg-destructive/10 border border-destructive/30" : "bg-card shadow-md"}`}>
        <div className="flex items-center gap-2">
          <Clock className={`h-5 w-5 ${isLowTime ? "text-destructive animate-pulse" : "text-muted-foreground"}`} />
          <span className={`font-display font-bold text-lg ${isLowTime ? "text-destructive" : ""}`}>
            {String(minutes).padStart(2, "0")}:{String(seconds).padStart(2, "0")}
          </span>
        </div>
        <span className="text-sm text-muted-foreground font-medium">
          {currentIdx + 1} de {answers.length}
        </span>
        <AlertDialog>
          <AlertDialogTrigger asChild>
            <Button size="sm" className="gradient-primary text-primary-foreground gap-1">
              <Send className="h-4 w-4" /> Finalizar
            </Button>
          </AlertDialogTrigger>
          <AlertDialogContent>
            <AlertDialogHeader>
              <AlertDialogTitle>Finalizar simulado?</AlertDialogTitle>
              <AlertDialogDescription>
                {answers.filter((a) => !a.user_answer).length} questões não respondidas. Deseja finalizar mesmo assim?
              </AlertDialogDescription>
            </AlertDialogHeader>
            <AlertDialogFooter>
              <AlertDialogCancel>Continuar</AlertDialogCancel>
              <AlertDialogAction onClick={finishExam}>Finalizar</AlertDialogAction>
            </AlertDialogFooter>
          </AlertDialogContent>
        </AlertDialog>
      </div>

      {/* Navigation grid */}
      <div className="flex flex-wrap gap-1.5">
        {answers.map((a, i) => (
          <button
            key={a.id}
            onClick={() => goTo(i)}
            className={`h-8 w-8 rounded-lg text-xs font-bold transition-all ${
              i === currentIdx
                ? "gradient-primary text-primary-foreground shadow-md scale-110"
                : a.user_answer
                ? "bg-success/20 text-success border border-success/30"
                : a.is_flagged
                ? "bg-accent/20 text-accent border border-accent/30"
                : "bg-muted text-muted-foreground"
            }`}
          >
            {i + 1}
          </button>
        ))}
      </div>

      {/* Question */}
      {currentQuestion && (
        <Card className="border-0 shadow-lg">
          <CardContent className="p-6">
            <div className="flex items-start justify-between mb-4">
              <span className="text-xs font-semibold text-muted-foreground bg-muted px-3 py-1 rounded-full">
                Questão {currentIdx + 1}
              </span>
              <Button variant="ghost" size="icon" onClick={toggleFlag} className={currentAnswer?.is_flagged ? "text-accent" : "text-muted-foreground"}>
                <Flag className="h-4 w-4" />
              </Button>
            </div>

            <p className="text-base leading-relaxed mb-6 whitespace-pre-wrap">{currentQuestion.statement}</p>

            <div className="space-y-2">
              {options.map((opt) => (
                <button
                  key={opt.key}
                  onClick={() => selectAnswer(opt.key)}
                  className={`w-full text-left p-4 rounded-xl border-2 transition-all flex items-start gap-3 ${
                    currentAnswer?.user_answer === opt.key
                      ? "border-primary bg-primary/5 shadow-md"
                      : "border-border hover:border-primary/30 hover:bg-muted/50"
                  }`}
                >
                  <span className={`h-8 w-8 shrink-0 rounded-lg flex items-center justify-center font-bold text-sm ${
                    currentAnswer?.user_answer === opt.key
                      ? "gradient-primary text-primary-foreground"
                      : "bg-muted text-muted-foreground"
                  }`}>
                    {opt.key}
                  </span>
                  <span className="text-sm leading-relaxed pt-1">{opt.text}</span>
                </button>
              ))}
            </div>
          </CardContent>
        </Card>
      )}

      {/* Nav buttons */}
      <div className="flex justify-between">
        <Button variant="outline" onClick={() => goTo(Math.max(0, currentIdx - 1))} disabled={currentIdx === 0}>
          <ChevronLeft className="h-4 w-4 mr-1" /> Anterior
        </Button>
        <Button variant="outline" onClick={() => goTo(Math.min(answers.length - 1, currentIdx + 1))} disabled={currentIdx === answers.length - 1}>
          Próxima <ChevronRight className="h-4 w-4 ml-1" />
        </Button>
      </div>
    </div>
  );
}
