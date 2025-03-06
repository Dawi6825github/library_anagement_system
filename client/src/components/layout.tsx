import { Link, useLocation } from "wouter";
import { Button } from "@/components/ui/button";
import { useToast } from "@/hooks/use-toast";
import { logout } from "@/lib/auth";
import { queryClient } from "@/lib/queryClient";
import { BookOpen, Users, BookmarkCheck, FileText, LayoutDashboard } from "lucide-react";

interface LayoutProps {
  children: React.ReactNode;
}

export function Layout({ children }: LayoutProps) {
  const [location] = useLocation();
  const { toast } = useToast();

  const handleLogout = async () => {
    try {
      await logout();
      queryClient.clear();
      window.location.href = "/login";
    } catch (err) {
      toast({
        variant: "destructive",
        title: "Error logging out",
        description: "Please try again",
      });
    }
  };

  return (
    <div className="flex h-screen">
      <nav className="w-64 bg-sidebar border-r border-sidebar-border">
        <div className="flex flex-col h-full">
          <div className="p-6">
            <h1 className="text-2xl font-bold text-sidebar-foreground">Library System</h1>
          </div>
          <div className="flex-1 px-4">
            <div className="space-y-2">
              <NavLink href="/dashboard" active={location === "/dashboard"}>
                <LayoutDashboard className="h-4 w-4 mr-2" />
                Dashboard
              </NavLink>
              <NavLink href="/books" active={location === "/books"}>
                <BookOpen className="h-4 w-4 mr-2" />
                Books
              </NavLink>
              <NavLink href="/members" active={location === "/members"}>
                <Users className="h-4 w-4 mr-2" />
                Members
              </NavLink>
              <NavLink href="/loans" active={location === "/loans"}>
                <BookmarkCheck className="h-4 w-4 mr-2" />
                Loans
              </NavLink>
              <NavLink href="/reports" active={location === "/reports"}>
                <FileText className="h-4 w-4 mr-2" />
                Reports
              </NavLink>
            </div>
          </div>
          <div className="p-4">
            <Button variant="outline" className="w-full" onClick={handleLogout}>
              Logout
            </Button>
          </div>
        </div>
      </nav>
      <main className="flex-1 overflow-auto p-8">
        {children}
      </main>
    </div>
  );
}

interface NavLinkProps {
  href: string;
  active: boolean;
  children: React.ReactNode;
}

function NavLink({ href, active, children }: NavLinkProps) {
  return (
    <Link href={href}>
      <a className={`flex items-center px-4 py-2 rounded-md transition-colors ${
        active
          ? "bg-sidebar-accent text-sidebar-accent-foreground"
          : "text-sidebar-foreground hover:bg-sidebar-accent/50"
      }`}>
        {children}
      </a>
    </Link>
  );
}