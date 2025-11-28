import React from "react";
import { createRoot } from "react-dom/client";
import { BrowserRouter as Router, Routes, Route, Link, useParams, useNavigate, useLocation } from "react-router-dom";
import "./index.css";
const API_BASE = import.meta.env.VITE_API_BASE || "http://localhost:8000/api";
const BACKEND_URL = API_BASE.replace(/\/api\/?$/, "");

function getImageUrl(path) {
  if (!path) return "https://images.unsplash.com/photo-1542326237-94b1c5a17163?q=80&w=1080&auto=format&fit=crop";
  if (path.startsWith("http")) return path;
  return `${BACKEND_URL}${path}`;
}

function createAPI() {
  const get = (k) => { try { const v = localStorage.getItem(k); return v ? JSON.parse(v) : null; } catch { return null; } };
  const set = (k, v) => { try { localStorage.setItem(k, JSON.stringify(v)); } catch { } };
  let subscribers = [];
  const auth = {
    getSession: async () => ({ data: { session: get("session") } }),
    onAuthStateChange: (cb) => { subscribers.push(cb); return { data: { subscription: { unsubscribe: () => { subscribers = subscribers.filter((s) => s !== cb); } } } }; },
    signOut: async () => { set("session", null); subscribers.forEach((fn) => fn("SIGNED_OUT", null)); return {}; },
    signInWithPassword: async ({ email, password }) => {
      const res = await fetch(`${API_BASE}/auth/login`, { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ email, password }) });
      if (!res.ok) return { error: { message: await res.text() } };
      const out = await res.json();
      const session = { user: { id: out.user_id, email }, token: out.access_token };
      set("session", session);
      subscribers.forEach((fn) => fn("SIGNED_IN", session));
      return { data: { session } };
    },
    signUp: async ({ email, password, role = "renter" }) => {
      const res = await fetch(`${API_BASE}/auth/signup`, { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ email, password, role }) });
      if (!res.ok) return { error: { message: await res.text() } };
      const out = await res.json();
      const session = { user: { id: out.user_id, email }, token: out.access_token };
      set("session", session);
      subscribers.forEach((fn) => fn("SIGNED_IN", session));
      return { data: { session } };
    },
  };
  const api = {
    auth,
    from: (name) => {
      const state = { filters: [], mode: "select" };
      const builder = {
        select: () => { state.mode = "select"; return builder; },
        eq: (col, val) => { state.filters.push({ col, val }); return builder; },
        single: async () => {
          if (name === "listings") {
            const f = state.filters.find((f) => f.col === "id");
            const res = await fetch(`${API_BASE}/listings/${f?.val}`);
            const data = res.ok ? await res.json() : null;
            return { data };
          }
          if (name === "profiles") {
            const s = get("session");
            const token = s?.token || "";
            const res = await fetch(`${API_BASE}/profiles/me`, { headers: { Authorization: `Bearer ${token}` } });
            const data = res.ok ? await res.json() : null;
            return { data };
          }
          return { data: null };
        },
        maybeSingle: async () => builder.single(),
        upsert: async (payload) => {
          if (name === "profiles") {
            const s = get("session");
            const token = s?.token || "";
            const res = await fetch(`${API_BASE}/profiles/upsert`, { method: "POST", headers: { "Content-Type": "application/json", Authorization: `Bearer ${token}` }, body: JSON.stringify(payload) });
            if (!res.ok) return { error: { message: await res.text() } };
            const data = await res.json();
            return { data };
          }
          return { data: null };
        },
        then: (resolve) => builder.exec().then(resolve),
        catch: (reject) => builder.exec().catch(reject),
        exec: async () => {
          if (name === "listings") {
            const res = await fetch(`${API_BASE}/listings`);
            const data = res.ok ? await res.json() : [];
            return { data };
          }
          if (name === "profiles") {
            const f = state.filters.find((f) => f.col === "user_id");
            const s = get("session");
            const token = s?.token || "";
            const url = f?.val ? `${API_BASE}/profiles?user_id=${encodeURIComponent(f.val)}` : `${API_BASE}/profiles/me`;
            const res = await fetch(url, { headers: { Authorization: `Bearer ${token}` } });
            const data = res.ok ? await res.json() : null;
            return { data };
          }
          return { data: [] };
        },
      };
      return builder;
    },
  };
  return api;
}
export let api = createAPI();

function AppWrapper() {
  React.useEffect(() => {
    try {
      const stored = localStorage.getItem("theme");
      const prefersDark = window.matchMedia && window.matchMedia("(prefers-color-scheme: dark)").matches;
      const theme = stored || (prefersDark ? "dark" : "light");
      const el = document.documentElement;
      if (theme === "dark") el.classList.add("dark"); else el.classList.remove("dark");
    } catch { }
  }, []);
  React.useEffect(() => { }, []);
  return (
    <Router>
      <App />
    </Router>
  );
}

function NavBar({ session, profile, signOut, switchRole }) {
  return (
    <nav className="bg-white/80 dark:bg-ink-800/80 backdrop-blur border-b border-gray-200 dark:border-ink-700">
      <div className="max-w-6xl mx-auto px-4">
        <div className="h-16 flex items-center justify-between">
          <Link to="/" className="flex items-center gap-2">
            <Logo />
          </Link>
          <div className="flex items-center gap-6 text-sm">
            <Link to="/" className="relative group px-2 py-1 text-gray-600 dark:text-gray-300 font-medium hover:text-brand-600 transition-colors">
              <span>Home</span>
              <span className="absolute bottom-0 left-0 w-0 h-0.5 bg-brand-600 transition-all group-hover:w-full"></span>
            </Link>
            {profile?.role === "provider" && (
              <Link to="/dashboard/provider" className="flex items-center gap-2 px-4 py-2 rounded-full bg-purple-100 text-purple-700 dark:bg-purple-900/30 dark:text-purple-300 hover:bg-purple-200 dark:hover:bg-purple-900/50 transition-all font-medium border border-purple-200 dark:border-purple-800 shadow-sm hover:shadow-md hover:-translate-y-0.5">
                <SteeringWheelIcon className="w-4 h-4" />
                <span>Provider Hub</span>
              </Link>
            )}
            {profile?.role === "renter" && (
              <Link to="/dashboard/renter" className="flex items-center gap-2 px-4 py-2 rounded-full bg-teal-100 text-teal-700 dark:bg-teal-900/30 dark:text-teal-300 hover:bg-teal-200 dark:hover:bg-teal-900/50 transition-all font-medium border border-teal-200 dark:border-teal-800 shadow-sm hover:shadow-md hover:-translate-y-0.5">
                <CarIcon className="w-4 h-4" />
                <span>Renter Dash</span>
              </Link>
            )}
            {session && (
              <button onClick={switchRole} className="group relative inline-flex items-center gap-2 rounded-full bg-gradient-to-r from-brand-600 to-brand-500 px-5 py-2 text-sm font-semibold text-white shadow-lg shadow-brand-500/30 hover:shadow-brand-500/50 hover:scale-105 transition-all duration-300 overflow-hidden">
                <div className="absolute inset-0 bg-white/20 translate-y-full group-hover:translate-y-0 transition-transform duration-300"></div>
                <GearShiftIcon className="h-4 w-4 transition-transform group-hover:rotate-180 duration-500" />
                <span className="relative">Switch to {profile?.role === "renter" ? "Provider" : "Renter"}</span>
              </button>
            )}
            {!session ? (
              <Link to="/auth" className="inline-flex items-center rounded-full bg-brand-600 text-white px-4 py-2 hover:bg-brand-700">Sign in</Link>
            ) : (
              <button onClick={signOut} className="group relative inline-flex items-center gap-2 rounded-full px-5 py-2 text-sm font-medium text-gray-600 dark:text-gray-300 hover:text-red-600 dark:hover:text-red-400 transition-colors overflow-hidden bg-gray-100 dark:bg-ink-900/50 hover:bg-red-50 dark:hover:bg-red-900/20 border border-transparent hover:border-red-200 dark:hover:border-red-800">
                <span className="relative z-10">Sign out</span>
                <LogOutIcon className="w-4 h-4 transition-transform group-hover:translate-x-1" />
              </button>
            )}
            <ThemeToggle />
          </div>
        </div>
      </div>
    </nav>
  );
}

