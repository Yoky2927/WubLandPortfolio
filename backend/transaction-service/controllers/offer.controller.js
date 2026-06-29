const Offer = require("../models/Offer.model");
const Transaction = require("../models/Transaction.model");
const Invoice = require("../models/Invoice.model");

class OfferController {
  async createOffer(req, res) {
    try {
      const offerData = {
        ...req.body,
        offered_by_user_id: req.user.id,
      };

      const offer = await Offer.create(offerData);

      res.status(201).json({
        success: true,
        message: "Offer created successfully",
        data: offer,
      });
    } catch (error) {
      console.error("Create offer error:", error);
      res.status(500).json({
        success: false,
        message: "Error creating offer",
        error: error.message,
      });
    }
  }

  async getOffer(req, res) {
    try {
      const { id } = req.params;
      const offer = await Offer.findById(id);

      if (!offer) {
        return res.status(404).json({
          success: false,
          message: "Offer not found",
        });
      }

      res.json({
        success: true,
        data: offer,
      });
    } catch (error) {
      console.error("Get offer error:", error);
      res.status(500).json({
        success: false,
        message: "Error fetching offer",
        error: error.message,
      });
    }
  }

  async acceptOffer(req, res) {
    try {
      const { id } = req.params;
      const { responseNotes } = req.body;

      // Get the offer
      const offer = await Offer.findById(id);
      if (!offer) {
        return res.status(404).json({
          success: false,
          message: "Offer not found",
        });
      }

      // Check if user is authorized to accept (owner or admin)
      if (offer.owner_user_id !== req.user.id && req.user.role !== "admin") {
        return res.status(403).json({
          success: false,
          message: "You are not authorized to accept this offer",
        });
      }

      // Update offer status
      await Offer.updateStatus(id, "accepted", responseNotes);

      // Create transaction
      const transaction = await Transaction.create({
        property_id: offer.property_id,
        buyer_user_id: offer.offered_by_user_id,
        seller_user_id: offer.owner_user_id,
        offer_price: offer.offered_price,
        transaction_type: offer.offer_type === "purchase" ? "sale" : "rental",
        status: "pending_payment",
        created_by_user_id: req.user.id,
      });

      // ✅ DYNAMICALLY CREATE INVOICE
      const invoice = await Invoice.create({
        invoice_type: offer.offer_type === "purchase" ? "sale" : "rent",
        from_user_id: offer.offered_by_user_id, // Buyer pays
        to_user_id: offer.owner_user_id, // Seller receives
        property_id: offer.property_id,
        transaction_id: transaction.id,
        amount: offer.offered_price,
        line_items: [
          {
            description: `${offer.offer_type === "purchase" ? "Property Purchase" : "Property Rental"}`,
            amount: offer.offered_price,
            quantity: 1,
          },
        ],
        notes: `Invoice for accepted offer #${offer.id}`,
        created_by_user_id: req.user.id,
      });

      // Notify buyer about the invoice
      // (Add notification logic here)

      res.json({
        success: true,
        message: "Offer accepted successfully",
        data: {
          offer,
          transaction,
          invoice,
        },
      });
    } catch (error) {
      console.error("Accept offer error:", error);
      res.status(500).json({
        success: false,
        message: "Error accepting offer",
        error: error.message,
      });
    }
  }

  async rejectOffer(req, res) {
    try {
      const { id } = req.params;
      const { responseNotes } = req.body;

      await Offer.updateStatus(id, "rejected", responseNotes);

      res.json({
        success: true,
        message: "Offer rejected successfully",
      });
    } catch (error) {
      console.error("Reject offer error:", error);
      res.status(500).json({
        success: false,
        message: "Error rejecting offer",
        error: error.message,
      });
    }
  }

  async getPropertyOffers(req, res) {
    try {
      const { propertyId } = req.params;
      const offers = await Offer.findByProperty(propertyId);

      res.json({
        success: true,
        data: offers,
      });
    } catch (error) {
      console.error("Get property offers error:", error);
      res.status(500).json({
        success: false,
        message: "Error fetching property offers",
        error: error.message,
      });
    }
  }

  async getUserOffers(req, res) {
    try {
      const userId = req.user.id;
      const { type } = req.query;

      const offers = await Offer.findByUser(userId, type || "offered");

      res.json({
        success: true,
        data: offers,
      });
    } catch (error) {
      console.error("Get user offers error:", error);
      res.status(500).json({
        success: false,
        message: "Error fetching user offers",
        error: error.message,
      });
    }
  }
}

module.exports = new OfferController();
