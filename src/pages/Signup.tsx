import { useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import { supabase } from "@/integrations/supabase/client";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { toast } from "@/hooks/use-toast";
import { GraduationCap, Sparkles } from "lucide-react";

export default function Signup() {
  const [fullName, setFullName] = useState("");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [loading, setLoading] = useState(false);

  const handleSignup = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    const { error } = await supabase.auth.signUp({
      email,
      password,
      options: {
        data: { full_name: fullName },
        emailRedirectTo: window.location.origin,
      },
    });
    setLoading(false);
    if (error) {
      toast({ title: "Erro no cadastro", description: error.message, variant: "destructive" });
    } else {
      toast({ title: "Cadastro realizado! 🎉", description: "Verifique seu e-mail para confirmar a conta." });
    }
  };

  return (
    <div className="min-h-screen flex">
      <div className="hidden lg:flex lg:w-1/2 gradient-hero items-center justify-center p-12">
        <div className="text-center text-primary-foreground max-w-md animate-fade-in">
          <GraduationCap className="h-20 w-20 mx-auto mb-6" />
          <h1 className="font-display text-4xl font-bold mb-4">Comece sua jornada!</h1>
          <p className="text-lg opacity-90">Milhares de questões te esperam. Pratique, evolua e conquiste sua vaga! 💪</p>
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
            <CardTitle className="font-display text-2xl">Criar conta ✨</CardTitle>
            <CardDescription>É grátis! Comece a estudar agora mesmo</CardDescription>
          </CardHeader>
          <CardContent>
            <form onSubmit={handleSignup} className="space-y-4">
              <div className="space-y-2">
                <Label htmlFor="name">Nome completo</Label>
                <Input id="name" placeholder="Seu nome" value={fullName} onChange={e => setFullName(e.target.value)} required />
              </div>
              <div className="space-y-2">
                <Label htmlFor="email">E-mail</Label>
                <Input id="email" type="email" placeholder="seu@email.com" value={email} onChange={e => setEmail(e.target.value)} required />
              </div>
              <div className="space-y-2">
                <Label htmlFor="password">Senha</Label>
                <Input id="password" type="password" placeholder="Mínimo 6 caracteres" value={password} onChange={e => setPassword(e.target.value)} required minLength={6} />
              </div>
              <Button type="submit" className="w-full gradient-primary text-primary-foreground font-semibold" disabled={loading}>
                {loading ? "Criando conta..." : <><Sparkles className="h-4 w-4 mr-2" /> Criar minha conta</>}
              </Button>
            </form>
            <p className="text-center text-sm text-muted-foreground mt-6">
              Já tem conta?{" "}
              <Link to="/login" className="text-primary font-semibold hover:underline">Fazer login</Link>
            </p>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
