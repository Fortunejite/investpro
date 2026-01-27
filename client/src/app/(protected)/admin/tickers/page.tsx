"use client";

import { useState, useEffect } from "react";
import Image from "next/image";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import {
  ChevronLeft,
  ChevronRight,
  Search,
  RefreshCw,
  Coins,
  DollarSign,
} from "lucide-react";
import { toast } from "sonner";
import api from "@/lib/api";
import Loading from "@/components/Loading";
import { Coin } from "@/types/asset";

interface PaginatedResponse {
  data: Coin[];
  pagination: {
    page: number;
    limit: number;
    total: number;
  };
}

const TickersPage = () => {
  const [coins, setCoins] = useState<Coin[]>([]);
  const [loading, setLoading] = useState(true);
  const [syncing, setSyncing] = useState(false);
  const [searchQuery, setSearchQuery] = useState("");
  const [currentPage, setCurrentPage] = useState(1);
  const [totalPages, setTotalPages] = useState(0);
  const [totalCoins, setTotalCoins] = useState(0);
  const [imageErrors, setImageErrors] = useState<Set<string>>(new Set());
  
  const limit = 50;

  const handleImageError = (coinId: string) => {
    setImageErrors(prev => new Set(prev).add(coinId));
  };

  const getCoinImageUrl = (nameId: string) => {
    return `https://www.coinlore.com/img/50x50/${nameId}.png`;
  };

  // Fetch coins with pagination and search
  const fetchCoins = async (page: number = 1, search: string = "") => {
    try {
      setLoading(true);
      const response = await api.get<PaginatedResponse>('/coins', {
        params: {
          page,
          limit,
          search: search || undefined
        }
      });

      setCoins(response.data.data);
      setCurrentPage(response.data.pagination.page);
      setTotalCoins(response.data.pagination.total);
      setTotalPages(Math.ceil(response.data.pagination.total / limit));
    } catch (error) {
      console.error('Error fetching coins:', error);
      toast.error('Failed to fetch coins');
    } finally {
      setLoading(false);
    }
  };

  // Sync coins from external API
  const handleSyncCoins = async () => {
    try {
      setSyncing(true);
      await api.post('/coins/sync');
      toast.success('Coins synchronized successfully!');
      
      // Refresh the current page
      await fetchCoins(currentPage, searchQuery);
    } catch (error) {
      console.error('Error syncing coins:', error);
      toast.error('Failed to sync coins');
    } finally {
      setSyncing(false);
    }
  };

  // Handle search
  const handleSearch = (query: string) => {
    setSearchQuery(query);
    setCurrentPage(1);
    fetchCoins(1, query);
  };

  // Handle pagination
  const handlePageChange = (page: number) => {
    setCurrentPage(page);
    fetchCoins(page, searchQuery);
  };

  useEffect(() => {
    fetchCoins();
  }, []);

  if (loading && currentPage === 1) {
    return <Loading />;
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <h1 className="text-3xl font-bold tracking-tight">Tickers Management</h1>
          <p className="text-muted-foreground">
            Manage cryptocurrency tickers and synchronize with external data sources
          </p>
        </div>
        
        <Button 
          onClick={handleSyncCoins} 
          disabled={syncing}
          className="flex items-center gap-2"
        >
          <RefreshCw className={`h-4 w-4 ${syncing ? 'animate-spin' : ''}`} />
          {syncing ? 'Syncing...' : 'Sync Coins'}
        </Button>
      </div>

      {/* Stats Cards */}
      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Total Coins</CardTitle>
            <Coins className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{totalCoins.toLocaleString()}</div>
            <p className="text-xs text-muted-foreground">
              Synchronized from CoinLore
            </p>
          </CardContent>
        </Card>
        
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Current Page</CardTitle>
            <DollarSign className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{currentPage} of {totalPages}</div>
            <p className="text-xs text-muted-foreground">
              Showing {coins.length} coins
            </p>
          </CardContent>
        </Card>
      </div>

      {/* Search and Filters */}
      <Card>
        <CardHeader>
          <CardTitle>Search Coins</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="flex items-center space-x-2">
            <div className="relative flex-1">
              <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
              <Input
                placeholder="Search by name or symbol..."
                value={searchQuery}
                onChange={(e) => handleSearch(e.target.value)}
                className="pl-10"
              />
            </div>
            {searchQuery && (
              <Button
                variant="outline"
                onClick={() => handleSearch("")}
              >
                Clear
              </Button>
            )}
          </div>
        </CardContent>
      </Card>

      {/* Coins Table */}
      <Card>
        <CardHeader>
          <CardTitle>Coins ({totalCoins.toLocaleString()})</CardTitle>
        </CardHeader>
        <CardContent>
          {loading ? (
            <div className="flex justify-center py-8">
              <RefreshCw className="h-8 w-8 animate-spin text-muted-foreground" />
            </div>
          ) : coins.length > 0 ? (
            <>
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead className="w-[60px]">Rank</TableHead>
                    <TableHead>Coin</TableHead>
                    <TableHead>Symbol</TableHead>
                    <TableHead>Name ID</TableHead>
                    <TableHead className="text-right">Actions</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {coins.map((coin) => (
                    <TableRow key={coin.id}>
                      <TableCell className="font-medium">
                        #{coin.rank}
                      </TableCell>
                      <TableCell>
                        <div className="flex items-center gap-3">
                          <div className="w-8 h-8 rounded-full bg-muted flex items-center justify-center overflow-hidden">
                            {!imageErrors.has(coin.id) ? (
                              <Image
                                src={getCoinImageUrl(coin.nameId)}
                                alt={coin.name}
                                width={32}
                                height={32}
                                className="rounded-full"
                                onError={() => handleImageError(coin.id)}
                              />
                            ) : (
                              <DollarSign className="h-5 w-5 text-muted-foreground" />
                            )}
                          </div>
                          <div>
                            <div className="font-medium">{coin.name}</div>
                            <div className="text-sm text-muted-foreground">
                              ID: {coin.id}
                            </div>
                          </div>
                        </div>
                      </TableCell>
                      <TableCell>
                        <span className="font-mono font-medium uppercase">
                          {coin.symbol}
                        </span>
                      </TableCell>
                      <TableCell>
                        <span className="font-mono text-sm">
                          {coin.nameId}
                        </span>
                      </TableCell>
                      <TableCell className="text-right">
                        <div className="text-xs text-muted-foreground">
                          {new Date(coin.updatedAt).toLocaleDateString()}
                        </div>
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>

              {/* Pagination */}
              {totalPages > 1 && (
                <div className="flex items-center justify-between mt-6">
                  <div className="text-sm text-muted-foreground">
                    Showing {((currentPage - 1) * limit) + 1} to {Math.min(currentPage * limit, totalCoins)} of {totalCoins.toLocaleString()} coins
                  </div>
                  <div className="flex items-center gap-2">
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => handlePageChange(currentPage - 1)}
                      disabled={currentPage === 1 || loading}
                    >
                      <ChevronLeft className="h-4 w-4" />
                      Previous
                    </Button>
                    
                    {/* Page numbers */}
                    <div className="flex items-center gap-1">
                      {Array.from({ length: Math.min(5, totalPages) }, (_, i) => {
                        let pageNum;
                        if (totalPages <= 5) {
                          pageNum = i + 1;
                        } else if (currentPage <= 3) {
                          pageNum = i + 1;
                        } else if (currentPage >= totalPages - 2) {
                          pageNum = totalPages - 4 + i;
                        } else {
                          pageNum = currentPage - 2 + i;
                        }
                        
                        return (
                          <Button
                            key={pageNum}
                            variant={currentPage === pageNum ? "default" : "outline"}
                            size="sm"
                            onClick={() => handlePageChange(pageNum)}
                            disabled={loading}
                            className="w-10"
                          >
                            {pageNum}
                          </Button>
                        );
                      })}
                    </div>
                    
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => handlePageChange(currentPage + 1)}
                      disabled={currentPage === totalPages || loading}
                    >
                      Next
                      <ChevronRight className="h-4 w-4" />
                    </Button>
                  </div>
                </div>
              )}
            </>
          ) : (
            <div className="text-center py-12 text-muted-foreground">
              <Coins className="h-12 w-12 mx-auto mb-4 opacity-50" />
              <p>No coins found</p>
              {searchQuery && (
                <p className="text-sm">Try a different search term or clear the search</p>
              )}
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
};

export default TickersPage;
