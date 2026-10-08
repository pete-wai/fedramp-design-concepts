/**
 * Generic CSV export utility that works with any object type
 */

// Helper function to sanitize strings for CSV, replacing common problematic characters
function sanitizeStringForCsv(input: string): string {
  if (typeof input !== 'string') {
    return String(input); // Ensure it's a string before processing
  }
  return input
    .replace(/[\u2018\u2019]/g, "'") // Replace left/right single quotation marks with apostrophe
    .replace(/[\u201C\u201D]/g, '"') // Replace left/right double quotation marks with straight double quote
    .replace(/\u2013/g, '-') // Replace en dash with hyphen
    .replace(/\u2014/g, '--') // Replace em dash with double hyphen
    .replace(/\u2026/g, '...') // Replace ellipsis with three dots
    .replace(/[\u00A0]/g, ' '); // Replace non-breaking space with regular space
  // Add more replacements here if other specific characters cause issues.
  // For example, to remove all non-ASCII characters:
  // .replace(/[^\x00-\x7F]/g, ''); // This is very aggressive and might remove desired characters.
}

// Helper to summarize objects for CSV, handling nested structures with placeholders
function flattenObject(obj: any): Record<string, any> {
  const result: Record<string, any> = {};

  // Helper to get a meaningful string from an item within an array
  // It prioritizes common identifier fields like name, id, title, label, value.
  function getObjectIdentifier(item: any): string {
    if (item === null || item === undefined) return '';
    if (typeof item !== 'object') return sanitizeStringForCsv(String(item)); // Sanitize primitives

    // Prioritize common identifier fields and sanitize their values
    if (item.name !== undefined) return sanitizeStringForCsv(String(item.name));
    if (item.id !== undefined) return sanitizeStringForCsv(String(item.id));
    if (item.title !== undefined) return sanitizeStringForCsv(String(item.title));
    if (item.label !== undefined) return sanitizeStringForCsv(String(item.label));
    if (item.value !== undefined) return sanitizeStringForCsv(String(item.value));

    // Fallback for objects with no common identifier
    return '[Object]';
  }

  // If the input itself is null, undefined, or a primitive, return it as a single 'value'
  if (obj === null || obj === undefined) {
    return { value: '' };
  }
  if (typeof obj !== 'object') {
    return { value: sanitizeStringForCsv(String(obj)) }; // Sanitize top-level primitive
  }

  // If the input is a Date object, format it (toISOString produces ASCII-safe string)
  if (obj instanceof Date) {
    return { value: isNaN(obj.getTime()) ? 'Invalid Date' : obj.toISOString().split('T')[0] };
  }

  // If the input is a URL object, stringify it (toString produces ASCII-safe string)
  if (obj instanceof URL) {
    return { value: obj.toString() };
  }

  // If the input is an array (top-level), process its items
  if (Array.isArray(obj)) {
    if (obj.length === 0) {
      return { value: '' };
    }
    const summarizedItems = obj.map(getObjectIdentifier);
    return { value: summarizedItems.join('; ') }; // Join already sanitized items
  }

  // For regular objects, iterate through its direct properties
  for (const [key, value] of Object.entries(obj)) {
    if (value === null || value === undefined) {
      result[key] = '';
    } else if (typeof value === 'object') {
      if (Array.isArray(value)) {
        // Process array items to get their identifiers
        if (value.length === 0) {
          result[key] = '';
        } else {
          const summarizedItems = value.map(getObjectIdentifier);
          result[key] = summarizedItems.join('; '); // Join already sanitized items
        }
      } else if (value instanceof Date) {
        // Keep Date formatting (toISOString produces ASCII-safe string)
        result[key] = isNaN(value.getTime()) ? 'Invalid Date' : value.toISOString().split('T')[0];
      } else if (value instanceof URL) {
        // Keep URL formatting (toString produces ASCII-safe string)
        result[key] = value.toString();
      } else {
        // Replace nested object with a placeholder
        result[key] = '[Object]';
      }
    } else {
      // It's a primitive value, sanitize and keep as string
      result[key] = sanitizeStringForCsv(String(value));
    }
  }

  return result;
}

