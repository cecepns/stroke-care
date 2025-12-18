import { Platform } from 'react-native';

/**
 * Debug Configuration for React Native Debugger
 * This file contains debugging utilities and configurations
 */

export const DebugConfig = {
  // Enable/disable debugging features
  enableDebugger: __DEV__,
  
  // Debugger port (default for React Native Debugger)
  debuggerPort: 8081,
  
  // Platform-specific debugging settings
  platform: Platform.OS,
  
  // WebSocket connection settings
  websocket: {
    host: 'localhost',
    port: 8081,
    protocol: 'ws',
    reconnectInterval: 1000,
    maxReconnectAttempts: 5,
  },
  
  // Logging configuration
  logging: {
    enabled: __DEV__,
    level: 'debug' as 'debug' | 'info' | 'warn' | 'error',
  },
  
  // Performance monitoring
  performance: {
    enabled: __DEV__,
    trackRenders: true,
    trackInteractions: true,
  },
};

/**
 * Debug utility functions
 */
export const DebugUtils = {
  /**
   * Log debug information
   */
  log: (message: string, data?: any) => {
    if (DebugConfig.logging.enabled) {
      console.log(`[DEBUG] ${message}`, data || '');
    }
  },
  
  /**
   * Log performance metrics
   */
  logPerformance: (operation: string, duration: number) => {
    if (DebugConfig.performance.enabled) {
      console.log(`[PERF] ${operation}: ${duration}ms`);
    }
  },
  
  /**
   * Check if debugger is connected
   */
  isDebuggerConnected: (): boolean => {
    return __DEV__ && (global as any).__REACT_DEVTOOLS_GLOBAL_HOOK__;
  },
  
  /**
   * Test WebSocket connection
   */
  testWebSocketConnection: (): Promise<boolean> => {
    return new Promise((resolve) => {
      if (!__DEV__) {
        resolve(false);
        return;
      }
      
      try {
        const ws = new WebSocket(`ws://${DebugConfig.websocket.host}:${DebugConfig.websocket.port}/debugger-proxy?role=debugger&name=Chrome`);
        
        ws.onopen = () => {
          DebugUtils.log('WebSocket connection established');
          ws.close();
          resolve(true);
        };
        
        ws.onerror = (error) => {
          DebugUtils.log('WebSocket connection failed:', error);
          resolve(false);
        };
        
        // Timeout after 3 seconds
        setTimeout(() => {
          ws.close();
          resolve(false);
        }, 3000);
      } catch (error) {
        DebugUtils.log('WebSocket test failed:', error);
        resolve(false);
      }
    });
  },
  
  /**
   * Get debugger connection status
   */
  getConnectionStatus: async () => {
    const wsConnected = await DebugUtils.testWebSocketConnection();
    const devToolsConnected = DebugUtils.isDebuggerConnected();
    
    return {
      websocket: wsConnected,
      devTools: devToolsConnected,
      metro: wsConnected, // Metro is running if WebSocket connects
    };
  },
};

export default DebugConfig;
