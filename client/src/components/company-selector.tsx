import { useState } from "react";
import { useMutation, useQuery } from "@tanstack/react-query";
import { useToast } from "@/hooks/use-toast";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { apiRequest, queryClient } from "@/lib/queryClient";
import { Company, InsertCompany } from "@shared/schema";
import { Plus, Share2, Building2, Settings } from "lucide-react";
import { useLocation } from "wouter";

type CompanySelectorProps = {
  selectedCompanyId?: number;
  onCompanySelect: (companyId: number) => void;
};

export function CompanySelector({ selectedCompanyId, onCompanySelect }: CompanySelectorProps) {
  const { toast } = useToast();
  const [, setLocation] = useLocation();
  const [isCreateOpen, setIsCreateOpen] = useState(false);
  const [isJoinOpen, setIsJoinOpen] = useState(false);
  const [companyName, setCompanyName] = useState("");
  const [joinCode, setJoinCode] = useState("");

  // This query will only return companies the user is a member of
  const { data: companies = [] } = useQuery<Company[]>({
    queryKey: ["/api/companies"],
  });

  // Check if user is admin of the selected company
  const { data: isAdmin } = useQuery<boolean>({
    queryKey: ["/api/companies", selectedCompanyId, "isAdmin"],
    enabled: !!selectedCompanyId,
  });

  const createCompanyMutation = useMutation({
    mutationFn: async (data: InsertCompany) => {
      const res = await apiRequest("POST", "/api/companies", data);
      return res.json();
    },
    onSuccess: (company) => {
      queryClient.invalidateQueries({ queryKey: ["/api/companies"] });
      setIsCreateOpen(false);
      setCompanyName("");
      onCompanySelect(company.id);
      toast({
        title: "Success",
        description: "Company created successfully",
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

  const joinCompanyMutation = useMutation({
    mutationFn: async (joinCode: string) => {
      const res = await apiRequest("POST", "/api/companies/join", { joinCode });
      return res.json();
    },
    onSuccess: (company) => {
      queryClient.invalidateQueries({ queryKey: ["/api/companies"] });
      setIsJoinOpen(false);
      setJoinCode("");
      onCompanySelect(company.id);
      toast({
        title: "Success",
        description: "Successfully joined company",
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

  return (
    <div className="flex items-center gap-4 w-full">
      <div className="flex-1 flex items-center gap-2">
        <Building2 className="h-4 w-4 text-muted-foreground flex-shrink-0" />
        <select
          value={selectedCompanyId || ""}
          onChange={(e) => onCompanySelect(Number(e.target.value))}
          className="flex-1 h-9 rounded-md border border-input bg-background px-3 py-1 text-sm shadow-sm transition-colors focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-ring min-w-[150px]"
        >
          <option value="">Select Company</option>
          {companies?.map((company) => (
            <option key={company.id} value={company.id}>
              {company.name}
            </option>
          ))}
        </select>
      </div>

      <div className="flex items-center gap-2 flex-shrink-0">
        {selectedCompanyId && isAdmin && (
          <Button
            variant="outline"
            size="sm"
            onClick={() => {
              if (selectedCompanyId) {
                setLocation(`/companies/${selectedCompanyId}/admin`);
              }
            }}
          >
            <Settings className="h-4 w-4 mr-2" />
            Manage
          </Button>
        )}

        <Dialog open={isCreateOpen} onOpenChange={setIsCreateOpen}>
          <DialogTrigger asChild>
            <Button variant="outline" size="sm">
              <Plus className="h-4 w-4 mr-2" />
              Create
            </Button>
          </DialogTrigger>
          <DialogContent>
            <DialogHeader>
              <DialogTitle>Create Company</DialogTitle>
            </DialogHeader>
            <form
              onSubmit={(e) => {
                e.preventDefault();
                createCompanyMutation.mutate({ name: companyName });
              }}
              className="space-y-4"
            >
              <div className="space-y-2">
                <Label htmlFor="name">Company Name</Label>
                <Input
                  id="name"
                  value={companyName}
                  onChange={(e) => setCompanyName(e.target.value)}
                  placeholder="Enter company name"
                />
              </div>
              <div className="flex justify-end gap-2">
                <Button type="button" variant="outline" onClick={() => setIsCreateOpen(false)}>
                  Cancel
                </Button>
                <Button type="submit" disabled={!companyName}>
                  Create
                </Button>
              </div>
            </form>
          </DialogContent>
        </Dialog>

        <Dialog open={isJoinOpen} onOpenChange={setIsJoinOpen}>
          <DialogTrigger asChild>
            <Button variant="outline" size="sm">
              <Share2 className="h-4 w-4 mr-2" />
              Join
            </Button>
          </DialogTrigger>
          <DialogContent>
            <DialogHeader>
              <DialogTitle>Join Company</DialogTitle>
            </DialogHeader>
            <form
              onSubmit={(e) => {
                e.preventDefault();
                joinCompanyMutation.mutate(joinCode);
              }}
              className="space-y-4"
            >
              <div className="space-y-2">
                <Label htmlFor="code">Join Code</Label>
                <Input
                  id="code"
                  value={joinCode}
                  onChange={(e) => setJoinCode(e.target.value.toUpperCase())}
                  placeholder="Enter company join code"
                />
              </div>
              <div className="flex justify-end gap-2">
                <Button type="button" variant="outline" onClick={() => setIsJoinOpen(false)}>
                  Cancel
                </Button>
                <Button type="submit" disabled={!joinCode}>
                  Join
                </Button>
              </div>
            </form>
          </DialogContent>
        </Dialog>
      </div>
    </div>
  );
}