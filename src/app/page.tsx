"use client";

import { useState, useEffect } from "react"
import { Search, MapPin } from "lucide-react"
import { SearchBar } from "@/components/SearchBar"
import { CategoryCard } from "@/components/CategoryCard"
import { ServiceCard } from "@/components/ServiceCard"
import { BottomNavigation } from "@/components/BottomNavigation"
import { LocationDialog } from "@/components/LocationDialog"
import { Button } from "@/components/ui/button"
import { Logo } from "@/components/Logo"

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
  const [locationDialogOpen, setLocationDialogOpen] = useState(false);
  const [savedLocation, setSavedLocation] = useState<{ districtName?: string; city?: string } | null>(null);
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

  // Load saved location from localStorage
  useEffect(() => {
    const loadSavedLocation = () => {
      if (typeof window !== "undefined") {
        const saved = localStorage.getItem("selectedLocation");
        if (saved) {
          try {
            setSavedLocation(JSON.parse(saved));
          } catch (error) {
            console.error("Error loading saved location:", error);
          }
        }
      }
    };
    loadSavedLocation();

    // Listen for storage changes to update location when dialog closes
    const handleStorageChange = () => {
      loadSavedLocation();
    };

    if (typeof window !== "undefined") {
      window.addEventListener("storage", handleStorageChange);
      window.addEventListener("focus", loadSavedLocation);
    }

    return () => {
      if (typeof window !== "undefined") {
        window.removeEventListener("storage", handleStorageChange);
        window.removeEventListener("focus", loadSavedLocation);
      }
    };
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
  const promotionLink = maintenanceService ? `/booking?serviceId=${maintenanceService.id}` : "/services";




  return (
    <div className="min-h-screen pb-24 bg-slate-50 relative">
      {/* Background Gradient Layer */}
      <div className="absolute top-0 left-0 right-0 h-[30vh] bg-gradient-to-b from-[#A1F6FB] via-[#DBFDFC] to-slate-50 pointer-events-none" />

      {/* Header */}
      <header className="px-4 pt-3 pb-0 relative">
        <div className="max-w-md mx-auto space-y-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              <div className="flex items-center gap-2">
                <Logo />
              </div>
            </div>
            <div className="flex items-center gap-3">
              {/* Location Display - Only show when logged in */}
              {!authLoading && user && (
                <>
                  <button
                    onClick={() => setLocationDialogOpen(true)}
                    className="hidden sm:flex flex-col items-end cursor-pointer hover:opacity-80 transition-opacity"
                  >
                    <span className="text-[9px] text-slate-400 font-bold tracking-wider uppercase">Location</span>
                    <div className="flex items-center gap-1">
                      <MapPin className="w-3.5 h-3.5 text-blue-600" />
                      <span className="text-xs font-bold text-slate-700 max-w-[120px] truncate">
                        {savedLocation?.districtName || savedLocation?.city || "Set Location"}
                      </span>
                    </div>
                  </button>
                  <button
                    onClick={() => setLocationDialogOpen(true)}
                    className="sm:hidden flex items-center gap-1.5 bg-white/50 px-2 py-1 rounded-full border border-blue-100 hover:bg-white/70 transition-colors"
                  >
                    <MapPin className="w-3.5 h-3.5 text-blue-600" />
                    <span className="text-[10px] font-bold text-slate-700 max-w-[80px] truncate">
                      {savedLocation?.districtName || "Set Location"}
                    </span>
                  </button>
                </>
              )}


              {!authLoading && !user && (
                <Link href="/login">
                  <Button className="bg-blue-600 hover:bg-blue-700 text-white h-9 px-4 rounded-full text-sm font-bold shadow-md transition-all active:scale-95">
                    Login
                  </Button>
                </Link>
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
                  <Link key={service.id} href={`/booking?serviceId=${service.id}`}>
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
                    <Link key={service.id} href={`/booking?serviceId=${service.id}`}>
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
                      <Search className="w-8 h-8 text-blue-300" />
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

      <LocationDialog
        open={locationDialogOpen}
        onOpenChange={(open) => {
          setLocationDialogOpen(open);
          if (!open && typeof window !== "undefined") {
            // Reload saved location when dialog closes
            const saved = localStorage.getItem("selectedLocation");
            if (saved) {
              try {
                setSavedLocation(JSON.parse(saved));
              } catch (error) {
                console.error("Error loading saved location:", error);
              }
            }
          }
        }}
      />

      <BottomNavigation />
    </div>
  )
}
