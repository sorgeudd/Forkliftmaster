import React, { useState, useCallback } from "react";
import {
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogContent,
  Dialog,
  DialogTrigger
} from "@/components/ui/dialog";
import { Badge } from "@/components/ui/badge";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Button } from "@/components/ui/button";
import { Accordion, AccordionContent, AccordionItem, AccordionTrigger } from "@/components/ui/accordion";
import { Forklift, InsertForklift } from "@shared/schema";
import { differenceInDays, format } from "date-fns";
import { useI18n } from "@/lib/i18n";
import { Pencil, Printer, Download, Eye, ZoomIn, ZoomOut, X } from "lucide-react";
import { ForkliftForm } from "./forklift-form";
import { useToast } from "@/hooks/use-toast";
import { DynamicContent } from '@/components/dynamic-content';
import { useViewport } from '@/hooks/use-viewport';

type ServiceCardProps = {
  forklift: Forklift;
  onUpdate: (id: number, data: InsertForklift) => void;
};

export function ServiceCard({ forklift, onUpdate }: ServiceCardProps) {
  const { t } = useI18n();
  const { toast } = useToast();
  const [previewImage, setPreviewImage] = useState<string | null>(null);
  const [zoomLevel, setZoomLevel] = useState(1);
  const [touchStart, setTouchStart] = useState<{ x: number; y: number } | null>(null);
  const [touchMove, setTouchMove] = useState<{ x: number; y: number } | null>(null);
  const [pan, setPan] = useState({ x: 0, y: 0 });
  const [initialTouchDistance, setInitialTouchDistance] = useState<number | null>(null);

  const handlePrint = () => {
    const printStyles = `
      @media print {
        @page { margin: 20mm; }
        body * { visibility: hidden; }
        .print-section, .print-section * { visibility: visible; }
        .print-section { position: absolute; left: 0; top: 0; }
        .no-print { display: none; }
      }
    `;

    const styleSheet = document.createElement('style');
    styleSheet.textContent = printStyles;
    document.head.appendChild(styleSheet);

    const printContent = document.createElement('div');
    printContent.className = 'print-section';
    printContent.innerHTML = `
      <div style="font-family: system-ui, sans-serif; padding: 20px;">
        <h1 style="font-size: 24px; font-weight: bold; margin-bottom: 20px;">
          ${forklift.brand} - ${forklift.modelType}
        </h1>
        ${forklift.serialNumber ? `
          <p style="margin-bottom: 10px;">Serial Number: ${forklift.serialNumber}</p>
        ` : ''}

        <div style="margin-top: 20px;">
          <h2 style="font-size: 18px; font-weight: bold; margin-bottom: 10px;">Service Information</h2>
          ${forklift.lastServiceDate ? `
            <p>Last Service: ${format(new Date(forklift.lastServiceDate), 'PPP')}</p>
          ` : ''}
          ${forklift.nextServiceDate ? `
            <p>Next Service: ${format(new Date(forklift.nextServiceDate), 'PPP')}</p>
          ` : ''}
          ${forklift.serviceHours !== null ? `
            <p>Service Hours: ${forklift.serviceHours}h</p>
          ` : ''}
        </div>

        ${forklift.engineSpecs ? `
          <div style="margin-top: 20px;">
            <h2 style="font-size: 18px; font-weight: bold; margin-bottom: 10px;">Engine Specifications</h2>
            <p>${forklift.engineSpecs}</p>
          </div>
        ` : ''}

        ${forklift.serviceNotes ? `
          <div style="margin-top: 20px;">
            <h2 style="font-size: 18px; font-weight: bold; margin-bottom: 10px;">Service Notes</h2>
            <p>${forklift.serviceNotes}</p>
          </div>
        ` : ''}
      </div>
    `;

    document.body.appendChild(printContent);
    window.print();

    document.body.removeChild(printContent);
    document.head.removeChild(styleSheet);

    toast({
      title: "Print",
      description: "Document sent to printer",
    });
  };

  const handleDownload = useCallback(async (fileUrl: string, index: number) => {
    try {
      const [header, base64Data] = fileUrl.split(',');
      const match = header.match(/data:(.*?);/);
      if (!match) {
        toast({
          title: "Download failed",
          description: "Invalid file format",
          variant: "destructive",
        });
        return;
      }

      const contentType = match[1];
      const byteCharacters = atob(base64Data);
      const byteArrays = [];

      for (let offset = 0; offset < byteCharacters.length; offset += 512) {
        const slice = byteCharacters.slice(offset, offset + 512);
        const byteNumbers = new Array(slice.length);
        for (let i = 0; i < slice.length; i++) {
          byteNumbers[i] = slice.charCodeAt(i);
        }
        const byteArray = new Uint8Array(byteNumbers);
        byteArrays.push(byteArray);
      }

      const blob = new Blob(byteArrays, { type: contentType });
      const url = URL.createObjectURL(blob);

      if (/Mobi|Android/i.test(navigator.userAgent)) {
        window.open(url, '_blank');
        toast({
          title: "Success",
          description: "Image opened in new tab. Long press to save.",
        });
      } else {
        const link = document.createElement('a');
        link.href = url;
        const extension = contentType.includes('png') ? '.png' :
          contentType.includes('jpeg') ? '.jpg' :
            contentType.includes('gif') ? '.gif' : '.png';
        link.download = `forklift-image-${index + 1}${extension}`;
        document.body.appendChild(link);
        link.click();
        document.body.removeChild(link);
        toast({
          title: "Success",
          description: "Image downloaded successfully. Check your downloads folder.",
        });
      }

      setTimeout(() => URL.revokeObjectURL(url), 100);

    } catch (error) {
      console.error('Download failed:', error);
      toast({
        title: "Download failed",
        description: error instanceof Error ? error.message : "Unknown error occurred",
        variant: "destructive",
      });
    }
  }, [toast]);

  const daysUntilService = forklift.nextServiceDate
    ? differenceInDays(new Date(forklift.nextServiceDate), new Date())
    : null;

  const getServiceStatus = () => {
    if (!daysUntilService) return "secondary";
    if (daysUntilService < 0) return "destructive";
    if (daysUntilService < 7) return "secondary";
    return "default";
  };

  const formatDate = (date: string | null) => {
    if (!date) return null;
    try {
      return format(new Date(date), 'PPP');
    } catch (e) {
      console.warn('Invalid date:', e);
      return null;
    }
  };

  const handleZoomIn = () => {
    setZoomLevel(prev => Math.min(prev + 0.5, 3));
  };

  const handleZoomOut = () => {
    setZoomLevel(prev => Math.max(prev - 0.5, 0.5));
  };

  const handleTouchStart = (e: React.TouchEvent) => {
    if (e.touches.length === 2) {
      e.preventDefault();
      const touch1 = e.touches[0];
      const touch2 = e.touches[1];

      const distance = Math.hypot(
        touch2.clientX - touch1.clientX,
        touch2.clientY - touch1.clientY
      );
      setInitialTouchDistance(distance);

      const center = {
        x: (touch1.clientX + touch2.clientX) / 2,
        y: (touch1.clientY + touch2.clientY) / 2
      };
      setTouchStart(center);
    } else if (e.touches.length === 1 && zoomLevel > 1) {
      setTouchStart({
        x: e.touches[0].clientX - pan.x,
        y: e.touches[0].clientY - pan.y
      });
    }
  };

  const handleTouchMove = (e: React.TouchEvent) => {
    if (e.touches.length === 2 && touchStart && initialTouchDistance !== null) {
      e.preventDefault();
      const touch1 = e.touches[0];
      const touch2 = e.touches[1];

      const currentDistance = Math.hypot(
        touch2.clientX - touch1.clientX,
        touch2.clientY - touch1.clientY
      );

      const scale = currentDistance / initialTouchDistance;
      const newZoom = Math.max(0.5, Math.min(3, scale * zoomLevel));
      setZoomLevel(newZoom);

      const center = {
        x: (touch1.clientX + touch2.clientX) / 2,
        y: (touch1.clientY + touch2.clientY) / 2
      };
      setTouchMove(center);
    } else if (e.touches.length === 1 && touchStart && zoomLevel > 1) {
      const dx = e.touches[0].clientX - touchStart.x;
      const dy = e.touches[0].clientY - touchStart.y;
      setPan({ x: dx, y: dy });
    }
  };

  const handleTouchEnd = () => {
    setTouchStart(null);
    setTouchMove(null);
    setInitialTouchDistance(null);
  };

  return (
    <DynamicContent className="min-h-[100dvh] bg-background">
      <div className="sticky top-0 z-10 bg-background/95 backdrop-blur supports-[backdrop-filter]:bg-background/60">
        <div className="px-4 py-6 md:px-6 border-b">
          <div>
            <h2 className="text-2xl font-semibold tracking-tight">
              {forklift.brand} - {forklift.modelType}
            </h2>
            {forklift.serialNumber && (
              <p className="text-sm text-muted-foreground mb-4">
                SN: {forklift.serialNumber}
              </p>
            )}
            <div className="flex items-center gap-2">
              <Button
                variant="outline"
                size="sm"
                onClick={handlePrint}
                className="whitespace-nowrap"
              >
                <Printer className="h-4 w-4 mr-2" />
                Print Details
              </Button>
              <Dialog>
                <DialogTrigger asChild>
                  <Button variant="outline" size="sm" className="whitespace-nowrap">
                    <Pencil className="h-4 w-4 mr-2" />
                    Edit
                  </Button>
                </DialogTrigger>
                <DialogContent className="max-w-2xl">
                  <DialogHeader>
                    <DialogTitle>Edit Forklift</DialogTitle>
                    <DialogDescription>
                      Make changes to your forklift's information below.
                    </DialogDescription>
                  </DialogHeader>
                  <ForkliftForm
                    initialData={forklift}
                    onSubmit={(data) => onUpdate(forklift.id, data)}
                  />
                </DialogContent>
              </Dialog>
            </div>
          </div>
        </div>

        <div className="px-4 py-3 md:px-6 border-b bg-muted/40">
          <div className="flex justify-between items-center">
            <span className="text-sm font-medium">Service Status</span>
            {daysUntilService !== null && (
              <Badge variant={getServiceStatus()}>
                {daysUntilService < 0
                  ? t("service.overdue")
                  : `${daysUntilService} ${t("service.days_until")}`}
              </Badge>
            )}
          </div>
        </div>
      </div>

      <div className="px-4 py-6 md:px-6 space-y-8">
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          {forklift.lastServiceDate && (
            <div className="space-y-1">
              <h4 className="text-sm font-medium">Last Service</h4>
              <p className="text-sm text-muted-foreground">
                {formatDate(forklift.lastServiceDate)}
              </p>
            </div>
          )}
          {forklift.serviceHours !== null && (
            <div className="space-y-1">
              <h4 className="text-sm font-medium">Service Hours</h4>
              <p className="text-sm text-muted-foreground">
                {forklift.serviceHours}h
              </p>
            </div>
          )}
        </div>

        <Accordion type="single" collapsible className="w-full">
          { (forklift.filters500h || forklift.lubricants500h || forklift.documents500h) && (
            <AccordionItem value="500h">
              <AccordionTrigger>{t("service.500h")}</AccordionTrigger>
              <AccordionContent>
                <div className="space-y-4">
                  {forklift.filters500h && (
                    <div>
                      <h4 className="font-semibold text-sm">{t("forklift.filters")}</h4>
                      <p className="text-sm text-muted-foreground whitespace-pre-wrap">
                        {forklift.filters500h}
                      </p>
                    </div>
                  )}
                  {forklift.lubricants500h && (
                    <div>
                      <h4 className="font-semibold text-sm">{t("forklift.lubricants")}</h4>
                      <p className="text-sm text-muted-foreground whitespace-pre-wrap">
                        {forklift.lubricants500h}
                      </p>
                    </div>
                  )}
                  {forklift.documents500h && (
                    <div>
                      <h4 className="font-semibold text-sm">Documents & Images</h4>
                      <div className="grid gap-2 mt-2">
                        {(() => {
                          try {
                            const files = JSON.parse(forklift.documents500h || '[]');
                            return Array.isArray(files) ? files.map((file: string, index: number) => (
                              <div key={index} className="flex items-center justify-between p-2 border rounded">
                                <div className="flex items-center gap-2">
                                  {file.startsWith('data:image') ? (
                                    <>
                                      <img src={file} alt="" className="h-8 w-8 object-cover rounded cursor-pointer"
                                        onClick={() => setPreviewImage(file)} />
                                      <span className="text-sm">Image {index + 1}</span>
                                    </>
                                  ) : (
                                    <>
                                      <Printer className="h-4 w-4" />
                                      <span className="text-sm">Document {index + 1}</span>
                                    </>
                                  )}
                                </div>
                                <div className="flex gap-2">
                                  {file.startsWith('data:image') && (
                                    <Button
                                      variant="ghost"
                                      size="icon"
                                      onClick={() => setPreviewImage(file)}
                                    >
                                      <Eye className="h-4 w-4" />
                                    </Button>
                                  )}
                                  <Button
                                    variant="ghost"
                                    size="icon"
                                    onClick={() => handleDownload(file, index)}
                                  >
                                    <Download className="h-4 w-4" />
                                  </Button>
                                </div>
                              </div>
                            )) : null;
                          } catch (e) {
                            console.warn('Failed to parse documents500h:', e);
                            return null;
                          }
                        })()}
                      </div>
                    </div>
                  )}
                </div>
              </AccordionContent>
            </AccordionItem>
          )}
          {(forklift.filters1000h || forklift.lubricants1000h || forklift.documents1000h) && (
            <AccordionItem value="1000h">
              <AccordionTrigger>{t("service.1000h")}</AccordionTrigger>
              <AccordionContent>
                <div className="space-y-4">
                  {forklift.filters1000h && (
                    <div>
                      <h4 className="font-semibold text-sm">{t("forklift.filters")}</h4>
                      <p className="text-sm text-muted-foreground whitespace-pre-wrap">
                        {forklift.filters1000h}
                      </p>
                    </div>
                  )}
                  {forklift.lubricants1000h && (
                    <div>
                      <h4 className="font-semibold text-sm">{t("forklift.lubricants")}</h4>
                      <p className="text-sm text-muted-foreground whitespace-pre-wrap">
                        {forklift.lubricants1000h}
                      </p>
                    </div>
                  )}
                  {forklift.documents1000h && (
                    <div>
                      <h4 className="font-semibold text-sm">Documents & Images</h4>
                      <div className="grid gap-2 mt-2">
                        {(() => {
                          try {
                            const files = JSON.parse(forklift.documents1000h || '[]');
                            return Array.isArray(files) ? files.map((file: string, index: number) => (
                              <div key={index} className="flex items-center justify-between p-2 border rounded">
                                <div className="flex items-center gap-2">
                                  {file.startsWith('data:image') ? (
                                    <>
                                      <img src={file} alt="" className="h-8 w-8 object-cover rounded cursor-pointer"
                                        onClick={() => setPreviewImage(file)} />
                                      <span className="text-sm">Image {index + 1}</span>
                                    </>
                                  ) : (
                                    <>
                                      <Printer className="h-4 w-4" />
                                      <span className="text-sm">Document {index + 1}</span>
                                    </>
                                  )}
                                </div>
                                <div className="flex gap-2">
                                  {file.startsWith('data:image') && (
                                    <Button
                                      variant="ghost"
                                      size="icon"
                                      onClick={() => setPreviewImage(file)}
                                    >
                                      <Eye className="h-4 w-4" />
                                    </Button>
                                  )}
                                  <Button
                                    variant="ghost"
                                    size="icon"
                                    onClick={() => handleDownload(file, index)}
                                  >
                                    <Download className="h-4 w-4" />
                                  </Button>
                                </div>
                              </div>
                            )) : null;
                          } catch (e) {
                            console.warn('Failed to parse documents1000h:', e);
                            return null;
                          }
                        })()}
                      </div>
                    </div>
                  )}
                </div>
              </AccordionContent>
            </AccordionItem>
          )}
          {(forklift.filters1500h || forklift.lubricants1500h || forklift.documents1500h) && (
            <AccordionItem value="1500h">
              <AccordionTrigger>{t("service.1500h")}</AccordionTrigger>
              <AccordionContent>
                <div className="space-y-4">
                  {forklift.filters1500h && (
                    <div>
                      <h4 className="font-semibold text-sm">{t("forklift.filters")}</h4>
                      <p className="text-sm text-muted-foreground whitespace-pre-wrap">
                        {forklift.filters1500h}
                      </p>
                    </div>
                  )}
                  {forklift.lubricants1500h && (
                    <div>
                      <h4 className="font-semibold text-sm">{t("forklift.lubricants")}</h4>
                      <p className="text-sm text-muted-foreground whitespace-pre-wrap">
                        {forklift.lubricants1500h}
                      </p>
                    </div>
                  )}
                  {forklift.documents1500h && (
                    <div>
                      <h4 className="font-semibold text-sm">Documents & Images</h4>
                      <div className="grid gap-2 mt-2">
                        {(() => {
                          try {
                            const files = JSON.parse(forklift.documents1500h || '[]');
                            return Array.isArray(files) ? files.map((file: string, index: number) => (
                              <div key={index} className="flex items-center justify-between p-2 border rounded">
                                <div className="flex items-center gap-2">
                                  {file.startsWith('data:image') ? (
                                    <>
                                      <img src={file} alt="" className="h-8 w-8 object-cover rounded cursor-pointer"
                                        onClick={() => setPreviewImage(file)} />
                                      <span className="text-sm">Image {index + 1}</span>
                                    </>
                                  ) : (
                                    <>
                                      <Printer className="h-4 w-4" />
                                      <span className="text-sm">Document {index + 1}</span>
                                    </>
                                  )}
                                </div>
                                <div className="flex gap-2">
                                  {file.startsWith('data:image') && (
                                    <Button
                                      variant="ghost"
                                      size="icon"
                                      onClick={() => setPreviewImage(file)}
                                    >
                                      <Eye className="h-4 w-4" />
                                    </Button>
                                  )}
                                  <Button
                                    variant="ghost"
                                    size="icon"
                                    onClick={() => handleDownload(file, index)}
                                  >
                                    <Download className="h-4 w-4" />
                                  </Button>
                                </div>
                              </div>
                            )) : null;
                          } catch (e) {
                            console.warn('Failed to parse documents1500h:', e);
                            return null;
                          }
                        })()}
                      </div>
                    </div>
                  )}
                </div>
              </AccordionContent>
            </AccordionItem>
          )}
          {(forklift.filters2000h || forklift.lubricants2000h || forklift.documents2000h) && (
            <AccordionItem value="2000h">
              <AccordionTrigger>{t("service.2000h")}</AccordionTrigger>
              <AccordionContent>
                <div className="space-y-4">
                  {forklift.filters2000h && (
                    <div>
                      <h4 className="font-semibold text-sm">{t("forklift.filters")}</h4>
                      <p className="text-sm text-muted-foreground whitespace-pre-wrap">
                        {forklift.filters2000h}
                      </p>
                    </div>
                  )}
                  {forklift.lubricants2000h && (
                    <div>
                      <h4 className="font-semibold text-sm">{t("forklift.lubricants")}</h4>
                      <p className="text-sm text-muted-foreground whitespace-pre-wrap">
                        {forklift.lubricants2000h}
                      </p>
                    </div>
                  )}
                  {forklift.documents2000h && (
                    <div>
                      <h4 className="font-semibold text-sm">Documents & Images</h4>
                      <div className="grid gap-2 mt-2">
                        {(() => {
                          try {
                            const files = JSON.parse(forklift.documents2000h || '[]');
                            return Array.isArray(files) ? files.map((file: string, index: number) => (
                              <div key={index} className="flex items-center justify-between p-2 border rounded">
                                <div className="flex items-center gap-2">
                                  {file.startsWith('data:image') ? (
                                    <>
                                      <img src={file} alt="" className="h-8 w-8 object-cover rounded cursor-pointer"
                                        onClick={() => setPreviewImage(file)} />
                                      <span className="text-sm">Image {index + 1}</span>
                                    </>
                                  ) : (
                                    <>
                                      <Printer className="h-4 w-4" />
                                      <span className="text-sm">Document {index + 1}</span>
                                    </>
                                  )}
                                </div>
                                <div className="flex gap-2">
                                  {file.startsWith('data:image') && (
                                    <Button
                                      variant="ghost"
                                      size="icon"
                                      onClick={() => setPreviewImage(file)}
                                    >
                                      <Eye className="h-4 w-4" />
                                    </Button>
                                  )}
                                  <Button
                                    variant="ghost"
                                    size="icon"
                                    onClick={() => handleDownload(file, index)}
                                  >
                                    <Download className="h-4 w-4" />
                                  </Button>
                                </div>
                              </div>
                            )) : null;
                          } catch (e) {
                            console.warn('Failed to parse documents2000h:', e);
                            return null;
                          }
                        })()}
                      </div>
                    </div>
                  )}
                </div>
              </AccordionContent>
            </AccordionItem>
          )}
        </Accordion>

        {forklift.engineSpecs && (
          <div className="space-y-2">
            <h4 className="text-sm font-medium">Engine Specifications</h4>
            <p className="text-sm text-muted-foreground whitespace-pre-wrap">
              {forklift.engineSpecs}
            </p>
          </div>
        )}

        {(forklift.transmission || forklift.tireSpecs) && (
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            {forklift.transmission && (
              <div className="space-y-2">
                <h4 className="text-sm font-medium">Transmission</h4>
                <p className="text-sm text-muted-foreground">
                  {forklift.transmission}
                </p>
              </div>
            )}
            {forklift.tireSpecs && (
              <div className="space-y-2">
                <h4 className="text-sm font-medium">Tire Specifications</h4>
                <p className="text-sm text-muted-foreground">
                  {forklift.tireSpecs}
                </p>
              </div>
            )}
          </div>
        )}

        {forklift.serviceNotes && (
          <div className="space-y-2">
            <h4 className="text-sm font-medium">Service Notes</h4>
            <p className="text-sm text-muted-foreground whitespace-pre-wrap">
              {forklift.serviceNotes}
            </p>
          </div>
        )}
      </div>

      <Dialog
        open={!!previewImage}
        onOpenChange={() => {
          setPreviewImage(null);
          setZoomLevel(1);
          setPan({ x: 0, y: 0 });
        }}
      >
        <DialogContent className="max-w-4xl">
          <DialogHeader className="flex flex-row items-center justify-between">
            <div>
              <DialogTitle>Image Preview</DialogTitle>
              <DialogDescription>
                Use pinch gestures to zoom and drag to move around. Use the controls to adjust the view.
              </DialogDescription>
            </div>
            <Button
              variant="ghost"
              className="h-8 w-8 p-0"
              onClick={() => {
                setPreviewImage(null);
                setZoomLevel(1);
                setPan({ x: 0, y: 0 });
              }}
            >
              <X className="h-4 w-4" />
              <span className="sr-only">Close</span>
            </Button>
          </DialogHeader>

          <div className="relative">
            <div
              className="flex justify-center items-center min-h-[300px] overflow-hidden touch-none"
              onTouchStart={handleTouchStart}
              onTouchMove={handleTouchMove}
              onTouchEnd={handleTouchEnd}
            >
              {previewImage && (
                <img
                  src={previewImage}
                  alt="Preview"
                  className="transition-transform duration-200"
                  style={{
                    transform: `scale(${zoomLevel}) translate(${pan.x}px, ${pan.y}px)`,
                    cursor: zoomLevel > 1 ? 'move' : 'zoom-in'
                  }}
                />
              )}
            </div>

            <div className="absolute bottom-4 right-4 flex gap-2">
              <Button
                variant="secondary"
                size="sm"
                onClick={handleZoomOut}
                disabled={zoomLevel <= 0.5}
              >
                <ZoomOut className="h-4 w-4" />
              </Button>
              <Button
                variant="secondary"
                size="sm"
                onClick={handleZoomIn}
                disabled={zoomLevel >= 3}
              >
                <ZoomIn className="h-4 w-4" />
              </Button>
            </div>
          </div>
        </DialogContent>
      </Dialog>

    </DynamicContent>
  );
}