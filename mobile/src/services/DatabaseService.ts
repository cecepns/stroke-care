import SQLite from 'react-native-sqlite-storage';
import { LocationData } from '../types';

SQLite.DEBUG(true);
SQLite.enablePromise(true);

class DatabaseService {
  private database: SQLite.SQLiteDatabase | null = null;

  async initDatabase(): Promise<void> {
    try {
      this.database = await SQLite.openDatabase({
        name: 'LocationLogger.db',
        location: 'default',
      });

      await this.createTables();
    } catch (error) {
      console.error('Database initialization error:', error);
      throw error;
    }
  }

  private async createTables(): Promise<void> {
    if (!this.database) return;

    const createLocationTable = `
      CREATE TABLE IF NOT EXISTS locations (
        id INTEGER PRIMARY KEY AUTOINCREMENT,
        latitude REAL NOT NULL,
        longitude REAL NOT NULL,
        timestamp TEXT NOT NULL,
        address TEXT,
        synced INTEGER DEFAULT 0
      );
    `;

    const createUserTable = `
      CREATE TABLE IF NOT EXISTS users (
        id INTEGER PRIMARY KEY AUTOINCREMENT,
        name TEXT NOT NULL,
        user_id TEXT UNIQUE NOT NULL
      );
    `;

    try {
      await this.database.executeSql(createLocationTable);
      await this.database.executeSql(createUserTable);
    } catch (error) {
      console.error('Table creation error:', error);
      throw error;
    }
  }

  async saveLocation(location: LocationData): Promise<number> {
    if (!this.database) throw new Error('Database not initialized');

    const query = `
      INSERT INTO locations (latitude, longitude, timestamp, address, synced)
      VALUES (?, ?, ?, ?, ?)
    `;

    try {
      const [result] = await this.database.executeSql(query, [
        location.latitude,
        location.longitude,
        location.timestamp,
        location.address || '',
        location.synced ? 1 : 0,
      ]);

      return result.insertId || 0;
    } catch (error) {
      console.error('Save location error:', error);
      throw error;
    }
  }

  async getAllLocations(): Promise<LocationData[]> {
    if (!this.database) throw new Error('Database not initialized');

    const query = 'SELECT * FROM locations ORDER BY timestamp DESC';

    try {
      const [results] = await this.database.executeSql(query);
      const locations: LocationData[] = [];

      for (let i = 0; i < results.rows.length; i++) {
        const row = results.rows.item(i);
        locations.push({
          id: row.id,
          latitude: row.latitude,
          longitude: row.longitude,
          timestamp: row.timestamp,
          address: row.address,
          synced: Boolean(row.synced),
        });
      }

      return locations;
    } catch (error) {
      console.error('Get all locations error:', error);
      throw error;
    }
  }

  async getLastLocation(): Promise<LocationData | null> {
    if (!this.database) throw new Error('Database not initialized');

    const query = 'SELECT * FROM locations ORDER BY timestamp DESC LIMIT 1';

    try {
      const [results] = await this.database.executeSql(query);
      
      if (results.rows.length > 0) {
        const row = results.rows.item(0);
        return {
          id: row.id,
          latitude: row.latitude,
          longitude: row.longitude,
          timestamp: row.timestamp,
          address: row.address,
          synced: Boolean(row.synced),
        };
      }

      return null;
    } catch (error) {
      console.error('Get last location error:', error);
      throw error;
    }
  }

  async markLocationAsSynced(id: number): Promise<void> {
    if (!this.database) throw new Error('Database not initialized');

    const query = 'UPDATE locations SET synced = 1 WHERE id = ?';

    try {
      await this.database.executeSql(query, [id]);
    } catch (error) {
      console.error('Mark location as synced error:', error);
      throw error;
    }
  }

  async saveUser(user: { name: string; id: string }): Promise<void> {
    if (!this.database) throw new Error('Database not initialized');

    const query = `
      INSERT OR REPLACE INTO users (name, user_id)
      VALUES (?, ?)
    `;

    try {
      await this.database.executeSql(query, [user.name, user.id]);
    } catch (error) {
      console.error('Save user error:', error);
      throw error;
    }
  }

  async getUser(): Promise<{ name: string; id: string } | null> {
    if (!this.database) throw new Error('Database not initialized');

    const query = 'SELECT * FROM users LIMIT 1';

    try {
      const [results] = await this.database.executeSql(query);
      
      if (results.rows.length > 0) {
        const row = results.rows.item(0);
        return {
          name: row.name,
          id: row.user_id,
        };
      }

      return null;
    } catch (error) {
      console.error('Get user error:', error);
      throw error;
    }
  }

  async getUnsyncedLocations(): Promise<LocationData[]> {
    if (!this.database) throw new Error('Database not initialized');

    const query = 'SELECT * FROM locations WHERE synced = 0 ORDER BY timestamp DESC';

    try {
      const [results] = await this.database.executeSql(query);
      const locations: LocationData[] = [];

      for (let i = 0; i < results.rows.length; i++) {
        const row = results.rows.item(i);
        locations.push({
          id: row.id,
          latitude: row.latitude,
          longitude: row.longitude,
          timestamp: row.timestamp,
          address: row.address,
          synced: Boolean(row.synced),
        });
      }

      return locations;
    } catch (error) {
      console.error('Get unsynced locations error:', error);
      throw error;
    }
  }

  async clearAllData(): Promise<void> {
    if (!this.database) throw new Error('Database not initialized');

    try {
      // Delete all locations
      await this.database.executeSql('DELETE FROM locations');
      
      // Reset auto-increment counter for locations table
      await this.database.executeSql('DELETE FROM sqlite_sequence WHERE name = "locations"');
      
      console.log('All location data cleared successfully');
    } catch (error) {
      console.error('Clear all data error:', error);
      throw error;
    }
  }
}

export default new DatabaseService();
