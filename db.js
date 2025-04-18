import { neon } from '@neondatabase/serverless';

const sql = neon('postgres://neondb_owner:npg_pUQiI5Redm3x@ep-solitary-wave-a50x8h8q-pooler.us-east-2.aws.neon.tech/neondb?sslmode=require');

export async function initDB() {
  try {
    await sql`
      CREATE TABLE IF NOT EXISTS brokers (
        id SERIAL PRIMARY KEY,
        card_number VARCHAR(255) UNIQUE,
        data JSONB,
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
        updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
      );
    `;
    console.log('Table brokers créée avec succès');
  } catch (error) {
    console.error('Erreur lors de la création de la table:', error);
  }
}

export async function saveBroker(cardNumber, data) {
  try {
    await sql`
      INSERT INTO brokers (card_number, data)
      VALUES (${cardNumber}, ${data})
      ON CONFLICT (card_number) 
      DO UPDATE SET 
        data = ${data},
        updated_at = CURRENT_TIMESTAMP;
    `;
    return true;
  } catch (error) {
    console.error('Erreur lors de la sauvegarde du broker:', error);
    return false;
  }
}

export async function getAllBrokers() {
  try {
    const result = await sql`SELECT data FROM brokers ORDER BY created_at DESC`;
    return result.map(row => row.data);
  } catch (error) {
    console.error('Erreur lors de la récupération des brokers:', error);
    return [];
  }
}

export async function deleteEmptyNames() {
  try {
    const result = await sql`
      DELETE FROM brokers 
      WHERE data->>'CardHolderNameEn' IS NULL 
      OR data->>'CardHolderNameEn' = '--'
      OR data->>'CardHolderNameEn' = '';
    `;
    console.log(`Suppression des données avec nom vide ou "--" effectuée`);
    return result;
  } catch (error) {
    console.error('Erreur lors de la suppression des données:', error);
    return false;
  }
} 