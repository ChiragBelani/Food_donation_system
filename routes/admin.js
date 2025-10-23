const express = require("express");
const router = express.Router();
const middleware = require("../middleware/index.js");
const User = require("../models/user.js");
const Donation = require("../models/donation.js");


router.get("/admin/dashboard", middleware.ensureAdminLoggedIn, async (req,res) => {
	const numAdmins = await User.countDocuments({ role: "admin" });
	const numDonors = await User.countDocuments({ role: "donor" });
	const numAgents = await User.countDocuments({ role: "agent" });
	const numPendingDonations = await Donation.countDocuments({ status: "pending" });
	const numAcceptedDonations = await Donation.countDocuments({ status: "accepted" });
	const numAssignedDonations = await Donation.countDocuments({ status: "assigned" });
	const numCollectedDonations = await Donation.countDocuments({ status: "collected" });
	res.render("admin/dashboard", {
		title: "Dashboard",
		numAdmins, numDonors, numAgents, numPendingDonations, numAcceptedDonations, numAssignedDonations, numCollectedDonations
	});
});

router.get("/admin/donations/pending", middleware.ensureAdminLoggedIn, async (req,res) => {
	try
	{
		const pendingDonations = await Donation.find({status: ["pending", "accepted", "assigned"]}).populate("donor");
		res.render("admin/pendingDonations", { title: "Pending Donations", pendingDonations });
	}
	catch(err)
	{
		console.log(err);
		req.flash("error", "Some error occurred on the server.")
		res.redirect("back");
	}
});

router.get("/admin/donations/previous", middleware.ensureAdminLoggedIn, async (req,res) => {
	try
	{
		const previousDonations = await Donation.find({ status: "collected" }).populate("donor");
		res.render("admin/previousDonations", { title: "Previous Donations", previousDonations });
	}
	catch(err)
	{
		console.log(err);
		req.flash("error", "Some error occurred on the server.")
		res.redirect("back");
	}
});

router.get("/admin/donation/view/:donationId", middleware.ensureAdminLoggedIn, async (req,res) => {
	try
	{
		const donationId = req.params.donationId;
		const donation = await Donation.findById(donationId).populate("donor").populate("agent");
		res.render("admin/donation", { title: "Donation details", donation });
	}
	catch(err)
	{
		console.log(err);
		req.flash("error", "Some error occurred on the server.")
		res.redirect("back");
	}
});

router.get("/admin/donation/accept/:donationId", middleware.ensureAdminLoggedIn, async (req, res) => {
    try {
        const donationId = req.params.donationId;

        // Update donation status and get updated document
        const donation = await Donation.findByIdAndUpdate(
            donationId,
            { status: "accepted" },
            { new: true }
        ).populate("donor"); // populate donor info

        if (!donation) {
            req.flash("error", "Donation not found");
            return res.redirect("back");
        }

        // --- Send Email Notification using Go Email Server ---
        try {
            await fetch("http://localhost:9090/send-donation-request", {
                method: "POST",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify({
                    name: donation.donor.firstName + " " + donation.donor.lastName,
                    email: donation.donor.email,
                    phone: donation.donor.phone || "N/A",
                    address: donation.donor.address || "N/A",
                    amount: donation.amount || "Donation",
                    foodType: donation.foodType || "N/A",
                    quantity: donation.quantity || "N/A",
                    message: `Your donation request (${donation._id}) has been accepted by the admin.`
                })
            });

            console.log(`📧 Donation accepted email sent to ${donation.donor.email}`);
        } catch (emailErr) {
            console.error("❌ Failed to send donation accepted email:", emailErr);
        }
        // -----------------------------------------------------

        req.flash("success", "Donation accepted successfully");
        res.redirect(`/admin/donation/view/${donationId}`);

    } catch (err) {
        console.log(err);
        req.flash("error", "Some error occurred on the server.");
        res.redirect("back");
    }
});


router.get("/admin/donation/reject/:donationId", middleware.ensureAdminLoggedIn, async (req,res) => {
	try
	{
		const donationId = req.params.donationId;
		await Donation.findByIdAndUpdate(donationId, { status: "rejected" });
		req.flash("success", "Donation rejected successfully");
		res.redirect(`/admin/donation/view/${donationId}`);
	}
	catch(err)
	{
		console.log(err);
		req.flash("error", "Some error occurred on the server.")
		res.redirect("back");
	}
});