// Clean up column names to be more readable
function cleanColumnName(name: string): string {
  // Column names are usually controlled and don't require sanitization for smart quotes.
  // However, if they *could* contain such characters from user input, you might add:
  // return sanitizeStringForCsv(name
  return name
    .replace(/_/g, ' ') // Replace underscores with spaces
    .replace(/([A-Z])/g, ' $1') // Add space before capital letters
    .replace(/\s+/g, ' ') // Replace multiple spaces with single space
    .trim()
    .toLowerCase()
    .split(' ')
    .map((word) => word.charAt(0).toUpperCase() + word.slice(1)) // Title case
    .join(' ');
}

// Escape CSV values that contain commas, quotes, or newlines
function escapeCsvValue(value: any): string {
  if (value === null || value === undefined) {
    return '';
  }
  const stringValue = String(value);
  // If the value contains comma, quote, or newline, wrap in quotes and escape internal quotes
  if (stringValue.includes(',') || stringValue.includes('"') || stringValue.includes('\n') || stringValue.includes('\r')) {
    return `"${stringValue.replace(/"/g, '""')}"`;
  }
  return stringValue;
}

/**
 * Export an array of objects to CSV
 * @param data - Array of objects to export
 * @param filename - Name for the downloaded file (optional)
 * @param options - Export options
 */
export function exportToCSV<T>(
  data: T[],
  filename?: string,
  options: {
    cleanHeaders?: boolean;
  } = {}
): void {
  const { cleanHeaders = true } = options;
  if (!data || data.length === 0) {
    console.warn('No data to export');
    return;
  }

  try {
    // Flatten all objects using the updated flattenObject, which now summarizes complex types
    const flattenedData = data.map((item) => flattenObject(item));

    // Get all unique column names in the order they first appear
    const allColumns = new Set<string>();
    flattenedData.forEach((item) => {
      Object.keys(item).forEach((key) => allColumns.add(key));
    });
    // Maintain insertion order for columns
    const columns = Array.from(allColumns);

    // Create headers
    const headers = cleanHeaders ? columns.map(cleanColumnName) : columns;

    // Create CSV content
    const csvRows: string[] = [];
    // Add header row
    csvRows.push(headers.map(escapeCsvValue).join(','));

    // Add data rows
    flattenedData.forEach((item) => {
      const row = columns.map((column) => escapeCsvValue(item[column] || ''));
      csvRows.push(row.join(','));
    });

    const csvContent = csvRows.join('\n');

    // Create and download the file
    const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' }); // Still specify UTF-8, it's good practice
    const url = URL.createObjectURL(blob);
    const defaultFilename = filename || `export-${new Date().toISOString().split('T')[0]}.csv`;

    // Always use download approach for reliability
    downloadFile(url, defaultFilename);
  } catch (error) {
    console.error('Error in exportToCSV:', error);
    throw error; // Re-throw so calling code can handle it
  }
}

// Helper function to trigger download
function downloadFile(url: string, filename: string): void {
  const link = document.createElement('a');
  link.href = url;
  link.download = filename;
  link.style.display = 'none';
  document.body.appendChild(link);
  link.click();
  document.body.removeChild(link);
  // Clean up URL
  setTimeout(() => URL.revokeObjectURL(url), 100);
}

/**
 * Preview what the CSV export would look like (for debugging)
 */
