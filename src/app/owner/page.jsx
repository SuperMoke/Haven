"use client";

import { useState, useEffect } from "react";
import { MotionDiv } from "../components/MotionComponents";
import {
  collection,
  getDocs,
  query,
  where,
  orderBy,
  doc,
  updateDoc,
} from "firebase/firestore";
import { db, auth } from "../../../firebase";
import Navbar from "./navbar";
import { useRouter } from "next/navigation";
import { isAuthenticated } from "../utils/auth";

import {
  BarChart,
  Bar,
  XAxis,
  YAxis,
  Tooltip,
  Legend,
  ResponsiveContainer,
} from "recharts";

export default function OwnerPage() {
  const [venues, setVenues] = useState([]);
  const [menuItems, setMenuItems] = useState([]);
  const [approvedBookings, setApprovedBookings] = useState([]);
  const [loading, setLoading] = useState(true);
  const [userData, setUserData] = useState(null);

  const router = useRouter();
  const [isAuthorized, setIsAuthorized] = useState(false);
  const [user, setUser] = useState(null);
  const [selectedYear, setSelectedYear] = useState(new Date().getFullYear());

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
    const fetchUserData = async () => {
      const user = auth.currentUser;
      if (user) {
        const userDoc = await getDocs(
          query(collection(db, "users"), where("uid", "==", user.uid))
        );
        if (!userDoc.empty) {
          setUserData(userDoc.docs[0].data());
        }
      }
    };

    fetchUserData();
  }, []);

  const calculateMonthlyStats = (year) => {
    const monthlyData = Array(12)
      .fill()
      .map(() => ({
        bookings: 0,
        revenue: 0,
      }));

    approvedBookings.forEach((booking) => {
      const bookingDate = new Date(booking.startDate?.seconds * 1000);
      if (bookingDate.getFullYear() === year) {
        const month = bookingDate.getMonth();
        monthlyData[month].bookings += 1;
        if (booking.status === "finished" || booking.status === "paid") {
          monthlyData[month].revenue += booking.totalAmount || 0;
        }
      }
    });

    return monthlyData.map((data, index) => ({
      month: new Date(year, index).toLocaleString("default", {
        month: "short",
      }),
      bookings: data.bookings,
      revenue: data.revenue,
    }));
  };

  const years = Array.from(
    { length: new Date().getFullYear() - 2023 + 1 },
    (_, i) => 2023 + i
  );

  useEffect(() => {
    const fetchApprovedBookings = async () => {
      if (!userData?.venueAssigned) return; // Exit if no venue assigned

      try {
        const bookingsRef = collection(db, "bookings");
        const q = query(
          bookingsRef,
          where("venueId", "==", userData.venueAssigned),
          where("status", "in", [
            "approved",
            "ongoing",
            "paid",
            "ready",
            "finished",
          ]),
          orderBy("approvedAt", "desc")
        );

        const querySnapshot = await getDocs(q);
        const bookings = querySnapshot.docs.map((doc) => ({
          id: doc.id,
          ...doc.data(),
        }));
        setApprovedBookings(bookings);
      } catch (error) {
        console.error("Error fetching bookings:", error);
      }
    };

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

    if (userData) {
      fetchApprovedBookings();
    }
    fetchData();
  }, [userData]);

  const changeBookingStatus = async (bookingId) => {
    try {
      const bookingRef = doc(db, "bookings", bookingId);
      await updateDoc(bookingRef, {
        status: "ongoing",
        startedAt: new Date(),
      });

      // Refresh the bookings list
      const bookingsRef = collection(db, "bookings");
      // In changeBookingStatus()
      const q = query(
        bookingsRef,
        where("status", "in", [
          "approved",
          "ongoing",
          "paid",
          "ready",
          "finished",
        ]),
        orderBy("approvedAt", "desc")
      );

      const querySnapshot = await getDocs(q);
      const bookings = querySnapshot.docs.map((doc) => ({
        id: doc.id,
        ...doc.data(),
      }));
      setApprovedBookings(bookings);
    } catch (error) {
      console.error("Error updating booking status:", error);
    }
  };

  const calculateStatistics = () => {
    const today = new Date();

    const totalRevenue = approvedBookings.reduce(
      (sum, booking) =>
        booking.status === "paid" ||
        booking.status === "ready" ||
        booking.status === "finished"
          ? sum + (booking.totalAmount || 0)
          : sum,
      0
    );

    const upcomingBookings = approvedBookings.filter(
      (booking) =>
        booking.status !== "finished" &&
        new Date(booking.startDate?.seconds * 1000) > today
    );

    const activeBookings = approvedBookings.filter(
      (booking) => booking.status === "approved"
    ).length;

    const completedBookings = approvedBookings.filter(
      (booking) => booking.status === "finished"
    ).length;

    return {
      totalRevenue,
      upcomingBookings: upcomingBookings.length,
      activeBookings,
      completedBookings,
    };
  };

  const ApprovedBookingsSection = () => (
    <section className="mt-8">
      <div className="container mx-auto px-6 lg:px-20">
        <h2 className="text-2xl font-bold mb-6">Active Bookings</h2>
        <div className="grid gap-4">
          {approvedBookings
            .filter((booking) => booking.status !== "finished")
            .map((booking) => (
              <MotionDiv
                key={booking.id}
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                className={`p-6 bg-white rounded-xl shadow-sm border-2 ${
                  booking.status === "ongoing"
                    ? "border-green-500/20"
                    : "border-[#fdb040]/20"
                }`}
              >
                <div className="flex justify-between items-center">
                  <h3 className="text-xl font-semibold">{booking.userName}</h3>
                  <div className="flex gap-2">
                    <span
                      className={`px-3 py-1 rounded-full text-sm ${
                        booking.status === "ongoing"
                          ? "bg-green-100 text-green-800"
                          : booking.status === "paid"
                          ? "bg-blue-100 text-blue-800"
                          : booking.status === "ready"
                          ? "bg-purple-100 text-purple-800"
                          : booking.status === "finished"
                          ? "bg-gray-100 text-gray-800"
                          : "bg-[#fdb040]/10 text-[#fdb040]"
                      }`}
                    >
                      {booking.status === "ongoing"
                        ? "Event Ongoing"
                        : booking.status === "paid"
                        ? "Payment Received"
                        : booking.status === "ready"
                        ? "Villa Ready"
                        : booking.status === "finished"
                        ? "Event Completed"
                        : "Approved"}
                    </span>
                    {booking.status === "ongoing" && (
                      <span className="px-3 py-1 rounded-full text-sm bg-yellow-100 text-yellow-800">
                        Waiting for Payment
                      </span>
                    )}
                  </div>
                </div>
                <div className="space-y-2 w-full">
                  <p className="text-gray-600">{booking.userEmail}</p>

                  {/* Venue Information */}
                  <div className="mt-4 p-4 bg-gray-50 rounded-lg">
                    <h4 className="font-medium text-lg mb-2">Venue Details</h4>
                    <p className="text-sm">
                      {venues.find((venue) => venue.id === booking.venueId)
                        ?.name || "Venue not found"}
                    </p>
                  </div>

                  {/* Purchases/Menu Items */}

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
                      <h4 className="font-medium">Approved At:</h4>
                      <p className="text-sm">
                        {new Date(
                          booking.approvedAt?.seconds * 1000
                        ).toLocaleDateString()}
                      </p>
                    </div>
                  </div>
                </div>
                {booking.status === "ongoing" && (
                  <div className="mt-4 p-4 bg-yellow-50 rounded-lg">
                    <div className="flex items-center gap-2">
                      <svg
                        xmlns="http://www.w3.org/2000/svg"
                        className="h-5 w-5 text-yellow-600"
                        viewBox="0 0 20 20"
                        fill="currentColor"
                      >
                        <path
                          fillRule="evenodd"
                          d="M18 10a8 8 0 11-16 0 8 8 0 0116 0zm-7-4a1 1 0 11-2 0 1 1 0 012 0zM9 9a1 1 0 000 2v3a1 1 0 001 1h1a1 1 0 100-2v-3a1 1 0 00-1-1H9z"
                          clipRule="evenodd"
                        />
                      </svg>
                      <p className="text-sm text-yellow-800">
                        Payment collection pending for this event
                      </p>
                    </div>
                  </div>
                )}
                {booking.status === "approved" && (
                  <div className="mt-4">
                    <button
                      onClick={() => changeBookingStatus(booking.id)}
                      className="px-4 py-2 bg-[#fdb040] text-white rounded-lg hover:bg-[#fdb040]/90 transition-colors"
                    >
                      Accept
                    </button>
                  </div>
                )}

                {booking.status === "paid" && (
                  <div className="mt-4">
                    <button
                      onClick={() => markVillaReady(booking.id)}
                      className="px-4 py-2 bg-green-500 text-white rounded-lg hover:bg-green-600 transition-colors"
                    >
                      Mark Villa as Ready
                    </button>
                  </div>
                )}

                {booking.status === "ready" && (
                  <div className="mt-4">
                    <button
                      onClick={() => markBookingFinished(booking.id)}
                      className="px-4 py-2 bg-gray-500 text-white rounded-lg hover:bg-gray-600 transition-colors"
                    >
                      Mark as Finished
                    </button>
                  </div>
                )}
              </MotionDiv>
            ))}
          {approvedBookings.length === 0 && (
            <p className="text-center text-gray-500">
              No approved bookings found
            </p>
          )}
        </div>
      </div>
    </section>
  );

  const CompletedBookingsSection = () => (
    <section className="mt-8">
      <div className="container mx-auto px-6 lg:px-20">
        <h2 className="text-2xl font-bold mb-6">Completed Bookings</h2>
        <div className="grid gap-4">
          {approvedBookings
            .filter((booking) => booking.status === "finished")
            .map((booking) => (
              <MotionDiv
                key={booking.id}
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                className="p-6 bg-white rounded-xl shadow-sm border-2 border-gray-200"
              >
                <div className="flex justify-between items-center">
                  <h3 className="text-xl font-semibold">{booking.userName}</h3>
                  <span className="px-3 py-1 rounded-full text-sm bg-gray-100 text-gray-800">
                    Event Completed
                  </span>
                </div>
                <div className="space-y-2 w-full">
                  <p className="text-gray-600">{booking.userEmail}</p>

                  <div className="mt-4 p-4 bg-gray-50 rounded-lg">
                    <h4 className="font-medium text-lg mb-2">Venue Details</h4>
                    <p className="text-sm">
                      {venues.find((venue) => venue.id === booking.venueId)
                        ?.name || "Venue not found"}
                    </p>
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
                      <h4 className="font-medium">Completed At:</h4>
                      <p className="text-sm">
                        {new Date(
                          booking.finishedAt?.seconds * 1000
                        ).toLocaleDateString()}
                      </p>
                    </div>
                  </div>
                </div>
                <div className="mt-6 border-t pt-4">
                  <h4 className="font-medium text-lg mb-3">Customer Review</h4>
                  {booking.rating ? (
                    <div className="space-y-2">
                      <div className="flex items-center gap-2">
                        <div className="text-yellow-400 text-xl">
                          {"★".repeat(booking.rating)}
                          <span className="text-gray-300">
                            {"★".repeat(5 - booking.rating)}
                          </span>
                        </div>
                        <span className="text-sm text-gray-600">
                          {booking.ratedAt?.seconds
                            ? new Date(
                                booking.ratedAt.seconds * 1000
                              ).toLocaleDateString()
                            : ""}
                        </span>
                      </div>
                      {booking.comment && (
                        <blockquote className="pl-4 border-l-4 border-[#fdb040]/30 italic text-gray-600">
                          "{booking.comment}"
                        </blockquote>
                      )}
                    </div>
                  ) : (
                    <p className="text-gray-500 text-sm">No review provided</p>
                  )}
                </div>
              </MotionDiv>
            ))}
          {approvedBookings.filter((booking) => booking.status === "finished")
            .length === 0 && (
            <p className="text-center text-gray-500">
              No completed bookings found
            </p>
          )}
        </div>
      </div>
    </section>
  );

  const markBookingFinished = async (bookingId) => {
    try {
      const bookingRef = doc(db, "bookings", bookingId);
      await updateDoc(bookingRef, {
        status: "finished",
        finishedAt: new Date(),
      });

      // Refresh the bookings list
      const bookingsRef = collection(db, "bookings");
      const q = query(
        bookingsRef,
        where("status", "in", [
          "approved",
          "ongoing",
          "paid",
          "ready",
          "finished",
        ]),
        orderBy("approvedAt", "desc")
      );
      const querySnapshot = await getDocs(q);
      const bookings = querySnapshot.docs.map((doc) => ({
        id: doc.id,
        ...doc.data(),
      }));
      setApprovedBookings(bookings);
    } catch (error) {
      console.error("Error marking booking as finished:", error);
    }
  };

  const markVillaReady = async (bookingId) => {
    try {
      const bookingRef = doc(db, "bookings", bookingId);
      await updateDoc(bookingRef, {
        status: "ready",
        readyAt: new Date(),
      });

      // Refresh the bookings list
      const bookingsRef = collection(db, "bookings");
      const q = query(
        bookingsRef,
        where("status", "in", [
          "approved",
          "ongoing",
          "paid",
          "ready",
          "finished",
        ]),
        orderBy("approvedAt", "desc")
      );
      const querySnapshot = await getDocs(q);
      const bookings = querySnapshot.docs.map((doc) => ({
        id: doc.id,
        ...doc.data(),
      }));
      setApprovedBookings(bookings);
    } catch (error) {
      console.error("Error updating villa status:", error);
    }
  };

  const getVenueName = (venueId, venues) => {
    const venue = venues.find((v) => v.id === venueId);
    return venue ? venue.name : "Not assigned";
  };

  // Modify the return statement to include statistics and bookings section
  return (
    <div className="min-h-screen bg-gray-50">
      <Navbar />

      <div className="max-w-[1920px] mx-auto min-h-screen pb-20">
        <section className="bg-gradient-to-r from-[#fdb040]/10 to-white py-10">
          <div className="container mx-auto px-6 lg:px-20">
            <MotionDiv
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              className="flex flex-col gap-2"
            >
              <h1 className="text-3xl font-bold">Owner Dashboard</h1>
              {userData && (
                <div className="flex flex-col gap-1">
                  <p className="text-lg text-gray-600">
                    Welcome back, {userData.fullName}!
                  </p>
                  <p className="text-sm text-gray-500">
                    Venue: {getVenueName(userData.venueAssigned, venues)}
                  </p>
                </div>
              )}
            </MotionDiv>
          </div>
        </section>
        {/* Statistics Section */}
        <section className="py-8">
          <div className="container mx-auto px-6 lg:px-20 grid grid-cols-1 md:grid-cols-3 gap-6">
            <MotionDiv className="p-6 bg-white rounded-xl shadow-sm border-2 border-[#fdb040]/20">
              <h3 className="text-xl font-semibold mb-4">Total Revenue</h3>
              <div className="text-3xl font-bold text-[#fdb040]">
                ₱{calculateStatistics().totalRevenue.toLocaleString()}
              </div>
            </MotionDiv>

            <MotionDiv className="p-6 bg-white rounded-xl shadow-sm border-2 border-[#fdb040]/20">
              <h3 className="text-xl font-semibold mb-4">Active Bookings</h3>
              <div className="text-3xl font-bold text-[#fdb040]">
                {calculateStatistics().activeBookings}
              </div>
            </MotionDiv>

            <MotionDiv className="p-6 bg-white rounded-xl shadow-sm border-2 border-[#fdb040]/20">
              <h3 className="text-xl font-semibold mb-4">Completed Bookings</h3>
              <div className="text-3xl font-bold text-[#fdb040]">
                {calculateStatistics().completedBookings}
              </div>
            </MotionDiv>
          </div>
        </section>

        <section className="py-8">
          <div className="container mx-auto px-6 lg:px-20">
            <div className="flex justify-between items-center mb-6">
              <h2 className="text-2xl font-bold">Monthly Booking Statistics</h2>
              <div className="flex items-center gap-2">
                <label htmlFor="yearFilter" className="text-gray-600">
                  Select Year:
                </label>
                <select
                  id="yearFilter"
                  value={selectedYear}
                  onChange={(e) => setSelectedYear(Number(e.target.value))}
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
                  <YAxis yAxisId="left" orientation="left" stroke="#fdb040" />
                  <YAxis yAxisId="right" orientation="right" stroke="#82ca9d" />
                  <Tooltip />
                  <Legend />
                  <Bar
                    yAxisId="left"
                    dataKey="bookings"
                    name="Total Bookings"
                    fill="#fdb040"
                  />
                  <Bar
                    yAxisId="right"
                    dataKey="revenue"
                    name="Revenue (₱)"
                    fill="#82ca9d"
                  />
                </BarChart>
              </ResponsiveContainer>
            </div>
          </div>
        </section>

        {ApprovedBookingsSection()}
        {CompletedBookingsSection()}
      </div>
    </div>
  );
}
