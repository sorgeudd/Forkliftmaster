import { Forklift, InsertForklift } from "@shared/schema";
import { ServiceCard } from "./service-card";
import { ChevronRight, ChevronDown, Printer, Trash2 } from "lucide-react";
import { useState } from "react";
import { Button } from "./ui/button";
import { useI18n } from "@/lib/i18n";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription } from "./ui/dialog";
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from "@/components/ui/alert-dialog";
import { useToast } from "@/hooks/use-toast";
import { ScrollArea } from "./ui/scroll-area";

type ForkliftsByCustomer = {
  [customer: string]: Forklift[];
};

type ForkliftTreeProps = {
  forklifts: Forklift[];
  onUpdate: (id: number, data: InsertForklift) => void;
  onDelete: (id: number) => void;
};

type PrintPreviewProps = {
  customer: string;
  forklifts: Forklift[];
};

function PrintPreview({ customer, forklifts }: PrintPreviewProps) {
  return (
    <div className="p-6 space-y-6">
      <div className="space-y-2">
        <h1 className="text-2xl font-bold">{customer} - Forklift List</h1>
        <p className="text-muted-foreground">
          Total Forklifts: {forklifts.length}
        </p>
      </div>
      <div className="divide-y border rounded-lg">
        {forklifts.map(forklift => (
          <div key={forklift.id} className="p-4">
            <h2 className="text-lg font-semibold">
              {forklift.brand} - {forklift.modelType}
            </h2>
            {forklift.serialNumber && (
              <p className="text-sm text-muted-foreground mt-1">
                Serial Number: {forklift.serialNumber}
              </p>
            )}
            {forklift.nextServiceDate && (
              <p className="text-sm text-muted-foreground mt-1">
                Next Service: {new Date(forklift.nextServiceDate).toLocaleDateString()}
              </p>
            )}
          </div>
        ))}
      </div>
    </div>
  );
}

