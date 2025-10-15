# IT Asset Management Dashboard

A comprehensive React-based dashboard for unified device security, compliance, and asset management across multiple platforms (Crowdstrike, Azure AD, Intune, Freshdesk, and Active Directory).

---

## 🎯 What This Dashboard Does

This dashboard provides a **unified view** of all your organization's devices by combining data from five different management platforms. It automatically:

- **Matches devices** across platforms using hostname, serial number, and other identifiers
- **Calculates risk scores** based on security posture (missing AV, non-compliance, encryption, etc.)
- **Identifies gaps** in protection, compliance, and asset tracking
- **Provides department-level analytics** for security and compliance metrics
- **Tracks OS-specific metrics** with drill-downs for Windows, macOS, iOS, and Android
- **Monitors disabled devices** across Azure AD and Active Directory
- **Visualizes data** through interactive charts and filterable tables

### Key Features

✅ **Multi-platform integration** - Crowdstrike, Azure AD, Intune, Freshdesk, Active Directory  
✅ **Risk scoring** - Automated calculation based on security factors  
✅ **OS drill-downs** - Separate metrics for Windows, macOS, iOS, and Android devices  
✅ **Disabled device tracking** - Monitor devices disabled in Azure AD and Active Directory  
✅ **45-day activity tracking** - Focus on recently active devices  
✅ **Department statistics** - Protection and compliance rates by department  
✅ **Device search** - Find devices by hostname, user, or department  
✅ **Dark mode** - Toggle between light and dark themes  
✅ **Interactive charts** - OS distribution, manufacturers, compliance status  
✅ **Pagination** - Browse through large device inventories  
✅ **Data source tooltips** - Know where each metric comes from  
✅ **Column information panels** - Detailed explanations with toggle visibility  

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

The dashboard requires **five CSV files** with specific column headers. Upload them weekly to keep data current.

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
- `accountEnabled` - True/False ⚠️ **CRITICAL for disabled device tracking**
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

### 5. **Active Directory CSV**
**Filename pattern:** `AD_Computers_*.csv`

#### Required Columns:
- `Name` - Computer name ⚠️ **CRITICAL - Primary matching field**
- `Enabled` - Account enabled status (True/False) ⚠️ **CRITICAL for disabled device tracking**
- `OperatingSystem` - OS name
- `OperatingSystemVersion` - OS version
- `lastLogonTimestamp` - Last logon time
- `DistinguishedName` - Full AD path
- `DNSHostName` - DNS hostname
- `Description` - Computer description
- `WhenCreated` - Creation date
- `WhenChanged` - Last modification date
- `ObjectGUID` - Unique AD identifier
- `SID` - Security identifier

#### Optional but Recommended:
- OperatingSystemServicePack, SamAccountName, UserPrincipalName

#### PowerShell Export Script:

Use this script to export Active Directory computer data:

```powershell
# Import the Active Directory module
Import-Module ActiveDirectory

# Set export file path to user's Desktop
$exportPath = "$env:USERPROFILE\Desktop\AD_Computers_With_Logon.csv"

# Get all computer accounts and include relevant AD attributes
$computers = Get-ADComputer -Filter * -Properties `
    Name,
    lastLogon,
    lastLogonTimestamp,
    OperatingSystem,
    OperatingSystemVersion,
    OperatingSystemServicePack,
    Enabled,
    DistinguishedName,
    DNSHostName,
    Description,
    WhenCreated,
    WhenChanged,
    ObjectGUID,
    SID

# Export the results to CSV
$computers | Export-Csv -Path $exportPath -NoTypeInformation -Encoding UTF8