router.get("/admin/donation/assign/:donationId", middleware.ensureAdminLoggedIn, async (req,res) => {
	try
	{
		const donationId = req.params.donationId;
		const agents = await User.find({ role: "agent" });
		const donation = await Donation.findById(donationId).populate("donor");
		res.render("admin/assignAgent", { title: "Assign agent", donation, agents });
	}
	catch(err)
	{
		console.log(err);
		req.flash("error", "Some error occurred on the server.")
		res.redirect("back");
	}
});

router.post("/admin/donation/assign/:donationId", middleware.ensureAdminLoggedIn, async (req,res) => {
    try {
        const donationId = req.params.donationId;
        const { agent, adminToAgentMsg } = req.body;

        // Update donation status and assign agent
        const donation = await Donation.findByIdAndUpdate(
            donationId,
            { status: "assigned", agent, adminToAgentMsg },
            { new: true }
        ).populate("donor").populate("agent"); // populate donor & agent info

        if (!donation) {
            req.flash("error", "Donation not found");
            return res.redirect("back");
        }

        // --- Send Email to Donor ---
        try {
            await fetch("http://localhost:9090/send-donation-request", {
                method: "POST",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify({
                    name: donation.donor.firstName + " " + donation.donor.lastName,
                    email: donation.donor.email,
                    phone: donation.donor.phone || "N/A",
                    address: donation.donor.address || "N/A",
                    amount: donation.amount || "Donation",
                    foodType: donation.foodType || "N/A",
                    quantity: donation.quantity || "N/A",
                    message: `An agent has been assigned to your donation request (${donation._id}). 
                              Agent: ${donation.agent.firstName} ${donation.agent.lastName}, 
                              Email: ${donation.agent.email}, 
                              Phone: ${donation.agent.phone || "N/A"}`
                })
            });

            console.log(`📧 Donor email sent to ${donation.donor.email}`);
        } catch (emailErr) {
            console.error("❌ Failed to send email to donor:", emailErr);
        }

        // --- Send Email to Agent --- // look on it
        try {
            await fetch("http://localhost:9090/send-donation-request", {
                method: "POST",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify({
                    name: donation.agent.firstName + " " + donation.agent.lastName,
                    email: donation.agent.email,
                    phone: donation.agent.phone || "N/A",
                    address: donation.agent.address || "N/A",
                    amount: donation.amount || "Donation",
                    foodType: donation.foodType || "N/A",
                    quantity: donation.quantity || "N/A",
                    message: `You have been assigned a new donation request (${donation._id}). 
                              Donor: ${donation.donor.firstName} ${donation.donor.lastName}, 
                              Email: ${donation.donor.email}, 
                              Phone: ${donation.donor.phone || "N/A"}`
                })
            });

            console.log(`📧 Agent email sent to ${donation.agent.email}`);
        } catch (emailErr) {
            console.error("❌ Failed to send email to agent:", emailErr);
        }

        // -----------------------------------------------------

        req.flash("success", "Agent assigned successfully");
        res.redirect(`/admin/donation/view/${donationId}`);

    } catch (err) {
        console.log(err);
        req.flash("error", "Some error occurred on the server.");
        res.redirect("back");
    }
});


router.get("/admin/agents", middleware.ensureAdminLoggedIn, async (req,res) => {
	try
	{
		const agents = await User.find({ role: "agent" });
		res.render("admin/agents", { title: "List of agents", agents });
	}
	catch(err)
	{
		console.log(err);
		req.flash("error", "Some error occurred on the server.")
		res.redirect("back");
	}
});


router.get("/admin/profile", middleware.ensureAdminLoggedIn, (req,res) => {
	res.render("admin/profile", { title: "My profile" });
});

router.put("/admin/profile", middleware.ensureAdminLoggedIn, async (req,res) => {
	try
	{
		const id = req.user._id;
		const updateObj = req.body.admin;	// updateObj: {firstName, lastName, gender, address, phone}
		await User.findByIdAndUpdate(id, updateObj);
		
		req.flash("success", "Profile updated successfully");
		res.redirect("/admin/profile");
	}
	catch(err)
	{
		console.log(err);
		req.flash("error", "Some error occurred on the server.")
		res.redirect("back");
	}
	
});


module.exports = router;