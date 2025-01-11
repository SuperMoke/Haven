"use client";
import Image from "next/image";
import { AnimatedSection } from "./components/AnimatedSection";
import Navbar from "./components/Navbar";
import Footer from "./components/Footer";
import { MotionDiv, MotionButton } from "./components/MotionComponents";
import Link from "next/link";
import { useState, useEffect } from "react";
import { collection, getDocs } from "firebase/firestore";
import { db } from "../../firebase";

export default function Home() {
  const services = [
    {
      id: "01",
      title: "Christening",
      description:
        "Make your child's baptism a memorable celebration with our carefully curated christening packages, designed to create sacred and joyful moments for the whole family.",
    },
    {
      id: "02",
      title: "Birthdays",
      description:
        "From intimate gatherings to grand celebrations, we offer customized birthday experiences that cater to all ages, making every birthday truly special and memorable.",
    },
    {
      id: "03",
      title: "Weddings",
      description:
        "Turn your dream wedding into reality with our comprehensive wedding planning services, ensuring every detail is perfect for your most important day.",
    },
  ];

  const testimonials = [
    {
      name: "Syra Anne Baquiran",
      event: "Kids Birthday Party",
      comment:
        "Haven made my daughter's 7th birthday absolutely magical! The attention to detail was incredible.",
      rating: 5,
    },
    {
      name: "Jerome Carl Rome",
      event: "Surprise 30th Birthday",
      comment:
        "The team went above and beyond to keep everything secret. The look on my wife's face was priceless!",
      rating: 5,
    },
    {
      name: "Francis Renjade Vinuya",
      event: "Sweet 16 Celebration",
      comment:
        "Everything was perfect - from the venue decoration to the photography. A day we'll never forget!",
      rating: 5,
    },
    {
      name: "Russel Somido",
      event: "40th Birthday Bash",
      comment:
        "Professional service, amazing food, and the photography package captured every moment perfectly.",
      rating: 5,
    },
  ];

  const [menuItems, setMenuItems] = useState([]);
  const [venues, setVenues] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    let mounted = true;

    const fetchData = async () => {
      try {
        const menuSnapshot = await getDocs(collection(db, "menu"));
        const venuesSnapshot = await getDocs(collection(db, "venues"));

        if (mounted) {
          setMenuItems(
            menuSnapshot.docs.map((doc) => ({ id: doc.id, ...doc.data() }))
          );
          setVenues(
            venuesSnapshot.docs.map((doc) => ({ id: doc.id, ...doc.data() }))
          );
          setLoading(false);
        }
      } catch (error) {
        console.error("Error fetching data:", error);
        if (mounted) setLoading(false);
      }
    };

    fetchData();

    return () => {
      mounted = false;
    };
  }, []);

  useEffect(() => {
    const fetchData = async () => {
      try {
        const menuSnapshot = await getDocs(collection(db, "menu"));
        const venuesSnapshot = await getDocs(collection(db, "venues"));

        setMenuItems(
          menuSnapshot.docs.map((doc) => ({ id: doc.id, ...doc.data() }))
        );
        setVenues(
          venuesSnapshot.docs.map((doc) => ({ id: doc.id, ...doc.data() }))
        );
      } catch (error) {
        console.error("Error fetching data:", error);
      } finally {
        setLoading(false);
      }
    };

    fetchData();
  }, []);

  return (
    <div className="max-w-[1920px] mx-auto">
      <Navbar />

      {/* Hero Section */}
      <AnimatedSection className="hero-gradient h-screen w-full flex items-center justify-center">
        <div className="container mx-auto px-6 lg:px-20">
          <MotionDiv
            initial={{ y: 30, opacity: 0 }}
            animate={{ y: 0, opacity: 1 }}
            transition={{ delay: 0.2, duration: 0.8 }}
            className="max-w-3xl mx-auto text-center"
          >
            <h1 className="text-5xl md:text-6xl font-bold mb-6">
              Welcome to HAVEN
            </h1>
            <p className="text-xl mb-8">
              Your special event deserves the best! Secure your reservation and
              let the festivities begin.
            </p>

            <MotionButton
              whileHover={{ scale: 1.05 }}
              whileTap={{ scale: 0.95 }}
              className="bg-white text-[#fdb040] px-8 py-3 rounded-full font-semibold"
            >
              <Link href="/auth/login">Plan Your Event</Link>
            </MotionButton>
          </MotionDiv>
        </div>
      </AnimatedSection>

      {/* Services Section */}
      <AnimatedSection
        className="min-h-screen py-20 bg-white flex items-center"
        id="services"
      >
        <div className="container mx-auto px-6 lg:px-20">
          <h2 className="text-3xl font-bold text-center mb-12">Our Services</h2>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
            {services.map((service, index) => (
              <MotionDiv
                key={service.id}
                initial={{ opacity: 0, y: 20 }}
                whileInView={{ opacity: 1, y: 0 }}
                transition={{ delay: index * 0.1 }}
                whileHover={{ y: -10 }}
                className="p-8 rounded-2xl bg-white shadow-sm hover:shadow-xl transition-all duration-300 group hover:bg-[#fdb040] hover:text-white border-2 border-[#fdb040] hover:border-white"
              >
                <span className="text-4xl font-bold text-[#fdb040] group-hover:text-white transition-colors">
                  {service.id}
                </span>
                <h3 className="text-xl font-semibold mt-4 mb-4">
                  {service.title}
                </h3>
                <p className="text-gray-600 group-hover:text-white/90 leading-relaxed">
                  {service.description}
                </p>
              </MotionDiv>
            ))}
          </div>
        </div>
      </AnimatedSection>

      {/* Menu Preview */}
      <AnimatedSection
        className="min-h-screen py-20 bg-gray-50 flex items-center"
        id="menu"
      >
        <div className="container mx-auto px-6 lg:px-20">
          <h2 className="text-3xl font-bold text-center mb-12">
            Curated Menus
          </h2>
          {loading ? (
            <div className="text-center">Loading...</div>
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
              {menuItems.map((item, index) => (
                <MotionDiv
                  key={item.id}
                  initial={{ opacity: 0, y: 20 }}
                  whileInView={{ opacity: 1, y: 0 }}
                  transition={{ delay: index * 0.1 }}
                  whileHover={{ y: -10 }}
                  className="bg-white rounded-xl overflow-hidden shadow-lg"
                >
                  <div className="h-48 relative">
                    <Image
                      src={item.image}
                      alt={item.name}
                      fill
                      className="object-cover"
                    />
                  </div>
                  <div className="p-6">
                    <h3 className="text-xl font-semibold mb-2">{item.name}</h3>
                    <p className="text-gray-600 mb-4">{item.description}</p>
                    <p className="text-[#fdb040] font-bold">₱{item.price}</p>
                  </div>
                </MotionDiv>
              ))}
            </div>
          )}
        </div>
      </AnimatedSection>

      {/* Venue Showcase */}
      <AnimatedSection
        className="min-h-screen py-20 flex items-center"
        id="venues"
      >
        <div className="container mx-auto px-6 lg:px-20">
          <h2 className="text-3xl font-bold text-center mb-12">
            Stunning Venues
          </h2>
          {loading ? (
            <div className="text-center">Loading...</div>
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-1 lg:grid-cols-1 gap-8">
              {venues.map((venue, index) => (
                <MotionDiv
                  key={venue.id}
                  initial={{ opacity: 0, y: 20 }}
                  whileInView={{ opacity: 1, y: 0 }}
                  transition={{ delay: index * 0.1 }}
                  whileHover={{ scale: 1.02 }}
                  className="bg-white rounded-xl overflow-hidden shadow-lg border border-[#fdb040]/20"
                >
                  <div className="grid md:grid-cols-2 gap-4">
                    {/* Left Column - Venue Details */}
                    <div className="p-6">
                      <div className="h-64 relative mb-4">
                        <Image
                          src={venue.images[0]}
                          alt={venue.name}
                          fill
                          className="object-cover rounded-lg"
                        />
                      </div>
                      <h3 className="text-xl font-semibold mb-2">
                        {venue.name}
                      </h3>
                      <p className="text-gray-600 mb-4">{venue.description}</p>
                      <div className="space-y-2">
                        <p className="text-sm">
                          <strong>Events:</strong> {venue.events.join(", ")}
                        </p>
                        <p className="text-sm">
                          <strong>Amenities:</strong>{" "}
                          {venue.amenities.join(", ")}
                        </p>
                        <p className="text-[#fdb040] font-bold mt-4">
                          ₱{venue.price}/Event
                        </p>
                      </div>
                    </div>

                    {/* Right Column - Map */}
                    <div className="h-full min-h-[400px] relative">
                      <iframe
                        src={venue.mapsUrl}
                        className="w-full h-full absolute inset-0"
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
          )}
        </div>
      </AnimatedSection>

      {/* Packages */}
      <AnimatedSection
        className="min-h-screen py-20 bg-gray-50 flex items-center"
        id="packages"
      >
        <div className="container mx-auto px-6 lg:px-20">
          <h2 className="text-3xl font-bold text-center mb-12">
            Photography Packages
          </h2>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-8">
            {[
              {
                name: "Package 1",
                price: "₱45,000",
                features: [
                  "One Photographer",
                  "Unlimited Shots",
                  "Pre-nup Pictorial",
                  "10 Pages 10x8 Book Form Guestbook Album",
                  "40 Pages 10x8 Magnetic Storybook Album",
                  "12x18 Portrait with Frame",
                  "One Videographer",
                  "Raw Videos",
                  "16GB USB Storage",
                ],
              },
              {
                name: "Package 2",
                price: "₱55,000",
                features: [
                  "Two Photographers",
                  "Unlimited Shots",
                  "Pre-nup Pictorial",
                  "10 Pages 10x8 Book Form Guestbook Album",
                  "40 Pages 10x8 Magnetic Storybook Album",
                  "12x18 Portrait with Frame",
                  "One Videographer",
                  "Raw Videos",
                  "16GB USB Storage",
                ],
              },
              {
                name: "Package 3",
                price: "₱65,000",
                features: [
                  "One Photographer",
                  "Unlimited Shots",
                  "Pre-nup Pictorial",
                  "20 Pages 10x8 Book Form Guestbook Album",
                  "40 Pages 10x8 Magnetic Storybook Album",
                  "16x20 Portrait with Frame",
                  "Two Videographers",
                  "Raw Videos",
                  "Pre-nup Photo Slideshow",
                  "Save the Date",
                  "16GB USB Storage",
                ],
              },
              {
                name: "Package 4",
                price: "₱75,000",
                features: [
                  "Three Photographers",
                  "Unlimited Shots",
                  "Pre-nup Pictorial",
                  "20 Pages 10x8 Book Form Guestbook Album",
                  "40 Pages 12x8 Magnetic Storybook Album",
                  "16x20 Portrait with Frame",
                  "Pre-nup Photo Slideshow",
                  "50 PCS 4R Printouts",
                  "Three Videographers",
                  "Pre-wedding Video with Aerial Video",
                  "Same Day Edit Video with Aerial Video",
                  "Raw Videos",
                  "16GB USB Storage",
                  "Forever and Always Photo",
                ],
              },
            ].map((pkg, index) => (
              <MotionDiv
                key={pkg.name}
                initial={{ opacity: 0, y: 20 }}
                whileInView={{ opacity: 1, y: 0 }}
                transition={{ delay: index * 0.1 }}
                whileHover={{ scale: 1.03 }}
                className="bg-white p-8 rounded-lg shadow-md"
              >
                <h3 className="text-2xl font-semibold mb-4">{pkg.name}</h3>
                <p className="text-[#fdb040] text-2xl font-bold mb-4">
                  {pkg.price}
                </p>
                <ul className="space-y-2">
                  {pkg.features.map((feature, i) => (
                    <li key={i} className="flex items-start">
                      <span className="text-[#fdb040] mr-2">✓</span>
                      <span className="text-sm">{feature}</span>
                    </li>
                  ))}
                </ul>
              </MotionDiv>
            ))}
          </div>
        </div>
      </AnimatedSection>

      {/* Testimonials */}
      <section
        className="min-h-screen py-20 flex items-center bg-[#fdb040]"
        id="testimonials"
      >
        <div className="container mx-auto px-6 lg:px-20">
          <h2 className="text-3xl font-bold text-center mb-12 text-white">
            What Our Clients Say
          </h2>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-8">
            {testimonials.map((testimonial, index) => (
              <MotionDiv
                key={testimonial.name}
                initial={{ opacity: 0, y: 20 }}
                whileInView={{ opacity: 1, y: 0 }}
                transition={{ delay: index * 0.1 }}
                className="bg-white p-6 rounded-xl shadow-lg"
              >
                <div className="flex items-center mb-4">
                  <div>
                    <h3 className="font-semibold">{testimonial.name}</h3>
                    <p className="text-sm text-gray-600">{testimonial.event}</p>
                  </div>
                </div>
                <div className="flex mb-2">
                  {[...Array(testimonial.rating)].map((_, i) => (
                    <svg
                      key={i}
                      className="w-5 h-5 text-yellow-400"
                      fill="currentColor"
                      viewBox="0 0 20 20"
                    >
                      <path d="M9.049 2.927c.3-.921 1.603-.921 1.902 0l1.07 3.292a1 1 0 00.95.69h3.462c.969 0 1.371 1.24.588 1.81l-2.8 2.034a1 1 0 00-.364 1.118l1.07 3.292c.3.921-.755 1.688-1.54 1.118l-2.8-2.034a1 1 0 00-1.175 0l-2.8 2.034c-.784.57-1.838-.197-1.539-1.118l1.07-3.292a1 1 0 00-.364-1.118L2.98 8.72c-.783-.57-.38-1.81.588-1.81h3.461a1 1 0 00.951-.69l1.07-3.292z" />
                    </svg>
                  ))}
                </div>
                <p className="text-gray-700">{testimonial.comment}</p>
              </MotionDiv>
            ))}
          </div>
        </div>
      </section>

      <Footer />
    </div>
  );
}
