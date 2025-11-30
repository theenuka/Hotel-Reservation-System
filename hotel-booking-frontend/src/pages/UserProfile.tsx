import { useState } from "react";
import { useQuery, useMutation, useQueryClient } from "react-query";
import * as apiClient from "../api-client";
import { useAuthContext } from "@asgardeo/auth-react";
import {
  Card,
  CardContent,
  CardHeader,
  CardTitle,
  CardDescription,
} from "../components/ui/card";
import { Button } from "../components/ui/button";
import { Input } from "../components/ui/input";
import { Label } from "../components/ui/label";
import { Badge } from "../components/ui/badge";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "../components/ui/tabs";
import { Switch } from "../components/ui/switch";
import useAppContext from "../hooks/useAppContext";
import {
  User,
  Mail,
  Phone,
  Shield,
  Bell,
  Award,
  Gift,
  Star,
  Crown,
  Loader2,
  Save,
  LogOut,
  Settings,
  CreditCard,
  History,
  TrendingUp,
  Sparkles,
} from "lucide-react";

// Loyalty tier configuration
const LOYALTY_TIERS = [
  { name: "Bronze", minPoints: 0, color: "bg-amber-700", icon: Award, discount: 0 },
  { name: "Silver", minPoints: 1000, color: "bg-gray-400", icon: Star, discount: 5 },
  { name: "Gold", minPoints: 5000, color: "bg-yellow-500", icon: Crown, discount: 10 },
  { name: "Platinum", minPoints: 15000, color: "bg-purple-500", icon: Sparkles, discount: 15 },
];

