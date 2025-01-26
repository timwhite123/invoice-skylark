export interface FieldMapping {
  id: string;
  field_name: string;
  validation_regex?: string;
  is_required: boolean;
  custom_rules: Record<string, any>;
  created_at?: string;
  updated_at?: string;
}