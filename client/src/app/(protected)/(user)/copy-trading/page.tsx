"use client";

import { useState, useEffect, useCallback } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
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
import {
  Search,
  RefreshCw,
  Star,
  TrendingUp,
  DollarSign,
  Target,
  Trophy,
  Users,
  Copy,
  UserX,
  Eye,
  Filter,
  SortAsc,
} from "lucide-react";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { toast } from "sonner";
import api from "@/lib/api";
import Loading from "@/components/Loading";
import { formatCurrency } from "@/lib/utils";
import { TraderFollower, TradingProfile } from "@/types/user";
import { AxiosError } from "@/types/api";

type SortOption = 'profit' | 'winRate' | 'trades' | 'followers' | 'newest';
type FilterOption = 'all' | 'high-profit' | 'high-winrate' | 'experienced';

const CopyTradingPage = () => {
  // State management
  const [traders, setTraders] = useState<TradingProfile[]>([]);
  const [copiedTraders, setCopiedTraders] = useState<number[]>([]);
  const [loading, setLoading] = useState(true);
  const [searching, setSearching] = useState(false);

  // Filters and search
  const [searchQuery, setSearchQuery] = useState("");
  const [sortBy, setSortBy] = useState<SortOption>('profit');
  const [filterBy, setFilterBy] = useState<FilterOption>('all');

  // Dialog state
  const [selectedTrader, setSelectedTrader] = useState<TradingProfile | null>(null);
  const [isDetailsOpen, setIsDetailsOpen] = useState(false);

  // Fetch all traders
  const fetchTraders = useCallback(async () => {
    try {
      setLoading(true);
      const response = await api.get('/traders');
      setTraders(response.data || []);
    } catch (error) {
      console.error('Error fetching traders:', error);
      toast.error('Failed to load traders');
    } finally {
      setLoading(false);
    }
  }, []);

  // Fetch user's copied traders
  const fetchCopiedTraders = useCallback(async () => {
    try {
      const response = await api.get('/traders/copied');
      const copiedIds = response.data.map((follow: TraderFollower) => follow.traderId);
      setCopiedTraders(copiedIds);
    } catch (error) {
      console.error('Error fetching copied traders:', error);
    }
  }, []);

  // Copy trader
  const handleCopyTrader = async (traderId: number) => {
    try {
      await api.post(`/traders/${traderId}/copy`);
      toast.success('Started copying trader successfully');
      setCopiedTraders(prev => [...prev, traderId]);
    } catch (error) {
      console.error('Error copying trader:', error);
      const errorMessage = (error as AxiosError).response?.data?.message || 'Failed to copy trader';
      toast.error(errorMessage);
    }
  };

  // Stop copying trader
  const handleStopCopying = async (traderId: number) => {
    try {
      await api.delete(`/traders/${traderId}/copy`);
      toast.success('Stopped copying trader successfully');
      setCopiedTraders(prev => prev.filter(id => id !== traderId));
    } catch (error) {
      console.error('Error stopping copy:', error);
      const errorMessage = (error as AxiosError).response?.data?.message || 'Failed to stop copying trader';
      toast.error(errorMessage);
    }
  };

  // Search traders
  const handleSearch = useCallback(async (query: string) => {
    if (!query.trim()) {
      fetchTraders();
      return;
    }

    try {
      setSearching(true);
      const response = await api.get(`/traders?search=${encodeURIComponent(query)}`);
      setTraders(response.data || []);
    } catch (error) {
      console.error('Error searching traders:', error);
      toast.error('Failed to search traders');
    } finally {
      setSearching(false);
    }
  }, [fetchTraders]);

  // Filter and sort traders
  const getFilteredAndSortedTraders = useCallback(() => {
    let filteredTraders = [...traders];

    // Apply filters
    switch (filterBy) {
      case 'high-profit':
        filteredTraders = filteredTraders.filter(trader => Number(trader.totalProfit) > 1000);
        break;
      case 'high-winrate':
        filteredTraders = filteredTraders.filter(trader => Number(trader.winRate) > 70);
        break;
      case 'experienced':
        filteredTraders = filteredTraders.filter(trader => trader.totalTrades > 50);
        break;
    }

    // Apply search
    if (searchQuery.trim()) {
      filteredTraders = filteredTraders.filter(trader =>
        trader.user?.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
        trader.bio?.toLowerCase().includes(searchQuery.toLowerCase())
      );
    }

    // Apply sorting
    filteredTraders.sort((a, b) => {
      switch (sortBy) {
        case 'profit':
          return Number(b.totalProfit) - Number(a.totalProfit);
        case 'winRate':
          return Number(b.winRate) - Number(a.winRate);
        case 'trades':
          return b.totalTrades - a.totalTrades;
        case 'newest':
          return new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime();
        default:
          return 0;
      }
    });

    return filteredTraders;
  }, [traders, searchQuery, sortBy, filterBy]);

  // Format percentage
  const formatPercentage = (value: string | number) => {
    return `${Number(value).toFixed(2)}%`;
  };

  // Get trader performance badge
  const getPerformanceBadge = (winRate: string | number) => {
    const rate = Number(winRate);
    if (rate >= 80) return <Badge variant="default" className="bg-green-500">Excellent</Badge>;
    if (rate >= 70) return <Badge variant="default" className="bg-blue-500">Good</Badge>;
    if (rate >= 60) return <Badge variant="secondary">Average</Badge>;
    return <Badge variant="destructive">Poor</Badge>;
  };

  // Handle trader details
  const handleViewDetails = (trader: TradingProfile) => {
    setSelectedTrader(trader);
    setIsDetailsOpen(true);
  };

  // Initialize
  useEffect(() => {
    fetchTraders();
    fetchCopiedTraders();
  }, [fetchTraders, fetchCopiedTraders]);

  // Handle search input changes
  useEffect(() => {
    const timer = setTimeout(() => {
      if (searchQuery !== "") {
        handleSearch(searchQuery);
      } else {
        fetchTraders();
      }
    }, 500);

    return () => clearTimeout(timer);
  }, [searchQuery, handleSearch, fetchTraders]);

  const filteredTraders = getFilteredAndSortedTraders();

  if (loading) {
    return <Loading />;
  }

  return (
    <div>
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <h1 className="text-3xl font-bold tracking-tight">Copy Trading</h1>
          <p className="text-muted-foreground">
            Discover and copy successful traders to grow your portfolio
          </p>
        </div>
        
        <Button 
          onClick={fetchTraders} 
          variant="outline"
          disabled={loading}
          className="flex items-center gap-2"
        >
          <RefreshCw className={`h-4 w-4 ${loading ? 'animate-spin' : ''}`} />
          Refresh
        </Button>
      </div>

      {/* Filters and Search */}
      <Card>
        <CardContent className="p-6">
          <div className="flex flex-col lg:flex-row gap-4">
            {/* Search */}
            <div className="flex-1">
              <div className="relative">
                <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                <Input
                  placeholder="Search traders by name or bio..."
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  className="pl-9"
                />
                {searching && (
                  <RefreshCw className="absolute right-3 top-1/2 -translate-y-1/2 h-4 w-4 animate-spin text-muted-foreground" />
                )}
              </div>
            </div>

            {/* Filter */}
            <Select value={filterBy} onValueChange={(value: FilterOption) => setFilterBy(value)}>
              <SelectTrigger className="w-full lg:w-48">
                <Filter className="h-4 w-4 mr-2" />
                <SelectValue placeholder="Filter traders" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">All Traders</SelectItem>
                <SelectItem value="high-profit">High Profit ($1000+)</SelectItem>
                <SelectItem value="high-winrate">High Win Rate (70%+)</SelectItem>
                <SelectItem value="experienced">Experienced (50+ trades)</SelectItem>
              </SelectContent>
            </Select>

            {/* Sort */}
            <Select value={sortBy} onValueChange={(value: SortOption) => setSortBy(value)}>
              <SelectTrigger className="w-full lg:w-48">
                <SortAsc className="h-4 w-4 mr-2" />
                <SelectValue placeholder="Sort by" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="profit">Highest Profit</SelectItem>
                <SelectItem value="winRate">Best Win Rate</SelectItem>
                <SelectItem value="trades">Most Trades</SelectItem>
                <SelectItem value="newest">Newest</SelectItem>
              </SelectContent>
            </Select>
          </div>
        </CardContent>
      </Card>

      {/* Traders Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        {filteredTraders.map((trader) => {
          const isCopied = copiedTraders.includes(trader.id);
          
          return (
            <Card key={trader.id} className="relative overflow-hidden">
              <CardHeader className="pb-3">
                <div className="flex items-center justify-between">
                  <div>
                    <CardTitle className="text-lg">{trader.user?.name || 'Unknown Trader'}</CardTitle>
                    <div className="flex items-center gap-2 mt-1">
                      {getPerformanceBadge(trader.winRate)}
                      {isCopied && (
                        <Badge variant="outline" className="text-green-600 border-green-600">
                          <Copy className="h-3 w-3 mr-1" />
                          Copying
                        </Badge>
                      )}
                    </div>
                  </div>
                  <Button
                    variant="ghost"
                    size="sm"
                    onClick={() => handleViewDetails(trader)}
                    className="h-8 w-8 p-0"
                  >
                    <Eye className="h-4 w-4" />
                  </Button>
                </div>
              </CardHeader>
              
              <CardContent className="space-y-4">
                {/* Performance Metrics */}
                <div className="grid grid-cols-2 gap-3">
                  <div className="text-center p-3 bg-green-50 dark:bg-green-950/20 rounded-lg">
                    <DollarSign className="h-5 w-5 text-green-500 mx-auto mb-1" />
                    <p className="text-sm font-semibold text-green-600 dark:text-green-400">
                      {formatCurrency(trader.totalProfit)}
                    </p>
                    <p className="text-xs text-muted-foreground">Total Profit</p>
                  </div>
                  
                  <div className="text-center p-3 bg-blue-50 dark:bg-blue-950/20 rounded-lg">
                    <Target className="h-5 w-5 text-blue-500 mx-auto mb-1" />
                    <p className="text-sm font-semibold text-blue-600 dark:text-blue-400">
                      {formatPercentage(trader.winRate)}
                    </p>
                    <p className="text-xs text-muted-foreground">Win Rate</p>
                  </div>
                </div>

                {/* Additional Stats */}
                <div className="flex justify-between text-sm text-muted-foreground">
                  <span className="flex items-center gap-1">
                    <Trophy className="h-3 w-3" />
                    {trader.totalTrades} trades
                  </span>
                  <span className="flex items-center gap-1">
                    <TrendingUp className="h-3 w-3" />
                    {formatPercentage(trader.profitSharePercent)} share
                  </span>
                </div>

                {/* Bio Preview */}
                {trader.bio && (
                  <p className="text-sm text-muted-foreground line-clamp-2">
                    {trader.bio}
                  </p>
                )}

                {/* Action Buttons */}
                <div className="flex gap-2 pt-2">
                  {isCopied ? (
                    <AlertDialog>
                      <AlertDialogTrigger asChild>
                        <Button variant="destructive" className="flex-1">
                          <UserX className="h-4 w-4 mr-2" />
                          Stop Copying
                        </Button>
                      </AlertDialogTrigger>
                      <AlertDialogContent>
                        <AlertDialogHeader>
                          <AlertDialogTitle>Stop Copying Trader</AlertDialogTitle>
                          <AlertDialogDescription>
                            Are you sure you want to stop copying {trader.user?.name}? 
                            You will no longer copy their trades.
                          </AlertDialogDescription>
                        </AlertDialogHeader>
                        <AlertDialogFooter>
                          <AlertDialogCancel>Cancel</AlertDialogCancel>
                          <AlertDialogAction
                            onClick={() => handleStopCopying(trader.id)}
                            className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
                          >
                            Stop Copying
                          </AlertDialogAction>
                        </AlertDialogFooter>
                      </AlertDialogContent>
                    </AlertDialog>
                  ) : (
                    <Button 
                      onClick={() => handleCopyTrader(trader.id)}
                      className="flex-1"
                    >
                      <Copy className="h-4 w-4 mr-2" />
                      Copy Trader
                    </Button>
                  )}
                  
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => handleViewDetails(trader)}
                    className="px-3"
                  >
                    <Eye className="h-4 w-4" />
                  </Button>
                </div>

                {/* Minimum Capital */}
                <div className="text-xs text-muted-foreground border-t pt-2">
                  Min. Capital: {formatCurrency(trader.minCapital)}
                </div>
              </CardContent>
            </Card>
          );
        })}
      </div>

      {/* Empty State */}
      {filteredTraders.length === 0 && !loading && (
        <Card>
          <CardContent className="text-center py-12">
            <Users className="h-12 w-12 mx-auto mb-4 text-muted-foreground opacity-50" />
            <h3 className="text-lg font-semibold mb-2">No traders found</h3>
            <p className="text-muted-foreground mb-4">
              {searchQuery || filterBy !== 'all' 
                ? 'Try adjusting your search or filters' 
                : 'No traders are available at the moment'
              }
            </p>
            {(searchQuery || filterBy !== 'all') && (
              <Button 
                variant="outline" 
                onClick={() => {
                  setSearchQuery('');
                  setFilterBy('all');
                }}
              >
                Clear Filters
              </Button>
            )}
          </CardContent>
        </Card>
      )}

      {/* Trader Details Dialog */}
      <Dialog open={isDetailsOpen} onOpenChange={setIsDetailsOpen}>
        <DialogContent className="max-w-2xl">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2">
              <Star className="h-5 w-5 text-yellow-500" />
              {selectedTrader?.user?.name || 'Trader'} Profile
            </DialogTitle>
          </DialogHeader>
          {selectedTrader && (
            <div className="space-y-6">
              {/* Performance Overview */}
              <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                <div className="text-center p-4 bg-green-50 dark:bg-green-950/20 rounded-lg">
                  <DollarSign className="h-8 w-8 text-green-500 mx-auto mb-2" />
                  <p className="text-2xl font-bold text-green-600 dark:text-green-400">
                    {formatCurrency(selectedTrader.totalProfit)}
                  </p>
                  <p className="text-sm text-muted-foreground">Total Profit</p>
                </div>
                
                <div className="text-center p-4 bg-blue-50 dark:bg-blue-950/20 rounded-lg">
                  <Target className="h-8 w-8 text-blue-500 mx-auto mb-2" />
                  <p className="text-2xl font-bold text-blue-600 dark:text-blue-400">
                    {formatPercentage(selectedTrader.winRate)}
                  </p>
                  <p className="text-sm text-muted-foreground">Win Rate</p>
                </div>
                
                <div className="text-center p-4 bg-purple-50 dark:bg-purple-950/20 rounded-lg">
                  <Trophy className="h-8 w-8 text-purple-500 mx-auto mb-2" />
                  <p className="text-2xl font-bold text-purple-600 dark:text-purple-400">
                    {selectedTrader.totalTrades}
                  </p>
                  <p className="text-sm text-muted-foreground">Total Trades</p>
                </div>
              </div>

              {/* Additional Stats */}
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <label className="text-sm font-medium text-muted-foreground">Successful Trades</label>
                  <p className="text-lg font-semibold text-green-600 dark:text-green-400">
                    {selectedTrader.successfulTrades}
                  </p>
                </div>
                <div>
                  <label className="text-sm font-medium text-muted-foreground">Profit Share</label>
                  <p className="text-lg font-semibold">
                    {formatPercentage(selectedTrader.profitSharePercent)}
                  </p>
                </div>
                <div className="md:col-span-2">
                  <label className="text-sm font-medium text-muted-foreground">Minimum Capital</label>
                  <p className="text-lg font-semibold">
                    {formatCurrency(selectedTrader.minCapital)}
                  </p>
                </div>
              </div>

              {/* Bio */}
              {selectedTrader.bio && (
                <div>
                  <label className="text-sm font-medium text-muted-foreground">About</label>
                  <div className="mt-2 p-4 bg-muted rounded-lg">
                    <p className="text-sm">{selectedTrader.bio}</p>
                  </div>
                </div>
              )}

              {/* Action Button */}
              <div className="flex gap-2 pt-4">
                {copiedTraders.includes(selectedTrader.id) ? (
                  <AlertDialog>
                    <AlertDialogTrigger asChild>
                      <Button variant="destructive" className="flex-1">
                        <UserX className="h-4 w-4 mr-2" />
                        Stop Copying
                      </Button>
                    </AlertDialogTrigger>
                    <AlertDialogContent>
                      <AlertDialogHeader>
                        <AlertDialogTitle>Stop Copying Trader</AlertDialogTitle>
                        <AlertDialogDescription>
                          Are you sure you want to stop copying {selectedTrader.user?.name}? 
                          You will no longer receive their trading signals.
                        </AlertDialogDescription>
                      </AlertDialogHeader>
                      <AlertDialogFooter>
                        <AlertDialogCancel>Cancel</AlertDialogCancel>
                        <AlertDialogAction
                          onClick={() => {
                            handleStopCopying(selectedTrader.id);
                            setIsDetailsOpen(false);
                          }}
                          className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
                        >
                          Stop Copying
                        </AlertDialogAction>
                      </AlertDialogFooter>
                    </AlertDialogContent>
                  </AlertDialog>
                ) : (
                  <Button 
                    onClick={() => {
                      handleCopyTrader(selectedTrader.id);
                      setIsDetailsOpen(false);
                    }}
                    className="flex-1"
                  >
                    <Copy className="h-4 w-4 mr-2" />
                    Copy This Trader
                  </Button>
                )}
              </div>
            </div>
          )}
        </DialogContent>
      </Dialog>
    </div>
  );
};

export default CopyTradingPage;
