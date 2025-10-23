const express = require("express");
const router = express.Router();
const bcrypt = require("bcryptjs");
const User = require("../models/user.js");
const passport = require("passport");
const middleware = require("../middleware/index.js");
const fetch = require("node-fetch"); // npm install node-fetch if missing

// Temporary OTP storage (better: Redis or DB later)
const otpStore = {};

// ---------- SEND OTP ROUTE ----------
const otpInt = Math.floor(100000 + Math.random() * 900000); // number for Go
const otpStr = otpInt.toString(); // string for frontend verification
const temp = "";

router.post("/auth/send-otp", async (req, res) => {
  try {
      const { email } = req.body;
      if (!email) return res.json({ success: false, message: "Email is required" });

      // Node side

      // Call Go server with number
      const response = await fetch("http://localhost:9090/send-otp-email", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ name: "User", email, otp: otpInt }) // number for Go
      });

      // Store OTP with expiry (5 mins)
      otpStore[email] = { value: otpStr, expiry: Date.now() + 5 * 60 * 1000 }; // string for Node

      if (!response.ok)
          return res.json({ success: false, message: "Failed to send OTP email" });

      // console.log(`✅ OTP for ${email}:`, otpStr); // log string for verification
      res.json({ success: true, message: "OTP sent successfully" });

  } catch (err) {
      console.error("❌ Error sending OTP:", err);
      res.json({ success: false, message: "Server error" });
  }
});


// ---------- SIGNUP PAGE ----------
router.get("/auth/signup", middleware.ensureNotLoggedIn, (req,res) => {
	res.render("auth/signup", { title: "User Signup" });
});

// ---------- SIGNUP SUBMIT ----------
router.post("/auth/signup", middleware.ensureNotLoggedIn, async (req,res) => {
	
	const { firstName, lastName, email, password1, password2, role } = req.body;
	let errors = [];

    // // Check OTP
    // if (otpStore[email] != otpStr) {
    //     errors.push({ msg: "Invalid or missing OTP. Please verify your email first." });
    // }

	if (!firstName || !lastName || !email || !password1 || !password2) {
		errors.push({ msg: "Please fill in all the fields" });
	}
	if (password1 != password2) {
		errors.push({ msg: "Passwords do not match" });
	}
	if (password1.length < 4) {
		errors.push({ msg: "Password should be at least 4 characters" });
	}
	if(errors.length > 0) {
		return res.render("auth/signup", {
			title: "User Signup",
			errors, firstName, lastName, email
		});
	}
	
	try {
		const user = await User.findOne({ email });
		if(user) {
			errors.push({ msg: "Email already registered. Try another." });
			return res.render("auth/signup", {
				title: "User Signup", errors, firstName, lastName, email
			});
		}

		const newUser = new User({ firstName, lastName, email, password: password1, role });
		const salt = bcrypt.genSaltSync(10);
		newUser.password = bcrypt.hashSync(password1, salt);
		await newUser.save();
        delete otpStore[email]; // delete OTP after successful signup

		req.flash("success", "✅ Registered successfully! You can log in now.");
		res.redirect("/auth/login");

	} catch(err) {
		console.log(err);
		req.flash("error", "Server error. Try again later.");
		res.redirect("back");
	}
});


router.post("/auth/verify-otp", (req, res) => {
  const { email, otp } = req.body;
  if (!email || !otp) return res.json({ success: false, message: "Email and OTP required" });

  const record = otpStore[email];
  if (!record) return res.json({ success: false, message: "OTP expired or invalid" });

  if (Date.now() > record.expiry) {
      delete otpStore[email];
      return res.json({ success: false, message: "OTP expired" });
  }

  if (record.value !== otp) return res.json({ success: false, message: "Incorrect OTP" });

  delete otpStore[email]; // remove after verification
  return res.json({ success: true, message: "OTP verified" });
});




// ---------- LOGIN ROUTES ----------
router.get("/auth/login", middleware.ensureNotLoggedIn, (req,res) => {
	res.render("auth/login", { title: "User login" });
});

router.post("/auth/login", middleware.ensureNotLoggedIn,
	passport.authenticate('local', {
		failureRedirect: "/auth/login",
		failureFlash: true,
		successFlash: true
	}), (req,res) => {
		res.redirect(req.session.returnTo || `/${req.user.role}/dashboard`);
	}
);

// ---------- LOGOUT ----------
router.get("/auth/logout", (req,res) => {
	req.logout();
	req.flash("success", "Logged-out successfully");
	res.redirect("/");
});

module.exports = router;
