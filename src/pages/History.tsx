import { useEffect, useState } from "react";
import { Link } from "react-router-dom";
import { supabase } from "@/integrations/supabase/client";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Clock, Target, Eye, History as HistoryIcon } from "lucide-react";

interface ExamRecord {
  id: string;
  score: number | null;
  total_questions: number;
  total_correct: number | null;
  time_spent_seconds: number | null;
  finished_at: string | null;
  status: string;
}

export default function History() {
  const [exams, setExams] = useState<ExamRecord[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    supabase
      .from("exams")
      .select("id, score, total_questions, total_correct, time_spent_seconds, finished_at, status")
      .order("started_at", { ascending: false })
      .then(({ data }) => {
        if (data) setExams(data as ExamRecord[]);
        setLoading(false);
      });
  }, []);

  if (loading) {
    return (
      <div className="flex min-h-[40vh] items-center justify-center">
        <div className="h-10 w-10 animate-spin rounded-full border-4 border-primary border-t-transparent" />
      </div>
    );
  }

  return (
    <div className="space-y-6 animate-fade-in">
      <div>
        <h1 className="font-display text-3xl font-bold flex items-center gap-2">
          <HistoryIcon className="h-8 w-8 text-primary" /> Histórico
        </h1>
        <p className="text-muted-foreground">Seus simulados realizados</p>
      </div>

      {exams.length === 0 ? (
        <Card className="border-0 shadow-lg">
          <CardContent className="p-8 text-center">
            <p className="text-muted-foreground">Nenhum simulado realizado ainda.</p>
            <Link to="/new-exam">
              <Button className="mt-4 gradient-primary text-primary-foreground">Fazer primeiro simulado</Button>
            </Link>
          </CardContent>
        </Card>
      ) : (
        <div className="space-y-3">
          {exams.map((exam) => {
            const score = Math.round(Number(exam.score) || 0);
            const minutes = Math.floor((exam.time_spent_seconds || 0) / 60);
            return (
              <Card key={exam.id} className="border-0 shadow-md hover:shadow-lg transition-shadow">
                <CardContent className="p-4 flex items-center justify-between">
                  <div className="flex items-center gap-4">
                    <div className={`h-12 w-12 rounded-xl flex items-center justify-center font-display font-bold text-lg ${
                      exam.status === "finished"
                        ? score >= 70 ? "bg-success/10 text-success" : score >= 50 ? "bg-accent/10 text-accent" : "bg-destructive/10 text-destructive"
                        : "bg-muted text-muted-foreground"
                    }`}>
                      {exam.status === "finished" ? `${score}%` : "..."}
                    </div>
                    <div>
                      <p className="font-semibold text-sm">
                        {exam.status === "finished"
                          ? `${exam.total_correct}/${exam.total_questions} questões`
                          : "Em andamento"}
                      </p>
                      <div className="flex items-center gap-3 text-xs text-muted-foreground mt-1">
                        {exam.finished_at && (
                          <span>{new Date(exam.finished_at).toLocaleDateString("pt-BR")}</span>
                        )}
                        {exam.time_spent_seconds != null && (
                          <span className="flex items-center gap-1"><Clock className="h-3 w-3" />{minutes}min</span>
                        )}
                      </div>
                    </div>
                  </div>
                  <Link to={exam.status === "finished" ? `/result/${exam.id}` : `/exam/${exam.id}`}>
                    <Button variant="outline" size="sm" className="gap-1">
                      <Eye className="h-3 w-3" /> {exam.status === "finished" ? "Ver" : "Continuar"}
                    </Button>
                  </Link>
                </CardContent>
              </Card>
            );
          })}
        </div>
      )}
    </div>
  );
}
