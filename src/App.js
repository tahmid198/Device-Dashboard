import React, { useState, useMemo } from 'react';
import { Upload, AlertTriangle, CheckCircle, XCircle, Shield, Users, HardDrive, Moon, Sun, ChevronLeft, ChevronRight, Info, Search, Eye, EyeOff } from 'lucide-react';
import { BarChart, Bar, PieChart, Pie, Cell, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer } from 'recharts';
import * as Papa from 'papaparse';

const DeviceDashboard = () => {
  const [darkMode, setDarkMode] = useState(false);
  const [currentPage, setCurrentPage] = useState(1);
  const [searchQuery, setSearchQuery] = useState('');
  const [showColumnInfo, setShowColumnInfo] = useState(false);
  const devicesPerPage = 50;

  const [files, setFiles] = useState({
    crowdstrike: null,
    freshdesk: null,
    azure: null,
    intune: null
  });
  
  const [lastUpdated, setLastUpdated] = useState({
    crowdstrike: null,
    freshdesk: null,
    azure: null,
    intune: null
  });

  const [data, setData] = useState({
    crowdstrike: [],
    freshdesk: [],
    azure: [],
    intune: []
  });

  const COLORS = ['#3b82f6', '#10b981', '#f59e0b', '#ef4444', '#8b5cf6', '#ec4899', '#06b6d4', '#84cc16'];

  const normalizeHostname = (hostname) => {
    if (!hostname) return '';
    const str = String(hostname);
    return str.toLowerCase().trim().replace(/\s+/g, '-');
  };

  const parseDate = (dateStr) => {
    if (!dateStr) return null;
    const date = new Date(dateStr);
    return isNaN(date.getTime()) ? null : date;
  };

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

  const analytics = useMemo(() => {
    if (!data.crowdstrike.length && !data.azure.length && !data.intune.length && !data.freshdesk.length) {
      return null;
    }

    const deviceMap = new Map();

    data.crowdstrike.forEach(device => {
      const hostname = normalizeHostname(device['Hostname'] || device['hostname']);
      if (!hostname) return;
      
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

    data.azure.forEach(device => {
      const hostname = normalizeHostname(device['displayName']);
      if (!hostname) return;
      
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
      if (!dev.lastSeen && dev.azure.lastSignIn) {
        dev.lastSeen = dev.azure.lastSignIn;
      }
      if (!dev.user && dev.azure.userNames) {
        dev.user = dev.azure.userNames;
      }
    });

    data.intune.forEach(device => {
      const hostname = normalizeHostname(device['Device name']);
      if (!hostname) return;
      
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

    data.freshdesk.forEach(device => {
      const hostname = normalizeHostname(device['Name']);
      if (!hostname) return;
      
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
      dev.department = dev.freshdesk.department;
      dev.location = dev.freshdesk.location;
      if (!dev.user && dev.freshdesk.usedBy) {
        dev.user = dev.freshdesk.usedBy;
      }
    });

    const devices = Array.from(deviceMap.values());
    const now = new Date();

    const totalDevices = devices.length;
    
    const hasCrowdstrike = devices.filter(d => d.sources.includes('crowdstrike')).length;
    const hasAzure = devices.filter(d => d.sources.includes('azure')).length;
    const hasIntune = devices.filter(d => d.sources.includes('intune')).length;
    const hasFreshdesk = devices.filter(d => d.sources.includes('freshdesk')).length;

    const unprotectedDevices = devices.filter(d => 
      (d.sources.includes('azure') || d.sources.includes('intune')) && 
      !d.sources.includes('crowdstrike')
    );

    const nonCompliantDevices = devices.filter(d => 
      (d.azure && d.azure.isCompliant === false) || 
      (d.intune && d.intune.compliance === 'Noncompliant')
    );

    const detectionsDisabled = devices.filter(d => 
      d.crowdstrike && d.crowdstrike.detectionsDisabled === 'Yes'
    );

    const unencryptedDevices = devices.filter(d => 
      d.intune && d.intune.encrypted === 'No'
    );

    const staleDevices30 = devices.filter(d => {
      if (!d.lastSeen) return false;
      const daysSince = (now - d.lastSeen) / (1000 * 60 * 60 * 24);
      return daysSince > 30;
    });

    const staleDevices90 = devices.filter(d => {
      if (!d.lastSeen) return false;
      const daysSince = (now - d.lastSeen) / (1000 * 60 * 60 * 24);
      return daysSince > 90;
    });

    const needsReboot = devices.filter(d => {
      if (!d.crowdstrike || !d.crowdstrike.lastReboot) return false;
      const daysSince = (now - d.crowdstrike.lastReboot) / (1000 * 60 * 60 * 24);
      return daysSince > 30;
    });

    const unassignedDevices = devices.filter(d => !d.user || d.user === '');

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

    const highRiskDevices = devices.filter(d => d.riskScore >= 50);

    const coverageData = [
      { name: 'Crowdstrike', value: hasCrowdstrike },
      { name: 'Azure AD', value: hasAzure },
      { name: 'Intune', value: hasIntune },
      { name: 'Freshdesk', value: hasFreshdesk }
    ];

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

    const mfgCount = {};
    devices.forEach(d => {
      const mfg = d.manufacturer || 'Unknown';
      mfgCount[mfg] = (mfgCount[mfg] || 0) + 1;
    });
    const mfgData = Object.entries(mfgCount).map(([name, value]) => ({ name, value })).slice(0, 8);

    const complianceData = [
      { name: 'Compliant', value: totalDevices - nonCompliantDevices.length },
      { name: 'Non-Compliant', value: nonCompliantDevices.length }
    ];

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

    const departmentData = Object.entries(deptStats).map(([name, stats]) => ({
      name,
      ...stats,
      protectionRate: stats.total > 0 ? Math.round((stats.protected / stats.total) * 100) : 0,
      complianceRate: stats.total > 0 ? Math.round((stats.compliant / stats.total) * 100) : 0
    })).sort((a, b) => b.total - a.total);

    return {
      totalDevices,
      hasCrowdstrike,
      hasAzure,
      hasIntune,
      hasFreshdesk,
      unprotectedDevices: unprotectedDevices.length,
      nonCompliantDevices: nonCompliantDevices.length,
      detectionsDisabled: detectionsDisabled.length,
      unencryptedDevices: unencryptedDevices.length,
      staleDevices30: staleDevices30.length,
      staleDevices90: staleDevices90.length,
      needsReboot: needsReboot.length,
      unassignedDevices: unassignedDevices.length,
      highRiskDevices: highRiskDevices.length,
      coverageData,
      osData,
      mfgData,
      complianceData,
      departmentData,
      devices,
      alerts: [
        ...staleDevices90.map(d => ({ type: 'critical', message: `${d.hostname} not seen in 90+ days`, device: d })),
        ...unprotectedDevices.slice(0, 5).map(d => ({ type: 'warning', message: `${d.hostname} missing Crowdstrike protection`, device: d })),
        ...detectionsDisabled.map(d => ({ type: 'critical', message: `${d.hostname} has detections disabled`, device: d })),
        ...highRiskDevices.slice(0, 5).map(d => ({ type: 'critical', message: `${d.hostname} high risk score (${d.riskScore})`, device: d }))
      ].slice(0, 10)
    };
  }, [data]);

  const formatDate = (date) => {
    if (!date) return 'Never';
    return new Date(date).toLocaleString();
  };

  const allFilesUploaded = files.crowdstrike && files.freshdesk && files.azure && files.intune;

  const filteredDevices = analytics ? analytics.devices.filter(device => 
    device.hostname.toLowerCase().includes(searchQuery.toLowerCase()) ||
    (device.user && device.user.toLowerCase().includes(searchQuery.toLowerCase())) ||
    (device.department && device.department.toLowerCase().includes(searchQuery.toLowerCase()))
  ) : [];

  const totalPages = Math.ceil(filteredDevices.length / devicesPerPage);
  const startIndex = (currentPage - 1) * devicesPerPage;
  const endIndex = startIndex + devicesPerPage;
  const currentDevices = filteredDevices.slice(startIndex, endIndex);

  const bgClass = darkMode ? 'bg-gray-900' : 'bg-gray-50';
  const cardBg = darkMode ? 'bg-gray-800' : 'bg-white';
  const textPrimary = darkMode ? 'text-gray-100' : 'text-gray-900';
  const textSecondary = darkMode ? 'text-gray-400' : 'text-gray-600';
  const borderColor = darkMode ? 'border-gray-700' : 'border-gray-200';
  const hoverBg = darkMode ? 'hover:bg-gray-700' : 'hover:bg-gray-50';

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

  return (
    <div className={`min-h-screen ${bgClass} p-6 transition-colors duration-200`}>
      <div className="max-w-7xl mx-auto">
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

        <div className={`${cardBg} rounded-lg shadow-md p-6 mb-6`}>
          <h2 className={`text-xl font-semibold mb-4 flex items-center gap-2 ${textPrimary}`}>
            <Upload className="w-5 h-5" />
            Upload CSV Files
            <InfoTooltip 
              title="CSV File Upload" 
              description="Upload all four CSV files from Crowdstrike, Freshdesk, Azure AD, and Intune to generate comprehensive device analytics and insights."
              source="User uploaded CSV files"
            />
          </h2>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
            {['crowdstrike', 'freshdesk', 'azure', 'intune'].map(fileType => (
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

        {!allFilesUploaded && (
          <div className="bg-yellow-50 dark:bg-yellow-900/20 border-l-4 border-yellow-400 p-4 mb-6">
            <div className="flex">
              <AlertTriangle className="w-5 h-5 text-yellow-400 mr-3" />
              <p className="text-sm text-yellow-700 dark:text-yellow-300">
                Please upload all four CSV files to view the complete dashboard analytics.
              </p>
            </div>
          </div>
        )}

        {analytics && (
          <>
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

            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4 mb-6">
              <div className={`${cardBg} rounded-lg shadow p-4`}>
                <p className={`text-sm ${textSecondary} flex items-center`}>
                  Stale 30+ days
                  <InfoTooltip 
                    title="Stale Devices (30+ days)" 
                    description="Devices that haven't been seen or checked in for more than 30 days. May be offline, decommissioned, or lost."
                    source="Crowdstrike Last Seen, Azure Last Sign-in, Intune Last Check-in"
                  />
                </p>
                <p className="text-2xl font-bold text-orange-600">{analytics.staleDevices30}</p>
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

            {analytics.alerts.length > 0 && (
              <div className={`${cardBg} rounded-lg shadow-md p-6 mb-6`}>
                <h2 className={`text-xl font-semibold mb-4 flex items-center gap-2 ${textPrimary}`}>
                  <AlertTriangle className="w-5 h-5 text-red-500" />
                  Critical Alerts
                  <InfoTooltip 
                    title="Critical Alerts" 
                    description="Top 10 most critical security and compliance issues requiring immediate attention. Prioritized by severity and potential risk."
                    source="Calculated from all platforms"
                  />
                </h2>
                <div className="space-y-2">
                  {analytics.alerts.map((alert, idx) => (
                    <div 
                      key={idx} 
                      className={`p-3 rounded-lg flex items-center gap-3 ${
                        alert.type === 'critical' ? 'bg-red-50 dark:bg-red-900/20 border-l-4 border-red-500' : 'bg-yellow-50 dark:bg-yellow-900/20 border-l-4 border-yellow-500'
                      }`}
                    >
                      {alert.type === 'critical' ? (
                        <XCircle className="w-5 h-5 text-red-500 flex-shrink-0" />
                      ) : (
                        <AlertTriangle className="w-5 h-5 text-yellow-500 flex-shrink-0" />
                      )}
                      <span className={`text-sm ${alert.type === 'critical' ? 'text-red-900 dark:text-red-200' : 'text-yellow-900 dark:text-yellow-200'}`}>{alert.message}</span>
                    </div>
                  ))}
                </div>
              </div>
            )}

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
                      labelLine={true}
                      label={(entry) => `${entry.name}`}
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
                <div className={`mb-4 p-4 rounded-lg bg-blue-50 dark:bg-blue-900/20 border-l-4 border-blue-500 ${textPrimary}`}>
                  <p className="text-sm font-semibold mb-2">Column Information:</p>
                  <ul className="text-xs space-y-1">
                    <li><strong>Hostname:</strong> Device name (from all platforms)</li>
                    <li><strong>User:</strong> Assigned user (Crowdstrike, Intune, Freshdesk)</li>
                    <li><strong>Department:</strong> Department assignment (Freshdesk)</li>
                    <li><strong>Sources:</strong> Blue=Crowdstrike, Green=Azure, Purple=Intune, Orange=Freshdesk</li>
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