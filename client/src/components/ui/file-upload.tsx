import { ChangeEvent, useState } from "react";
import { Input } from "./input";
import { Button } from "./button";
import { Paperclip, X } from "lucide-react";

export type FileUploadProps = {
  onChange: (files: string[]) => void;
  value?: string[];
  accept?: string;
  multiple?: boolean;
};

export function FileUpload({ onChange, value = [], accept, multiple = true }: FileUploadProps) {
    const handleFileChange = async (e: ChangeEvent<HTMLInputElement>) => {
      const files = Array.from(e.target.files || []);
      const filePromises = files.map(file => {
        return new Promise<string>((resolve) => {
          const reader = new FileReader();
          reader.onloadend = () => {
            resolve(reader.result as string);
          };
          reader.readAsDataURL(file);
        });
      });

      const fileUrls = await Promise.all(filePromises);
      const newValue = Array.isArray(value) ? [...value, ...fileUrls] : [...fileUrls];
      onChange(newValue);
    };

    const removeFile = (index: number) => {
      if (!Array.isArray(value)) return;
      const newFiles = value.filter((_, i) => i !== index);
      onChange(newFiles);
    };

    const displayValue = Array.isArray(value) ? value : [];

    return (
      <div className="space-y-2">
        <div className="flex items-center gap-2">
          <Input
            type="file"
            onChange={handleFileChange}
            accept={accept}
            multiple={multiple}
            className="hidden"
            id="file-upload"
          />
          <Button
            type="button"
            variant="outline"
            onClick={() => document.getElementById("file-upload")?.click()}
            className="w-full"
          >
            <Paperclip className="mr-2 h-4 w-4" />
            Upload Files
          </Button>
        </div>
        {displayValue.length > 0 && (
          <div className="grid gap-2">
            {displayValue.map((file, index) => (
              <div key={index} className="flex items-center justify-between p-2 border rounded">
                <div className="flex items-center gap-2 overflow-hidden">
                  {file.startsWith("data:image") ? (
                    <img src={file} alt="" className="h-8 w-8 object-cover rounded" />
                  ) : (
                    <Paperclip className="h-4 w-4" />
                  )}
                  <span className="truncate text-sm">
                    {file.startsWith("data:") 
                      ? `File ${index + 1}`
                      : file.split("/").pop()}
                  </span>
                </div>
                <Button
                  type="button"
                  variant="ghost"
                  size="icon"
                  onClick={() => removeFile(index)}
                >
                  <X className="h-4 w-4" />
                </Button>
              </div>
            ))}
          </div>
        )}
      </div>
    );
  }