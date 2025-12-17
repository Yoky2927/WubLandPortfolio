// models/property.model.js
import pool from '../config/database.js';
import { v4 as uuidv4 } from 'uuid';

class PropertyModel {
  async create(propertyData) {
  const propertyUuid = uuidv4();
  const {
    title, description, property_type, property_status,
    address, city, state, country, zip_code, neighborhood,
    beds, baths, sqft, lot_size, year_built, garage_spaces, parking_spaces,
    price, currency, price_per_sqft, is_negotiable, deposit_amount, monthly_rent,
    listing_type, mls_number, listing_date, expiration_date,
    owner_user_id, created_by_user_id, assigned_broker_id, is_exclusive,
    features, amenities, property_tags,
    tax_amount, hoa_fees, insurance_amount
  } = propertyData;

  const query = `
    INSERT INTO properties (
      property_uuid, title, description, property_type, property_status,
      address, city, state, country, zip_code, neighborhood,
      beds, baths, sqft, lot_size, year_built, garage_spaces, parking_spaces,
      price, currency, price_per_sqft, is_negotiable, deposit_amount, monthly_rent,
      listing_type, mls_number, listing_date, expiration_date,
      owner_user_id, created_by_user_id, assigned_broker_id, is_exclusive,
      features, amenities, property_tags,
      tax_amount, hoa_fees, insurance_amount,
      price_history, status_history, published_at
    ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
  `;

  // Helper function to convert undefined to null
  const safeValue = (val) => val !== undefined ? val : null;

  const values = [
    propertyUuid, 
    safeValue(title), 
    safeValue(description), 
    safeValue(property_type), 
    safeValue(property_status || 'draft'),
    safeValue(address), 
    safeValue(city), 
    safeValue(state), 
    safeValue(country || 'Ethiopia'), 
    safeValue(zip_code), 
    safeValue(neighborhood),
    safeValue(beds), 
    safeValue(baths), 
    safeValue(sqft), 
    safeValue(lot_size), 
    safeValue(year_built), 
    safeValue(garage_spaces || 0), 
    safeValue(parking_spaces || 0),
    safeValue(price), 
    safeValue(currency || 'ETB'), 
    safeValue(price_per_sqft), 
    safeValue(is_negotiable !== undefined ? is_negotiable : true), 
    safeValue(deposit_amount), 
    safeValue(monthly_rent),
    safeValue(listing_type), 
    safeValue(mls_number), 
    safeValue(listing_date), 
    safeValue(expiration_date),
    safeValue(owner_user_id), 
    safeValue(created_by_user_id), 
    safeValue(assigned_broker_id), 
    safeValue(is_exclusive !== undefined ? is_exclusive : false),
    JSON.stringify(safeValue(features) || []), 
    JSON.stringify(safeValue(amenities) || []), 
    JSON.stringify(safeValue(property_tags) || []),
    safeValue(tax_amount), 
    safeValue(hoa_fees), 
    safeValue(insurance_amount),
    JSON.stringify([]), 
    JSON.stringify([]), 
    property_status === 'active' ? new Date() : null
  ];

  const [result] = await pool.execute(query, values);
  return this.findById(result.insertId);
}

  async findById(id) {
  const query = `
    SELECT p.*, 
      u.username as owner_username,
      u.email as owner_email,
      u.phone_number as owner_phone,
      b.username as broker_username,
      b.email as broker_email,
      b.phone_number as broker_phone
    FROM properties p
    LEFT JOIN users u ON p.owner_user_id = u.id
    LEFT JOIN users b ON p.assigned_broker_id = b.id
    WHERE p.id = ? AND p.deleted_at IS NULL
  `;
  const [properties] = await pool.execute(query, [id]);
  return properties[0];
}

