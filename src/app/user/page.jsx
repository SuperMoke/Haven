"use client";
import { useState, useEffect } from "react";
import Navbar from "./navbar";
import { MotionDiv, MotionButton } from "../components/MotionComponents";
import { auth, db } from "../../../firebase";
import {
  doc,
  getDoc,
  collection,
  getDocs,
  addDoc,
  serverTimestamp,
  query,
  where,
  orderBy,
  onSnapshot,
  updateDoc,
} from "firebase/firestore";
import { DayPicker } from "react-day-picker";
import { format, isBefore, isSameDay, isWithinInterval } from "date-fns";

import "react-day-picker/dist/style.css";

import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import { RadioGroup, RadioGroupItem } from "@/components/ui/radio-group";
import { Label } from "@/components/ui/label";
import { Checkbox } from "@/components/ui/checkbox";
import { Button } from "@/components/ui/button";
import { Calendar, CalendarPlus, CalendarRange } from "lucide-react";
import { CreditCard, Wallet, Building2 } from "lucide-react";
import { isAuthenticated } from "../utils/auth";
import { useRouter } from "next/navigation";
import { pdf } from "@react-pdf/renderer";
import emailjs from "@emailjs/browser";
import { ReceiptDocument } from "../utils/generateReceipt";

const CALENDARIFIC_API_KEY = "XtujOgEK9g4xmJurzr2RXPPxUq9muk0j";
const STORAGE_KEY = "holidays_cache";
const CACHE_DURATION = 24 * 60 * 60 * 1000;

