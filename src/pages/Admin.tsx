import { useEffect, useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { toast } from "@/hooks/use-toast";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { ShieldCheck, Plus, Upload, BookOpen, Users, FileText, Trash2 } from "lucide-react";

interface Subject { id: string; name: string; color: string; }
interface QuestionRow { id: string; statement: string; correct_answer: string; difficulty: number; subject_id: string; }

export default function Admin() {
  const [subjects, setSubjects] = useState<Subject[]>([]);
  const [questions, setQuestions] = useState<QuestionRow[]>([]);
  const [filterSubject, setFilterSubject] = useState<string>("all");
  const [stats, setStats] = useState({ questions: 0, users: 0, exams: 0 });
  const [dialogOpen, setDialogOpen] = useState(false);

  // New question form
  const [form, setForm] = useState({
    subject_id: "", statement: "", option_a: "", option_b: "", option_c: "", option_d: "", option_e: "",
    correct_answer: "A", explanation: "", difficulty: 3,
  });

  useEffect(() => {
    loadData();
  }, []);

  const loadData = async () => {
    const [{ data: subs }, { count: qCount }, { count: eCount }] = await Promise.all([
      supabase.from("subjects").select("*").order("name"),
      supabase.from("questions").select("*", { count: "exact", head: true }),
      supabase.from("exams").select("*", { count: "exact", head: true }),
    ]);
    if (subs) setSubjects(subs as Subject[]);
    setStats({ questions: qCount || 0, users: 0, exams: eCount || 0 });
    loadQuestions();
  };

  const loadQuestions = async () => {
    let query = supabase.from("questions").select("id, statement, correct_answer, difficulty, subject_id").order("created_at", { ascending: false }).limit(100);
    if (filterSubject !== "all") query = query.eq("subject_id", filterSubject);
    const { data } = await query;
    if (data) setQuestions(data as QuestionRow[]);
  };

  useEffect(() => { loadQuestions(); }, [filterSubject]);

  const handleCreateQuestion = async () => {
    if (!form.subject_id || !form.statement || !form.option_a) {
      toast({ title: "Preencha todos os campos obrigatórios", variant: "destructive" });
      return;
    }
    const { error } = await supabase.from("questions").insert({
      ...form,
      difficulty: form.difficulty,
    });
    if (error) {
      toast({ title: "Erro ao criar questão", description: error.message, variant: "destructive" });
    } else {
      toast({ title: "Questão criada! ✅" });
      setForm({ subject_id: "", statement: "", option_a: "", option_b: "", option_c: "", option_d: "", option_e: "", correct_answer: "A", explanation: "", difficulty: 3 });
      setDialogOpen(false);
      loadQuestions();
      loadData();
    }
  };

  const handleDelete = async (id: string) => {
    await supabase.from("questions").delete().eq("id", id);
    toast({ title: "Questão excluída" });
    loadQuestions();
    loadData();
  };

  const handleImportCSV = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    const text = await file.text();
    try {
      const lines = text.split("\n").filter(Boolean);
      const headers = lines[0].split(",").map(h => h.trim().toLowerCase());
      const rows = lines.slice(1).map(line => {
        const values = line.split(",");
        const obj: Record<string, string> = {};
        headers.forEach((h, i) => obj[h] = values[i]?.trim() || "");
        return obj;
      });

      const insertData = rows.map(r => ({
        subject_id: r.subject_id,
        statement: r.statement || r.enunciado,
        option_a: r.option_a || r.a,
        option_b: r.option_b || r.b,
        option_c: r.option_c || r.c,
        option_d: r.option_d || r.d,
        option_e: r.option_e || r.e,
        correct_answer: (r.correct_answer || r.resposta || "A").toUpperCase(),
        explanation: r.explanation || r.comentario || "",
        difficulty: parseInt(r.difficulty || "3"),
      }));

      const { error } = await supabase.from("questions").insert(insertData);
      if (error) throw error;
      toast({ title: `${insertData.length} questões importadas! 🎉` });
      loadQuestions();
      loadData();
    } catch (err: any) {
      toast({ title: "Erro na importação", description: err.message, variant: "destructive" });
    }
  };

  return (
    <div className="space-y-6 animate-fade-in">
      <div>
        <h1 className="font-display text-3xl font-bold flex items-center gap-2">
          <ShieldCheck className="h-8 w-8 text-primary" /> Painel Admin
        </h1>
        <p className="text-muted-foreground">Gerencie questões e conteúdos</p>
      </div>

      <div className="grid grid-cols-3 gap-4">
        <Card className="border-0 shadow-lg">
          <CardContent className="p-4 flex items-center gap-3">
            <FileText className="h-8 w-8 text-primary" />
            <div>
              <p className="font-display text-2xl font-bold">{stats.questions}</p>
              <p className="text-xs text-muted-foreground">Questões</p>
            </div>
          </CardContent>
        </Card>
        <Card className="border-0 shadow-lg">
          <CardContent className="p-4 flex items-center gap-3">
            <Users className="h-8 w-8 text-secondary" />
            <div>
              <p className="font-display text-2xl font-bold">{stats.users}</p>
              <p className="text-xs text-muted-foreground">Usuários</p>
            </div>
          </CardContent>
        </Card>
        <Card className="border-0 shadow-lg">
          <CardContent className="p-4 flex items-center gap-3">
            <BookOpen className="h-8 w-8 text-accent" />
            <div>
              <p className="font-display text-2xl font-bold">{stats.exams}</p>
              <p className="text-xs text-muted-foreground">Simulados</p>
            </div>
          </CardContent>
        </Card>
      </div>

      <Card className="border-0 shadow-lg">
        <CardHeader className="flex flex-row items-center justify-between">
          <CardTitle className="font-display text-lg">Banco de Questões</CardTitle>
          <div className="flex gap-2">
            <label className="cursor-pointer">
              <input type="file" accept=".csv" onChange={handleImportCSV} className="hidden" />
              <Button variant="outline" size="sm" className="gap-1" asChild>
                <span><Upload className="h-4 w-4" /> Importar CSV</span>
              </Button>
            </label>
            <Dialog open={dialogOpen} onOpenChange={setDialogOpen}>
              <DialogTrigger asChild>
                <Button size="sm" className="gradient-primary text-primary-foreground gap-1">
                  <Plus className="h-4 w-4" /> Nova Questão
                </Button>
              </DialogTrigger>
              <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
                <DialogHeader>
                  <DialogTitle className="font-display">Cadastrar Questão</DialogTitle>
                </DialogHeader>
                <div className="space-y-4">
                  <div className="grid grid-cols-2 gap-4">
                    <div>
                      <Label>Matéria</Label>
                      <Select value={form.subject_id} onValueChange={v => setForm(f => ({ ...f, subject_id: v }))}>
                        <SelectTrigger><SelectValue placeholder="Selecione" /></SelectTrigger>
                        <SelectContent>{subjects.map(s => <SelectItem key={s.id} value={s.id}>{s.name}</SelectItem>)}</SelectContent>
                      </Select>
                    </div>
                    <div>
                      <Label>Resposta Correta</Label>
                      <Select value={form.correct_answer} onValueChange={v => setForm(f => ({ ...f, correct_answer: v }))}>
                        <SelectTrigger><SelectValue /></SelectTrigger>
                        <SelectContent>{["A","B","C","D","E"].map(o => <SelectItem key={o} value={o}>{o}</SelectItem>)}</SelectContent>
                      </Select>
                    </div>
                  </div>
                  <div>
                    <Label>Enunciado</Label>
                    <Textarea rows={4} value={form.statement} onChange={e => setForm(f => ({ ...f, statement: e.target.value }))} />
                  </div>
                  {["A","B","C","D","E"].map(key => (
                    <div key={key}>
                      <Label>Alternativa {key}</Label>
                      <Input value={(form as any)[`option_${key.toLowerCase()}`]} onChange={e => setForm(f => ({ ...f, [`option_${key.toLowerCase()}`]: e.target.value }))} />
                    </div>
                  ))}
                  <div>
                    <Label>Explicação (opcional)</Label>
                    <Textarea rows={2} value={form.explanation} onChange={e => setForm(f => ({ ...f, explanation: e.target.value }))} />
                  </div>
                  <Button onClick={handleCreateQuestion} className="w-full gradient-primary text-primary-foreground font-semibold">Salvar Questão</Button>
                </div>
              </DialogContent>
            </Dialog>
          </div>
        </CardHeader>
        <CardContent>
          <div className="mb-4">
            <Select value={filterSubject} onValueChange={setFilterSubject}>
              <SelectTrigger className="w-48"><SelectValue placeholder="Filtrar matéria" /></SelectTrigger>
              <SelectContent>
                <SelectItem value="all">Todas</SelectItem>
                {subjects.map(s => <SelectItem key={s.id} value={s.id}>{s.name}</SelectItem>)}
              </SelectContent>
            </Select>
          </div>
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Enunciado</TableHead>
                <TableHead className="w-20">Resp.</TableHead>
                <TableHead className="w-20">Dif.</TableHead>
                <TableHead className="w-16"></TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {questions.map(q => (
                <TableRow key={q.id}>
                  <TableCell className="max-w-md truncate text-sm">{q.statement}</TableCell>
                  <TableCell className="font-bold text-primary">{q.correct_answer}</TableCell>
                  <TableCell>{"⭐".repeat(q.difficulty || 1)}</TableCell>
                  <TableCell>
                    <Button variant="ghost" size="icon" className="text-destructive" onClick={() => handleDelete(q.id)}>
                      <Trash2 className="h-4 w-4" />
                    </Button>
                  </TableCell>
                </TableRow>
              ))}
              {questions.length === 0 && (
                <TableRow><TableCell colSpan={4} className="text-center text-muted-foreground py-8">Nenhuma questão cadastrada</TableCell></TableRow>
              )}
            </TableBody>
          </Table>
        </CardContent>
      </Card>
    </div>
  );
}