  async findAll(filters = {}, page = 1, limit = 20) {
    let whereClauses = ['p.deleted_at IS NULL'];
    const values = [];
    
    if (filters.city) {
      whereClauses.push('p.city LIKE ?');
      values.push(`%${filters.city}%`);
    }
    
    if (filters.property_type) {
      whereClauses.push('p.property_type = ?');
      values.push(filters.property_type);
    }
    
    if (filters.listing_type) {
      whereClauses.push('p.listing_type = ?');
      values.push(filters.listing_type);
    }
    
    if (filters.property_status) {
      whereClauses.push('p.property_status = ?');
      values.push(filters.property_status);
    }
    
    if (filters.min_price) {
      whereClauses.push('p.price >= ?');
      values.push(filters.min_price);
    }
    
    if (filters.max_price) {
      whereClauses.push('p.price <= ?');
      values.push(filters.max_price);
    }
    
    if (filters.beds) {
      whereClauses.push('p.beds >= ?');
      values.push(filters.beds);
    }
    
    if (filters.baths) {
      whereClauses.push('p.baths >= ?');
      values.push(filters.baths);
    }
    
    if (filters.search) {
      whereClauses.push('(p.title LIKE ? OR p.description LIKE ? OR p.address LIKE ? OR p.city LIKE ?)');
      values.push(`%${filters.search}%`, `%${filters.search}%`, `%${filters.search}%`, `%${filters.search}%`);
    }
    
    const where = whereClauses.length > 0 ? `WHERE ${whereClauses.join(' AND ')}` : '';
    
    // Count total
    const countQuery = `
      SELECT COUNT(*) as total 
      FROM properties p
      ${where}
    `;
    const [countResult] = await pool.execute(countQuery, values);
    const total = countResult[0].total;
    
    // Get paginated results
   const offset = (page - 1) * limit;
const query = `
  SELECT p.*, 
    u.username as owner_username,
    b.username as broker_username,
    b.email as broker_email,
    b.phone_number as broker_phone
  FROM properties p
  LEFT JOIN users u ON p.owner_user_id = u.id
  LEFT JOIN users b ON p.assigned_broker_id = b.id
  WHERE ${where}
  ORDER BY 
    CASE WHEN p.is_featured = 1 THEN 0 ELSE 1 END,
    CASE WHEN p.is_premium = 1 THEN 0 ELSE 1 END,
    p.published_at DESC
  LIMIT ? OFFSET ?
`;
    
    const [properties] = await pool.execute(query, [...values, limit, offset]);
    
    return {
      properties,
      pagination: {
        page: parseInt(page),
        limit: parseInt(limit),
        total,
        pages: Math.ceil(total / limit)
      }
    };
  }

  async search(searchTerm, filters = {}, page = 1, limit = 20) {
    let whereClauses = ['p.deleted_at IS NULL', 'p.property_status = "active"'];
    const values = [];
    
    if (searchTerm) {
      whereClauses.push('(p.title LIKE ? OR p.description LIKE ? OR p.address LIKE ? OR p.city LIKE ? OR p.neighborhood LIKE ?)');
      const searchValue = `%${searchTerm}%`;
      values.push(searchValue, searchValue, searchValue, searchValue, searchValue);
    }
    
    if (filters.property_type) {
      whereClauses.push('p.property_type = ?');
      values.push(filters.property_type);
    }
    
    if (filters.listing_type) {
      whereClauses.push('p.listing_type = ?');
      values.push(filters.listing_type);
    }
    
    if (filters.min_price) {
      whereClauses.push('p.price >= ?');
      values.push(filters.min_price);
    }
    
    if (filters.max_price) {
      whereClauses.push('p.price <= ?');
      values.push(filters.max_price);
    }
    
    if (filters.beds) {
      whereClauses.push('p.beds >= ?');
      values.push(filters.beds);
    }
    
    if (filters.baths) {
      whereClauses.push('p.baths >= ?');
      values.push(filters.baths);
    }
    
    if (filters.city) {
      whereClauses.push('p.city = ?');
      values.push(filters.city);
    }
    
    const where = whereClauses.join(' AND ');
    
    // Count total
    const countQuery = `
      SELECT COUNT(*) as total 
      FROM properties p
      WHERE ${where}
    `;
    const [countResult] = await pool.execute(countQuery, values);
    const total = countResult[0].total;
    
    // Get paginated results
    const offset = (page - 1) * limit;
    const query = `
      SELECT p.*, 
        u.username as owner_username,
        b.username as broker_username
      FROM properties p
      LEFT JOIN users u ON p.owner_user_id = u.id
      LEFT JOIN users b ON p.assigned_broker_id = b.id
      WHERE ${where}
      ORDER BY 
        CASE WHEN p.is_featured = 1 THEN 0 ELSE 1 END,
        CASE WHEN p.is_premium = 1 THEN 0 ELSE 1 END,
        p.published_at DESC
      LIMIT ? OFFSET ?
    `;
    
    const [properties] = await pool.execute(query, [...values, limit, offset]);
    
    return {
      properties,
      pagination: {
        page: parseInt(page),
        limit: parseInt(limit),
        total,
        pages: Math.ceil(total / limit)
      }
    };
  }

