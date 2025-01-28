export const invoiceTemplate = {
  "templateName": "Basic Invoice Parser",
  "templateVersion": 1,
  "objects": [
    {
      "name": "vendor_name",
      "type": "field",
      "regex": "(?:From|Company|Vendor)\\s*:?\\s*([^\\n]{2,50})",
      "options": { "multiline": true }
    },
    {
      "name": "invoice_number",
      "type": "field",
      "regex": "(?:Invoice|Reference)\\s*(?:#|No|Number)?\\s*:?\\s*(\\w+[-\\w]*)",
      "options": { "multiline": true }
    },
    {
      "name": "invoice_date",
      "type": "field",
      "regex": "(?:Date|Invoice Date)\\s*:?\\s*(\\d{1,2}[-/.\\s]\\d{1,2}[-/.\\s]\\d{2,4})",
      "options": { "multiline": true }
    },
    {
      "name": "total_amount",
      "type": "field",
      "regex": "(?:Total|Amount Due)\\s*:?\\s*[$€£]?(\\d+(?:[.,]\\d{2})?)",
      "options": { "multiline": true }
    }
  ]
}