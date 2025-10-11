import { Header } from "@/components/Header";
import { Footer } from "@/components/Footer";
import { ColoringCalendar } from "@/components/ColoringCalendar";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { User, Calendar, Heart, LogOut, Crown, ArrowLeft, Coins } from "lucide-react";
import { useEffect, useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import { useNavigate } from "react-router-dom";
import { toast } from "sonner";
import { format } from "date-fns";

const Profile = () => {
  const [user, setUser] = useState<any>(null);
  const [isPremium, setIsPremium] = useState(false);
  const [credits, setCredits] = useState(0);
  const [transactions, setTransactions] = useState<any[]>([]);
  const navigate = useNavigate();

  useEffect(() => {
    supabase.auth.getSession().then(({ data: { session } }) => {
      setUser(session?.user ?? null);
      if (!session?.user) {
        navigate("/auth");
      }
    });

    const { data: { subscription } } = supabase.auth.onAuthStateChange((event, session) => {
      setUser(session?.user ?? null);
      if (!session?.user) {
        navigate("/auth");
      }
    });

    return () => subscription.unsubscribe();
  }, [navigate]);

  useEffect(() => {
    if (user) {
      checkPremiumStatus();
      fetchCredits();
      fetchTransactions();
    }
  }, [user]);

  const checkPremiumStatus = async () => {
    try {
      const { data } = await supabase.functions.invoke('check-subscription');
      setIsPremium(data?.subscribed || false);
    } catch (error) {
      console.error('Error checking premium:', error);
    }
  };

  const fetchCredits = async () => {
    try {
      const { data, error } = await supabase
        .from('user_credits')
        .select('balance')
        .eq('user_id', user?.id)
        .maybeSingle();
      
      if (error) throw error;
      setCredits(data?.balance || 0);
    } catch (error) {
      console.error('Error fetching credits:', error);
    }
  };

  const fetchTransactions = async () => {
    try {
      const { data, error } = await supabase
        .from('credit_transactions')
        .select('*')
        .eq('user_id', user?.id)
        .order('created_at', { ascending: false })
        .limit(50);
      
      if (error) throw error;
      setTransactions(data || []);
    } catch (error) {
      console.error('Error fetching transactions:', error);
    }
  };

  const handleSignOut = async () => {
    try {
      await supabase.auth.signOut();
      toast.success("Logged out successfully");
      navigate("/");
    } catch (error) {
      toast.error("Logout failed");
    }
  };

  if (!user) {
    return null;
  }

  return (
    <div className="min-h-screen flex flex-col">
      <Header />

      <main className="flex-1">
        <section className="py-12 md:py-16 lg:py-20 bg-gradient-to-b from-background to-muted/20">
          <div className="container px-4">
            <Button
              variant="ghost"
              onClick={() => navigate('/')}
              className="gap-2 mb-6"
            >
              <ArrowLeft className="h-4 w-4" />
              Back to Home
            </Button>

            {/* 用户信息卡片 */}
            <Card className="p-6 md:p-8 mb-8">
              <div className="flex flex-col md:flex-row items-start md:items-center gap-6">
                <div className="p-4 bg-primary/10 rounded-full">
                  <User className="h-12 w-12 text-primary" />
                </div>
                
                  <div className="flex-1 space-y-2">
                  <div className="flex items-center gap-3 flex-wrap">
                    <h1 className="text-2xl md:text-3xl font-bold">
                      {user.email?.split('@')[0] || 'User'}
                    </h1>
                    {isPremium && (
                      <div className="flex items-center gap-1.5 px-3 py-1 bg-gradient-to-r from-yellow-500/20 to-orange-500/20 border border-yellow-500/30 rounded-full">
                        <Crown className="h-4 w-4 text-yellow-600" />
                        <span className="text-sm font-semibold text-yellow-700">Premium</span>
                      </div>
                    )}
                  </div>
                   <p className="text-muted-foreground">{user.email}</p>
                  <div className="flex items-center gap-2 mt-2">
                    <Coins className="h-4 w-4 text-primary" />
                    <span className="text-sm font-medium">Credits Balance: {credits}</span>
                  </div>
                  {!isPremium && (
                    <Button
                      size="sm"
                      onClick={() => navigate('/credits-store')}
                      className="mt-2"
                    >
                      <Crown className="h-4 w-4 mr-2" />
                      Upgrade to Premium
                    </Button>
                  )}
                </div>

                <Button
                  variant="outline"
                  onClick={handleSignOut}
                  className="gap-2"
                >
                  <LogOut className="h-4 w-4" />
                  Log Out
                </Button>
              </div>
            </Card>

            {/* Tabs Content */}
            <Tabs defaultValue="calendar" className="space-y-6">
              <TabsList className="grid w-full grid-cols-3 lg:w-[600px]">
                <TabsTrigger value="calendar" className="gap-2">
                  <Calendar className="h-4 w-4" />
                  Calendar
                </TabsTrigger>
                <TabsTrigger value="credits" className="gap-2">
                  <Coins className="h-4 w-4" />
                  Credits History
                </TabsTrigger>
                <TabsTrigger value="favorites" className="gap-2">
                  <Heart className="h-4 w-4" />
                  Favorites
                </TabsTrigger>
              </TabsList>

              <TabsContent value="calendar" className="space-y-6">
                <ColoringCalendar userId={user.id} />
              </TabsContent>

              <TabsContent value="credits">
                <Card className="p-6">
                  <div className="flex items-center justify-between mb-6">
                    <h3 className="text-xl font-semibold">Credits History</h3>
                    <div className="flex items-center gap-2 px-4 py-2 bg-primary/10 rounded-lg">
                      <Coins className="h-5 w-5 text-primary" />
                      <span className="font-bold text-lg">{credits}</span>
                      <span className="text-sm text-muted-foreground">credits</span>
                    </div>
                  </div>
                  
                  {transactions.length === 0 ? (
                    <div className="text-center py-12">
                      <Coins className="h-16 w-16 mx-auto mb-4 opacity-20" />
                      <p className="text-muted-foreground">No credit transactions yet</p>
                    </div>
                  ) : (
                    <div className="overflow-x-auto">
                      <Table>
                        <TableHeader>
                          <TableRow>
                            <TableHead>Time</TableHead>
                            <TableHead>Type</TableHead>
                            <TableHead>Change</TableHead>
                            <TableHead>Balance</TableHead>
                            <TableHead>Description</TableHead>
                          </TableRow>
                        </TableHeader>
                        <TableBody>
                          {transactions.map((transaction) => (
                            <TableRow key={transaction.id}>
                              <TableCell className="whitespace-nowrap">
                                {format(new Date(transaction.created_at), 'yyyy-MM-dd HH:mm')}
                              </TableCell>
                              <TableCell>
                                <span className={`inline-flex px-2 py-1 rounded-full text-xs font-medium ${
                                  transaction.transaction_type === 'earned' 
                                    ? 'bg-green-100 text-green-800'
                                    : transaction.transaction_type === 'spent' || transaction.transaction_type === 'usage'
                                    ? 'bg-red-100 text-red-800'
                                    : transaction.transaction_type === 'purchased'
                                    ? 'bg-blue-100 text-blue-800'
                                    : 'bg-gray-100 text-gray-800'
                                }`}>
                                  {transaction.transaction_type === 'earned' && 'Earned'}
                                  {transaction.transaction_type === 'spent' && 'Spent'}
                                  {transaction.transaction_type === 'usage' && 'Used'}
                                  {transaction.transaction_type === 'purchased' && 'Purchased'}
                                  {transaction.transaction_type === 'refunded' && 'Refunded'}
                                  {transaction.transaction_type === 'admin_adjustment' && 'Adjustment'}
                                </span>
                              </TableCell>
                              <TableCell>
                                <span className={`font-semibold ${
                                  transaction.amount > 0 ? 'text-green-600' : 'text-red-600'
                                }`}>
                                  {transaction.amount > 0 ? '+' : ''}{transaction.amount}
                                </span>
                              </TableCell>
                              <TableCell className="font-medium">
                                {transaction.balance_after || '-'}
                              </TableCell>
                              <TableCell className="text-muted-foreground max-w-xs truncate">
                                {transaction.description || '-'}
                              </TableCell>
                            </TableRow>
                          ))}
                        </TableBody>
                      </Table>
                    </div>
                  )}
                </Card>
              </TabsContent>

              <TabsContent value="favorites">
                <Card className="p-6">
                  <div className="text-center py-8">
                    <Heart className="h-16 w-16 mx-auto mb-4 opacity-20" />
                    <h3 className="text-xl font-semibold mb-2">View My Favorites</h3>
                    <p className="text-muted-foreground mb-6">
                      Visit the favorites page to see all your liked coloring pages
                    </p>
                    <Button onClick={() => navigate('/favorites')} className="gap-2">
                      <Heart className="h-4 w-4" />
                      Go to Favorites
                    </Button>
                  </div>
                </Card>
              </TabsContent>
            </Tabs>
          </div>
        </section>
      </main>

      <Footer />
    </div>
  );
};

export default Profile;