export function ForkliftTree({ forklifts, onUpdate, onDelete }: ForkliftTreeProps) {
  const { t } = useI18n();
  const { toast } = useToast();
  const [expandedCustomers, setExpandedCustomers] = useState<Set<string>>(new Set());
  const [selectedForklift, setSelectedForklift] = useState<Forklift | null>(null);
  const [printPreview, setPrintPreview] = useState<{ customer: string; forklifts: Forklift[] } | null>(null);
  const [forkliftToDelete, setForkliftToDelete] = useState<Forklift | null>(null);

  // Group forklifts by customer
  const groupedForklifts = forklifts.reduce<ForkliftsByCustomer>((acc, forklift) => {
    const customer = forklift.customer;
    if (!acc[customer]) {
      acc[customer] = [];
    }
    acc[customer].push(forklift);
    return acc;
  }, {});

  const toggleCustomer = (customer: string) => {
    const newExpanded = new Set(expandedCustomers);
    if (newExpanded.has(customer)) {
      newExpanded.delete(customer);
    } else {
      newExpanded.add(customer);
    }
    setExpandedCustomers(newExpanded);
  };

  const handlePrint = (customer: string, customerForklifts: Forklift[]) => {
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
          ${customer} - Forklift List
        </h1>
        <p style="margin-bottom: 20px; color: #666;">
          Total Forklifts: ${customerForklifts.length}
        </p>
        ${customerForklifts.map(forklift => `
          <div style="padding: 15px 0; border-bottom: 1px solid #eee;">
            <h2 style="font-size: 18px; font-weight: bold; margin-bottom: 10px;">
              ${forklift.brand} - ${forklift.modelType}
            </h2>
            ${forklift.serialNumber ? `
              <p style="margin-bottom: 5px; color: #666;">
                Serial Number: ${forklift.serialNumber}
              </p>
            ` : ''}
            ${forklift.nextServiceDate ? `
              <p style="color: #666;">
                Next Service: ${new Date(forklift.nextServiceDate).toLocaleDateString()}
              </p>
            ` : ''}
          </div>
        `).join('')}
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

  const handleDeleteClick = (e: React.MouseEvent, forklift: Forklift) => {
    e.stopPropagation(); // Prevent opening the forklift details
    setForkliftToDelete(forklift);
  };

  const handleConfirmDelete = () => {
    if (forkliftToDelete) {
      onDelete(forkliftToDelete.id);
      setForkliftToDelete(null);
      toast({
        title: "Forklift deleted",
        description: "The forklift has been removed successfully",
      });
    }
  };

  return (
    <div className="space-y-6">
      {Object.entries(groupedForklifts).map(([customer, customerForklifts]) => (
        <div key={customer} className="border rounded-lg shadow-sm">
          <div className="p-4 bg-muted/50">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2">
                <Button
                  variant="ghost"
                  size="icon"
                  onClick={() => toggleCustomer(customer)}
                  className="no-print h-8 w-8"
                >
                  {expandedCustomers.has(customer) ? (
                    <ChevronDown className="h-4 w-4" />
                  ) : (
                    <ChevronRight className="h-4 w-4" />
                  )}
                </Button>
                <div>
                  <h2 className="font-semibold text-lg">{customer}</h2>
                  <p className="text-sm text-muted-foreground">
                    {customerForklifts.length} forklift{customerForklifts.length !== 1 ? 's' : ''}
                  </p>
                </div>
              </div>
              <Button
                variant="outline"
                size="sm"
                onClick={() => setPrintPreview({ customer, forklifts: customerForklifts })}
                className="no-print flex items-center gap-2"
              >
                <Printer className="h-4 w-4" />
                Print List
              </Button>
            </div>
          </div>

          <div className={`${expandedCustomers.has(customer) ? 'block' : 'hidden'}`}>
            <div className="divide-y">
              {customerForklifts.map((forklift) => (
                <div 
                  key={forklift.id}
                  className="p-4 hover:bg-accent cursor-pointer group"
                >
                  <div className="flex items-center justify-between">
                    <div 
                      className="flex-1"
                      onClick={() => setSelectedForklift(forklift)}
                    >
                      <div className="space-y-1">
                        <div className="flex flex-wrap items-center gap-2">
                          <span className="font-medium">
                            {forklift.brand} - {forklift.modelType}
                          </span>
                          {forklift.serialNumber && (
                            <span className="text-muted-foreground">
                              SN: {forklift.serialNumber}
                            </span>
                          )}
                        </div>
                        {forklift.nextServiceDate && (
                          <div className="text-sm text-muted-foreground">
                            Next Service: {new Date(forklift.nextServiceDate).toLocaleDateString()}
                          </div>
                        )}
                      </div>
                    </div>
                    <Button
                      variant="ghost"
                      size="icon"
                      className="opacity-0 group-hover:opacity-100 transition-opacity"
                      onClick={(e) => handleDeleteClick(e, forklift)}
                    >
                      <Trash2 className="h-4 w-4 text-destructive" />
                    </Button>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>
      ))}

      {/* Print Preview Dialog */}
      <Dialog
        open={!!printPreview}
        onOpenChange={(open) => !open && setPrintPreview(null)}
      >
        <DialogContent className="max-w-4xl">
          <DialogHeader>
            <DialogTitle>Print Preview</DialogTitle>
            <DialogDescription>
              Preview how the document will look when printed
            </DialogDescription>
          </DialogHeader>
          <ScrollArea className="max-h-[80vh]">
            {printPreview && (
              <PrintPreview
                customer={printPreview.customer}
                forklifts={printPreview.forklifts}
              />
            )}
          </ScrollArea>
          <div className="flex justify-end gap-2">
            <Button
              variant="outline"
              onClick={() => setPrintPreview(null)}
            >
              Cancel
            </Button>
            <Button
              onClick={() => {
                if (printPreview) {
                  handlePrint(printPreview.customer, printPreview.forklifts);
                  setPrintPreview(null);
                }
              }}
            >
              Print
            </Button>
          </div>
        </DialogContent>
      </Dialog>

      {/* Delete Confirmation Dialog */}
      <AlertDialog
        open={!!forkliftToDelete}
        onOpenChange={(open) => !open && setForkliftToDelete(null)}
      >
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Are you absolutely sure?</AlertDialogTitle>
            <AlertDialogDescription>
              This action cannot be undone. This will permanently delete the forklift
              {forkliftToDelete && ` ${forkliftToDelete.brand} - ${forkliftToDelete.modelType}`} and remove it from our servers.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancel</AlertDialogCancel>
            <AlertDialogAction
              onClick={handleConfirmDelete}
              className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
            >
              Delete
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>

      {/* Forklift Details Dialog */}
      <Dialog 
        open={!!selectedForklift} 
        onOpenChange={(open) => !open && setSelectedForklift(null)}
      >
        <DialogContent className="max-w-[90vw] w-[1200px] p-6">
          {selectedForklift && (
            <ServiceCard 
              forklift={selectedForklift} 
              onUpdate={onUpdate}
            />
          )}
        </DialogContent>
      </Dialog>
    </div>
  );
}