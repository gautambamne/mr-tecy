"use client";

import { Bell, Menu, Wrench, LogOut, User } from "lucide-react"
import { SearchBar } from "@/components/SearchBar"
import { CategoryCard } from "@/components/CategoryCard"
import { ServiceCard } from "@/components/ServiceCard"
import { BottomNavigation } from "@/components/BottomNavigation"
import { Button } from "@/components/ui/button"
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu"
import { useAuth } from "@/context/AuthContext"
import Link from "next/link"
import { authService } from "@/services/auth.service"

export default function HomePage() {
  const { user, loading } = useAuth();

  const handleLogout = async () => {
    await authService.logout();
  }

  return (
    <div className="min-h-screen pb-24 bg-slate-50 relative">
      {/* Background Gradient Layer */}
      <div className="absolute top-0 left-0 right-0 h-[30vh] bg-gradient-to-b from-[#A1F6FB] via-[#DBFDFC] to-slate-50 pointer-events-none" />

      {/* Header */}
      <header className="px-4 pt-3 pb-0 relative">
        <div className="max-w-md mx-auto space-y-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-3">
              <Button variant="ghost" size="icon" className="text-slate-700 hover:text-blue-600 -ml-2">
                <Menu className="w-6 h-6" strokeWidth={2} />
              </Button>
              <div className="flex items-center gap-2">
                <div className="w-8 h-8 rounded-lg bg-blue-600 flex items-center justify-center transform rotate-3">
                  <div className="w-4 h-4 bg-white transform rotate-45"></div>
                </div>
                <h1 className="text-xl font-bold text-slate-950 tracking-tight">Mr tecy</h1>
              </div>
            </div>
            <div className="flex items-center gap-3">
              {!loading && (
                user ? (
                  <DropdownMenu>
                    <DropdownMenuTrigger asChild>
                      <Button variant="ghost" className="relative h-9 w-9 rounded-full p-0 border-2 border-white shadow-sm overflow-hidden">
                        <img
                          src={user.photoURL || "https://images.unsplash.com/photo-1494790108377-be9c29b29330?w=100&auto=format&fit=crop&q=80"}
                          alt="Profile"
                          className="w-full h-full object-cover"
                        />
                      </Button>
                    </DropdownMenuTrigger>
                    <DropdownMenuContent className="w-56" align="end" forceMount>
                      <DropdownMenuLabel className="font-normal">
                        <div className="flex flex-col space-y-1">
                          <p className="text-sm font-medium leading-none">My Account</p>
                          <p className="text-xs leading-none text-muted-foreground text-slate-500">
                            {user.email}
                          </p>
                        </div>
                      </DropdownMenuLabel>
                      <DropdownMenuSeparator />
                      <DropdownMenuItem>
                        <User className="mr-2 h-4 w-4" />
                        <span>Profile</span>
                      </DropdownMenuItem>
                      <DropdownMenuItem onClick={handleLogout} className="text-red-600 focus:text-red-600 focus:bg-red-50">
                        <LogOut className="mr-2 h-4 w-4" />
                        <span>Log out</span>
                      </DropdownMenuItem>
                    </DropdownMenuContent>
                  </DropdownMenu>
                ) : (
                  <Link href="/login">
                    <Button className="bg-blue-600 hover:bg-blue-700 text-white h-9 px-4 rounded-full text-sm font-medium shadow-sm transition-colors">
                      Login
                    </Button>
                  </Link>
                )
              )}
            </div>
          </div>

          {/* Search Bar moved to Header */}
          <SearchBar />
        </div>
      </header>


      {/* Main Content */}
      <main className="max-w-md mx-auto px-4 pt-6 pb-5 space-y-6 relative z-10">

        {/* Categories Section */}
        <section>
          <h2 className="text-sm font-bold text-blue-600 mb-3 ml-1">
            Appliances & Electronic
          </h2>
          <div className="grid grid-cols-4 gap-3">
            <CategoryCard
              image="https://images.unsplash.com/photo-1603386329225-868f9b1ee6c9?w=400&auto=format&fit=crop&q=80"
              label="Car"
            />
            <CategoryCard
              image="https://images.unsplash.com/photo-1558981852-426c6c22a060?w=400&auto=format&fit=crop&q=80"
              label="Bike"
            />
            <CategoryCard
              image="https://images.unsplash.com/photo-1621905251918-48416bd8575a?w=400&auto=format&fit=crop&q=80"
              label="Electrician"
            />
            <CategoryCard
              image="https://images.unsplash.com/photo-1598327105666-5b89351aff97?w=400&auto=format&fit=crop&q=80"
              label="Mobile"
            />
          </div>
        </section>


        {/* Promotional Banner */}
        <section>
          <div className="relative h-40 rounded-2xl overflow-hidden shadow-md">
            {/* Professional mechanic background image */}
            <img
              src="https://images.unsplash.com/photo-1486262715619-67b85e0b08d3?w=800&auto=format&fit=crop&q=80"
              alt="Professional mechanic at work"
              className="absolute inset-0 w-full h-full object-cover"
            />
            <div className="absolute inset-0 bg-gradient-to-r from-blue-900/90 to-blue-700/70 z-10"></div>
            <div className="absolute inset-0 z-20 flex items-center px-6">
              <div className="max-w-[60%]">
                <h3 className="text-xl font-bold text-white mb-2 leading-tight">
                  Get your car fixed at home
                </h3>
                <Button
                  variant="secondary"
                  size="sm"
                  className="bg-white text-blue-600 hover:bg-slate-50 font-semibold shadow-md text-xs h-9"
                >
                  Book a Mechanic →
                </Button>
              </div>
            </div>
          </div>
        </section>

        {/* Recommended Section */}
        <section>
          <div className="flex items-center justify-between mb-4">
            <h2 className="text-xs font-bold tracking-wider text-slate-400 uppercase">
              Recommended Services
            </h2>
            <button className="text-sm text-blue-600 font-medium hover:text-blue-700">
              View All
            </button>
          </div>
          <div className="grid grid-cols-2 gap-3">
            <ServiceCard
              title="Smart TV Repair"
              description="Expert technicians for all TV brands and models"
              image="https://images.unsplash.com/photo-1593359677879-a4bb92f829d1?w=400&auto=format&fit=crop&q=80"
              price="₹299"
            />
            <ServiceCard
              title="Washing Machine"
              description="Professional repair for automatic and manual machines"
              image="https://images.unsplash.com/photo-1626806787461-102c1bfaaea1?w=400&auto=format&fit=crop&q=80"
              price="₹199"
            />
            <ServiceCard
              title="AC Service"
              description="Complete servicing and maintenance for all AC types"
              image="https://images.unsplash.com/photo-1585366119957-e9730b6d0f60?w=400&auto=format&fit=crop&q=80"
              price="₹399"
              badge="Popular"
            />
            <ServiceCard
              title="Refrigerator Repair"
              description="Fast and reliable fridge repair services"
              image="https://images.unsplash.com/photo-1571175443880-49e1d25b2bc5?w=400&auto=format&fit=crop&q=80"
              price="₹349"
            />
          </div>
        </section>
      </main>

      {/* Bottom Navigation */}
      <BottomNavigation />
    </div>
  )
}
