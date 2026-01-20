'use client';

import { useEffect, useState } from 'react';
import Link from 'next/link';
import { Button } from '@/components/ui/button';
import { Card, CardContent } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { 
  TrendingUp, 
  Shield, 
  Zap, 
  BarChart3, 
  Target, 
  Globe, 
  ArrowRight, 
  Play,
  CheckCircle,
  Star,
  Users,
  Brain,
} from 'lucide-react';
import ThemeSwitch from '@/components/ThemeSwitch';

export default function Home() {
  const [isVisible, setIsVisible] = useState(false);
  const [, setCurrentStat] = useState(0);
  const [scrollY, setScrollY] = useState(0);

  // Animated stats
  const stats = [
    { value: '$2.4M+', label: 'Assets Under Management', change: '+12.5%' },
    { value: '15,000+', label: 'Trusted Investors', change: '+8.2%' },
    { value: '95.3%', label: 'Profitable Signals', change: '+2.1%' },
    { value: '5+ Years', label: 'Market Experience', change: 'Proven' }
  ];

  // Features data
  const features = [
    {
      icon: Brain,
      title: 'Expert Market Analysis',
      description: 'Professional traders and analysts with decades of experience provide deep market insights and strategic recommendations.',
      color: 'text-blue-500'
    },
    {
      icon: Shield,
      title: 'Institutional-Grade Security',
      description: 'Your funds and data are protected with the same security standards used by major financial institutions.',
      color: 'text-green-500'
    },
    {
      icon: Zap,
      title: 'Real-Time Execution',
      description: 'Execute trades with precision timing based on our expert team\'s market analysis and proven strategies.',
      color: 'text-yellow-500'
    },
    {
      icon: Target,
      title: 'Proven Track Record',
      description: 'Our investment strategies are backed by years of successful market performance and consistent returns.',
      color: 'text-purple-500'
    },
    {
      icon: Globe,
      title: 'Global Opportunities',
      description: 'Access carefully curated investment opportunities across international markets, vetted by our expert team.',
      color: 'text-cyan-500'
    },
    {
      icon: BarChart3,
      title: 'Professional Insights',
      description: 'Receive detailed market reports and analysis from seasoned professionals who understand market dynamics.',
      color: 'text-orange-500'
    }
  ];

  // Testimonials
  const testimonials = [
    {
      name: 'Sarah Chen',
      role: 'Portfolio Manager, Chen Capital',
      content: 'The expert analysis and trading signals have consistently outperformed our internal research. The team really knows the market.',
      rating: 5,
      image: '/api/placeholder/48/48'
    },
    {
      name: 'Marcus Rodriguez',
      role: 'Independent Trader',
      content: 'Finally found a platform run by actual professionals. The market insights are incredibly detailed and accurate.',
      rating: 5,
      image: '/api/placeholder/48/48'
    },
    {
      name: 'Emily Watson',
      role: 'Investment Advisor',
      content: 'I recommend InvestPro to all my clients. The expertise behind their recommendations is clearly evident in the results.',
      rating: 5,
      image: '/api/placeholder/48/48'
    }
  ];

  // Scroll effect
  useEffect(() => {
    const handleScroll = () => setScrollY(window.scrollY);
    window.addEventListener('scroll', handleScroll);
    return () => window.removeEventListener('scroll', handleScroll);
  }, []);

  // Animation trigger
  useEffect(() => {
    const timer = setTimeout(() => setIsVisible(true), 100);
    const interval = setInterval(() => {
      setCurrentStat(prev => (prev + 1) % stats.length);
    }, 3000);
    return () => {
      clearTimeout(timer);
      clearInterval(interval);
    };
  }, [stats.length]);

  return (
    <div className="min-h-screen bg-linear-to-br from-background via-background to-muted">
      {/* Navigation */}
      <nav className="sticky top-0 z-50 backdrop-blur-xl bg-background/80 border-b border-border/50">
        <div className="container mx-auto px-4 py-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center space-x-2">
              <div className="w-10 h-10 bg-linear-to-r from-primary to-blue-600 rounded-xl flex items-center justify-center">
                <TrendingUp className="w-6 h-6 text-white" />
              </div>
              <span className="text-2xl font-bold bg-linear-to-r from-primary to-blue-600 bg-clip-text text-transparent">
                InvestPro
              </span>
            </div>
            
            <div className="flex items-center space-x-4">
              <Link href="/auth/login">
                <Button variant="ghost" className="hidden sm:flex">
                  Sign In
                </Button>
              </Link>
              <Link href="/auth/signup">
                <Button className="bg-linear-to-r from-primary to-blue-600 hover:from-primary/90 hover:to-blue-600/90">
                  Get Started
                  <ArrowRight className="w-4 h-4 ml-2" />
                </Button>
              </Link>
            </div>
          </div>
        </div>
      </nav>

      {/* Hero Section */}
      <section className="relative overflow-hidden min-h-[90vh] flex items-center">
        {/* Background Pattern */}
        <div className="absolute inset-0 opacity-5">
          <div className="grid grid-cols-12 gap-4 h-full">
            {[...Array(12)].map((_, i) => (
              <div key={i} className="border-r border-muted-foreground"></div>
            ))}
          </div>
        </div>

        {/* Floating Elements */}
        <div className="absolute inset-0 overflow-hidden pointer-events-none">
          <div 
            className="absolute top-1/4 left-1/4 w-32 h-32 bg-primary/10 rounded-full blur-xl"
            style={{ transform: `translateY(${scrollY * 0.2}px)` }}
          />
          <div 
            className="absolute bottom-1/3 right-1/4 w-48 h-48 bg-blue-500/10 rounded-full blur-2xl"
            style={{ transform: `translateY(${-scrollY * 0.15}px)` }}
          />
          <div 
            className="absolute top-1/2 right-1/3 w-24 h-24 bg-purple-500/10 rounded-full blur-lg"
            style={{ transform: `translateY(${scrollY * 0.25}px)` }}
          />
        </div>

        <div className="container mx-auto px-4 relative z-10">
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-12 items-center">
            {/* Left Column - Content */}
            <div 
              className={`transition-all duration-1000 ${
                isVisible ? 'opacity-100 translate-x-0' : 'opacity-0 -translate-x-10'
              }`}
            >
              <div className="space-y-8">
                <div className="inline-flex items-center space-x-2 bg-primary/10 px-4 py-2 rounded-full border border-primary/20">
                  <div className="w-2 h-2 bg-primary rounded-full animate-pulse"></div>
                  <span className="text-sm font-medium text-primary">Live Market Insights Available</span>
                </div>
                
                <h1 className="text-4xl md:text-6xl font-bold leading-tight">
                  Your Success is Our{' '}
                  <span className="relative inline-block">
                    <span className="bg-linear-to-r from-primary via-blue-600 to-purple-600 bg-clip-text text-transparent">
                      Expertise
                    </span>
                    <svg
                      className="absolute -bottom-2 left-0 w-full h-3 text-primary/30"
                      viewBox="0 0 100 10"
                      preserveAspectRatio="none"
                    >
                      <path
                        d="M0,8 Q50,0 100,8"
                        stroke="currentColor"
                        strokeWidth="2"
                        fill="none"
                        className="animate-pulse"
                      />
                    </svg>
                  </span>
                </h1>
                
                <p className="text-xl text-muted-foreground leading-relaxed max-w-lg">
                  Partner with seasoned professionals who have navigated every market condition. 
                  Get personalized strategies, not generic advice.
                </p>

                {/* Key Features */}
                <div className="grid grid-cols-2 gap-4 py-4">
                  <div className="flex items-center space-x-3">
                    <div className="w-8 h-8 bg-green-100 rounded-lg flex items-center justify-center">
                      <CheckCircle className="w-5 h-5 text-green-600" />
                    </div>
                    <span className="text-sm font-medium">95.3% Success Rate</span>
                  </div>
                  <div className="flex items-center space-x-3">
                    <div className="w-8 h-8 bg-blue-100 rounded-lg flex items-center justify-center">
                      <Shield className="w-5 h-5 text-blue-600" />
                    </div>
                    <span className="text-sm font-medium">Secure Platform</span>
                  </div>
                  <div className="flex items-center space-x-3">
                    <div className="w-8 h-8 bg-purple-100 rounded-lg flex items-center justify-center">
                      <Users className="w-5 h-5 text-purple-600" />
                    </div>
                    <span className="text-sm font-medium">Expert Team</span>
                  </div>
                  <div className="flex items-center space-x-3">
                    <div className="w-8 h-8 bg-orange-100 rounded-lg flex items-center justify-center">
                      <BarChart3 className="w-5 h-5 text-orange-600" />
                    </div>
                    <span className="text-sm font-medium">Real-time Analysis</span>
                  </div>
                </div>
                
                <div className="flex flex-col sm:flex-row gap-4">
                  <Link href="/auth/signup">
                    <Button size="lg" className="text-lg px-8 py-6 bg-primary hover:bg-primary/90 group">
                      Start Your Journey
                      <ArrowRight className="w-5 h-5 ml-2 group-hover:translate-x-1 transition-transform" />
                    </Button>
                  </Link>
                  <Button variant="outline" size="lg" className="text-lg px-8 py-6 group">
                    <Play className="w-5 h-5 mr-2 group-hover:scale-110 transition-transform" />
                    Meet Our Experts
                  </Button>
                </div>

                {/* Trust Indicators */}
                <div className="flex items-center space-x-6 pt-4">
                  <div className="text-center">
                    <div className="text-2xl font-bold text-foreground">$2.4M+</div>
                    <div className="text-xs text-muted-foreground">Assets Managed</div>
                  </div>
                  <div className="w-px h-12 bg-border"></div>
                  <div className="text-center">
                    <div className="text-2xl font-bold text-foreground">15K+</div>
                    <div className="text-xs text-muted-foreground">Happy Clients</div>
                  </div>
                  <div className="w-px h-12 bg-border"></div>
                  <div className="text-center">
                    <div className="text-2xl font-bold text-foreground">5+ Yrs</div>
                    <div className="text-xs text-muted-foreground">Experience</div>
                  </div>
                </div>
              </div>
            </div>

            {/* Right Column - Visual */}
            <div 
              className={`transition-all duration-1000 delay-300 ${
                isVisible ? 'opacity-100 translate-x-0' : 'opacity-0 translate-x-10'
              }`}
            >
              <div className="relative">
                {/* Main Card */}
                <Card className="bg-background/80 backdrop-blur-sm border border-border/50 p-8 relative z-10">
                  <div className="space-y-6">
                    <div className="flex items-center justify-between">
                      <h3 className="text-xl font-semibold">Portfolio Performance</h3>
                      <Badge variant="outline" className="bg-green-50 text-green-700 border-green-200">
                        +12.5% This Month
                      </Badge>
                    </div>
                    
                    {/* Mock Chart */}
                    <div className="h-48 bg-linear-to-b from-primary/10 to-transparent rounded-lg relative overflow-hidden">
                      <div className="absolute inset-0 flex items-end justify-between px-4 pb-4">
                        {[40, 60, 45, 80, 65, 90, 75, 95].map((height, index) => (
                          <div
                            key={index}
                            className="bg-primary/70 rounded-t-sm flex-1 mx-1 animate-pulse"
                            style={{ 
                              height: `${height}%`,
                              animationDelay: `${index * 100}ms`
                            }}
                          />
                        ))}
                      </div>
                      <div className="absolute top-4 left-4 text-2xl font-bold text-primary">
                        $124,567
                      </div>
                      <div className="absolute top-10 left-4 text-sm text-muted-foreground">
                        Total Portfolio Value
                      </div>
                    </div>

                    {/* Quick Stats */}
                    <div className="grid grid-cols-3 gap-4">
                      <div className="text-center p-3 bg-muted/30 rounded-lg">
                        <div className="text-lg font-semibold text-green-600">+8.2%</div>
                        <div className="text-xs text-muted-foreground">Today</div>
                      </div>
                      <div className="text-center p-3 bg-muted/30 rounded-lg">
                        <div className="text-lg font-semibold text-blue-600">89%</div>
                        <div className="text-xs text-muted-foreground">Win Rate</div>
                      </div>
                      <div className="text-center p-3 bg-muted/30 rounded-lg">
                        <div className="text-lg font-semibold text-purple-600">24h</div>
                        <div className="text-xs text-muted-foreground">Monitoring</div>
                      </div>
                    </div>
                  </div>
                </Card>

                {/* Floating Cards */}
                <Card className="absolute -top-4 -right-4 bg-green-50 border-green-200 p-4 w-32 z-20 animate-pulse">
                  <div className="text-center">
                    <div className="text-lg font-bold text-green-600">+$2,847</div>
                    <div className="text-xs text-green-700">Profit Today</div>
                  </div>
                </Card>

                <Card className="absolute -bottom-4 -left-4 bg-blue-50 border-blue-200 p-4 w-40 z-20" style={{ animationDelay: '1s' }}>
                  <div className="flex items-center space-x-2">
                    <div className="w-2 h-2 bg-green-500 rounded-full animate-pulse"></div>
                    <div>
                      <div className="text-sm font-semibold text-blue-700">Signal Active</div>
                      <div className="text-xs text-blue-600">BUY AAPL @ $175</div>
                    </div>
                  </div>
                </Card>
              </div>
            </div>
          </div>
        </div>

        {/* Scroll indicator */}
        <div className="absolute bottom-8 left-1/2 transform -translate-x-1/2 animate-bounce">
          <div className="w-6 h-10 border-2 border-muted-foreground/30 rounded-full flex justify-center">
            <div className="w-1 h-3 bg-muted-foreground/50 rounded-full mt-2 animate-pulse"></div>
          </div>
        </div>
      </section>

      {/* Features Section */}
      <section className="py-20 bg-muted/30">
        <div className="container mx-auto px-4">
          <div className="text-center mb-16">
            <h2 className="text-3xl md:text-5xl font-bold mb-4">
              Built by{' '}
              <span className="bg-linear-to-r from-primary to-blue-600 bg-clip-text text-transparent">
                Market Veterans
              </span>
            </h2>
            <p className="text-xl text-muted-foreground max-w-2xl mx-auto">
              Our platform combines decades of trading experience with modern technology to deliver exceptional results for serious investors.
            </p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
            {features.map((feature, index) => (
              <Card 
                key={feature.title}
                className={`group hover:scale-105 transition-all duration-300 bg-background/50 backdrop-blur-sm border-border/50 hover:border-primary/50 hover:shadow-xl hover:shadow-primary/10`}
                style={{ animationDelay: `${index * 100}ms` }}
              >
                <CardContent className="p-8">
                  <feature.icon className={`w-12 h-12 mb-6 ${feature.color} group-hover:scale-110 transition-transform duration-300`} />
                  <h3 className="text-xl font-semibold mb-3">{feature.title}</h3>
                  <p className="text-muted-foreground leading-relaxed">{feature.description}</p>
                </CardContent>
              </Card>
            ))}
          </div>
        </div>
      </section>

      {/* Testimonials */}
      <section className="py-20">
        <div className="container mx-auto px-4">
          <div className="text-center mb-16">
            <h2 className="text-3xl md:text-5xl font-bold mb-4">
              Trusted by{' '}
              <span className="bg-linear-to-r from-primary to-blue-600 bg-clip-text text-transparent">
                Professional Investors
              </span>
            </h2>
            <p className="text-xl text-muted-foreground">
              Hear from investment professionals who rely on our expert analysis and proven strategies
            </p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
            {testimonials.map((testimonial) => (
              <Card 
                key={testimonial.name}
                className="bg-background/50 backdrop-blur-sm border-border/50 hover:shadow-xl transition-all duration-300"
              >
                <CardContent className="p-8">
                  <div className="flex items-center mb-4">
                    {[...Array(testimonial.rating)].map((_, i) => (
                      <Star key={i} className="w-5 h-5 text-yellow-500 fill-current" />
                    ))}
                  </div>
                  <p className="text-muted-foreground mb-6 italic">&ldquo;{testimonial.content}&rdquo;</p>
                  <div className="flex items-center">
                    <div className="w-12 h-12 bg-linear-to-r from-primary to-blue-600 rounded-full flex items-center justify-center mr-4">
                      <Users className="w-6 h-6 text-white" />
                    </div>
                    <div>
                      <div className="font-semibold">{testimonial.name}</div>
                      <div className="text-sm text-muted-foreground">{testimonial.role}</div>
                    </div>
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>
        </div>
      </section>

      {/* CTA Section */}
      <section className="py-24 relative overflow-hidden">
        {/* Custom background pattern */}
        <div className="absolute inset-0 bg-linear-to-b from-muted/50 to-background"></div>
        <div className="absolute inset-0 opacity-10">
          <div className="grid grid-cols-8 h-full">
            {[...Array(8)].map((_, i) => (
              <div key={i} className="border-r border-muted-foreground/20"></div>
            ))}
          </div>
        </div>
        
        <div className="container mx-auto px-4 relative">
          <div className="max-w-6xl mx-auto">
            {/* Two-column layout */}
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-12 items-center">
              {/* Left column - Content */}
              <div className="space-y-8">
                <div>
                  <h2 className="text-3xl md:text-5xl font-bold mb-6 leading-tight">
                    Ready to Work with{' '}
                    <span className="text-primary">
                      Proven Experts?
                    </span>
                  </h2>
                  <p className="text-xl text-muted-foreground leading-relaxed">
                    Stop gambling with your investments. Join serious investors who trust our team of market professionals 
                    with over 50 years of combined trading experience.
                  </p>
                </div>

                {/* Value propositions */}
                <div className="space-y-4">
                  <div className="flex items-start space-x-4">
                    <div className="w-6 h-6 rounded-full bg-primary/20 flex items-center justify-center mt-1">
                      <CheckCircle className="w-4 h-4 text-primary" />
                    </div>
                    <div>
                      <h4 className="font-semibold mb-1">Expert-Vetted Opportunities</h4>
                      <p className="text-muted-foreground">Every recommendation comes from our team of certified financial analysts</p>
                    </div>
                  </div>
                  
                  <div className="flex items-start space-x-4">
                    <div className="w-6 h-6 rounded-full bg-primary/20 flex items-center justify-center mt-1">
                      <CheckCircle className="w-4 h-4 text-primary" />
                    </div>
                    <div>
                      <h4 className="font-semibold mb-1">Transparent Track Record</h4>
                      <p className="text-muted-foreground">View our complete performance history - no hidden losses or cherry-picked results</p>
                    </div>
                  </div>
                  
                  <div className="flex items-start space-x-4">
                    <div className="w-6 h-6 rounded-full bg-primary/20 flex items-center justify-center mt-1">
                      <CheckCircle className="w-4 h-4 text-primary" />
                    </div>
                    <div>
                      <h4 className="font-semibold mb-1">Direct Expert Access</h4>
                      <p className="text-muted-foreground">Get your questions answered by the same professionals who make the calls</p>
                    </div>
                  </div>
                </div>

                <div className="flex flex-col sm:flex-row gap-4">
                  <Link href="/auth/signup">
                    <Button size="lg" className="text-lg px-8 py-6 bg-primary hover:bg-primary/90">
                      Join the Professionals
                      <ArrowRight className="w-5 h-5 ml-2" />
                    </Button>
                  </Link>
                  <Button variant="outline" size="lg" className="text-lg px-8 py-6">
                    View Track Record
                  </Button>
                </div>
              </div>

              {/* Right column - Stats/Proof */}
              <div className="space-y-8">
                <Card className="p-8 bg-background border-2 border-primary/20">
                  <div className="text-center space-y-6">
                    <h3 className="text-2xl font-bold">Our Track Record Speaks</h3>
                    
                    <div className="grid grid-cols-2 gap-6">
                      <div className="text-center">
                        <div className="text-3xl font-bold text-primary mb-2">95.3%</div>
                        <div className="text-sm text-muted-foreground">Profitable Signal Rate</div>
                        <div className="text-xs text-green-600 mt-1">Verified by third party</div>
                      </div>
                      
                      <div className="text-center">
                        <div className="text-3xl font-bold text-primary mb-2">$2.4M+</div>
                        <div className="text-sm text-muted-foreground">Client Portfolios</div>
                        <div className="text-xs text-green-600 mt-1">Under management</div>
                      </div>
                      
                      <div className="text-center">
                        <div className="text-3xl font-bold text-primary mb-2">5+</div>
                        <div className="text-sm text-muted-foreground">Years Experience</div>
                        <div className="text-xs text-green-600 mt-1">Bull & bear markets</div>
                      </div>
                      
                      <div className="text-center">
                        <div className="text-3xl font-bold text-primary mb-2">24/7</div>
                        <div className="text-sm text-muted-foreground">Market Monitoring</div>
                        <div className="text-xs text-green-600 mt-1">Never miss opportunities</div>
                      </div>
                    </div>
                  </div>
                </Card>

                {/* Trust indicators */}
                <div className="text-center space-y-4">
                  <p className="text-sm text-muted-foreground">Trusted by investment professionals at:</p>
                  <div className="flex items-center justify-center space-x-8 text-xs text-muted-foreground">
                    <span className="px-4 py-2 bg-muted/50 rounded">Goldman Sachs</span>
                    <span className="px-4 py-2 bg-muted/50 rounded">Morgan Stanley</span>
                    <span className="px-4 py-2 bg-muted/50 rounded">JP Morgan</span>
                  </div>
                  <p className="text-xs text-muted-foreground/70">* Individual professionals, not institutional endorsements</p>
                </div>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* Footer */}
      <footer className="py-16 bg-background border-t border-border/50">
        <div className="container mx-auto px-4">
          <div className="grid grid-cols-1 md:grid-cols-4 gap-8 mb-8">
            {/* Brand Column */}
            <div className="space-y-4">
              <div className="flex items-center space-x-2">
                <div className="w-8 h-8 bg-linear-to-r from-primary to-blue-600 rounded-lg flex items-center justify-center">
                  <TrendingUp className="w-5 h-5 text-white" />
                </div>
                <span className="text-xl font-bold">InvestPro</span>
              </div>
              <p className="text-muted-foreground text-sm leading-relaxed">
                Professional investment guidance backed by decades of market experience. 
                Helping serious investors achieve their financial goals since 2019.
              </p>
            </div>

            {/* Services Column */}
            <div className="space-y-4">
              <h4 className="font-semibold">Services</h4>
              <ul className="space-y-2 text-sm text-muted-foreground">
                <li><Link href="#" className="hover:text-primary transition-colors">Expert Trading Signals</Link></li>
                <li><Link href="#" className="hover:text-primary transition-colors">Portfolio Management</Link></li>
                <li><Link href="#" className="hover:text-primary transition-colors">Market Analysis</Link></li>
                <li><Link href="#" className="hover:text-primary transition-colors">Investment Planning</Link></li>
              </ul>
            </div>

            {/* Company Column */}
            <div className="space-y-4">
              <h4 className="font-semibold">Company</h4>
              <ul className="space-y-2 text-sm text-muted-foreground">
                <li><Link href="#" className="hover:text-primary transition-colors">About Our Team</Link></li>
                <li><Link href="#" className="hover:text-primary transition-colors">Track Record</Link></li>
                <li><Link href="#" className="hover:text-primary transition-colors">Client Stories</Link></li>
                <li><Link href="#" className="hover:text-primary transition-colors">Contact</Link></li>
              </ul>
            </div>

            {/* Contact Column */}
            <div className="space-y-4">
              <h4 className="font-semibold">Preferences</h4>
              <div className="space-y-3">
                <div>
                  <p className="text-sm text-muted-foreground mb-2">Theme</p>
                  <ThemeSwitch />
                </div>
                <div className="text-sm text-muted-foreground">
                  <p>Professional support available</p>
                  <p>Monday - Friday, 8AM - 6PM EST</p>
                  <p className="text-primary font-medium">support@investpro.com</p>
                </div>
              </div>
            </div>
          </div>

          {/* Bottom Bar */}
          <div className="pt-8 border-t border-border/50">
            <div className="flex flex-col md:flex-row items-center justify-between">
              <div className="text-sm text-muted-foreground text-center md:text-left mb-4 md:mb-0">
                <p>&copy; 2026 InvestPro. All rights reserved.</p>
                <p className="mt-1">
                  Investment advisory services provided by licensed professionals. 
                  <Link href="#" className="text-primary hover:underline ml-1">View disclosures</Link>
                </p>
              </div>
              
              <div className="flex items-center space-x-6 text-sm text-muted-foreground">
                <Link href="#" className="hover:text-primary transition-colors">Privacy Policy</Link>
                <Link href="#" className="hover:text-primary transition-colors">Terms of Service</Link>
                <Link href="#" className="hover:text-primary transition-colors">Risk Disclosure</Link>
              </div>
            </div>
          </div>
        </div>
      </footer>
    </div>
  );
}
