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
import {
  BarChart,
  Bar,
  XAxis,
  YAxis,
  Tooltip,
  Legend,
  ResponsiveContainer,
} from "recharts";
import emailjs from "@emailjs/browser";
import { format, isBefore, isSameDay, isWithinInterval } from "date-fns";

export default function AdminPage() {
  const [venues, setVenues] = useState([]);
  const [menuItems, setMenuItems] = useState([]);
  const [loading, setLoading] = useState(true);
  const [allBookings, setAllBookings] = useState([]);
  const [activeBookings, setActiveBookings] = useState([]);
  const router = useRouter();
  const [isAuthorized, setIsAuthorized] = useState(false);
  const [user, setUser] = useState(null);
  const [selectedYear, setSelectedYear] = useState(new Date().getFullYear());
  const years = Array.from(
    { length: new Date().getFullYear() - 2023 + 1 },
    (_, i) => 2023 + i
  );

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

  // Add this new useEffect for fetching all bookings
  useEffect(() => {
    const fetchAllBookings = async () => {
      try {
        const bookingsRef = collection(db, "bookings");
        const q = query(bookingsRef, orderBy("createdAt", "desc"));
        const querySnapshot = await getDocs(q);
        const bookings = querySnapshot.docs.map((doc) => ({
          id: doc.id,
          ...doc.data(),
        }));
        setAllBookings(bookings);
      } catch (error) {
        console.error("Error fetching bookings:", error);
      }
    };

    fetchAllBookings();
  }, []);

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

  const calculateMonthlyStats = (year) => {
    const monthlyData = Array(12)
      .fill()
      .map(() => ({
        bookings: 0,
        revenue: 0,
        pendingBookings: 0,
      }));

    allBookings.forEach((booking) => {
      const bookingDate = new Date(booking.startDate?.seconds * 1000);
      if (bookingDate.getFullYear() === year) {
        const month = bookingDate.getMonth();
        if (booking.status === "pending") {
          monthlyData[month].pendingBookings += 1;
        }
        monthlyData[month].bookings += 1;
        monthlyData[month].revenue += booking.totalAmount || 0;
      }
    });

    return monthlyData.map((data, index) => ({
      month: new Date(year, index).toLocaleString("default", {
        month: "short",
      }),
      bookings: data.bookings,
      pendingBookings: data.pendingBookings,
      revenue: data.revenue,
    }));
  };

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
        const booking = activeBookings.find((b) => b.id === bookingId);
        const venue = venues.find((v) => v.id === booking.venueId);

        await updateDoc(bookingRef, {
          status: "approved",
          approvedAt: serverTimestamp(),
        });

        // Send email confirmation
        await emailjs.send(
          "service_ht35ae7",
          "template_rzcby3k",
          {
            to_email: booking.userEmail,
            to_name: booking.userName,
            booking_id: bookingId,
            venue_name: venue.name,
            event_date: format(
              new Date(booking.startDate.seconds * 1000),
              "MMMM dd, yyyy"
            ),
            total_amount: booking.totalAmount.toLocaleString(),
          },
          "pAbartLYJWKojQ9K4"
        );

        setActiveBookings((prev) =>
          prev.filter((booking) => booking.id !== bookingId)
        );

        alert("Booking approved and confirmation email sent!");
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

              <section className="py-8">
                <div className="container mx-auto px-6 lg:px-20">
                  <div className="flex justify-between items-center mb-6">
                    <h2 className="text-2xl font-bold">
                      Monthly Booking Statistics
                    </h2>
                    <div className="flex items-center gap-2">
                      <label htmlFor="yearFilter" className="text-gray-600">
                        Select Year:
                      </label>
                      <select
                        id="yearFilter"
                        value={selectedYear}
                        onChange={(e) =>
                          setSelectedYear(Number(e.target.value))
                        }
                        className="border-2 border-[#fdb040]/20 rounded-lg px-3 py-2 focus:outline-none focus:border-[#fdb040]"
                      >
                        {years.map((year) => (
                          <option key={year} value={year}>
                            {year}
                          </option>
                        ))}
                      </select>
                    </div>
                  </div>
                  <div className="bg-white p-6 rounded-xl shadow-sm border-2 border-[#fdb040]/20">
                    <ResponsiveContainer width="100%" height={400}>
                      <BarChart
                        data={calculateMonthlyStats(selectedYear)}
                        margin={{ top: 20, right: 30, left: 20, bottom: 5 }}
                      >
                        <XAxis dataKey="month" />
                        <YAxis
                          yAxisId="left"
                          orientation="left"
                          stroke="#fdb040"
                        />
                        <YAxis
                          yAxisId="right"
                          orientation="right"
                          stroke="#82ca9d"
                        />
                        <Tooltip />
                        <Legend />
                        <Bar
                          yAxisId="left"
                          dataKey="bookings"
                          name="Total Bookings"
                          fill="#fdb040"
                        />
                        <Bar
                          yAxisId="left"
                          dataKey="pendingBookings"
                          name="Pending Bookings"
                          fill="#f97316"
                        />
                        <Bar
                          yAxisId="right"
                          dataKey="revenue"
                          name="Potential Revenue (₱)"
                          fill="#82ca9d"
                        />
                      </BarChart>
                    </ResponsiveContainer>
                  </div>
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
