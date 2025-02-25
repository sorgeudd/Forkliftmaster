import { zodResolver } from "@hookform/resolvers/zod";
import { useForm } from "react-hook-form";
import { insertForkliftSchema, type InsertForklift } from "@shared/schema";
import { Form, FormField, FormItem, FormLabel, FormControl, FormMessage } from "@/components/ui/form";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Accordion, AccordionContent, AccordionItem, AccordionTrigger } from "@/components/ui/accordion";
import { useI18n } from "@/lib/i18n";
import { format } from "date-fns";
import { FileUpload } from "@/components/ui/file-upload";

type ForkliftFormProps = {
  onSubmit: (data: InsertForklift) => void;
  initialData?: Partial<InsertForklift>;
  companyId?: number;
};

export function ForkliftForm({ onSubmit, initialData, companyId }: ForkliftFormProps) {
  const { t } = useI18n();

  const form = useForm<InsertForklift>({
    resolver: zodResolver(insertForkliftSchema),
    defaultValues: {
      companyId: companyId ?? initialData?.companyId ?? 0,
      customer: initialData?.customer ?? "",
      brand: initialData?.brand ?? "",
      modelType: initialData?.modelType ?? "",
      serialNumber: initialData?.serialNumber ?? "",
      engineSpecs: initialData?.engineSpecs ?? "",
      transmission: initialData?.transmission ?? "",
      tireSpecs: initialData?.tireSpecs ?? "",
      serviceNotes: initialData?.serviceNotes ?? "",
      lastServiceDate: initialData?.lastServiceDate ? format(new Date(initialData.lastServiceDate), 'yyyy-MM-dd') : "",
      nextServiceDate: initialData?.nextServiceDate ? format(new Date(initialData.nextServiceDate), 'yyyy-MM-dd') : "",
      serviceHours: initialData?.serviceHours ?? undefined,
      filters500h: initialData?.filters500h ?? "",
      lubricants500h: initialData?.lubricants500h ?? "",
      documents500h: initialData?.documents500h ?? "",
      filters1000h: initialData?.filters1000h ?? "",
      lubricants1000h: initialData?.lubricants1000h ?? "",
      documents1000h: initialData?.documents1000h ?? "",
      filters1500h: initialData?.filters1500h ?? "",
      lubricants1500h: initialData?.lubricants1500h ?? "",
      documents1500h: initialData?.documents1500h ?? "",
      filters2000h: initialData?.filters2000h ?? "",
      lubricants2000h: initialData?.lubricants2000h ?? "",
      documents2000h: initialData?.documents2000h ?? "",
    },
  });

  const handleSubmit = (data: InsertForklift) => {
    if (!companyId && !initialData?.companyId) {
      console.error('No company ID provided');
      return;
    }

    // Make sure to include the companyId in the submission
    const submissionData = {
      ...data,
      companyId: companyId ?? initialData?.companyId ?? data.companyId,
    };

    onSubmit(submissionData);
  };

  return (
    <Form {...form}>
      <form onSubmit={form.handleSubmit(handleSubmit)} className="space-y-6">
        <ScrollArea className="h-[60vh] pr-4 -mr-4">
          <div className="space-y-6">
            {/* Basic Information */}
            <FormField
              control={form.control}
              name="customer"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Customer Name*</FormLabel>
                  <FormControl>
                    <Input {...field} />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />

            <div className="grid grid-cols-2 gap-4">
              <FormField
                control={form.control}
                name="brand"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>{t("forklift.brand")}*</FormLabel>
                    <FormControl>
                      <Input {...field} />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />

              <FormField
                control={form.control}
                name="modelType"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>{t("forklift.model")}*</FormLabel>
                    <FormControl>
                      <Input {...field} />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
            </div>

            {/* Service Intervals */}
            <Accordion type="single" collapsible className="w-full">
              {/* 500h Service */}
              <AccordionItem value="500h">
                <AccordionTrigger>{t("service.500h")}</AccordionTrigger>
                <AccordionContent>
                  <div className="space-y-4 pt-4">
                    <FormField
                      control={form.control}
                      name="filters500h"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel>{t("forklift.filters")}</FormLabel>
                          <FormControl>
                            <Textarea {...field} className="resize-none h-20" />
                          </FormControl>
                          <FormMessage />
                        </FormItem>
                      )}
                    />

                    <FormField
                      control={form.control}
                      name="lubricants500h"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel>{t("forklift.lubricants")}</FormLabel>
                          <FormControl>
                            <Textarea {...field} className="resize-none h-20" />
                          </FormControl>
                          <FormMessage />
                        </FormItem>
                      )}
                    />

                    <FormField
                      control={form.control}
                      name="documents500h"
                      render={({ field: { onChange, value } }) => (
                        <FormItem>
                          <FormLabel>Documents & Images</FormLabel>
                          <FormControl>
                            <FileUpload
                              onChange={files => onChange(JSON.stringify(files))}
                              value={value ? JSON.parse(value) : []}
                              accept=".pdf,.doc,.docx,.xls,.xlsx,image/*"
                            />
                          </FormControl>
                          <FormMessage />
                        </FormItem>
                      )}
                    />
                  </div>
                </AccordionContent>
              </AccordionItem>

              {/* 1000h Service */}
              <AccordionItem value="1000h">
                <AccordionTrigger>{t("service.1000h")}</AccordionTrigger>
                <AccordionContent>
                  <div className="space-y-4 pt-4">
                    <FormField
                      control={form.control}
                      name="filters1000h"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel>{t("forklift.filters")}</FormLabel>
                          <FormControl>
                            <Textarea {...field} className="resize-none h-20" />
                          </FormControl>
                          <FormMessage />
                        </FormItem>
                      )}
                    />

                    <FormField
                      control={form.control}
                      name="lubricants1000h"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel>{t("forklift.lubricants")}</FormLabel>
                          <FormControl>
                            <Textarea {...field} className="resize-none h-20" />
                          </FormControl>
                          <FormMessage />
                        </FormItem>
                      )}
                    />
                    <FormField
                      control={form.control}
                      name="documents1000h"
                      render={({ field: { onChange, value } }) => (
                        <FormItem>
                          <FormLabel>Documents & Images</FormLabel>
                          <FormControl>
                            <FileUpload
                              onChange={files => onChange(JSON.stringify(files))}
                              value={value ? JSON.parse(value) : []}
                              accept=".pdf,.doc,.docx,.xls,.xlsx,image/*"
                            />
                          </FormControl>
                          <FormMessage />
                        </FormItem>
                      )}
                    />
                  </div>
                </AccordionContent>
              </AccordionItem>

              {/* 1500h Service */}
              <AccordionItem value="1500h">
                <AccordionTrigger>{t("service.1500h")}</AccordionTrigger>
                <AccordionContent>
                  <div className="space-y-4 pt-4">
                    <FormField
                      control={form.control}
                      name="filters1500h"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel>{t("forklift.filters")}</FormLabel>
                          <FormControl>
                            <Textarea {...field} className="resize-none h-20" />
                          </FormControl>
                          <FormMessage />
                        </FormItem>
                      )}
                    />

                    <FormField
                      control={form.control}
                      name="lubricants1500h"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel>{t("forklift.lubricants")}</FormLabel>
                          <FormControl>
                            <Textarea {...field} className="resize-none h-20" />
                          </FormControl>
                          <FormMessage />
                        </FormItem>
                      )}
                    />
                    <FormField
                      control={form.control}
                      name="documents1500h"
                      render={({ field: { onChange, value } }) => (
                        <FormItem>
                          <FormLabel>Documents & Images</FormLabel>
                          <FormControl>
                            <FileUpload
                              onChange={files => onChange(JSON.stringify(files))}
                              value={value ? JSON.parse(value) : []}
                              accept=".pdf,.doc,.docx,.xls,.xlsx,image/*"
                            />
                          </FormControl>
                          <FormMessage />
                        </FormItem>
                      )}
                    />
                  </div>
                </AccordionContent>
              </AccordionItem>

              {/* 2000h Service */}
              <AccordionItem value="2000h">
                <AccordionTrigger>{t("service.2000h")}</AccordionTrigger>
                <AccordionContent>
                  <div className="space-y-4 pt-4">
                    <FormField
                      control={form.control}
                      name="filters2000h"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel>{t("forklift.filters")}</FormLabel>
                          <FormControl>
                            <Textarea {...field} className="resize-none h-20" />
                          </FormControl>
                          <FormMessage />
                        </FormItem>
                      )}
                    />

                    <FormField
                      control={form.control}
                      name="lubricants2000h"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel>{t("forklift.lubricants")}</FormLabel>
                          <FormControl>
                            <Textarea {...field} className="resize-none h-20" />
                          </FormControl>
                          <FormMessage />
                        </FormItem>
                      )}
                    />
                    <FormField
                      control={form.control}
                      name="documents2000h"
                      render={({ field: { onChange, value } }) => (
                        <FormItem>
                          <FormLabel>Documents & Images</FormLabel>
                          <FormControl>
                            <FileUpload
                              onChange={files => onChange(JSON.stringify(files))}
                              value={value ? JSON.parse(value) : []}
                              accept=".pdf,.doc,.docx,.xls,.xlsx,image/*"
                            />
                          </FormControl>
                          <FormMessage />
                        </FormItem>
                      )}
                    />
                  </div>
                </AccordionContent>
              </AccordionItem>
            </Accordion>

            {/* Other Fields */}
            <FormField
              control={form.control}
              name="serialNumber"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Serial Number</FormLabel>
                  <FormControl>
                    <Input {...field} />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />

            <div className="grid grid-cols-2 gap-4">
              <FormField
                control={form.control}
                name="lastServiceDate"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Last Service Date</FormLabel>
                    <FormControl>
                      <Input
                        type="date"
                        {...field}
                        value={field.value || ""}
                      />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />

              <FormField
                control={form.control}
                name="nextServiceDate"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Next Service Date</FormLabel>
                    <FormControl>
                      <Input
                        type="date"
                        {...field}
                        value={field.value || ""}
                      />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
            </div>

            <FormField
              control={form.control}
              name="serviceHours"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Service Hours</FormLabel>
                  <FormControl>
                    <Input
                      type="number"
                      {...field}
                      onChange={(e) => {
                        const value = e.target.value;
                        field.onChange(value === "" ? undefined : parseInt(value, 10));
                      }}
                      value={field.value ?? ""}
                    />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />

            <FormField
              control={form.control}
              name="engineSpecs"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Engine Specifications</FormLabel>
                  <FormControl>
                    <Textarea
                      {...field}
                      className="resize-none h-20"
                    />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />

            <div className="grid grid-cols-2 gap-4">
              <FormField
                control={form.control}
                name="transmission"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Transmission</FormLabel>
                    <FormControl>
                      <Input {...field} />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />

              <FormField
                control={form.control}
                name="tireSpecs"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Tire Specifications</FormLabel>
                    <FormControl>
                      <Input {...field} />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
            </div>

            <FormField
              control={form.control}
              name="serviceNotes"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Service Notes</FormLabel>
                  <FormControl>
                    <Textarea
                      {...field}
                      className="resize-none h-32"
                    />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />
          </div>
        </ScrollArea>

        <div className="pt-4 border-t">
          <Button type="submit" className="w-full">
            {initialData ? t("action.save") : t("action.add")}
          </Button>
        </div>
      </form>
    </Form>
  );
}