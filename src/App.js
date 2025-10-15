import React, { useState, useMemo } from 'react';
import { Upload, AlertTriangle, CheckCircle, XCircle, Shield, Users, HardDrive, Moon, Sun, ChevronLeft, ChevronRight, Info, Search, Eye, EyeOff } from 'lucide-react';
import { BarChart, Bar, PieChart, Pie, Cell, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer } from 'recharts';
import * as Papa from 'papaparse';

const DeviceDashboard = () => {
  // ============================================
  // STATE MANAGEMENT
  // ============================================
  
  // UI state for dark mode toggle
  const [darkMode, setDarkMode] = useState(false);
  
  // Pagination state for device list
  const [currentPage, setCurrentPage] = useState(1);
  const [searchQuery, setSearchQuery] = useState('');
  const [showColumnInfo, setShowColumnInfo] = useState(false);
  const devicesPerPage = 50;

  // File upload tracking - stores uploaded file names
  const [files, setFiles] = useState({
    crowdstrike: null,
    freshdesk: null,
    azure: null,
    intune: null,
    activedirectory: null
  });
  
  // Timestamp tracking for when each file was last uploaded
  const [lastUpdated, setLastUpdated] = useState({
    crowdstrike: null,
    freshdesk: null,
    azure: null,
    intune: null,
    activedirectory: null
  });

  // Parsed CSV data storage for each platform
  const [data, setData] = useState({
    crowdstrike: [],
    freshdesk: [],
    azure: [],
    intune: [],
    activedirectory: []
  });

  // ============================================
  // CONSTANTS AND STYLING
  // ============================================
  
  // Color palette for charts
  const COLORS = ['#3b82f6', '#10b981', '#f59e0b', '#ef4444', '#8b5cf6', '#ec4899', '#06b6d4', '#84cc16'];

  // ============================================
  // UTILITY FUNCTIONS
  // ============================================
  
  // Normalizes hostname strings for consistent matching across platforms
  // Converts to lowercase, trims whitespace, and replaces spaces with hyphens
  const normalizeHostname = (hostname) => {
    if (!hostname) return '';
    const str = String(hostname);
    return str.toLowerCase().trim().replace(/\s+/g, '-');
  };

  // Parses date strings into Date objects
  // Returns null for invalid dates
  const parseDate = (dateStr) => {
    if (!dateStr) return null;
    const date = new Date(dateStr);
    return isNaN(date.getTime()) ? null : date;
  };

  // ============================================
  // FILE UPLOAD HANDLER
  // ============================================
  
  // Handles CSV file uploads and parsing
  // Uses PapaParse to convert CSV to JSON
  // Updates state with parsed data and metadata
  const handleFileUpload = (fileType, event) => {
    const file = event.target.files[0];
    if (!file) return;

    Papa.parse(file, {
      header: true,
      skipEmptyLines: true,
      dynamicTyping: true,
      transformHeader: (header) => header.trim(),
      complete: (results) => {
        setData(prev => ({
          ...prev,
          [fileType]: results.data
        }));
        setLastUpdated(prev => ({
          ...prev,
          [fileType]: new Date()
        }));
        setFiles(prev => ({
          ...prev,
          [fileType]: file.name
        }));
      }
    });
  };

  // ============================================
  // ANALYTICS COMPUTATION (MAIN DATA PROCESSING)
  // ============================================
  
  // Main analytics computation using useMemo for performance
  // Processes all uploaded CSV data and generates unified device list,
  // risk scores, security metrics, department stats, and chart data
  const analytics = useMemo(() => {
    // Return null if no data has been uploaded yet
    if (!data.crowdstrike.length && !data.azure.length && !data.intune.length && !data.freshdesk.length && !data.activedirectory.length) {
      return null;
    }

    // ============================================
    // DEVICE MERGING - Create unified device map
    // ============================================
    const deviceMap = new Map();

    // Process Crowdstrike data (endpoint security platform)
    data.crowdstrike.forEach(device => {
      const hostname = normalizeHostname(device['Hostname'] || device['hostname']);
      if (!hostname) return;
      
      // Initialize device entry if it doesn't exist
      if (!deviceMap.has(hostname)) {
        deviceMap.set(hostname, {
          hostname,
          sources: [],
          serialNumber: device['Serial Number'],
          manufacturer: device['Manufacturer'],
          model: device['Model'],
          lastSeen: null,
          user: null,
          department: null,
          location: null
        });
      }
      
      // Add Crowdstrike-specific data
      const dev = deviceMap.get(hostname);
      dev.sources.push('crowdstrike');
      dev.crowdstrike = {
        lastSeen: parseDate(device['Last Seen']),
        firstSeen: parseDate(device['First Seen']),
        platform: device['Platform'],
        osVersion: device['OS Version'],
        sensorVersion: device['Sensor Version'],
        status: device['Status'],
        detectionsDisabled: device['Detections Disabled'],
        lastReboot: parseDate(device['Last Reboot']),
        lastUser: device['Last Logged In User Account']
      };
      dev.lastSeen = dev.crowdstrike.lastSeen;
      dev.user = dev.crowdstrike.lastUser;
    });

    // Process Azure AD data (cloud identity and access management)
    data.azure.forEach(device => {
      const hostname = normalizeHostname(device['displayName']);
      if (!hostname) return;
      
      // Initialize device entry if it doesn't exist
      if (!deviceMap.has(hostname)) {
        deviceMap.set(hostname, {
          hostname,
          sources: [],
          serialNumber: null,
          manufacturer: null,
          model: device['model'],
          lastSeen: null,
          user: null,
          department: null,
          location: null
        });
      }
      
      // Add Azure AD-specific data
      const dev = deviceMap.get(hostname);
      if (!dev.sources.includes('azure')) {
        dev.sources.push('azure');
      }
      dev.azure = {
        accountEnabled: device['accountEnabled'],
        operatingSystem: device['operatingSystem'],
        osVersion: device['operatingSystemVersion'],
        joinType: device['joinType (trustType)'],
        isCompliant: device['isCompliant'],
        isManaged: device['isManaged'],
        lastSignIn: parseDate(device['approximateLastSignInDateTime']),
        registrationTime: parseDate(device['registrationTime']),
        deviceId: device['deviceId'],
        userNames: device['userNames']
      };
      // Use Azure data to fill in missing base fields
      if (!dev.lastSeen && dev.azure.lastSignIn) {
        dev.lastSeen = dev.azure.lastSignIn;
      }
      if (!dev.user && dev.azure.userNames) {
        dev.user = dev.azure.userNames;
      }
    });

    // Process Intune data (mobile device management)
    data.intune.forEach(device => {
      const hostname = normalizeHostname(device['Device name']);
      if (!hostname) return;
      
      // Initialize device entry if it doesn't exist
      if (!deviceMap.has(hostname)) {
        deviceMap.set(hostname, {
          hostname,
          sources: [],
          serialNumber: device['Serial number'],
          manufacturer: device['Manufacturer'],
          model: device['Model'],
          lastSeen: null,
          user: null,
          department: null,
          location: null
        });
      }
      
      // Add Intune-specific data
      const dev = deviceMap.get(hostname);
      if (!dev.sources.includes('intune')) {
        dev.sources.push('intune');
      }
      dev.intune = {
        lastCheckIn: parseDate(device['Last check-in']),
        enrollmentDate: parseDate(device['Enrollment date']),
        osVersion: device['OS version'],
        compliance: device['Compliance'],
        encrypted: device['Encrypted'],
        ownership: device['Ownership'],
        managedBy: device['Managed by'],
        primaryUser: device['Primary user UPN'] || device['Primary user display name'],
        deviceState: device['Device state'],
        serialNumber: device['Serial number']
      };
      // Use Intune data to fill in missing base fields
      if (!dev.lastSeen && dev.intune.lastCheckIn) {
        dev.lastSeen = dev.intune.lastCheckIn;
      }
      if (!dev.user && dev.intune.primaryUser) {
        dev.user = dev.intune.primaryUser;
      }
      if (!dev.serialNumber && dev.intune.serialNumber) {
        dev.serialNumber = dev.intune.serialNumber;
      }
    });

    // Process Freshdesk data (asset management system)
    data.freshdesk.forEach(device => {
      const hostname = normalizeHostname(device['Name']);
      if (!hostname) return;
      
      // Initialize device entry if it doesn't exist
      if (!deviceMap.has(hostname)) {
        deviceMap.set(hostname, {
          hostname,
          sources: [],
          serialNumber: null,
          manufacturer: null,
          model: device['Model'],
          lastSeen: null,
          user: null,
          department: null,
          location: null
        });
      }
      
      // Add Freshdesk-specific data
      const dev = deviceMap.get(hostname);
      if (!dev.sources.includes('freshdesk')) {
        dev.sources.push('freshdesk');
      }
      dev.freshdesk = {
        assetType: device['Asset Type'],
        assetTag: device['Asset Tag'],
        endOfLife: parseDate(device['End of Life']),
        location: device['Location'],
        department: device['Department'],
        usedBy: device['Used by (Name)'],
        managedBy: device['Managed by (Name)'],
        updatedAt: parseDate(device['Updated At'])
      };
      // Freshdesk is the source of truth for department and location
      dev.department = dev.freshdesk.department;
      dev.location = dev.freshdesk.location;
      if (!dev.user && dev.freshdesk.usedBy) {
        dev.user = dev.freshdesk.usedBy;
      }
    });

    // Process Active Directory data (on-premises directory service)
    data.activedirectory.forEach(device => {
      const hostname = normalizeHostname(device['Name']);
      if (!hostname) return;
      
      // Initialize device entry if it doesn't exist
      if (!deviceMap.has(hostname)) {
        deviceMap.set(hostname, {
          hostname,
          sources: [],
          serialNumber: null,
          manufacturer: null,
          model: null,
          lastSeen: null,
          user: null,
          department: null,
          location: null
        });
      }
      
      // Add Active Directory-specific data
      const dev = deviceMap.get(hostname);
      if (!dev.sources.includes('activedirectory')) {
        dev.sources.push('activedirectory');
      }
      dev.activedirectory = {
        description: device['Description'],
        distinguishedName: device['DistinguishedName'],
        enabled: device['Enabled'],
        lastLogon: parseDate(device['lastLogonTimestamp']),
        objectGUID: device['ObjectGUID'],
        operatingSystem: device['OperatingSystem'],
        osServicePack: device['OperatingSystemServicePack'],
        osVersion: device['OperatingSystemVersion'],
        samAccountName: device['SamAccountName'],
        sid: device['SID'],
        userPrincipalName: device['UserPrincipalName'],
        whenChanged: parseDate(device['WhenChanged']),
        whenCreated: parseDate(device['WhenCreated'])
      };
      // Use Active Directory data to fill in missing lastSeen
      if (!dev.lastSeen && dev.activedirectory.lastLogon) {
        dev.lastSeen = dev.activedirectory.lastLogon;
      }
    });

    // ============================================
    // METRICS CALCULATION
    // ============================================
    
    const devices = Array.from(deviceMap.values());
    const now = new Date();

    // Basic counts
    const totalDevices = devices.length;
    
    // Platform coverage counts
    const hasCrowdstrike = devices.filter(d => d.sources.includes('crowdstrike')).length;
    const hasAzure = devices.filter(d => d.sources.includes('azure')).length;
    const hasIntune = devices.filter(d => d.sources.includes('intune')).length;
    const hasFreshdesk = devices.filter(d => d.sources.includes('freshdesk')).length;
    const hasActiveDirectory = devices.filter(d => d.sources.includes('activedirectory')).length;

    // Security concern: devices in Azure/Intune but missing Crowdstrike protection
    const unprotectedDevices = devices.filter(d => 
      (d.sources.includes('azure') || d.sources.includes('intune')) && 
      !d.sources.includes('crowdstrike')
    );

    // Compliance issues
    const nonCompliantDevices = devices.filter(d => 
      (d.azure && d.azure.isCompliant === false) || 
      (d.intune && d.intune.compliance === 'Noncompliant')
    );

    // Security concern: Crowdstrike detections disabled
    const detectionsDisabled = devices.filter(d => 
      d.crowdstrike && d.crowdstrike.detectionsDisabled === 'Yes'
    );

    // Security concern: unencrypted devices
    const unencryptedDevices = devices.filter(d => 
      d.intune && d.intune.encrypted === 'No'
    );

    // Stale devices (not seen in 45+ days)
    const staleDevices45 = devices.filter(d => {
      if (!d.lastSeen) return false;
      const daysSince = (now - d.lastSeen) / (1000 * 60 * 60 * 24);
      return daysSince > 45;
    });

    // Critical stale devices (not seen in 90+ days)
    const staleDevices90 = devices.filter(d => {
      if (!d.lastSeen) return false;
      const daysSince = (now - d.lastSeen) / (1000 * 60 * 60 * 24);
      return daysSince > 90;
    });

    // Devices that need a reboot (30+ days since last reboot)
    const needsReboot = devices.filter(d => {
      if (!d.crowdstrike || !d.crowdstrike.lastReboot) return false;
      const daysSince = (now - d.crowdstrike.lastReboot) / (1000 * 60 * 60 * 24);
      return daysSince > 30;
    });

    // Devices with no assigned user
    const unassignedDevices = devices.filter(d => !d.user || d.user === '');

    // ============================================
    // RISK SCORE CALCULATION
    // Calculate risk score (0-100) for each device based on multiple factors
    // ============================================
    devices.forEach(d => {
      let risk = 0;
      if (!d.sources.includes('crowdstrike')) risk += 30;
      if (d.crowdstrike && d.crowdstrike.detectionsDisabled === 'Yes') risk += 25;
      if ((d.azure && d.azure.isCompliant === false) || (d.intune && d.intune.compliance === 'Noncompliant')) risk += 20;
      if (d.intune && d.intune.encrypted === 'No') risk += 15;
      if (d.lastSeen) {
        const daysSince = (now - d.lastSeen) / (1000 * 60 * 60 * 24);
        if (daysSince > 90) risk += 10;
      }
      d.riskScore = risk;
    });

    // Identify high-risk devices (score >= 50)
    const highRiskDevices = devices.filter(d => d.riskScore >= 50);

    // ============================================
    // CHART DATA PREPARATION
    // ============================================
    
    // Platform coverage chart data
    const coverageData = [
      { name: 'Crowdstrike', value: hasCrowdstrike },
      { name: 'Azure AD', value: hasAzure },
      { name: 'Intune', value: hasIntune },
      { name: 'Freshdesk', value: hasFreshdesk },
      { name: 'Active Directory', value: hasActiveDirectory }
    ];

    // Operating system distribution
    const osCount = {};
    devices.forEach(d => {
      let os = 'Unknown';
      if (d.crowdstrike && d.crowdstrike.platform) {
        os = d.crowdstrike.platform;
      } else if (d.azure && d.azure.operatingSystem) {
        os = d.azure.operatingSystem;
      }
      osCount[os] = (osCount[os] || 0) + 1;
    });
    const osData = Object.entries(osCount).map(([name, value]) => ({ name, value }));

    // Windows-specific metrics
    const windowsDevices = devices.filter(d => {
      const os = d.crowdstrike?.platform || d.azure?.operatingSystem || d.activedirectory?.operatingSystem || '';
      return os.toLowerCase().includes('windows');
    });
    
    const windowsActiveWithin45 = windowsDevices.filter(d => {
      if (!d.lastSeen) return false;
      const daysSince = (now - d.lastSeen) / (1000 * 60 * 60 * 24);
      return daysSince <= 45;
    });

    // macOS-specific metrics
    const macOSDevices = devices.filter(d => {
      const os = d.crowdstrike?.platform || d.azure?.operatingSystem || d.activedirectory?.operatingSystem || '';
      return os.toLowerCase().includes('mac') || os.toLowerCase().includes('darwin');
    });
    
    const macOSActiveWithin45 = macOSDevices.filter(d => {
      if (!d.lastSeen) return false;
      const daysSince = (now - d.lastSeen) / (1000 * 60 * 60 * 24);
      return daysSince <= 45;
    });

    // iOS-specific metrics
    const iOSDevices = devices.filter(d => {
      const os = String(d.crowdstrike?.platform || d.azure?.operatingSystem || d.intune?.osVersion || '');
      return os.toLowerCase().includes('ios') || os.toLowerCase().includes('iphone') || os.toLowerCase().includes('ipad');
    });
    
    const iOSActiveWithin45 = iOSDevices.filter(d => {
      if (!d.lastSeen) return false;
      const daysSince = (now - d.lastSeen) / (1000 * 60 * 60 * 24);
      return daysSince <= 45;
    });

    // Android-specific metrics
    const androidDevices = devices.filter(d => {
      const os = String(d.crowdstrike?.platform || d.azure?.operatingSystem || d.intune?.osVersion || '');
      return os.toLowerCase().includes('android');
    });
    
    const androidActiveWithin45 = androidDevices.filter(d => {
      if (!d.lastSeen) return false;
      const daysSince = (now - d.lastSeen) / (1000 * 60 * 60 * 24);
      return daysSince <= 45;
    });

    // Disabled devices metrics (from Azure AD and Active Directory)
    const disabledDevicesAzure = devices.filter(d => 
      d.azure && (d.azure.accountEnabled === false || d.azure.accountEnabled === 'false' || d.azure.accountEnabled === 'False')
    );
    
    const disabledDevicesAD = devices.filter(d => 
      d.activedirectory && (d.activedirectory.enabled === false || d.activedirectory.enabled === 'false' || d.activedirectory.enabled === 'False')
    );
    
    // Total unique disabled devices (some may be in both systems)
    const allDisabledDevices = devices.filter(d => 
      (d.azure && (d.azure.accountEnabled === false || d.azure.accountEnabled === 'false' || d.azure.accountEnabled === 'False')) || 
      (d.activedirectory && (d.activedirectory.enabled === false || d.activedirectory.enabled === 'false' || d.activedirectory.enabled === 'False'))
    );
    
    // Disabled devices that were active within 45 days (recently disabled)
    const disabledActiveWithin45 = allDisabledDevices.filter(d => {
      if (!d.lastSeen) return false;
      const daysSince = (now - d.lastSeen) / (1000 * 60 * 60 * 24);
      return daysSince <= 45;
    });

    // Manufacturer distribution (top 8)
    const mfgCount = {};
    devices.forEach(d => {
      const mfg = d.manufacturer || 'Unknown';
      mfgCount[mfg] = (mfgCount[mfg] || 0) + 1;
    });
    const mfgData = Object.entries(mfgCount).map(([name, value]) => ({ name, value })).slice(0, 8);

    // Compliance status pie chart
    const complianceData = [
      { name: 'Compliant', value: totalDevices - nonCompliantDevices.length },
      { name: 'Non-Compliant', value: nonCompliantDevices.length }
    ];

    // ============================================
    // DEPARTMENT STATISTICS
    // Calculate detailed statistics for each department
    // ============================================
    const deptStats = {};
    devices.forEach(d => {
      const dept = d.department || 'Unassigned';
      if (!deptStats[dept]) {
        deptStats[dept] = {
          total: 0,
          protected: 0,
          compliant: 0,
          encrypted: 0,
          stale: 0,
          highRisk: 0
        };
      }
      deptStats[dept].total += 1;
      if (d.sources.includes('crowdstrike')) deptStats[dept].protected += 1;
      if ((d.azure && d.azure.isCompliant !== false) && (d.intune && d.intune.compliance !== 'Noncompliant')) {
        deptStats[dept].compliant += 1;
      }
      if (d.intune && d.intune.encrypted === 'Yes') deptStats[dept].encrypted += 1;
      if (d.lastSeen) {
        const daysSince = (now - d.lastSeen) / (1000 * 60 * 60 * 24);
        if (daysSince > 30) deptStats[dept].stale += 1;
      }
      if (d.riskScore >= 50) deptStats[dept].highRisk += 1;
    });

    // Format department data with calculated percentages
    const departmentData = Object.entries(deptStats).map(([name, stats]) => ({
      name,
      ...stats,
      protectionRate: stats.total > 0 ? Math.round((stats.protected / stats.total) * 100) : 0,
      complianceRate: stats.total > 0 ? Math.round((stats.compliant / stats.total) * 100) : 0
    })).sort((a, b) => b.total - a.total);

    // ============================================
    // RETURN ANALYTICS OBJECT
    // ============================================
    return {
      totalDevices,
      hasCrowdstrike,
      hasAzure,
      hasIntune,
      hasFreshdesk,
      hasActiveDirectory,
      unprotectedDevices: unprotectedDevices.length,
      nonCompliantDevices: nonCompliantDevices.length,
      detectionsDisabled: detectionsDisabled.length,
      unencryptedDevices: unencryptedDevices.length,
      staleDevices45: staleDevices45.length,
      staleDevices90: staleDevices90.length,
      needsReboot: needsReboot.length,
      unassignedDevices: unassignedDevices.length,
      highRiskDevices: highRiskDevices.length,
      windowsDevices: windowsDevices.length,
      windowsActiveWithin45: windowsActiveWithin45.length,
      macOSDevices: macOSDevices.length,
      macOSActiveWithin45: macOSActiveWithin45.length,
      iOSDevices: iOSDevices.length,
      iOSActiveWithin45: iOSActiveWithin45.length,
      androidDevices: androidDevices.length,
      androidActiveWithin45: androidActiveWithin45.length,
      disabledDevicesAzure: disabledDevicesAzure.length,
      disabledDevicesAD: disabledDevicesAD.length,
      allDisabledDevices: allDisabledDevices.length,
      disabledActiveWithin45: disabledActiveWithin45.length,
      coverageData,
      osData,
      mfgData,
      complianceData,
      departmentData,
      devices,
      alerts: []
    };
  }, [data]);

  // ============================================
  // UTILITY FUNCTIONS FOR UI
  // ============================================
  
  // Formats date objects for display
  const formatDate = (date) => {
    if (!date) return 'Never';
    return new Date(date).toLocaleString();
  };

  // Check if all required files have been uploaded
  const allFilesUploaded = files.crowdstrike && files.freshdesk && files.azure && files.intune && files.activedirectory;

  // ============================================
  // SEARCH AND PAGINATION
  // Filter devices based on search query across multiple fields
  // ============================================
  const filteredDevices = analytics ? analytics.devices.filter(device => 
    device.hostname.toLowerCase().includes(searchQuery.toLowerCase()) ||
    (device.user && device.user.toLowerCase().includes(searchQuery.toLowerCase())) ||
    (device.department && device.department.toLowerCase().includes(searchQuery.toLowerCase()))
  ) : [];

  // Calculate pagination values
  const totalPages = Math.ceil(filteredDevices.length / devicesPerPage);
  const startIndex = (currentPage - 1) * devicesPerPage;
  const endIndex = startIndex + devicesPerPage;
  const currentDevices = filteredDevices.slice(startIndex, endIndex);

  // ============================================
  // DYNAMIC STYLING CLASSES
  // CSS classes that change based on dark mode state
  // ============================================
  const bgClass = darkMode ? 'bg-gray-900' : 'bg-gray-50';
  const cardBg = darkMode ? 'bg-gray-800' : 'bg-white';
  const textPrimary = darkMode ? 'text-gray-100' : 'text-gray-900';
  const textSecondary = darkMode ? 'text-gray-400' : 'text-gray-600';
  const borderColor = darkMode ? 'border-gray-700' : 'border-gray-200';
  const hoverBg = darkMode ? 'hover:bg-gray-700' : 'hover:bg-gray-50';

  // ============================================
  // INFO TOOLTIP COMPONENT
  // Reusable tooltip component for displaying help information
  // ============================================
  const InfoTooltip = ({ title, description, source }) => {
    const [show, setShow] = useState(false);
    
    return (
      <div className="relative inline-block ml-2">
        <button
          onMouseEnter={() => setShow(true)}
          onMouseLeave={() => setShow(false)}
          className={`${textSecondary} hover:text-blue-500 transition-colors`}
        >
          <Info className="w-4 h-4" />
        </button>
        {show && (
          <div className={`absolute z-50 ${cardBg} ${textPrimary} p-3 rounded-lg shadow-xl border ${borderColor} w-64 bottom-full mb-2 left-1/2 transform -translate-x-1/2`}>
            <p className="font-semibold text-sm mb-1">{title}</p>
            <p className={`text-xs ${textSecondary} mb-2`}>{description}</p>
            {source && <p className={`text-xs ${textSecondary} italic border-t ${borderColor} pt-2`}>Source: {source}</p>}
          </div>
        )}
      </div>
    );
  };

  // ============================================
  // MAIN RENDER
  // ============================================
  return (
    <div className={`min-h-screen ${bgClass} p-6 transition-colors duration-200`}>
      <div className="max-w-7xl mx-auto">
        
        {/* HEADER SECTION - Logo, title, and dark mode toggle */}
        <div className="mb-8 flex justify-between items-start">
          <div className="flex items-center gap-4">
            <div className="relative">
              <img 
                src="https://www.voa.org/themes/custom/voa/logo.svg"
                alt="Volunteers of America Logo" 
                className="h-16 w-auto"
                style={{
                  filter: 'drop-shadow(0 0 10px rgba(0, 102, 178, 0.6)) drop-shadow(0 0 20px rgba(200, 16, 46, 0.4))',
                  animation: 'pulse 2s ease-in-out infinite'
                }}
                onError={(e) => {
                  e.target.src = 'data:image/svg+xml,%3Csvg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 200 100"%3E%3Ctext x="10" y="50" font-family="Arial" font-size="20" fill="%230066b2"%3EVOA%3C/text%3E%3C/svg%3E';
                }}
              />
            </div>
            <div>
              <h1 className={`text-3xl font-bold ${textPrimary} mb-2`}>IT Asset Management Dashboard</h1>
              <p className={textSecondary}>Unified view of device security, compliance, and asset management</p>
            </div>
          </div>
          <button
            onClick={() => setDarkMode(!darkMode)}
            className={`p-3 rounded-lg ${cardBg} ${textPrimary} shadow-md hover:shadow-lg transition-all`}
          >
            {darkMode ? <Sun className="w-6 h-6" /> : <Moon className="w-6 h-6" />}
          </button>
        </div>

        {/* FILE UPLOAD SECTION - CSV upload zones for all 5 platforms */}
        <div className={`${cardBg} rounded-lg shadow-md p-6 mb-6`}>
          <h2 className={`text-xl font-semibold mb-4 flex items-center gap-2 ${textPrimary}`}>
            <Upload className="w-5 h-5" />
            Upload CSV Files
            <InfoTooltip 
              title="CSV File Upload" 
              description="Upload all five CSV files from Crowdstrike, Freshdesk, Azure AD, Intune, and Active Directory to generate comprehensive device analytics and insights."
              source="User uploaded CSV files"
            />
          </h2>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-5 gap-4">
            {['crowdstrike', 'freshdesk', 'azure', 'intune', 'activedirectory'].map(fileType => (
              <div key={fileType} className={`border-2 border-dashed ${borderColor} rounded-lg p-4 hover:border-blue-500 transition-colors`}>
                <label className="cursor-pointer block">
                  <div className="flex flex-col items-center">
                    <Upload className={`w-8 h-8 ${textSecondary} mb-2`} />
                    <span className={`text-sm font-medium ${textPrimary} capitalize mb-1`}>{fileType}</span>
                    {files[fileType] ? (
                      <div className="text-center w-full">
                        <CheckCircle className="w-5 h-5 text-green-500 mx-auto mb-1" />
                        <span className={`text-xs ${textSecondary} block truncate px-2 max-w-full overflow-hidden text-ellipsis`} title={files[fileType]}>
                          {files[fileType]}
                        </span>
                        {lastUpdated[fileType] && (
                          <span className={`text-xs ${textSecondary} block mt-1`}>
                            {formatDate(lastUpdated[fileType])}
                          </span>
                        )}
                      </div>
                    ) : (
                      <span className={`text-xs ${textSecondary}`}>Click to upload</span>
                    )}
                  </div>
                  <input
                    type="file"
                    accept=".csv"
                    className="hidden"
                    onChange={(e) => handleFileUpload(fileType, e)}
                  />
                </label>
              </div>
            ))}
          </div>
        </div>

        {/* WARNING MESSAGE - Displayed when not all files are uploaded */}
        {!allFilesUploaded && (
          <div className="bg-yellow-50 dark:bg-yellow-900/20 border-l-4 border-yellow-400 p-4 mb-6">
            <div className="flex">
              <AlertTriangle className="w-5 h-5 text-yellow-400 mr-3" />
              <p className="text-sm text-yellow-700 dark:text-yellow-300">
                Please upload all five CSV files to view the complete dashboard analytics.
              </p>
            </div>
          </div>
        )}

        {/* ANALYTICS DASHBOARD - Only renders if analytics data is available */}
        {analytics && (
          <>
            {/* KEY METRICS CARDS (TOP ROW) - 4 primary KPIs */}
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-6">
              
              <div className={`${cardBg} rounded-lg shadow-md p-6`}>
                <div className="flex items-center justify-between">
                  <div>
                    <p className={`text-sm ${textSecondary} mb-1 flex items-center`}>
                      Total Devices
                      <InfoTooltip 
                        title="Total Devices" 
                        description="The total number of unique devices detected across all platforms (Crowdstrike, Azure AD, Intune, and Freshdesk)."
                        source="All platforms combined"
                      />
                    </p>
                    <p className={`text-3xl font-bold ${textPrimary}`}>{analytics.totalDevices}</p>
                  </div>
                  <HardDrive className="w-12 h-12 text-blue-500" />
                </div>
              </div>

              <div className={`${cardBg} rounded-lg shadow-md p-6`}>
                <div className="flex items-center justify-between">
                  <div>
                    <p className={`text-sm ${textSecondary} mb-1 flex items-center`}>
                      Unprotected
                      <InfoTooltip 
                        title="Unprotected Devices" 
                        description="Devices that exist in Azure AD or Intune but are missing Crowdstrike endpoint protection. These devices are vulnerable to threats."
                        source="Crowdstrike (absence check)"
                      />
                    </p>
                    <p className="text-3xl font-bold text-red-600">{analytics.unprotectedDevices}</p>
                    <p className={`text-xs ${textSecondary} mt-1`}>Missing Crowdstrike</p>
                  </div>
                  <Shield className="w-12 h-12 text-red-500" />
                </div>
              </div>

              <div className={`${cardBg} rounded-lg shadow-md p-6`}>
                <div className="flex items-center justify-between">
                  <div>
                    <p className={`text-sm ${textSecondary} mb-1 flex items-center`}>
                      Non-Compliant
                      <InfoTooltip 
                        title="Non-Compliant Devices" 
                        description="Devices that fail compliance policies in Azure AD or Intune. These may be missing updates, required configurations, or security policies."
                        source="Azure AD & Intune compliance status"
                      />
                    </p>
                    <p className="text-3xl font-bold text-orange-600">{analytics.nonCompliantDevices}</p>
                    <p className={`text-xs ${textSecondary} mt-1`}>Compliance issues</p>
                  </div>
                  <XCircle className="w-12 h-12 text-orange-500" />
                </div>
              </div>

              <div className={`${cardBg} rounded-lg shadow-md p-6`}>
                <div className="flex items-center justify-between">
                  <div>
                    <p className={`text-sm ${textSecondary} mb-1 flex items-center`}>
                      High Risk
                      <InfoTooltip 
                        title="High Risk Devices" 
                        description="Devices with a risk score of 50 or higher. Risk is calculated based on missing protection, disabled detections, non-compliance, lack of encryption, and stale activity."
                        source="Calculated from all platforms"
                      />
                    </p>
                    <p className="text-3xl font-bold text-red-600">{analytics.highRiskDevices}</p>
                    <p className={`text-xs ${textSecondary} mt-1`}>Risk score ≥50</p>
                  </div>
                  <AlertTriangle className="w-12 h-12 text-red-500" />
                </div>
              </div>
            </div>

            {/* SECONDARY METRICS ROW - Additional important metrics */}
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4 mb-6">
              <div className={`${cardBg} rounded-lg shadow p-4`}>
                <p className={`text-sm ${textSecondary} flex items-center`}>
                  Seen within 45 days
                  <InfoTooltip 
                    title="Active Devices (45 days)" 
                    description="Devices that have been seen or checked in within the last 45 days. These are considered actively managed devices."
                    source="Crowdstrike Last Seen, Azure Last Sign-in, Intune Last Check-in"
                  />
                </p>
                <p className="text-2xl font-bold text-green-600">{analytics.totalDevices - analytics.staleDevices45}</p>
              </div>
              <div className={`${cardBg} rounded-lg shadow p-4`}>
                <p className={`text-sm ${textSecondary} flex items-center`}>
                  Stale 90+ days
                  <InfoTooltip 
                    title="Stale Devices (90+ days)" 
                    description="Devices with no activity for 90+ days. Critical concern - likely abandoned or lost devices that should be investigated immediately."
                    source="Crowdstrike Last Seen, Azure Last Sign-in, Intune Last Check-in"
                  />
                </p>
                <p className="text-2xl font-bold text-red-600">{analytics.staleDevices90}</p>
              </div>
              <div className={`${cardBg} rounded-lg shadow p-4`}>
                <p className={`text-sm ${textSecondary} flex items-center`}>
                  Unencrypted
                  <InfoTooltip 
                    title="Unencrypted Devices" 
                    description="Devices without disk encryption enabled. Data on these devices is vulnerable if lost or stolen."
                    source="Intune Encrypted field"
                  />
                </p>
                <p className="text-2xl font-bold text-orange-600">{analytics.unencryptedDevices}</p>
              </div>
              <div className={`${cardBg} rounded-lg shadow p-4`}>
                <p className={`text-sm ${textSecondary} flex items-center`}>
                  Unassigned
                  <InfoTooltip 
                    title="Unassigned Devices" 
                    description="Devices with no user assignment. These devices need to be assigned to users for proper accountability and management."
                    source="Crowdstrike Last User, Intune Primary User, Freshdesk Used By"
                  />
                </p>
                <p className={`text-2xl font-bold ${textSecondary}`}>{analytics.unassignedDevices}</p>
              </div>
            </div>

            {/* OS DEVICES DRILL-DOWN METRICS */}
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-6">
              <div className={`${cardBg} rounded-lg shadow-md p-6`}>
                <div className="flex items-center justify-between mb-4">
                  <h3 className={`text-lg font-semibold ${textPrimary} flex items-center gap-2`}>
                    Windows Devices
                    <InfoTooltip 
                      title="Windows Devices" 
                      description="Total count of all Windows-based devices and how many are active within 45 days, identified from Crowdstrike, Azure AD, or Active Directory."
                      source="Crowdstrike Platform, Azure OS, Active Directory OS"
                    />
                  </h3>
                </div>
                <div className="space-y-4">
                  <div className="flex items-center justify-between">
                    <div>
                      <p className="text-4xl font-bold text-blue-600">{analytics.windowsDevices}</p>
                      <p className={`text-sm ${textSecondary} mt-1`}>Total Windows systems</p>
                    </div>
                    <div className="text-right">
                      <p className={`text-sm ${textSecondary} mb-1`}>% of Total Devices</p>
                      <p className="text-2xl font-semibold text-blue-600">
                        {analytics.totalDevices > 0 ? Math.round((analytics.windowsDevices / analytics.totalDevices) * 100) : 0}%
                      </p>
                    </div>
                  </div>
                  <div className={`border-t ${borderColor} pt-4`}>
                    <div className="flex items-center justify-between">
                      <div>
                        <p className="text-3xl font-bold text-green-600">{analytics.windowsActiveWithin45}</p>
                        <p className={`text-sm ${textSecondary} mt-1`}>Active within 45 days</p>
                      </div>
                      <div className="text-right">
                        <p className={`text-sm ${textSecondary} mb-1`}>% Active</p>
                        <p className="text-2xl font-semibold text-green-600">
                          {analytics.windowsDevices > 0 ? Math.round((analytics.windowsActiveWithin45 / analytics.windowsDevices) * 100) : 0}%
                        </p>
                      </div>
                    </div>
                  </div>
                </div>
              </div>

              <div className={`${cardBg} rounded-lg shadow-md p-6`}>
                <div className="flex items-center justify-between mb-4">
                  <h3 className={`text-lg font-semibold ${textPrimary} flex items-center gap-2`}>
                    macOS Devices
                    <InfoTooltip 
                      title="macOS Devices" 
                      description="Total count of all macOS-based devices and how many are active within 45 days, identified from Crowdstrike, Azure AD, or Active Directory."
                      source="Crowdstrike Platform, Azure OS, Active Directory OS"
                    />
                  </h3>
                </div>
                <div className="space-y-4">
                  <div className="flex items-center justify-between">
                    <div>
                      <p className="text-4xl font-bold text-purple-600">{analytics.macOSDevices}</p>
                      <p className={`text-sm ${textSecondary} mt-1`}>Total macOS systems</p>
                    </div>
                    <div className="text-right">
                      <p className={`text-sm ${textSecondary} mb-1`}>% of Total Devices</p>
                      <p className="text-2xl font-semibold text-purple-600">
                        {analytics.totalDevices > 0 ? Math.round((analytics.macOSDevices / analytics.totalDevices) * 100) : 0}%
                      </p>
                    </div>
                  </div>
                  <div className={`border-t ${borderColor} pt-4`}>
                    <div className="flex items-center justify-between">
                      <div>
                        <p className="text-3xl font-bold text-green-600">{analytics.macOSActiveWithin45}</p>
                        <p className={`text-sm ${textSecondary} mt-1`}>Active within 45 days</p>
                      </div>
                      <div className="text-right">
                        <p className={`text-sm ${textSecondary} mb-1`}>% Active</p>
                        <p className="text-2xl font-semibold text-green-600">
                          {analytics.macOSDevices > 0 ? Math.round((analytics.macOSActiveWithin45 / analytics.macOSDevices) * 100) : 0}%
                        </p>
                      </div>
                    </div>
                  </div>
                </div>
              </div>

              <div className={`${cardBg} rounded-lg shadow-md p-6`}>
                <div className="flex items-center justify-between mb-4">
                  <h3 className={`text-lg font-semibold ${textPrimary} flex items-center gap-2`}>
                    iOS Devices
                    <InfoTooltip 
                      title="iOS Devices" 
                      description="Total count of all iOS-based devices (iPhone, iPad) and how many are active within 45 days, identified from Crowdstrike, Azure AD, or Intune."
                      source="Crowdstrike Platform, Azure OS, Intune OS Version"
                    />
                  </h3>
                </div>
                <div className="space-y-4">
                  <div className="flex items-center justify-between">
                    <div>
                      <p className="text-4xl font-bold text-orange-600">{analytics.iOSDevices}</p>
                      <p className={`text-sm ${textSecondary} mt-1`}>Total iOS devices</p>
                    </div>
                    <div className="text-right">
                      <p className={`text-sm ${textSecondary} mb-1`}>% of Total Devices</p>
                      <p className="text-2xl font-semibold text-orange-600">
                        {analytics.totalDevices > 0 ? Math.round((analytics.iOSDevices / analytics.totalDevices) * 100) : 0}%
                      </p>
                    </div>
                  </div>
                  <div className={`border-t ${borderColor} pt-4`}>
                    <div className="flex items-center justify-between">
                      <div>
                        <p className="text-3xl font-bold text-green-600">{analytics.iOSActiveWithin45}</p>
                        <p className={`text-sm ${textSecondary} mt-1`}>Active within 45 days</p>
                      </div>
                      <div className="text-right">
                        <p className={`text-sm ${textSecondary} mb-1`}>% Active</p>
                        <p className="text-2xl font-semibold text-green-600">
                          {analytics.iOSDevices > 0 ? Math.round((analytics.iOSActiveWithin45 / analytics.iOSDevices) * 100) : 0}%
                        </p>
                      </div>
                    </div>
                  </div>
                </div>
              </div>

              <div className={`${cardBg} rounded-lg shadow-md p-6`}>
                <div className="flex items-center justify-between mb-4">
                  <h3 className={`text-lg font-semibold ${textPrimary} flex items-center gap-2`}>
                    Android Devices
                    <InfoTooltip 
                      title="Android Devices" 
                      description="Total count of all Android-based devices and how many are active within 45 days, identified from Crowdstrike, Azure AD, or Intune."
                      source="Crowdstrike Platform, Azure OS, Intune OS Version"
                    />
                  </h3>
                </div>
                <div className="space-y-4">
                  <div className="flex items-center justify-between">
                    <div>
                      <p className="text-4xl font-bold text-teal-600">{analytics.androidDevices}</p>
                      <p className={`text-sm ${textSecondary} mt-1`}>Total Android devices</p>
                    </div>
                    <div className="text-right">
                      <p className={`text-sm ${textSecondary} mb-1`}>% of Total Devices</p>
                      <p className="text-2xl font-semibold text-teal-600">
                        {analytics.totalDevices > 0 ? Math.round((analytics.androidDevices / analytics.totalDevices) * 100) : 0}%
                      </p>
                    </div>
                  </div>
                  <div className={`border-t ${borderColor} pt-4`}>
                    <div className="flex items-center justify-between">
                      <div>
                        <p className="text-3xl font-bold text-green-600">{analytics.androidActiveWithin45}</p>
                        <p className={`text-sm ${textSecondary} mt-1`}>Active within 45 days</p>
                      </div>
                      <div className="text-right">
                        <p className={`text-sm ${textSecondary} mb-1`}>% Active</p>
                        <p className="text-2xl font-semibold text-green-600">
                          {analytics.androidDevices > 0 ? Math.round((analytics.androidActiveWithin45 / analytics.androidDevices) * 100) : 0}%
                        </p>
                      </div>
                    </div>
                  </div>
                </div>
              </div>
            </div>

            {/* DISABLED DEVICES DRILL-DOWN */}
            <div className={`${cardBg} rounded-lg shadow-md p-6 mb-6`}>
              <div className="flex items-center justify-between mb-4">
                <h3 className={`text-xl font-semibold ${textPrimary} flex items-center gap-2`}>
                  Disabled Devices
                  <InfoTooltip 
                    title="Disabled Devices" 
                    description="Devices that have been disabled in Azure AD or Active Directory. These devices are no longer allowed to access resources but may still exist in other systems."
                    source="Azure AD accountEnabled field, Active Directory Enabled field"
                  />
                </h3>
              </div>
              
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
                <div className="flex items-center justify-between p-4 bg-red-50 dark:bg-red-900/20 rounded-lg border-l-4 border-red-500">
                  <div>
                    <p className={`text-sm ${textSecondary} mb-1`}>Total Disabled</p>
                    <p className="text-3xl font-bold text-red-600">{analytics.allDisabledDevices}</p>
                    <p className={`text-xs ${textSecondary} mt-1`}>Across all systems</p>
                  </div>
                  <XCircle className="w-12 h-12 text-red-400" />
                </div>
                
                <div className="flex items-center justify-between p-4 bg-green-50 dark:bg-green-900/20 rounded-lg border-l-4 border-green-500">
                  <div>
                    <p className={`text-sm ${textSecondary} mb-1`}>Active within 45 days</p>
                    <p className="text-3xl font-bold text-green-600">{analytics.disabledActiveWithin45}</p>
                    <p className={`text-xs ${textSecondary} mt-1`}>Recently disabled</p>
                  </div>
                  <CheckCircle className="w-12 h-12 text-green-400" />
                </div>
                
                <div className="flex items-center justify-between p-4 bg-orange-50 dark:bg-orange-900/20 rounded-lg border-l-4 border-orange-500">
                  <div>
                    <p className={`text-sm ${textSecondary} mb-1`}>Disabled in Azure AD</p>
                    <p className="text-3xl font-bold text-orange-600">{analytics.disabledDevicesAzure}</p>
                    <p className={`text-xs ${textSecondary} mt-1`}>Account disabled</p>
                  </div>
                  <Shield className="w-12 h-12 text-orange-400" />
                </div>
                
                <div className="flex items-center justify-between p-4 bg-yellow-50 dark:bg-yellow-900/20 rounded-lg border-l-4 border-yellow-500">
                  <div>
                    <p className={`text-sm ${textSecondary} mb-1`}>Disabled in Active Directory</p>
                    <p className="text-3xl font-bold text-yellow-600">{analytics.disabledDevicesAD}</p>
                    <p className={`text-xs ${textSecondary} mt-1`}>Account disabled</p>
                  </div>
                  <HardDrive className="w-12 h-12 text-yellow-400" />
                </div>
              </div>
            </div>

            {/* DEPARTMENT STATISTICS TABLE */}
            <div className={`${cardBg} rounded-lg shadow-md p-6 mb-6`}>
              <h2 className={`text-xl font-semibold mb-4 flex items-center gap-2 ${textPrimary}`}>
                <Users className="w-5 h-5" />
                Department Statistics
                <InfoTooltip 
                  title="Department Statistics" 
                  description="Breakdown of device security and compliance metrics by department. Shows protection coverage, compliance rates, encryption status, and risk distribution across organizational units."
                  source="Freshdesk Department field"
                />
              </h2>
              <div className="overflow-x-auto">
                <table className="w-full">
                  <thead>
                    <tr className={`border-b-2 ${borderColor}`}>
                      <th className={`text-left py-3 px-4 text-sm font-semibold ${textPrimary}`}>Department</th>
                      <th className={`text-center py-3 px-4 text-sm font-semibold ${textPrimary}`}>Total</th>
                      <th className={`text-center py-3 px-4 text-sm font-semibold ${textPrimary}`}>Protected</th>
                      <th className={`text-center py-3 px-4 text-sm font-semibold ${textPrimary}`}>Protection %</th>
                      <th className={`text-center py-3 px-4 text-sm font-semibold ${textPrimary}`}>Compliant</th>
                      <th className={`text-center py-3 px-4 text-sm font-semibold ${textPrimary}`}>Compliance %</th>
                      <th className={`text-center py-3 px-4 text-sm font-semibold ${textPrimary}`}>Encrypted</th>
                      <th className={`text-center py-3 px-4 text-sm font-semibold ${textPrimary}`}>Stale</th>
                      <th className={`text-center py-3 px-4 text-sm font-semibold ${textPrimary}`}>High Risk</th>
                    </tr>
                  </thead>
                  <tbody>
                    {analytics.departmentData.map((dept, idx) => (
                      <tr key={idx} className={`border-b ${borderColor} ${hoverBg}`}>
                        <td className={`py-3 px-4 text-sm font-medium ${textPrimary}`}>{dept.name}</td>
                        <td className={`text-center py-3 px-4 text-sm ${textPrimary}`}>{dept.total}</td>
                        <td className={`text-center py-3 px-4 text-sm ${textPrimary}`}>{dept.protected}</td>
                        <td className="text-center py-3 px-4">
                          <span className={`inline-block px-2 py-1 rounded text-xs font-semibold ${
                            dept.protectionRate >= 90 ? 'bg-green-100 text-green-800 dark:bg-green-900/30 dark:text-green-400' :
                            dept.protectionRate >= 70 ? 'bg-yellow-100 text-yellow-800 dark:bg-yellow-900/30 dark:text-yellow-400' :
                            'bg-red-100 text-red-800 dark:bg-red-900/30 dark:text-red-400'
                          }`}>
                            {dept.protectionRate}%
                          </span>
                        </td>
                        <td className={`text-center py-3 px-4 text-sm ${textPrimary}`}>{dept.compliant}</td>
                        <td className="text-center py-3 px-4">
                          <span className={`inline-block px-2 py-1 rounded text-xs font-semibold ${
                            dept.complianceRate >= 90 ? 'bg-green-100 text-green-800 dark:bg-green-900/30 dark:text-green-400' :
                            dept.complianceRate >= 70 ? 'bg-yellow-100 text-yellow-800 dark:bg-yellow-900/30 dark:text-yellow-400' :
                            'bg-red-100 text-red-800 dark:bg-red-900/30 dark:text-red-400'
                          }`}>
                            {dept.complianceRate}%
                          </span>
                        </td>
                        <td className={`text-center py-3 px-4 text-sm ${textPrimary}`}>{dept.encrypted}</td>
                        <td className="text-center py-3 px-4">
                          <span className={`text-sm font-semibold ${dept.stale > 0 ? 'text-red-600' : textPrimary}`}>
                            {dept.stale}
                          </span>
                        </td>
                        <td className="text-center py-3 px-4">
                          <span className={`text-sm font-semibold ${dept.highRisk > 0 ? 'text-red-600' : textPrimary}`}>
                            {dept.highRisk}
                          </span>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>

            {/* CHARTS ROW 1: Platform Coverage & Compliance */}
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 mb-6">
              <div className={`${cardBg} rounded-lg shadow-md p-6`}>
                <h2 className={`text-xl font-semibold mb-4 ${textPrimary} flex items-center`}>
                  Platform Coverage
                  <InfoTooltip 
                    title="Platform Coverage" 
                    description="Number of devices registered in each management platform. Helps identify coverage gaps and integration status."
                    source="All platforms"
                  />
                </h2>
                <ResponsiveContainer width="100%" height={300}>
                  <BarChart data={analytics.coverageData}>
                    <CartesianGrid strokeDasharray="3 3" stroke={darkMode ? '#374151' : '#e5e7eb'} />
                    <XAxis dataKey="name" stroke={darkMode ? '#9ca3af' : '#6b7280'} />
                    <YAxis stroke={darkMode ? '#9ca3af' : '#6b7280'} />
                    <Tooltip 
                      contentStyle={{ 
                        backgroundColor: darkMode ? '#1f2937' : '#ffffff',
                        border: `1px solid ${darkMode ? '#374151' : '#e5e7eb'}`,
                        color: darkMode ? '#f3f4f6' : '#111827'
                      }}
                    />
                    <Bar dataKey="value" fill="#3b82f6" />
                  </BarChart>
                </ResponsiveContainer>
              </div>

              <div className={`${cardBg} rounded-lg shadow-md p-6`}>
                <h2 className={`text-xl font-semibold mb-4 ${textPrimary} flex items-center`}>
                  Compliance Status
                  <InfoTooltip 
                    title="Compliance Status" 
                    description="Overall compliance rate across all managed devices. Compliant devices meet all organizational security and configuration policies."
                    source="Azure AD & Intune compliance"
                  />
                </h2>
                <ResponsiveContainer width="100%" height={300}>
                  <PieChart>
                    <Pie
                      data={analytics.complianceData}
                      cx="50%"
                      cy="50%"
                      labelLine={false}
                      label={entry => `${entry.name}: ${entry.value}`}
                      outerRadius={100}
                      fill="#8884d8"
                      dataKey="value"
                    >
                      {analytics.complianceData.map((entry, index) => (
                        <Cell key={`cell-${index}`} fill={index === 0 ? '#10b981' : '#ef4444'} />
                      ))}
                    </Pie>
                    <Tooltip 
                      contentStyle={{ 
                        backgroundColor: darkMode ? '#1f2937' : '#ffffff',
                        border: `1px solid ${darkMode ? '#374151' : '#e5e7eb'}`,
                        color: darkMode ? '#f3f4f6' : '#111827'
                      }}
                    />
                    <Legend />
                  </PieChart>
                </ResponsiveContainer>
              </div>
            </div>

            {/* CHARTS ROW 2: OS Distribution & Manufacturers */}
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 mb-6">
              <div className={`${cardBg} rounded-lg shadow-md p-6`}>
                <h2 className={`text-xl font-semibold mb-4 ${textPrimary} flex items-center`}>
                  Operating System Distribution
                  <InfoTooltip 
                    title="OS Distribution" 
                    description="Breakdown of devices by operating system type and version. Useful for update planning and compatibility management."
                    source="Crowdstrike Platform, Azure OS"
                  />
                </h2>
                <ResponsiveContainer width="100%" height={300}>
                  <PieChart>
                    <Pie
                      data={analytics.osData}
                      cx="50%"
                      cy="50%"
                      labelLine={false}
                      label={false}
                      outerRadius={80}
                      fill="#8884d8"
                      dataKey="value"
                    >
                      {analytics.osData.map((entry, index) => (
                        <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                      ))}
                    </Pie>
                    <Tooltip 
                      contentStyle={{ 
                        backgroundColor: darkMode ? '#1f2937' : '#ffffff',
                        border: `1px solid ${darkMode ? '#374151' : '#e5e7eb'}`,
                        color: darkMode ? '#f3f4f6' : '#111827'
                      }}
                    />
                    <Legend />
                  </PieChart>
                </ResponsiveContainer>
              </div>

              <div className={`${cardBg} rounded-lg shadow-md p-6`}>
                <h2 className={`text-xl font-semibold mb-4 ${textPrimary} flex items-center`}>
                  Top Manufacturers
                  <InfoTooltip 
                    title="Top Manufacturers" 
                    description="Most common device manufacturers in your environment. Helps with procurement decisions and vendor management."
                    source="Crowdstrike, Intune, Freshdesk Manufacturer fields"
                  />
                </h2>
                <ResponsiveContainer width="100%" height={300}>
                  <BarChart data={analytics.mfgData}>
                    <CartesianGrid strokeDasharray="3 3" stroke={darkMode ? '#374151' : '#e5e7eb'} />
                    <XAxis dataKey="name" stroke={darkMode ? '#9ca3af' : '#6b7280'} />
                    <YAxis stroke={darkMode ? '#9ca3af' : '#6b7280'} />
                    <Tooltip 
                      contentStyle={{ 
                        backgroundColor: darkMode ? '#1f2937' : '#ffffff',
                        border: `1px solid ${darkMode ? '#374151' : '#e5e7eb'}`,
                        color: darkMode ? '#f3f4f6' : '#111827'
                      }}
                    />
                    <Bar dataKey="value" fill="#8b5cf6" />
                  </BarChart>
                </ResponsiveContainer>
              </div>
            </div>

            {/* DEVICE DETAILS TABLE - Comprehensive searchable and paginated table */}
            <div className={`${cardBg} rounded-lg shadow-md p-6 mb-6`}>
              <div className="flex justify-between items-center mb-4 flex-wrap gap-4">
                <h2 className={`text-xl font-semibold flex items-center gap-2 ${textPrimary}`}>
                  Device Details
                  <InfoTooltip 
                    title="Device Details" 
                    description="Complete list of all devices with key information. Use search and pagination to browse. Source indicators show which platforms each device is registered in."
                    source="All platforms combined"
                  />
                  <button
                    onClick={() => setShowColumnInfo(!showColumnInfo)}
                    className={`ml-2 p-1 rounded ${textSecondary} hover:text-blue-500`}
                    title="Toggle column info"
                  >
                    {showColumnInfo ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                  </button>
                </h2>
                <div className="flex items-center gap-4">
                  <div className="relative">
                    <Search className={`absolute left-3 top-1/2 transform -translate-y-1/2 w-4 h-4 ${textSecondary}`} />
                    <input
                      type="text"
                      placeholder="Search devices..."
                      value={searchQuery}
                      onChange={(e) => {
                        setSearchQuery(e.target.value);
                        setCurrentPage(1);
                      }}
                      className={`pl-10 pr-4 py-2 rounded-lg border ${borderColor} ${cardBg} ${textPrimary} focus:outline-none focus:ring-2 focus:ring-blue-500`}
                    />
                  </div>
                  <div className="flex items-center gap-2">
                    <button
                      onClick={() => setCurrentPage(Math.max(1, currentPage - 1))}
                      disabled={currentPage === 1}
                      className={`p-2 rounded ${currentPage === 1 ? 'opacity-50 cursor-not-allowed' : 'hover:bg-gray-200 dark:hover:bg-gray-700'} ${textPrimary}`}
                    >
                      <ChevronLeft className="w-5 h-5" />
                    </button>
                    <span className={`text-sm ${textSecondary}`}>
                      Page {currentPage} of {totalPages} ({filteredDevices.length} devices)
                    </span>
                    <button
                      onClick={() => setCurrentPage(Math.min(totalPages, currentPage + 1))}
                      disabled={currentPage === totalPages}
                      className={`p-2 rounded ${currentPage === totalPages ? 'opacity-50 cursor-not-allowed' : 'hover:bg-gray-200 dark:hover:bg-gray-700'} ${textPrimary}`}
                    >
                      <ChevronRight className="w-5 h-5" />
                    </button>
                  </div>
                </div>
              </div>

              {showColumnInfo && (
                <div className={`mb-4 p-4 rounded-lg border-l-4 border-blue-500 ${textPrimary} ${darkMode ? 'bg-blue-900/30' : 'bg-blue-50'}`}>
                  <p className="text-sm font-semibold mb-2">Column Information:</p>
                  <ul className="text-xs space-y-1">
                    <li><strong>Hostname:</strong> Device name (from all platforms)</li>
                    <li><strong>User:</strong> Assigned user (Crowdstrike, Intune, Freshdesk)</li>
                    <li><strong>Department:</strong> Department assignment (Freshdesk)</li>
                    <li><strong>Sources:</strong> Blue=Crowdstrike, Green=Azure, Purple=Intune, Orange=Freshdesk, Teal=Active Directory</li>
                    <li><strong>Last Seen:</strong> Most recent activity (Crowdstrike, Azure, Intune)</li>
                    <li><strong>Risk:</strong> Calculated score (0-100) based on security factors</li>
                    <li><strong>Status:</strong> Current device state summary</li>
                  </ul>
                </div>
              )}

              <div className="overflow-x-auto">
                <table className="w-full text-sm">
                  <thead>
                    <tr className={`border-b-2 ${borderColor}`}>
                      <th className={`text-left py-3 px-4 font-semibold ${textPrimary}`}>Hostname</th>
                      <th className={`text-left py-3 px-4 font-semibold ${textPrimary}`}>User</th>
                      <th className={`text-left py-3 px-4 font-semibold ${textPrimary}`}>Department</th>
                      <th className={`text-center py-3 px-4 font-semibold ${textPrimary}`}>Sources</th>
                      <th className={`text-center py-3 px-4 font-semibold ${textPrimary}`}>Last Seen</th>
                      <th className={`text-center py-3 px-4 font-semibold ${textPrimary}`}>Risk</th>
                      <th className={`text-center py-3 px-4 font-semibold ${textPrimary}`}>Status</th>
                    </tr>
                  </thead>
                  <tbody>
                    {currentDevices.map((device, idx) => {
                      const daysSinceLastSeen = device.lastSeen 
                        ? Math.floor((new Date() - device.lastSeen) / (1000 * 60 * 60 * 24))
                        : null;
                      
                      return (
                        <tr key={idx} className={`border-b ${borderColor} ${hoverBg}`}>
                          <td className={`py-3 px-4 font-medium ${textPrimary}`}>{device.hostname}</td>
                          <td className={`py-3 px-4 ${textSecondary}`}>{device.user || 'Unassigned'}</td>
                          <td className={`py-3 px-4 ${textSecondary}`}>{device.department || 'N/A'}</td>
                          <td className="text-center py-3 px-4 relative">
                            <div className="flex justify-center gap-1">
                              {device.sources.includes('crowdstrike') && (
                                <div className="group relative">
                                  <span className="inline-block w-3 h-3 rounded-full bg-blue-500 cursor-help"></span>
                                  <span className={`invisible group-hover:visible absolute top-full left-1/2 transform -translate-x-1/2 mt-2 px-2 py-1 text-xs ${cardBg} ${textPrimary} rounded shadow-lg whitespace-nowrap z-10 border ${borderColor}`}>
                                    Crowdstrike
                                  </span>
                                </div>
                              )}
                              {device.sources.includes('azure') && (
                                <div className="group relative">
                                  <span className="inline-block w-3 h-3 rounded-full bg-green-500 cursor-help"></span>
                                  <span className={`invisible group-hover:visible absolute top-full left-1/2 transform -translate-x-1/2 mt-2 px-2 py-1 text-xs ${cardBg} ${textPrimary} rounded shadow-lg whitespace-nowrap z-10 border ${borderColor}`}>
                                    Azure AD
                                  </span>
                                </div>
                              )}
                              {device.sources.includes('intune') && (
                                <div className="group relative">
                                  <span className="inline-block w-3 h-3 rounded-full bg-purple-500 cursor-help"></span>
                                  <span className={`invisible group-hover:visible absolute top-full left-1/2 transform -translate-x-1/2 mt-2 px-2 py-1 text-xs ${cardBg} ${textPrimary} rounded shadow-lg whitespace-nowrap z-10 border ${borderColor}`}>
                                    Intune
                                  </span>
                                </div>
                              )}
                              {device.sources.includes('freshdesk') && (
                                <div className="group relative">
                                  <span className="inline-block w-3 h-3 rounded-full bg-orange-500 cursor-help"></span>
                                  <span className={`invisible group-hover:visible absolute top-full left-1/2 transform -translate-x-1/2 mt-2 px-2 py-1 text-xs ${cardBg} ${textPrimary} rounded shadow-lg whitespace-nowrap z-10 border ${borderColor}`}>
                                    Freshdesk
                                  </span>
                                </div>
                              )}
                              {device.sources.includes('activedirectory') && (
                                <div className="group relative">
                                  <span className="inline-block w-3 h-3 rounded-full bg-teal-500 cursor-help"></span>
                                  <span className={`invisible group-hover:visible absolute top-full left-1/2 transform -translate-x-1/2 mt-2 px-2 py-1 text-xs ${cardBg} ${textPrimary} rounded shadow-lg whitespace-nowrap z-10 border ${borderColor}`}>
                                    Active Directory
                                  </span>
                                </div>
                              )}
                            </div>
                          </td>
                          <td className={`text-center py-3 px-4 ${textSecondary}`}>
                            {daysSinceLastSeen !== null ? (
                              <span className={daysSinceLastSeen > 90 ? 'text-red-600 font-semibold' : daysSinceLastSeen > 30 ? 'text-orange-600' : ''}>
                                {daysSinceLastSeen}d ago
                              </span>
                            ) : 'N/A'}
                          </td>
                          <td className="text-center py-3 px-4">
                            <span className={`inline-block px-2 py-1 rounded text-xs font-semibold ${
                              device.riskScore >= 50 ? 'bg-red-100 text-red-800 dark:bg-red-900/30 dark:text-red-400' :
                              device.riskScore >= 30 ? 'bg-orange-100 text-orange-800 dark:bg-orange-900/30 dark:text-orange-400' :
                              device.riskScore >= 15 ? 'bg-yellow-100 text-yellow-800 dark:bg-yellow-900/30 dark:text-yellow-400' :
                              'bg-green-100 text-green-800 dark:bg-green-900/30 dark:text-green-400'
                            }`}>
                              {device.riskScore}
                            </span>
                          </td>
                          <td className="text-center py-3 px-4">
                            {!device.sources.includes('crowdstrike') ? (
                              <span className="text-red-600 text-xs font-semibold">No AV</span>
                            ) : device.crowdstrike?.detectionsDisabled === 'Yes' ? (
                              <span className="text-red-600 text-xs font-semibold">Det. Off</span>
                            ) : (device.azure?.isCompliant === false || device.intune?.compliance === 'Noncompliant') ? (
                              <span className="text-orange-600 text-xs font-semibold">Non-Comp</span>
                            ) : (
                              <span className="text-green-600 text-xs font-semibold">OK</span>
                            )}
                          </td>
                        </tr>
                      );
                    })}
                  </tbody>
                </table>
              </div>
              
              {/* Bottom pagination controls */}
              <div className="flex items-center justify-center gap-2 mt-4 pt-4 border-t border-gray-200 dark:border-gray-700">
                <button
                  onClick={() => setCurrentPage(Math.max(1, currentPage - 1))}
                  disabled={currentPage === 1}
                  className={`p-2 rounded ${currentPage === 1 ? 'opacity-50 cursor-not-allowed' : 'hover:bg-gray-200 dark:hover:bg-gray-700'} ${textPrimary}`}
                >
                  <ChevronLeft className="w-5 h-5" />
                </button>
                <span className={`text-sm ${textSecondary}`}>
                  Page {currentPage} of {totalPages} ({filteredDevices.length} devices)
                </span>
                <button
                  onClick={() => setCurrentPage(Math.min(totalPages, currentPage + 1))}
                  disabled={currentPage === totalPages}
                  className={`p-2 rounded ${currentPage === totalPages ? 'opacity-50 cursor-not-allowed' : 'hover:bg-gray-200 dark:hover:bg-gray-700'} ${textPrimary}`}
                >
                  <ChevronRight className="w-5 h-5" />
                </button>
              </div>
            </div>
          </>
        )}
      </div>
      
      {/* CUSTOM CSS ANIMATIONS - Pulse animation for logo */}
      <style>{`
        @keyframes pulse {
          0%, 100% {
            opacity: 1;
          }
          50% {
            opacity: 0.8;
          }
        }
      `}</style>
    </div>
  );
};

export default DeviceDashboard;