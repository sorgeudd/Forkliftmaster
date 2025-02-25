import { useQuery, useMutation } from "@tanstack/react-query";
import { Button } from "@/components/ui/button";
import { useToast } from "@/hooks/use-toast";
import { apiRequest, queryClient } from "@/lib/queryClient";
import { CompanyUser, UpdateCompanyUser, Company } from "@shared/schema";
import { useParams, useLocation } from "wouter";
import {
  Loader2, RefreshCcw, Shield, Ban, ShieldOff,
  Ban as BanOff, ArrowLeft, Trash2, Users, Key
} from "lucide-react";
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
  AlertDialogTrigger,
} from "@/components/ui/alert-dialog";
import { useState, useEffect } from "react";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { WelcomeScreen } from "@/components/WelcomeScreen";

function ManageInvites({ companyId }: { companyId: number }) {
  const { toast } = useToast();
  const [isGenerating, setIsGenerating] = useState(false);

  // Single query for company data
  const { data: company, refetch } = useQuery<Company>({
    queryKey: [`/api/companies/${companyId}`],
    enabled: !!companyId,
  });

  // Simple mutation that just generates the code
  const regenerateCode = useMutation({
    mutationFn: async () => {
      setIsGenerating(true);
      try {
        const res = await apiRequest("POST", `/api/companies/${companyId}/regenerate-code`);
        return await res.json();
      } finally {
        setIsGenerating(false);
      }
    },
    onSuccess: async () => {
      await refetch();
      toast({
        title: "Success",
        description: "New join code generated successfully",
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
    <div className="space-y-6">
      <div className="bg-card p-6 rounded-lg border-2">
        <div className="flex items-center justify-between mb-6">
          <h2 className="text-xl font-semibold flex items-center gap-2">
            <Key className="h-5 w-5 text-primary" />
            Company Join Code
          </h2>
          <Button
            onClick={() => regenerateCode.mutate()}
            disabled={isGenerating}
            variant="outline"
          >
            {isGenerating ? (
              <>
                <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                Generating...
              </>
            ) : (
              <>
                <RefreshCcw className="h-4 w-4 mr-2" />
                Generate New Code
              </>
            )}
          </Button>
        </div>

        <div className="bg-muted p-6 rounded-md mb-4">
          <p className="text-sm text-muted-foreground mb-2">Current Join Code:</p>
          <div className="bg-background p-4 rounded-md border-2 border-primary/20">
            <code className="text-3xl font-mono text-primary block text-center">
              {company?.joinCode || (isGenerating ? "Generating..." : "No code available")}
            </code>
          </div>
        </div>

        <div className="bg-primary/5 p-4 rounded-md">
          <h3 className="text-sm font-medium mb-2">Instructions:</h3>
          <ul className="text-sm text-muted-foreground space-y-1">
            <li>• Share this code with new team members</li>
            <li>• They can join using the "Join Company" button</li>
            <li>• Generate a new code to revoke access to the old one</li>
          </ul>
        </div>
      </div>
    </div>
  );
}

function ManageUsers({ companyId, users }: { companyId: number; users: CompanyUser[] }) {
  const { toast } = useToast();

  const updateUserMutation = useMutation({
    mutationFn: async (data: UpdateCompanyUser) => {
      const res = await apiRequest("PATCH", `/api/companies/${companyId}/users/${data.userId}`, data);
      if (!res.ok) {
        throw new Error("Failed to update user");
      }
      return res.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/companies", companyId, "users"] });
      toast({ title: "Success", description: "User updated successfully" });
    },
    onError: (error: Error) => {
      toast({ title: "Error", description: error.message, variant: "destructive" });
    },
  });

  const deleteUserMutation = useMutation({
    mutationFn: async (userId: number) => {
      const res = await apiRequest("DELETE", `/api/companies/${companyId}/users/${userId}`);
      if (!res.ok) {
        throw new Error("Failed to delete user");
      }
      return res.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/companies", companyId, "users"] });
      toast({ title: "Success", description: "User deleted successfully" });
    },
    onError: (error: Error) => {
      toast({ title: "Error", description: error.message, variant: "destructive" });
    },
  });

  return (
    <div className="space-y-4">
      <div className="bg-card rounded-lg border">
        <div className="p-4">
          <h2 className="text-lg font-semibold mb-4">Team Members</h2>
          <div className="divide-y">
            {users && users.length > 0 ? (
              users.map((user) => (
                <div
                  key={`user-list-${user.userId}`}
                  className="py-4 flex items-center justify-between"
                >
                  <div>
                    <p className="font-medium">{user.username}</p>
                    <p className="text-sm text-muted-foreground">
                      {user.email || "No email provided"}
                    </p>
                  </div>
                  <div className="flex items-center gap-2">
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() =>
                        updateUserMutation.mutate({
                          userId: user.userId,
                          isAdmin: !user.isAdmin,
                        })
                      }
                      disabled={updateUserMutation.isPending}
                    >
                      {user.isAdmin ? (
                        <>
                          <ShieldOff className="h-4 w-4 mr-2" />
                          Remove Admin
                        </>
                      ) : (
                        <>
                          <Shield className="h-4 w-4 mr-2" />
                          Make Admin
                        </>
                      )}
                    </Button>
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() =>
                        updateUserMutation.mutate({
                          userId: user.userId,
                          isBlocked: !user.isBlocked,
                        })
                      }
                      disabled={updateUserMutation.isPending}
                    >
                      {user.isBlocked ? (
                        <>
                          <BanOff className="h-4 w-4 mr-2" />
                          Unblock
                        </>
                      ) : (
                        <>
                          <Ban className="h-4 w-4 mr-2" />
                          Block
                        </>
                      )}
                    </Button>
                    <AlertDialog>
                      <AlertDialogTrigger asChild>
                        <Button variant="destructive" size="icon">
                          <Trash2 className="h-4 w-4" />
                        </Button>
                      </AlertDialogTrigger>
                      <AlertDialogContent>
                        <AlertDialogHeader>
                          <AlertDialogTitle>Are you absolutely sure?</AlertDialogTitle>
                          <AlertDialogDescription>
                            This action cannot be undone. This will permanently delete the user.
                          </AlertDialogDescription>
                        </AlertDialogHeader>
                        <AlertDialogFooter>
                          <AlertDialogCancel>Cancel</AlertDialogCancel>
                          <AlertDialogAction
                            onClick={() => deleteUserMutation.mutate(user.userId)}
                            className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
                          >
                            Delete
                          </AlertDialogAction>
                        </AlertDialogFooter>
                      </AlertDialogContent>
                    </AlertDialog>
                  </div>
                </div>
              ))
            ) : (
              <div className="py-4 text-center text-muted-foreground">
                No users found
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}

export default function CompanyAdminPage() {
  const { toast } = useToast();
  const [, setLocation] = useLocation();
  const params = useParams<{ id: string }>();
  const companyId = params?.id ? parseInt(params.id, 10) : null;

  // Fetch company details
  const { data: company } = useQuery<Company>({
    queryKey: ["/api/companies", companyId],
    enabled: !!companyId,
  });

  // Check admin status
  const { data: isAdmin, isLoading: isAdminCheckLoading } = useQuery<boolean>({
    queryKey: ["/api/companies", companyId, "isAdmin"],
    enabled: !!companyId,
  });

  // Fetch users if admin
  const { data: users = [], isLoading: isUsersLoading } = useQuery<CompanyUser[]>({
    queryKey: ["/api/companies", companyId, "users"],
    enabled: !!company && isAdmin === true,
  });

  const deleteCompanyMutation = useMutation({
    mutationFn: async () => {
      const res = await apiRequest("DELETE", `/api/companies/${companyId}`);
      if (!res.ok) {
        throw new Error("Failed to delete company");
      }
      return res.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/companies"] });
      setLocation("/");
      toast({ title: "Success", description: "Company deleted successfully" });
    },
    onError: (error: Error) => {
      toast({ title: "Error", description: error.message, variant: "destructive" });
    },
  });

  const [showWelcome, setShowWelcome] = useState(true);

  // Loading states
  if (isAdminCheckLoading || isUsersLoading) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <Loader2 className="h-8 w-8 animate-spin" />
      </div>
    );
  }

  // Error states
  if (!company || !isAdmin) {
    return (
      <div className="container mx-auto px-4 py-8">
        <h1 className="text-2xl font-bold text-destructive">
          {!company ? "Company not found" : "Access denied"}
        </h1>
        <p className="mt-2 text-muted-foreground">
          {!company
            ? "The requested company does not exist or you don't have access to it."
            : "You need to be an admin of this company to access this page."}
        </p>
        <Button
          variant="ghost"
          size="sm"
          onClick={() => setLocation('/')}
          className="mt-4"
        >
          <ArrowLeft className="h-4 w-4 mr-2" />
          Back to Dashboard
        </Button>
      </div>
    );
  }

  if (showWelcome && company) {
    return <WelcomeScreen 
      companyName={company.name} 
      onAnimationComplete={() => setShowWelcome(false)} 
    />;
  }

  return (
    <div className="container mx-auto px-4 py-8">
      {/* Header */}
      <div className="flex justify-between items-start mb-8">
        <div>
          <div className="flex items-center gap-4 mb-4">
            <Button
              variant="ghost"
              size="sm"
              onClick={() => setLocation('/')}
              className="hover:bg-background"
            >
              <ArrowLeft className="h-4 w-4 mr-2" />
              Back to Dashboard
            </Button>
          </div>
          <h1 className="text-2xl font-bold">{company.name} - Admin Panel</h1>
        </div>

        <AlertDialog>
          <AlertDialogTrigger asChild>
            <Button variant="destructive" size="sm">
              <Trash2 className="h-4 w-4 mr-2" />
              Delete Company
            </Button>
          </AlertDialogTrigger>
          <AlertDialogContent>
            <AlertDialogHeader>
              <AlertDialogTitle>Are you absolutely sure?</AlertDialogTitle>
              <AlertDialogDescription>
                This action cannot be undone. This will permanently delete the company
                and remove all associated data including forklifts and user associations.
              </AlertDialogDescription>
            </AlertDialogHeader>
            <AlertDialogFooter>
              <AlertDialogCancel>Cancel</AlertDialogCancel>
              <AlertDialogAction
                onClick={() => deleteCompanyMutation.mutate()}
                className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
              >
                Delete
              </AlertDialogAction>
            </AlertDialogFooter>
          </AlertDialogContent>
        </AlertDialog>
      </div>

      {/* Tabs */}
      <Tabs defaultValue="invites" className="space-y-6">
        <TabsList>
          <TabsTrigger value="invites">
            <Key className="h-4 w-4 mr-2" />
            Manage Invites
          </TabsTrigger>
          <TabsTrigger value="users">
            <Users className="h-4 w-4 mr-2" />
            Manage Users
          </TabsTrigger>
        </TabsList>

        <TabsContent value="invites" className="space-y-4">
          <ManageInvites companyId={companyId} />
        </TabsContent>

        <TabsContent value="users" className="space-y-4">
          <ManageUsers companyId={companyId} users={users} />
        </TabsContent>
      </Tabs>
    </div>
  );
}