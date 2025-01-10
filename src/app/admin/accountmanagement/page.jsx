"use client";

import { useState, useEffect } from "react";
import { auth, db } from "../../../../firebase";
import { createUserWithEmailAndPassword } from "firebase/auth";
import {
  collection,
  addDoc,
  getDocs,
  query,
  where,
  deleteDoc,
  doc,
  updateDoc,
} from "firebase/firestore";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { MotionDiv, MotionButton } from "../../components/MotionComponents";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import Navbar from "../navbar";
import Sidebar from "../sidebar";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { isAuthenticated } from "@/app/utils/auth";
import { useRouter } from "next/navigation";

export default function AccountManagement() {
  const [showAddOwner, setShowAddOwner] = useState(false);
  const [owners, setOwners] = useState([]);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [isEditing, setIsEditing] = useState(false);
  const [editingId, setEditingId] = useState(null);
  const [formData, setFormData] = useState({
    email: "",
    password: "",
    fullName: "",
    phoneNumber: "",
    venueAssigned: "",
  });
  const [venues, setVenues] = useState([]);
  const router = useRouter();
  const [isAuthorized, setIsAuthorized] = useState(false);
  const [user, setUser] = useState(null);

  useEffect(() => {
    const checkAuth = async () => {
      console.log("Checking authentication...");
      const roleMap = {
        admin: true,
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
    fetchOwners();
    fetchVenues();
  }, []);

  const getVenueName = (venueId) => {
    const venue = venues.find((v) => v.id === venueId);
    return venue ? venue.name : "Not assigned";
  };

  const fetchOwners = async () => {
    try {
      const ownersRef = collection(db, "users");
      const q = query(ownersRef, where("role", "==", "owner"));
      const querySnapshot = await getDocs(q);
      const ownersData = querySnapshot.docs.map((doc) => ({
        id: doc.id,
        ...doc.data(),
      }));
      setOwners(ownersData);
    } catch (error) {
      console.error("Error fetching owners:", error);
    }
  };

  const fetchVenues = async () => {
    try {
      const venuesRef = collection(db, "venues");
      const querySnapshot = await getDocs(venuesRef);
      const venuesData = querySnapshot.docs.map((doc) => ({
        id: doc.id,
        ...doc.data(),
      }));
      setVenues(venuesData);
    } catch (error) {
      console.error("Error fetching venues:", error);
    }
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setIsSubmitting(true);

    const validationError = validateOwnerData(formData);
    if (validationError) {
      alert(validationError);
      setIsSubmitting(false);
      return;
    }

    try {
      if (isEditing) {
        // Update existing owner
        await updateDoc(doc(db, "users", editingId), {
          fullName: formData.fullName,
          phoneNumber: formData.phoneNumber,
          venueAssigned: formData.venueAssigned,
          updatedAt: new Date().toISOString(),
        });

        setOwners((prev) =>
          prev.map((owner) =>
            owner.id === editingId
              ? {
                  ...owner,
                  fullName: formData.fullName,
                  phoneNumber: formData.phoneNumber,
                  venueAssigned: formData.venueAssigned,
                }
              : owner
          )
        );
      } else {
        // Create new owner
        const userCredential = await createUserWithEmailAndPassword(
          auth,
          formData.email,
          formData.password
        );

        const ownerData = {
          uid: userCredential.user.uid,
          email: formData.email,
          fullName: formData.fullName,
          phoneNumber: formData.phoneNumber,
          venueAssigned: formData.venueAssigned,
          role: "owner",
          createdAt: new Date().toISOString(),
        };

        const docRef = await addDoc(collection(db, "users"), ownerData);
        setOwners((prev) => [...prev, { id: docRef.id, ...ownerData }]);
      }

      handleDialogClose();
    } catch (error) {
      console.error("Error:", error);
      alert(error.message);
    } finally {
      setIsSubmitting(false);
    }
  };

  const validateOwnerData = (data) => {
    if (!data.email.trim()) return "Email is required";
    if (!isEditing && !data.password.trim()) return "Password is required";
    if (!data.fullName.trim()) return "Full name is required";
    if (!data.phoneNumber.trim()) return "Phone number is required";
    if (!data.venueAssigned.trim()) return "Venue assignment is required";
    return null;
  };

  const handleDialogClose = () => {
    setShowAddOwner(false);
    setIsEditing(false);
    setEditingId(null);
    setFormData({
      email: "",
      password: "",
      fullName: "",
      phoneNumber: "",
      venueAssigned: "",
    });
  };

  const handleEditOwner = (owner) => {
    setIsEditing(true);
    setEditingId(owner.id);
    setFormData({
      email: owner.email,
      password: "", // Password field is not needed for editing
      fullName: owner.fullName,
      phoneNumber: owner.phoneNumber,
      venueAssigned: owner.venueAssigned,
    });
    setShowAddOwner(true);
  };

  const AddOwnerDialog = () => (
    <Dialog
      open={showAddOwner}
      onOpenChange={(open) => {
        if (!open) handleDialogClose();
        else setShowAddOwner(true);
      }}
    >
      <DialogTrigger asChild>
        <MotionButton
          whileHover={{ scale: 1.05 }}
          className="bg-[#fdb040] text-white px-6 py-2 rounded-lg"
        >
          Add New Owner
        </MotionButton>
      </DialogTrigger>
      <DialogContent className="sm:max-w-[425px]">
        <DialogHeader>
          <DialogTitle>
            {isEditing ? "Edit Owner" : "Add New Owner"}
          </DialogTitle>
        </DialogHeader>
        <form onSubmit={handleSubmit} className="space-y-4">
          <div>
            <label className="text-sm font-medium">Email</label>
            <Input
              type="email"
              required
              disabled={isEditing}
              value={formData.email}
              onChange={(e) =>
                setFormData({ ...formData, email: e.target.value })
              }
              placeholder="Email address"
            />
          </div>
          {!isEditing && (
            <div>
              <label className="text-sm font-medium">Password</label>
              <Input
                type="password"
                required
                value={formData.password}
                onChange={(e) =>
                  setFormData({ ...formData, password: e.target.value })
                }
                placeholder="Password"
              />
            </div>
          )}
          <div>
            <label className="text-sm font-medium">Full Name</label>
            <Input
              required
              value={formData.fullName}
              onChange={(e) =>
                setFormData({ ...formData, fullName: e.target.value })
              }
              placeholder="Full name"
            />
          </div>
          <div>
            <label className="text-sm font-medium">Phone Number</label>
            <Input
              required
              value={formData.phoneNumber}
              onChange={(e) =>
                setFormData({ ...formData, phoneNumber: e.target.value })
              }
              placeholder="Phone number"
            />
          </div>
          <div>
            <label className="text-sm font-medium">Venue Assigned</label>
            <Select
              required
              value={formData.venueAssigned}
              onValueChange={(value) =>
                setFormData({ ...formData, venueAssigned: value })
              }
            >
              <SelectTrigger>
                <SelectValue placeholder="Select venue" />
              </SelectTrigger>
              <SelectContent>
                {venues.map((venue) => (
                  <SelectItem key={venue.id} value={venue.id}>
                    {venue.name}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
          <Button
            type="submit"
            className="w-full bg-[#fdb040]"
            disabled={isSubmitting}
          >
            {isSubmitting
              ? isEditing
                ? "Updating..."
                : "Adding..."
              : isEditing
              ? "Update Owner"
              : "Add Owner"}
          </Button>
        </form>
      </DialogContent>
    </Dialog>
  );

  return (
    <div className="min-h-screen">
      <Navbar />
      <div className="pt-16">
        <div className="flex h-[calc(100vh-64px)]">
          <div className="flex">
            <div className="hidden md:flex w-72 flex-col fixed inset-y-16 z-50">
              <Sidebar />
            </div>
            <main className="md:pl-72 w-full">
              <div className="max-w-[1920px] mx-auto p-6">
                <div className="flex justify-between items-center mb-6">
                  <h1 className="text-2xl font-bold">Owner Management</h1>
                  {AddOwnerDialog()}
                </div>
                <div className="grid gap-4">
                  {owners.map((owner) => (
                    <MotionDiv
                      key={owner.id}
                      initial={{ opacity: 0 }}
                      animate={{ opacity: 1 }}
                      exit={{ opacity: 0 }}
                      layout
                      layoutId={owner.id}
                      transition={{
                        duration: 0.2,
                        ease: "easeInOut",
                      }}
                      whileHover={{
                        scale: 1.01,
                        transition: { duration: 0.2 },
                      }}
                      className="p-6 bg-white rounded-xl shadow-sm border-2 border-[#fdb040]/20"
                    >
                      <div className="flex justify-between items-start">
                        <div className="space-y-2 flex-1">
                          <h3 className="text-xl font-semibold">
                            {owner.fullName}
                          </h3>
                          <div className="grid grid-cols-2 gap-4">
                            <div>
                              <h4 className="font-medium">Email:</h4>
                              <p className="text-sm text-gray-600">
                                {owner.email}
                              </p>
                            </div>
                            <div>
                              <h4 className="font-medium">Phone:</h4>
                              <p className="text-sm text-gray-600">
                                {owner.phoneNumber}
                              </p>
                            </div>
                            <div>
                              <h4 className="font-medium">Venue Assigned:</h4>
                              <p className="text-sm text-gray-600">
                                {getVenueName(owner.venueAssigned)}
                              </p>
                            </div>
                            <div>
                              <h4 className="font-medium">Created:</h4>
                              <p className="text-sm text-gray-600">
                                {new Date(owner.createdAt).toLocaleDateString()}
                              </p>
                            </div>
                          </div>
                        </div>
                        <div className="flex gap-2">
                          <Button
                            variant="outline"
                            onClick={() => handleEditOwner(owner)}
                          >
                            Edit
                          </Button>
                          <Button
                            variant="destructive"
                            onClick={() => handleDeleteOwner(owner.id)}
                          >
                            Delete
                          </Button>
                        </div>
                      </div>
                    </MotionDiv>
                  ))}
                </div>
              </div>
            </main>
          </div>
        </div>
      </div>
    </div>
  );
}