function App() {
  const [session, setSession] = React.useState(null);
  const [profile, setProfile] = React.useState(null);

  React.useEffect(() => {
    let mounted = true;
    let sub = null;

    async function loadSession() {
      const { data } = await api.auth.getSession();
      const s = data?.session ?? null;
      if (!mounted) return;
      setSession(s);

      if (s?.user?.id) {
        const { data: p } = await api
          .from("profiles")
          .select("*")
          .eq("user_id", s.user.id)
          .single();
        if (mounted) setProfile(p || null);
      }
    }
    loadSession();

    const { data } = api.auth.onAuthStateChange(async (_event, newSession) => {
      setSession(newSession ?? null);
      if (newSession?.user?.id) {
        const { data } = await api.from("profiles").select("*").eq("user_id", newSession.user.id).single();
        setProfile(data || null);
      } else {
        setProfile(null);
      }
    });
    // data may contain subscription object (v2), normalize it:
    sub = data?.subscription ?? data;

    return () => {
      mounted = false;
      // unsubscribe safely
      if (sub?.unsubscribe) sub.unsubscribe();
      else if (sub?.subscription?.unsubscribe) sub.subscription.unsubscribe();
    };
  }, []);

  const signOut = async () => {
    await api.auth.signOut();
    setProfile(null);
    setSession(null);
  };

  const switchRole = async () => {
    if (!profile) return;
    const newRole = profile.role === "renter" ? "provider" : "renter";
    const s = JSON.parse(localStorage.getItem("session"));
    const token = s?.token || "";

    try {
      const res = await fetch(`${API_BASE}/users/role`, {
        method: "PUT",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${token}`
        },
        body: JSON.stringify({ role: newRole })
      });

      if (res.ok) {
        setProfile({ ...profile, role: newRole });
        // Redirect to appropriate dashboard
        if (newRole === "provider") window.location.href = "/dashboard/provider";
        else window.location.href = "/dashboard/renter";
      } else {
        alert("Failed to switch role");
      }
    } catch (e) {
      console.error(e);
      alert("Error switching role");
    }
  };

  return (
    <div className="min-h-screen bg-gray-50 dark:bg-ink-900 text-ink-800 dark:text-gray-100">
      <NavBar session={session} profile={profile} signOut={signOut} switchRole={switchRole} />
      <div className="max-w-6xl mx-auto px-4 py-6">
        <Routes>
          <Route path="/" element={<Home />} />
          <Route path="/auth" element={<AuthPage />} />
          <Route path="/listing/:id" element={<ListingRoute />} />
          <Route path="/create-listing" element={<CreateListing />} />
          <Route path="/dashboard/provider" element={<ProviderDashboard />} />
          <Route path="/dashboard/renter" element={<RenterDashboard />} />
        </Routes>
      </div>
      <Footer />
      <FloatCTA />
    </div>
  );
}

/* --- pages --- */
function Home() {
  const [query, setQuery] = React.useState("");
  const [city, setCity] = React.useState("");
  const [type, setType] = React.useState("");

  return (
    <div className="space-y-12">
      {/* Hero Section */}
      <div className="relative overflow-hidden rounded-3xl bg-gradient-to-br from-gray-50 to-gray-100 dark:from-ink-900 dark:to-ink-800 p-8 md:p-16 shadow-inner">
        {/* Decorative Background Elements */}
        <div className="absolute top-0 right-0 w-96 h-96 bg-brand-500/5 rounded-full blur-3xl -translate-y-1/2 translate-x-1/2 pointer-events-none"></div>
        <div className="absolute bottom-0 left-0 w-96 h-96 bg-blue-500/5 rounded-full blur-3xl translate-y-1/2 -translate-x-1/2 pointer-events-none"></div>

        <div className="relative z-10 max-w-4xl mx-auto text-center space-y-8">
          <div className="space-y-4 animate-fade-in-up">
            <h1 className="text-4xl md:text-6xl font-bold text-ink-800 dark:text-white tracking-tight">
              Find <span className="text-transparent bg-clip-text bg-gradient-to-r from-brand-600 to-brand-400">perfect</span> parking
            </h1>
            <p className="text-lg text-gray-600 dark:text-gray-300 max-w-2xl mx-auto leading-relaxed">
              Discover curated spots by locals. Secure, convenient, and affordable parking spaces right where you need them.
            </p>
          </div>

          {/* Search Box Container */}
          <div className="bg-white/80 dark:bg-ink-800/80 backdrop-blur-xl p-2 rounded-2xl shadow-xl border border-white/20 dark:border-ink-700 flex flex-col md:flex-row gap-2 items-center transition-all hover:shadow-2xl hover:bg-white/90 dark:hover:bg-ink-800/90 animate-fade-in-up delay-100">
            <div className="flex-1 w-full relative group">
              <SearchIcon className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 text-gray-400 group-focus-within:text-brand-500 transition-colors" />
              <input
                value={query}
                onChange={(e) => setQuery(e.target.value)}
                className="w-full pl-12 pr-4 py-3 bg-transparent border-none outline-none text-ink-800 dark:text-white placeholder-gray-400 text-base"
                placeholder="Search by location or title..."
              />
            </div>
            <div className="h-8 w-px bg-gray-200 dark:bg-ink-700 hidden md:block"></div>
            <div className="w-full md:w-72">
              <CitySearch value={city} onChange={setCity} />
            </div>
          </div>

          {/* Filters */}
          <div className="flex flex-wrap justify-center gap-3">
            <span className="text-sm font-medium text-gray-500 dark:text-gray-400 py-2">Quick Filters:</span>
            <CarTypeFilter value={type} onChange={setType} />
          </div>
        </div>

        {/* Subtle Decorations */}
        <TrafficLight className="absolute left-8 top-8 opacity-80 scale-75 hidden lg:flex" />
        <SpeedometerOverlay className="absolute right-8 top-8 opacity-10 scale-75 hidden lg:block" />

        {/* Moving Car Animation */}
        <div className="absolute bottom-0 left-0 w-full overflow-hidden pointer-events-none h-32 opacity-80">
          <div className="absolute bottom-4 animate-drive-across w-full">
            <CarBanner />
          </div>
        </div>
      </div>

      <Features />

      <div id="listings-section" className="space-y-6">
        <div className="flex items-center justify-between">
          <h2 className="text-2xl font-bold text-ink-800 dark:text-white">Popular listings</h2>
          <div className="text-sm text-gray-500">Showing all available spots</div>
        </div>
        <ListingsList query={query} city={city} type={type} />
      </div>
    </div>
  );
}

function ListingsList({ query = "", city = "", type = "" }) {
  const [listings, setListings] = React.useState([]);
  const [loading, setLoading] = React.useState(true);
  React.useEffect(() => {
    const run = async () => {
      const { data } = await api.from("listings").select("*");
      setListings(data || []);
      setLoading(false);
    };
    run();
  }, []);
  const filtered = listings.filter((l) => {
    const q = query.trim().toLowerCase();
    const inCity = city ? (l.city || "").toLowerCase() === city.toLowerCase() : true;
    const inType = type ? ((l.vehicle_size || "").toLowerCase() === type.toLowerCase()) : true;
    const matchQ = q ? ((l.title || "").toLowerCase().includes(q) || (l.address || "").toLowerCase().includes(q)) : true;
    return inCity && inType && matchQ;
  });
  const items = loading ? Array.from({ length: 6 }).map((_, i) => ({ id: `sk-${i}`, sk: true })) : filtered;
  return (
    <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
      {items.map((l) => (
        <div key={l.id} className="bg-white dark:bg-ink-800 rounded-2xl shadow-card border border-gray-200 dark:border-ink-700 overflow-hidden">
          <div className={l.sk ? "animate-pulse h-40 bg-gray-200 dark:bg-ink-700" : "relative h-40 bg-gray-100 dark:bg-ink-700"}>
            {!l.sk && (
              <>
                <img alt="spot" className="w-full h-full object-cover" src={getImageUrl(l.images && l.images[0])} />
                <div className="absolute inset-2 rounded-xl border-2 border-brand-500/40 slot-glow"></div>
              </>
            )}
          </div>
          <div className="p-4">
            <div className="flex items-start justify-between">
              <h3 className="font-semibold text-ink-800 dark:text-white flex items-center gap-2">{l.sk ? "" : (<><CarIcon className="h-4 w-4 text-brand-600" /> {l.title}</>)}{l.sk ? "" : ""}</h3>
              <span className="text-sm text-brand-600">{l.sk ? "" : `₹${l.price_per_hour}/hr`}</span>
            </div>
            <p className="mt-1 text-gray-600 dark:text-gray-300">{l.sk ? "" : l.address}</p>
            <div className="mt-3 flex gap-2">
              <span className="px-2 py-1 rounded-full text-xs bg-brand-50 text-brand-700 dark:bg-brand-600/20 dark:text-brand-200">{l.sk ? "" : (l.city || "")}</span>
              {!l.sk && <CarTypeBadge type={l.vehicle_size} />}
            </div>
            {!l.sk && (
              <div className="mt-4">
                <Link to={"/listing/" + l.id} className="inline-block rounded-full bg-brand-600 text-white px-4 py-2 text-sm hover:bg-brand-700">View details</Link>
              </div>
            )}
          </div>
        </div>
      ))}
      {!loading && filtered.length === 0 && (
        <div className="col-span-full text-center text-gray-500 dark:text-gray-400">No listings match your filters</div>
      )}
    </div>
  );
}

function ListingRoute() {
  const { id } = useParams();
  return <ListingDetails id={id} />;
}

function ListingDetails({ id }) {
  const [listing, setListing] = React.useState(undefined);
  const [booking, setBooking] = React.useState({ start: "", end: "" });
  const [msg, setMsg] = React.useState("");
  const navigate = useNavigate();

  React.useEffect(() => {
    const run = async () => {
      if (!id) return;
      const { data } = await api.from("listings").select("*").eq("id", id).single();
      setListing(data || null);
    };
    run();
  }, [id]);

  const handleBook = async () => {
    if (!booking.start || !booking.end) {
      setMsg("Please select start and end times");
      return;
    }
    try {
      const s = JSON.parse(localStorage.getItem("session"));
      const token = s?.token || "";
      if (!token) {
        navigate("/auth");
        return;
      }

      const res = await fetch(`${API_BASE}/bookings/`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${token}`
        },
        body: JSON.stringify({
          listing_id: id,
          start_time: new Date(booking.start).toISOString(),
          end_time: new Date(booking.end).toISOString()
        })
      });

      if (res.ok) {
        navigate("/dashboard/renter");
      } else {
        const err = await res.text();
        setMsg("Booking failed: " + err);
      }
    } catch (err) {
      setMsg("Error: " + err.message);
    }
  };

  if (listing === undefined) return <div className="text-gray-600">Loading...</div>;
  if (listing === null) return <div className="text-gray-600">Not found</div>;

  return (
    <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
      <div className="md:col-span-2 space-y-6">
        <div className="rounded-2xl overflow-hidden shadow-card aspect-video bg-gray-100 dark:bg-ink-700 relative">
          <img src={getImageUrl(listing.images && listing.images[0])} className="w-full h-full object-cover" />
        </div>
        <div>
          <h1 className="text-3xl font-bold text-ink-800 dark:text-white">{listing.title}</h1>
          <p className="text-lg text-gray-600 dark:text-gray-300 mt-2">{listing.address}, {listing.city}</p>
          <div className="flex gap-2 mt-4">
            <CarTypeBadge type={listing.vehicle_size} />
          </div>
          <p className="mt-6 text-gray-700 dark:text-gray-300 leading-relaxed">{listing.description || "No description provided."}</p>
        </div>
      </div>

      <div className="md:col-span-1">
        <div className="bg-white dark:bg-ink-800 rounded-2xl shadow-card border border-gray-200 dark:border-ink-700 p-6 sticky top-24">
          <div className="flex justify-between items-center mb-6">
            <span className="text-2xl font-bold text-ink-800 dark:text-white">₹{listing.price_per_hour}</span>
            <span className="text-gray-500 dark:text-gray-400">/ hour</span>
          </div>

          <div className="space-y-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">Start Time</label>
              <input type="datetime-local" className="w-full border rounded-xl px-4 py-2 bg-white dark:bg-ink-800 border-gray-300 dark:border-ink-700 text-ink-800 dark:text-gray-100"
                value={booking.start} onChange={e => setBooking({ ...booking, start: e.target.value })} />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">End Time</label>
              <input type="datetime-local" className="w-full border rounded-xl px-4 py-2 bg-white dark:bg-ink-800 border-gray-300 dark:border-ink-700 text-ink-800 dark:text-gray-100"
                value={booking.end} onChange={e => setBooking({ ...booking, end: e.target.value })} />
            </div>

            {msg && <p className="text-red-600 text-sm">{msg}</p>}

            <button onClick={handleBook} className="w-full rounded-xl bg-brand-600 text-white px-4 py-3 font-semibold hover:bg-brand-700 transition-colors shadow-lg shadow-brand-500/30">
              Book Spot
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}

