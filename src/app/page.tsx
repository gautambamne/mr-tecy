"use client";

import { useState, useEffect } from "react"
import { Wrench, LogOut, User, LayoutDashboard, Search } from "lucide-react"
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
import { serviceService } from "@/services/service.service"
import { Service } from "@/types"
import { Skeleton } from "@/components/ui/skeleton"

export default function HomePage() {
  const { user, profile, loading: authLoading } = useAuth();
  const [services, setServices] = useState<Service[]>([]);
  const [loadingServices, setLoadingServices] = useState(true);
  const [searchQuery, setSearchQuery] = useState("");
  const [filteredServices, setFilteredServices] = useState<Service[]>([]);

  useEffect(() => {
    async function fetchServices() {
      try {
        const data = await serviceService.getServices();
        setServices(data);
        setFilteredServices(data);
      } catch (error) {
        console.error("Error fetching services:", error);
      } finally {
        setLoadingServices(false);
      }
    }
    fetchServices();
  }, []);

  // Filter services when search query changes
  useEffect(() => {
    if (searchQuery.trim() === "") {
      setFilteredServices(services);
    } else {
      const lowerQuery = searchQuery.toLowerCase();
      const filtered = services.filter(
        (service) =>
          service.name.toLowerCase().includes(lowerQuery) ||
          service.description.toLowerCase().includes(lowerQuery) ||
          service.category.toLowerCase().includes(lowerQuery)
      );
      setFilteredServices(filtered);
    }
  }, [searchQuery, services]);

  const maintenanceService = services.find(s => s.name.toLowerCase().includes("full car maintenance"));
  const promotionLink = maintenanceService ? `/booking/${maintenanceService.id}` : "/services";


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
            <div className="flex items-center gap-2">
              <div className="w-8 h-8 rounded-lg bg-blue-600 flex items-center justify-center transform rotate-3 shadow-sm">
                <div className="w-4 h-4 bg-white transform rotate-45"></div>
              </div>
              <h1 className="text-xl font-bold text-slate-950 tracking-tight">Mr tecy</h1>
            </div>
            <div className="flex items-center gap-2">
              {profile?.role === 'admin' && (
                <Link href="/admin">
                  <Button variant="outline" size="sm" className="h-9 border-blue-200 text-blue-700 font-extrabold bg-blue-50/50 hover:bg-blue-100 rounded-full px-4 flex items-center gap-1.5 shadow-sm">
                    <LayoutDashboard className="w-4 h-4" />
                    ADMIN
                  </Button>
                </Link>
              )}
              {profile?.role === 'partner' && (
                <Link href="/partner/dashboard">
                  <Button variant="outline" size="sm" className="h-9 border-green-200 text-green-700 font-extrabold bg-green-50/50 hover:bg-green-100 rounded-full px-4 flex items-center gap-1.5 shadow-sm">
                    <Wrench className="w-4 h-4" />
                    PARTNER
                  </Button>
                </Link>
              )}
              {!authLoading && (
                user ? (
                  <DropdownMenu>
                    <DropdownMenuTrigger asChild>
                      <Button variant="ghost" className="relative h-9 w-9 rounded-full p-0 border-2 border-white shadow-sm overflow-hidden ring-2 ring-blue-100 ring-offset-2 ml-1">
                        <img
                          src={profile?.photoURL || user.photoURL || `https://ui-avatars.com/api/?name=${encodeURIComponent(profile?.displayName || user.displayName || "User")}&background=0D8ABC&color=fff`}
                          alt="Profile"
                          className="w-full h-full object-cover"
                        />
                      </Button>
                    </DropdownMenuTrigger>
                    <DropdownMenuContent className="w-56" align="end" forceMount>
                      <DropdownMenuLabel className="font-normal">
                        <div className="flex flex-col space-y-1">
                          <p className="text-sm font-bold leading-none">{profile?.displayName || user.displayName || "User"}</p>
                          <p className="text-xs leading-none text-muted-foreground text-slate-500">
                            {user.email}
                          </p>
                          {profile?.role === 'admin' && (
                            <span className="text-[10px] items-center bg-blue-100 text-blue-700 px-1.5 py-0.5 rounded-full font-bold w-fit mt-1 uppercase">
                              Admin Account
                            </span>
                          )}
                          {profile?.role === 'partner' && (
                            <span className="text-[10px] items-center bg-green-100 text-green-700 px-1.5 py-0.5 rounded-full font-bold w-fit mt-1 uppercase">
                              Partner Account
                            </span>
                          )}
                        </div>
                      </DropdownMenuLabel>
                      <DropdownMenuSeparator />
                      {profile?.role === 'admin' && (
                        <Link href="/admin">
                          <DropdownMenuItem className="cursor-pointer font-bold text-blue-600">
                            <LayoutDashboard className="mr-2 h-4 w-4" />
                            <span>Admin Dashboard</span>
                          </DropdownMenuItem>
                        </Link>
                      )}
                      {profile?.role === 'partner' && (
                        <Link href="/partner/dashboard">
                          <DropdownMenuItem className="cursor-pointer font-bold text-green-600">
                            <Wrench className="mr-2 h-4 w-4" />
                            <span>Partner Dashboard</span>
                          </DropdownMenuItem>
                        </Link>
                      )}
                      <Link href="/profile">
                        <DropdownMenuItem className="cursor-pointer">
                          <User className="mr-2 h-4 w-4" />
                          <span>Profile</span>
                        </DropdownMenuItem>
                      </Link>
                      <DropdownMenuItem onClick={handleLogout} className="text-red-600 focus:text-red-600 focus:bg-red-50 cursor-pointer">
                        <LogOut className="mr-2 h-4 w-4" />
                        <span>Log out</span>
                      </DropdownMenuItem>
                    </DropdownMenuContent>
                  </DropdownMenu>
                ) : (
                  <Link href="/login">
                    <Button className="bg-blue-600 hover:bg-blue-700 text-white h-9 px-4 rounded-full text-sm font-bold shadow-md transition-all active:scale-95">
                      Login
                    </Button>
                  </Link>
                )
              )}
            </div>
          </div>

          <SearchBar
            value={searchQuery}
            onChange={setSearchQuery}
            onClear={() => setSearchQuery("")}
          />
        </div>
      </header>


      <main className="max-w-md mx-auto px-4 pt-6 pb-5 space-y-8 relative z-10">

        {/* Search Results Display */}
        {searchQuery ? (
          <section>
            <div className="flex items-center justify-between mb-4 px-1">
              <h2 className="text-[11px] font-bold tracking-[0.2em] text-slate-400 uppercase">
                {filteredServices.length} Results Found
              </h2>
            </div>
            {filteredServices.length > 0 ? (
              <div className="grid grid-cols-2 gap-4">
                {filteredServices.map((service) => (
                  <Link key={service.id} href={`/booking/${service.id}`}>
                    <ServiceCard
                      title={service.name}
                      description={service.description}
                      image={service.iconUrl || `https://source.unsplash.com/400x300/?${service.category.toLowerCase()}`}
                      price={`₹${service.price}`}
                    />
                  </Link>
                ))}
              </div>
            ) : (
              <div className="text-center py-12">
                <p className="text-slate-500 font-medium">No services match your search.</p>
              </div>
            )}
          </section>
        ) : (
          <>
            {/* Categories Section */}
            <section>
              <h2 className="text-sm font-bold text-blue-600 mb-4 ml-1 tracking-tight">
                Service Categories
              </h2>
              <div className="grid grid-cols-4 gap-3">
                <CategoryCard
                  image="/images/categories/for-you.png"
                  label="For You"
                  category=""
                />
                <CategoryCard
                  image="https://images.unsplash.com/photo-1603386329225-868f9b1ee6c9?w=400&auto=format&fit=crop&q=80"
                  label="Car"
                  category="car"
                />
                <CategoryCard
                  image="/images/categories/bike.png"
                  label="Bike"
                  category="bike"
                />
                <CategoryCard
                  image="https://images.unsplash.com/photo-1621905251918-48416bd8575a?w=400&auto=format&fit=crop&q=80"
                  label="Electrician"
                  category="electrician"
                />
              </div>
            </section>

            {/* Promotional Banner */}
            <section>
              <div className="relative h-44 rounded-2xl overflow-hidden shadow-xl group cursor-pointer transition-transform duration-300 hover:scale-[1.02]">
                <img
                  src="https://images.unsplash.com/photo-1486262715619-67b85e0b08d3?w=800&auto=format&fit=crop&q=80"
                  alt="Professional mechanic at work"
                  className="absolute inset-0 w-full h-full object-cover transition-transform duration-500 group-hover:scale-110"
                />
                <div className="absolute inset-0 bg-gradient-to-r from-blue-900/95 via-blue-800/80 to-transparent z-10"></div>
                <div className="absolute inset-0 z-20 flex items-center px-8">
                  <div className="max-w-[70%] space-y-2">
                    <h3 className="text-2xl font-bold text-white leading-tight drop-shadow-sm">
                      Get your car fixed at home
                    </h3>
                    <p className="text-blue-100 text-sm font-medium opacity-90">Expert mechanics available in 30 mins</p>
                    <div className="pt-2">
                      <Link href={promotionLink}>
                        <Button
                          variant="secondary"
                          className="bg-white text-blue-600 hover:bg-slate-50 font-bold shadow-lg text-xs h-10 px-6 rounded-full transition-all group-hover:pr-8"
                        >
                          Book a Mechanic →
                        </Button>
                      </Link>
                    </div>
                  </div>
                </div>
              </div>
            </section>

            {/* Recommended Section (DYNAMIC) */}
            <section>
              <div className="flex items-center justify-between mb-4 px-1">
                <h2 className="text-[11px] font-bold tracking-[0.2em] text-slate-400 uppercase">
                  Recommended Services
                </h2>
                <Link href="/services">
                  <button className="text-sm text-blue-600 font-bold hover:text-blue-700 transition-colors">
                    View All
                  </button>
                </Link>
              </div>

              <div className="grid grid-cols-2 gap-4">
                {loadingServices ? (
                  [1, 2, 3, 4].map((i) => (
                    <div key={i} className="space-y-3">
                      <Skeleton className="h-28 w-full rounded-2xl" />
                      <Skeleton className="h-4 w-3/4 rounded-full" />
                      <Skeleton className="h-4 w-1/2 rounded-full" />
                    </div>
                  ))
                ) : services.length > 0 ? (
                  services.map((service) => (
                    <Link key={service.id} href={`/booking/${service.id}`}>
                      <ServiceCard
                        title={service.name}
                        description={service.description}
                        image={service.iconUrl || `https://source.unsplash.com/400x300/?${service.category.toLowerCase()}`}
                        price={`₹${service.price}`}
                      />
                    </Link>
                  ))
                ) : (
                  <div className="col-span-2 text-center py-16 bg-white rounded-3xl border-2 border-dashed border-slate-100 p-8 shadow-sm">
                    <div className="w-16 h-16 bg-blue-50 rounded-full flex items-center justify-center mx-auto mb-4">
                      <Wrench className="w-8 h-8 text-blue-300" />
                    </div>
                    <h3 className="text-lg font-bold text-slate-900 mb-1">No services yet</h3>
                    <p className="text-slate-500 text-sm max-w-[200px] mx-auto leading-relaxed">
                      {profile?.role === 'admin'
                        ? "Welcome Admin! Start by adding automotive or appliance services."
                        : "We're setting up our services. Please check back soon!"}
                    </p>
                    {profile?.role === 'admin' ? (
                      <Link href="/admin/services">
                        <Button className="mt-6 bg-blue-600 hover:bg-blue-700 font-extrabold text-sm px-8 rounded-full shadow-lg shadow-blue-100 transition-all active:scale-95">
                          Add First Service
                        </Button>
                      </Link>
                    ) : !profile && (
                      <div className="mt-6 p-4 bg-slate-50 rounded-2xl border border-slate-100">
                        <p className="text-[10px] font-bold text-slate-400 uppercase tracking-widest mb-1">Developer Tip</p>
                        <p className="text-xs text-slate-600 font-medium leading-normal">
                          Set your role to <span className="text-blue-600 font-bold">"admin"</span> in Firestore to access the management tools.
                        </p>
                      </div>
                    )}
                  </div>
                )}
              </div>
            </section>
          </>
        )}
      </main>

      <BottomNavigation />
    </div>
  )
}
