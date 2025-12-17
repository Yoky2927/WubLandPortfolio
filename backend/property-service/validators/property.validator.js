import Joi from 'joi';

const propertySchema = Joi.object({
  title: Joi.string().min(5).max(255).required(),
  description: Joi.string().min(20).required(),
  property_type: Joi.string().valid(
    'residential', 'commercial', 'industrial', 'land', 
    'apartment', 'house', 'condo', 'townhouse'
  ).required(),
  property_status: Joi.string().valid(
    'active', 'pending', 'sold', 'rented', 'inactive', 'draft'
  ),
  address: Joi.string().min(10).required(),
  city: Joi.string().min(2).required(),
  state: Joi.string().min(2),
  country: Joi.string().default('Ethiopia'),
  zip_code: Joi.string(),
  neighborhood: Joi.string(),
  beds: Joi.number().integer().min(0),
  baths: Joi.number().integer().min(0),
  sqft: Joi.number().min(0),
  lot_size: Joi.number().min(0),
  year_built: Joi.number().integer().min(1800).max(new Date().getFullYear()),
  garage_spaces: Joi.number().integer().min(0).default(0),
  parking_spaces: Joi.number().integer().min(0).default(0),
  price: Joi.number().min(0).required(),
  currency: Joi.string().length(3).default('ETB'),
  price_per_sqft: Joi.number().min(0),
  is_negotiable: Joi.boolean().default(true),
  deposit_amount: Joi.number().min(0),
  monthly_rent: Joi.number().min(0),
  listing_type: Joi.string().valid('sale', 'rent', 'lease').required(),
  mls_number: Joi.string(),
  listing_date: Joi.date(),
  expiration_date: Joi.date(),
  owner_user_id: Joi.number().integer().positive(),
  created_by_user_id: Joi.number().integer().positive(),
  assigned_broker_id: Joi.number().integer().positive(),
  is_exclusive: Joi.boolean().default(false),
  features: Joi.array().items(Joi.string()),
  amenities: Joi.array().items(Joi.string()),
  property_tags: Joi.array().items(Joi.string()),
  tax_amount: Joi.number().min(0),
  hoa_fees: Joi.number().min(0),
  insurance_amount: Joi.number().min(0)
});

const updatePropertySchema = Joi.object({
  title: Joi.string().min(5).max(255),
  description: Joi.string().min(20),
  property_type: Joi.string().valid(
    'residential', 'commercial', 'industrial', 'land', 
    'apartment', 'house', 'condo', 'townhouse'
  ),
  property_status: Joi.string().valid(
    'active', 'pending', 'sold', 'rented', 'inactive', 'draft'
  ),
  address: Joi.string().min(10),
  city: Joi.string().min(2),
  state: Joi.string().min(2),
  country: Joi.string(),
  zip_code: Joi.string(),
  neighborhood: Joi.string(),
  beds: Joi.number().integer().min(0),
  baths: Joi.number().integer().min(0),
  sqft: Joi.number().min(0),
  lot_size: Joi.number().min(0),
  year_built: Joi.number().integer().min(1800).max(new Date().getFullYear()),
  garage_spaces: Joi.number().integer().min(0),
  parking_spaces: Joi.number().integer().min(0),
  price: Joi.number().min(0),
  currency: Joi.string().length(3),
  price_per_sqft: Joi.number().min(0),
  is_negotiable: Joi.boolean(),
  deposit_amount: Joi.number().min(0),
  monthly_rent: Joi.number().min(0),
  listing_type: Joi.string().valid('sale', 'rent', 'lease'),
  mls_number: Joi.string(),
  listing_date: Joi.date(),
  expiration_date: Joi.date(),
  assigned_broker_id: Joi.number().integer().positive(),
  is_exclusive: Joi.boolean(),
  features: Joi.array().items(Joi.string()),
  amenities: Joi.array().items(Joi.string()),
  property_tags: Joi.array().items(Joi.string()),
  tax_amount: Joi.number().min(0),
  hoa_fees: Joi.number().min(0),
  insurance_amount: Joi.number().min(0)
}).min(1);

export const validateProperty = (data, isUpdate = false) => {
  const schema = isUpdate ? updatePropertySchema : propertySchema;
  return schema.validate(data, { abortEarly: false });
};

export const validatePropertyStatus = Joi.object({
  status: Joi.string().valid(
    'draft', 'active', 'pending', 'sold', 'rented', 'inactive'
  ).required()
});

export const validatePropertyPrice = Joi.object({
  price: Joi.number().min(0).required()
});

export const validateBrokerAssignment = Joi.object({
  broker_id: Joi.number().integer().positive().required()
});

export const validateFeaturedStatus = Joi.object({
  featured: Joi.boolean().required()
});

export const validatePremiumStatus = Joi.object({
  premium: Joi.boolean().required()
});