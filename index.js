const https = require('https');

let Service, Characteristic;

module.exports = (api) => {
  Service = api.hap.Service;
  Characteristic = api.hap.Characteristic;
  api.registerAccessory('homebridge-wan-monitor', 'WANMonitor', WANMonitorAccessory);
};

class WANMonitorAccessory {
  constructor(log, config, api) {
    this.log = log;
    this.name = config.name || 'Secondary Internet';
    this.primaryISP = config.primaryISP;
    this.checkInterval = Math.max((config.checkInterval || 30) * 60 * 1000, 60000); // Min 1 minute
    this.verbose = config.verbose || false;
    
    // Validate required config
    if (!this.primaryISP) {
      this.log.error('Primary ISP name is required in configuration');
      return;
    }
    
    this.contactSensorState = Characteristic.ContactSensorState.CONTACT_DETECTED; // Closed = normal
    this.service = new Service.ContactSensor(this.name);
    
    // Set up the contact sensor characteristic
    this.service
      .getCharacteristic(Characteristic.ContactSensorState)
      .onGet(this.getContactSensorState.bind(this));
    
    // Add manufacturer information
    this.service
      .getCharacteristic(Characteristic.Manufacturer)
      .onGet(() => 'homebridge-wan-monitor');
    
    this.service
      .getCharacteristic(Characteristic.Model)
      .onGet(() => 'WAN Monitor');
    
    this.service
      .getCharacteristic(Characteristic.SerialNumber)
      .onGet(() => 'WANMon-001');
    
    // Start monitoring
    this.startMonitoring();
    
    this.log.info(`WAN Monitor initialized. Checking every ${Math.round(this.checkInterval/60000)} minutes for ISP: ${this.primaryISP}`);
  }

  async getContactSensorState() {
    return this.contactSensorState;
  }

  startMonitoring() {
    // Check immediately on startup
    this.checkWANStatus();
    
    // Then check every interval
    this.monitoringInterval = setInterval(() => {
      this.checkWANStatus();
    }, this.checkInterval);
    
    // Log next check time
    const nextCheck = new Date(Date.now() + this.checkInterval);
    this.log.info(`⏰ Next WAN check scheduled for: ${nextCheck.toLocaleString()}`);
  }

  async checkWANStatus() {
    try {
      this.log.info('🔍 Checking WAN status...');
      
      // Get current public IP
      const currentIP = await this.getCurrentIP();
      if (!currentIP) {
        this.log.error('Could not get current IP address');
        return;
      }
      
      // Get ISP information
      const ispInfo = await this.getISPInfo(currentIP);
      if (!ispInfo) {
        this.log.error('Could not get ISP information');
        return;
      }
      
      const currentISP = ispInfo.isp || ispInfo.org || 'Unknown';
      this.log.info(`📡 Current IP: ${currentIP}, ISP: ${currentISP}`);
      
      // Check if we're using secondary WAN (case-insensitive comparison)
      const isSecondaryWAN = !currentISP.toLowerCase().includes(this.primaryISP.toLowerCase());
      
      // Contact sensor logic: CONTACT_NOT_DETECTED = Open = Secondary WAN active
      const newContactState = isSecondaryWAN 
        ? Characteristic.ContactSensorState.CONTACT_NOT_DETECTED  // Open = problem
        : Characteristic.ContactSensorState.CONTACT_DETECTED;     // Closed = normal
      
      if (newContactState !== this.contactSensorState) {
        this.contactSensorState = newContactState;
        this.service
          .getCharacteristic(Characteristic.ContactSensorState)
          .updateValue(this.contactSensorState);
        
        if (isSecondaryWAN) {
          this.log.warn(`🚨 Secondary Internet OPENED! Primary WAN failed! Current ISP: ${currentISP}`);
        } else {
          this.log.info(`✅ Secondary Internet CLOSED! Primary WAN restored! Current ISP: ${currentISP}`);
        }
      } else {
        const status = isSecondaryWAN ? 'OPEN (Secondary WAN)' : 'CLOSED (Primary WAN)';
        this.log.info(`✓ WAN status unchanged - ${status}`);
      }
      
      // Log next check time
      const nextCheck = new Date(Date.now() + this.checkInterval);
      this.log.info(`⏰ Next check: ${nextCheck.toLocaleString()}`);
      
    } catch (error) {
      this.log.error('❌ Error checking WAN status:', error.message);
    }
  }

  getCurrentIP() {
    return new Promise((resolve, reject) => {
      const req = https.get('https://api.ipify.org', (res) => {
        let data = '';
        
        res.on('data', (chunk) => {
          data += chunk;
        });
        
        res.on('end', () => {
          resolve(data.trim());
        });
      });
      
      req.on('error', (error) => {
        reject(error);
      });
      
      req.setTimeout(10000, () => {
        req.destroy();
        reject(new Error('Request timeout'));
      });
    });
  }

  getISPInfo(ip) {
    return new Promise((resolve, reject) => {
      const url = `https://ipinfo.io/${ip}/json`;
      
      const req = https.get(url, (res) => {
        let data = '';
        
        res.on('data', (chunk) => {
          data += chunk;
        });
        
        res.on('end', () => {
          try {
            const json = JSON.parse(data);
            resolve(json);
          } catch (error) {
            reject(error);
          }
        });
      });
      
      req.on('error', (error) => {
        reject(error);
      });
      
      req.setTimeout(10000, () => {
        req.destroy();
        reject(new Error('Request timeout'));
      });
    });
  }

  getServices() {
    return [this.service];
  }
}