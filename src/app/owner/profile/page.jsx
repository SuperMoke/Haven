"use client";
import { useState, useEffect } from "react";
import { auth, db } from "../../../../firebase";
import {
  updatePassword,
  reauthenticateWithCredential,
  EmailAuthProvider,
} from "firebase/auth";
import { doc, getDoc, updateDoc } from "firebase/firestore";
import Navbar from "../navbar";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  Eye,
  EyeOff,
  AlertCircle,
  CheckCircle2,
  User,
  Phone,
  Mail,
  Lock,
  Settings2,
} from "lucide-react";
import {
  Card,
  CardHeader,
  CardTitle,
  CardDescription,
  CardContent,
  CardFooter,
} from "@/components/ui/card";
import { AnimatedSection } from "@/app/components/AnimatedSection";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { motion } from "framer-motion";
import { useRouter } from "next/navigation";
import { isAuthenticated } from "@/app/utils/auth";

export default function ProfilePage() {
  const [userProfile, setUserProfile] = useState(null);
  const [editMode, setEditMode] = useState(false);
  const [formData, setFormData] = useState({
    fullName: "",
    email: "",
    phone: "",
  });

  const [passwordState, setPasswordState] = useState({
    current: "",
    new: "",
    confirm: "",
  });

  const [showPasswords, setShowPasswords] = useState({
    current: false,
    new: false,
    confirm: false,
  });

  const [status, setStatus] = useState({ type: "", message: "" });
  const [isLoading, setIsLoading] = useState(false);

  const router = useRouter();
  const [isAuthorized, setIsAuthorized] = useState(false);
  const [user, setUser] = useState(null);

  useEffect(() => {
    const checkAuth = async () => {
      console.log("Checking authentication...");
      const roleMap = {
        owner: true,
      };
      for (const role of Object.keys(roleMap)) {
        const authorized = await isAuthenticated(role);
        if (authorized) {
          console.log("User is authorized:", role);
          setIsAuthorized(true);
          return;
        }
      }
      router.push("/auth/login");
    };

    if (auth.currentUser) {
      checkAuth();
    }
  }, [auth.currentUser]);

  useEffect(() => {
    const fetchUserProfile = async () => {
      const user = auth.currentUser;
      if (user) {
        const userDoc = await getDoc(doc(db, "users", user.uid));
        const userData = userDoc.data();
        setUserProfile(userData);
        setFormData({
          fullName: userData.fullName || "",
          email: userData.email || "",
          phone: userData.phone || "",
        });
      }
    };
    fetchUserProfile();
  }, []);

  const handleProfileUpdate = async (e) => {
    e.preventDefault();
    setIsLoading(true);
    try {
      const user = auth.currentUser;
      await updateDoc(doc(db, "users", user.uid), {
        fullName: formData.fullName,
        phone: formData.phone,
      });
      setStatus({ type: "success", message: "Profile updated successfully!" });
      setEditMode(false);
    } catch (error) {
      setStatus({ type: "error", message: error.message });
    }
    setIsLoading(false);
  };

  const handlePasswordChange = async (e) => {
    e.preventDefault();
    setIsLoading(true);
    setStatus({ type: "", message: "" });

    try {
      if (passwordState.new !== passwordState.confirm) {
        throw new Error("New passwords don't match");
      }
      if (passwordState.new.length < 6) {
        throw new Error("Password must be at least 6 characters");
      }

      const user = auth.currentUser;
      const credential = EmailAuthProvider.credential(
        user.email,
        passwordState.current
      );
      await reauthenticateWithCredential(user, credential);
      await updatePassword(user, passwordState.new);

      setPasswordState({ current: "", new: "", confirm: "" });
      setStatus({ type: "success", message: "Password updated successfully!" });
    } catch (error) {
      setStatus({ type: "error", message: error.message });
    }
    setIsLoading(false);
  };

  const PasswordField = ({ type, label }) => (
    <div className="space-y-2">
      <Label className="text-sm font-medium text-gray-700">{label}</Label>
      <div className="relative">
        <Input
          type={showPasswords[type] ? "text" : "password"}
          value={passwordState[type]}
          onChange={(e) =>
            setPasswordState((prev) => ({ ...prev, [type]: e.target.value }))
          }
          className="pr-10 transition-all duration-300 focus:ring-2 focus:ring-[#fdb040]"
          required
        />
        <button
          type="button"
          onClick={() =>
            setShowPasswords((prev) => ({ ...prev, [type]: !prev[type] }))
          }
          className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-500 hover:text-gray-700 focus:outline-none"
        >
          {showPasswords[type] ? (
            <Eye className="h-4 w-4" />
          ) : (
            <EyeOff className="h-4 w-4" />
          )}
        </button>
      </div>
    </div>
  );

  return (
    <div className="min-h-screen bg-gradient-to-b from-gray-50 to-gray-100">
      <Navbar />

      <main className="container mx-auto px-4 py-8">
        <AnimatedSection>
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            className="max-w-4xl mx-auto"
          >
            <div className="flex items-center justify-center gap-2 mb-8">
              <Settings2 className="h-8 w-8 text-[#fdb040]" />
              <h1 className="text-3xl font-bold text-gray-900">
                Account Settings
              </h1>
            </div>

            <Tabs defaultValue="profile" className="w-full">
              <TabsList className="grid w-full grid-cols-2 mb-8">
                <TabsTrigger value="profile">Profile Information</TabsTrigger>
                <TabsTrigger value="security">Security Settings</TabsTrigger>
              </TabsList>

              <TabsContent value="profile">
                <Card className="border-2 border-[#fdb040]/10 shadow-lg">
                  <CardHeader>
                    <div className="flex justify-between items-center">
                      <div>
                        <CardTitle className="text-2xl">
                          Personal Information
                        </CardTitle>
                        <CardDescription>
                          Update your profile details
                        </CardDescription>
                      </div>
                      <Button
                        onClick={() => setEditMode(!editMode)}
                        variant="outline"
                        className="border-[#fdb040] text-[#fdb040] hover:bg-[#fdb040] hover:text-white"
                      >
                        {editMode ? "Cancel" : "Edit Profile"}
                      </Button>
                    </div>
                  </CardHeader>

                  <CardContent>
                    <form onSubmit={handleProfileUpdate} className="space-y-4">
                      <div className="space-y-2">
                        <label className="text-gray-700 flex items-center gap-2">
                          <User size={20} />
                          Full Name
                        </label>
                        <Input
                          value={formData.fullName}
                          onChange={(e) =>
                            setFormData({
                              ...formData,
                              fullName: e.target.value,
                            })
                          }
                          disabled={!editMode}
                          className="transition-all duration-300 focus:border-[#fdb040]"
                        />
                      </div>

                      <div className="space-y-2">
                        <label className="text-gray-700 flex items-center gap-2">
                          <Mail size={20} />
                          Email Address
                        </label>
                        <Input
                          value={formData.email}
                          disabled
                          className="bg-gray-50"
                        />
                      </div>

                      <div className="space-y-2">
                        <label className="text-gray-700 flex items-center gap-2">
                          <Phone size={20} />
                          Phone Number
                        </label>
                        <Input
                          value={formData.phone}
                          onChange={(e) =>
                            setFormData({ ...formData, phone: e.target.value })
                          }
                          disabled={!editMode}
                          className="transition-all duration-300 focus:border-[#fdb040]"
                        />
                      </div>

                      {editMode && (
                        <Button
                          type="submit"
                          className="w-full bg-[#fdb040] hover:bg-[#fdb040]/90 text-white"
                          disabled={isLoading}
                        >
                          {isLoading ? "Updating..." : "Save Changes"}
                        </Button>
                      )}
                    </form>
                  </CardContent>
                </Card>
              </TabsContent>

              <TabsContent value="security">
                <Card className="border-2 border-[#fdb040]/10 shadow-lg">
                  <CardHeader>
                    <CardTitle className="flex items-center gap-2">
                      <Lock className="h-6 w-6 text-[#fdb040]" />
                      Security Settings
                    </CardTitle>
                    <CardDescription>
                      Ensure your account is secure by using a strong password
                    </CardDescription>
                  </CardHeader>

                  <form onSubmit={handlePasswordChange}>
                    <CardContent className="space-y-6">
                      {status.message && (
                        <Alert
                          variant={
                            status.type === "error" ? "destructive" : "success"
                          }
                        >
                          {status.type === "error" ? (
                            <AlertCircle className="h-4 w-4" />
                          ) : (
                            <CheckCircle2 className="h-4 w-4" />
                          )}
                          <AlertDescription>{status.message}</AlertDescription>
                        </Alert>
                      )}

                      <div className="space-y-4">
                        <PasswordField
                          type="current"
                          label="Current Password"
                        />
                        <PasswordField type="new" label="New Password" />
                        <PasswordField
                          type="confirm"
                          label="Confirm New Password"
                        />
                      </div>
                    </CardContent>

                    <CardFooter>
                      <Button
                        type="submit"
                        className="w-full bg-[#fdb040] hover:bg-[#fdb040]/90 text-white transition-all duration-300"
                        disabled={isLoading}
                      >
                        {isLoading ? (
                          <div className="flex items-center gap-2">
                            <span className="animate-spin">⚪</span>
                            Updating...
                          </div>
                        ) : (
                          "Update Password"
                        )}
                      </Button>
                    </CardFooter>
                  </form>
                </Card>
              </TabsContent>
            </Tabs>
          </motion.div>
        </AnimatedSection>
      </main>
    </div>
  );
}