export function previewCSV<T>(data: T[], maxRows = 5): string {
  if (!data || data.length === 0) return 'No data';
  const previewData = data.slice(0, maxRows);
  // Use the updated flattenObject for preview as well
  const flattened = previewData.map((item) => flattenObject(item));
  const columns = new Set<string>();
  flattened.forEach((item) => {
    Object.keys(item).forEach((key) => columns.add(key));
  });
  // Maintain insertion order for columns
  const sortedColumns = Array.from(columns);
  const headers = sortedColumns.map(cleanColumnName);
  let preview = headers.join(', ') + '\n';
  flattened.forEach((item) => {
    const row = sortedColumns.map((col) => String(item[col] || '').substring(0, 20));
    preview += row.join(', ') + '\n';
  });
  return preview;
}

/**
 * Export data to JSON format
 * @param data - Array of objects to export
 * @param filename - Name for the downloaded file (optional)
 * @param options - Export options
 */
export function exportToJSON<T>(
  data: T[],
  filename?: string,
  options: {
    pretty?: boolean;
    includeMetadata?: boolean;
  } = {}
): void {
  const { pretty = true, includeMetadata = false } = options;
  if (!data || data.length === 0) {
    console.warn('No data to export');
    return;
  }
  try {
    let exportData: any = data;
    // Add metadata if requested
    if (includeMetadata) {
      exportData = {
        metadata: {
          exportDate: new Date().toISOString(),
          recordCount: data.length,
          exportType: 'JSON'
        },
        data: data
      };
    }
    // Create JSON string
    const jsonString = pretty ? JSON.stringify(exportData, null, 2) : JSON.stringify(exportData);
    // Create and download the file
    const blob = new Blob([jsonString], { type: 'application/json;charset=utf-8;' });
    const url = URL.createObjectURL(blob);
    const defaultFilename = filename || `export-${new Date().toISOString().split('T')[0]}.json`;
    downloadFile(url, defaultFilename);
  } catch (error) {
    console.error('Error in exportToJSON:', error);
    throw error;
  }
}

/**
 * Preview what the JSON export would look like (for debugging)
 */
export function previewJSON<T>(data: T[], maxItems = 3): string {
  if (!data || data.length === 0) return 'No data';
  const previewData = data.slice(0, maxItems);
  return JSON.stringify(previewData, null, 2);
}

/**
 * Export marketplace data to JSON format matching the original CSV structure
 * This function replicates the logic from the Angular CacheFactory.csvFromAtoData() method
 * but outputs JSON instead of CSV. Can handle both products and agencies.
 */
