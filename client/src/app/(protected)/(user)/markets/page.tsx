"use client";

import { useState, useEffect } from "react";
import Image from "next/image";
import { useRouter } from "next/navigation";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { 
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { 
  TrendingUp, 
  TrendingDown, 
  ChevronLeft, 
  ChevronRight,
  Search,
  RefreshCw,
  DollarSign,
  BarChart3
} from "lucide-react";
import { Input } from "@/components/ui/input";
import { Ticker } from "@/types/ticker";
import Loading from "@/components/Loading";
import api, { isAxiosError, PagedResponse } from "@/lib/api";

const MarketsPage = () => {
  const router = useRouter();
  const LIMIT = 100;

  const [tickers, setTickers] = useState<Ticker[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [page, setPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);
  const [searchQuery, setSearchQuery] = useState("");
  const [refreshing, setRefreshing] = useState(false);

  const [imageErrors, setImageErrors] = useState<Set<string>>(new Set());

  const handleImageError = (tickerId: string) => {
    setImageErrors(prev => new Set(prev).add(tickerId));
  };

  const getTickers = async (pageNum: number) => {
    try {
      setLoading(pageNum === 1);
      setError(null);

      const response = await api.get<PagedResponse<Ticker>>(`/market/coins/?page=${pageNum}&limit=${LIMIT}`);

      setTickers(response.data.data || []);
      
      setTotalPages(response.data.pagination.total);
    } catch (err) {
      if (isAxiosError(err)) {
        setError(err.response?.data?.message || "Failed to fetch market data");
      } else {
        setError(err instanceof Error ? err.message : "Failed to fetch market data");
      }
      setTickers([]);
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  };

  const handleRefresh = async () => {
    setRefreshing(true);
    await getTickers(page);
  };

  const formatCurrency = (value: string | number) => {
    const num = typeof value === "string" ? parseFloat(value) : value;
    if (isNaN(num)) return "$0.00";
    
    if (num >= 1e9) {
      return `$${(num / 1e9).toFixed(2)}B`;
    } else if (num >= 1e6) {
      return `$${(num / 1e6).toFixed(2)}M`;
    } else if (num >= 1000) {
      return `$${(num / 1000).toFixed(2)}K`;
    } else if (num >= 1) {
      return `$${num.toFixed(2)}`;
    } else {
      return `$${num.toFixed(6)}`;
    }
  };

  const formatPercentage = (value: string) => {
    const num = parseFloat(value);
    if (isNaN(num)) return "0.00%";
    return `${num >= 0 ? "+" : ""}${num.toFixed(2)}%`;
  };

  const getPercentageColor = (value: string) => {
    const num = parseFloat(value);
    if (isNaN(num)) return "text-muted-foreground";
    return num >= 0 ? "text-green-600 dark:text-green-400" : "text-red-600 dark:text-red-400";
  };

  const filteredTickers = tickers.filter(ticker =>
    ticker.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
    ticker.symbol.toLowerCase().includes(searchQuery.toLowerCase())
  );

  useEffect(() => {
    getTickers(page);
  }, [page]);

  if (loading && page === 1) {
    return <Loading />;
  }

  return (
    <div>
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <h1 className="text-3xl font-bold tracking-tight">Market Overview</h1>
          <p className="text-muted-foreground">
            Real-time cryptocurrency prices and market data
          </p>
        </div>
        
        <Button 
          onClick={handleRefresh} 
          variant="outline" 
          disabled={refreshing}
          className="flex items-center gap-2"
        >
          <RefreshCw className={`h-4 w-4 ${refreshing ? "animate-spin" : ""}`} />
          Refresh
        </Button>
      </div>

      {/* Search Bar */}
      <div className="flex justify-center">
        <Card className="w-full max-w-md">
          <CardContent className="p-4">
            <div className="relative">
              <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-muted-foreground h-4 w-4" />
              <Input
                placeholder="Search cryptocurrencies..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="pl-9"
              />
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Error State */}
      {error && (
        <Card className="border-destructive/50 bg-destructive/10">
          <CardContent className="p-4">
            <div className="flex items-center gap-2 text-destructive">
              <TrendingDown className="h-4 w-4" />
              <span>Error loading market data: {error}</span>
            </div>
            <Button 
              onClick={handleRefresh} 
              variant="outline" 
              size="sm" 
              className="mt-2"
            >
              Try Again
            </Button>
          </CardContent>
        </Card>
      )}

      {/* Market Data */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <BarChart3 className="h-5 w-5" />
            Cryptocurrency Prices
            <Badge variant="secondary" className="ml-auto">
              Page {page} of {totalPages}
            </Badge>
          </CardTitle>
        </CardHeader>
        <CardContent className="p-0">
          {filteredTickers.length === 0 && !loading ? (
            <div className="p-8 text-center text-muted-foreground">
              {searchQuery ? "No cryptocurrencies found matching your search." : "No market data available."}
            </div>
          ) : (
            <>
              {/* Desktop Table */}
              <div className="hidden md:block">
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead>Rank</TableHead>
                      <TableHead>Coin</TableHead>
                      <TableHead className="text-right">Price</TableHead>
                      <TableHead className="text-right">1h</TableHead>
                      <TableHead className="text-right">24h</TableHead>
                      <TableHead className="text-right">7d</TableHead>
                      <TableHead className="text-right">Market Cap</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {filteredTickers.map((ticker) => (
                      <TableRow 
                        key={ticker.id} 
                        className="cursor-pointer hover:bg-muted/50 transition-colors"
                        onClick={() => router.push(`/markets/${ticker.id}`)}
                      >
                        <TableCell>
                          <span className="text-sm text-muted-foreground">
                            #{ticker.rank}
                          </span>
                        </TableCell>
                        
                        <TableCell>
                          <div className="flex items-center gap-3">
                            <div className="w-8 h-8 rounded-full bg-muted flex items-center justify-center overflow-hidden relative">
                              {!imageErrors.has(ticker.id) ? (
                                <Image
                                  src={ticker.img}
                                  alt={ticker.name}
                                  width={24}
                                  height={24}
                                  className="rounded-full"
                                  onError={() => handleImageError(ticker.id)}
                                />
                              ) : (
                                <DollarSign className="h-4 w-4 text-muted-foreground" />
                              )}
                            </div>
                            <div>
                              <div className="font-medium">{ticker.name}</div>
                              <div className="text-sm text-muted-foreground">
                                {ticker.symbol.toUpperCase()}
                              </div>
                            </div>
                          </div>
                        </TableCell>
                        
                        <TableCell className="text-right font-mono">
                          {formatCurrency(ticker.price_usd)}
                        </TableCell>
                        
                        <TableCell className={`text-right font-mono ${getPercentageColor(ticker.percent_change_1h)}`}>
                          <div className="flex items-center justify-end gap-1">
                            {parseFloat(ticker.percent_change_1h) >= 0 ? (
                              <TrendingUp className="h-3 w-3" />
                            ) : (
                              <TrendingDown className="h-3 w-3" />
                            )}
                            {formatPercentage(ticker.percent_change_1h)}
                          </div>
                        </TableCell>
                        
                        <TableCell className={`text-right font-mono ${getPercentageColor(ticker.percent_change_24h)}`}>
                          <div className="flex items-center justify-end gap-1">
                            {parseFloat(ticker.percent_change_24h) >= 0 ? (
                              <TrendingUp className="h-3 w-3" />
                            ) : (
                              <TrendingDown className="h-3 w-3" />
                            )}
                            {formatPercentage(ticker.percent_change_24h)}
                          </div>
                        </TableCell>
                        
                        <TableCell className={`text-right font-mono ${getPercentageColor(ticker.percent_change_7d)}`}>
                          <div className="flex items-center justify-end gap-1">
                            {parseFloat(ticker.percent_change_7d) >= 0 ? (
                              <TrendingUp className="h-3 w-3" />
                            ) : (
                              <TrendingDown className="h-3 w-3" />
                            )}
                            {formatPercentage(ticker.percent_change_7d)}
                          </div>
                        </TableCell>
                        
                        <TableCell className="text-right font-mono">
                          {formatCurrency(ticker.market_cap_usd)}
                        </TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              </div>

              {/* Mobile Layout */}
              <div className="md:hidden divide-y">
                {filteredTickers.map((ticker) => (
                  <div
                    key={ticker.id}
                    className="p-4 hover:bg-muted/50 transition-colors cursor-pointer"
                    onClick={() => router.push(`/markets/${ticker.id}`)}
                  >
                    <div className="space-y-3">
                      <div className="flex items-center justify-between">
                        <div className="flex items-center gap-3">
                          <div className="w-10 h-10 rounded-full bg-muted flex items-center justify-center overflow-hidden relative">
                            {!imageErrors.has(ticker.id) ? (
                              <Image
                                src={ticker.img}
                                alt={ticker.name}
                                width={32}
                                height={32}
                                className="rounded-full"
                                onError={() => handleImageError(ticker.id)}
                              />
                            ) : (
                              <DollarSign className="h-5 w-5 text-muted-foreground" />
                            )}
                          </div>
                          <div>
                            <div className="font-medium">{ticker.name}</div>
                            <div className="text-sm text-muted-foreground">
                              #{ticker.rank} • {ticker.symbol.toUpperCase()}
                            </div>
                          </div>
                        </div>
                        <div className="text-right">
                          <div className="font-mono text-lg">
                            {formatCurrency(ticker.price_usd)}
                          </div>
                          <div className={`font-mono text-sm ${getPercentageColor(ticker.percent_change_24h)}`}>
                            {formatPercentage(ticker.percent_change_24h)}
                          </div>
                        </div>
                      </div>
                      
                      <div className="grid grid-cols-3 gap-4 text-sm">
                        <div>
                          <div className="text-muted-foreground">1h</div>
                          <div className={`font-mono ${getPercentageColor(ticker.percent_change_1h)}`}>
                            {formatPercentage(ticker.percent_change_1h)}
                          </div>
                        </div>
                        <div>
                          <div className="text-muted-foreground">7d</div>
                          <div className={`font-mono ${getPercentageColor(ticker.percent_change_7d)}`}>
                            {formatPercentage(ticker.percent_change_7d)}
                          </div>
                        </div>
                        <div>
                          <div className="text-muted-foreground">Market Cap</div>
                          <div className="font-mono">
                            {formatCurrency(ticker.market_cap_usd)}
                          </div>
                        </div>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            </>
          )}
        </CardContent>
      </Card>

      {/* Pagination */}
      <Card>
        <CardContent className="p-4">
          <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
            <div className="text-sm text-muted-foreground text-center sm:text-left">
              Showing {LIMIT} cryptocurrencies per page
            </div>
            
            <div className="flex items-center justify-center gap-2">
              <Button
                variant="outline"
                size="sm"
                onClick={() => setPage(Math.max(1, page - 1))}
                disabled={page === 1 || loading}
                className="flex items-center gap-1"
              >
                <ChevronLeft className="h-4 w-4" />
                <span className="hidden xs:inline">Previous</span>
                <span className="xs:hidden">Prev</span>
              </Button>
              
              <div className="text-sm px-3 py-1.5 bg-muted rounded-md font-medium">
                Page {page} of {totalPages}
              </div>
              
              <Button
                variant="outline"
                size="sm"
                onClick={() => setPage(page + 1)}
                disabled={page >= totalPages || loading}
                className="flex items-center gap-1"
              >
                <span className="hidden xs:inline">Next</span>
                <span className="xs:hidden">Next</span>
                <ChevronRight className="h-4 w-4" />
              </Button>
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  );
};

export default MarketsPage;