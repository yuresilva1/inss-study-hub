import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/hooks/useAuth";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Label } from "@/components/ui/label";
import { Slider } from "@/components/ui/slider";
import { Checkbox } from "@/components/ui/checkbox";
import { toast } from "@/hooks/use-toast";
import { Rocket, BookOpen, Clock, Shuffle, Layers } from "lucide-react";

interface Subject {
  id: string;
  name: string;
  color: string;
  icon: string;
}

export default function NewExam() {
  const navigate = useNavigate();
  const { user } = useAuth();
  const [subjects, setSubjects] = useState<Subject[]>([]);
  const [selectedSubjects, setSelectedSubjects] = useState<string[]>([]);
  const [questionCount, setQuestionCount] = useState(20);
  const [timeLimit, setTimeLimit] = useState(60);
  const [mode, setMode] = useState<"random" | "thematic">("random");
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    supabase.from("subjects").select("*").order("name").then(({ data }) => {
      if (data) setSubjects(data as Subject[]);
    });
  }, []);

  const toggleSubject = (id: string) => {
    setSelectedSubjects((prev) =>
      prev.includes(id) ? prev.filter((s) => s !== id) : [...prev, id]
    );
  };

  const handleStart = async () => {
    if (selectedSubjects.length === 0) {
      toast({ title: "Selecione ao menos uma matéria", variant: "destructive" });
      return;
    }
    if (!user) return;

    setLoading(true);

    // Fetch random questions
    const { data: questions } = await supabase
      .from("questions")
      .select("id")
      .in("subject_id", selectedSubjects)
      .limit(200);

    if (!questions || questions.length === 0) {
      toast({ title: "Sem questões disponíveis", description: "Não há questões cadastradas para as matérias selecionadas.", variant: "destructive" });
      setLoading(false);
      return;
    }

    // Shuffle and pick
    const shuffled = questions.sort(() => Math.random() - 0.5).slice(0, questionCount);

    // Create exam
    const { data: exam, error } = await supabase
      .from("exams")
      .insert({
        user_id: user.id,
        subject_ids: selectedSubjects,
        total_questions: shuffled.length,
        time_limit_minutes: timeLimit,
        mode,
      })
      .select()
      .single();

    if (error || !exam) {
      toast({ title: "Erro ao criar simulado", variant: "destructive" });
      setLoading(false);
      return;
    }

    // Create answers placeholder
    const answersToInsert = shuffled.map((q, i) => ({
      exam_id: exam.id,
      question_id: q.id,
      question_order: i + 1,
    }));

    await supabase.from("exam_answers").insert(answersToInsert);

    setLoading(false);
    navigate(`/exam/${exam.id}`);
  };

  return (
    <div className="max-w-2xl mx-auto space-y-6 animate-fade-in">
      <div>
        <h1 className="font-display text-3xl font-bold">Novo Simulado 📝</h1>
        <p className="text-muted-foreground">Configure seu simulado e comece a praticar</p>
      </div>

      <Card className="border-0 shadow-lg">
        <CardHeader>
          <CardTitle className="font-display text-lg flex items-center gap-2">
            <BookOpen className="h-5 w-5 text-primary" /> Selecione as matérias
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            {subjects.map((s) => (
              <label
                key={s.id}
                className={`flex items-center gap-3 p-3 rounded-xl border-2 cursor-pointer transition-all ${
                  selectedSubjects.includes(s.id)
                    ? "border-primary bg-primary/5 shadow-md"
                    : "border-border hover:border-primary/30"
                }`}
              >
                <Checkbox
                  checked={selectedSubjects.includes(s.id)}
                  onCheckedChange={() => toggleSubject(s.id)}
                />
                <div className="h-3 w-3 rounded-full" style={{ backgroundColor: s.color }} />
                <span className="font-medium text-sm">{s.name}</span>
              </label>
            ))}
          </div>
          {subjects.length > 0 && (
            <Button
              variant="ghost"
              size="sm"
              className="mt-3 text-xs"
              onClick={() =>
                setSelectedSubjects(
                  selectedSubjects.length === subjects.length ? [] : subjects.map((s) => s.id)
                )
              }
            >
              {selectedSubjects.length === subjects.length ? "Desmarcar todas" : "Selecionar todas"}
            </Button>
          )}
        </CardContent>
      </Card>

      <div className="grid sm:grid-cols-2 gap-4">
        <Card className="border-0 shadow-lg">
          <CardContent className="p-6 space-y-4">
            <Label className="flex items-center gap-2 font-display font-semibold">
              <BookOpen className="h-4 w-4 text-primary" /> Questões: {questionCount}
            </Label>
            <Slider value={[questionCount]} onValueChange={([v]) => setQuestionCount(v)} min={5} max={50} step={5} />
          </CardContent>
        </Card>

        <Card className="border-0 shadow-lg">
          <CardContent className="p-6 space-y-4">
            <Label className="flex items-center gap-2 font-display font-semibold">
              <Clock className="h-4 w-4 text-secondary" /> Tempo: {timeLimit} min
            </Label>
            <Slider value={[timeLimit]} onValueChange={([v]) => setTimeLimit(v)} min={15} max={180} step={15} />
          </CardContent>
        </Card>
      </div>

      <Card className="border-0 shadow-lg">
        <CardContent className="p-6">
          <Label className="font-display font-semibold mb-3 block">Modo</Label>
          <div className="flex gap-3">
            <Button
              variant={mode === "random" ? "default" : "outline"}
              className={mode === "random" ? "gradient-primary text-primary-foreground" : ""}
              onClick={() => setMode("random")}
            >
              <Shuffle className="h-4 w-4 mr-2" /> Aleatório
            </Button>
            <Button
              variant={mode === "thematic" ? "default" : "outline"}
              className={mode === "thematic" ? "gradient-primary text-primary-foreground" : ""}
              onClick={() => setMode("thematic")}
            >
              <Layers className="h-4 w-4 mr-2" /> Temático
            </Button>
          </div>
        </CardContent>
      </Card>

      <Button
        onClick={handleStart}
        disabled={loading || selectedSubjects.length === 0}
        className="w-full gradient-primary text-primary-foreground font-bold text-lg h-14 shadow-lg animate-pulse-glow"
      >
        {loading ? "Preparando..." : <><Rocket className="h-5 w-5 mr-2" /> Iniciar Simulado</>}
      </Button>
    </div>
  );
}