const UserProfile = () => {
  const { signOut } = useAuthContext();
  const { showToast } = useAppContext();
  const queryClient = useQueryClient();

  const [isEditing, setIsEditing] = useState(false);
  const [formData, setFormData] = useState({
    firstName: "",
    lastName: "",
    phone: "",
  });

  const [notificationPrefs, setNotificationPrefs] = useState({
    emailBookingConfirmation: true,
    emailReminders: true,
    emailPromotions: false,
    smsBookingConfirmation: true,
    smsReminders: false,
  });

  const { data: user, isLoading } = useQuery(
    "fetchCurrentUser",
    apiClient.fetchCurrentUser,
    {
      onSuccess: (data) => {
        setFormData({
          firstName: data.firstName || "",
          lastName: data.lastName || "",
          phone: data.phone || "",
        });
      },
    }
  );

  const updateProfileMutation = useMutation(apiClient.updateUserProfile, {
    onSuccess: () => {
      queryClient.invalidateQueries("fetchCurrentUser");
      showToast({
        title: "Profile Updated",
        description: "Your profile has been updated successfully.",
        type: "SUCCESS",
      });
      setIsEditing(false);
    },
    onError: () => {
      showToast({
        title: "Update Failed",
        description: "Failed to update profile. Please try again.",
        type: "ERROR",
      });
    },
  });

  const handleSaveProfile = () => {
    updateProfileMutation.mutate(formData);
  };

  const getCurrentTier = (points: number) => {
    for (let i = LOYALTY_TIERS.length - 1; i >= 0; i--) {
      if (points >= LOYALTY_TIERS[i].minPoints) {
        return LOYALTY_TIERS[i];
      }
    }
    return LOYALTY_TIERS[0];
  };

  const getNextTier = (points: number) => {
    for (const tier of LOYALTY_TIERS) {
      if (points < tier.minPoints) {
        return tier;
      }
    }
    return null;
  };

  // Calculate loyalty points based on total spent (1 point per £1)
  const loyaltyPoints = Math.floor(user?.totalSpent || 0);
  const currentTier = getCurrentTier(loyaltyPoints);
  const nextTier = getNextTier(loyaltyPoints);
  const progressToNextTier = nextTier
    ? ((loyaltyPoints - currentTier.minPoints) / (nextTier.minPoints - currentTier.minPoints)) * 100
    : 100;

  if (isLoading) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <div className="flex items-center gap-3">
          <Loader2 className="h-8 w-8 animate-spin text-brand-400" />
          <span className="text-lg font-medium text-gray-300">
            Loading profile...
          </span>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-night-900 py-8">
      <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8">
        {/* Header */}
        <div className="mb-8">
          <h1 className="text-3xl font-bold text-white flex items-center gap-3">
            <User className="h-8 w-8 text-brand-400" />
            My Profile
          </h1>
          <p className="text-gray-400 mt-2">
            Manage your account settings and preferences
          </p>
        </div>

        <Tabs defaultValue="profile" className="space-y-6">
          <TabsList className="bg-night-800 border border-white/10">
            <TabsTrigger value="profile" className="data-[state=active]:bg-brand-600">
              <User className="h-4 w-4 mr-2" />
              Profile
            </TabsTrigger>
            <TabsTrigger value="loyalty" className="data-[state=active]:bg-brand-600">
              <Award className="h-4 w-4 mr-2" />
              Loyalty
            </TabsTrigger>
            <TabsTrigger value="notifications" className="data-[state=active]:bg-brand-600">
              <Bell className="h-4 w-4 mr-2" />
              Notifications
            </TabsTrigger>
            <TabsTrigger value="security" className="data-[state=active]:bg-brand-600">
              <Shield className="h-4 w-4 mr-2" />
              Security
            </TabsTrigger>
          </TabsList>

          {/* Profile Tab */}
          <TabsContent value="profile">
            <Card className="bg-night-800 border-white/10">
              <CardHeader>
                <div className="flex items-center justify-between">
                  <div>
                    <CardTitle className="text-white">Personal Information</CardTitle>
                    <CardDescription className="text-gray-400">
                      Update your personal details
                    </CardDescription>
                  </div>
                  {!isEditing ? (
                    <Button
                      onClick={() => setIsEditing(true)}
                      variant="outline"
                      className="border-white/20 text-gray-300 hover:bg-white/10"
                    >
                      <Settings className="h-4 w-4 mr-2" />
                      Edit Profile
                    </Button>
                  ) : (
                    <div className="flex gap-2">
                      <Button
                        onClick={() => setIsEditing(false)}
                        variant="outline"
                        className="border-white/20 text-gray-300 hover:bg-white/10"
                      >
                        Cancel
                      </Button>
                      <Button
                        onClick={handleSaveProfile}
                        className="bg-brand-600 hover:bg-brand-700"
                        disabled={updateProfileMutation.isLoading}
                      >
                        {updateProfileMutation.isLoading ? (
                          <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                        ) : (
                          <Save className="h-4 w-4 mr-2" />
                        )}
                        Save Changes
                      </Button>
                    </div>
                  )}
                </div>
              </CardHeader>
              <CardContent className="space-y-6">
                {/* Profile Avatar */}
                <div className="flex items-center gap-4">
                  <div className="w-20 h-20 rounded-full bg-brand-600 flex items-center justify-center text-white text-2xl font-bold">
                    {user?.firstName?.[0]}{user?.lastName?.[0]}
                  </div>
                  <div>
                    <h3 className="text-xl font-semibold text-white">
                      {user?.firstName} {user?.lastName}
                    </h3>
                    <p className="text-gray-400">{user?.email}</p>
                    <Badge className={`${currentTier.color} text-white mt-2`}>
                      <currentTier.icon className="h-3 w-3 mr-1" />
                      {currentTier.name} Member
                    </Badge>
                  </div>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                  <div className="space-y-2">
                    <Label className="text-gray-300 flex items-center gap-2">
                      <User className="h-4 w-4" />
                      First Name
                    </Label>
                    {isEditing ? (
                      <Input
                        value={formData.firstName}
                        onChange={(e) =>
                          setFormData({ ...formData, firstName: e.target.value })
                        }
                        className="bg-night-900 border-white/10 text-white"
                      />
                    ) : (
                      <p className="text-white bg-night-900 px-3 py-2 rounded-md border border-white/10">
                        {user?.firstName || "Not set"}
                      </p>
                    )}
                  </div>

                  <div className="space-y-2">
                    <Label className="text-gray-300 flex items-center gap-2">
                      <User className="h-4 w-4" />
                      Last Name
                    </Label>
                    {isEditing ? (
                      <Input
                        value={formData.lastName}
                        onChange={(e) =>
                          setFormData({ ...formData, lastName: e.target.value })
                        }
                        className="bg-night-900 border-white/10 text-white"
                      />
                    ) : (
                      <p className="text-white bg-night-900 px-3 py-2 rounded-md border border-white/10">
                        {user?.lastName || "Not set"}
                      </p>
                    )}
                  </div>

                  <div className="space-y-2">
                    <Label className="text-gray-300 flex items-center gap-2">
                      <Mail className="h-4 w-4" />
                      Email
                    </Label>
                    <p className="text-gray-400 bg-night-900 px-3 py-2 rounded-md border border-white/10">
                      {user?.email}
                      <span className="text-xs ml-2 text-gray-500">(via Asgardeo)</span>
                    </p>
                  </div>

                  <div className="space-y-2">
                    <Label className="text-gray-300 flex items-center gap-2">
                      <Phone className="h-4 w-4" />
                      Phone
                    </Label>
                    {isEditing ? (
                      <Input
                        value={formData.phone}
                        onChange={(e) =>
                          setFormData({ ...formData, phone: e.target.value })
                        }
                        placeholder="Enter your phone number"
                        className="bg-night-900 border-white/10 text-white placeholder:text-gray-500"
                      />
                    ) : (
                      <p className="text-white bg-night-900 px-3 py-2 rounded-md border border-white/10">
                        {user?.phone || "Not set"}
                      </p>
                    )}
                  </div>
                </div>

                {/* Account Info */}
                <div className="pt-4 border-t border-white/10">
                  <h4 className="text-white font-medium mb-4">Account Information</h4>
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4 text-sm">
                    <div className="flex items-center gap-2 text-gray-400">
                      <CreditCard className="h-4 w-4" />
                      <span>Member since: {new Date(user?.createdAt || Date.now()).toLocaleDateString()}</span>
                    </div>
                    <div className="flex items-center gap-2 text-gray-400">
                      <Shield className="h-4 w-4" />
                      <span>Role: {user?.role || "User"}</span>
                    </div>
                  </div>
                </div>
              </CardContent>
            </Card>
          </TabsContent>

          {/* Loyalty Tab */}
          <TabsContent value="loyalty">
            <div className="space-y-6">
              {/* Loyalty Status Card */}
              <Card className="bg-gradient-to-br from-brand-600 to-purple-700 border-0">
                <CardContent className="pt-6">
                  <div className="flex items-center justify-between mb-6">
                    <div>
                      <h3 className="text-white text-xl font-bold flex items-center gap-2">
                        <currentTier.icon className="h-6 w-6" />
                        {currentTier.name} Member
                      </h3>
                      <p className="text-white/80">
                        {currentTier.discount}% discount on all bookings
                      </p>
                    </div>
                    <div className="text-right">
                      <p className="text-4xl font-bold text-white">{loyaltyPoints.toLocaleString()}</p>
                      <p className="text-white/80">Loyalty Points</p>
                    </div>
                  </div>

                  {nextTier && (
                    <div className="space-y-2">
                      <div className="flex justify-between text-sm text-white/80">
                        <span>{currentTier.name}</span>
                        <span>{nextTier.name}</span>
                      </div>
                      <div className="w-full bg-white/20 rounded-full h-3">
                        <div
                          className="bg-white rounded-full h-3 transition-all duration-500"
                          style={{ width: `${progressToNextTier}%` }}
                        />
                      </div>
                      <p className="text-white/80 text-sm text-center">
                        {(nextTier.minPoints - loyaltyPoints).toLocaleString()} points to {nextTier.name}
                      </p>
                    </div>
                  )}
                </CardContent>
              </Card>

              {/* Tier Benefits */}
              <Card className="bg-night-800 border-white/10">
                <CardHeader>
                  <CardTitle className="text-white flex items-center gap-2">
                    <Gift className="h-5 w-5 text-brand-400" />
                    Membership Tiers & Benefits
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
                    {LOYALTY_TIERS.map((tier) => (
                      <div
                        key={tier.name}
                        className={`p-4 rounded-lg border ${
                          currentTier.name === tier.name
                            ? "border-brand-500 bg-brand-500/10"
                            : "border-white/10 bg-night-900"
                        }`}
                      >
                        <div className="flex items-center gap-2 mb-2">
                          <div className={`p-2 rounded-full ${tier.color}`}>
                            <tier.icon className="h-4 w-4 text-white" />
                          </div>
                          <span className="text-white font-semibold">{tier.name}</span>
                        </div>
                        <p className="text-gray-400 text-sm mb-2">
                          {tier.minPoints.toLocaleString()}+ points
                        </p>
                        <p className="text-brand-400 font-medium">
                          {tier.discount}% discount
                        </p>
                        {currentTier.name === tier.name && (
                          <Badge className="mt-2 bg-brand-600">Current</Badge>
                        )}
                      </div>
                    ))}
                  </div>
                </CardContent>
              </Card>

              {/* How to Earn Points */}
              <Card className="bg-night-800 border-white/10">
                <CardHeader>
                  <CardTitle className="text-white flex items-center gap-2">
                    <TrendingUp className="h-5 w-5 text-brand-400" />
                    How to Earn Points
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                    <div className="p-4 bg-night-900 rounded-lg border border-white/10">
                      <div className="text-2xl font-bold text-brand-400 mb-1">1 point</div>
                      <p className="text-gray-400">per £1 spent on bookings</p>
                    </div>
                    <div className="p-4 bg-night-900 rounded-lg border border-white/10">
                      <div className="text-2xl font-bold text-brand-400 mb-1">500 points</div>
                      <p className="text-gray-400">first booking bonus</p>
                    </div>
                    <div className="p-4 bg-night-900 rounded-lg border border-white/10">
                      <div className="text-2xl font-bold text-brand-400 mb-1">100 points</div>
                      <p className="text-gray-400">leave a review after stay</p>
                    </div>
                  </div>
                </CardContent>
              </Card>

              {/* Points History */}
              <Card className="bg-night-800 border-white/10">
                <CardHeader>
                  <CardTitle className="text-white flex items-center gap-2">
                    <History className="h-5 w-5 text-brand-400" />
                    Recent Points Activity
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="text-center py-8 text-gray-400">
                    <History className="h-12 w-12 mx-auto mb-3 opacity-50" />
                    <p>No points activity yet</p>
                    <p className="text-sm">Complete a booking to start earning points!</p>
                  </div>
                </CardContent>
              </Card>
            </div>
          </TabsContent>

          {/* Notifications Tab */}
          <TabsContent value="notifications">
            <Card className="bg-night-800 border-white/10">
              <CardHeader>
                <CardTitle className="text-white">Notification Preferences</CardTitle>
                <CardDescription className="text-gray-400">
                  Choose how you want to receive notifications
                </CardDescription>
              </CardHeader>
              <CardContent className="space-y-6">
                {/* Email Notifications */}
                <div className="space-y-4">
                  <h4 className="text-white font-medium flex items-center gap-2">
                    <Mail className="h-4 w-4 text-brand-400" />
                    Email Notifications
                  </h4>
                  <div className="space-y-3">
                    <div className="flex items-center justify-between">
                      <div>
                        <p className="text-white">Booking Confirmations</p>
                        <p className="text-gray-400 text-sm">Receive confirmation emails when you book</p>
                      </div>
                      <Switch
                        checked={notificationPrefs.emailBookingConfirmation}
                        onCheckedChange={(checked) =>
                          setNotificationPrefs({ ...notificationPrefs, emailBookingConfirmation: checked })
                        }
                      />
                    </div>
                    <div className="flex items-center justify-between">
                      <div>
                        <p className="text-white">Check-in Reminders</p>
                        <p className="text-gray-400 text-sm">Get reminded before your stay</p>
                      </div>
                      <Switch
                        checked={notificationPrefs.emailReminders}
                        onCheckedChange={(checked) =>
                          setNotificationPrefs({ ...notificationPrefs, emailReminders: checked })
                        }
                      />
                    </div>
                    <div className="flex items-center justify-between">
                      <div>
                        <p className="text-white">Promotional Offers</p>
                        <p className="text-gray-400 text-sm">Receive deals and special offers</p>
                      </div>
                      <Switch
                        checked={notificationPrefs.emailPromotions}
                        onCheckedChange={(checked) =>
                          setNotificationPrefs({ ...notificationPrefs, emailPromotions: checked })
                        }
                      />
                    </div>
                  </div>
                </div>

                {/* SMS Notifications */}
                <div className="space-y-4 pt-4 border-t border-white/10">
                  <h4 className="text-white font-medium flex items-center gap-2">
                    <Phone className="h-4 w-4 text-brand-400" />
                    SMS Notifications
                  </h4>
                  <div className="space-y-3">
                    <div className="flex items-center justify-between">
                      <div>
                        <p className="text-white">Booking Confirmations</p>
                        <p className="text-gray-400 text-sm">Receive SMS when you book</p>
                      </div>
                      <Switch
                        checked={notificationPrefs.smsBookingConfirmation}
                        onCheckedChange={(checked) =>
                          setNotificationPrefs({ ...notificationPrefs, smsBookingConfirmation: checked })
                        }
                      />
                    </div>
                    <div className="flex items-center justify-between">
                      <div>
                        <p className="text-white">Check-in Reminders</p>
                        <p className="text-gray-400 text-sm">SMS reminders before check-in</p>
                      </div>
                      <Switch
                        checked={notificationPrefs.smsReminders}
                        onCheckedChange={(checked) =>
                          setNotificationPrefs({ ...notificationPrefs, smsReminders: checked })
                        }
                      />
                    </div>
                  </div>
                </div>

                <Button className="w-full bg-brand-600 hover:bg-brand-700">
                  <Save className="h-4 w-4 mr-2" />
                  Save Preferences
                </Button>
              </CardContent>
            </Card>
          </TabsContent>

          {/* Security Tab */}
          <TabsContent value="security">
            <Card className="bg-night-800 border-white/10">
              <CardHeader>
                <CardTitle className="text-white">Security Settings</CardTitle>
                <CardDescription className="text-gray-400">
                  Manage your account security
                </CardDescription>
              </CardHeader>
              <CardContent className="space-y-6">
                <div className="p-4 bg-night-900 rounded-lg border border-white/10">
                  <h4 className="text-white font-medium mb-2">Authentication Provider</h4>
                  <p className="text-gray-400 mb-4">
                    Your account is secured by Asgardeo Identity Provider.
                    Password changes and security settings are managed through Asgardeo.
                  </p>
                  <Badge className="bg-green-600">
                    <Shield className="h-3 w-3 mr-1" />
                    Secured by Asgardeo
                  </Badge>
                </div>

                <div className="p-4 bg-night-900 rounded-lg border border-white/10">
                  <h4 className="text-white font-medium mb-2">Active Sessions</h4>
                  <p className="text-gray-400 mb-4">
                    You are currently signed in on this device.
                  </p>
                  <div className="flex items-center gap-3 text-sm text-gray-400">
                    <div className="w-2 h-2 bg-green-500 rounded-full"></div>
                    <span>Current session • {new Date().toLocaleDateString()}</span>
                  </div>
                </div>

                <Button
                  onClick={() => signOut()}
                  variant="destructive"
                  className="w-full"
                >
                  <LogOut className="h-4 w-4 mr-2" />
                  Sign Out of All Devices
                </Button>
              </CardContent>
            </Card>
          </TabsContent>
        </Tabs>
      </div>
    </div>
  );
};

export default UserProfile;
