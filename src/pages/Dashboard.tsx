import { useEffect, useState } from "react";
import { useAuth } from "@/hooks/useAuth";
import { supabase } from "@/integrations/supabase/client";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Link } from "react-router-dom";
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, LineChart, Line } from "recharts";
import { Trophy, Target, Clock, BookOpen, Rocket, TrendingUp } from "lucide-react";

interface Stats {
  totalExams: number;
  totalCorrect: number;
  totalQuestions: number;
  avgTimePerQuestion: number;
}

interface SubjectPerf {
  name: string;
  percentage: number;
  color: string;
}

export default function Dashboard() {
  const { profile } = useAuth();
  const [stats, setStats] = useState<Stats>({ totalExams: 0, totalCorrect: 0, totalQuestions: 0, avgTimePerQuestion: 0 });
  const [subjectPerf, setSubjectPerf] = useState<SubjectPerf[]>([]);
  const [evolution, setEvolution] = useState<{ date: string; score: number }[]>([]);

  useEffect(() => {
    const fetchStats = async () => {
      const { data: exams } = await supabase
        .from("exams")
        .select("*")
        .eq("status", "finished")
        .order("finished_at", { ascending: true });

      if (!exams || exams.length === 0) return;

      const totalExams = exams.length;
      const totalCorrect = exams.reduce((sum, e) => sum + (e.total_correct || 0), 0);
      const totalQuestions = exams.reduce((sum, e) => sum + e.total_questions, 0);
      const totalTime = exams.reduce((sum, e) => sum + (e.time_spent_seconds || 0), 0);

      setStats({
        totalExams,
        totalCorrect,
        totalQuestions,
        avgTimePerQuestion: totalQuestions > 0 ? Math.round(totalTime / totalQuestions) : 0,
      });

      setEvolution(
        exams.map((e) => ({
          date: new Date(e.finished_at!).toLocaleDateString("pt-BR", { day: "2-digit", month: "2-digit" }),
          score: Number(e.score) || 0,
        }))
      );

      // Fetch subject performance
      const { data: subjects } = await supabase.from("subjects").select("id, name, color");
      if (!subjects) return;

      const examIds = exams.map((e) => e.id);
      const { data: answers } = await supabase
        .from("exam_answers")
        .select("question_id, is_correct")
        .in("exam_id", examIds);

      if (!answers) return;

      const { data: questions } = await supabase.from("questions").select("id, subject_id");
      if (!questions) return;

      const questionSubjectMap = new Map(questions.map((q) => [q.id, q.subject_id]));
      const perfMap = new Map<string, { correct: number; total: number }>();

      answers.forEach((a) => {
        const subjectId = questionSubjectMap.get(a.question_id);
        if (!subjectId) return;
        const curr = perfMap.get(subjectId) || { correct: 0, total: 0 };
        curr.total++;
        if (a.is_correct) curr.correct++;
        perfMap.set(subjectId, curr);
      });

      setSubjectPerf(
        subjects
          .filter((s) => perfMap.has(s.id))
          .map((s) => ({
            name: s.name,
            percentage: Math.round((perfMap.get(s.id)!.correct / perfMap.get(s.id)!.total) * 100),
            color: s.color || "#6366f1",
          }))
      );
    };

    fetchStats();
  }, []);

  const overallRate = stats.totalQuestions > 0 ? Math.round((stats.totalCorrect / stats.totalQuestions) * 100) : 0;

  const statCards = [
    { icon: Trophy, label: "Simulados", value: stats.totalExams, color: "text-accent" },
    { icon: Target, label: "Taxa de Acerto", value: `${overallRate}%`, color: "text-success" },
    { icon: Clock, label: "Tempo Médio/Questão", value: `${stats.avgTimePerQuestion}s`, color: "text-secondary" },
    { icon: BookOpen, label: "Questões Respondidas", value: stats.totalQuestions, color: "text-primary" },
  ];

  return (
    <div className="space-y-6 animate-fade-in">
      <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4">
        <div>
          <h1 className="font-display text-3xl font-bold">
            Olá, {profile?.full_name?.split(" ")[0] || "Aluno"}! 🎯
          </h1>
          <p className="text-muted-foreground">Continue evoluindo na sua preparação</p>
        </div>
        <Link to="/new-exam">
          <Button className="gradient-primary text-primary-foreground font-semibold gap-2">
            <Rocket className="h-4 w-4" /> Novo Simulado
          </Button>
        </Link>
      </div>

      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        {statCards.map((card) => (
          <Card key={card.label} className="border-0 shadow-lg hover:shadow-xl transition-shadow">
            <CardContent className="p-4 flex items-center gap-3">
              <div className={`h-10 w-10 rounded-xl bg-muted flex items-center justify-center ${card.color}`}>
                <card.icon className="h-5 w-5" />
              </div>
              <div>
                <p className="text-2xl font-display font-bold">{card.value}</p>
                <p className="text-xs text-muted-foreground">{card.label}</p>
              </div>
            </CardContent>
          </Card>
        ))}
      </div>

      <div className="grid lg:grid-cols-2 gap-6">
        {evolution.length > 0 && (
          <Card className="border-0 shadow-lg">
            <CardHeader>
              <CardTitle className="font-display text-lg flex items-center gap-2">
                <TrendingUp className="h-5 w-5 text-primary" /> Evolução
              </CardTitle>
            </CardHeader>
            <CardContent>
              <ResponsiveContainer width="100%" height={250}>
                <LineChart data={evolution}>
                  <CartesianGrid strokeDasharray="3 3" stroke="hsl(var(--border))" />
                  <XAxis dataKey="date" tick={{ fontSize: 12 }} stroke="hsl(var(--muted-foreground))" />
                  <YAxis domain={[0, 100]} tick={{ fontSize: 12 }} stroke="hsl(var(--muted-foreground))" />
                  <Tooltip />
                  <Line type="monotone" dataKey="score" stroke="hsl(var(--primary))" strokeWidth={3} dot={{ fill: "hsl(var(--primary))" }} />
                </LineChart>
              </ResponsiveContainer>
            </CardContent>
          </Card>
        )}

        {subjectPerf.length > 0 && (
          <Card className="border-0 shadow-lg">
            <CardHeader>
              <CardTitle className="font-display text-lg flex items-center gap-2">
                <Target className="h-5 w-5 text-success" /> Desempenho por Matéria
              </CardTitle>
            </CardHeader>
            <CardContent>
              <ResponsiveContainer width="100%" height={250}>
                <BarChart data={subjectPerf} layout="vertical">
                  <CartesianGrid strokeDasharray="3 3" stroke="hsl(var(--border))" />
                  <XAxis type="number" domain={[0, 100]} tick={{ fontSize: 12 }} />
                  <YAxis dataKey="name" type="category" width={120} tick={{ fontSize: 11 }} />
                  <Tooltip />
                  <Bar dataKey="percentage" fill="hsl(var(--primary))" radius={[0, 6, 6, 0]} />
                </BarChart>
              </ResponsiveContainer>
            </CardContent>
          </Card>
        )}
      </div>

      {stats.totalExams === 0 && (
        <Card className="border-0 shadow-lg gradient-primary text-primary-foreground">
          <CardContent className="p-8 text-center">
            <Rocket className="h-16 w-16 mx-auto mb-4 opacity-80" />
            <h2 className="font-display text-2xl font-bold mb-2">Comece agora!</h2>
            <p className="opacity-90 mb-4">Faça seu primeiro simulado e comece a acompanhar sua evolução</p>
            <Link to="/new-exam">
              <Button variant="secondary" className="font-semibold">Criar Simulado</Button>
            </Link>
          </CardContent>
        </Card>
      )}
    </div>
  );
}