export default function UserHomepage() {
  const [userProfile, setUserProfile] = useState(null);

  const [selected, setSelected] = useState(null);
  const [bookedDates, setBookedDates] = useState([]);
  const [holidays, setHolidays] = useState([]);
  const [showBookingDialog, setShowBookingDialog] = useState(false);
  const [bookingForm, setBookingForm] = useState({
    bookingType: "single",
    startDate: null,
    endDate: null,
    venueId: "",
    photography: false,
    menuItems: [],
    balloons: false,
  });
  const [venues, setVenues] = useState([]);
  const [menu, setMenu] = useState([]);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [completedBookings, setCompletedBookings] = useState([]);
  const [activeBookings, setActiveBookings] = useState([]);
  const [venueBookings, setVenueBookings] = useState({});
  const [showPaymentDialog, setShowPaymentDialog] = useState(null);
  const router = useRouter();
  const [isAuthorized, setIsAuthorized] = useState(false);
  const [user, setUser] = useState(null);
  const [showRatingDialog, setShowRatingDialog] = useState(null);

  useEffect(() => {
    const checkAuth = async () => {
      console.log("Checking authentication...");
      const roleMap = {
        user: true,
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

  const handleRatingSubmit = async (rating, comment) => {
    try {
      const bookingRef = doc(db, "bookings", showRatingDialog.id);
      await updateDoc(bookingRef, {
        rating,
        comment,
        ratedAt: serverTimestamp(),
      });
      setShowRatingDialog(null);
      // Optionally show success message
      alert("Thank you for your rating!");
    } catch (error) {
      console.error("Error submitting rating:", error);
      alert("Failed to submit rating. Please try again.");
    }
  };

  const PaymentDialog = ({ booking, venues, onClose, onPaymentComplete }) => {
    const [cardDetails, setCardDetails] = useState({
      number: "",
      expiry: "",
      cvc: "",
      name: "",
    });
    const [isProcessing, setIsProcessing] = useState(false);

    const handlePayment = async () => {
      setIsProcessing(true);
      try {
        // Update booking status in Firebase
        const bookingRef = doc(db, "bookings", booking.id);
        await updateDoc(bookingRef, {
          status: "paid",
          paymentMethod: "card",
          paymentDate: serverTimestamp(),
        });

        const venue = venues.find((v) => v.id === booking.venueId);
        const receiptDoc = (
          <ReceiptDocument
            booking={booking}
            venue={venue}
            userProfile={userProfile}
          />
        );

        const pdfBlob = await pdf(receiptDoc).toBlob();
        const pdfBase64 = await new Promise((resolve) => {
          const reader = new FileReader();
          reader.readAsDataURL(pdfBlob);
          reader.onloadend = () => resolve(reader.result.split(",")[1]);
        });

        // Send email with receipt
        await emailjs.send(
          "service_ht35ae7",
          "template_vpev5er",
          {
            to_email: booking.userEmail,
            to_name: booking.userName,
            booking_ref: booking.id,
            booking_date: booking.startDate.toLocaleDateString(),
            total_amount: booking.totalAmount.toLocaleString(),
            pdf_attachment: pdfBase64,
          },
          "pAbartLYJWKojQ9K4"
        );

        onPaymentComplete();
      } catch (error) {
        console.error("Payment error:", error);
        alert("Payment failed. Please try again.");
      } finally {
        setIsProcessing(false);
      }
    };

    return (
      <Dialog open onOpenChange={onClose}>
        <DialogContent className="sm:max-w-[600px] bg-white/95 backdrop-blur-sm">
          <DialogHeader>
            <DialogTitle className="text-2xl font-bold bg-gradient-to-r from-[#fdb040] to-[#fd9040] bg-clip-text text-transparent">
              Complete Your Payment
            </DialogTitle>
          </DialogHeader>

          <div className="space-y-6">
            <div>
              <h3 className="font-semibold mb-2">Booking Details</h3>
              <div className="bg-gray-50 p-4 rounded-lg space-y-2">
                <p>
                  Venue: {venues.find((v) => v.id === booking.venueId)?.name}
                </p>
                <p>Date: {format(booking.startDate, "MMMM dd, yyyy")}</p>
                <p className="text-xl font-bold">
                  Total: ₱{booking.totalAmount.toLocaleString()}
                </p>
              </div>
            </div>

            <div className="space-y-4">
              <h3 className="font-semibold">Credit Card Details</h3>
              <div className="space-y-3">
                <input
                  type="text"
                  placeholder="Cardholder Name"
                  className="w-full p-3 rounded-lg border-2 border-gray-200"
                  value={cardDetails.name}
                  onChange={(e) =>
                    setCardDetails((prev) => ({
                      ...prev,
                      name: e.target.value,
                    }))
                  }
                />
                <input
                  type="text"
                  placeholder="Card Number"
                  className="w-full p-3 rounded-lg border-2 border-gray-200"
                  value={cardDetails.number}
                  onChange={(e) =>
                    setCardDetails((prev) => ({
                      ...prev,
                      number: e.target.value,
                    }))
                  }
                />
                <div className="grid grid-cols-2 gap-4">
                  <input
                    type="text"
                    placeholder="MM/YY"
                    className="p-3 rounded-lg border-2 border-gray-200"
                    value={cardDetails.expiry}
                    onChange={(e) =>
                      setCardDetails((prev) => ({
                        ...prev,
                        expiry: e.target.value,
                      }))
                    }
                  />
                  <input
                    type="text"
                    placeholder="CVC"
                    className="p-3 rounded-lg border-2 border-gray-200"
                    value={cardDetails.cvc}
                    onChange={(e) =>
                      setCardDetails((prev) => ({
                        ...prev,
                        cvc: e.target.value,
                      }))
                    }
                  />
                </div>
              </div>
            </div>

            <Button
              onClick={handlePayment}
              disabled={isProcessing}
              className="w-full bg-gradient-to-r from-[#fdb040] to-[#fd9040] text-white py-6 rounded-xl font-semibold"
            >
              {isProcessing ? "Processing..." : "Pay Now"}
            </Button>
          </div>
        </DialogContent>
      </Dialog>
    );
  };

  const RatingDialog = ({ booking, onClose, onSubmit }) => {
    const [rating, setRating] = useState(0);
    const [comment, setComment] = useState("");

    return (
      <Dialog open onOpenChange={onClose}>
        <DialogContent className="sm:max-w-[425px]">
          <DialogHeader>
            <DialogTitle>Rate Your Experience</DialogTitle>
          </DialogHeader>
          <div className="space-y-4">
            <div className="flex gap-1">
              {[1, 2, 3, 4, 5].map((star) => (
                <button
                  key={star}
                  onClick={() => setRating(star)}
                  className={`text-2xl ${
                    star <= rating ? "text-yellow-400" : "text-gray-300"
                  }`}
                >
                  ★
                </button>
              ))}
            </div>
            <textarea
              value={comment}
              onChange={(e) => setComment(e.target.value)}
              placeholder="Share your experience..."
              className="w-full p-2 border rounded-md"
              rows={4}
            />
            <Button
              onClick={() => onSubmit(rating, comment)}
              className="w-full bg-gradient-to-r from-[#fdb040] to-[#fd9040]"
            >
              Submit Rating
            </Button>
          </div>
        </DialogContent>
      </Dialog>
    );
  };

  const isDateBookedForVenue = (date, venueId) => {
    if (!venueId || !venueBookings[venueId]) return false;

    return venueBookings[venueId].some((booking) => {
      const startDate =
        booking.startDate instanceof Date
          ? booking.startDate
          : booking.startDate.toDate();

      const endDate =
        booking.endDate instanceof Date
          ? booking.endDate
          : booking.endDate.toDate();

      return (
        isSameDay(startDate, date) ||
        (endDate && isWithinInterval(date, { start: startDate, end: endDate }))
      );
    });
  };

  const getMinBookingDate = () => {
    const minDate = new Date();
    minDate.setDate(minDate.getDate() + 3);
    return minDate;
  };

  const calculateTotalAmount = () => {
    let total = 0;

    if (bookingForm.venueId) {
      const selectedVenue = venues.find(
        (venue) => venue.id === bookingForm.venueId
      );
      if (selectedVenue) {
        // For multiple days, multiply by number of days
        if (
          bookingForm.bookingType === "multiple" &&
          bookingForm.startDate &&
          bookingForm.endDate
        ) {
          const days =
            Math.ceil(
              (bookingForm.endDate - bookingForm.startDate) /
                (1000 * 60 * 60 * 24)
            ) + 1;
          total += selectedVenue.price * days;
        } else {
          total += selectedVenue.price;
        }
      }
    }

    // Add photography package cost
    const photographyPrices = {
      pkg1: 45000,
      pkg2: 55000,
      pkg3: 65000,
      pkg4: 75000,
    };
    if (bookingForm.photographyPackage) {
      total += photographyPrices[bookingForm.photographyPackage];
    }

    // Add menu items cost
    bookingForm.menuItems.forEach((menuItemId) => {
      const menuItem = menu.find((item) => item.id === menuItemId);
      if (menuItem) {
        total += menuItem.price;
      }
    });

    // Add balloon decoration cost
    if (bookingForm.balloons) {
      total += 15000; // ₱15,000 for balloon decoration
    }

    return total;
  };

  const convertToDate = (dateValue) => {
    if (!dateValue) return null;

    // Handle Firestore Timestamp
    if (dateValue?.toDate) {
      return dateValue.toDate();
    }

    // Handle string dates
    if (typeof dateValue === "string") {
      return new Date(dateValue);
    }

    // Handle existing Date objects
    if (dateValue instanceof Date) {
      return dateValue;
    }

    return null;
  };

  useEffect(() => {
    if (!user?.uid) return;

    // Create realtime listener
    const bookingsRef = collection(db, "bookings");
    const q = query(
      bookingsRef,
      where("userId", "==", user.uid),
      orderBy("createdAt", "desc")
    );

    const unsubscribe = onSnapshot(q, (snapshot) => {
      const allBookings = snapshot.docs.map((doc) => {
        const data = doc.data();
        return {
          id: doc.id,
          ...data,
          startDate: convertToDate(data.startDate),
          endDate: convertToDate(data.endDate),
          createdAt: convertToDate(data.createdAt),
        };
      });

      // Filter out bookings with invalid dates
      const validBookings = allBookings.filter(
        (booking) => booking.startDate && booking.endDate
      );

      // Separate finished and active bookings
      const finished = validBookings.filter((b) => b.status === "finished");
      const active = validBookings.filter((b) => b.status !== "finished");

      // Update states
      setCompletedBookings(finished);
      setActiveBookings(active);
    });

    // Cleanup subscription on unmount
    return () => unsubscribe();
  }, [user]);

  useEffect(() => {
    const fetchHolidays = async () => {
      // Check localStorage first
      const cachedData = localStorage.getItem(STORAGE_KEY);

      if (cachedData) {
        const { holidays, timestamp } = JSON.parse(cachedData);
        const isExpired = Date.now() - timestamp > CACHE_DURATION;

        if (!isExpired) {
          setHolidays(
            holidays.map((holiday) => ({
              ...holiday,
              date: new Date(holiday.date),
            }))
          );
          return;
        }
      }

      // Fetch from API if no cache or expired
      const year = new Date().getFullYear();
      const response = await fetch(
        `https://calendarific.com/api/v2/holidays?api_key=${CALENDARIFIC_API_KEY}&country=PH&year=${year}`
      );
      const data = await response.json();

      const holidayDates = data.response.holidays.map((holiday) => ({
        date: new Date(holiday.date.iso),
        name: holiday.name,
        type: "holiday",
      }));

      // Save to localStorage with timestamp
      const cacheData = {
        holidays: holidayDates.map((holiday) => ({
          ...holiday,
          date: holiday.date.toISOString(),
        })),
        timestamp: Date.now(),
      };
      localStorage.setItem(STORAGE_KEY, JSON.stringify(cacheData));

      setHolidays(holidayDates);
    };

    fetchHolidays();
  }, []);

  // Update the fetchBookedDates useEffect
  useEffect(() => {
    const fetchBookedDates = async () => {
      try {
        const bookingsRef = collection(db, "bookings");
        const bookingsSnap = await getDocs(bookingsRef);
        const bookingsByVenue = {};

        bookingsSnap.forEach((doc) => {
          const booking = doc.data();
          if (booking.venueId) {
            if (!bookingsByVenue[booking.venueId]) {
              bookingsByVenue[booking.venueId] = [];
            }

            // Safe date conversion
            const processedBooking = {
              ...booking,
              startDate:
                booking.startDate?.toDate?.() || new Date(booking.startDate),
              // Handle optional endDate for single-day bookings
              endDate: booking.endDate
                ? booking.endDate?.toDate?.() || new Date(booking.endDate)
                : booking.startDate?.toDate?.() || new Date(booking.startDate),
            };

            // Only add if we have valid dates
            if (processedBooking.startDate) {
              bookingsByVenue[booking.venueId].push(processedBooking);
            }
          }
        });

        setVenueBookings(bookingsByVenue);
      } catch (error) {
        console.error("Error fetching booked dates:", error);
      }
    };

    fetchBookedDates();
  }, []);

  const handleBookingSubmit = async (e) => {
    e.preventDefault();
    setIsSubmitting(true);

    try {
      const bookingData = {
        userId: user.uid,
        userEmail: user.email,
        userName: userProfile?.fullName,
        bookingType: bookingForm.bookingType,
        startDate: bookingForm.startDate,
        endDate:
          bookingForm.bookingType === "multiple"
            ? bookingForm.endDate
            : bookingForm.startDate,
        venueId: bookingForm.venueId,
        photographyPackage: bookingForm.photographyPackage,
        menuItems: bookingForm.menuItems,
        balloons: bookingForm.balloons,
        status: "pending",
        createdAt: serverTimestamp(),
        totalAmount: calculateTotalAmount(), // You'll need to implement this
      };

      const bookingsRef = collection(db, "bookings");
      await addDoc(bookingsRef, bookingData);

      // Reset form and close dialog
      setBookingForm({
        bookingType: "single",
        startDate: null,
        endDate: null,
        venueId: "",
        photography: false,
        menuItems: [],
        balloons: false,
      });
      setShowBookingDialog(false);

      // Add success notification here
      alert("Booking submitted successfully!");
    } catch (error) {
      console.error("Error submitting booking:", error);
      alert("Error submitting booking. Please try again.");
    } finally {
      setIsSubmitting(false);
    }
  };

  useEffect(() => {
    const fetchVenues = async () => {
      try {
        const venuesCollection = collection(db, "venues");
        const venuesSnapshot = await getDocs(venuesCollection);
        const venuesData = venuesSnapshot.docs.map((doc) => ({
          id: doc.id,
          ...doc.data(),
        }));
        setVenues(venuesData);
      } catch (error) {
        console.error("Error fetching venues:", error);
      }
    };
    const fetchMenu = async () => {
      try {
        const menuCollection = collection(db, "menu");
        const menuSnapshot = await getDocs(menuCollection);
        const menuData = menuSnapshot.docs.map((doc) => ({
          id: doc.id,
          ...doc.data(),
        }));
        setMenu(menuData);
      } catch (error) {
        console.error("Error fetching venues:", error);
      }
    };

    fetchMenu();
    fetchVenues();
  }, []);

  useEffect(() => {
    const fetchBookedDates = async () => {
      try {
        const bookingsRef = collection(db, "bookings");
        const bookingsSnap = await getDocs(bookingsRef);
        const bookingsByVenue = {};

        bookingsSnap.forEach((doc) => {
          const booking = doc.data();
          if (booking.venueId) {
            if (!bookingsByVenue[booking.venueId]) {
              bookingsByVenue[booking.venueId] = [];
            }
            bookingsByVenue[booking.venueId].push(booking);
          }
        });

        setVenueBookings(bookingsByVenue);
      } catch (error) {
        console.error("Error fetching booked dates:", error);
      }
    };
    fetchBookedDates();
  }, []);

  useEffect(() => {
    const unsubscribe = auth.onAuthStateChanged(async (user) => {
      setUser(user);

      if (user) {
        try {
          const userDoc = await getDoc(doc(db, "users", user.uid));
          if (userDoc.exists()) {
            setUserProfile(userDoc.data());
          }
        } catch (error) {
          console.error("Error fetching user data:", error);
        }
      } else {
        setUserProfile(null);
      }
    });

    return () => unsubscribe();
  }, []);

  useEffect(() => {
    const fetchBookedDates = async () => {
      if (user) {
        const bookingsRef = collection(db, "bookings");
        const bookingsSnap = await getDocs(bookingsRef);
        const dates = [];
        bookingsSnap.forEach((doc) => {
          dates.push(new Date(doc.data().date));
        });
        setBookedDates(dates);
      }
    };
    fetchBookedDates();
  }, [user]);

  const getNextHoliday = () => {
    const today = new Date();
    return holidays
      .filter((holiday) => holiday.date > today)
      .sort((a, b) => a.date - b.date)[0];
  };

  // Add this useEffect to handle venue selection changes
  useEffect(() => {
    if (bookingForm.venueId && bookingForm.startDate) {
      // Check if currently selected date is valid for new venue
      if (isDateBookedForVenue(bookingForm.startDate, bookingForm.venueId)) {
        setBookingForm((prev) => ({
          ...prev,
          startDate: null,
          endDate: null,
        }));
      }
    }
  }, [bookingForm.venueId]);

  const getDateDisableReason = (date) => {
    if (isBefore(date, getMinBookingDate())) {
      return "Must book at least 3 days in advance";
    }

    const holiday = holidays.find((h) => isSameDay(h.date, date));
    if (holiday) {
      return `Holiday: ${holiday.name}`;
    }

    if (
      bookingForm.venueId &&
      isDateBookedForVenue(date, bookingForm.venueId)
    ) {
      return "Venue already booked for this date";
    }

    return "";
  };

  // Create a custom footer component
  const CustomFooter = ({ date }) => {
    const reason = date ? getDateDisableReason(date) : "";
    const isDisabled = Boolean(reason);

    return (
      <div className="mt-3 p-2 text-sm">
        <div className="flex flex-col gap-2">
          <div className="flex items-center gap-2">
            <div className="w-3 h-3 rounded-full bg-gray-200"></div>
            <span>Available Dates</span>
          </div>
          <div className="flex items-center gap-2">
            <div className="w-3 h-3 rounded-full bg-red-100"></div>
            <span>Booked Dates</span>
          </div>
          <div className="flex items-center gap-2">
            <div className="w-3 h-3 rounded-full bg-yellow-100"></div>
            <span>Holidays</span>
          </div>
          <div className="flex items-center gap-2">
            <div className="w-3 h-3 rounded-full bg-gray-100"></div>
            <span>Too Soon (3-day minimum)</span>
          </div>
        </div>
        {isDisabled && (
          <div className="mt-2 text-red-500">Selected date: {reason}</div>
        )}
      </div>
    );
  };

  const BookingDialog = () => (
    <Dialog open={showBookingDialog} onOpenChange={setShowBookingDialog}>
      <DialogTrigger asChild>
        <MotionButton
          whileHover={{ scale: 1.02 }}
          whileTap={{ scale: 0.98 }}
          className="bg-gradient-to-r from-[#fdb040] to-[#fd9040] text-white px-8 py-4 rounded-xl font-semibold shadow-lg hover:shadow-xl transition-all duration-300"
        >
          <span className="flex items-center gap-2">
            <CalendarPlus className="w-5 h-5" />
            Book New Event
          </span>
        </MotionButton>
      </DialogTrigger>

      <DialogContent className="sm:max-w-[800px] bg-white/95 backdrop-blur-sm border-0 shadow-2xl max-h-[90vh] overflow-y-auto">
        <DialogHeader className="space-y-3 pb-6">
          <DialogTitle className="text-3xl font-bold bg-gradient-to-r from-[#fdb040] to-[#fd9040] bg-clip-text text-transparent">
            Create Your Perfect Event
          </DialogTitle>
          <p className="text-gray-600">
            Fill in the details for your special occasion
          </p>
        </DialogHeader>

        <form className="space-y-6">
          {/* Modern Venue Selector - Moved to top */}
          <div className="space-y-3">
            <Label className="text-lg font-semibold text-gray-800">
              Select Venue
            </Label>
            <select
              className="w-full p-4 rounded-xl border-2 border-gray-200 hover:border-[#fdb040]/50 focus:border-[#fdb040] outline-none transition-all"
              onChange={(e) =>
                setBookingForm((prev) => ({ ...prev, venueId: e.target.value }))
              }
              value={bookingForm.venueId}
            >
              <option value="">Choose a venue...</option>
              {venues.map((venue) => (
                <option key={venue.id} value={venue.id}>
                  {venue.name} - ₱{venue.price}
                </option>
              ))}
            </select>
          </div>

          {bookingForm.venueId && (
            <>
              <div className="space-y-3">
                <Label className="text-lg font-semibold text-gray-800">
                  Event Duration
                </Label>
                <RadioGroup
                  defaultValue="single"
                  onValueChange={(value) =>
                    setBookingForm((prev) => ({ ...prev, bookingType: value }))
                  }
                  className="flex gap-4"
                >
                  {[
                    { value: "single", label: "Single Day", icon: Calendar },
                    {
                      value: "multiple",
                      label: "Multiple Days",
                      icon: CalendarRange,
                    },
                  ].map(({ value, label, icon: Icon }) => (
                    <Label
                      key={value}
                      className={`flex-1 flex items-center gap-3 p-4 rounded-xl border-2 transition-all cursor-pointer
                  ${
                    bookingForm.bookingType === value
                      ? "border-[#fdb040] bg-[#fdb040]/5"
                      : "border-gray-200 hover:border-[#fdb040]/50"
                  }`}
                    >
                      <RadioGroupItem value={value} className="sr-only" />
                      <Icon
                        className={`w-5 h-5 ${
                          bookingForm.bookingType === value
                            ? "text-[#fdb040]"
                            : "text-gray-500"
                        }`}
                      />
                      <span
                        className={
                          bookingForm.bookingType === value ? "font-medium" : ""
                        }
                      >
                        {label}
                      </span>
                    </Label>
                  ))}
                </RadioGroup>
              </div>

              {/* Date Selection - Enhanced Calendar */}
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <div className="space-y-3">
                  <Label className="text-lg font-semibold text-gray-800">
                    Start Date
                  </Label>
                  <div className="p-4 rounded-xl border-2 border-gray-200 hover:border-[#fdb040]/50 transition-all">
                    <DayPicker
                      mode="single"
                      selected={bookingForm.startDate}
                      onSelect={(date) =>
                        setBookingForm((prev) => ({ ...prev, startDate: date }))
                      }
                      disabled={[
                        ...holidays.map((h) => h.date),
                        { before: getMinBookingDate() },
                        (date) =>
                          bookingForm.venueId &&
                          isDateBookedForVenue(date, bookingForm.venueId),
                      ]}
                      modifiers={{
                        booked: (date) =>
                          bookingForm.venueId &&
                          isDateBookedForVenue(date, bookingForm.venueId),
                        holiday: holidays.map((h) => h.date),
                        tooSoon: { before: getMinBookingDate() },
                      }}
                      modifiersStyles={{
                        booked: {
                          backgroundColor: "#FEE2E2",
                          color: "#991B1B",
                          fontWeight: "bold",
                        },
                        holiday: { backgroundColor: "rgb(254 243 199)" },
                        tooSoon: { backgroundColor: "rgb(243 244 246)" },
                      }}
                      footer={<CustomFooter date={bookingForm.startDate} />}
                      className="!font-sans"
                      classNames={{
                        day_selected: "bg-[#fdb040] text-white",
                        day_today: "text-[#fd9040] font-bold",
                        day_disabled: "opacity-50 cursor-not-allowed",
                      }}
                    />
                  </div>
                </div>
                {/* End Date Calendar (shown conditionally) */}
                {bookingForm.bookingType === "multiple" && (
                  <div className="space-y-3">
                    <Label className="text-lg font-semibold text-gray-800">
                      End Date
                    </Label>
                    <div className="p-4 rounded-xl border-2 border-gray-200 hover:border-[#fdb040]/50 transition-all">
                      <DayPicker
                        mode="single"
                        selected={bookingForm.endDate}
                        onSelect={(date) =>
                          setBookingForm((prev) => ({ ...prev, endDate: date }))
                        }
                        disabled={[
                          ...holidays.map((h) => h.date),
                          {
                            before:
                              bookingForm.startDate || getMinBookingDate(),
                          },
                          (date) =>
                            bookingForm.venueId &&
                            isDateBookedForVenue(date, bookingForm.venueId),
                        ]}
                        modifiers={{
                          booked: (date) =>
                            bookingForm.venueId &&
                            isDateBookedForVenue(date, bookingForm.venueId),
                          holiday: holidays.map((h) => h.date),
                          tooSoon: { before: getMinBookingDate() },
                        }}
                        modifiersStyles={{
                          booked: {
                            backgroundColor: "#FEE2E2",
                            color: "#991B1B",
                            fontWeight: "bold",
                          },
                          holiday: { backgroundColor: "rgb(254 243 199)" },
                          tooSoon: { backgroundColor: "rgb(243 244 246)" },
                        }}
                        footer={<CustomFooter date={bookingForm.endDate} />}
                        className="!font-sans"
                        classNames={{
                          day_selected: "bg-[#fdb040] text-white",
                          day_today: "text-[#fd9040] font-bold",
                          day_disabled: "opacity-50 cursor-not-allowed",
                        }}
                      />
                    </div>
                  </div>
                )}
              </div>

              <div className="space-y-3">
                <Label className="text-lg font-semibold text-gray-800">
                  Studio Portraits Photography (Optional)
                </Label>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  {[
                    { id: "pkg1", name: "Package 1", price: "₱45,000" },
                    { id: "pkg2", name: "Package 2", price: "₱55,000" },
                    { id: "pkg3", name: "Package 3", price: "₱65,000" },
                    { id: "pkg4", name: "Package 4", price: "₱75,000" },
                  ].map((pkg) => (
                    <div
                      key={pkg.id}
                      className={`p-4 rounded-xl border-2 transition-all cursor-pointer
          ${
            bookingForm.photographyPackage === pkg.id
              ? "border-[#fdb040] bg-[#fdb040]/5"
              : "border-gray-200 hover:border-[#fdb040]/50"
          }`}
                      onClick={() =>
                        setBookingForm((prev) => ({
                          ...prev,
                          photographyPackage:
                            prev.photographyPackage === pkg.id ? null : pkg.id,
                        }))
                      }
                    >
                      <div className="flex items-center justify-between">
                        <div>
                          <h4 className="font-medium">{pkg.name}</h4>
                          <p className="text-sm text-gray-600">
                            Studio Portraits
                          </p>
                        </div>
                        <span className="font-semibold text-[#fd9040]">
                          {pkg.price}
                        </span>
                      </div>
                    </div>
                  ))}
                </div>
              </div>

              {/* Menu Selection with Search */}
              <div className="space-y-3">
                <Label className="text-lg font-semibold text-gray-800">
                  Menu Selection
                </Label>
                <div className="max-h-[300px] overflow-y-auto rounded-xl border-2 border-gray-200">
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-3 p-4">
                    {menu.map((item) => (
                      <div
                        key={item.id}
                        className={`flex items-center gap-3 p-4 rounded-lg transition-all
      ${
        bookingForm.menuItems.includes(item.id)
          ? "border-[#fdb040] bg-[#fdb040]/5"
          : "hover:bg-gray-50"
      }`}
                      >
                        <Checkbox
                          id={item.id}
                          checked={bookingForm.menuItems.includes(item.id)}
                          onCheckedChange={(checked) => {
                            setBookingForm((prev) => ({
                              ...prev,
                              menuItems: checked
                                ? [...prev.menuItems, item.id]
                                : prev.menuItems.filter((id) => id !== item.id),
                            }));
                          }}
                          className="border-2 border-gray-200 text-[#fdb040] data-[state=checked]:bg-transparent data-[state=checked]:border-[#fdb040] data-[state=checked]:text-[#fdb040]"
                        />
                        <Label
                          htmlFor={item.id}
                          className="flex justify-between w-full cursor-pointer"
                        >
                          <span>{item.name}</span>
                          <span className="font-medium text-[#fd9040]">
                            ₱{item.price}
                          </span>
                        </Label>
                      </div>
                    ))}
                  </div>
                </div>
              </div>

              <div className="space-y-3">
                <Label className="text-lg font-semibold text-gray-800">
                  Balloon Decoration (Optional)
                </Label>
                <div className="p-4 rounded-xl border-2 border-gray-200 hover:border-[#fdb040]/50 transition-all">
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-3">
                      <Checkbox
                        id="balloons"
                        checked={bookingForm.balloons}
                        onCheckedChange={(checked) =>
                          setBookingForm((prev) => ({
                            ...prev,
                            balloons: checked,
                          }))
                        }
                        className="border-2 border-gray-200 text-[#fdb040] data-[state=checked]:bg-transparent data-[state=checked]:border-[#fdb040] data-[state=checked]:text-[#fdb040]"
                      />
                      <div>
                        <Label htmlFor="balloons" className="font-medium">
                          20-foot Balloon Garland
                        </Label>
                        <p className="text-sm text-gray-600">
                          Approximately 200 balloons
                        </p>
                      </div>
                    </div>
                    <span className="font-semibold text-[#fd9040]">
                      ₱15,000
                    </span>
                  </div>
                </div>
              </div>

              <Button
                type="submit"
                className="w-full bg-gradient-to-r from-[#fdb040] to-[#fd9040] text-white py-6 rounded-xl font-semibold text-lg shadow-lg hover:shadow-xl transition-all duration-300"
                onClick={handleBookingSubmit}
                disabled={isSubmitting}
              >
                {isSubmitting ? "Submitting..." : "Confirm Booking"}
              </Button>
            </>
          )}
        </form>
      </DialogContent>
    </Dialog>
  );

  return (
    <div className="max-w-[1920px] mx-auto">
      <Navbar />

      {/* Welcome Dashboard */}
      <section className="bg-gradient-to-r from-[#fdb040]/10 to-white py-10">
        <div className="container mx-auto px-6 lg:px-20">
          <MotionDiv
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            className="flex justify-between items-center"
          >
            <div>
              <h1 className="text-3xl font-bold">
                Welcome Back, {userProfile?.fullName || "Guest"}
              </h1>
              <p className="text-gray-600">Manage your upcoming celebrations</p>
            </div>
            {BookingDialog()}
          </MotionDiv>
        </div>
      </section>

      {/* Quick Actions Grid */}
      <section className="py-8">
        <div className="container mx-auto px-6 lg:px-20 grid grid-cols-1 md:grid-cols-3 gap-6">
          {/* Upcoming Events */}
          <MotionDiv className="p-6 bg-white rounded-xl shadow-sm border-2 border-[#fdb040]/20">
            <h3 className="text-xl font-semibold mb-4">Upcoming Holiday</h3>
            {holidays.length > 0 && getNextHoliday() ? (
              <div className="space-y-3">
                <div className="flex items-center space-x-2">
                  <svg
                    xmlns="http://www.w3.org/2000/svg"
                    className="h-5 w-5 text-[#fdb040]"
                    fill="none"
                    viewBox="0 0 24 24"
                    stroke="currentColor"
                  >
                    <path
                      strokeLinecap="round"
                      strokeLinejoin="round"
                      strokeWidth={2}
                      d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z"
                    />
                  </svg>
                  <span className="font-medium">{getNextHoliday().name}</span>
                </div>
                <p className="text-gray-600">
                  {format(getNextHoliday().date, "MMMM dd, yyyy")}
                </p>
                <div className="text-sm text-gray-500">
                  {Math.ceil(
                    (getNextHoliday().date - new Date()) / (1000 * 60 * 60 * 24)
                  )}{" "}
                  days away
                </div>
              </div>
            ) : (
              <p className="text-gray-500">Loading holidays...</p>
            )}
          </MotionDiv>
          <MotionDiv className="p-6 bg-white rounded-xl shadow-sm border-2 border-[#fdb040]/20">
            <h3 className="text-xl font-semibold mb-4">
              Event Planning Progress
            </h3>
            {activeBookings.length > 0 ? (
              <div className="space-y-6">
                {activeBookings.map((booking) => (
                  <div key={booking.id} className="space-y-2">
                    <div className="flex justify-between items-start">
                      <div>
                        <p className="font-medium">
                          {booking.startDate
                            ? format(booking.startDate, "MMM dd, yyyy")
                            : "Date not set"}
                        </p>
                        <p className="text-sm text-gray-600">
                          {booking.venueId &&
                            venues.find((v) => v.id === booking.venueId)?.name}
                        </p>
                        <p className="mt-2 text-sm">
                          {booking.status === "ongoing" ? (
                            <Button
                              onClick={() => setShowPaymentDialog(booking)}
                              className="bg-green-500 hover:bg-green-600 text-white"
                            >
                              Complete Payment
                            </Button>
                          ) : booking.status === "approved" ? (
                            <span className="text-yellow-600">
                              Waiting for Owner to Accept the Booking
                            </span>
                          ) : booking.status === "paid" ? (
                            <span className="text-yellow-600">
                              Great! Wait for the owner to ready your villa
                            </span>
                          ) : booking.status === "ready" ? (
                            <span className="text-yellow-600">
                              Great! Your villa is already prepared the owner
                              waiting for you. Have a safe trip!
                            </span>
                          ) : booking.status === "finished" ? (
                            <span className="text-yellow-600">
                              Great! Thanks for coming!
                            </span>
                          ) : (
                            <span className="text-blue-600">
                              Booking is being processed
                            </span>
                          )}
                        </p>
                      </div>
                      <span
                        className={`px-3 py-1 rounded-full text-sm ${
                          booking.status === "pending"
                            ? "bg-yellow-100 text-yellow-800"
                            : booking.status === "approved"
                            ? "bg-green-100 text-green-800"
                            : "bg-blue-100 text-blue-800"
                        }`}
                      >
                        {booking.status.charAt(0).toUpperCase() +
                          booking.status.slice(1)}
                      </span>
                    </div>
                  </div>
                ))}
              </div>
            ) : (
              <p className="text-gray-500">No active events</p>
            )}
          </MotionDiv>

          {/* Recent Bookings */}
          <MotionDiv className="p-6 bg-white rounded-xl shadow-sm border-2 border-[#fdb040]/20">
            <h3 className="text-xl font-semibold mb-4">Recent Bookings</h3>
            {completedBookings.length > 0 ? (
              <div className="space-y-4">
                {completedBookings.map((booking) => (
                  <div
                    key={booking.id}
                    className="p-4 bg-gray-50 rounded-lg space-y-3"
                  >
                    <div className="flex justify-between items-start">
                      <div>
                        <p className="font-medium">
                          {format(new Date(booking.startDate), "MMM dd, yyyy")}
                        </p>
                        <p className="text-sm text-gray-600">
                          {booking.venueId &&
                            venues.find((v) => v.id === booking.venueId)?.name}
                        </p>
                        <div className="mt-2 space-y-1 text-sm text-gray-600">
                          <p>
                            Total Amount: ₱
                            {booking.totalAmount?.toLocaleString()}
                          </p>
                          {booking.photographyPackage && (
                            <p>
                              Photography Package: Package{" "}
                              {booking.photographyPackage.slice(-1)}
                            </p>
                          )}
                          {booking.balloons && (
                            <p>Balloon Decoration: Included</p>
                          )}
                          {booking.menuItems?.length > 0 && (
                            <p>
                              Menu Items: {booking.menuItems.length} selected
                            </p>
                          )}
                        </div>
                      </div>
                      {booking.rating ? (
                        <div className="text-yellow-400 text-lg">
                          {"★".repeat(booking.rating)}
                          <span className="text-gray-300">
                            {"★".repeat(5 - booking.rating)}
                          </span>
                        </div>
                      ) : (
                        <Button
                          onClick={() => setShowRatingDialog(booking)}
                          className="text-sm bg-[#fdb040] hover:bg-[#fd9040]"
                        >
                          Rate Experience
                        </Button>
                      )}
                    </div>
                    {booking.rating && booking.comment && (
                      <p className="text-sm italic text-gray-600 mt-2">
                        "{booking.comment}"
                      </p>
                    )}
                  </div>
                ))}
              </div>
            ) : (
              <p className="text-gray-500">No completed bookings</p>
            )}
          </MotionDiv>
        </div>
      </section>

      {showPaymentDialog && (
        <PaymentDialog
          booking={showPaymentDialog}
          venues={venues}
          onClose={() => setShowPaymentDialog(null)}
          onPaymentComplete={() => {
            setShowPaymentDialog(null);
            // Optionally show success message
            alert("Payment completed successfully!");
          }}
        />
      )}

      {showRatingDialog && (
        <RatingDialog
          booking={showRatingDialog}
          onClose={() => setShowRatingDialog(null)}
          onSubmit={handleRatingSubmit}
        />
      )}
    </div>
  );
}
