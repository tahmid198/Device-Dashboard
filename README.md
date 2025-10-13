# IT Asset Management Dashboard

A comprehensive React-based dashboard for unified device security, compliance, and asset management across multiple platforms (Crowdstrike, Azure AD, Intune, and Freshdesk).

---

## 🎯 What This Dashboard Does

This dashboard provides a **unified view** of all your organization's devices by combining data from four different management platforms. It automatically:

- **Matches devices** across platforms using hostname, serial number, and other identifiers
- **Calculates risk scores** based on security posture (missing AV, non-compliance, encryption, etc.)
- **Identifies gaps** in protection, compliance, and asset tracking
- **Provides department-level analytics** for security and compliance metrics
- **Alerts on critical issues** like stale devices, disabled detections, and high-risk systems
- **Visualizes data** through interactive charts and filterable tables

### Key Features

✅ **Multi-platform integration** - Crowdstrike, Azure AD, Intune, Freshdesk  
✅ **Risk scoring** - Automated calculation based on security factors  
✅ **Department statistics** - Protection and compliance rates by department  
✅ **Device search** - Find devices by hostname, user, or department  
✅ **Dark mode** - Toggle between light and dark themes  
✅ **Interactive charts** - OS distribution, manufacturers, compliance status  
✅ **Critical alerts** - Top 10 most urgent issues highlighted  
✅ **Pagination** - Browse through large device inventories  
✅ **Data source tooltips** - Know where each metric comes from  

---

## 🚀 How to Run This Dashboard

### Option 1: Quick Start with Create React App (Recommended)