export function exportATOsToJSON(
  data: any[],
  atoMapping: any[],
  reuseMapping: any[],
  filename?: string,
  options: {
    pretty?: boolean;
    includeMetadata?: boolean;
  } = {}
): void {
  const { pretty = true, includeMetadata = false } = options;

  if (!data || data.length === 0) {
    console.warn('No data to export');
    return;
  }

  // Determine if we're dealing with products or agencies
  const isAgencyData = data.length > 0 && 'auths' in data[0] && 'reuses' in data[0];

  try {
    // Helper functions (same as before)
    function reformatSomeDates(inField: string | Date | null): string {
      if (!inField) return '';

      if (inField instanceof Date) {
        const month = (inField.getMonth() + 1).toString().padStart(2, '0');
        const day = inField.getDate().toString().padStart(2, '0');
        return `${month}/${day}`;
      }

      const dateStr = String(inField);
      return dateStr.indexOf('T') === -1 ? dateStr : dateStr.slice(5, 7) + '/' + dateStr.slice(8, 10);
    }

    function getDateTimeField(inField: string | Date | null): string {
      if (!inField) return '';

      if (inField instanceof Date) {
        return inField.toISOString().split('T')[0];
      }

      const dateStr = String(inField);
      return dateStr.indexOf('T') === -1 ? dateStr : dateStr.slice(0, dateStr.indexOf('T'));
    }

    function getAtoDateArray(idProd: string) {
      const list: Array<{
        label: string;
        parent: string;
        sub: string;
        iss: string;
        auth: string;
        assess: string;
        exp: string;
      }> = [];
      let iss: string;
      let auth = '';
      let assess = '';
      let exp: string;

      // Find initial
      for (let i = 0; i < atoMapping.length; i++) {
        if (atoMapping[i].id === idProd) {
          auth = getDateTimeField(atoMapping[i].auth_date);
          assess = reformatSomeDates(atoMapping[i].assessment_date);
          iss = getDateTimeField(atoMapping[i].ato_date);
          exp = getDateTimeField(atoMapping[i].exp_date);

          if (iss !== '' && exp === '') {
            exp = 'Continuous ATO';
          }

          list.push({
            label: 'Initial',
            parent: atoMapping[i].parent,
            sub: atoMapping[i].sub,
            iss,
            auth,
            assess,
            exp
          });
          break;
        }
      }

      // Find all reuse
      for (let i = 0; i < reuseMapping.length; i++) {
        if (reuseMapping[i].id === idProd) {
          iss = getDateTimeField(reuseMapping[i].ato_date);
          exp = getDateTimeField(reuseMapping[i].exp_date);

          if (iss !== '' && exp === '') {
            exp = 'Continuous ATO';
          }

          list.push({
            label: 'Reuse',
            parent: reuseMapping[i].parent,
            sub: reuseMapping[i].sub,
            iss,
            auth,
            assess,
            exp
          });
        }
      }

      return list;
    }

    const exportData: any[] = [];

    if (isAgencyData) {
      // Handle agency data - export all products that have ATOs for these agencies
      const agencyNames = data.map((agency) => agency.parent);
      const subAgencyNames = data.flatMap((agency) => (agency.sub ? [agency.sub] : []));

      // Get all unique product IDs from ATO and Reuse mappings for these agencies
      const relevantProductIds = new Set<string>();

      atoMapping.forEach((ato) => {
        if (agencyNames.includes(ato.parent) || (ato.sub && subAgencyNames.includes(ato.sub))) {
          relevantProductIds.add(ato.id);
        }
      });

      reuseMapping.forEach((reuse) => {
        if (agencyNames.includes(reuse.parent) || (reuse.sub && subAgencyNames.includes(reuse.sub))) {
          relevantProductIds.add(reuse.id);
        }
      });

      // For each relevant product, create export entries
      relevantProductIds.forEach((productId) => {
        // Find the product data (you'll need access to the products array)
        // For now, we'll create entries with the ATO data we have
        const atoArray = getAtoDateArray(productId);

        if (atoArray.length > 0) {
          atoArray.forEach((ato) => {
            // Check if this ATO belongs to one of our agencies
            const belongsToAgency = agencyNames.includes(ato.parent) || (ato.sub && subAgencyNames.includes(ato.sub));

            if (belongsToAgency) {
              exportData.push({
                fedramp_id: productId,
                cloud_service_provider: '', // Will need product data to fill this
                cloud_service_offering: '', // Will need product data to fill this
                service_description: '',
                business_categories: [],
                service_model: [],
                fedramp_certification_status: 'FedRAMP Certified', // Assumed since it has ATO
                independent_assessor: '',
                sam_gov_uei: '', // Will need product data
                authorizations: 0, // Will need product data
                reuse: 0, // Will need product data
                parent_agency: ato.parent,
                omb_agency_code: '',
                sub_agency: ato.sub,
                omb_bureau_code: '',
                ato_issuance_date: ato.iss,
                fedramp_certification_date: ato.auth,
                annual_assessment_date: ato.assess,
                ato_expiration_date: ato.exp,
                ato_type: ato.label
              });
            }
          });
        }
      });
    } else {
      // Handle product data (original logic)
      for (let i = 0; i < data.length; i++) {
        const product = data[i];
        const atoArray = getAtoDateArray(product.id);

        if (product.status === 'FedRAMP Certified') {
          for (let k = 0; k < atoArray.length; k++) {
            const ato = atoArray[k];
            exportData.push({
              fedramp_id: product.id,
              cloud_service_provider: product.csp,
              cloud_service_offering: product.cso,
              service_description: product.service_desc?.replace(/#/g, '%23') || '',
              business_categories: Array.isArray(product.business_categories) ? product.business_categories : [],
              service_model: Array.isArray(product.service_model) ? product.service_model : [],
              fedramp_certification_status: product.status,
              independent_assessor: product.independent_assessor || '',
              sam_gov_uei: product.uei || '',
              authorizations: product.authorization || 0,
              reuse: product.reuse || 0,
              parent_agency: ato.parent,
              omb_agency_code: '',
              sub_agency: ato.sub,
              omb_bureau_code: '',
              ato_issuance_date: ato.iss,
              fedramp_certification_date: ato.auth,
              annual_assessment_date: ato.assess,
              ato_expiration_date: ato.exp,
              ato_type: ato.label
            });
          }
        } else {
          exportData.push({
            fedramp_id: product.id,
            cloud_service_provider: product.csp,
            cloud_service_offering: product.cso,
            service_description: product.service_desc?.replace(/#/g, '%23') || '',
            business_categories: Array.isArray(product.business_categories) ? product.business_categories : [],
            service_model: Array.isArray(product.service_model) ? product.service_model : [],
            fedramp_certification_status: product.status,
            independent_assessor: product.independent_assessor || '',
            sam_gov_uei: product.uei || '',
            authorizations: product.authorization || 0,
            reuse: product.reuse || 0,
            parent_agency: '',
            omb_agency_code: '',
            sub_agency: '',
            omb_bureau_code: '',
            ato_issuance_date: '',
            fedramp_certification_date: '',
            annual_assessment_date: '',
            ato_expiration_date: '',
            ato_type: ''
          });
        }
      }
    }

    // Rest of the function (metadata, JSON creation, download) stays the same
    let finalExportData: any = exportData;

    if (includeMetadata) {
      const date = new Date();
      const timestamp =
        date.getFullYear().toString() +
        zeroPad(date.getMonth() + 1) +
        zeroPad(date.getDate()) +
        '-' +
        zeroPad(date.getHours()) +
        zeroPad(date.getMinutes()) +
        zeroPad(date.getSeconds());

      finalExportData = {
        metadata: {
          export_date: new Date().toISOString(),
          export_timestamp: timestamp,
          total_records: exportData.length,
          export_type: isAgencyData ? 'agency_ato_json' : 'marketplace_json',
          export_version: '1.0'
        },
        data: exportData
      };
    }

    const jsonString = pretty ? JSON.stringify(finalExportData, null, 2) : JSON.stringify(finalExportData);

    const date = new Date();
    const timestamp =
      date.getFullYear().toString() +
      zeroPad(date.getMonth() + 1) +
      zeroPad(date.getDate()) +
      '-' +
      zeroPad(date.getHours()) +
      zeroPad(date.getMinutes()) +
      zeroPad(date.getSeconds());

    const defaultFilename = filename || `${isAgencyData ? 'agency' : 'marketplace'}-ato-${timestamp}.json`;

    const blob = new Blob([jsonString], { type: 'application/json;charset=utf-8;' });
    const url = URL.createObjectURL(blob);
    downloadFile(url, defaultFilename);
  } catch (error) {
    console.error('Error in exportATOsToJSON:', error);
    throw error;
  }

  function zeroPad(n: number): string {
    return n < 10 ? '0' + n : n.toString();
  }
}

/**
 * Preview what the ATO JSON export would look like (for debugging)
 */
export function previewATOJSON(products: any[], maxItems = 3): string {
  if (!products || products.length === 0) return 'No products data';

  const previewProducts = products.slice(0, maxItems);

  // This is a simplified preview - you could call the main function with a mock download
  // or create a simplified version of the logic here
  const previewData = previewProducts.map((product) => ({
    fedramp_id: product.id,
    cloud_service_provider: product.csp,
    cloud_service_offering: product.cso,
    fedramp_certification_status: product.status
    // ... other key fields for preview
  }));

  return JSON.stringify(previewData, null, 2);
}
