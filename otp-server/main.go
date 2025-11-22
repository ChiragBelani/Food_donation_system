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

// Structures
type EmailOtpRequest struct {
	Name  string `json:"name"`
	Email string `json:"email"`
	Otp   int    `json:"otp"`
}

type EmailBookingRequest struct {
	Name     string `json:"name"`
	Email    string `json:"email"`
	RoomNo   int    `json:"roomNo"`
	RoomType string `json:"roomType"`
	Nights   int    `json:"nights"`
}

type DonationRequest struct {
	Name     string `json:"name"`
	Email    string `json:"email"`
	Phone    string `json:"phone"`
	Address  string `json:"address"`
	FoodType string `json:"foodType"`
	Quantity string `json:"quantity"`
	Amount   string `json:"amount"`
	Message  string `json:"message"`
}

func main() {
	// Load local .env (ignored on Render)
	_ = godotenv.Load()

	// Render requires reading dynamic port
	port := os.Getenv("PORT")
	if port == "" {
		// Local development default
		port = "9099"
	}

	// Register all endpoints
	http.HandleFunc("/send-otp-email", handleSendOtpEmail)
	http.HandleFunc("/send-booking-email", handleSendBookingEmail)
	http.HandleFunc("/send-donation-request", sendDonationRequestEmail)

	fmt.Println("✓ Email server running on port:", port)
	log.Fatal(http.ListenAndServe(":"+port, nil))
}

// ================= OTP HANDLER =================

func handleSendOtpEmail(w http.ResponseWriter, r *http.Request) {
	if r.Method != http.MethodPost {
		http.Error(w, "Method Not Allowed", http.StatusMethodNotAllowed)
		return
	}

	var req EmailOtpRequest
	if err := json.NewDecoder(r.Body).Decode(&req); err != nil {
		http.Error(w, "Invalid request payload", http.StatusBadRequest)
		return
	}

	if err := sendOtpEmail(req); err != nil {
		log.Println("Email send error:", err)
		http.Error(w, "Failed to send OTP email", http.StatusInternalServerError)
		return
	}

	w.Write([]byte("OTP email sent successfully"))
}

func sendOtpEmail(req EmailOtpRequest) error {
	from := os.Getenv("EMAIL_FROM")
	pass := os.Getenv("EMAIL_PASSWORD")

	m := gomail.NewMessage()
	m.SetHeader("From", from)
	m.SetHeader("To", req.Email)
	m.SetHeader("Subject", "Your OTP Code")
	m.SetBody("text/plain", fmt.Sprintf("Hi %s,\nYour OTP is %d.\n\nThank you!", req.Name, req.Otp))

	d := gomail.NewDialer("smtp.gmail.com", 587, from, pass)
	return d.DialAndSend(m)
}

// ================= BOOKING HANDLER =================

func handleSendBookingEmail(w http.ResponseWriter, r *http.Request) {
	if r.Method != http.MethodPost {
		http.Error(w, "Method Not Allowed", http.StatusMethodNotAllowed)
		return
	}

	var req EmailBookingRequest
	if err := json.NewDecoder(r.Body).Decode(&req); err != nil {
		http.Error(w, "Invalid request", http.StatusBadRequest)
		return
	}

	if err := sendBookingEmail(req); err != nil {
		log.Println("Booking email send error:", err)
		http.Error(w, "Failed to send booking email", http.StatusInternalServerError)
		return
	}

	w.Write([]byte("Booking email sent"))
}

func sendBookingEmail(req EmailBookingRequest) error {
	from := os.Getenv("EMAIL_FROM")
	pass := os.Getenv("EMAIL_PASSWORD")

	m := gomail.NewMessage()
	m.SetHeader("From", from)
	m.SetHeader("To", req.Email)
	m.SetHeader("Subject", "Hotel Booking Confirmation")
	m.SetBody("text/plain",
		fmt.Sprintf("Hi %s,\nYour booking is confirmed:\nRoom %d (%s)\nNights: %d",
			req.Name, req.RoomNo, req.RoomType, req.Nights))

	d := gomail.NewDialer("smtp.gmail.com", 587, from, pass)
	return d.DialAndSend(m)
}

// ================= DONATION HANDLER =================

func sendDonationRequestEmail(w http.ResponseWriter, r *http.Request) {
	if r.Method != http.MethodPost {
		http.Error(w, "Method Not Allowed", http.StatusMethodNotAllowed)
		return
	}

	var donation DonationRequest
	if err := json.NewDecoder(r.Body).Decode(&donation); err != nil {
		http.Error(w, "Invalid JSON", http.StatusBadRequest)
		return
	}

	body := fmt.Sprintf(`
		<h2>New Donation Request</h2>
		<p><strong>Name:</strong> %s</p>
		<p><strong>Email:</strong> %s</p>
		<p><strong>Phone:</strong> %s</p>
		<p><strong>Address:</strong> %s</p>
		<p><strong>Food Type:</strong> %s</p>
		<p><strong>Quantity:</strong> %s</p>
		<p><strong>Amount:</strong> %s</p>
		<p><strong>Message:</strong> %s</p>
	`,
		donation.Name, donation.Email, donation.Phone,
		donation.Address, donation.FoodType, donation.Quantity,
		donation.Amount, donation.Message)

	if err := sendEmail(donation.Email, "New Donation Request", body); err != nil {
		log.Println("Donation email error:", err)
		http.Error(w, "Failed to send donation email", http.StatusInternalServerError)
		return
	}

	w.Write([]byte("Donation email sent successfully"))
}

func sendEmail(to, subject, body string) error {
	from := os.Getenv("EMAIL_FROM")
	pass := os.Getenv("EMAIL_PASSWORD")

	m := gomail.NewMessage()
	m.SetHeader("From", from)
	m.SetHeader("To", to)
	m.SetHeader("Subject", subject)
	m.SetBody("text/html", body)

	d := gomail.NewDialer("smtp.gmail.com", 587, from, pass)

	return d.DialAndSend(m)
}
