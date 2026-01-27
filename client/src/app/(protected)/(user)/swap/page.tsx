"use client";

import { useState, useEffect, useCallback, useRef } from "react";
import Image from "next/image";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import {
  Drawer,
  DrawerContent,
  DrawerHeader,
  DrawerTitle,
  DrawerTrigger,
} from "@/components/ui/drawer";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { 
  RefreshCw,
  History,
  Search,
  DollarSign,
  ChevronDown,
  ChevronLeft,
  ChevronRight,
  ArrowDownUp
} from "lucide-react";
import { toast } from "sonner";
import api from "@/lib/api";
import Loading from "@/components/Loading";
import { Asset, Coin, Swap } from "@/types/asset";
import { Account } from "@/types/account";

const SwapPage = () => {
  // State management
  const [assets, setAssets] = useState<Asset[]>([]);
  const [account, setAccount] = useState<Account | null>(null);
  const [swapHistory, setSwapHistory] = useState<Swap[]>([]);
  const [loading, setLoading] = useState(true);
  const [swapping, setSwapping] = useState(false);
  const [loadingPrices, setLoadingPrices] = useState(false);
  
  // Swap form state
  const [sellAsset, setSellAsset] = useState<string>("");
  const [buyAsset, setBuyAsset] = useState<string>("");
  const [sellAmount, setSellAmount] = useState<string>("");
  
  // Drawer state
  const [sellDrawerOpen, setSellDrawerOpen] = useState(false);
  const [buyDrawerOpen, setBuyDrawerOpen] = useState(false);
  const [sellSearchQuery, setSellSearchQuery] = useState("");
  const [buySearchQuery, setBuySearchQuery] = useState("");
  
  // Coin data state with pagination
  const [coins, setCoins] = useState<Coin[]>([]);
  const [coinPage, setCoinPage] = useState(1);
  const [coinHasMore, setCoinHasMore] = useState(true);
  const [coinLoading, setCoinLoading] = useState(false);
  
  // Price state
  const [sellPrice, setSellPrice] = useState<number>(1);
  const [buyPrice, setBuyPrice] = useState<number>(1);
  const [exchangeRate, setExchangeRate] = useState<number>(0);
  const [estimatedOutput, setEstimatedOutput] = useState<number>(0);
  
  // History pagination
  const [historyPage, setHistoryPage] = useState(1);
  const [historyTotal, setHistoryTotal] = useState(0);
  
  // Image error tracking
  const [imageErrors, setImageErrors] = useState<Set<string>>(new Set());
  
  // Quick percentage buttons
  const percentages = [25, 50, 75, 100];

  const isAccountAsset = (coinId: string) => coinId === 'account';
  
  const findCoinSymbol = (coinId: string) => {
    if (isAccountAsset(coinId)) return 'USD';
    const coin = coins.find(c => c.id === coinId);
    return coin?.symbol.toUpperCase();
  };

  // const getCoinImageUrl = (nameId: string) => {
  //   return `https://www.coinlore.com/img/50x50/${nameId}.png`;
  // };

  const handleImageError = (coinId: string) => {
    setImageErrors(prev => new Set(prev).add(coinId));
  };

  const getCoinInfo = (coinId: string) => {
    if (isAccountAsset(coinId)) {
      return { name: 'USD Balance', symbol: 'USD', nameId: null };
    }
    const coin = coins.find(c => c.id === coinId);
    return coin ? { name: coin.name, symbol: coin.symbol, nameId: coin.nameId, img: coin.img } : null;
  };

  // Debounced search
  const debounceRef = useRef<NodeJS.Timeout | null>(null);

  // Fetch coins with pagination and search
  const fetchCoins = useCallback(async (page: number, search?: string) => {
    try {
      setCoinLoading(true);

      const response = await api.get('/coins', {
        params: {
          page,
          limit: 50,
          search
        }
      });
      
      const newCoins = response.data.data || [];

      if (page === 1) {
        setCoins(newCoins);
      } else {
        setCoins(prev => [...prev, ...newCoins]);
      }
      setCoinHasMore(newCoins.length === 50);
      setCoinPage(page);
    } catch (error) {
      console.error(`Error fetching coins:`, error);
      toast.error(`Failed to load coins`);
    } finally {
      setCoinLoading(false);
    }
  }, []);

  const debouncedSearch = useCallback((query: string) => {
    if (debounceRef.current) {
      clearTimeout(debounceRef.current);
    }
    
    debounceRef.current = setTimeout(() => {
      setCoinPage(1);
      setCoins([]);
      fetchCoins(1, query);
    });
  }, [fetchCoins]);

  // Load more coins (infinite scroll)
  const loadMoreCoins = () => {
    const nextPage = coinPage + 1;
    fetchCoins(nextPage);
  };

  // Fetch initial data
  const fetchInitialData = useCallback(async () => {
    try {
      setLoading(true);
      const [assetsRes, accountRes, historyRes] = await Promise.all([
        api.get('/assets'),
        api.get('/account'),
        api.get('/swaps?page=1&limit=10')
      ]);

      setAssets(assetsRes.data.data || []);
      setAccount(accountRes.data);
      setSwapHistory(historyRes.data.data || []);
      setHistoryTotal(historyRes.data.pagination?.total || 0);
      fetchCoins(1);
    } catch (error) {
      console.error('Error fetching initial data:', error);
      toast.error('Failed to load swap data');
    } finally {
      setLoading(false);
    }
  }, [fetchCoins]);

  // Fetch swap history with pagination
  const fetchSwapHistory = async (page: number) => {
    try {
      const response = await api.get(`/swaps?page=${page}&limit=10`);
      setSwapHistory(response.data.data || []);
      setHistoryTotal(response.data.pagination?.total || 0);
      setHistoryPage(page);
    } catch (error) {
      console.error('Error fetching swap history:', error);
      toast.error('Failed to load swap history');
    }
  };

  // Fetch price for a specific coin
  const fetchCoinPrice = async (coinId: string): Promise<number> => {
    if (isAccountAsset(coinId)) return 1;
    
    try {
      const response = await api.get(`/market/coins/${coinId}`);
      return parseFloat(response.data.price_usd);
    } catch (error) {
      console.error(`Error fetching price for ${coinId}:`, error);
      return 0;
    }
  };

  // Update exchange rate and estimated output
  const updateExchangeRate = async () => {
    if (!sellAsset || !buyAsset || !sellAmount) {
      setExchangeRate(0);
      setEstimatedOutput(0);
      return;
    }

    try {
      setLoadingPrices(true);
      const [sellPriceValue, buyPriceValue] = await Promise.all([
        fetchCoinPrice(sellAsset),
        fetchCoinPrice(buyAsset)
      ]);

      setSellPrice(sellPriceValue);
      setBuyPrice(buyPriceValue);

      if (buyPriceValue > 0) {
        const rate = sellPriceValue / buyPriceValue;
        setExchangeRate(rate);
        setEstimatedOutput(parseFloat(sellAmount) * rate);
      }
    } catch (error) {
      console.error('Error calculating exchange rate:', error);
      toast.error('Failed to calculate exchange rate');
    } finally {
      setLoadingPrices(false);
    }
  };

  // Handle asset swap
  const handleSwap = async () => {
    if (!sellAsset || !buyAsset || !sellAmount || parseFloat(sellAmount) <= 0) {
      toast.error('Please fill in all required fields');
      return;
    }

    if (sellAsset === buyAsset) {
      toast.error('Sell and buy assets must be different');
      return;
    }

    if (hasInsufficientBalance()) {
      toast.error(`Insufficient ${findCoinSymbol(sellAsset)} balance`);
      return;
    }

    try {
      setSwapping(true);
      await api.post('/swaps', {
        fromAssetCoinId: sellAsset,
        toAssetCoinId: buyAsset,
        amount: parseFloat(sellAmount)
      });

      toast.success('Assets swapped successfully!');
      
      // Reset form
      setSellAmount("");
      setEstimatedOutput(0);
      setExchangeRate(0);
      
      // Refresh data
      await fetchInitialData();
    } catch (error: unknown) {
      console.error('Error swapping assets:', error);
      const errorMessage = error instanceof Error && 'response' in error 
        ? (error as { response?: { data?: { message?: string } } }).response?.data?.message 
        : 'Failed to swap assets';
      toast.error(errorMessage || 'Failed to swap assets');
    } finally {
      setSwapping(false);
    }
  };

  // Handle asset switching
  const handleSwitchAssets = () => {
    const tempSell = sellAsset;
    setSellAsset(buyAsset);
    setBuyAsset(tempSell);
  };

  // Get available balance for selected asset
  const getAvailableBalance = (assetId: string) => {
    if (isAccountAsset(assetId)) {
      return parseFloat(account?.availableBalance || "0") || 0;
    }
    const asset = assets.find(a => a.coinId === assetId);
    return parseFloat(asset?.availableBalance || "0") || 0;
  };

  // Handle percentage buttons
  const handlePercentageClick = (percentage: number) => {
    if (!sellAsset) return;
    const balance = getAvailableBalance(sellAsset);
    const amount = (balance * percentage) / 100;
    setSellAmount(amount > 0 ? amount.toFixed(8) : "0");
  };

  // Validate if user has sufficient balance
  const hasInsufficientBalance = () => {
    if (!sellAsset || !sellAmount) return false;
    const balance = getAvailableBalance(sellAsset);
    const amount = parseFloat(sellAmount);
    return amount > balance;
  };

  // Get all available assets (account + user assets) for selling
  const getAllAvailableAssets = () => {
    return [
      { 
        id: 'account', 
        name: 'USD Balance', 
        symbol: 'USD', 
        nameId: null,
        balance: parseFloat(account?.availableBalance || '0') || 0 
      },
      ...assets.map(asset => ({
        id: asset.coinId,
        name: asset.coin.name,
        symbol: asset.coin.symbol,
        nameId: asset.coin.nameId,
        img: asset.coin.img,
        balance: parseFloat(asset.availableBalance) || 0
      }))
    ];
  };

  useEffect(() => {
    fetchInitialData();
  }, [fetchInitialData]);

  useEffect(() => {
    updateExchangeRate();
  }, [sellAsset, buyAsset, sellAmount]); // eslint-disable-line react-hooks/exhaustive-deps

  useEffect(() => {
    if (sellSearchQuery !== undefined) {
      debouncedSearch(sellSearchQuery);
    }
  }, [sellSearchQuery, debouncedSearch]);

  useEffect(() => {
    if (buySearchQuery !== undefined) {
      debouncedSearch(buySearchQuery);
    }
  }, [buySearchQuery, debouncedSearch]);

  if (loading) {
    return <Loading />;
  }

  return (
    <div>
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <h1 className="text-3xl font-bold tracking-tight">Swap</h1>
          <p className="text-muted-foreground">
            Trade your crypto assets instantly
          </p>
        </div>
        
        <Button 
          onClick={fetchInitialData} 
          variant="outline"
          className="flex items-center gap-2"
        >
          <RefreshCw className="h-4 w-4" />
          Refresh
        </Button>
      </div>

      {/* Swap Interface */}
      <div className="max-w-lg mx-auto">
        <Card>
          <CardContent className="p-6 space-y-4">
            {/* Sell Section */}
            <div className="space-y-3">
              <div className="flex items-center justify-between">
                <label className="text-sm font-medium">Sell</label>
                <div className="flex gap-2">
                  {percentages.map(percentage => (
                    <Button
                      key={percentage}
                      variant="ghost"
                      size="sm"
                      onClick={() => handlePercentageClick(percentage)}
                      className="h-7 px-3 text-xs font-medium hover:bg-primary/10 hover:text-primary transition-colors"
                      disabled={!sellAsset}
                    >
                      {percentage === 100 ? 'Max' : `${percentage}%`}
                    </Button>
                  ))}
                </div>
              </div>
              
              <div className={`p-4 border rounded-xl space-y-3 transition-colors ${
                hasInsufficientBalance() ? 'bg-red-50 border-red-200 dark:bg-red-950/20 dark:border-red-800' : 'bg-muted/30'
              }`}>
                <div className="flex items-center justify-between">
                  <Input
                    type="text"
                    placeholder="0"
                    value={sellAmount}
                    onChange={(e) => setSellAmount(e.target.value)}
                    className={`border-none bg-transparent text-2xl font-semibold p-0 h-auto shadow-none focus-visible:ring-0 ${
                      hasInsufficientBalance() ? 'text-red-600 dark:text-red-400' : ''
                    }`}
                  />
                  
                  <Drawer open={sellDrawerOpen} onOpenChange={setSellDrawerOpen}>
                    <DrawerTrigger asChild>
                      <Button variant="outline" className="h-12 px-4 min-w-[120px] hover:bg-muted/50 transition-colors">
                        {sellAsset ? (
                          <div className="flex items-center gap-3">
                            <div className="w-8 h-8 rounded-full bg-background flex items-center justify-center overflow-hidden border">
                              {sellAsset === 'account' ? (
                                <DollarSign className="h-5 w-5 text-muted-foreground" />
                              ) : (
                                <>
                                  {!imageErrors.has(sellAsset) ? (
                                    <Image
                                      src={getCoinInfo(sellAsset)?.img || ''}
                                      alt={getCoinInfo(sellAsset)?.name || ''}
                                      width={32}
                                      height={32}
                                      className="rounded-full"
                                      onError={() => handleImageError(sellAsset)}
                                    />
                                  ) : (
                                    <DollarSign className="h-5 w-5 text-muted-foreground" />
                                  )}
                                </>
                              )}
                            </div>
                            <span className="font-semibold text-base">
                              {findCoinSymbol(sellAsset)}
                            </span>
                          </div>
                        ) : (
                          <span className="text-muted-foreground">Select asset</span>
                        )}
                        <ChevronDown className="h-4 w-4 ml-2" />
                      </Button>
                    </DrawerTrigger>
                    <DrawerContent>
                      <DrawerHeader>
                        <DrawerTitle>Select Asset to Sell</DrawerTitle>
                        <div className="relative mt-4">
                          <Input
                            placeholder="Search assets..."
                            value={sellSearchQuery}
                            onChange={(e) => setSellSearchQuery(e.target.value)}
                            className="pl-9"
                          />
                          <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                        </div>
                      </DrawerHeader>
                      <div className="px-4 pb-6 max-h-96 overflow-y-auto">
                        <div className="space-y-2">
                          {/* Available Assets */}
                          {getAllAvailableAssets().map((asset) => (
                            <button
                              key={asset.id}
                              onClick={() => {
                                setSellAsset(asset.id);
                                setSellDrawerOpen(false);
                              }}
                              className="w-full flex items-center justify-between p-3 rounded-lg hover:bg-muted transition-colors text-left"
                            >
                              <div className="flex items-center gap-3">
                                <div className="w-8 h-8 rounded-full bg-background flex items-center justify-center overflow-hidden">
                                  {asset.id === 'account' ? (
                                    <DollarSign className="h-5 w-5 text-muted-foreground" />
                                  ) : (
                                    <>
                                      {!imageErrors.has(asset.id) && asset.nameId ? (
                                        <Image
                                          src={asset.img}
                                          alt={asset.name}
                                          width={32}
                                          height={32}
                                          className="rounded-full"
                                          onError={() => handleImageError(asset.id)}
                                        />
                                      ) : (
                                        <DollarSign className="h-5 w-5 text-muted-foreground" />
                                      )}
                                    </>
                                  )}
                                </div>
                                <div>
                                  <div className="font-medium">{asset.name}</div>
                                  <div className="text-sm text-muted-foreground">
                                    {asset.symbol.toUpperCase()}
                                  </div>
                                </div>
                              </div>
                              <div className="text-right">
                                <div className="font-mono font-medium">
                                  {asset.balance.toFixed(6)}
                                </div>
                              </div>
                            </button>
                          ))}

                          {/* Other Coins */}
                          {coins.filter(coin => !getAllAvailableAssets().find(a => a.id === coin.id)).map((coin) => (
                            <button
                              key={coin.id}
                              onClick={() => {
                                setSellAsset(coin.id);
                                setSellDrawerOpen(false);
                              }}
                              className="w-full flex items-center justify-between p-3 rounded-lg hover:bg-muted transition-colors text-left"
                            >
                              <div className="flex items-center gap-3">
                                <div className="w-8 h-8 rounded-full bg-background flex items-center justify-center overflow-hidden">
                                  {!imageErrors.has(coin.id) ? (
                                    <Image
                                      src={coin.img}
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
                                    {coin.symbol.toUpperCase()}
                                  </div>
                                </div>
                              </div>
                              <div className="text-right">
                                <div className="font-mono font-medium text-muted-foreground">
                                  0.00
                                </div>
                              </div>
                            </button>
                          ))}

                          {coinLoading && (
                            <div className="flex justify-center py-4">
                              <RefreshCw className="h-6 w-6 animate-spin text-muted-foreground" />
                            </div>
                          )}

                          {coinHasMore && !coinLoading && (
                            <Button
                              variant="ghost"
                              onClick={() => loadMoreCoins()}
                              className="w-full mt-2"
                            >
                              Load More
                            </Button>
                          )}
                        </div>
                      </div>
                    </DrawerContent>
                  </Drawer>
                </div>
                
                {sellAsset && (
                  <div className={`text-sm ${hasInsufficientBalance() ? 'text-red-600 dark:text-red-400' : 'text-muted-foreground'}`}>
                    ${(parseFloat(sellAmount || '0') * sellPrice).toFixed(2)}
                  </div>
                )}
                
                {sellAsset && (
                  <div className="flex justify-between items-center text-xs">
                    <span className={hasInsufficientBalance() ? 'text-red-600 dark:text-red-400 font-medium' : 'text-muted-foreground'}>
                      {hasInsufficientBalance() ? 'Insufficient balance' : 'Available'}
                    </span>
                    <span className={`font-mono ${hasInsufficientBalance() ? 'text-red-600 dark:text-red-400' : 'text-muted-foreground'}`}>
                      {getAvailableBalance(sellAsset).toFixed(8)} {findCoinSymbol(sellAsset)}
                    </span>
                  </div>
                )}
              </div>
            </div>

            {/* Swap Direction Button */}
            <div className="flex justify-center">
              <Button
                variant="outline"
                size="icon"
                onClick={handleSwitchAssets}
                className="rounded-full h-10 w-10"
                disabled={!sellAsset || !buyAsset}
              >
                <ArrowDownUp className="h-4 w-4" />
              </Button>
            </div>

            {/* Buy Section */}
            <div className="space-y-3">
              <label className="text-sm font-medium">Buy</label>
              
              <div className="p-4 border rounded-xl space-y-3 bg-muted/30">
                <div className="flex items-center justify-between">
                  <div className="text-2xl font-semibold text-primary">
                    {loadingPrices ? (
                      <div className="flex items-center gap-2">
                        <RefreshCw className="h-5 w-5 animate-spin" />
                        <span>...</span>
                      </div>
                    ) : estimatedOutput > 0 ? (
                      estimatedOutput.toFixed(8)
                    ) : (
                      '0'
                    )}
                  </div>
                  
                  <Drawer open={buyDrawerOpen} onOpenChange={setBuyDrawerOpen}>
                    <DrawerTrigger asChild>
                      <Button variant="outline" className="h-12 px-4 min-w-[120px] hover:bg-muted/50 transition-colors">
                        {buyAsset ? (
                          <div className="flex items-center gap-3">
                            <div className="w-8 h-8 rounded-full bg-background flex items-center justify-center overflow-hidden border">
                              {buyAsset === 'account' ? (
                                <DollarSign className="h-5 w-5 text-muted-foreground" />
                              ) : (
                                <>
                                  {!imageErrors.has(buyAsset) ? (
                                    <Image
                                      src={getCoinInfo(buyAsset)?.img || ''}
                                      alt={getCoinInfo(buyAsset)?.name || ''}
                                      width={32}
                                      height={32}
                                      className="rounded-full"
                                      onError={() => handleImageError(buyAsset)}
                                    />
                                  ) : (
                                    <DollarSign className="h-5 w-5 text-muted-foreground" />
                                  )}
                                </>
                              )}
                            </div>
                            <span className="font-semibold text-base">
                              {findCoinSymbol(buyAsset)}
                            </span>
                          </div>
                        ) : (
                          <span className="text-muted-foreground">Select asset</span>
                        )}
                        <ChevronDown className="h-4 w-4 ml-2" />
                      </Button>
                    </DrawerTrigger>
                    <DrawerContent>
                      <DrawerHeader>
                        <DrawerTitle>Select Asset to Buy</DrawerTitle>
                        <div className="relative mt-4">
                          <Input
                            placeholder="Search assets..."
                            value={buySearchQuery}
                            onChange={(e) => setBuySearchQuery(e.target.value)}
                            className="pl-9"
                          />
                          <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                        </div>
                      </DrawerHeader>
                      <div className="px-4 pb-6 max-h-96 overflow-y-auto">
                        <div className="space-y-2">
                          {/* USD Balance Option */}
                          <button
                            onClick={() => {
                              setBuyAsset('account');
                              setBuyDrawerOpen(false);
                            }}
                            className="w-full flex items-center justify-between p-3 rounded-lg hover:bg-muted transition-colors text-left"
                          >
                            <div className="flex items-center gap-3">
                              <div className="w-8 h-8 rounded-full bg-background flex items-center justify-center">
                                <DollarSign className="h-5 w-5 text-muted-foreground" />
                              </div>
                              <div>
                                <div className="font-medium">USD Balance</div>
                                <div className="text-sm text-muted-foreground">USD</div>
                              </div>
                            </div>
                            <div className="text-right">
                              <div className="font-mono font-medium">
                                {parseFloat(account?.availableBalance || '0').toFixed(2)}
                              </div>
                            </div>
                          </button>

                          {/* Coins */}
                          {coins.map((coin) => (
                            <button
                              key={coin.id}
                              onClick={() => {
                                setBuyAsset(coin.id);
                                setBuyDrawerOpen(false);
                              }}
                              className="w-full flex items-center justify-between p-3 rounded-lg hover:bg-muted transition-colors text-left"
                            >
                              <div className="flex items-center gap-3">
                                <div className="w-8 h-8 rounded-full bg-background flex items-center justify-center overflow-hidden">
                                  {!imageErrors.has(coin.id) ? (
                                    <Image
                                      src={coin.img}
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
                                    {coin.symbol.toUpperCase()}
                                  </div>
                                </div>
                              </div>
                              <div className="text-right">
                                <div className="font-mono font-medium">
                                  {assets.find(a => a.coinId === coin.id)?.availableBalance 
                                    ? parseFloat(assets.find(a => a.coinId === coin.id)?.availableBalance || '0').toFixed(6)
                                    : '0.00'
                                  }
                                </div>
                              </div>
                            </button>
                          ))}

                          {coinLoading && (
                            <div className="flex justify-center py-4">
                              <RefreshCw className="h-6 w-6 animate-spin text-muted-foreground" />
                            </div>
                          )}

                          {coinHasMore && !coinLoading && (
                            <Button
                              variant="ghost"
                              onClick={() => loadMoreCoins()}
                              className="w-full mt-2"
                            >
                              Load More
                            </Button>
                          )}
                        </div>
                      </div>
                    </DrawerContent>
                  </Drawer>
                </div>
                
                {buyAsset && estimatedOutput > 0 && (
                  <div className="text-sm text-muted-foreground">
                    ${(estimatedOutput * buyPrice).toFixed(2)}
                  </div>
                )}
              </div>
            </div>

            {/* Exchange Rate Info */}
            {sellAsset && buyAsset && (
              <div className="text-center space-y-2">
                {loadingPrices ? (
                  <div className="flex items-center justify-center gap-2 text-sm text-muted-foreground">
                    <RefreshCw className="h-4 w-4 animate-spin" />
                    Fetching rate...
                  </div>
                ) : exchangeRate > 0 ? (
                  <div className="text-sm text-muted-foreground">
                    1 {findCoinSymbol(sellAsset)} = {exchangeRate.toFixed(isAccountAsset(buyAsset) ? 2 : 8)} {findCoinSymbol(buyAsset)}
                  </div>
                ) : sellAmount && parseFloat(sellAmount) > 0 ? (
                  <div className="text-sm text-red-600 dark:text-red-400">
                    Unable to fetch exchange rate
                  </div>
                ) : null}
              </div>
            )}

            {/* Swap Button */}
            <Button
              onClick={handleSwap}
              disabled={!sellAsset || !buyAsset || !sellAmount || parseFloat(sellAmount) <= 0 || swapping || loadingPrices || hasInsufficientBalance()}
              className={`w-full py-6 text-lg font-semibold transition-colors ${
                hasInsufficientBalance() ? 'bg-red-600 hover:bg-red-700 text-white' : ''
              }`}
              size="lg"
              variant={hasInsufficientBalance() ? "destructive" : "default"}
            >
              {swapping ? (
                <>
                  <RefreshCw className="mr-2 h-5 w-5 animate-spin" />
                  Swapping...
                </>
              ) : !sellAsset || !buyAsset ? (
                'Select assets to swap'
              ) : !sellAmount || parseFloat(sellAmount) <= 0 ? (
                'Enter amount to swap'
              ) : hasInsufficientBalance() ? (
                `Insufficient ${findCoinSymbol(sellAsset)} balance`
              ) : loadingPrices ? (
                'Calculating rate...'
              ) : (
                `Swap ${findCoinSymbol(sellAsset)} for ${findCoinSymbol(buyAsset)}`
              )}
            </Button>
          </CardContent>
        </Card>
      </div>

      {/* Swap History */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <History className="h-5 w-5" />
            Swap History
          </CardTitle>
        </CardHeader>
        <CardContent>
          {swapHistory.length > 0 ? (
            <>
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Date</TableHead>
                    <TableHead>From</TableHead>
                    <TableHead>To</TableHead>
                    <TableHead>Rate</TableHead>
                    <TableHead className="text-right">Amount</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {swapHistory.map((swap) => (
                    <TableRow key={swap.id}>
                      <TableCell className="text-sm">
                        {new Date(swap.createdAt).toLocaleDateString('en-US', {
                          month: 'short',
                          day: 'numeric',
                          year: 'numeric'
                        })}
                      </TableCell>
                      <TableCell>
                        <div className="font-mono text-sm">
                          {parseFloat(swap.amount).toFixed(6)} {findCoinSymbol(swap.fromAsset.coinId)}
                        </div>
                      </TableCell>
                      <TableCell>
                        <div className="font-mono text-sm">
                          {(parseFloat(swap.amount) * parseFloat(swap.exchangeRate)).toFixed(6)} {findCoinSymbol(swap.toAsset.coinId)}
                        </div>
                      </TableCell>
                      <TableCell>
                        <div className="font-mono text-sm">
                          1:{parseFloat(swap.exchangeRate).toFixed(6)}
                        </div>
                      </TableCell>
                      <TableCell className="text-right">
                        <div className="font-mono text-sm">
                          ${(parseFloat(swap.amount) * 1).toFixed(2)}
                        </div>
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>

              {/* Pagination */}
              {historyTotal > 10 && (
                <div className="flex items-center justify-between mt-6">
                  <div className="text-sm text-muted-foreground">
                    Showing {Math.min((historyPage - 1) * 10 + 1, historyTotal)} to {Math.min(historyPage * 10, historyTotal)} of {historyTotal} swaps
                  </div>
                  <div className="flex items-center gap-2">
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => fetchSwapHistory(historyPage - 1)}
                      disabled={historyPage === 1}
                    >
                      <ChevronLeft className="h-4 w-4" />
                      Previous
                    </Button>
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => fetchSwapHistory(historyPage + 1)}
                      disabled={historyPage * 10 >= historyTotal}
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
              <History className="h-12 w-12 mx-auto mb-4 opacity-50" />
              <p>No swap history</p>
              <p className="text-sm">Your swaps will appear here</p>
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
};

export default SwapPage;
