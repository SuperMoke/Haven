"use client";

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
import { Textarea } from "@/components/ui/textarea";
import { isAuthenticated } from "@/app/utils/auth";
import { useRouter } from "next/navigation";

export default function VenuesPage() {
  const [newVenue, setNewVenue] = useState({
    name: "",
    description: "",
    mapsUrl: "",
    images: [""],
    amenities: "",
    events: "",
    price: "",
  });
  const [showAddVenue, setShowAddVenue] = useState(false);
  const [venues, setVenues] = useState([]);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [isEditing, setIsEditing] = useState(false);
  const [editingId, setEditingId] = useState(null);
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
    const fetchVenues = async () => {
      const venuesSnapshot = await getDocs(collection(db, "venues"));
      setVenues(
        venuesSnapshot.docs.map((doc) => ({ id: doc.id, ...doc.data() }))
      );
    };
    fetchVenues();
  }, []);

  const validateVenueData = (venue) => {
    if (!venue.name.trim()) return "Venue name is required";
    if (!venue.description.trim()) return "Description is required";
    if (!venue.mapsUrl.trim()) return "Google Maps URL is required";
    if (!venue.images.length) return "At least one image URL is required";
    if (venue.images.some((url) => !url.trim()))
      return "All image URLs must be valid";
    if (!venue.amenities.trim()) return "Amenities are required";
    if (!venue.events.trim()) return "Events are required";
    if (!venue.price || isNaN(venue.price)) return "Valid price is required";
    return null;
  };

  const handleAddVenue = async (e) => {
    e.preventDefault();
    setIsSubmitting(true);

    const validationError = validateVenueData(newVenue);
    if (validationError) {
      setIsSubmitting(false);
      return;
    }

    try {
      const venueData = {
        name: newVenue.name,
        description: newVenue.description,
        mapsUrl: newVenue.mapsUrl,
        images: newVenue.images.filter((url) => url.trim()),
        amenities: newVenue.amenities.split(",").map((item) => item.trim()),
        events: newVenue.events.split(",").map((item) => item.trim()),
        price: parseFloat(newVenue.price),
      };

      if (isEditing) {
        await updateDoc(doc(db, "venues", editingId), {
          ...venueData,
          updatedAt: new Date().toISOString(),
        });

        setVenues((prev) =>
          prev.map((venue) =>
            venue.id === editingId ? { ...venueData, id: editingId } : venue
          )
        );
      } else {
        const venueRef = await addDoc(collection(db, "venues"), {
          ...venueData,
          createdAt: new Date().toISOString(),
        });

        setVenues((prev) => [...prev, { id: venueRef.id, ...venueData }]);
      }

      handleVenueDialogClose();
    } catch (error) {
      console.error("Error adding/updating venue:", error);
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleImageUrlAdd = () => {
    setNewVenue((prev) => ({
      ...prev,
      images: [...prev.images, ""],
    }));
  };

  const handleImageUrlChange = (index, value) => {
    setNewVenue((prev) => ({
      ...prev,
      images: prev.images.map((url, i) => (i === index ? value : url)),
    }));
  };

  const handleImageUrlRemove = (index) => {
    setNewVenue((prev) => ({
      ...prev,
      images: prev.images.filter((_, i) => i !== index),
    }));
  };

  const handleEditVenue = async (venue) => {
    const editableVenue = {
      ...venue,
      amenities: Array.isArray(venue.amenities)
        ? venue.amenities.join(", ")
        : venue.amenities,
      events: Array.isArray(venue.events)
        ? venue.events.join(", ")
        : venue.events,
    };
    setNewVenue(editableVenue);
    setIsEditing(true);
    setEditingId(venue.id);
    setShowAddVenue(true);
  };

  const handleDeleteVenue = async (id) => {
    if (window.confirm("Are you sure you want to delete this venue?")) {
      try {
        await deleteDoc(doc(db, "venues", id));
        setVenues(venues.filter((venue) => venue.id !== id));
      } catch (error) {
        console.error("Error deleting venue:", error);
      }
    }
  };

  const handleVenueDialogClose = () => {
    setNewVenue({
      name: "",
      description: "",
      mapsUrl: "",
      images: [""],
      amenities: "",
      events: "",
      price: "",
    });
    setShowAddVenue(false);
    setIsEditing(false);
    setEditingId(null);
  };

  const AddVenueDialog = () => (
    <Dialog
      open={showAddVenue}
      onOpenChange={(open) => {
        if (!open) handleVenueDialogClose();
        else setShowAddVenue(true);
      }}
    >
      <DialogTrigger asChild>
        <MotionButton
          whileHover={{ scale: 1.05 }}
          className="bg-[#fdb040] text-white px-6 py-2 rounded-lg"
        >
          Add New Venue
        </MotionButton>
      </DialogTrigger>
      <DialogContent className="sm:max-w-[425px] max-h-[80vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle>
            {isEditing ? "Edit Venue" : "Add New Venue"}
          </DialogTitle>
        </DialogHeader>
        <form onSubmit={handleAddVenue} className="space-y-4">
          <div>
            <label className="text-sm font-medium">Name</label>
            <Input
              required
              value={newVenue.name}
              onChange={(e) =>
                setNewVenue((prev) => ({ ...prev, name: e.target.value }))
              }
              placeholder="Venue name"
            />
          </div>
          <div>
            <label className="text-sm font-medium">Description</label>
            <Textarea
              required
              value={newVenue.description}
              onChange={(e) =>
                setNewVenue((prev) => ({
                  ...prev,
                  description: e.target.value,
                }))
              }
              placeholder="Venue description"
            />
          </div>
          <div>
            <label className="text-sm font-medium">Google Maps URL</label>
            <Input
              required
              value={newVenue.mapsUrl}
              onChange={(e) =>
                setNewVenue((prev) => ({ ...prev, mapsUrl: e.target.value }))
              }
              placeholder="Google Maps URL"
            />
          </div>
          <div>
            <label className="text-sm font-medium">Image URLs</label>
            {newVenue.images.map((url, index) => (
              <div key={index} className="flex gap-2 mt-2">
                <Input
                  value={url}
                  onChange={(e) => handleImageUrlChange(index, e.target.value)}
                  placeholder="Image URL"
                />
                <Button
                  type="button"
                  variant="destructive"
                  size="icon"
                  onClick={() => handleImageUrlRemove(index)}
                  className="shrink-0"
                >
                  <svg
                    xmlns="http://www.w3.org/2000/svg"
                    width="16"
                    height="16"
                    viewBox="0 0 24 24"
                    fill="none"
                    stroke="currentColor"
                    strokeWidth="2"
                    strokeLinecap="round"
                    strokeLinejoin="round"
                  >
                    <path d="M18 6L6 18M6 6l12 12" />
                  </svg>
                </Button>
              </div>
            ))}
            <Button
              type="button"
              variant="outline"
              className="mt-2"
              onClick={handleImageUrlAdd}
              disabled={newVenue.images.length >= 5}
            >
              Add Image URL
            </Button>
          </div>
          <div>
            <label className="text-sm font-medium">
              Amenities (comma-separated)
            </label>
            <Input
              required
              value={newVenue.amenities}
              onChange={(e) =>
                setNewVenue((prev) => ({ ...prev, amenities: e.target.value }))
              }
              placeholder="WiFi, Parking, Security, etc."
            />
          </div>
          <div>
            <label className="text-sm font-medium">
              Events (comma-separated)
            </label>
            <Input
              required
              value={newVenue.events}
              onChange={(e) =>
                setNewVenue((prev) => ({ ...prev, events: e.target.value }))
              }
              placeholder="Weddings, Corporate Events, Birthday Parties, etc."
            />
          </div>
          <div>
            <label className="text-sm font-medium">Price (₱)</label>
            <Input
              required
              type="number"
              step="0.01"
              min="0"
              value={newVenue.price}
              onChange={(e) =>
                setNewVenue((prev) => ({ ...prev, price: e.target.value }))
              }
              placeholder="0.00"
            />
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
              ? "Update Venue"
              : "Add Venue"}
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
                  <h1 className="text-2xl font-bold">Venue Management</h1>
                  {AddVenueDialog()}
                </div>
                <div className="grid gap-4">
                  {venues.map((venue) => (
                    <MotionDiv
                      key={venue.id}
                      initial={{ opacity: 0 }}
                      animate={{ opacity: 1 }}
                      className="p-6 bg-white rounded-xl shadow-sm border-2 border-[#fdb040]/20"
                    >
                      <div className="grid md:grid-cols-2 gap-6">
                        {/* Left Column - Venue Info */}
                        <div className="space-y-4">
                          <div className="flex justify-between items-start">
                            <div className="space-y-2 flex-1">
                              <h3 className="text-xl font-semibold">
                                {venue.name}
                              </h3>
                              <p className="text-gray-600">
                                {venue.description}
                              </p>
                              <div className="grid grid-cols-2 gap-4 mt-2">
                                <div>
                                  <h4 className="font-medium">Amenities:</h4>
                                  <p className="text-sm">
                                    {Array.isArray(venue.amenities)
                                      ? venue.amenities.join(", ")
                                      : venue.amenities
                                          ?.split(",")
                                          .map((item) => item.trim())
                                          .join(", ") || ""}
                                  </p>
                                </div>
                                <div>
                                  <h4 className="font-medium">Events:</h4>
                                  <p className="text-sm">
                                    {Array.isArray(venue.events)
                                      ? venue.events.join(", ")
                                      : venue.events
                                          ?.split(",")
                                          .map((item) => item.trim())
                                          .join(", ") || ""}
                                  </p>
                                </div>
                                <div>
                                  <h4 className="font-medium">Price:</h4>
                                  <p className="text-sm">₱{venue.price}</p>
                                </div>
                                <div>
                                  <h4 className="font-medium">Images:</h4>
                                  <div className="flex gap-2 mt-1">
                                    {venue.images.map((url, index) => (
                                      <img
                                        key={index}
                                        src={url}
                                        alt={`${venue.name} ${index + 1}`}
                                        className="w-12 h-12 object-cover rounded"
                                      />
                                    ))}
                                  </div>
                                </div>
                              </div>
                            </div>
                            <div className="flex gap-2">
                              <Button
                                variant="outline"
                                onClick={() => handleEditVenue(venue)}
                              >
                                Edit
                              </Button>
                              <Button
                                variant="destructive"
                                onClick={() => handleDeleteVenue(venue.id)}
                              >
                                Delete
                              </Button>
                            </div>
                          </div>
                        </div>

                        {/* Right Column - Map */}
                        <div className="h-[300px] rounded-lg overflow-hidden">
                          <iframe
                            src={venue.mapsUrl}
                            className="w-full h-full"
                            style={{ border: 0 }}
                            allowFullScreen=""
                            loading="lazy"
                            referrerPolicy="no-referrer-when-downgrade"
                          ></iframe>
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
