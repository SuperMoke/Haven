"use client";

import { useState, useEffect } from "react";
import { MotionDiv } from "../components/MotionComponents";
import {
  collection,
  getDocs,
  updateDoc,
  doc,
  query,
  where,
  orderBy,
  serverTimestamp,
} from "firebase/firestore";
import { db, auth } from "../../../firebase";
import { Button } from "@/components/ui/button";
import Navbar from "./navbar";
import Sidebar from "./sidebar";
import { isAuthenticated } from "../utils/auth";
import { useRouter } from "next/navigation";

export default function AdminPage() {
  const [venues, setVenues] = useState([]);
  const [menuItems, setMenuItems] = useState([]);
  const [loading, setLoading] = useState(true);
  const [activeBookings, setActiveBookings] = useState([]);
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
    const fetchActiveBookings = async () => {
      try {
        const bookingsRef = collection(db, "bookings");
        const q = query(
          bookingsRef,
          where("status", "==", "pending"),
          orderBy("createdAt", "desc")
        );

        const querySnapshot = await getDocs(q);
        const bookings = querySnapshot.docs.map((doc) => ({
          id: doc.id,
          ...doc.data(),
        }));
        setActiveBookings(bookings);
      } catch (error) {
        console.error("Error fetching bookings:", error);
      }
    };

    fetchActiveBookings();
  }, []);

  useEffect(() => {
    const fetchData = async () => {
      const venuesSnapshot = await getDocs(collection(db, "venues"));
      const menuSnapshot = await getDocs(collection(db, "menu"));

      setVenues(
        venuesSnapshot.docs.map((doc) => ({ id: doc.id, ...doc.data() }))
      );
      setMenuItems(
        menuSnapshot.docs.map((doc) => ({ id: doc.id, ...doc.data() }))
      );
      setLoading(false);
    };

    fetchData();
  }, []);

  const handleApproveBooking = async (bookingId) => {
    if (window.confirm("Are you sure you want to approve this booking?")) {
      try {
        const bookingRef = doc(db, "bookings", bookingId);
        await updateDoc(bookingRef, {
          status: "approved",
          approvedAt: serverTimestamp(),
        });

        setActiveBookings((prev) =>
          prev.filter((booking) => booking.id !== bookingId)
        );

        alert("Booking approved successfully!");
      } catch (error) {
        console.error("Error approving booking:", error);
        alert("Error approving booking. Please try again.");
      }
    }
  };

  const ActiveBookingsSection = () => (
    <section className="mt-8">
      <div className="container mx-auto px-6 lg:px-20">
        <h2 className="text-2xl font-bold mb-6">Active Bookings</h2>
        <div className="grid gap-4">
          {activeBookings.map((booking) => (
            <MotionDiv
              key={booking.id}
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              className="p-6 bg-white rounded-xl shadow-sm border-2 border-[#fdb040]/20"
            >
              <div className="flex justify-between items-start">
                <div className="space-y-2 w-full">
                  <h3 className="text-xl font-semibold">{booking.userName}</h3>
                  <p className="text-gray-600">{booking.userEmail}</p>

                  {/* Venue Information */}
                  <div className="mt-4 p-4 bg-gray-50 rounded-lg">
                    <h4 className="font-medium text-lg mb-2">Venue Details</h4>
                    <p className="text-sm">
                      {venues.find((venue) => venue.id === booking.venueId)
                        ?.name || "Venue not found"}
                    </p>
                  </div>

                  <div className="mt-4">
                    <h4 className="font-medium text-lg mb-2">Selected Items</h4>
                    <div className="space-y-2">
                      {booking.menuItems?.map((menuItemId, index) => {
                        const menuItem = menuItems.find(
                          (menu) => menu.id === menuItemId
                        );
                        return (
                          <div
                            key={index}
                            className="flex justify-between items-center p-2 bg-gray-50 rounded"
                          >
                            <span>{menuItem?.name || "Item not found"}</span>
                            <span className="text-sm">
                              ₱{menuItem?.price?.toLocaleString() || 0}
                            </span>
                          </div>
                        );
                      })}
                      {(!booking.menuItems ||
                        booking.menuItems.length === 0) && (
                        <p className="text-sm text-gray-500">
                          No menu items selected
                        </p>
                      )}
                    </div>
                  </div>

                  <div className="grid grid-cols-2 gap-4 mt-4">
                    <div>
                      <h4 className="font-medium">Start Date:</h4>
                      <p className="text-sm">
                        {new Date(
                          booking.startDate?.seconds * 1000
                        ).toLocaleDateString()}
                      </p>
                    </div>
                    <div>
                      <h4 className="font-medium">End Date:</h4>
                      <p className="text-sm">
                        {new Date(
                          booking.endDate?.seconds * 1000
                        ).toLocaleDateString()}
                      </p>
                    </div>
                    <div>
                      <h4 className="font-medium">Total Amount:</h4>
                      <p className="text-sm">₱{booking.totalAmount}</p>
                    </div>
                    <div>
                      <h4 className="font-medium">Status:</h4>
                      <p className="text-sm capitalize">{booking.status}</p>
                    </div>
                  </div>
                </div>
                <Button
                  onClick={() => handleApproveBooking(booking.id)}
                  className="bg-green-500 hover:bg-green-600 ml-4"
                >
                  Approve Booking
                </Button>
              </div>
            </MotionDiv>
          ))}
          {activeBookings.length === 0 && (
            <p className="text-center text-gray-500">
              No active bookings found
            </p>
          )}
        </div>
      </div>
    </section>
  );

  return (
    <div className="min-h-screen bg-gray-50">
      <Navbar />
      <div className="pt-16">
        <div className="flex min-h-[calc(100vh-64px)]">
          <div className="hidden md:flex w-72 flex-col fixed inset-y-16 z-50">
            <Sidebar />
          </div>
          <main className="md:pl-72 w-full">
            <div className="max-w-[1920px] mx-auto min-h-screen pb-20">
              <section className="bg-gradient-to-r from-[#fdb040]/10 to-white py-10">
                <div className="container mx-auto px-6 lg:px-20">
                  <MotionDiv
                    initial={{ opacity: 0, y: 20 }}
                    animate={{ opacity: 1, y: 0 }}
                    className="flex justify-between items-center"
                  >
                    <div>
                      <h1 className="text-3xl font-bold">Admin Dashboard</h1>
                      <p className="text-gray-600">Manage the booking</p>
                    </div>
                  </MotionDiv>
                </div>
              </section>
              <section className="py-8">
                <div className="container mx-auto px-6 lg:px-20 grid grid-cols-1 md:grid-cols-3 gap-6">
                  <MotionDiv className="p-6 bg-white rounded-xl shadow-sm border-2 border-[#fdb040]/20">
                    <h3 className="text-xl font-semibold mb-4">Total Venues</h3>
                    <div className="text-3xl font-bold text-[#fdb040]">
                      {venues.length}
                    </div>
                  </MotionDiv>

                  <MotionDiv className="p-6 bg-white rounded-xl shadow-sm border-2 border-[#fdb040]/20">
                    <h3 className="text-xl font-semibold mb-4">Menu Items</h3>
                    <div className="text-3xl font-bold text-[#fdb040]">
                      {menuItems.length}
                    </div>
                  </MotionDiv>

                  <MotionDiv className="p-6 bg-white rounded-xl shadow-sm border-2 border-[#fdb040]/20">
                    <h3 className="text-xl font-semibold mb-4">
                      Active Bookings
                    </h3>
                    <div className="text-3xl font-bold text-[#fdb040]">
                      {activeBookings.length}
                    </div>
                  </MotionDiv>
                </div>
              </section>
              {ActiveBookingsSection()}
            </div>
          </main>
        </div>
      </div>
    </div>
  );
}
