// email-server/main.go

package main

import (
	"encoding/json"
	"fmt"
	"log"
	"net/http"
	"os"
	"github.com/joho/godotenv"
	"gopkg.in/gomail.v2"
)

// Structure for OTP
type EmailOtpRequest struct {
	Name string `json:"name"`
	Email string `json:"email"`
	Otp    int `json:"otp"`
}

// Structure for Hotel Booking
type EmailBookingRequest struct {
	Name     string `json:"name"`
	Email    string `json:"email"`
	RoomNo   int    `json:"roomNo"`
	RoomType string `json:"roomType"`
	Nights   int    `json:"nights"`
}

func main() {
	err := godotenv.Load()
	if err != nil {
		log.Fatal("Error loading .env file")
	}

	// Set up routes
	http.HandleFunc("/send-otp-email", handleSendOtpEmail)
	http.HandleFunc("/send-booking-email", handleSendBookingEmail)
	http.HandleFunc("/send-donation-request", sendDonationRequestEmail)


	fmt.Println("✅ Email server running on :9090")
	log.Fatal(http.ListenAndServe(":9090", nil))
}

// Handler for sending OTP email
func handleSendOtpEmail(w http.ResponseWriter, r *http.Request) {
	if r.Method != http.MethodPost {
		http.Error(w, "Method Not Allowed", http.StatusMethodNotAllowed)
		return
	}

	var req EmailOtpRequest
	err := json.NewDecoder(r.Body).Decode(&req)
	if err != nil {
		http.Error(w, "Invalid request", http.StatusBadRequest)
		return
	}

	err = sendOtpEmail(req)
	if err != nil {
		log.Println("❌ Email send error:", err)
		http.Error(w, "Failed to send email", http.StatusInternalServerError)
		return
	}

	w.WriteHeader(http.StatusOK)
	w.Write([]byte("OTP email sent"))
}

// Function to send OTP email
func sendOtpEmail(req EmailOtpRequest) error {
	from := os.Getenv("EMAIL_FROM")
	pass := os.Getenv("EMAIL_PASSWORD")

	m := gomail.NewMessage()
	m.SetHeader("From", from)
	m.SetHeader("To", req.Email)
	m.SetHeader("Subject", "Your OTP Code")
	m.SetBody("text/plain", fmt.Sprintf("Hi %s,\n\nYour OTP code is: %d.\n\nThanks!", req.Name, req.Otp))

	d := gomail.NewDialer("smtp.gmail.com", 587, from, pass)

	return d.DialAndSend(m)
}




// Handler for sending booking confirmation email
func handleSendBookingEmail(w http.ResponseWriter, r *http.Request) {
	if r.Method != http.MethodPost {
		http.Error(w, "Method Not Allowed", http.StatusMethodNotAllowed)
		return
	}

	var req EmailBookingRequest
	err := json.NewDecoder(r.Body).Decode(&req)
	if err != nil {
		http.Error(w, "Invalid request", http.StatusBadRequest)
		return
	}

	err = sendBookingEmail(req)
	if err != nil {
		log.Println("❌ Email send error:", err)
		http.Error(w, "Failed to send email", http.StatusInternalServerError)
		return
	}

	w.WriteHeader(http.StatusOK)
	w.Write([]byte("Booking email sent"))
}

// Function to send booking confirmation email
func sendBookingEmail(req EmailBookingRequest) error {
	from := os.Getenv("EMAIL_FROM")
	pass := os.Getenv("EMAIL_PASSWORD")

	m := gomail.NewMessage()
	m.SetHeader("From", from)
	m.SetHeader("To", req.Email)
	m.SetHeader("Subject", "Hotel Booking Confirmation")
	m.SetBody("text/plain", fmt.Sprintf("Hi %s,\n\nYour booking is confirmed for Room %d (%s) for %d nights.\n\nThanks!", req.Name, req.RoomNo, req.RoomType, req.Nights))

	d := gomail.NewDialer("smtp.gmail.com", 587, from, pass)

	return d.DialAndSend(m)
}


// ---------------- Donation Request Email Handler ----------------



// Request struct coming from Node.js or frontend
type DonationRequest struct {
    Name    string `json:"name"`
    Email   string `json:"email"`
    Phone   string `json:"phone"`
    Address string `json:"address"`
    Amount  string `json:"amount"`
	FoodType string `json:"foodType"`
	Quantity string `json:"quantity"`
    Message string `json:"message"`
}

// Handler for donation email request
func sendDonationRequestEmail(w http.ResponseWriter, r *http.Request) {
    if r.Method != http.MethodPost {
        http.Error(w, "Invalid request method", http.StatusMethodNotAllowed)
        return
    }

    var donation DonationRequest
    if err := json.NewDecoder(r.Body).Decode(&donation); err != nil {
        http.Error(w, "Invalid JSON payload", http.StatusBadRequest)
        return
    }

    // Compose email body
    body := fmt.Sprintf(`
        <h3>New Donation Request Received</h3>
        <p><strong>Name:</strong> %s</p>
        <p><strong>Email:</strong> %s</p>
        <p><strong>Phone:</strong> %s</p>
        <p><strong>Address:</strong> %s</p>
		<p><strong>Food Type:</strong> %s</p>
		<p><strong>Quantity:</strong> %s</p>
        <p><strong>Donation Amount:</strong> %s</p>

        <p><strong>Message:</strong> %s</p>
    `, donation.Name, donation.Email, donation.Phone, donation.Address, donation.Amount, donation.FoodType, donation.Quantity, donation.Message)

    // Send email
    if err := sendEmail(donation.Email, "New Donation Request", body); err != nil {
        log.Println("❌ Failed to send donation email:", err)
        http.Error(w, "Failed to send email", http.StatusInternalServerError)
        return
    }

    w.WriteHeader(http.StatusOK)
    w.Write([]byte("✅ Donation request email sent successfully"))
}

// ---------------- SMTP Mail Sender Reusable Function ----------------

// Update this SMTP config to your credentials
func sendEmail(to string, subject string, body string) error {
    m := gomail.NewMessage()
    m.SetHeader("From", "no-reply@yourdomain.com")
    m.SetHeader("To", to)
    m.SetHeader("Subject", subject)
    m.SetBody("text/html", body)

    d := gomail.NewDialer(
        "smtp.gmail.com", // Change if using another SMTP
        587,
        os.Getenv("EMAIL_FROM"),       // <-- Replace
        os.Getenv("EMAIL_PASSWORD"), // <-- Replace
    )

    return d.DialAndSend(m)
}

