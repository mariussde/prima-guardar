"use client";

import { useEffect } from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import * as z from "zod";
import { useToast } from "@/hooks/use-toast";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import {
  Form,
  FormControl,
  FormDescription,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from "@/components/ui/form";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Country } from "@/types/countries";

// Define the form schema based on the required parameters
const countryFormSchema = z.object({
  COMPID: z.string().min(1, "Company ID is required"),
  CNTYCOD: z.string().min(1, "Country Code is required"),
  CNTYDSC: z.string().min(1, "Description is required"),
  CRTUSR: z.string().optional(),
});

type CountryFormValues = z.infer<typeof countryFormSchema>;

interface CountryFormModalProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  country?: Country;
  onSubmit: (data: CountryFormValues) => Promise<{ error?: string } | void>;
}

export function CountryFormModal({
  open,
  onOpenChange,
  country,
  onSubmit,
}: CountryFormModalProps) {
  const { toast } = useToast();
  const isEditMode = !!country;

  const form = useForm<CountryFormValues>({
    resolver: zodResolver(countryFormSchema),
    defaultValues: {
      COMPID: "PLL", // Default company ID
      CNTYCOD: "",
      CNTYDSC: "",
      CRTUSR: "",
    },
  });

  // Reset form when modal opens/closes or country changes
  useEffect(() => {
    if (isEditMode && open && country) {
      form.reset({
        COMPID: country.COMPID,
        CNTYCOD: country.CNTYCOD,
        CNTYDSC: country.CNTYDSC,
        CRTUSR: country.CRTUSR,
      });
    } else if (!isEditMode && open) {
      form.reset({
        COMPID: "PLL",
        CNTYCOD: "",
        CNTYDSC: "",
        CRTUSR: "",
      });
    }
  }, [isEditMode, country, form, open]);

  const handleSubmit = async (data: CountryFormValues) => {
    try {
      const response = await onSubmit(data);

      // If we get a success response, close the modal
      if (response && "success" in response) {
        onOpenChange(false);
        return;
      }

      // If we get an error response, pass it back to the parent
      if (response && "error" in response) {
        return response;
      }

      // If we get here, something unexpected happened
      return { error: "An unexpected error occurred" };
    } catch (error) {
      // Return the error instead of throwing it
      return {
        error:
          error instanceof Error
            ? error.message
            : "An error occurred while saving the country",
      };
    }
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-[600px] max-h-[90vh] flex flex-col p-0 overflow-hidden">
        <DialogHeader className="px-6 pt-6">
          <DialogTitle>
            {isEditMode ? "Edit Country" : "Add New Country"}
          </DialogTitle>
          <DialogDescription>
            {isEditMode
              ? "Update the country's information below."
              : "Fill in the information below to create a new country."}
          </DialogDescription>
        </DialogHeader>
        <Form {...form}>
          <form
            onSubmit={form.handleSubmit(handleSubmit)}
            className="flex-1 flex flex-col min-h-0"
          >
            <div className="flex-1 overflow-y-auto px-6">
              <div className="space-y-4 py-4">
                <div className="grid gap-4 sm:grid-cols-2">
                  <FormField
                    control={form.control}
                    name="COMPID"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Company ID</FormLabel>
                        <FormControl>
                          <Input {...field} disabled />
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                  <FormField
                    control={form.control}
                    name="CNTYCOD"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Country Code</FormLabel>
                        <FormControl>
                          <Input {...field} disabled={isEditMode} />
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                </div>

                <FormField
                  control={form.control}
                  name="CNTYDSC"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Description</FormLabel>
                      <FormControl>
                        <Input {...field} />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />
              </div>
            </div>

            <DialogFooter className="px-6 py-4 border-t">
              <Button
                type="button"
                variant="outline"
                onClick={() => onOpenChange(false)}
              >
                Cancel
              </Button>
              <Button type="submit">
                {isEditMode ? "Update Country" : "Create Country"}
              </Button>
            </DialogFooter>
          </form>
        </Form>
      </DialogContent>
    </Dialog>
  );
}
