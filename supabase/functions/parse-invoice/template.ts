export const invoiceTemplate = {
  "templateName": "Standard Invoice Parser",
  "templateVersion": "1.0",
  "objects": [
    {
      "name": "vendor_name",
      "type": "field",
      "fieldType": "text",
      "regex": "(?:From|Company|Vendor|Business Name|Bill From):\\s*([^\\n]{2,50})",
      "dataType": "text",
      "required": false
    },
    {
      "name": "invoice_number",
      "type": "field",
      "fieldType": "text",
      "regex": "(?:Invoice|Reference|Bill|Document)\\s*(?:#|No|Number|ID)?:\\s*([\\w-]+)",
      "dataType": "text",
      "required": false
    },
    {
      "name": "invoice_date",
      "type": "field",
      "fieldType": "text",
      "regex": "(?:Date|Invoice Date):\\s*(\\d{1,2}[/.\\s]\\d{1,2}[/.\\s]\\d{2,4})",
      "dataType": "date",
      "required": false
    },
    {
      "name": "total_amount",
      "type": "field",
      "fieldType": "text",
      "regex": "(?:Total|Amount Due|Balance Due|Total Amount):\\s*[$€£]?(\\d+(?:[.,]\\d{2})?)",
      "dataType": "number",
      "required": false
    }
  ]
}