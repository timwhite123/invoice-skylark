export const invoiceTemplate = {
  "templateName": "Basic Invoice Parser",
  "templateVersion": 1,
  "objects": [
    {
      "name": "vendor_name",
      "type": "field",
      "regex": "(?:From|Company|Vendor|Business Name|Bill From):\\s*([^\\n]{2,50})",
      "options": { 
        "multiLine": true,
        "caseInsensitive": true
      }
    },
    {
      "name": "invoice_number",
      "type": "field",
      "regex": "(?:Invoice|Reference|Bill|Document)\\s*(?:#|No|Number|ID)?:\\s*([\\w-]+)",
      "options": { 
        "multiLine": true,
        "caseInsensitive": true
      }
    },
    {
      "name": "invoice_date",
      "type": "field",
      "regex": "(?:Date|Invoice Date):\\s*(\\d{1,2}[/.\\s]\\d{1,2}[/.\\s]\\d{2,4})",
      "options": { 
        "multiLine": true,
        "caseInsensitive": true
      }
    },
    {
      "name": "total_amount",
      "type": "field",
      "regex": "(?:Total|Amount Due|Balance Due|Total Amount):\\s*[$€£]?(\\d+(?:[.,]\\d{2})?)",
      "options": { 
        "multiLine": true,
        "caseInsensitive": true
      }
    }
  ]
}