#### Prerequisites
- [Node.js](https://nodejs.org/) (LTS version 18+ recommended)
- npm (comes with Node.js)

#### Steps

1. **Create a new React app:**
```bash
npx create-react-app device-dashboard
cd device-dashboard
```

2. **Install dependencies:**
```bash
npm install papaparse recharts lucide-react
npm install -D tailwindcss postcss autoprefixer
```

3. **Configure Tailwind CSS:**

Create `tailwind.config.js`:
```javascript
/** @type {import('tailwindcss').Config} */
module.exports = {
  content: [
    "./src/**/*.{js,jsx,ts,tsx}",
  ],
  darkMode: 'class',
  theme: {
    extend: {},
  },
  plugins: [],
}
```

Create `postcss.config.js`:
```javascript
module.exports = {
  plugins: {
    tailwindcss: {},
    autoprefixer: {},
  },
}
```

4. **Update `src/index.css`:**
```css
@tailwind base;
@tailwind components;
@tailwind utilities;

@keyframes pulse {
  0%, 100% {
    opacity: 1;
  }
  50% {
    opacity: 0.8;
  }
}
```

5. **Replace `src/App.js`** with the dashboard component code from the artifact

6. **Run the application:**
```bash
npm start
```

The dashboard will open at `http://localhost:3000`

---

### Option 2: Standalone HTML File

For quick testing without a full React setup:

1. Create an `index.html` file
2. Include CDN links for React, Tailwind, PapaParse, Recharts, and Lucide
3. Paste the component code in a `<script type="text/babel">` tag
4. Open the file in a web browser

⚠️ **Note:** This method is for testing only, not recommended for production.

---

## 📊 Required CSV Files and Column Headers

The dashboard requires **four CSV files** with specific column headers. Upload them weekly to keep data current.

### 1. **Crowdstrike CSV** 
**Filename pattern:** `*_hosts_*.csv`

#### Required Columns:
- `Hostname` - Device name
- `Host ID` - Unique Crowdstrike ID
- `Last Seen` - Last contact timestamp
- `First Seen` - Initial enrollment date
- `Platform` - OS type (Windows, Mac, Linux)
- `OS Version` - Operating system version
- `Sensor Version` - Crowdstrike agent version
- `Status` - Device status
- `Detections Disabled` - Yes/No flag
- `Last Reboot` - Last reboot timestamp
- `Last Logged In User Account` - Username
- `Serial Number` - Hardware serial number
- `Manufacturer` - Device manufacturer
- `Model` - Device model

#### Optional but Recommended:
- Type, Local IP, External IP, MAC Address, Host Groups, Sensor Tags, Last User Account Login, OS Build, OS Product Name, Kernel Version, Email, Chassis, Connection IP, Default Gateway IP, Domain, Connection MAC Address, Filesystem Containment Status, CPUID, RFM, Linux Sensor Mode, Deployment Type, Cloud Service Provider, Cloud Service Account ID, Cloud Service Instance ID, Cloud Service Zone/Group, OU, Site, Prevention Policy, Sensor Update Policy, Content Update Policy, USB Device Policy, Response Policy, Uninstall Protection, Falcon Icon Policy, Host Retention Policy

---

### 2. **Freshdesk CSV**
**Filename pattern:** `ci_export_*.csv`

#### Required Columns:
- `Name` - Asset name (should match device hostname)
- `Asset Type` - Type of asset
- `Asset Tag` - Asset identifier
- `Department` - Department assignment ⚠️ **CRITICAL for department stats**
- `Location` - Physical location
- `Used by (Name)` - User assigned to device
- `Managed by (Name)` - Asset manager
- `End of Life` - EOL date
- `Updated At` - Last update timestamp

#### Optional but Recommended:
- Impact, Description, Discovery Enabled, Usage Type, Created by - Source, Created by - User, Created At, Last updated by - Source, Last updated by - User, Sources, Assigned on, Group, Model

---

### 3. **Azure AD CSV**
**Filename pattern:** `exportDevice_*.csv`

#### Required Columns:
- `displayName` - Device name
- `accountEnabled` - True/False
- `operatingSystem` - OS name
- `operatingSystemVersion` - OS version
- `joinType (trustType)` - Join method (Azure AD joined, Hybrid, Registered)
- `isCompliant` - Compliance status (True/False)
- `isManaged` - Management status (True/False)
- `approximateLastSignInDateTime` - Last sign-in
- `registrationTime` - Enrollment date
- `deviceId` - Azure device ID
- `userNames` - Associated users
- `mdmDisplayName` - MDM platform name

#### Optional but Recommended:
- registeredOwners, objectId, profileType, systemLabels, model

---

### 4. **Intune CSV**
**Filename pattern:** `DevicesWithInventory_*.csv`

#### Required Columns:
- `Device ID` - Intune device ID
- `Device name` - Device hostname
- `Enrollment date` - Date enrolled in Intune
- `Last check-in` - Last contact with Intune
- `Azure AD Device ID` - Linked Azure AD ID
- `OS version` - Operating system version
- `Compliance` - Compliance status (Compliant/Noncompliant)
- `Encrypted` - Encryption status (Yes/No)
- `Primary user UPN` - User email/UPN
- `Primary user display name` - User full name
- `Serial number` - Hardware serial
- `Manufacturer` - Device manufacturer
- `Model` - Device model
- `Managed by` - Management method
- `Ownership` - Corporate/Personal
- `Device state` - Current state

#### Optional but Recommended:
- Azure AD registered, EAS activation ID, EAS activated, IMEI, Last EAS sync time, EAS reason, EAS status, Compliance grace period expiration, Security patch level, Wi-Fi MAC, MEID, Subscriber carrier, Total storage, Free storage, Management name, Category, UserId, Primary user email address, WiFiIPv4Address, WiFiSubnetID, Intune registered, Supervised, OS, SkuFamily, JoinType, Phone number, Jailbroken, ICCID, EthernetMAC, CellularTechnology, ProcessorArchitecture, EID, SystemManagementBIOSVersion, TPMManufacturerId, TPMManufacturerVersion, ProductName, Management certificate expiration date

---

## 📈 Dashboard Metrics Explained

### Summary Cards

| Metric | Description | Data Source |
|--------|-------------|-------------|
| **Total Devices** | Unique devices across all platforms | All platforms combined |
| **Unprotected** | Devices without Crowdstrike | Azure/Intune devices missing from Crowdstrike |
| **Non-Compliant** | Devices failing compliance checks | Azure AD `isCompliant`, Intune `Compliance` |
| **High Risk** | Devices with risk score ≥50 | Calculated from all factors |
| **Stale 30+ days** | Not seen in 30+ days | Last Seen/Last Check-in/Last Sign-in |
| **Stale 90+ days** | Not seen in 90+ days | Last Seen/Last Check-in/Last Sign-in |
| **Unencrypted** | Devices without disk encryption | Intune `Encrypted` field |
| **Unassigned** | Devices with no user | User fields across all platforms |

### Risk Score Calculation

Risk scores range from **0-100** with points added for:
- **+30 points** - Missing Crowdstrike protection
- **+25 points** - Detections disabled in Crowdstrike
- **+20 points** - Non-compliant in Azure/Intune
- **+15 points** - Unencrypted (Intune)
- **+10 points** - Stale >90 days

**Color Coding:**
- 🟢 **Green (0-14)** - Low risk
- 🟡 **Yellow (15-29)** - Medium risk
- 🟠 **Orange (30-49)** - Elevated risk
- 🔴 **Red (50+)** - High risk

### Department Statistics

Shows per-department metrics:
- **Total** - Number of devices
- **Protected** - Devices with Crowdstrike
- **Protection %** - Percentage with AV
- **Compliant** - Devices meeting policies
- **Compliance %** - Compliance rate
- **Encrypted** - Devices with encryption
- **Stale** - Devices >30 days inactive
- **High Risk** - Devices with risk ≥50

### Source Indicators

Colored dots in the device table show platform presence:
- 🔵 **Blue** - Crowdstrike
- 🟢 **Green** - Azure AD
- 🟣 **Purple** - Intune
- 🟠 **Orange** - Freshdesk

Multiple dots = device exists in multiple systems

---

## 🔍 Using the Dashboard

### Upload CSV Files
1. Click each upload box
2. Select corresponding CSV file
3. Wait for "✓" confirmation
4. Repeat for all four files

### Search Devices
- Use search bar to filter by hostname, user, or department
- Search is case-insensitive and updates in real-time

### Navigate Pages
- Use **< >** buttons to browse device pages
- 50 devices per page
- Page counter shows current position

### Toggle Column Info
- Click 👁️ icon to show/hide column explanations
- Explains what each column represents and data sources

### Switch Dark Mode
- Click 🌙/☀️ button in top-right corner
- Preference persists during session

### View Tooltips
- Hover over **ℹ️** icons for detailed explanations
- Shows metric descriptions and data sources
- Hover over colored source dots for platform names

---

## 🔧 Troubleshooting

### "No data showing"
- Ensure all 4 CSV files are uploaded
- Check that CSV headers match expected column names exactly
- Verify CSV files contain data rows

### "Device counts seem wrong"
- Dashboard matches devices by hostname (case-insensitive)
- Devices with different hostnames across platforms won't match
- Check for hostname inconsistencies in source systems

### "Risk scores seem high/low"
- Risk calculation is automatic based on security factors
- Review individual device details to see contributing factors
- Scores reflect cumulative security gaps

### "Department stats showing 'Unassigned'"
- Department field only comes from Freshdesk
- Ensure Freshdesk CSV has `Department` column populated
- Devices not in Freshdesk will show as "Unassigned"

### "Page buttons not appearing"
- Buttons only show when data is loaded
- If <50 total devices, single page (no buttons needed)
- Check browser console for JavaScript errors

### "Logo not loading"
- Fallback text "VOA" will display if logo fails
- Check internet connection (logo loads from external URL)
- Dashboard functions normally without logo

---

## 📝 Data Refresh Recommendations

- **Weekly uploads** - Keep device data current
- **After major changes** - Re-upload after mass enrollments/decommissions
- **Quarterly reviews** - Audit high-risk and stale devices
- **Department reviews** - Share stats with department managers monthly

---

## 🔒 Security Notes

- **No data is stored** - All processing happens in browser memory
- **No backend** - Pure frontend React application
- **No data transmitted** - CSV files stay local
- **Session-only** - Data clears on page refresh
- **Safe to use** - No external data collection

---

## 💡 Tips for Best Results

1. **Standardize hostnames** across all platforms for accurate matching
2. **Keep serial numbers updated** in all systems for better correlation
3. **Populate Freshdesk Department field** for meaningful department stats
4. **Export CSVs on same day** for consistent timestamps
5. **Use consistent naming conventions** for users and departments
6. **Review high-risk devices first** - prioritize remediation efforts
7. **Track trends over time** - compare weekly exports to identify patterns
8. **Share department stats** - engage department managers in security

---

## 📧 Support

For issues or questions about this dashboard:
1. Review this README thoroughly
2. Check CSV file column headers match requirements
3. Verify all four files are uploaded
4. Check browser console for error messages

---

## 📄 License

This dashboard is provided as-is for internal organizational use.

---

**Version:** 1.0  
**Last Updated:** October 2025  
**Developed for:** Volunteers of America