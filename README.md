# Homebridge WAN Monitor

A Homebridge plugin that monitors your WAN connection failover by detecting ISP changes. Perfect for dual-WAN setups where you want to be notified when your primary internet connection fails and traffic switches to your backup connection.



## Features

- 🔍 Monitors your current ISP by checking your public IP
- 📱 Appears as a Contact Sensor in HomeKit
- 🚨 Sensor opens when secondary WAN is active (primary failed)
- ✅ Sensor closes when primary WAN is restored
- ⚙️ Configurable check intervals
- 🎛️ Easy configuration through Homebridge UI



## How It Works

The plugin periodically checks your current public IP address and identifies the ISP. When your ISP changes from your configured primary ISP, it means your router has failed over to the secondary WAN connection.

- Contact Sensor CLOSED = Primary WAN active (normal)
- Contact Sensor OPEN = Secondary WAN active (failover occurred)



## Installation

Install the plugin via Homebridge UI or npm:
```
bashnpm install -g homebridge-wan-monitor
```
Configure the plugin through the Homebridge UI or manually in your config.json



## Configuration
### Via Homebridge UI (Recommended)

Go to Homebridge UI → Plugins → homebridge-wan-monitor → Settings
Fill in the required fields:

- Accessory Name: Name for your HomeKit accessory
- Primary ISP Name: Your primary ISP name (must match exactly)
- Check Interval: How often to check (in minutes)

### Manual Configuration
Add this to your Homebridge config.json:
```
{
  "accessories": [
    {
      "accessory": "WANMonitor",
      "name": "Secondary Internet",
      "primaryISP": "TOT Public Company Limited",
      "checkInterval": 10
    }
  ]
}
```


## Finding Your ISP Name
To find the exact ISP name that the plugin will detect:

1. Visit [ipinfo.io](https://ipinfo.io) in your browser
2. Enter your public IP address and look for the "ISP" or "ASN" or "Organization" field
3. Use that exact name in your configuration

Common ISP names:

- Comcast Cable Communications, LLC
- Verizon Fios
- AT&T Internet Services
- Charter Communications
- TOT Public Company Limited



## Automation Ideas
Once set up, you can create HomeKit automations:

- Send notification when sensor opens (secondary WAN active)
- Turn on indicator light when failover occurs
- Log events to a smart home hub
- Trigger backup procedures when primary WAN fails



## Troubleshooting
### Sensor Not Updating

- Check Homebridge logs for errors
- Verify your primary ISP name matches exactly
- Ensure internet connectivity for IP checking

### Rate Limiting

- Increase check interval if you get rate limited
- Recommended minimum: 10 minutes between checks

### ISP Name Changes

- Some ISPs may show different names over time
- Check [ipinfo.io](https://ipinfo.io) periodically to verify the name



## Support

- Report issues: GitHub Issues
- Discussions: GitHub Discussions



## License
MIT License - see LICENSE file for details.



## Changelog
### 1.0.0

- Initial release
- Basic WAN monitoring functionality
- HomeKit contact sensor integration
- Configurable ISP detection
