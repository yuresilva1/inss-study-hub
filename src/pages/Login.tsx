import { useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import { supabase } from "@/integrations/supabase/client";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { toast } from "@/hooks/use-toast";
import { GraduationCap, Rocket } from "lucide-react";

export default function Login() {
  const navigate = useNavigate();
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [loading, setLoading] = useState(false);

  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    const { error } = await supabase.auth.signInWithPassword({ email, password });
    setLoading(false);
    if (error) {
      toast({ title: "Erro ao entrar", description: error.message, variant: "destructive" });
    } else {
      navigate("/");
    }
  };

  return (
    <div className="min-h-screen flex">
      <div className="hidden lg:flex lg:w-1/2 gradient-hero items-center justify-center p-12">
        <div className="text-center text-primary-foreground max-w-md animate-fade-in">
          <GraduationCap className="h-20 w-20 mx-auto mb-6" />
          <h1 className="font-display text-4xl font-bold mb-4">SimulaINSS</h1>
          <p className="text-lg opacity-90">Sua preparação para o concurso de Técnico do Seguro Social começa aqui! 🚀</p>
          <div className="mt-8 grid grid-cols-2 gap-4 text-sm">
            <div className="bg-primary-foreground/10 rounded-xl p-4 backdrop-blur-sm">
              <p className="font-bold text-2xl">8</p>
              <p className="opacity-80">Matérias</p>
            </div>
            <div className="bg-primary-foreground/10 rounded-xl p-4 backdrop-blur-sm">
              <p className="font-bold text-2xl">∞</p>
              <p className="opacity-80">Simulados</p>
            </div>
          </div>
        </div>
      </div>

      <div className="flex-1 flex items-center justify-center p-6">
        <Card className="w-full max-w-md border-0 shadow-2xl animate-scale-in">
          <CardHeader className="text-center">
            <div className="flex items-center justify-center gap-2 mb-2 lg:hidden">
              <div className="h-10 w-10 rounded-xl gradient-primary flex items-center justify-center">
                <GraduationCap className="h-6 w-6 text-primary-foreground" />
              </div>
              <span className="font-display font-bold text-xl">SimulaINSS</span>
            </div>
            <CardTitle className="font-display text-2xl">Bem-vindo de volta! 👋</CardTitle>
            <CardDescription>Entre para continuar seus estudos</CardDescription>
          </CardHeader>
          <CardContent>
            <form onSubmit={handleLogin} className="space-y-4">
              <div className="space-y-2">
                <Label htmlFor="email">E-mail</Label>
                <Input id="email" type="email" placeholder="seu@email.com" value={email} onChange={e => setEmail(e.target.value)} required />
              </div>
              <div className="space-y-2">
                <div className="flex items-center justify-between">
                  <Label htmlFor="password">Senha</Label>
                  <Link to="/forgot-password" className="text-xs text-primary hover:underline">Esqueceu a senha?</Link>
                </div>
                <Input id="password" type="password" placeholder="••••••••" value={password} onChange={e => setPassword(e.target.value)} required />
              </div>
              <Button type="submit" className="w-full gradient-primary text-primary-foreground font-semibold" disabled={loading}>
                {loading ? "Entrando..." : <><Rocket className="h-4 w-4 mr-2" /> Entrar</>}
              </Button>
            </form>
            <p className="text-center text-sm text-muted-foreground mt-6">
              Não tem conta?{" "}
              <Link to="/signup" className="text-primary font-semibold hover:underline">Cadastre-se grátis</Link>
            </p>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
