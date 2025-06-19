// Simple in-memory cache for frequently accessed data
class MemoryCache {
  constructor() {
    this.cache = new Map();
    this.ttl = new Map(); // Time to live for each key
    this.defaultTTL = 5 * 60 * 1000; // 5 minutes default
    
    // Clean up expired entries every minute
    setInterval(() => {
      this.cleanup();
    }, 60 * 1000);
  }

  set(key, value, ttlMs = this.defaultTTL) {
    this.cache.set(key, value);
    this.ttl.set(key, Date.now() + ttlMs);
  }

  get(key) {
    // Check if key exists and hasn't expired
    if (this.cache.has(key)) {
      const expiry = this.ttl.get(key);
      if (Date.now() < expiry) {
        return this.cache.get(key);
      } else {
        // Key has expired, remove it
        this.delete(key);
      }
    }
    return null;
  }

  delete(key) {
    this.cache.delete(key);
    this.ttl.delete(key);
  }

  clear() {
    this.cache.clear();
    this.ttl.clear();
  }

  cleanup() {
    const now = Date.now();
    for (const [key, expiry] of this.ttl.entries()) {
      if (now >= expiry) {
        this.delete(key);
      }
    }
  }

  // Get cache statistics
  getStats() {
    return {
      size: this.cache.size,
      keys: Array.from(this.cache.keys())
    };
  }

  // Cache wrapper for async functions
  async wrap(key, asyncFn, ttlMs = this.defaultTTL) {
    // Try to get from cache first
    const cached = this.get(key);
    if (cached !== null) {
      return cached;
    }

    // Not in cache, execute function and cache result
    try {
      const result = await asyncFn();
      this.set(key, result, ttlMs);
      return result;
    } catch (error) {
      // Don't cache errors
      throw error;
    }
  }
}

// Create singleton instance
const cache = new MemoryCache();

// Cache key generators
const CacheKeys = {
  user: (id) => `user:${id}`,
  userProjects: (userId) => `user:${userId}:projects`,
  project: (id) => `project:${id}`,
  projectTasks: (projectId) => `project:${projectId}:tasks`,
  projectMembers: (projectId) => `project:${projectId}:members`,
  userNotifications: (userId) => `user:${userId}:notifications`,
  availableUsers: () => 'users:available'
};

// Cache invalidation helpers
const CacheInvalidation = {
  // Invalidate user-related caches
  invalidateUser: (userId) => {
    cache.delete(CacheKeys.user(userId));
    cache.delete(CacheKeys.userProjects(userId));
    cache.delete(CacheKeys.userNotifications(userId));
    cache.delete(CacheKeys.availableUsers());
  },

  // Invalidate project-related caches
  invalidateProject: (projectId, memberIds = []) => {
    cache.delete(CacheKeys.project(projectId));
    cache.delete(CacheKeys.projectTasks(projectId));
    cache.delete(CacheKeys.projectMembers(projectId));
    
    // Invalidate user projects cache for all members
    memberIds.forEach(memberId => {
      cache.delete(CacheKeys.userProjects(memberId));
    });
  },

  // Invalidate task-related caches
  invalidateTask: (projectId, assignedToId, createdById) => {
    cache.delete(CacheKeys.projectTasks(projectId));
    if (assignedToId) {
      cache.delete(CacheKeys.userNotifications(assignedToId));
    }
    if (createdById) {
      cache.delete(CacheKeys.userNotifications(createdById));
    }
  }
};

module.exports = {
  cache,
  CacheKeys,
  CacheInvalidation
}; 