function CreateListing() {
  const navigate = useNavigate();
  const [form, setForm] = React.useState({
    title: "",
    description: "",
    address: "",
    city: "",
    price_per_hour: "",
    vehicle_size: "Compact",
    images: []
  });
  const [uploading, setUploading] = React.useState(false);
  const [msg, setMsg] = React.useState("");

  const handleChange = (e) => {
    setForm({ ...form, [e.target.name]: e.target.value });
  };

  const handleImageUpload = async (e) => {
    const file = e.target.files[0];
    if (!file) return;
    setUploading(true);
    const formData = new FormData();
    formData.append("file", file);

    try {
      const s = JSON.parse(localStorage.getItem("session"));
      const token = s?.token || "";
      const res = await fetch(`${API_BASE}/upload/`, {
        method: "POST",
        headers: { Authorization: `Bearer ${token}` },
        body: formData
      });
      if (res.ok) {
        const data = await res.json();
        setForm(prev => ({ ...prev, images: [...prev.images, data.url] }));
      } else {
        alert("Upload failed");
      }
    } catch (err) {
      console.error(err);
      alert("Upload error");
    } finally {
      setUploading(false);
    }
  };

  const handleSubmit = async () => {
    try {
      const s = JSON.parse(localStorage.getItem("session"));
      const token = s?.token || "";
      const res = await fetch(`${API_BASE}/listings/`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${token}`
        },
        body: JSON.stringify({
          ...form,
          price_per_hour: parseFloat(form.price_per_hour)
        })
      });
      if (res.ok) {
        navigate("/dashboard/provider");
      } else {
        const err = await res.text();
        setMsg("Failed to create listing: " + err);
      }
    } catch (err) {
      setMsg("Error: " + err.message);
    }
  };

  return (
    <div className="max-w-2xl mx-auto bg-white dark:bg-ink-800 rounded-2xl shadow-card border border-gray-200 dark:border-ink-700 p-6 space-y-6">
      <h1 className="text-2xl font-semibold text-ink-800 dark:text-white">List your spot</h1>

      <div className="space-y-4">
        <div>
          <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">Title</label>
          <input name="title" value={form.title} onChange={handleChange} className="w-full border rounded-xl px-4 py-2 bg-white dark:bg-ink-800 border-gray-300 dark:border-ink-700 text-ink-800 dark:text-gray-100" placeholder="e.g. Spacious Driveway in Downtown" />
        </div>

        <div>
          <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">Description</label>
          <textarea name="description" value={form.description} onChange={handleChange} className="w-full border rounded-xl px-4 py-2 bg-white dark:bg-ink-800 border-gray-300 dark:border-ink-700 text-ink-800 dark:text-gray-100" rows="3" placeholder="Describe your spot..." />
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <div>
            <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">Address</label>
            <input name="address" value={form.address} onChange={handleChange} className="w-full border rounded-xl px-4 py-2 bg-white dark:bg-ink-800 border-gray-300 dark:border-ink-700 text-ink-800 dark:text-gray-100" />
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">City</label>
            <input name="city" value={form.city} onChange={handleChange} className="w-full border rounded-xl px-4 py-2 bg-white dark:bg-ink-800 border-gray-300 dark:border-ink-700 text-ink-800 dark:text-gray-100" />
          </div>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <div>
            <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">Price per hour (₹)</label>
            <input type="number" name="price_per_hour" value={form.price_per_hour} onChange={handleChange} className="w-full border rounded-xl px-4 py-2 bg-white dark:bg-ink-800 border-gray-300 dark:border-ink-700 text-ink-800 dark:text-gray-100" />
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">Vehicle Size</label>
            <select name="vehicle_size" value={form.vehicle_size} onChange={handleChange} className="w-full border rounded-xl px-4 py-2 bg-white dark:bg-ink-800 border-gray-300 dark:border-ink-700 text-ink-800 dark:text-gray-100">
              <option value="Compact">Compact</option>
              <option value="SUV">SUV</option>
              <option value="EV">EV</option>
            </select>
          </div>
        </div>

        <div>
          <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">Photos</label>
          <div className="flex items-center gap-4">
            <label className="cursor-pointer inline-flex items-center gap-2 px-4 py-2 rounded-xl border border-gray-300 dark:border-ink-700 hover:bg-gray-50 dark:hover:bg-ink-700">
              <span className="text-sm">Upload Image</span>
              <input type="file" className="hidden" accept="image/*" onChange={handleImageUpload} disabled={uploading} />
            </label>
            {uploading && <span className="text-sm text-gray-500">Uploading...</span>}
          </div>
          <div className="mt-4 grid grid-cols-3 gap-4">
            {form.images.map((img, i) => (
              <div key={i} className="relative aspect-video rounded-lg overflow-hidden bg-gray-100">
                <img src={getImageUrl(img)} alt="" className="w-full h-full object-cover" />
              </div>
            ))}
          </div>
        </div>

        {msg && <p className="text-red-600 text-sm">{msg}</p>}

        <div className="pt-4">
          <button onClick={handleSubmit} className="w-full rounded-xl bg-brand-600 text-white px-4 py-3 font-semibold hover:bg-brand-700 transition-colors">
            Create Listing
          </button>
        </div>
      </div>
    </div>
  );
}

function AuthPage() {
  const [email, setEmail] = React.useState("");
  const [password, setPassword] = React.useState("");
  const [msg, setMsg] = React.useState("");
  const [mode, setMode] = React.useState("login");
  const [role, setRole] = React.useState("renter");
  const navigate = useNavigate();
  const [invalidKey, setInvalidKey] = React.useState(false);

  React.useEffect(() => {
    const run = async () => {
      setInvalidKey(false);
    };
    run();
  }, []);

  const login = async () => {
    const { error } = await api.auth.signInWithPassword({ email, password });
    if (error) { setMsg(error.message || "Login failed"); return; }
    const { data: sdata } = await api.auth.getSession();
    const uid = sdata?.session?.user?.id;
    if (uid) {
      const { data: existing } = await api.from("profiles").select("*").eq("user_id", uid).maybeSingle();
      if (!existing) {
        const desired = role || localStorage.getItem("desiredRole") || "renter";
        await api.from("profiles").upsert({ user_id: uid, email, role: desired });
        localStorage.removeItem("desiredRole");
      }
    }
    setMsg("");
    navigate("/");
  };

  const signup = async () => {
    const { data, error } = await api.auth.signUp({ email, password, role });
    if (error) { setMsg(error.message || "Signup failed"); return; }
    const uid = data?.session?.user?.id;
    if (uid) {
      await api.from("profiles").upsert({ user_id: uid, email, role });
      setMsg("");
      navigate("/");
    }
  };

  return (

    <div className="min-h-[80vh] flex items-center justify-center">
      <div className="w-full max-w-md bg-white dark:bg-ink-800 rounded-3xl shadow-2xl border border-gray-100 dark:border-ink-700 p-8 space-y-8 relative overflow-hidden">
        <div className="absolute top-0 left-0 w-full h-2 bg-gradient-to-r from-brand-500 to-purple-500"></div>

        <div className="text-center space-y-2">
          <h1 className="text-3xl font-bold text-ink-800 dark:text-white">{mode === "login" ? "Welcome back" : "Join ParkItUp"}</h1>
          <p className="text-gray-500 dark:text-gray-400">Enter your details to access your account</p>
        </div>

        <div className="flex p-1 bg-gray-100 dark:bg-ink-900 rounded-xl">
          <button onClick={() => setMode("login")} className={`flex-1 py-2 text-sm font-bold rounded-lg transition-all ${mode === "login" ? "bg-white dark:bg-ink-800 shadow-sm text-brand-600" : "text-gray-500 hover:text-gray-700 dark:hover:text-gray-300"}`}>Login</button>
          <button onClick={() => setMode("signup")} className={`flex-1 py-2 text-sm font-bold rounded-lg transition-all ${mode === "signup" ? "bg-white dark:bg-ink-800 shadow-sm text-brand-600" : "text-gray-500 hover:text-gray-700 dark:hover:text-gray-300"}`}>Sign up</button>
        </div>

        <div className="space-y-4">
          <div className="space-y-2">
            <label className="text-xs font-bold uppercase text-gray-400 tracking-wider">Email Address</label>
            <input className="w-full border rounded-xl px-4 py-3 bg-gray-50 dark:bg-ink-900 border-gray-200 dark:border-ink-700 text-ink-800 dark:text-white focus:ring-2 focus:ring-brand-500 outline-none transition-all" placeholder="name@example.com" value={email} onChange={(e) => setEmail(e.target.value)} />
          </div>
          <div className="space-y-2">
            <label className="text-xs font-bold uppercase text-gray-400 tracking-wider">Password</label>
            <input className="w-full border rounded-xl px-4 py-3 bg-gray-50 dark:bg-ink-900 border-gray-200 dark:border-ink-700 text-ink-800 dark:text-white focus:ring-2 focus:ring-brand-500 outline-none transition-all" type="password" placeholder="••••••••" value={password} onChange={(e) => setPassword(e.target.value)} />
          </div>
        </div>

        <div className="space-y-2">
          <label className="text-xs font-bold uppercase text-gray-400 tracking-wider">I want to</label>
          <div className="grid grid-cols-2 gap-3">
            <button onClick={() => setRole("renter")} className={`px-4 py-3 rounded-xl border-2 font-bold text-sm transition-all flex items-center justify-center gap-2 ${role === "renter" ? "border-brand-500 bg-brand-50 text-brand-700 dark:bg-brand-900/20 dark:text-brand-300" : "border-gray-100 dark:border-ink-700 bg-white dark:bg-ink-800 text-gray-500 hover:border-gray-300"}`}>
              <CarIcon className="w-4 h-4" /> Rent
            </button>
            <button onClick={() => setRole("provider")} className={`px-4 py-3 rounded-xl border-2 font-bold text-sm transition-all flex items-center justify-center gap-2 ${role === "provider" ? "border-brand-500 bg-brand-50 text-brand-700 dark:bg-brand-900/20 dark:text-brand-300" : "border-gray-100 dark:border-ink-700 bg-white dark:bg-ink-800 text-gray-500 hover:border-gray-300"}`}>
              <SteeringWheelIcon className="w-4 h-4" /> Host
            </button>
          </div>
        </div>

        <button onClick={mode === "login" ? login : signup} className="w-full rounded-xl bg-gradient-to-r from-brand-600 to-brand-700 text-white px-4 py-4 font-bold text-lg hover:shadow-lg hover:scale-[1.02] transition-all">
          {mode === "login" ? "Log in" : "Create Account"}
        </button>

        {msg && <p className="text-center text-red-600 text-sm font-medium bg-red-50 p-2 rounded-lg">{msg}</p>}
      </div>
    </div>
  );
}

function ProviderDashboard() {
  return (
    <div className="space-y-8">
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-3">
          <div className="p-3 bg-brand-100 dark:bg-brand-900/30 rounded-xl">
            <SteeringWheelIcon className="w-8 h-8 text-brand-600" />
          </div>
          <div>
            <h1 className="text-2xl font-bold text-ink-800 dark:text-white">Driver's Seat</h1>
            <p className="text-gray-500 dark:text-gray-400 text-sm">Manage your parking fleet</p>
          </div>
        </div>
        <Link to="/create-listing" className="inline-flex items-center gap-2 rounded-full bg-brand-600 text-white px-6 py-3 text-sm font-semibold hover:bg-brand-700 shadow-lg shadow-brand-500/30 transition-all hover:scale-105">
          <span>+</span> List a spot
        </Link>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Main Panel - Listings */}
        <div className="lg:col-span-2 bg-white dark:bg-ink-800 rounded-3xl shadow-card border border-gray-200 dark:border-ink-700 overflow-hidden">
          <div className="p-6 border-b border-gray-100 dark:border-ink-700 flex items-center justify-between bg-gray-50/50 dark:bg-ink-800/50">
            <h2 className="font-semibold text-lg flex items-center gap-2">
              <CarIcon className="w-5 h-5 text-brand-500" />
              Garage Listings
            </h2>
            <span className="text-xs font-medium px-2 py-1 bg-green-100 text-green-700 rounded-full">Live Status</span>
          </div>
          <div className="p-6">
            <ListingsList />
          </div>
        </div>

        {/* Side Panel - Insights */}
        <div className="bg-gradient-to-br from-gray-900 to-gray-800 text-white rounded-3xl shadow-card p-6 relative overflow-hidden">
          <div className="absolute top-0 right-0 w-32 h-32 bg-brand-500/20 rounded-full blur-3xl -translate-y-1/2 translate-x-1/2"></div>

          <div className="flex items-center gap-3 mb-6 relative z-10">
            <GaugeIcon className="w-6 h-6 text-brand-400" />
            <h2 className="font-semibold text-lg">Performance</h2>
          </div>

          <div className="space-y-6 relative z-10">
            <div className="bg-white/10 backdrop-blur-md rounded-2xl p-4 border border-white/10">
              <div className="text-sm text-gray-400 mb-1">Total Earnings</div>
              <div className="text-3xl font-bold">₹0.00</div>
            </div>

            <div className="bg-white/10 backdrop-blur-md rounded-2xl p-4 border border-white/10">
              <div className="text-sm text-gray-400 mb-1">Occupancy Rate</div>
              <div className="flex items-end gap-2">
                <span className="text-3xl font-bold">0%</span>
                <span className="text-sm text-green-400 mb-1">▲ 0%</span>
              </div>
              <div className="w-full bg-gray-700 h-1.5 rounded-full mt-3 overflow-hidden">
                <div className="bg-brand-500 h-full w-0"></div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}

function RenterDashboard() {
  const [bookings, setBookings] = React.useState([]);
  const [loading, setLoading] = React.useState(true);

  React.useEffect(() => {
    const run = async () => {
      const s = JSON.parse(localStorage.getItem("session"));
      const token = s?.token || "";
      if (!token) return;

      const res = await fetch(`${API_BASE}/bookings/mine`, {
        headers: { Authorization: `Bearer ${token}` }
      });
      if (res.ok) {
        const data = await res.json();
        setBookings(data);
      }
      setLoading(false);
    };
    run();
  }, []);

  return (
    <div className="space-y-8">
      <div className="flex items-center gap-3">
        <div className="p-3 bg-brand-100 dark:bg-brand-900/30 rounded-xl">
          <MapPinIcon className="w-8 h-8 text-brand-600" />
        </div>
        <div>
          <h1 className="text-2xl font-bold text-ink-800 dark:text-white">Trip Computer</h1>
          <p className="text-gray-500 dark:text-gray-400 text-sm">Your parking journey log</p>
        </div>
      </div>

      <div className="bg-white dark:bg-ink-800 rounded-3xl shadow-card border border-gray-200 dark:border-ink-700 overflow-hidden">
        <div className="p-6 border-b border-gray-100 dark:border-ink-700 bg-gray-50/50 dark:bg-ink-800/50">
          <h2 className="font-semibold text-lg flex items-center gap-2">
            <ClockIcon className="w-5 h-5 text-brand-500" />
            Active & Past Trips
          </h2>
        </div>

        <div className="p-6">
          {loading ? (
            <div className="flex justify-center py-12"><div className="animate-spin rounded-full h-8 w-8 border-b-2 border-brand-600"></div></div>
          ) : bookings.length === 0 ? (
            <div className="text-center py-12">
              <div className="inline-flex p-4 bg-gray-100 dark:bg-ink-700 rounded-full mb-4">
                <CarIcon className="w-8 h-8 text-gray-400" />
              </div>
              <p className="text-gray-600 dark:text-gray-300 font-medium">No trips recorded yet.</p>
              <p className="text-gray-400 text-sm mt-1">Book a spot to start your engine!</p>
            </div>
          ) : (
            <div className="grid gap-4">
              {bookings.map(b => (
                <div key={b.id} className="group relative bg-white dark:bg-ink-800 rounded-xl border border-gray-200 dark:border-ink-700 p-5 hover:shadow-md transition-all hover:border-brand-200 dark:hover:border-brand-800">
                  <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
                    <div className="flex items-start gap-4">
                      <div className={`p-3 rounded-xl ${b.status === 'cancelled' ? 'bg-red-50 text-red-600' : 'bg-green-50 text-green-600'}`}>
                        <CarIcon className="w-6 h-6" />
                      </div>
                      <div>
                        <div className="font-semibold text-ink-800 dark:text-white flex items-center gap-2">
                          Trip #{b.id.slice(0, 8)}
                          <span className={`px-2 py-0.5 rounded-full text-[10px] uppercase tracking-wide font-bold ${b.status === 'cancelled' ? 'bg-red-100 text-red-700' : 'bg-green-100 text-green-700'}`}>
                            {b.status}
                          </span>
                        </div>
                        <div className="text-sm text-gray-500 mt-1 flex items-center gap-4">
                          <span className="flex items-center gap-1"><ClockIcon className="w-3 h-3" /> {new Date(b.start_time).toLocaleString()}</span>
                          <span>→</span>
                          <span>{new Date(b.end_time).toLocaleString()}</span>
                        </div>
                      </div>
                    </div>
                    {/* Action buttons could go here */}
                  </div>
                  {/* Progress bar decoration */}
                  <div className="absolute bottom-0 left-0 w-full h-1 bg-gray-100 dark:bg-ink-700 overflow-hidden rounded-b-xl">
                    <div className={`h-full ${b.status === 'cancelled' ? 'bg-red-500 w-full' : 'bg-green-500 w-3/4'}`}></div>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}

function Footer() {
  return (
    <footer className="mt-12 border-t border-gray-200 dark:border-ink-700">
      <div className="max-w-6xl mx-auto px-4 py-8 text-sm text-gray-600 dark:text-gray-300 flex items-center justify-between">
        <span>© {new Date().getFullYear()} ParkItUp</span>
        <span className="text-brand-600">Parking made simple for your car</span>
      </div>
    </footer>
  );
}

const root = createRoot(document.getElementById("root"));
root.render(<AppWrapper />);

function ThemeToggle() {
  const [theme, setTheme] = React.useState(() => {
    try { return localStorage.getItem("theme") || "light"; } catch { return "light"; }
  });
  const toggle = () => {
    const next = theme === "dark" ? "light" : "dark";
    setTheme(next);
    try { localStorage.setItem("theme", next); } catch { }
    const el = document.documentElement;
    if (next === "dark") el.classList.add("dark"); else el.classList.remove("dark");
  };
  return (
    <button aria-label="Toggle theme" onClick={toggle} className="inline-flex items-center justify-center h-9 w-9 rounded-full border border-gray-300 dark:border-ink-700 text-gray-700 dark:text-gray-200 hover:bg-gray-50 dark:hover:bg-ink-700">
      {theme === "dark" ? (
        <svg viewBox="0 0 24 24" className="h-5 w-5" fill="currentColor"><path d="M21.64 13A9 9 0 1111 2.36a7 7 0 1010.64 10.64z" /></svg>
      ) : (
        <svg viewBox="0 0 24 24" className="h-5 w-5" fill="currentColor"><path d="M12 4a1 1 0 011 1v2a1 1 0 11-2 0V5a1 1 0 011-1zm6.36 2.64a1 1 0 011.41 0l1.41 1.41a1 1 0 01-1.41 1.41l-1.41-1.41a1 1 0 010-1.41zM20 11a1 1 0 011 1v2a1 1 0 11-2 0v-2a1 1 0 011-1zM17.36 17.36a1 1 0 011.41 0l1.41 1.41a1 1 0 01-1.41 1.41l-1.41-1.41a1 1 0 010-1.41zM12 18a1 1 0 011 1v2a1 1 0 11-2 0v-2a1 1 0 011-1zM4.64 17.36a1 1 0 011.41 0l1.41 1.41a1 1 0 01-1.41 1.41L4.64 18.77a1 1 0 010-1.41zM4 11a1 1 0 011 1v2a1 1 0 11-2 0v-2a1 1 0 011-1zM4.64 4.64a1 1 0 011.41 0L7.46 6.05a1 1 0 11-1.41 1.41L4.64 6.05a1 1 0 010-1.41zM12 7a5 5 0 100 10 5 5 0 000-10z" /></svg>
      )}
    </button>
  );
}

function CarTypeBadge({ type }) {
  if (!type) return null;
  const t = String(type).toLowerCase();
  const cls = "px-2 py-1 rounded-full text-xs inline-flex items-center gap-1 bg-gray-100 text-gray-700 dark:bg-ink-700 dark:text-gray-300 neon-ring";
  if (t === "ev") return <span className={cls}><BatteryIcon className="h-3.5 w-3.5" /> EV</span>;
  if (t === "suv") return <span className={cls}><SUVIcon className="h-3.5 w-3.5" /> SUV</span>;
  return <span className={cls}><CompactIcon className="h-3.5 w-3.5" /> Compact</span>;
}

function CarTypeFilter({ value, onChange }) {
  const set = (v) => {
    onChange(v);
  };
  const Btn = ({ v, label }) => (
    <button onClick={() => set(v)} className={`px-3 py-2 rounded-full border ${value === v ? "bg-brand-50 border-brand-200 dark:bg-brand-600/20 dark:border-brand-300/30 neon" : "bg-white dark:bg-ink-800"} inline-flex items-center gap-2`}>
      {v === "EV" && <BatteryIcon className="h-4 w-4 text-brand-600" />}
      {v === "SUV" && <SUVIcon className="h-4 w-4 text-brand-600" />}
      {v === "Compact" && <CompactIcon className="h-4 w-4 text-brand-600" />}
      {label}
    </button>
  );
  return (
    <div className="flex gap-2">
      <Btn v="EV" label="EV" />
      <Btn v="SUV" label="SUV" />
      <Btn v="Compact" label="Compact" />
      <button onClick={() => set("")} className={`px-4 py-2 rounded-full border transition-all ${!value ? "bg-brand-600 text-white border-brand-600 shadow-md" : "bg-white dark:bg-ink-800 border-gray-200 dark:border-ink-700 text-gray-600 dark:text-gray-300 hover:bg-gray-50 dark:hover:bg-ink-700"}`}>All</button>
    </div>
  );
}

function SearchIcon({ className = "" }) {
  return (
    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className={className}>
      <circle cx="11" cy="11" r="8" />
      <line x1="21" y1="21" x2="16.65" y2="16.65" />
    </svg>
  );
}

function MapPinIcon({ className = "" }) {
  return (
    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className={className}>
      <path d="M21 10c0 7-9 13-9 13s-9-6-9-13a9 9 0 0 1 18 0z" />
      <circle cx="12" cy="10" r="3" />
    </svg>
  );
}

function SwitchIcon({ className = "" }) {
  return (
    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className={className}>
      <path d="M21 12a9 9 0 0 0-9-9 9.75 9.75 0 0 0-6.74 2.74L3 8" />
      <path d="M3 3v5h5" />
      <path d="M3 12a9 9 0 0 0 9 9 9.75 9.75 0 0 0 6.74-2.74L21 16" />
      <path d="M16 21h5v-5" />
    </svg>
  );
}

function BatteryIcon({ className = "" }) {
  return (
    <svg viewBox="0 0 24 24" fill="currentColor" className={className}><path d="M18 7h1a2 2 0 012 2v6a2 2 0 01-2 2h-1v2H4a2 2 0 01-2-2V7a2 2 0 012-2h14v2z" /></svg>
  );
}
function SUVIcon({ className = "" }) {
  return (
    <svg viewBox="0 0 24 24" fill="currentColor" className={className}><path d="M3 12h2l2-3h7l4 3h2v6h-2a2 2 0 01-2-2H7a2 2 0 01-2 2H3v-6z" /></svg>
  );
}
function CompactIcon({ className = "" }) {
  return (
    <svg viewBox="0 0 24 24" fill="currentColor" className={className}><path d="M4 13l1-3a3 3 0 012.5-2H15a3 3 0 012.5 2l1 3v5H4v-5z" /></svg>
  );
}

function Features() {
  const items = [
    { title: "Secure parking", desc: "Well-lit spots with trusted providers", icon: ShieldIcon },
    { title: "Fast booking", desc: "Reserve in seconds and go", icon: ClockIcon },
    { title: "Car-friendly", desc: "Pick spots that fit your vehicle", icon: CarIcon },
  ];
  return (
    <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
      {items.map((it) => (
        <div key={it.title} className="rounded-2xl border border-gray-200 dark:border-ink-700 bg-white dark:bg-ink-800 p-4 flex items-start gap-3 shadow-card">
          <it.icon className="h-6 w-6 text-brand-600" />
          <div>
            <div className="font-semibold text-ink-800 dark:text-white">{it.title}</div>
            <div className="text-sm text-gray-600 dark:text-gray-300">{it.desc}</div>
          </div>
        </div>
      ))}
    </div>
  );
}

function CarIcon({ className = "" }) {
  return (
    <svg viewBox="0 0 24 24" fill="currentColor" className={className}>
      <path d="M3 13l2-5a3 3 0 012.82-2h6.36A3 3 0 0117 8l2 5v5a1 1 0 01-1 1h-1a1 1 0 01-1-1v-1H8v1a1 1 0 01-1 1H6a1 1 0 01-1-1v-5z" />
      <circle cx="7.5" cy="16.5" r="1.5" />
      <circle cx="16.5" cy="16.5" r="1.5" />
    </svg>
  );
}

function ShieldIcon({ className = "" }) {
  return (
    <svg viewBox="0 0 24 24" fill="currentColor" className={className}>
      <path d="M12 2l7 4v6c0 5-3.5 8.5-7 10-3.5-1.5-7-5-7-10V6l7-4z" />
    </svg>
  );
}

function ClockIcon({ className = "" }) {
  return (
    <svg viewBox="0 0 24 24" fill="currentColor" className={className}>
      <path d="M12 2a10 10 0 100 20 10 10 0 000-20zm1 5h-2v6l5 3 1-1-4-2V7z" />
    </svg>
  );
}

function CarBanner() {
  return (
    <div className="relative w-48 h-24">
      {/* Car Body */}
      <svg viewBox="0 0 200 80" className="w-full h-full drop-shadow-lg" fill="none" stroke="currentColor" strokeWidth="2">
        <path d="M10 50 L190 50 L180 30 L140 15 L60 15 L20 30 Z" className="fill-brand-600 stroke-brand-700" />
        <path d="M25 30 L55 18 L135 18 L175 30" className="fill-brand-800/20 stroke-none" />
        <rect x="15" y="50" width="170" height="15" rx="5" className="fill-gray-800 stroke-gray-900" />

        {/* Wheels */}
        <g className="wheel-spin origin-[45px_65px]">
          <circle cx="45" cy="65" r="12" className="fill-gray-900 stroke-gray-600" strokeWidth="2" />
          <circle cx="45" cy="65" r="4" className="fill-gray-400" />
          <path d="M45 53 L45 77 M33 65 L57 65" className="stroke-gray-600" />
        </g>
        <g className="wheel-spin origin-[155px_65px]">
          <circle cx="155" cy="65" r="12" className="fill-gray-900 stroke-gray-600" strokeWidth="2" />
          <circle cx="155" cy="65" r="4" className="fill-gray-400" />
          <path d="M155 53 L155 77 M143 65 L167 65" className="stroke-gray-600" />
        </g>

        {/* Lights */}
        <path d="M185 52 L190 52" className="stroke-red-500" strokeWidth="4" />
        <path d="M10 52 L15 52" className="stroke-yellow-400" strokeWidth="4" />
      </svg>
    </div>
  );
}

function FloatCTA() {
  const navigate = useNavigate();
  const location = useLocation();

  const handleClick = () => {
    if (location.pathname !== "/") {
      navigate("/");
      setTimeout(() => {
        document.getElementById("listings-section")?.scrollIntoView({ behavior: "smooth" });
      }, 100);
    } else {
      document.getElementById("listings-section")?.scrollIntoView({ behavior: "smooth" });
    }
  };

  return (
    <button onClick={handleClick} className="fixed bottom-6 right-6 z-20 inline-flex items-center gap-2 rounded-full px-6 py-3 bg-brand-600 text-white shadow-card hover:bg-brand-700 hover:scale-105 transition-all animate-bounce">
      <CarIcon className="h-5 w-5" />
      <span className="font-semibold">Find parking</span>
    </button>
  );
}

function TrafficLight({ className = "" }) {
  return (
    <div className={`flex flex-col gap-2 p-2 bg-gray-900 rounded-xl border border-gray-700 shadow-xl ${className}`}>
      <div className="w-4 h-4 rounded-full bg-red-500 shadow-[0_0_15px_rgba(239,68,68,0.6)] animate-pulse"></div>
      <div className="w-4 h-4 rounded-full bg-yellow-500 shadow-[0_0_15px_rgba(234,179,8,0.6)] opacity-50"></div>
      <div className="w-4 h-4 rounded-full bg-green-500 shadow-[0_0_15px_rgba(34,197,94,0.6)] opacity-50"></div>
    </div>
  );
}

function SpeedometerOverlay({ className = "" }) {
  return (
    <div className={className}>
      <svg viewBox="0 0 120 60" className="h-12 w-auto" fill="none" stroke="currentColor">
        <path d="M10 50a50 50 0 0199 0" strokeWidth="6" className="text-brand-600" />
        <circle cx="60" cy="50" r="6" fill="currentColor" className="text-brand-600" />
        <path d="M60 50L90 30" strokeWidth="4" className="text-ink-800 dark:text-white" />
      </svg>
    </div>
  );
}

function CitySearch({ value, onChange }) {
  const [q, setQ] = React.useState("");
  const [open, setOpen] = React.useState(false);
  const [cities, setCities] = React.useState([]);
  const [hover, setHover] = React.useState(-1);
  React.useEffect(() => { setQ(value || ""); }, [value]);
  React.useEffect(() => {
    let mounted = true;
    const run = async () => {
      const { data } = await api.from("listings").select("city");
      const uniq = Array.from(new Set((data || []).map((r) => (r.city || "").trim()).filter(Boolean)));
      if (mounted) setCities(uniq);
    };
    run();
    return () => { mounted = false; };
  }, []);
  const filtered = q ? cities.filter((c) => c.toLowerCase().includes(q.toLowerCase())) : cities;
  const select = (c) => { onChange(c); setOpen(false); setHover(-1); };
  const clear = () => { onChange(""); setQ(""); setOpen(false); setHover(-1); };
  const onKey = (e) => {
    if (!open && (e.key === "ArrowDown" || e.key === "ArrowUp")) setOpen(true);
    if (e.key === "ArrowDown") setHover((h) => Math.min((filtered.length ? filtered.length - 1 : 0), h + 1));
    if (e.key === "ArrowUp") setHover((h) => Math.max(-1, h - 1));
    if (e.key === "Enter") {
      if (hover >= 0 && filtered[hover]) select(filtered[hover]); else if (q) select(q);
    }
    if (e.key === "Escape") setOpen(false);
  };
  return (
    <div className="relative w-full">
      <div className="flex items-center gap-2">
        <div className="relative w-full group">
          <MapPinIcon className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 text-gray-400 group-focus-within:text-brand-500 transition-colors" />
          <input
            value={q}
            onChange={(e) => { setQ(e.target.value); setOpen(true); setHover(-1); }}
            onFocus={() => setOpen(true)}
            onKeyDown={onKey}
            className="w-full pl-12 pr-10 py-3 bg-transparent border-none outline-none text-ink-800 dark:text-white placeholder-gray-400 text-base"
            placeholder="City..."
          />
          {value && (
            <button onClick={clear} className="absolute right-3 top-1/2 -translate-y-1/2 h-6 w-6 inline-flex items-center justify-center rounded-full text-gray-400 hover:text-gray-600 dark:hover:text-gray-200">×</button>
          )}
        </div>
      </div>
      {open && (
        <div className="absolute z-20 bottom-full mb-2 w-full rounded-xl border border-gray-100 dark:border-ink-700 bg-white dark:bg-ink-800 shadow-xl overflow-hidden">
          <div className="max-h-52 overflow-auto py-2">
            {!filtered.length && q && (
              <button onClick={() => select(q)} className="w-full text-left px-4 py-2 text-sm text-gray-700 dark:text-gray-200 hover:bg-gray-50 dark:hover:bg-ink-700">Use "{q}"</button>
            )}
            {filtered.map((c, i) => (
              <button key={c} onClick={() => select(c)} onMouseEnter={() => setHover(i)} className={`w-full text-left px-4 py-2 text-sm ${hover === i ? "bg-gray-50 dark:bg-ink-700" : ""} text-gray-700 dark:text-gray-200`}>{c}</button>
            ))}
            {!q && !filtered.length && (
              <div className="px-4 py-2 text-sm text-gray-500 dark:text-gray-400">No cities</div>
            )}
          </div>
        </div>
      )}
    </div>
  );
}

function Logo() {
  return (
    <div className="flex items-center gap-3 group">
      <div className="relative w-10 h-10 flex items-center justify-center bg-gradient-to-br from-brand-600 to-brand-800 rounded-xl shadow-lg shadow-brand-500/20 group-hover:shadow-brand-500/40 transition-all duration-300 group-hover:scale-105">
        <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" className="w-6 h-6 text-white" strokeLinecap="round" strokeLinejoin="round">
          <path d="M10 19h4" />
          <path d="M12 19v3" />
          <path d="M9 4h5a5 5 0 0 1 5 5v2a5 5 0 0 1-5 5H9V4z" />
        </svg>
        <div className="absolute -top-1 -right-1 w-3 h-3 bg-green-500 rounded-full border-2 border-white dark:border-ink-900 animate-pulse"></div>
      </div>
      <div className="flex flex-col">
        <span className="text-xl font-bold text-ink-900 dark:text-white leading-none tracking-tight">
          Park<span className="text-brand-600">It</span>Up
        </span>
        <span className="text-[10px] font-bold text-brand-600/80 uppercase tracking-widest leading-none mt-1">
          Smart Parking
        </span>
      </div>
    </div>
  );
}

function SteeringWheelIcon({ className = "" }) {
  return (
    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className={className}>
      <circle cx="12" cy="12" r="10" />
      <circle cx="12" cy="12" r="2" />
      <path d="M12 14v8" />
      <path d="M10 12H2" />
      <path d="M14 12h8" />
    </svg>
  );
}

function GaugeIcon({ className = "" }) {
  return (
    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className={className}>
      <path d="M12 15a3 3 0 1 0 0-6 3 3 0 0 0 0 6Z" />
      <path d="M13.4 10.6 19 5" />
      <path d="M12 21a9 9 0 1 1 0-18c1.5 0 2.9.4 4.2 1.1" />
    </svg>
  );
}

function GearShiftIcon({ className = "" }) {
  return (
    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className={className}>
      <circle cx="12" cy="12" r="3" />
      <path d="M19 12h2" />
      <path d="M3 12h2" />
      <path d="M12 19v2" />
      <path d="M12 3v2" />
      <path d="M12 15v4" />
      <path d="M12 5v4" />
      <path d="M5 12h4" />
      <path d="M15 12h4" />
    </svg>
  );
}

function LogOutIcon({ className = "" }) {
  return (
    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className={className}>
      <path d="M9 21H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h4" />
      <polyline points="16 17 21 12 16 7" />
      <line x1="21" y1="12" x2="9" y2="12" />
    </svg>
  );
}
