import { useState, useEffect } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Switch } from "@/components/ui/switch";
import { useToast } from "@/hooks/use-toast";
import { supabase } from "@/integrations/supabase/client";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { Loader2, Plus, Save, Trash } from "lucide-react";
import { useAuth } from "@/lib/auth";

interface FieldMapping {
  id: string;
  field_name: string;
  validation_regex?: string;
  is_required: boolean;
  custom_rules: Record<string, any>;
}

export const FieldMappingManager = () => {
  const [newFieldName, setNewFieldName] = useState("");
  const { toast } = useToast();
  const queryClient = useQueryClient();
  const { user } = useAuth();

  const { data: fieldMappings, isLoading } = useQuery({
    queryKey: ['field-mappings'],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('field_mappings')
        .select('*')
        .order('field_name');
      
      if (error) throw error;
      return data as FieldMapping[];
    },
  });

  const addMutation = useMutation({
    mutationFn: async (fieldName: string) => {
      if (!user) throw new Error("User not authenticated");
      
      const { data, error } = await supabase
        .from('field_mappings')
        .insert([
          {
            field_name: fieldName,
            is_required: false,
            custom_rules: {},
            user_id: user.id
          },
        ])
        .select()
        .single();

      if (error) throw error;
      return data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['field-mappings'] });
      setNewFieldName("");
      toast({
        title: "Field mapping added",
        description: "New field mapping has been created successfully",
      });
    },
    onError: (error) => {
      toast({
        title: "Error adding field mapping",
        description: error.message,
        variant: "destructive",
      });
    },
  });

  const updateMutation = useMutation({
    mutationFn: async (mapping: FieldMapping) => {
      const { data, error } = await supabase
        .from('field_mappings')
        .update({
          validation_regex: mapping.validation_regex,
          is_required: mapping.is_required,
          custom_rules: mapping.custom_rules,
        })
        .eq('id', mapping.id)
        .select()
        .single();

      if (error) throw error;
      return data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['field-mappings'] });
      toast({
        title: "Field mapping updated",
        description: "Changes have been saved successfully",
      });
    },
    onError: (error) => {
      toast({
        title: "Error updating field mapping",
        description: error.message,
        variant: "destructive",
      });
    },
  });

  const deleteMutation = useMutation({
    mutationFn: async (id: string) => {
      const { error } = await supabase
        .from('field_mappings')
        .delete()
        .eq('id', id);

      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['field-mappings'] });
      toast({
        title: "Field mapping deleted",
        description: "Field mapping has been removed successfully",
      });
    },
    onError: (error) => {
      toast({
        title: "Error deleting field mapping",
        description: error.message,
        variant: "destructive",
      });
    },
  });

  const handleAddField = () => {
    if (!newFieldName.trim()) {
      toast({
        title: "Invalid field name",
        description: "Please enter a field name",
        variant: "destructive",
      });
      return;
    }
    addMutation.mutate(newFieldName.trim());
  };

  if (isLoading) {
    return (
      <div className="flex items-center justify-center p-8">
        <Loader2 className="h-8 w-8 animate-spin text-primary" />
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div className="flex items-end gap-4">
        <div className="flex-1">
          <Label htmlFor="new-field">Add New Field</Label>
          <Input
            id="new-field"
            value={newFieldName}
            onChange={(e) => setNewFieldName(e.target.value)}
            placeholder="Enter field name..."
          />
        </div>
        <Button
          onClick={handleAddField}
          disabled={addMutation.isPending}
          className="flex items-center gap-2"
        >
          {addMutation.isPending ? (
            <Loader2 className="h-4 w-4 animate-spin" />
          ) : (
            <Plus className="h-4 w-4" />
          )}
          Add Field
        </Button>
      </div>

      <div className="space-y-4">
        {fieldMappings?.map((mapping) => (
          <div
            key={mapping.id}
            className="flex items-start gap-4 p-4 border rounded-lg"
          >
            <div className="flex-1 space-y-4">
              <div>
                <Label>Field Name</Label>
                <div className="text-sm font-medium">{mapping.field_name}</div>
              </div>
              
              <div>
                <Label htmlFor={`regex-${mapping.id}`}>Validation Regex</Label>
                <Input
                  id={`regex-${mapping.id}`}
                  value={mapping.validation_regex || ""}
                  onChange={(e) =>
                    updateMutation.mutate({
                      ...mapping,
                      validation_regex: e.target.value,
                    })
                  }
                  placeholder="Enter regex pattern..."
                />
              </div>

              <div className="flex items-center space-x-2">
                <Switch
                  id={`required-${mapping.id}`}
                  checked={mapping.is_required}
                  onCheckedChange={(checked) =>
                    updateMutation.mutate({
                      ...mapping,
                      is_required: checked,
                    })
                  }
                />
                <Label htmlFor={`required-${mapping.id}`}>Required Field</Label>
              </div>
            </div>

            <Button
              variant="destructive"
              size="icon"
              onClick={() => deleteMutation.mutate(mapping.id)}
              disabled={deleteMutation.isPending}
            >
              {deleteMutation.isPending ? (
                <Loader2 className="h-4 w-4 animate-spin" />
              ) : (
                <Trash className="h-4 w-4" />
              )}
            </Button>
          </div>
        ))}
      </div>
    </div>
  );
};