# Notify the user
Write-Host "✔ Export completed successfully!"
Write-Host "📄 File saved to: $exportPath" -ForegroundColor Green
```

**To run this script:**
1. Open PowerShell as Administrator
2. Copy and paste the script
3. Press Enter to execute
4. Find the exported CSV on your Desktop
5. Upload to the dashboard

---

## 📈 Dashboard Metrics Explained

### Summary Cards

| Metric | Description | Data Source |
|--------|-------------|-------------|
| **Total Devices** | Unique devices across all platforms | All platforms combined |
| **Unprotected** | Devices without Crowdstrike | Azure/Intune devices missing from Crowdstrike |
| **Non-Compliant** | Devices failing compliance checks | Azure AD `isCompliant`, Intune `Compliance` |
| **High Risk** | Devices with risk score ≥50 | Calculated from all factors |
| **Seen within 45 days** | Recently active devices | Last Seen/Last Check-in/Last Sign-in/Last Logon |
| **Stale 90+ days** | Not seen in 90+ days | Last Seen/Last Check-in/Last Sign-in/Last Logon |
| **Unencrypted** | Devices without disk encryption | Intune `Encrypted` field |
| **Unassigned** | Devices with no user | User fields across all platforms |

### OS-Specific Drill-Downs 🆕

The dashboard provides detailed breakdowns for each major operating system:

#### Windows Devices
- **Total Windows systems** - All devices running Windows OS
- **% of Total Devices** - Percentage of fleet that is Windows
- **Active within 45 days** - Recently active Windows devices
- **% Active** - What percentage of Windows devices are active

#### macOS Devices
- **Total macOS systems** - All Apple Mac computers
- **% of Total Devices** - Percentage of fleet that is macOS
- **Active within 45 days** - Recently active Macs
- **% Active** - What percentage of Macs are active

#### iOS Devices
- **Total iOS devices** - All iPhones and iPads
- **% of Total Devices** - Percentage of fleet that is iOS
- **Active within 45 days** - Recently active iOS devices
- **% Active** - What percentage of iOS devices are active

#### Android Devices
- **Total Android devices** - All Android phones and tablets
- **% of Total Devices** - Percentage of fleet that is Android
- **Active within 45 days** - Recently active Android devices
- **% Active** - What percentage of Android devices are active

### Disabled Devices Tracking 🆕

Monitor devices that have been administratively disabled:

| Metric | Description | Color |
|--------|-------------|-------|
| **Total Disabled** | All devices disabled in Azure AD or AD | Red |
| **Active within 45 days** | Recently disabled devices (were active <45 days ago) | Green |
| **Disabled in Azure AD** | Devices with `accountEnabled = false` | Orange |
| **Disabled in Active Directory** | Devices with `Enabled = false` | Yellow |

**Why this matters:** Disabled devices that were recently active may need to be removed from other systems (Crowdstrike, Intune) to avoid licensing costs and security gaps.

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

Shows per-department metrics with **toggleable column information**:
- **Total** - Number of devices
- **Protected** - Devices with Crowdstrike
- **Protection %** - Percentage with AV (color-coded)
- **Compliant** - Devices meeting policies
- **Compliance %** - Compliance rate (color-coded)
- **Encrypted** - Devices with encryption
- **Stale** - Devices >30 days inactive
- **High Risk** - Devices with risk ≥50

**New:** Click the 👁️ icon to show/hide detailed column definitions.

### Source Indicators

Colored dots in the device table show platform presence:
- 🔵 **Blue** - Crowdstrike
- 🟢 **Green** - Azure AD
- 🟣 **Purple** - Intune
- 🟠 **Orange** - Freshdesk
- 🔷 **Teal** - Active Directory

Multiple dots = device exists in multiple systems

---

## 🔍 Using the Dashboard

### Upload CSV Files
1. Click each upload box (5 total)
2. Select corresponding CSV file
3. Wait for "✓" confirmation
4. Repeat for all five files

### View OS-Specific Metrics 🆕
- **OS Drill-Down Cards** show 4 cards: Windows, macOS, iOS, Android
- Each card displays total devices and active devices within 45 days
- Percentages help identify underutilized device types
- Use this to plan refresh cycles and target inactive devices

### Monitor Disabled Devices 🆕
- **Disabled Devices Section** shows 4 metrics
- Focus on "Active within 45 days" to find recently disabled devices
- These devices may still exist in other systems
- Review for potential license reclamation

### Search Devices
- Use search bar to filter by hostname, user, or department
- Search is case-insensitive and updates in real-time

### Navigate Pages
- Use **< >** buttons to browse device pages
- 50 devices per page
- Page counter shows current position

### Toggle Column Info 🆕
- Click 👁️ icon in **Department Statistics** or **Device Details**
- Shows/hides detailed column explanations
- Works in both light and dark mode
- Explains data sources and color coding

### Switch Dark Mode
- Click 🌙/☀️ button in top-right corner
- All panels and tooltips adapt to dark mode
- Preference persists during session

### View Tooltips
- Hover over **ℹ️** icons for detailed explanations
- Shows metric descriptions and data sources
- Hover over colored source dots for platform names

---

## 🔧 Troubleshooting

### "No data showing"
- Ensure all 5 CSV files are uploaded
- Check that CSV headers match expected column names exactly
- Verify CSV files contain data rows

### "Device counts seem wrong"
- Dashboard matches devices by hostname (case-insensitive)
- Active Directory uses the `Name` column (not DNSHostName)
- Devices with different hostnames across platforms won't match
- Check for hostname inconsistencies in source systems

### "OS drill-downs showing 0 devices"
- Verify OS fields are populated in CSVs (Platform, operatingSystem)
- Check that OS names include keywords: "Windows", "Mac", "iOS", "Android"
- iOS detection looks for "iOS", "iPhone", or "iPad"
- Android detection looks for "Android"

### "Disabled devices count is 0"
- Check Azure AD CSV has `accountEnabled` column
- Check Active Directory CSV has `Enabled` column
- Values should be boolean (True/False) or strings ('True'/'False')
- Dashboard checks for: false, 'false', 'False'

### "Column info not visible in dark mode" ✅ FIXED
- Toggle should now work properly in dark mode
- Background adapts: blue-50 (light) or blue-900/30 (dark)
- If still having issues, try refreshing the page

### "Risk scores seem high/low"
- Risk calculation is automatic based on security factors
- Review individual device details to see contributing factors
- Scores reflect cumulative security gaps

### "Department stats showing 'Unassigned'"
- Department field only comes from Freshdesk
- Ensure Freshdesk CSV has `Department` column populated
- Devices not in Freshdesk will show as "Unassigned"

### "Active Directory devices not showing"
- Verify the CSV has a `Name` column (required)
- Check that computer names match hostnames in other systems
- AD data shows as teal dots in the Sources column
- Review Platform Coverage chart to see AD device count

### "Pie chart labels overlapping" ✅ FIXED
- OS Distribution chart now uses legend instead of inline labels
- Hover over segments to see details
- Legend appears below the chart

### "Logo not loading"
- Fallback text "VOA" will display if logo fails
- Check internet connection (logo loads from external URL)
- Dashboard functions normally without logo

---

## 📝 Data Refresh Recommendations

- **Weekly uploads** - Keep device data current
- **After major changes** - Re-upload after mass enrollments/decommissions
- **Monthly AD exports** - Active Directory data should be refreshed monthly
- **Quarterly reviews** - Audit high-risk and stale devices
- **Department reviews** - Share stats with department managers monthly
- **Disabled device audits** - Review disabled devices monthly for cleanup opportunities

---

## 🔒 Security Notes

- **No data is stored** - All processing happens in browser memory
- **No backend** - Pure frontend React application
- **No data transmitted** - CSV files stay local
- **Session-only** - Data clears on page refresh
- **Safe to use** - No external data collection
- **PowerShell script is read-only** - Only exports data, makes no changes to AD

---

## 💡 Tips for Best Results

1. **Standardize hostnames** across all platforms for accurate matching
2. **Use the Name field in Active Directory** - This is what the dashboard matches on
3. **Keep serial numbers updated** in all systems for better correlation
4. **Populate Freshdesk Department field** for meaningful department stats
5. **Export CSVs on same day** for consistent timestamps
6. **Use consistent naming conventions** for users and departments
7. **Review high-risk devices first** - prioritize remediation efforts
8. **Track trends over time** - compare weekly exports to identify patterns
9. **Share department stats** - engage department managers in security
10. **Run AD export monthly** - Keep Active Directory data current
11. **Monitor disabled devices** - Clean up devices disabled in Azure/AD from other systems
12. **Use OS drill-downs** - Target inactive devices by platform for refresh planning
13. **Toggle column info** - Help new users understand metrics with the 👁️ button

---

## 🆕 What's New in Version 2.0

### Major Features
- ✅ **OS-Specific Drill-Downs** - Separate tracking for Windows, macOS, iOS, and Android
- ✅ **45-Day Activity Tracking** - Focus on recently active devices
- ✅ **Disabled Device Monitoring** - Track disabled devices across Azure AD and Active Directory
- ✅ **Column Information Panels** - Toggleable help for both Department Stats and Device Details

### UI/UX Improvements
- ✅ Fixed pie chart label overlapping (now uses legend)
- ✅ Fixed dark mode visibility for column information panels
- ✅ Removed Critical Alerts section (cleaner, more focused view)
- ✅ Enhanced OS detection to handle multiple OS field formats
- ✅ Improved dark mode styling across all components

### Bug Fixes
- ✅ Fixed `toLowerCase` error for null/undefined OS values
- ✅ Fixed disabled device detection to handle string and boolean values
- ✅ Improved column info panel visibility in dark mode

---

## 📧 Support

For issues or questions about this dashboard:
1. Review this README thoroughly
2. Check CSV file column headers match requirements
3. Verify all five files are uploaded
4. Check browser console for error messages
5. For Active Directory issues, verify PowerShell script ran successfully
6. For disabled device issues, check `accountEnabled` and `Enabled` columns

---

## 📄 License

This dashboard is provided as-is for internal organizational use.

---

**Version:** 2.0  
**Last Updated:** October 2025  
**Developed for:** Volunteers of America  
**New in v2.0:** OS Drill-Downs, 45-Day Tracking, Disabled Device Monitoring, Column Info Panels