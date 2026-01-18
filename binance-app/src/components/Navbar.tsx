"use client";

import Link from "next/link";
import { useState, useEffect, useRef } from "react";
import { Sheet, SheetContent, SheetTrigger } from "@/components/ui/sheet";
import { Button } from "@/components/ui/button";
import { Search, Menu, X, Coins, Zap } from "lucide-react";
import { useSearchParams } from "next/navigation";
import { cn } from "@/lib/utils";

interface MarketSymbol {
    symbol: string;
    base: string;
    quote: string;
    type: 'SPOT' | 'FUTURE';
}

export function Navbar() {
    const [isScrolled, setIsScrolled] = useState(false);
    const [searchValue, setSearchValue] = useState("");
    const [markets, setMarkets] = useState<MarketSymbol[]>([]);
    const [filteredMarkets, setFilteredMarkets] = useState<MarketSymbol[]>([]);
    const [showResults, setShowResults] = useState(false);
    const searchRef = useRef<HTMLDivElement>(null);
    const searchParams = useSearchParams(); // Keep this from original

    useEffect(() => {
        const handleScroll = () => {
            setIsScrolled(window.scrollY > 10);
        };
        window.addEventListener("scroll", handleScroll);

        // Fetch markets on mount
        const fetchMarkets = async () => {
            try {
                const res = await fetch('/api/markets');
                const data = await res.json();
                if (Array.isArray(data)) setMarkets(data);
            } catch (e) {
                console.error("Failed to load markets", e);
            }
        };
        fetchMarkets();

        return () => window.removeEventListener("scroll", handleScroll);
    }, []);

    // Handle click outside to close results
    useEffect(() => {
        const handleClickOutside = (event: MouseEvent) => {
            if (searchRef.current && !searchRef.current.contains(event.target as Node)) {
                setShowResults(false);
            }
        };
        document.addEventListener("mousedown", handleClickOutside);
        return () => document.removeEventListener("mousedown", handleClickOutside);
    }, []);

    const handleSearch = (value: string) => {
        setSearchValue(value);
        if (value.length > 1) {
            const lower = value.toUpperCase();
            const filtered = markets.filter(m => m.symbol.includes(lower)).slice(0, 10);
            setFilteredMarkets(filtered);
            setShowResults(true);
        } else {
            setShowResults(false);
        }
    };

    const selectSymbol = (symbol: string) => {
        setSearchValue(symbol);
        setShowResults(false);
        window.location.href = `/?symbol=${symbol}`;
    };

    return (
        <header className={cn(
            "fixed top-0 w-full z-50 transition-all duration-300",
            isScrolled ? "bg-black/60 backdrop-blur-md border-b border-white/5" : "bg-transparent"
        )}>
            <div className="container mx-auto px-4 h-16 flex items-center justify-between">
                {/* Brand */}
                <Link href="/" className="flex items-center gap-2 font-bold text-xl text-primary">
                    <Coins className="w-6 h-6" />
                    <span>Binance<span className="text-white">Pro</span></span>
                </Link>

                {/* Desktop Nav */}
                <nav className="hidden md:flex items-center gap-8">
                    <Link href="/" className="text-sm font-medium text-white hover:text-primary transition-colors">Start Trading</Link>
                    <Link href="#" className="text-sm font-medium text-slate-400 hover:text-white transition-colors">Markets</Link>
                    <Link href="#" className="text-sm font-medium text-slate-400 hover:text-white transition-colors">Bot Strategies</Link>
                    <Link href="#" className="text-sm font-medium text-slate-400 hover:text-white transition-colors">Portfolio</Link>
                </nav>

                {/* Right Actions */}
                <div className="flex items-center gap-4">
                    {/* Search Bar - Market Scanner */}
                    <div className="hidden md:block relative" ref={searchRef}>
                        <div className="relative">
                            <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
                            <input
                                type="text"
                                placeholder="Search ANY Coin (e.g. PEPE, DOGE)..."
                                className="bg-slate-900/50 border border-white/10 rounded-full pl-10 pr-4 py-1.5 text-sm text-white focus:outline-none focus:border-primary w-64 transition-all focus:w-80"
                                value={searchValue}
                                onChange={(e) => handleSearch(e.target.value)}
                                onFocus={() => searchValue.length > 1 && setShowResults(true)}
                            />
                        </div>

                        {/* Autocomplete Results */}
                        {showResults && (
                            <div className="absolute top-full mt-2 left-0 w-full bg-slate-900 border border-white/10 rounded-xl shadow-2xl overflow-hidden max-h-80 overflow-y-auto">
                                {filteredMarkets.map((m) => (
                                    <div
                                        key={m.symbol}
                                        onClick={() => selectSymbol(m.symbol)}
                                        className="px-4 py-2 hover:bg-white/5 cursor-pointer flex items-center justify-between group"
                                    >
                                        <span className="font-medium text-white group-hover:text-primary transition-colors">{m.symbol}</span>
                                        <span className={cn(
                                            "text-[10px] px-1.5 py-0.5 rounded border",
                                            m.type === 'SPOT' ? "border-emerald-500/30 text-emerald-400" : "border-rose-500/30 text-rose-400"
                                        )}>
                                            {m.type}
                                        </span>
                                    </div>
                                ))}
                                {filteredMarkets.length === 0 && (
                                    <div className="px-4 py-3 text-xs text-slate-500 text-center">No markets found</div>
                                )}
                            </div>
                        )}
                    </div>

                    <div className="hidden md:flex items-center gap-2 px-3 py-1 rounded-full bg-emerald-500/10 border border-emerald-500/20">
                        <div className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse" />
                        <span className="text-xs font-medium text-emerald-500">System Online</span>
                    </div>

                    {/* Mobile Menu Trigger */}
                    <Sheet>
                        <SheetTrigger asChild>
                            <Button variant="ghost" size="icon" className="md:hidden text-white">
                                <Menu className="w-6 h-6" />
                            </Button>
                        </SheetTrigger>
                        <SheetContent side="right" className="bg-slate-950 border-white/10 w-80 p-0">
                            <div className="p-6 space-y-6">
                                <Link href="/" className="flex items-center gap-2 font-bold text-xl text-primary">
                                    <Coins className="w-6 h-6" />
                                    <span>BinanceApp</span>
                                </Link>
                                <nav className="flex flex-col gap-4">
                                    <Link href="/" className="text-lg font-medium text-white">Trading</Link>
                                    <Link href="#" className="text-lg font-medium text-slate-400">Markets</Link>
                                    <Link href="#" className="text-lg font-medium text-slate-400">Bots</Link>
                                    <Link href="#" className="text-lg font-medium text-slate-400">Portfolio</Link>
                                </nav>
                            </div>
                        </SheetContent>
                    </Sheet>
                </div>
            </div>
            <div className="md:hidden border-t border-white/5 bg-slate-950 p-4 space-y-4">
                {/* Mobile Search would go here if needed, but Sheet covers it */}
            </div>
        </header>
    );
}
