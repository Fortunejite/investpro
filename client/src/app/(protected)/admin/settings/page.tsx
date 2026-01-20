'use client';

import { useState, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Badge } from '@/components/ui/badge';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog';
import { Wallet, MessageSquare, Settings2, Save, Edit, Plus, Eye, EyeOff, Mail, DollarSign } from 'lucide-react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import z from 'zod';
import { toast } from 'sonner';
import api from '@/lib/api';
import config from '@/lib/config';

const settingSchema = z.object({
  key: z.string().min(1, 'Key is required'),
  value: z.string().min(1, 'Value is required'),
});

interface Setting {
  key: string;
  value: string;
}

interface TelegramSettings {
  telegramBotToken?: string;
}

interface EmailSettings {
  emailUser?: string;
  emailPass?: string;
}

interface SignalPricingSettings {
  monthlySignalPrice?: string;
  quarterlySignalPrice?: string;
  annualSignalPrice?: string;
}

const AdminSettingsPage = () => {
  const [settings, setSettings] = useState<Record<string, string>>({});
  const [loading, setLoading] = useState(true);
  
  // Dialog states
  const [createDialogOpen, setCreateDialogOpen] = useState(false);
  const [editDialogOpen, setEditDialogOpen] = useState(false);
  const [editingSetting, setEditingSetting] = useState<Setting | null>(null);
  
  // Visibility states for sensitive data
  const [showBotToken, setShowBotToken] = useState(false);
  const [showEmailPass, setShowEmailPass] = useState(false);

  // Forms
  const createForm = useForm({
    resolver: zodResolver(settingSchema),
    defaultValues: {
      key: '',
      value: '',
    },
  });

  const editForm = useForm({
    resolver: zodResolver(settingSchema),
    defaultValues: {
      key: '',
      value: '',
    },
  });

  // Telegram form
  const telegramForm = useForm({
    defaultValues: { telegramBotToken: '' },
  });

  // Email form
  const emailForm = useForm({
    defaultValues: { 
      emailUser: '',
      emailPass: ''
    },
  });

  // Signal pricing form
  const signalPricingForm = useForm({
    defaultValues: {
      monthlySignalPrice: '',
      quarterlySignalPrice: '',
      annualSignalPrice: ''
    },
  });

  // Fetch settings
  const fetchSettings = async () => {
    try {
      setLoading(true);
      const response = await api.get<Record<string, string>>('/settings');
      setSettings(response.data);
      
      if (response.data.telegramBotToken) {
        telegramForm.reset({ telegramBotToken: response.data.telegramBotToken });
      }

      // Populate email form
      emailForm.reset({
        emailUser: response.data.emailUser || '',
        emailPass: response.data.emailPass || ''
      });

      // Populate signal pricing form
      signalPricingForm.reset({
        monthlySignalPrice: response.data.monthlySignalPrice || '',
        quarterlySignalPrice: response.data.quarterlySignalPrice || '',
        annualSignalPrice: response.data.annualSignalPrice || ''
      });
    } catch {
      toast.error('Failed to fetch settings');
    } finally {
      setLoading(false);
    }
  };

  // Update wallet address
  const handleWalletUpdate = async (chain: string, data: Record<string, string>) => {
    const key = `${chain}Address`;
    const value = data[key];

    if (!value) {
      toast.error('Address cannot be empty');
      return;
    }

    try {
      await api.put(`/settings/${key}`, { value });
      toast.success(`${config.chainInfo[chain as keyof typeof config.chainInfo]?.name || chain.toUpperCase()} address updated successfully`);
      fetchSettings();
    } catch {
      toast.error('Failed to update wallet address');
    }
  };

  // Update telegram settings
  const handleTelegramUpdate = async (data: TelegramSettings) => {
    if (!data.telegramBotToken) {
      toast.error('Bot token cannot be empty');
      return;
    }

    try {
      await api.put('/settings/telegramBotToken', { value: data.telegramBotToken });
      toast.success('Telegram bot token updated successfully');
      fetchSettings();
    } catch {
      toast.error('Failed to update Telegram settings');
    }
  };

  // Update email settings
  const handleEmailUpdate = async (data: EmailSettings) => {
    const updates = [];
    
    if (data.emailUser !== undefined) {
      updates.push({ key: 'emailUser', value: data.emailUser });
    }
    
    if (data.emailPass !== undefined) {
      updates.push({ key: 'emailPass', value: data.emailPass });
    }

    if (updates.length === 0) {
      toast.error('No changes to save');
      return;
    }

    try {
      await Promise.all(
        updates.map(({ key, value }) => 
          api.put(`/settings/${key}`, { value })
        )
      );
      toast.success('Email settings updated successfully');
      fetchSettings();
    } catch {
      toast.error('Failed to update email settings');
    }
  };

  // Update signal pricing settings
  const handleSignalPricingUpdate = async (data: SignalPricingSettings) => {
    const updates = [];
    
    if (data.monthlySignalPrice !== undefined) {
      updates.push({ key: 'monthlySignalPrice', value: data.monthlySignalPrice });
    }
    
    if (data.quarterlySignalPrice !== undefined) {
      updates.push({ key: 'quarterlySignalPrice', value: data.quarterlySignalPrice });
    }
    
    if (data.annualSignalPrice !== undefined) {
      updates.push({ key: 'annualSignalPrice', value: data.annualSignalPrice });
    }

    if (updates.length === 0) {
      toast.error('No changes to save');
      return;
    }

    try {
      await Promise.all(
        updates.map(({ key, value }) => 
          api.put(`/settings/${key}`, { value })
        )
      );
      toast.success('Signal pricing updated successfully');
      fetchSettings();
    } catch {
      toast.error('Failed to update signal pricing');
    }
  };

  // Create setting
  const handleCreateSetting = async (data: z.infer<typeof settingSchema>) => {
    try {
      await api.post('/settings', data);
      toast.success('Setting created successfully');
      setCreateDialogOpen(false);
      createForm.reset();
      fetchSettings();
    } catch {
      toast.error('Failed to create setting');
    }
  };

  // Edit setting
  const handleEditSetting = async (data: z.infer<typeof settingSchema>) => {
    if (!editingSetting) return;
    
    try {
      await api.put(`/settings/${editingSetting.key}`, { value: data.value });
      toast.success('Setting updated successfully');
      setEditDialogOpen(false);
      setEditingSetting(null);
      editForm.reset();
      fetchSettings();
    } catch {
      toast.error('Failed to update setting');
    }
  };

  // Open edit dialog
  const openEditDialog = (key: string, value: string) => {
    setEditingSetting({ key, value });
    editForm.reset({ key, value });
    setEditDialogOpen(true);
  };

  // Get chain info
  const getChainInfo = (chain: string) => {
    return config.chainInfo[chain as keyof typeof config.chainInfo] || { name: chain.toUpperCase(), symbol: chain.toUpperCase() };
  };

  // Truncate address for display
  const truncateAddress = (address: string, showFull = false) => {
    if (showFull || address.length <= 20) return address;
    return `${address.slice(0, 8)}...${address.slice(-8)}`;
  };

  // Mask sensitive data
  const maskToken = (token: string, show = false) => {
    if (show || token.length <= 8) return token;
    return `${token.slice(0, 4)}${'•'.repeat(token.length - 8)}${token.slice(-4)}`;
  };

  // Check if setting is sensitive
  const isSensitiveSetting = (key: string) => {
    return key.includes('token') || key.includes('Token') || key.includes('Pass') || key.includes('password');
  };

  // Format setting value for display
  const formatSettingValue = (key: string, value: string) => {
    if (isSensitiveSetting(key)) {
      return maskToken(value);
    }
    if (key.includes('Address')) {
      return truncateAddress(value);
    }
    if (key.includes('Price')) {
      return `$${value}`;
    }
    return value;
  };

  // Get setting category
  const getSettingCategory = (key: string) => {
    if (key.includes('Address')) return 'Wallet Addresses';
    if (key.includes('telegram') || key.includes('Telegram')) return 'Telegram';
    if (key.includes('email') || key.includes('Email')) return 'Email SMTP';
    if (key.includes('Price') || key.includes('Signal')) return 'Signal Pricing';
    return 'Other';
  };

  useEffect(() => {
    fetchSettings();
  }, []); // eslint-disable-line react-hooks/exhaustive-deps

  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center">
        <div>
          <h1 className="text-3xl font-bold text-foreground">Settings</h1>
          <p className="text-muted-foreground">Manage system configuration and settings</p>
        </div>
        
        <Dialog open={createDialogOpen} onOpenChange={setCreateDialogOpen}>
          <DialogTrigger asChild>
            <Button className="bg-primary text-primary-foreground hover:bg-primary/90">
              <Plus className="w-4 h-4 mr-2" />
              Add Setting
            </Button>
          </DialogTrigger>
          <DialogContent className="sm:max-w-md">
            <DialogHeader>
              <DialogTitle>Create New Setting</DialogTitle>
            </DialogHeader>
            <form onSubmit={createForm.handleSubmit(handleCreateSetting)} className="space-y-4">
              <div className="space-y-2">
                <Label htmlFor="key">Setting Key</Label>
                <Input
                  id="key"
                  placeholder="e.g., newAddress"
                  {...createForm.register('key')}
                />
                {createForm.formState.errors.key && (
                  <p className="text-sm text-destructive">{createForm.formState.errors.key.message}</p>
                )}
              </div>
              
              <div className="space-y-2">
                <Label htmlFor="value">Setting Value</Label>
                <Input
                  id="value"
                  placeholder="Enter value..."
                  {...createForm.register('value')}
                />
                {createForm.formState.errors.value && (
                  <p className="text-sm text-destructive">{createForm.formState.errors.value.message}</p>
                )}
              </div>

              {createForm.formState.errors.root && (
                <p className="text-sm text-destructive">{createForm.formState.errors.root.message}</p>
              )}

              <div className="flex justify-end space-x-2">
                <Button type="button" variant="outline" onClick={() => setCreateDialogOpen(false)}>
                  Cancel
                </Button>
                <Button type="submit" disabled={createForm.formState.isSubmitting}>
                  {createForm.formState.isSubmitting ? 'Creating...' : 'Create Setting'}
                </Button>
              </div>
            </form>
          </DialogContent>
        </Dialog>
      </div>

      {loading ? (
        <div className="flex justify-center py-8">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary"></div>
        </div>
      ) : (
        <Tabs defaultValue="wallets" className="space-y-6">
          <TabsList>
            <TabsTrigger value="wallets">Wallet Addresses</TabsTrigger>
            <TabsTrigger value="telegram">Telegram</TabsTrigger>
            <TabsTrigger value="email">Email SMTP</TabsTrigger>
            <TabsTrigger value="pricing">Signal Pricing</TabsTrigger>
            <TabsTrigger value="all">All Settings</TabsTrigger>
          </TabsList>

          <TabsContent value="wallets" className="space-y-6">
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Wallet className="w-5 h-5" />
                  Deposit Wallet Addresses
                </CardTitle>
                <p className="text-sm text-muted-foreground">
                  Configure wallet addresses for receiving deposits on different blockchains
                </p>
              </CardHeader>
              <CardContent className="space-y-6">
                {config.chains.map((chain) => {
                  const chainInfo = getChainInfo(chain);
                  const currentAddress = settings[`${chain}Address`];
                  
                  return (
                    <div key={chain} className="space-y-4">
                      <div className="flex items-center justify-between">
                        <div className="flex items-center gap-3">
                          <Badge variant="outline" className="text-sm">
                            {chainInfo.symbol}
                          </Badge>
                          <div>
                            <p className="font-medium">{chainInfo.name}</p>
                            <p className="text-sm text-muted-foreground">
                              {currentAddress ? 'Address configured' : 'No address set'}
                            </p>
                          </div>
                        </div>
                      </div>
                      
                      <form
                        onSubmit={(e) => {
                          e.preventDefault();
                          const formData = new FormData(e.target as HTMLFormElement);
                          const address = formData.get(`${chain}Address`) as string;
                          if (address) {
                            handleWalletUpdate(chain, { [`${chain}Address`]: address });
                          }
                        }}
                        className="grid grid-cols-1 md:grid-cols-4 gap-4"
                      >
                        <div className="md:col-span-3 space-y-2">
                          <Label htmlFor={`${chain}Address`}>
                            {chainInfo.name} Address
                          </Label>
                          <Input
                            id={`${chain}Address`}
                            name={`${chain}Address`}
                            placeholder={`Enter ${chainInfo.symbol} wallet address`}
                            defaultValue={currentAddress || ''}
                          />
                          {currentAddress && (
                            <p className="text-xs text-muted-foreground">
                              Current: {truncateAddress(currentAddress)}
                            </p>
                          )}
                        </div>
                        
                        <div className="flex items-end">
                          <Button type="submit" className="w-full">
                            <Save className="w-4 h-4 mr-2" />
                            Save
                          </Button>
                        </div>
                      </form>
                    </div>
                  );
                })}
              </CardContent>
            </Card>
          </TabsContent>

          <TabsContent value="telegram" className="space-y-6">
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <MessageSquare className="w-5 h-5" />
                  Telegram Configuration
                </CardTitle>
                <p className="text-sm text-muted-foreground">
                  Configure Telegram bot settings for notifications and trading signals
                </p>
              </CardHeader>
              <CardContent>
                <form
                  onSubmit={telegramForm.handleSubmit(handleTelegramUpdate)}
                  className="space-y-4"
                >
                  <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
                    <div className="md:col-span-3 space-y-2">
                      <Label htmlFor="telegramBotToken">
                        Bot Token
                      </Label>
                      <div className="relative">
                        <Input
                          id="telegramBotToken"
                          type={showBotToken ? 'text' : 'password'}
                          placeholder="Enter Telegram bot token"
                          {...telegramForm.register('telegramBotToken')}
                        />
                        <Button
                          type="button"
                          variant="ghost"
                          size="sm"
                          className="absolute right-2 top-1/2 -translate-y-1/2"
                          onClick={() => setShowBotToken(!showBotToken)}
                        >
                          {showBotToken ? (
                            <EyeOff className="w-4 h-4" />
                          ) : (
                            <Eye className="w-4 h-4" />
                          )}
                        </Button>
                      </div>
                      {settings.telegramBotToken && (
                        <p className="text-xs text-muted-foreground">
                          Current: {maskToken(settings.telegramBotToken, showBotToken)}
                        </p>
                      )}
                      <p className="text-xs text-muted-foreground">
                        Get your bot token from @BotFather on Telegram
                      </p>
                    </div>
                    
                    <div className="flex items-end">
                      <Button 
                        type="submit" 
                        disabled={telegramForm.formState.isSubmitting}
                        className="w-full"
                      >
                        <Save className="w-4 h-4 mr-2" />
                        {telegramForm.formState.isSubmitting ? 'Saving...' : 'Save'}
                      </Button>
                    </div>
                  </div>
                </form>
              </CardContent>
            </Card>
          </TabsContent>

          <TabsContent value="email" className="space-y-6">
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Mail className="w-5 h-5" />
                  Email SMTP Configuration
                </CardTitle>
                <p className="text-sm text-muted-foreground">
                  Configure Gmail SMTP settings for sending email notifications
                </p>
              </CardHeader>
              <CardContent>
                <form
                  onSubmit={emailForm.handleSubmit(handleEmailUpdate)}
                  className="space-y-6"
                >
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                    <div className="space-y-2">
                      <Label htmlFor="emailUser">
                        Gmail Username
                      </Label>
                      <Input
                        id="emailUser"
                        type="email"
                        placeholder="your.email@gmail.com"
                        {...emailForm.register('emailUser')}
                      />
                      {settings.emailUser && (
                        <p className="text-xs text-muted-foreground">
                          Current: {settings.emailUser}
                        </p>
                      )}
                    </div>

                    <div className="space-y-2">
                      <Label htmlFor="emailPass">
                        Gmail App Password
                      </Label>
                      <div className="relative">
                        <Input
                          id="emailPass"
                          type={showEmailPass ? 'text' : 'password'}
                          placeholder="Enter Gmail app password"
                          {...emailForm.register('emailPass')}
                        />
                        <Button
                          type="button"
                          variant="ghost"
                          size="sm"
                          className="absolute right-2 top-1/2 -translate-y-1/2"
                          onClick={() => setShowEmailPass(!showEmailPass)}
                        >
                          {showEmailPass ? (
                            <EyeOff className="w-4 h-4" />
                          ) : (
                            <Eye className="w-4 h-4" />
                          )}
                        </Button>
                      </div>
                      {settings.emailPass && (
                        <p className="text-xs text-muted-foreground">
                          Current: {maskToken(settings.emailPass, showEmailPass)}
                        </p>
                      )}
                      <p className="text-xs text-muted-foreground">
                        Generate an app password from your Google Account settings
                      </p>
                    </div>
                  </div>
                  
                  <div className="flex justify-end">
                    <Button 
                      type="submit" 
                      disabled={emailForm.formState.isSubmitting}
                      className="min-w-24"
                    >
                      <Save className="w-4 h-4 mr-2" />
                      {emailForm.formState.isSubmitting ? 'Saving...' : 'Save Email Settings'}
                    </Button>
                  </div>
                </form>
              </CardContent>
            </Card>
          </TabsContent>

          <TabsContent value="pricing" className="space-y-6">
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <DollarSign className="w-5 h-5" />
                  Trading Signal Pricing
                </CardTitle>
                <p className="text-sm text-muted-foreground">
                  Configure subscription pricing for trading signal packages
                </p>
              </CardHeader>
              <CardContent>
                <form
                  onSubmit={signalPricingForm.handleSubmit(handleSignalPricingUpdate)}
                  className="space-y-6"
                >
                  <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                    <div className="space-y-2">
                      <Label htmlFor="monthlySignalPrice">
                        Monthly Price (USD)
                      </Label>
                      <Input
                        id="monthlySignalPrice"
                        type="number"
                        step="0.01"
                        min="0"
                        placeholder="29.99"
                        {...signalPricingForm.register('monthlySignalPrice')}
                      />
                      {settings.monthlySignalPrice && (
                        <p className="text-xs text-muted-foreground">
                          Current: ${settings.monthlySignalPrice}
                        </p>
                      )}
                    </div>

                    <div className="space-y-2">
                      <Label htmlFor="quarterlySignalPrice">
                        Quarterly Price (USD)
                      </Label>
                      <Input
                        id="quarterlySignalPrice"
                        type="number"
                        step="0.01"
                        min="0"
                        placeholder="79.99"
                        {...signalPricingForm.register('quarterlySignalPrice')}
                      />
                      {settings.quarterlySignalPrice && (
                        <p className="text-xs text-muted-foreground">
                          Current: ${settings.quarterlySignalPrice}
                        </p>
                      )}
                    </div>

                    <div className="space-y-2">
                      <Label htmlFor="annualSignalPrice">
                        Annual Price (USD)
                      </Label>
                      <Input
                        id="annualSignalPrice"
                        type="number"
                        step="0.01"
                        min="0"
                        placeholder="299.99"
                        {...signalPricingForm.register('annualSignalPrice')}
                      />
                      {settings.annualSignalPrice && (
                        <p className="text-xs text-muted-foreground">
                          Current: ${settings.annualSignalPrice}
                        </p>
                      )}
                    </div>
                  </div>
                  
                  <div className="flex justify-end">
                    <Button 
                      type="submit" 
                      disabled={signalPricingForm.formState.isSubmitting}
                      className="min-w-24"
                    >
                      <Save className="w-4 h-4 mr-2" />
                      {signalPricingForm.formState.isSubmitting ? 'Saving...' : 'Save Pricing'}
                    </Button>
                  </div>
                </form>
              </CardContent>
            </Card>
          </TabsContent>

          <TabsContent value="all" className="space-y-6">
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Settings2 className="w-5 h-5" />
                  All System Settings
                </CardTitle>
                <p className="text-sm text-muted-foreground">
                  Overview of all configured system settings grouped by category
                </p>
              </CardHeader>
              <CardContent>
                {Object.entries(settings).length === 0 ? (
                  <div className="text-center py-8 text-muted-foreground">
                    No settings configured
                  </div>
                ) : (
                  <div className="space-y-6">
                    {/* Group settings by category */}
                    {['Wallet Addresses', 'Telegram', 'Email SMTP', 'Signal Pricing', 'Other'].map(category => {
                      const categorySettings = Object.entries(settings).filter(([key]) => 
                        getSettingCategory(key) === category
                      );
                      
                      if (categorySettings.length === 0) return null;
                      
                      return (
                        <div key={category} className="space-y-3">
                          <h3 className="text-lg font-semibold text-foreground border-b border-border pb-2">
                            {category}
                          </h3>
                          <div className="space-y-3">
                            {categorySettings.map(([key, value]) => (
                              <div
                                key={key}
                                className="flex items-center justify-between p-4 border border-border rounded-lg hover:bg-muted/50 transition-colors"
                              >
                                <div className="space-y-1">
                                  <div className="flex items-center gap-2">
                                    <p className="font-medium">{key}</p>
                                    {isSensitiveSetting(key) && (
                                      <Badge variant="secondary" className="text-xs">
                                        Sensitive
                                      </Badge>
                                    )}
                                  </div>
                                  <p className="text-sm text-muted-foreground">
                                    {formatSettingValue(key, value)}
                                  </p>
                                </div>
                                <Button
                                  size="sm"
                                  variant="outline"
                                  onClick={() => openEditDialog(key, value)}
                                >
                                  <Edit className="w-4 h-4" />
                                </Button>
                              </div>
                            ))}
                          </div>
                        </div>
                      );
                    })}
                  </div>
                )}
              </CardContent>
            </Card>
          </TabsContent>
        </Tabs>
      )}

      {/* Edit Setting Dialog */}
      <Dialog open={editDialogOpen} onOpenChange={setEditDialogOpen}>
        <DialogContent className="sm:max-w-md">
          <DialogHeader>
            <DialogTitle>Edit Setting</DialogTitle>
          </DialogHeader>
          <form onSubmit={editForm.handleSubmit(handleEditSetting)} className="space-y-4">
            <div className="space-y-2">
              <Label htmlFor="edit-key">Setting Key</Label>
              <Input
                id="edit-key"
                {...editForm.register('key')}
                disabled
                className="bg-muted"
              />
            </div>
            
            <div className="space-y-2">
              <Label htmlFor="edit-value">Setting Value</Label>
              <Input
                id="edit-value"
                placeholder="Enter value..."
                {...editForm.register('value')}
              />
              {editForm.formState.errors.value && (
                <p className="text-sm text-destructive">{editForm.formState.errors.value.message}</p>
              )}
            </div>

            {editForm.formState.errors.root && (
              <p className="text-sm text-destructive">{editForm.formState.errors.root.message}</p>
            )}

            <div className="flex justify-end space-x-2">
              <Button 
                type="button" 
                variant="outline" 
                onClick={() => {
                  setEditDialogOpen(false);
                  setEditingSetting(null);
                }}
              >
                Cancel
              </Button>
              <Button type="submit" disabled={editForm.formState.isSubmitting}>
                {editForm.formState.isSubmitting ? 'Updating...' : 'Update Setting'}
              </Button>
            </div>
          </form>
        </DialogContent>
      </Dialog>
    </div>
  );
};

export default AdminSettingsPage;
