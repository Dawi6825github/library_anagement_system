import { Layout } from "@/components/layout";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { useQuery } from "@tanstack/react-query";
import { Book, Member, Loan } from "@shared/schema";
import { BookOpen, Users, BookmarkCheck, AlertTriangle } from "lucide-react";

export default function Dashboard() {
  const { data: books } = useQuery<Book[]>({ 
    queryKey: ["/api/books"]
  });

  const { data: members } = useQuery<Member[]>({ 
    queryKey: ["/api/members"]
  });

  const { data: loans } = useQuery<Loan[]>({ 
    queryKey: ["/api/loans"]
  });

  const { data: overdueLoans } = useQuery<Loan[]>({ 
    queryKey: ["/api/loans/overdue"]
  });

  const stats = [
    {
      title: "Total Books",
      value: books?.length || 0,
      icon: BookOpen,
      color: "text-blue-500",
    },
    {
      title: "Total Members",
      value: members?.length || 0,
      icon: Users,
      color: "text-green-500",
    },
    {
      title: "Active Loans",
      value: loans?.filter(loan => !loan.returnDate).length || 0,
      icon: BookmarkCheck,
      color: "text-purple-500",
    },
    {
      title: "Overdue Loans",
      value: overdueLoans?.length || 0,
      icon: AlertTriangle,
      color: "text-red-500",
    },
  ];

  return (
    <Layout>
      <div className="space-y-8">
        <h1 className="text-3xl font-bold">Dashboard</h1>
        
        <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
          {stats.map((stat) => (
            <Card key={stat.title}>
              <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                <CardTitle className="text-sm font-medium">
                  {stat.title}
                </CardTitle>
                <stat.icon className={`h-4 w-4 ${stat.color}`} />
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold">{stat.value}</div>
              </CardContent>
            </Card>
          ))}
        </div>
      </div>
    </Layout>
  );
}
