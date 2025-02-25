import { useAuth } from "@/hooks/use-auth";
import { useQuery, useMutation } from "@tanstack/react-query";
import { ServiceCard } from "@/components/service-card";
import { ForkliftForm } from "@/components/forklift-form";
import { Button } from "@/components/ui/button";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { LanguageToggle } from "@/components/language-toggle";
import { CompanySelector } from "@/components/company-selector";
import { useI18n } from "@/lib/i18n";
import { apiRequest, queryClient } from "@/lib/queryClient";
import type { Forklift, InsertForklift, Company } from "@shared/schema";
import { Plus, LogOut, Loader2 } from "lucide-react";
import { useToast } from "@/hooks/use-toast";
import { ForkliftTree } from "@/components/forklift-tree";
import { useState } from "react";
import { DynamicContent } from "@/components/dynamic-content";
import { useLocation } from "wouter";

export default function HomePage() {
  const { t } = useI18n();
  const { toast } = useToast();
  const { logoutMutation, user } = useAuth();
  const [, setLocation] = useLocation();
  const [selectedCompanyId, setSelectedCompanyId] = useState<number>();

  const { data: companies } = useQuery<Company[]>({
    queryKey: ["/api/companies"],
  });

  const { data: forklifts, isLoading, error } = useQuery<Forklift[]>({
    queryKey: ["/api/forklifts"],
  });

  const createForkliftMutation = useMutation({
    mutationFn: async (data: InsertForklift) => {
      if (!selectedCompanyId) {
        throw new Error('Please select a company first');
      }
      const forkliftData = { ...data, companyId: selectedCompanyId };
      const res = await apiRequest("POST", "/api/forklifts", forkliftData);
      return res.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/forklifts"] });
      toast({
        title: "Success",
        description: "Forklift added successfully",
      });
    },
    onError: (error: Error) => {
      toast({
        title: "Error",
        description: error.message,
        variant: "destructive",
      });
    },
  });

  const handleLogout = async () => {
    try {
      await logoutMutation.mutateAsync();
      setLocation('/auth');
    } catch (error) {
      console.error('Logout error:', error);
      toast({
        title: "Error",
        description: "Failed to logout. Please try again.",
        variant: "destructive",
      });
    }
  };

  const selectedCompany = companies?.find(c => c.id === selectedCompanyId);
  const displayForklifts = forklifts?.filter(f => f.companyId === selectedCompanyId) || [];

  return (
    <DynamicContent className="min-h-screen bg-background">
      <header className="sticky top-0 z-10 bg-background border-b">
        <div className="container mx-auto px-4">
          {/* First row: App title and language toggle */}
          <div className="h-16 flex items-center justify-between">
            <div className="space-y-1">
              <h1 className="text-2xl font-bold whitespace-nowrap">{t("app.title")}</h1>
              {user && (
                <div className="flex items-center gap-4">
                  <div className="flex items-center gap-2 text-sm">
                    <span className="text-muted-foreground">
                      Logged in as:
                    </span>
                    <span className="font-medium">
                      {user.username}
                    </span>
                  </div>
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={handleLogout}
                    disabled={logoutMutation.isPending}
                    className="flex items-center gap-2 whitespace-nowrap"
                  >
                    {logoutMutation.isPending ? (
                      <Loader2 className="h-4 w-4 animate-spin" />
                    ) : (
                      <LogOut className="h-4 w-4" />
                    )}
                    <span>{t("auth.logout")}</span>
                  </Button>
                </div>
              )}
            </div>
            <LanguageToggle />
          </div>

          {/* Second row: Company selector */}
          <div className="h-14 flex items-center border-t">
            <div className="w-full max-w-3xl mx-auto">
              <CompanySelector
                selectedCompanyId={selectedCompanyId}
                onCompanySelect={setSelectedCompanyId}
              />
            </div>
          </div>
        </div>
      </header>

      <main className="container mx-auto px-4 py-4 md:py-8">
        <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4 mb-6">
          <div>
            <h2 className="text-xl font-semibold">
              {selectedCompany ? selectedCompany.name : "My Forklifts"}
            </h2>
          </div>

          <Dialog>
            <DialogTrigger asChild>
              <Button className="w-full sm:w-auto" disabled={!selectedCompanyId}>
                <Plus className="mr-2 h-4 w-4" />
                {selectedCompanyId ? "Add Forklift" : "Select a Company First"}
              </Button>
            </DialogTrigger>
            <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
              <DialogHeader>
                <DialogTitle>Add New Forklift</DialogTitle>
              </DialogHeader>
              <ForkliftForm
                onSubmit={(data) => createForkliftMutation.mutate(data)}
                companyId={selectedCompanyId}
              />
            </DialogContent>
          </Dialog>
        </div>

        <div className="space-y-4">
          {displayForklifts && (
            <ForkliftTree
              forklifts={displayForklifts}
              onUpdate={(id, data) => updateForkliftMutation.mutate({ id, data })}
              onDelete={(id) => deleteForkliftMutation.mutate(id)}
            />
          )}
        </div>
      </main>
    </DynamicContent>
  );
}