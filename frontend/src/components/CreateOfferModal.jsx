import React, { useState } from 'react';
import { X, DollarSign, Calendar, FileText, Percent } from 'lucide-react';
import { toast } from 'react-hot-toast';
import { directApi } from '../utils/api.endpoints';

const CreateOfferModal = ({ isOpen, onClose, property, user, theme }) => {
  const [loading, setLoading] = useState(false);
  const [formData, setFormData] = useState({
    property_id: property?.id,
    owner_user_id: property?.user_id,
    offer_type: 'purchase', // or 'rent'
    offered_price: property?.price || '',
    offered_deposit: Math.round((property?.price || 0) * 0.1), // 10% deposit
    offer_terms: '',
    expiration_date: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000).toISOString().split('T')[0]
  });

  const handleSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);
    
    try {
      const response = await directApi.createOffer(formData);
      
      if (response.success) {
        toast.success('Offer submitted successfully!');
        onClose();
      } else {
        toast.error(response.message || 'Failed to submit offer');
      }
    } catch (error) {
      console.error('Offer creation error:', error);
      toast.error(error.message || 'Failed to submit offer');
    } finally {
      setLoading(false);
    }
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/50 backdrop-blur-sm">
      <div className={`w-full max-w-md rounded-2xl shadow-2xl ${
        theme === 'dark' 
          ? 'bg-gradient-to-br from-gray-900 to-gray-800 border border-gray-700' 
          : 'bg-gradient-to-br from-white to-gray-50 border border-gray-200'
      }`}>
        <div className="p-6">
          <div className="flex justify-between items-center mb-6">
            <div>
              <h3 className="text-xl font-bold">Make an Offer</h3>
              <p className="text-gray-500">{property?.title}</p>
            </div>
            <button onClick={onClose} className="p-2 hover:bg-gray-100 dark:hover:bg-gray-800 rounded-lg">
              <X className="w-5 h-5" />
            </button>
          </div>

          <form onSubmit={handleSubmit} className="space-y-4">
            <div>
              <label className="block text-sm font-medium mb-2">Offer Amount (ETB)</label>
              <div className="relative">
                <DollarSign className="absolute left-3 top-1/2 transform -translate-y-1/2 w-5 h-5 text-gray-500" />
                <input
                  type="number"
                  value={formData.offered_price}
                  onChange={(e) => setFormData({...formData, offered_price: e.target.value})}
                  className="w-full pl-10 pr-4 py-3 rounded-xl border border-gray-300 dark:border-gray-700 bg-white dark:bg-gray-800"
                  required
                />
              </div>
              <p className="text-sm text-gray-500 mt-1">
                Property price: {property?.price?.toLocaleString('en-ET')} ETB
              </p>
            </div>

            <div>
              <label className="block text-sm font-medium mb-2">Deposit Amount (ETB)</label>
              <div className="relative">
                <Percent className="absolute left-3 top-1/2 transform -translate-y-1/2 w-5 h-5 text-gray-500" />
                <input
                  type="number"
                  value={formData.offered_deposit}
                  onChange={(e) => setFormData({...formData, offered_deposit: e.target.value})}
                  className="w-full pl-10 pr-4 py-3 rounded-xl border border-gray-300 dark:border-gray-700 bg-white dark:bg-gray-800"
                  required
                />
              </div>
              <p className="text-sm text-gray-500 mt-1">
                Usually 10-20% of offer amount
              </p>
            </div>

            <div>
              <label className="block text-sm font-medium mb-2">Offer Expiry Date</label>
              <div className="relative">
                <Calendar className="absolute left-3 top-1/2 transform -translate-y-1/2 w-5 h-5 text-gray-500" />
                <input
                  type="date"
                  value={formData.expiration_date}
                  onChange={(e) => setFormData({...formData, expiration_date: e.target.value})}
                  className="w-full pl-10 pr-4 py-3 rounded-xl border border-gray-300 dark:border-gray-700 bg-white dark:bg-gray-800"
                  required
                />
              </div>
            </div>

            <div>
              <label className="block text-sm font-medium mb-2">Terms & Conditions</label>
              <div className="relative">
                <FileText className="absolute left-3 top-3 w-5 h-5 text-gray-500" />
                <textarea
                  value={formData.offer_terms}
                  onChange={(e) => setFormData({...formData, offer_terms: e.target.value})}
                  className="w-full pl-10 pr-4 py-3 rounded-xl border border-gray-300 dark:border-gray-700 bg-white dark:bg-gray-800 min-h-[100px]"
                  placeholder="Add your terms and conditions here..."
                />
              </div>
            </div>

            <button
              type="submit"
              disabled={loading}
              className="w-full py-3 bg-gradient-to-r from-amber-500 to-orange-500 hover:from-amber-600 hover:to-orange-600 text-white rounded-xl font-medium disabled:opacity-50 disabled:cursor-not-allowed"
            >
              {loading ? 'Submitting Offer...' : 'Submit Offer'}
            </button>
          </form>
        </div>
      </div>
    </div>
  );
};

export default CreateOfferModal;