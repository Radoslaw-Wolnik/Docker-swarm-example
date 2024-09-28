// src/services/CacheService.js
import redis from 'redis';

class CacheService {
  constructor() {
    this.client = redis.createClient({
      host: 'redis', // Use the service name from the Docker Compose file
      port: 6379,
    });
  }
  
  async getFromCache(key) {
    return new Promise((resolve, reject) => {
      this.client.get(key, (err, value) => {
        if (err) {
          return reject(err);
        }
        if (value) {
          return resolve(JSON.parse(value));
        }
        resolve(null);
      });
    });
  }

  async setInCache(key, value, expirationInSeconds = 3600) {
    return new Promise((resolve, reject) => {
      this.client.setex(key, expirationInSeconds, JSON.stringify(value), (err) => {
        if (err) {
          return reject(err);
        }
        resolve();
      });
    });
  }

  async clearCache(key) {
    return new Promise((resolve, reject) => {
      this.client.del(key, (err, count) => {
        if (err) {
          return reject(err);
        }
        resolve(count);
      });
    });
  }
}


export default CacheService;