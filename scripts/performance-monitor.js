const mongoose = require('mongoose');
const config = require('../src/config');

// Performance monitoring script
class PerformanceMonitor {
  constructor() {
    this.stats = {
      queries: [],
      slowQueries: [],
      connectionStats: {},
      startTime: Date.now()
    };
    
    this.setupMonitoring();
  }

  setupMonitoring() {
    // Monitor MongoDB queries
    mongoose.set('debug', (collectionName, method, query, doc, options) => {
      const start = Date.now();
      
      // Log the query
      const queryInfo = {
        collection: collectionName,
        method: method,
        query: JSON.stringify(query),
        timestamp: new Date().toISOString(),
        duration: 0
      };
      
      // This is a simplified version - in production you'd want more sophisticated timing
      setTimeout(() => {
        queryInfo.duration = Date.now() - start;
        this.stats.queries.push(queryInfo);
        
        // Track slow queries (over 100ms)
        if (queryInfo.duration > 100) {
          this.stats.slowQueries.push(queryInfo);
          console.warn(`🐌 Slow query detected: ${queryInfo.collection}.${queryInfo.method} took ${queryInfo.duration}ms`);
        }
        
        // Keep only last 1000 queries to prevent memory issues
        if (this.stats.queries.length > 1000) {
          this.stats.queries = this.stats.queries.slice(-1000);
        }
        
        if (this.stats.slowQueries.length > 100) {
          this.stats.slowQueries = this.stats.slowQueries.slice(-100);
        }
      }, 0);
    });

    // Monitor connection events
    mongoose.connection.on('connected', () => {
      this.stats.connectionStats.connected = true;
      this.stats.connectionStats.lastConnected = new Date().toISOString();
      console.log('📊 Performance Monitor: Database connected');
    });

    mongoose.connection.on('disconnected', () => {
      this.stats.connectionStats.connected = false;
      this.stats.connectionStats.lastDisconnected = new Date().toISOString();
      console.log('📊 Performance Monitor: Database disconnected');
    });

    mongoose.connection.on('error', (err) => {
      this.stats.connectionStats.lastError = {
        message: err.message,
        timestamp: new Date().toISOString()
      };
      console.error('📊 Performance Monitor: Database error:', err.message);
    });
  }

  getStats() {
    const now = Date.now();
    const uptime = now - this.stats.startTime;
    
    return {
      uptime: uptime,
      uptimeFormatted: this.formatDuration(uptime),
      totalQueries: this.stats.queries.length,
      slowQueries: this.stats.slowQueries.length,
      averageQueryTime: this.calculateAverageQueryTime(),
      connectionStats: this.stats.connectionStats,
      recentSlowQueries: this.stats.slowQueries.slice(-10),
      queryBreakdown: this.getQueryBreakdown(),
      recommendations: this.getRecommendations()
    };
  }

  calculateAverageQueryTime() {
    if (this.stats.queries.length === 0) return 0;
    
    const totalTime = this.stats.queries.reduce((sum, query) => sum + query.duration, 0);
    return Math.round(totalTime / this.stats.queries.length * 100) / 100;
  }

  getQueryBreakdown() {
    const breakdown = {};
    
    this.stats.queries.forEach(query => {
      const key = `${query.collection}.${query.method}`;
      if (!breakdown[key]) {
        breakdown[key] = { count: 0, totalTime: 0, avgTime: 0 };
      }
      breakdown[key].count++;
      breakdown[key].totalTime += query.duration;
      breakdown[key].avgTime = Math.round(breakdown[key].totalTime / breakdown[key].count * 100) / 100;
    });

    return breakdown;
  }

  getRecommendations() {
    const recommendations = [];
    
    // Check for slow queries
    if (this.stats.slowQueries.length > 0) {
      recommendations.push({
        type: 'performance',
        message: `${this.stats.slowQueries.length} slow queries detected. Consider adding indexes or optimizing queries.`,
        priority: 'high'
      });
    }

    // Check average query time
    const avgTime = this.calculateAverageQueryTime();
    if (avgTime > 50) {
      recommendations.push({
        type: 'performance',
        message: `Average query time is ${avgTime}ms. Consider optimizing frequently used queries.`,
        priority: 'medium'
      });
    }

    // Check query patterns
    const breakdown = this.getQueryBreakdown();
    Object.entries(breakdown).forEach(([operation, stats]) => {
      if (stats.avgTime > 100) {
        recommendations.push({
          type: 'optimization',
          message: `${operation} operations are slow (avg: ${stats.avgTime}ms). Consider adding indexes.`,
          priority: 'high'
        });
      }
    });

    return recommendations;
  }

  formatDuration(ms) {
    const seconds = Math.floor(ms / 1000);
    const minutes = Math.floor(seconds / 60);
    const hours = Math.floor(minutes / 60);
    
    if (hours > 0) {
      return `${hours}h ${minutes % 60}m ${seconds % 60}s`;
    } else if (minutes > 0) {
      return `${minutes}m ${seconds % 60}s`;
    } else {
      return `${seconds}s`;
    }
  }

  // Method to generate performance report
  generateReport() {
    const stats = this.getStats();
    
    console.log('\n📊 PERFORMANCE REPORT');
    console.log('='.repeat(50));
    console.log(`Uptime: ${stats.uptimeFormatted}`);
    console.log(`Total Queries: ${stats.totalQueries}`);
    console.log(`Slow Queries: ${stats.slowQueries}`);
    console.log(`Average Query Time: ${stats.averageQueryTime}ms`);
    console.log(`Database Connected: ${stats.connectionStats.connected ? 'Yes' : 'No'}`);
    
    if (stats.recommendations.length > 0) {
      console.log('\n🔍 RECOMMENDATIONS:');
      stats.recommendations.forEach((rec, index) => {
        console.log(`${index + 1}. [${rec.priority.toUpperCase()}] ${rec.message}`);
      });
    }
    
    console.log('\n📈 QUERY BREAKDOWN:');
    Object.entries(stats.queryBreakdown).forEach(([operation, data]) => {
      console.log(`${operation}: ${data.count} queries, avg ${data.avgTime}ms`);
    });
    
    console.log('='.repeat(50));
  }

  // Start periodic reporting
  startPeriodicReporting(intervalMinutes = 30) {
    setInterval(() => {
      this.generateReport();
    }, intervalMinutes * 60 * 1000);
    
    console.log(`📊 Performance monitoring started. Reports every ${intervalMinutes} minutes.`);
  }
}

// Export for use in main application
module.exports = PerformanceMonitor; 