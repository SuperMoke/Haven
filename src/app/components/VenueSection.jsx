import { useState, useEffect } from "react";
import { collection, getDocs } from "firebase/firestore";
import { db } from "../../../firebase";
import Image from "next/image";
import { MotionDiv } from "./MotionComponents";
import { AnimatedSection } from "./AnimatedSection";

export default function VenueSection() {
  const [venues, setVenues] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchData = async () => {
      try {
        const venuesSnapshot = await getDocs(collection(db, "venues"));
        setVenues(
          venuesSnapshot.docs.map((doc) => ({ id: doc.id, ...doc.data() }))
        );
      } catch (error) {
        console.error("Error fetching venues:", error);
      } finally {
        setLoading(false);
      }
    };

    fetchData();
  }, []);

  return (
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
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
            {venues.map((venue, index) => (
              <MotionDiv
                key={venue.id}
                initial={{ opacity: 0, y: 20 }}
                whileInView={{ opacity: 1, y: 0 }}
                transition={{ delay: index * 0.1 }}
                whileHover={{ scale: 1.03 }}
                className="bg-white rounded-xl overflow-hidden shadow-lg border border-[#fdb040]/20"
              >
                <div className="h-64 relative">
                  <Image
                    src={venue.images[0]}
                    alt={venue.name}
                    fill
                    className="object-cover"
                  />
                </div>
                <div className="p-6">
                  <h3 className="text-xl font-semibold mb-2">{venue.name}</h3>
                  <p className="text-gray-600 mb-4">{venue.description}</p>
                  <div className="space-y-2">
                    <p className="text-sm">
                      <strong>Events:</strong> {venue.events.join(", ")}
                    </p>
                    <p className="text-sm">
                      <strong>Amenities:</strong> {venue.amenities.join(", ")}
                    </p>
                    <p className="text-[#fdb040] font-bold mt-4">
                      ${venue.price}/event
                    </p>
                  </div>
                </div>
              </MotionDiv>
            ))}
          </div>
        )}
      </div>
    </AnimatedSection>
  );
}
