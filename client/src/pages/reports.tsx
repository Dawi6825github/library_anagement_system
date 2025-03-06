import { Layout } from "@/components/layout";
import { useQuery } from "@tanstack/react-query";
import { Book, Member, Loan } from "@shared/schema";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { AlertCircle } from "lucide-react";
import { format } from "date-fns";
import {
  Chart as ChartJS,
  CategoryScale,
  LinearScale,
  BarElement,
  Title,
  Tooltip,
  Legend,
} from 'chart.js';
import { Bar } from 'react-chartjs-2';

ChartJS.register(
  CategoryScale,
  LinearScale,
  BarElement,
  Title,
  Tooltip,
  Legend
);

export default function Reports() {
  // Fetch all required data
  const { data: loans, isLoading: loansLoading, error: loansError } = useQuery<Loan[]>({
    queryKey: ["/api/loans"],
  });

  const { data: books } = useQuery<Book[]>({
    queryKey: ["/api/books"],
  });

  const { data: members } = useQuery<Member[]>({
    queryKey: ["/api/members"],
  });

  const { data: overdueLoans } = useQuery<Loan[]>({
    queryKey: ["/api/loans/overdue"],
  });

  if (loansError) {
    return (
      <Layout>
        <Alert variant="destructive">
          <AlertCircle className="h-4 w-4" />
          <AlertDescription>
            Failed to load reports data. Please try again later.
          </AlertDescription>
        </Alert>
      </Layout>
    );
  }

  // Calculate loan statistics
  const totalLoans = loans?.length || 0;
  const activeLoans = loans?.filter(loan => !loan.returnDate).length || 0;
  const overdueCount = overdueLoans?.length || 0;
  const returnedLoans = loans?.filter(loan => loan.returnDate).length || 0;

  // Prepare data for loans by month chart
  const getLoansByMonth = () => {
    if (!loans) return null;

    const monthlyData = new Map();
    const now = new Date();
    const sixMonthsAgo = new Date(now.setMonth(now.getMonth() - 6));

    loans.forEach(loan => {
      const loanDate = new Date(loan.loanDate);
      if (loanDate >= sixMonthsAgo) {
        const monthYear = format(loanDate, 'MMM yyyy');
        monthlyData.set(monthYear, (monthlyData.get(monthYear) || 0) + 1);
      }
    });

    return {
      labels: Array.from(monthlyData.keys()),
      datasets: [
        {
          label: 'Number of Loans',
          data: Array.from(monthlyData.values()),
          backgroundColor: 'rgba(75, 192, 192, 0.2)',
          borderColor: 'rgb(75, 192, 192)',
          borderWidth: 1,
        },
      ],
    };
  };

  const chartData = getLoansByMonth();

  return (
    <Layout>
      <div className="space-y-8">
        <h1 className="text-3xl font-bold">Library Reports</h1>

        {/* Summary Statistics */}
        <div className="grid gap-4 md:grid-cols-4">
          <Card>
            <CardHeader className="pb-2">
              <CardTitle className="text-sm font-medium">Total Loans</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{totalLoans}</div>
            </CardContent>
          </Card>
          <Card>
            <CardHeader className="pb-2">
              <CardTitle className="text-sm font-medium">Active Loans</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{activeLoans}</div>
            </CardContent>
          </Card>
          <Card>
            <CardHeader className="pb-2">
              <CardTitle className="text-sm font-medium">Overdue Loans</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold text-red-600">{overdueCount}</div>
            </CardContent>
          </Card>
          <Card>
            <CardHeader className="pb-2">
              <CardTitle className="text-sm font-medium">Returned Books</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold text-green-600">{returnedLoans}</div>
            </CardContent>
          </Card>
        </div>

        {/* Loans Trend Chart */}
        <Card>
          <CardHeader>
            <CardTitle>Loans Trend (Last 6 Months)</CardTitle>
          </CardHeader>
          <CardContent>
            {chartData && (
              <Bar
                data={chartData}
                options={{
                  responsive: true,
                  plugins: {
                    legend: {
                      position: 'top' as const,
                    },
                  },
                  scales: {
                    y: {
                      beginAtZero: true,
                      ticks: {
                        stepSize: 1,
                      },
                    },
                  },
                }}
              />
            )}
          </CardContent>
        </Card>

        {/* Overdue Books Table */}
        <Card>
          <CardHeader>
            <CardTitle>Overdue Books</CardTitle>
          </CardHeader>
          <CardContent>
            {loansLoading ? (
              <div>Loading...</div>
            ) : (
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Book Title</TableHead>
                    <TableHead>Member</TableHead>
                    <TableHead>Loan Date</TableHead>
                    <TableHead>Due Date</TableHead>
                    <TableHead>Days Overdue</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {overdueLoans?.map((loan) => {
                    const book = books?.find((b) => b.id === loan.bookId);
                    const member = members?.find((m) => m.id === loan.memberId);
                    const daysOverdue = Math.ceil(
                      (new Date().getTime() - new Date(loan.dueDate).getTime()) / (1000 * 60 * 60 * 24)
                    );

                    return (
                      <TableRow key={loan.id}>
                        <TableCell>{book?.title}</TableCell>
                        <TableCell>{member?.name}</TableCell>
                        <TableCell>{format(new Date(loan.loanDate), "MMM d, yyyy")}</TableCell>
                        <TableCell>{format(new Date(loan.dueDate), "MMM d, yyyy")}</TableCell>
                        <TableCell className="text-red-600">{daysOverdue} days</TableCell>
                      </TableRow>
                    );
                  })}
                  {overdueLoans?.length === 0 && (
                    <TableRow>
                      <TableCell colSpan={5} className="text-center">
                        No overdue books
                      </TableCell>
                    </TableRow>
                  )}
                </TableBody>
              </Table>
            )}
          </CardContent>
        </Card>
      </div>
    </Layout>
  );
}