  async update(id, updateData) {
    const fields = [];
    const values = [];
    
    const jsonFields = ['features', 'amenities', 'property_tags', 'price_history', 'status_history'];
    
    Object.keys(updateData).forEach(key => {
      if (updateData[key] !== undefined) {
        if (jsonFields.includes(key)) {
          fields.push(`${key} = ?`);
          values.push(JSON.stringify(updateData[key]));
        } else {
          fields.push(`${key} = ?`);
          values.push(updateData[key]);
        }
      }
    });
    
    if (fields.length === 0) {
      return this.findById(id);
    }
    
    fields.push('updated_at = CURRENT_TIMESTAMP');
    values.push(id);
    
    const query = `UPDATE properties SET ${fields.join(', ')} WHERE id = ? AND deleted_at IS NULL`;
    await pool.execute(query, values);
    
    return this.findById(id);
  }

  async delete(id, userId) {
    const query = `
      UPDATE properties 
      SET deleted_at = CURRENT_TIMESTAMP, 
          last_modified_by_user_id = ? 
      WHERE id = ? AND deleted_at IS NULL
    `;
    const [result] = await pool.execute(query, [userId, id]);
    return result.affectedRows > 0;
  }

  async getFeatured(limit = 6) {
  const query = `
    SELECT p.*, 
      u.username as owner_username,
      b.username as broker_username,
      b.email as broker_email,
      b.phone_number as broker_phone
    FROM properties p
    LEFT JOIN users u ON p.owner_user_id = u.id
    LEFT JOIN users b ON p.assigned_broker_id = b.id
    WHERE p.deleted_at IS NULL AND p.property_status = 'active' AND p.is_featured = 1
    ORDER BY p.published_at DESC
    LIMIT ?
  `;
  
  const [properties] = await pool.execute(query, [limit]);
  return properties;
}

async getPremium(limit = 6) {
  const query = `
    SELECT p.*, 
      u.username as owner_username,
      b.username as broker_username,
      b.email as broker_email,
      b.phone_number as broker_phone
    FROM properties p
    LEFT JOIN users u ON p.owner_user_id = u.id
    LEFT JOIN users b ON p.assigned_broker_id = b.id
    WHERE p.deleted_at IS NULL AND p.property_status = 'active' AND p.is_premium = 1
    ORDER BY p.published_at DESC
    LIMIT ?
  `;
  
  const [properties] = await pool.execute(query, [limit]);
  return properties;
}

async getRecent(limit = 10) {
  const query = `
    SELECT p.*, 
      u.username as owner_username,
      b.username as broker_username,
      b.email as broker_email,
      b.phone_number as broker_phone
    FROM properties p
    LEFT JOIN users u ON p.owner_user_id = u.id
    LEFT JOIN users b ON p.assigned_broker_id = b.id
    WHERE p.deleted_at IS NULL AND p.property_status = 'active'
    ORDER BY p.created_at DESC
    LIMIT ?
  `;
  
  const [properties] = await pool.execute(query, [limit]);
  return properties;
}

  async findByBrokerId(brokerId, filters = {}, page = 1, limit = 20) {
  let whereClauses = ['p.deleted_at IS NULL', 'p.assigned_broker_id = ?'];
  const values = [brokerId];
  
  // Apply filters
  if (filters.property_status) {
    whereClauses.push('p.property_status = ?');
    values.push(filters.property_status);
  }
  
  if (filters.listing_type) {
    whereClauses.push('p.listing_type = ?');
    values.push(filters.listing_type);
  }
  
  if (filters.search) {
    whereClauses.push('(p.title LIKE ? OR p.description LIKE ? OR p.address LIKE ? OR p.city LIKE ?)');
    const searchValue = `%${filters.search}%`;
    values.push(searchValue, searchValue, searchValue, searchValue);
  }
  
  const where = whereClauses.length > 0 ? `WHERE ${whereClauses.join(' AND ')}` : '';
  
  // Count total
  const countQuery = `
    SELECT COUNT(*) as total 
    FROM properties p
    ${where}
  `;
  const [countResult] = await pool.execute(countQuery, values);
  const total = countResult[0].total;
  
  // Get paginated results
  const offset = (page - 1) * limit;
  const query = `
  SELECT p.*, 
    u.username as owner_username,
    u.email as owner_email,
    b.username as broker_username,
    b.email as broker_email,
    b.phone_number as broker_phone
  FROM properties p
  LEFT JOIN users u ON p.owner_user_id = u.id
  LEFT JOIN users b ON p.assigned_broker_id = b.id
  ${where}
  ORDER BY p.updated_at DESC
  LIMIT ? OFFSET ?
`;
  
  const [properties] = await pool.execute(query, [...values, limit, offset]);
  
  return {
    properties,
    pagination: {
      page: parseInt(page),
      limit: parseInt(limit),
      total,
      pages: Math.ceil(total / limit)
    }
  };
}
}

export default new PropertyModel();