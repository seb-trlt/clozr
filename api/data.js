import { neon } from '@neondatabase/serverless';

const sql = neon('postgres://neondb_owner:npg_pUQiI5Redm3x@ep-solitary-wave-a50x8h8q-pooler.us-east-2.aws.neon.tech/neondb?sslmode=require');

export default async function handler(req, res) {
  try {
    const result = await sql`
      SELECT 
        id,
        card_number as "CardNumber",
        card_holder_name_en as "CardHolderNameEn",
        card_holder_email as "CardHolderEmail",
        card_holder_mobile as "CardHolderMobile",
        card_holder_phone as "CardHolderPhone",
        card_holder_photo as "CardHolderPhoto",
        office_name_en as "OfficeNameEn",
        website_url,
        instagram_url,
        linkedin_url,
        created_at as "dateAdded"
      FROM brokers 
      ORDER BY created_at DESC 
      LIMIT 100
    `;
    res.status(200).json(result);
  } catch (error) {
    console.error('Erreur:', error);
    res.status(500).json({ error: 'Erreur lors de la récupération des données' });
  }
} 