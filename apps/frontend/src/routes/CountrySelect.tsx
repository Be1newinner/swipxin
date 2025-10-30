import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Card } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { ArrowLeft, Search, Check } from "lucide-react";
import { useAppNavigation } from "@/components/utils/navigateHook";
import { useAppStore } from "@/store/useAppStore";

const countries = [
  { code: "IN", name: "India", flag: "🇮🇳" },
  { code: "US", name: "United States", flag: "🇺🇸" },
  { code: "GB", name: "United Kingdom", flag: "🇬🇧" },
  { code: "CA", name: "Canada", flag: "🇨🇦" },
  { code: "AU", name: "Australia", flag: "🇦🇺" },
  { code: "DE", name: "Germany", flag: "🇩🇪" },
  { code: "FR", name: "France", flag: "🇫🇷" },
  { code: "JP", name: "Japan", flag: "🇯🇵" },
  { code: "KR", name: "South Korea", flag: "🇰🇷" },
  { code: "BR", name: "Brazil", flag: "🇧🇷" },
  { code: "MX", name: "Mexico", flag: "🇲🇽" },
  { code: "ES", name: "Spain", flag: "🇪🇸" },
  { code: "IT", name: "Italy", flag: "🇮🇹" },
  { code: "NL", name: "Netherlands", flag: "🇳🇱" },
  { code: "SE", name: "Sweden", flag: "🇸🇪" },
  { code: "NO", name: "Norway", flag: "🇳🇴" },
  { code: "FI", name: "Finland", flag: "🇫🇮" },
  { code: "DK", name: "Denmark", flag: "🇩🇰" },
  { code: "CH", name: "Switzerland", flag: "🇨🇭" },
  { code: "AT", name: "Austria", flag: "🇦🇹" },
  { code: "BE", name: "Belgium", flag: "🇧🇪" },
  { code: "PT", name: "Portugal", flag: "🇵🇹" },
  { code: "IE", name: "Ireland", flag: "🇮🇪" },
  { code: "PL", name: "Poland", flag: "🇵🇱" },
  { code: "CZ", name: "Czech Republic", flag: "🇨🇿" },
  { code: "GR", name: "Greece", flag: "🇬🇷" },
  { code: "TR", name: "Turkey", flag: "🇹🇷" },
  { code: "RU", name: "Russia", flag: "🇷🇺" },
  { code: "CN", name: "China", flag: "🇨🇳" },
  { code: "TH", name: "Thailand", flag: "🇹🇭" },
  { code: "SG", name: "Singapore", flag: "🇸🇬" },
  { code: "MY", name: "Malaysia", flag: "🇲🇾" },
  { code: "ID", name: "Indonesia", flag: "🇮🇩" },
  { code: "PH", name: "Philippines", flag: "🇵🇭" },
  { code: "VN", name: "Vietnam", flag: "🇻🇳" },
  { code: "AE", name: "UAE", flag: "🇦🇪" },
  { code: "SA", name: "Saudi Arabia", flag: "🇸🇦" },
  { code: "IL", name: "Israel", flag: "🇮🇱" },
  { code: "ZA", name: "South Africa", flag: "🇿🇦" },
  { code: "EG", name: "Egypt", flag: "🇪🇬" },
  { code: "NG", name: "Nigeria", flag: "🇳🇬" },
  { code: "KE", name: "Kenya", flag: "🇰🇪" },
  { code: "AR", name: "Argentina", flag: "🇦🇷" },
  { code: "CL", name: "Chile", flag: "🇨🇱" },
  { code: "CO", name: "Colombia", flag: "🇨🇴" },
  { code: "PE", name: "Peru", flag: "🇵🇪" },
  { code: "NZ", name: "New Zealand", flag: "🇳🇿" },
];

export function CountrySelect() {
  const updateUser = useAppStore((s) => s.updateUser);
  const onSelect = (country: string) => updateUser({ country });
  const user = useAppStore((s) => s.user);
  const [searchQuery, setSearchQuery] = useState("");
  const [tempSelected, setTempSelected] = useState(user?.country);
  const { navigate } = useAppNavigation();

  const filteredCountries = countries.filter((country) =>
    country.name.toLowerCase().includes(searchQuery.toLowerCase())
  );

  const handleConfirm = () => {
    if (tempSelected) {
      onSelect(tempSelected);
      navigate("home");
    }
  };

  return (
    <div className="min-h-screen">
      {/* Header */}
      <div
        className="flex items-center justify-between p-4 border-b border-slate-200 bg-white w-full z-10"
        style={{
          position: "fixed",
        }}
      >
        <div className="flex items-center gap-3">
          <Button
            variant="ghost"
            size="sm"
            onClick={() => navigate("home")}
            className="w-8 h-8 p-0"
          >
            <ArrowLeft className="w-4 h-4" />
          </Button>
          <div>
            <h1 className="text-lg font-semibold">Select Country</h1>
            <p className="text-xs text-muted-foreground">
              Choose your preferred country
            </p>
          </div>
        </div>
        <Badge className="bg-red-500 text-black font-semibold px-4 py-2">
          Free Feature
        </Badge>
      </div>

      <main className="pt-20">
        {/* Search */}
        <div className="p-4">
          <div className="relative bg-white">
            <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 w-4 h-4 text-muted-foreground " />
            <Input
              placeholder="Search countries..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="pl-10 glass"
            />
          </div>
        </div>

        {/* Countries List */}
        <div className="px-4 pb-24 space-y-2">
          {filteredCountries.map((country) => (
            <Card
              key={country.code}
              className={`glass p-4 cursor-pointer transition-all bg-white hover:scale-[1.02] border-none ${
                tempSelected === country.name
                  ? "bg-slate-200"
                  : "hover:border-primary/50"
              }`}
              onClick={() => setTempSelected(country.name)}
            >
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-3">
                  <span className="text-2xl">{country.flag}</span>
                  <div>
                    <h3 className="font-medium">{country.name}</h3>
                    <p className="text-sm text-muted-foreground">
                      {country.code}
                    </p>
                  </div>
                </div>
                {tempSelected === country.name && (
                  <div className="w-6 h-6 bg-primary rounded-full flex items-center justify-center">
                    <Check className="w-4 h-4 text-primary-foreground" />
                  </div>
                )}
              </div>
            </Card>
          ))}

          {filteredCountries.length === 0 && (
            <Card className="glass p-8 text-center">
              <p className="text-muted-foreground">
                No countries found matching "{searchQuery}"
              </p>
            </Card>
          )}
        </div>

        {/* Bottom Actions */}
        <div className="fixed bottom-0 left-0 right-0 p-4 bg-white border-t border-slate-300">
          <div className="flex gap-3">
            <Button
              onClick={() => navigate("home")}
              className="flex-1 bg-gradient-to-r from-primary to-accent hover:from-primary/90 hover:to-accent/90 cursor-pointer"
            >
              Cancel
            </Button>
            <Button
              variant="outline"
              onClick={handleConfirm}
              disabled={!tempSelected}
              className="flex-1  cursor-pointer"
            >
              Confirm Selection
            </Button>
          </div>
        </div>
      </main>
    </div>
  );
}
