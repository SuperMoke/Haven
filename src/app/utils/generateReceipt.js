import { Document, Page, Text, View, StyleSheet } from "@react-pdf/renderer";

const styles = StyleSheet.create({
  page: { padding: 30 },
  header: { fontSize: 24, marginBottom: 20 },
  section: { margin: 10, padding: 10 },
  row: { flexDirection: "row", justifyContent: "space-between", margin: 5 },
});

export const ReceiptDocument = ({ booking, venue, userProfile }) => (
  <Document>
    <Page size="A4" style={styles.page}>
      <View style={styles.header}>
        <Text>Haven Booking Receipt</Text>
      </View>
      <View style={styles.section}>
        <Text>Booking Reference: {booking.id}</Text>
        <Text>Date: {new Date().toLocaleDateString()}</Text>
        <Text>Customer: {userProfile?.fullName}</Text>
      </View>
      <View style={styles.section}>
        <Text>Venue: {venue?.name}</Text>
        <Text>Date: {booking.startDate.toLocaleDateString()}</Text>
        {booking.endDate && (
          <Text>End Date: {booking.endDate.toLocaleDateString()}</Text>
        )}
      </View>
      <View style={styles.section}>
        <View style={styles.row}>
          <Text>Total Amount:</Text>
          <Text>₱{booking.totalAmount.toLocaleString()}</Text>
        </View>
      </View>
    </Page>
  </Document>
);
