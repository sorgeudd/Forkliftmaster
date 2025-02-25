import { Card, CardHeader, CardTitle, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { useI18n } from "@/lib/i18n";
import { Forklift } from "@shared/schema";
import { differenceInDays } from "date-fns";

export function ServiceIntervalCard({ forklift }: { forklift: Forklift }) {
  const { t } = useI18n();
  const daysUntilService = forklift.nextServiceDate
    ? differenceInDays(new Date(forklift.nextServiceDate), new Date())
    : null;

  const getServiceStatus = () => {
    if (!daysUntilService) return "secondary";
    if (daysUntilService < 0) return "destructive";
    if (daysUntilService < 7) return "secondary";
    return "default";
  };

  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex justify-between items-center">
          {forklift.brand} - {forklift.modelType}
          {daysUntilService !== null && (
            <Badge variant={getServiceStatus()}>
              {daysUntilService < 0
                ? t("service.overdue")
                : `${daysUntilService} ${t("service.days_until")}`}
            </Badge>
          )}
        </CardTitle>
      </CardHeader>
      <CardContent>
        <div className="space-y-4">
          {(forklift.serviceHours || forklift.nextServiceDate) && (
            <div className="grid grid-cols-2 gap-4">
              {forklift.serviceHours !== null && (
                <div>
                  <h4 className="font-semibold">{t("forklift.service.hours")}</h4>
                  <p>{forklift.serviceHours}h</p>
                </div>
              )}
              {forklift.nextServiceDate && (
                <div>
                  <h4 className="font-semibold">{t("forklift.service.next")}</h4>
                  <p>{new Date(forklift.nextServiceDate).toLocaleDateString()}</p>
                </div>
              )}
            </div>
          )}

          {(forklift.engineSpecs || forklift.transmission || forklift.tireSpecs) && (
            <div className="space-y-2">
              {forklift.engineSpecs && (
                <>
                  <h4 className="font-semibold">{t("forklift.engine")}</h4>
                  <p className="text-sm">{forklift.engineSpecs}</p>
                </>
              )}

              {(forklift.transmission || forklift.tireSpecs) && (
                <div className="grid grid-cols-2 gap-4">
                  {forklift.transmission && (
                    <div>
                      <h4 className="font-semibold">{t("forklift.transmission")}</h4>
                      <p className="text-sm">{forklift.transmission}</p>
                    </div>
                  )}
                  {forklift.tireSpecs && (
                    <div>
                      <h4 className="font-semibold">{t("forklift.tires")}</h4>
                      <p className="text-sm">{forklift.tireSpecs}</p>
                    </div>
                  )}
                </div>
              )}
            </div>
          )}

          {(forklift.filters500h || forklift.lubricants500h ||
            forklift.filters1000h || forklift.lubricants1000h) && (
            <div className="grid grid-cols-2 gap-4">
              {(forklift.filters500h || forklift.lubricants500h) && (
                <div>
                  <h4 className="font-semibold">{t("service.500h")}</h4>
                  <div className="text-sm space-y-1">
                    {forklift.filters500h && <p>{forklift.filters500h}</p>}
                    {forklift.lubricants500h && <p>{forklift.lubricants500h}</p>}
                  </div>
                </div>
              )}
              {(forklift.filters1000h || forklift.lubricants1000h) && (
                <div>
                  <h4 className="font-semibold">{t("service.1000h")}</h4>
                  <div className="text-sm space-y-1">
                    {forklift.filters1000h && <p>{forklift.filters1000h}</p>}
                    {forklift.lubricants1000h && <p>{forklift.lubricants1000h}</p>}
                  </div>
                </div>
              )}
            </div>
          )}
        </div>
      </CardContent>
    </Card>
  );
}