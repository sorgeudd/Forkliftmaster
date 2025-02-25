import { useAuth } from "@/hooks/use-auth";
import { useLocation } from "wouter";
import { Card, CardHeader, CardTitle, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { useI18n } from "@/lib/i18n";
import { LanguageToggle } from "@/components/language-toggle";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { insertUserSchema, type InsertUser } from "@shared/schema";
import { useEffect } from "react";

export default function AuthPage() {
  const [, setLocation] = useLocation();
  const { t } = useI18n();
  const { user, loginMutation, registerMutation } = useAuth();

  const form = useForm<InsertUser>({
    resolver: zodResolver(insertUserSchema),
  });

  useEffect(() => {
    if (user) {
      setLocation("/");
    }
  }, [user, setLocation]);

  return (
    <div className="min-h-screen bg-black flex items-center justify-center p-4">
      <div className="w-full max-w-4xl grid md:grid-cols-2 gap-6">
        <Card className="bg-zinc-900/50 border-zinc-800">
          <CardHeader>
            <div className="flex justify-between items-center">
              <CardTitle className="text-2xl font-black tracking-tight uppercase">
                <span className="bg-gradient-to-r from-primary via-primary/90 to-primary/60 text-transparent bg-clip-text">
                  Forklift Master
                </span>
              </CardTitle>
              <LanguageToggle />
            </div>
          </CardHeader>
          <CardContent>
            <Tabs defaultValue="login">
              <TabsList className="grid w-full grid-cols-2 bg-zinc-800/50">
                <TabsTrigger value="login">{t("auth.login")}</TabsTrigger>
                <TabsTrigger value="register">{t("auth.register")}</TabsTrigger>
              </TabsList>

              <TabsContent value="login">
                <form
                  onSubmit={form.handleSubmit((data) => loginMutation.mutate(data))}
                  className="space-y-4"
                >
                  <div className="space-y-2">
                    <Label>{t("auth.username")}</Label>
                    <Input 
                      {...form.register("username")} 
                      className="bg-zinc-800/50 border-zinc-700"
                    />
                  </div>
                  <div className="space-y-2">
                    <Label>{t("auth.password")}</Label>
                    <Input 
                      type="password" 
                      {...form.register("password")} 
                      className="bg-zinc-800/50 border-zinc-700"
                    />
                  </div>
                  <Button type="submit" className="w-full bg-primary text-primary-foreground hover:bg-primary/90 font-bold">
                    {t("auth.login")}
                  </Button>
                </form>
              </TabsContent>

              <TabsContent value="register">
                <form
                  onSubmit={form.handleSubmit((data) => registerMutation.mutate(data))}
                  className="space-y-4"
                >
                  <div className="space-y-2">
                    <Label>{t("auth.username")}</Label>
                    <Input 
                      {...form.register("username")} 
                      className="bg-zinc-800/50 border-zinc-700"
                    />
                  </div>
                  <div className="space-y-2">
                    <Label>{t("auth.password")}</Label>
                    <Input 
                      type="password" 
                      {...form.register("password")} 
                      className="bg-zinc-800/50 border-zinc-700"
                    />
                  </div>
                  <Button type="submit" className="w-full bg-primary text-primary-foreground hover:bg-primary/90 font-bold">
                    {t("auth.register")}
                  </Button>
                </form>
              </TabsContent>
            </Tabs>
          </CardContent>
        </Card>

        <div className="hidden md:flex flex-col justify-center text-zinc-300">
          <h1 className="text-5xl font-black uppercase tracking-tight mb-6">
            <span className="bg-gradient-to-r from-[#FFD700] via-primary to-[#DAA520] text-transparent bg-clip-text">
              Forklift Master
            </span>
          </h1>
          <p className="text-lg text-zinc-400">
            Track your forklift maintenance schedules, service intervals, and keep detailed records of filters and lubricants all in one place.
          </p>
        </div>
      </div>
    </div>
  );
}