import ExcelJS from 'exceljs';
import Papa from 'papaparse';
import { StudentApplication } from '../types';

export function formatDateTime(isoString: string): string {
  if (!isoString) return 'N/A';
  try {
    const d = new Date(isoString);
    return d.toLocaleString('en-US', {
      year: 'numeric',
      month: 'short',
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit'
    });
  } catch {
    return isoString;
  }
}

export function getDateSuffix(): string {
  const d = new Date();
  const year = d.getFullYear();
  const month = String(d.getMonth() + 1).padStart(2, '0');
  const day = String(d.getDate()).padStart(2, '0');
  return `${year}-${month}-${day}`;
}

export async function exportStudentsToExcel(
  students: StudentApplication[], 
  title: string = 'SIXATE MATHEMATICS CLUB — STUDENT REGISTRATIONS',
  filenamePrefix: string = 'sixate-registrations'
): Promise<string> {
  // Create ExcelJS Workbook
  const workbook = new ExcelJS.Workbook();
  workbook.creator = 'SIXATE Mathematics Club';
  workbook.lastModifiedBy = 'SIXATE Admin Portal';
  workbook.created = new Date();

  const worksheet = workbook.addWorksheet('Registrations', {
    views: [{ state: 'frozen', ySplit: 2 }] // Freeze title + header row
  });

  // Title Row (Row 1)
  const titleCell = worksheet.getCell('A1');
  titleCell.value = title;
  titleCell.font = { name: 'Space Grotesk', size: 14, bold: true, color: { argb: 'FFFFFFFF' } };
  titleCell.fill = {
    type: 'pattern',
    pattern: 'solid',
    fgColor: { argb: 'FF0F172A' } // Dark Navy #0F172A
  };
  titleCell.alignment = { vertical: 'middle', horizontal: 'center' };
  worksheet.mergeCells('A1:W1');
  worksheet.getRow(1).height = 36;

  // Header Definitions (Row 2)
  const headers = [
    'Application ID',
    'Full Name',
    'Roll Number',
    'College Email',
    'Phone Number',
    'Gender',
    'Department',
    'Year',
    'Section',
    'Mathematics Interests',
    'Mathematics Interest Rating',
    'Skills',
    'Competition Experience',
    'Achievements',
    'Why They Joined SIXATE',
    'Contribution to SIXATE',
    'Preferred Activities',
    'LinkedIn',
    'GitHub',
    'Status',
    'Member ID',
    'Registration Date',
    'Profile Photo URL'
  ];

  const headerRow = worksheet.getRow(2);
  headerRow.values = headers;
  headerRow.height = 28;

  headerRow.eachCell((cell) => {
    cell.font = { name: 'Inter', size: 10, bold: true, color: { argb: 'FFFFFFFF' } };
    cell.fill = {
      type: 'pattern',
      pattern: 'solid',
      fgColor: { argb: 'FF6D28D9' } // SIXATE Violet #6D28D9
    };
    cell.alignment = { vertical: 'middle', horizontal: 'center', wrapText: true };
    cell.border = {
      top: { style: 'thin', color: { argb: 'FF475569' } },
      left: { style: 'thin', color: { argb: 'FF475569' } },
      bottom: { style: 'medium', color: { argb: 'FF7C3AED' } },
      right: { style: 'thin', color: { argb: 'FF475569' } }
    };
  });

  // Enable AutoFilter across headers
  worksheet.autoFilter = {
    from: { row: 2, column: 1 },
    to: { row: 2, column: headers.length }
  };

  // Insert Student Data Rows (Starting Row 3)
  students.forEach((s) => {
    const rowValues = [
      s.applicationId || '',
      s.fullName || '',
      s.rollNumberDisplay || s.rollNumber || '',
      s.emailDisplay || s.email || '',
      s.phone || '',
      s.gender || 'N/A',
      s.department === 'Other' && s.departmentOther ? `Other (${s.departmentOther})` : s.department || '',
      s.year || '',
      s.section || 'N/A',
      Array.isArray(s.interests) ? s.interests.join(', ') : s.interests || '',
      s.mathInterestRating ? `${s.mathInterestRating} / 5` : '',
      Array.isArray(s.skills) ? s.skills.join(', ') : s.skills || '',
      s.competitionExperience || 'No',
      s.achievements || 'None',
      s.reasonForJoining || '',
      s.contribution || 'N/A',
      Array.isArray(s.preferredActivities) ? s.preferredActivities.join(', ') : s.preferredActivities || '',
      s.linkedin || 'N/A',
      s.github || 'N/A',
      (s.status || 'pending').toUpperCase(),
      s.memberId || 'N/A',
      formatDateTime(s.createdAt),
      s.profilePhotoUrl || 'None'
    ];

    const dataRow = worksheet.addRow(rowValues);
    dataRow.height = 24;

    dataRow.eachCell((cell, colNumber) => {
      cell.font = { name: 'Inter', size: 9.5, color: { argb: 'FF0F172A' } };
      cell.alignment = { vertical: 'middle', horizontal: 'left', wrapText: true };

      // Explicitly format Roll Number (col 3) and Phone (col 5) as Text to prevent losing zeros/plus signs
      if (colNumber === 3 || colNumber === 5) {
        cell.numFmt = '@';
      }

      // Highlight Status column
      if (colNumber === 20) {
        const statusVal = String(cell.value).toLowerCase();
        cell.font = { name: 'Inter', size: 9.5, bold: true };
        if (statusVal === 'approved') {
          cell.font.color = { argb: 'FF047857' }; // Green
        } else if (statusVal === 'rejected') {
          cell.font.color = { argb: 'FFB91C1C' }; // Red
        } else if (statusVal === 'shortlisted') {
          cell.font.color = { argb: 'FFB45309' }; // Amber
        } else {
          cell.font.color = { argb: 'FF4338CA' }; // Indigo
        }
        cell.alignment = { vertical: 'middle', horizontal: 'center' };
      }

      // Light alternating borders
      cell.border = {
        top: { style: 'thin', color: { argb: 'FFE2E8F0' } },
        left: { style: 'thin', color: { argb: 'FFE2E8F0' } },
        bottom: { style: 'thin', color: { argb: 'FFE2E8F0' } },
        right: { style: 'thin', color: { argb: 'FFE2E8F0' } }
      };
    });
  });

  // Calculate & Set Intelligent Auto Column Widths
  worksheet.columns.forEach((column, index) => {
    if (!column) return;
    let maxLen = headers[index] ? headers[index].length : 12;

    // Check up to 50 rows for max text length
    worksheet.eachRow((row, rowNum) => {
      if (rowNum > 1) { // Skip banner row
        const cellValue = row.getCell(index + 1).value;
        if (cellValue) {
          const str = String(cellValue);
          if (str.length > maxLen) {
            maxLen = str.length;
          }
        }
      }
    });

    // Clamp widths nicely between 14 and 45
    let calculatedWidth = Math.min(Math.max(maxLen + 4, 14), 45);
    
    // Custom widths for long text columns
    if ([14, 15, 16, 17].includes(index + 1)) {
      calculatedWidth = 40; // Achievements, Reason, Contribution, Activities
    }
    
    column.width = calculatedWidth;
  });

  // Export buffer & download
  const buffer = await workbook.xlsx.writeBuffer();
  const blob = new Blob([buffer], { type: 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet' });
  const filename = `${filenamePrefix}-${getDateSuffix()}.xlsx`;

  const url = URL.createObjectURL(blob);
  const a = document.createElement('a');
  a.href = url;
  a.download = filename;
  document.body.appendChild(a);
  a.click();
  document.body.removeChild(a);
  setTimeout(() => URL.revokeObjectURL(url), 1000);

  return filename;
}

export function exportStudentsToCSV(
  students: StudentApplication[],
  filenamePrefix: string = 'sixate-registrations'
): string {
  const dataForCsv = students.map((s) => ({
    'Application ID': s.applicationId || '',
    'Full Name': s.fullName || '',
    'Roll Number': s.rollNumberDisplay || s.rollNumber || '',
    'College Email': s.emailDisplay || s.email || '',
    'Phone Number': s.phone || '',
    'Gender': s.gender || 'N/A',
    'Department': s.department === 'Other' && s.departmentOther ? `Other (${s.departmentOther})` : s.department || '',
    'Year': s.year || '',
    'Section': s.section || 'N/A',
    'Mathematics Interests': Array.isArray(s.interests) ? s.interests.join(', ') : s.interests || '',
    'Mathematics Interest Rating': s.mathInterestRating ? `${s.mathInterestRating} / 5` : '',
    'Skills': Array.isArray(s.skills) ? s.skills.join(', ') : s.skills || '',
    'Competition Experience': s.competitionExperience || 'No',
    'Achievements': s.achievements || 'None',
    'Why They Joined SIXATE': s.reasonForJoining || '',
    'Contribution to SIXATE': s.contribution || 'N/A',
    'Preferred Activities': Array.isArray(s.preferredActivities) ? s.preferredActivities.join(', ') : s.preferredActivities || '',
    'LinkedIn': s.linkedin || 'N/A',
    'GitHub': s.github || 'N/A',
    'Status': (s.status || 'pending').toUpperCase(),
    'Member ID': s.memberId || 'N/A',
    'Registration Date': formatDateTime(s.createdAt),
    'Profile Photo URL': s.profilePhotoUrl || 'None'
  }));

  const csvContent = Papa.unparse(dataForCsv);
  const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
  const filename = `${filenamePrefix}-${getDateSuffix()}.csv`;

  const url = URL.createObjectURL(blob);
  const a = document.createElement('a');
  a.href = url;
  a.download = filename;
  document.body.appendChild(a);
  a.click();
  document.body.removeChild(a);
  setTimeout(() => URL.revokeObjectURL(url), 1000);

  return filename;
}
