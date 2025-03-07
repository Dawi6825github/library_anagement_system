import { useState } from "react";
import { Layout } from "@/components/layout";
import { useQuery, useMutation } from "@tanstack/react-query";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { Book, Member, Loan, insertLoanSchema } from "@shared/schema";
import { Button } from "@/components/ui/button";
import { Form, FormControl, FormField, FormItem, FormLabel, FormMessage } from "@/components/ui/form";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { useToast } from "@/hooks/use-toast";
import { apiRequest, queryClient } from "@/lib/queryClient";
import { Plus, CheckCircle } from "lucide-react";
import { format } from "date-fns";
import * as z from 'zod';

// Create a form schema that matches the loan schema
const createLoanSchema = z.object({
  bookId: z.coerce.number().min(1, "Please select a book"),
  memberId: z.coerce.number().min(1, "Please select a member")
});

type CreateLoanForm = z.infer<typeof createLoanSchema>;

export default function Loans() {
  const { toast } = useToast();
  const [isDialogOpen, setIsDialogOpen] = useState(false);

  // Queries
  const { data: loans, isLoading: loansLoading } = useQuery<Loan[]>({
    queryKey: ["/api/loans"],
  });

  const { data: books } = useQuery<Book[]>({
    queryKey: ["/api/books"],
  });

  const { data: members } = useQuery<Member[]>({
    queryKey: ["/api/members"],
  });

  // Form
  const form = useForm<CreateLoanForm>({
    resolver: zodResolver(createLoanSchema),
    defaultValues: {
      bookId: 0,
      memberId: 0,
    },
  });

  // Mutations
  const createMutation = useMutation({
    mutationFn: async (data: CreateLoanForm) => {
      const loanData = {
        ...data,
        loanDate: new Date().toISOString(),
        dueDate: new Date(Date.now() + 14 * 24 * 60 * 60 * 1000).toISOString(), // 14 days from now
      };

      console.log('Submitting loan data:', loanData); // Debug log

      const response = await apiRequest("POST", "/api/loans", loanData);
      return response.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/loans"] });
      queryClient.invalidateQueries({ queryKey: ["/api/books"] });
      toast({ title: "Loan created successfully" });
      setIsDialogOpen(false);
      form.reset();
    },
    onError: (error: Error) => {
      console.error('Loan creation error:', error); // Debug log
      toast({
        title: "Failed to create loan",
        description: error.message,
        variant: "destructive"
      });
    }
  });

  const returnMutation = useMutation({
    mutationFn: async (id: number) => {
      await apiRequest("PATCH", `/api/loans/${id}`, {
        returnDate: new Date().toISOString(),
      });
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/loans"] });
      queryClient.invalidateQueries({ queryKey: ["/api/books"] });
      toast({ title: "Book returned successfully" });
    },
    onError: (error: Error) => {
      toast({
        title: "Failed to return book",
        description: error.message,
        variant: "destructive"
      });
    }
  });

  // Event Handlers
  const onSubmit = async (data: CreateLoanForm) => {
    try {
      await createMutation.mutateAsync(data);
    } catch (error) {
      console.error("Form submission error:", error);
    }
  };

  const handleReturn = async (id: number) => {
    if (confirm("Confirm book return?")) {
      returnMutation.mutate(id);
    }
  };

  const handleNewLoan = () => {
    form.reset();
    setIsDialogOpen(true);
  };

  const availableBooks = books?.filter((book) => book.available) || [];

  if (loansLoading) {
    return (
      <Layout>
        <div>Loading...</div>
      </Layout>
    );
  }

  return (
    <Layout>
      <div className="space-y-8">
        <div className="flex justify-between items-center">
          <h1 className="text-3xl font-bold">Loans</h1>
          <Button 
            onClick={handleNewLoan}
            disabled={availableBooks.length === 0 || !members?.length}
            title={
              availableBooks.length === 0 
                ? "No books available for loan" 
                : !members?.length 
                ? "No members available"
                : "Create new loan"
            }
          >
            <Plus className="mr-2 h-4 w-4" />
            New Loan
          </Button>

          <Dialog open={isDialogOpen} onOpenChange={setIsDialogOpen}>
            <DialogContent>
              <DialogHeader>
                <DialogTitle>Create New Loan</DialogTitle>
              </DialogHeader>
              <Form {...form}>
                <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4">
                  <FormField
                    control={form.control}
                    name="bookId"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Book</FormLabel>
                        <Select
                          onValueChange={field.onChange}
                          value={field.value?.toString() || "0"}
                        >
                          <FormControl>
                            <SelectTrigger>
                              <SelectValue placeholder="Select a book" />
                            </SelectTrigger>
                          </FormControl>
                          <SelectContent>
                            <SelectItem value="0">Select a book</SelectItem>
                            {availableBooks.map((book) => (
                              <SelectItem key={book.id} value={book.id.toString()}>
                                {book.title}
                              </SelectItem>
                            ))}
                          </SelectContent>
                        </Select>
                        <FormMessage />
                      </FormItem>
                    )}
                  />

                  <FormField
                    control={form.control}
                    name="memberId"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Member</FormLabel>
                        <Select
                          onValueChange={field.onChange}
                          value={field.value?.toString() || "0"}
                        >
                          <FormControl>
                            <SelectTrigger>
                              <SelectValue placeholder="Select a member" />
                            </SelectTrigger>
                          </FormControl>
                          <SelectContent>
                            <SelectItem value="0">Select a member</SelectItem>
                            {members?.map((member) => (
                              <SelectItem key={member.id} value={member.id.toString()}>
                                {member.name}
                              </SelectItem>
                            ))}
                          </SelectContent>
                        </Select>
                        <FormMessage />
                      </FormItem>
                    )}
                  />

                  <Button 
                    type="submit" 
                    className="w-full"
                    disabled={createMutation.isPending}
                  >
                    {createMutation.isPending ? "Creating..." : "Create Loan"}
                  </Button>
                </form>
              </Form>
            </DialogContent>
          </Dialog>
        </div>

        <Table>
          <TableHeader>
            <TableRow>
              <TableHead>Book</TableHead>
              <TableHead>Member</TableHead>
              <TableHead>Loan Date</TableHead>
              <TableHead>Due Date</TableHead>
              <TableHead>Status</TableHead>
              <TableHead>Actions</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {loans?.map((loan) => {
              const book = books?.find((b) => b.id === loan.bookId);
              const member = members?.find((m) => m.id === loan.memberId);
              const isOverdue = !loan.returnDate && new Date(loan.dueDate) < new Date();

              return (
                <TableRow key={loan.id}>
                  <TableCell>{book?.title}</TableCell>
                  <TableCell>{member?.name}</TableCell>
                  <TableCell>{format(new Date(loan.loanDate), "MMM d, yyyy")}</TableCell>
                  <TableCell>{format(new Date(loan.dueDate), "MMM d, yyyy")}</TableCell>
                  <TableCell>
                    <span
                      className={`px-2 py-1 rounded-full text-xs ${
                        loan.returnDate
                          ? "bg-green-100 text-green-800"
                          : isOverdue
                          ? "bg-red-100 text-red-800"
                          : "bg-yellow-100 text-yellow-800"
                      }`}
                    >
                      {loan.returnDate
                        ? "Returned"
                        : isOverdue
                        ? "Overdue"
                        : "Active"}
                    </span>
                  </TableCell>
                  <TableCell>
                    {!loan.returnDate && (
                      <Button
                        variant="outline"
                        size="icon"
                        onClick={() => handleReturn(loan.id)}
                        disabled={returnMutation.isPending}
                      >
                        <CheckCircle className="h-4 w-4" />
                      </Button>
                    )}
                  </TableCell>
                </TableRow>
              );
            })}
            {loans?.length === 0 && (
              <TableRow>
                <TableCell colSpan={6} className="text-center py-4">
                  No loans found
                </TableCell>
              </TableRow>
            )}
          </TableBody>
        </Table>
      </div>
    </Layout>
  );
}