import { useState } from "react";
import {
  ArrowLeft,
  Coins,
  Plus,
  CreditCard,
  Smartphone,
  TrendingUp,
  Info,
  Crown,
} from "lucide-react";
import { toast } from "sonner";
import { useAppNavigation } from "@/components/utils/navigateHook";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Card } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { useAppStore } from "@/store/useAppStore";

const mockTransactions = [
  {
    id: "1",
    type: "deduction",
    amount: -8,
    description: "Premium match with Alex from Canada",
    date: "Today, 2:30 PM",
    status: "completed",
  },
  {
    id: "2",
    type: "purchase",
    amount: 150,
    description: "Purchased tokens (₹100)",
    date: "Yesterday, 6:45 PM",
    status: "completed",
  },
  {
    id: "3",
    type: "bonus",
    amount: 25,
    description: "Welcome bonus",
    date: "2 days ago",
    status: "completed",
  },
  {
    id: "4",
    type: "deduction",
    amount: -8,
    description: "Premium match with Sarah from UK",
    date: "3 days ago",
    status: "completed",
  },
];

export function Wallet() {
  const updateUser = useAppStore((s) => s.updateUser);
  const [amount, setAmount] = useState("");
  const [isLoading, setIsLoading] = useState(false);
  const [showAddMoney, setShowAddMoney] = useState(false);
  const { navigate } = useAppNavigation();
  const user = useAppStore((s) => s.user);

  if (!user) {
    navigate("auth");
    return null;
  }

  const handleAddMoney = async () => {
    const numAmount = parseFloat(amount);
    if (!numAmount || numAmount < 100) {
      toast.error("Minimum amount is ₹100");
      return;
    }

    setIsLoading(true);

    // Simulate payment processing
    await new Promise((resolve) => setTimeout(resolve, 2000));

    const tokensToAdd = Math.floor(numAmount * 1.5);
    updateUser({ tokens: user.tokens + tokensToAdd });

    toast.success(
      `₹${numAmount} paid! ${tokensToAdd} tokens added to your wallet`
    );
    setAmount("");
    setShowAddMoney(false);
    setIsLoading(false);
  };

  const getTransactionIcon = (type: string) => {
    switch (type) {
      case "purchase":
        return <Plus className="w-4 h-4 text-accent" />;
      case "deduction":
        return <Crown className="w-4 h-4 text-primary" />;
      case "bonus":
        return <TrendingUp className="w-4 h-4 text-green-600" />;
    }
  };

  const getTransactionColor = (type: string) => {
    switch (type) {
      case "purchase":
      case "bonus":
        return "text-accent";
      case "deduction":
        return "text-muted-foreground";
    }
  };

  if (showAddMoney) {
    return (
      <div className="min-h-screen">
        {/* Header */}
        <div className="flex items-center gap-3 p-4 border-b border-border/50 bg-background/50 backdrop-blur-sm">
          <Button
            variant="ghost"
            size="sm"
            onClick={() => setShowAddMoney(false)}
            className="w-8 h-8 p-0"
          >
            <ArrowLeft className="w-4 h-4" />
          </Button>
          <h1 className="text-lg font-semibold">Add Money</h1>
        </div>

        <div className="p-4 space-y-6">
          {/* Amount Input */}
          <Card className="glass p-6 space-y-4">
            <div className="text-center">
              <h2 className="text-xl font-semibold mb-2">
                Add Money to Wallet
              </h2>
              <p className="text-sm text-muted-foreground">
                Minimum amount: ₹100 | Rate: 1.5 tokens per ₹1
              </p>
            </div>

            <div className="space-y-4">
              <div>
                <label className="block text-sm font-medium mb-2">
                  Amount (₹)
                </label>
                <Input
                  type="number"
                  placeholder="Enter amount (min ₹100)"
                  value={amount}
                  onChange={(e) => setAmount(e.target.value)}
                  min="100"
                  className="text-center text-lg"
                />
              </div>

              {amount && parseFloat(amount) >= 100 && (
                <Card className="bg-accent/10 border-accent/20 p-4">
                  <div className="text-center">
                    <div className="flex items-center justify-center gap-2 mb-2">
                      <Coins className="w-5 h-5 text-accent" />
                      <span className="font-semibold">
                        You'll receive: {Math.floor(parseFloat(amount) * 1.5)}{" "}
                        tokens
                      </span>
                    </div>
                    <p className="text-sm text-muted-foreground">
                      Rate: ₹{amount} × 1.5 ={" "}
                      {Math.floor(parseFloat(amount) * 1.5)} tokens
                    </p>
                  </div>
                </Card>
              )}
            </div>
          </Card>

          {/* Payment Methods */}
          <div className="space-y-3">
            <h3 className="font-medium">Choose Payment Method</h3>

            <Button
              onClick={() => handleAddMoney()}
              disabled={!amount || parseFloat(amount) < 100 || isLoading}
              className="w-full h-14 justify-between bg-gradient-to-r from-primary to-accent hover:from-primary/90 hover:to-accent/90"
            >
              <div className="flex items-center gap-3">
                <Smartphone className="w-5 h-5" />
                <span>Pay with UPI</span>
              </div>
              <span className="text-sm opacity-80">Instant</span>
            </Button>

            <Button
              onClick={() => handleAddMoney()}
              disabled={!amount || parseFloat(amount) < 100 || isLoading}
              variant="outline"
              className="w-full h-14 justify-between glass"
            >
              <div className="flex items-center gap-3">
                <CreditCard className="w-5 h-5" />
                <span>Credit/Debit Card</span>
              </div>
              <span className="text-sm text-muted-foreground">Secure</span>
            </Button>
          </div>

          {/* Info */}
          <Card className="glass bg-blue-50/50 dark:bg-blue-950/20 border-blue-200/50 dark:border-blue-800/50 p-4">
            <div className="flex items-start gap-3">
              <Info className="w-5 h-5 text-blue-600 dark:text-blue-400 flex-shrink-0 mt-0.5" />
              <div className="text-sm text-blue-700 dark:text-blue-300">
                <p className="font-medium mb-1">Token Usage</p>
                <p>
                  8 tokens are deducted when you or your match partner has
                  Premium active during a swipe.
                </p>
              </div>
            </div>
          </Card>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-primary/5 via-background to-accent/5">
      {/* Header */}
      <div className="flex items-center gap-3 p-4 border-b border-border/50 bg-background/50 backdrop-blur-sm">
        <Button
          variant="ghost"
          size="sm"
          onClick={() => navigate("home")}
          className="w-8 h-8 p-0"
        >
          <ArrowLeft className="w-4 h-4" />
        </Button>
        <h1 className="text-lg font-semibold">Token Wallet</h1>
      </div>

      <div className="p-4 space-y-6">
        {/* Balance Card */}
        <Card className="glass bg-gradient-to-br from-primary/10 to-accent/10 p-6 text-center">
          <div className="space-y-3">
            <div className="w-16 h-16 bg-gradient-to-br from-primary to-accent rounded-2xl flex items-center justify-center mx-auto">
              <Coins className="w-8 h-8 text-white" />
            </div>
            <div>
              <p className="text-sm text-muted-foreground">Current Balance</p>
              <h2 className="text-3xl font-bold bg-gradient-to-r from-primary to-accent bg-clip-text text-transparent">
                {user.tokens}
              </h2>
              <p className="text-sm text-muted-foreground">tokens</p>
            </div>
            <Button
              onClick={() => setShowAddMoney(true)}
              className="bg-gradient-to-r from-primary to-accent hover:from-primary/90 hover:to-accent/90"
            >
              <Plus className="w-4 h-4 mr-2" />
              Add Money
            </Button>
          </div>
        </Card>

        {/* Quick Add Options */}
        <div className="grid grid-cols-3 gap-3">
          {[100, 500, 1000].map((value) => (
            <Button
              key={value}
              variant="outline"
              onClick={() => {
                setAmount(value.toString());
                setShowAddMoney(true);
              }}
              className="glass flex-col h-16 space-y-1"
            >
              <span className="text-lg font-semibold">₹{value}</span>
              <span className="text-xs text-muted-foreground">
                {Math.floor(value * 1.5)} tokens
              </span>
            </Button>
          ))}
        </div>

        {/* Token Usage Info */}
        <Card className="glass p-4">
          <div className="flex items-start gap-3">
            <div className="w-8 h-8 bg-primary/10 rounded-lg flex items-center justify-center">
              <Info className="w-4 h-4 text-primary" />
            </div>
            <div className="flex-1">
              <h3 className="font-medium mb-2">Token Usage</h3>
              <div className="space-y-2 text-sm text-muted-foreground">
                <div className="flex items-center justify-between">
                  <span>Premium match swipe</span>
                  <Badge variant="outline" className="text-xs">
                    8 tokens
                  </Badge>
                </div>
                <div className="flex items-center justify-between">
                  <span>Regular match swipe</span>
                  <Badge variant="outline" className="text-xs">
                    Free
                  </Badge>
                </div>
                <div className="flex items-center justify-between">
                  <span>Conversion rate</span>
                  <Badge variant="outline" className="text-xs">
                    ₹1 = 1.5 tokens
                  </Badge>
                </div>
              </div>
            </div>
          </div>
        </Card>

        {/* Transaction History */}
        <div className="space-y-3">
          <div className="flex items-center justify-between">
            <h3 className="font-medium">Recent Transactions</h3>
            <Button variant="link" className="text-sm text-primary p-0 h-auto">
              View All
            </Button>
          </div>

          <div className="space-y-2">
            {mockTransactions.map((transaction) => (
              <Card key={transaction.id} className="glass p-4">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-3">
                    <div className="w-8 h-8 bg-muted/50 rounded-lg flex items-center justify-center">
                      {getTransactionIcon(transaction.type)}
                    </div>
                    <div>
                      <p className="font-medium text-sm">
                        {transaction.description}
                      </p>
                      <p className="text-xs text-muted-foreground">
                        {transaction.date}
                      </p>
                    </div>
                  </div>
                  <div className="text-right">
                    <p
                      className={`font-semibold ${getTransactionColor(
                        transaction.type
                      )}`}
                    >
                      {transaction.amount > 0 ? "+" : ""}
                      {transaction.amount}
                    </p>
                    <Badge
                      variant={
                        transaction.status === "completed"
                          ? "default"
                          : "secondary"
                      }
                      className="text-xs"
                    >
                      {transaction.status}
                    </Badge>
                  </div>
                </div>
              </Card>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
}
